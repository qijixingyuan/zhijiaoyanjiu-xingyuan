// 政策爬虫 v4 — 正文提取 + 频控 + 源码预检
// 运行: npx tsx scripts/crawl-policies-real.ts

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const prisma = new PrismaClient();

// === 频控延迟（降低反爬拦截）===
function randomDelay(min = 800, max = 3000): Promise<void> {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

// === 正文提取（使用 Mozilla Readability）===
async function extractContent(html: string, url: string): Promise<string | null> {
  try {
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    if (article?.textContent) {
      return article.textContent.substring(0, 500).replace(/\s+/g, " ").trim();
    }
    // Fallback: plain text from body
    const body = doc.window.document.body;
    if (body) {
      const text = body.textContent || "";
      return text.replace(/\s+/g, " ").trim().substring(0, 500);
    }
    return null;
  } catch {
    return null;
  }
}

// === 12 类分类体系 ===
const TYPE_KEYWORDS: Record<string, string[]> = {
  "A-治理体系": ["现代职教", "类型定位", "管理体制", "标准体系", "治理", "制度建设"],
  "B-产教融合": ["产教融合", "校企合作", "职教集团", "产业学院", "混合所有制"],
  "C-人才培养": ["学徒制", "工学结合", "1+X", "订单培养", "现场工程师", "人才培养"],
  "D-专业建设": ["专业目录", "专业群", "课程标准", "教学资源库", "专业建设"],
  "E-师资队伍": ["双师型", "教师企业", "教学创新团队", "兼职教师", "师资"],
  "F-质量评价": ["教学诊改", "质量年报", "办学条件达标", "专业认证", "评估", "督导"],
  "G-招生就业": ["单独招生", "分类考试", "专升本", "就业促进", "创新创业", "招生"],
  "H-经费投入": ["生均拨款", "专项经费", "奖补", "经费", "财政", "投入"],
  "I-数字化": ["智慧校园", "虚拟仿真", "数字教学", "信息化", "数字化"],
  "J-国际化": ["职教出海", "中外合作", "鲁班工坊", "一带一路", "国际化"],
  "K-乡村振兴": ["对口帮扶", "东西协作", "乡村振兴", "县域职教", "民族地区"],
  "L-职业本科": ["职业本科", "职业技术大学", "中高本贯通", "职教高考", "本科层次"],
};

function classifyPolicy(title: string, summary: string): string {
  const text = title + (summary || "");
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return type;
  }
  return "A-治理体系";
}

// 关键词过滤 — 保留职教相关政策
const MUST_MATCH = /职业|高职|专科|中职|技能|双高|产教融合|校企合作|学徒制|1\+X|实训|双师型|职教|技术技能|职业院校|中高职|职教高考|现场工程师|职业技能/;
const EXCLUDE = /中小学|幼儿园|义务教育|研究生|留学生|学前教育|普通高中|高考|中考/;

function isVocationalPolicy(title: string): boolean {
  return MUST_MATCH.test(title) && !EXCLUDE.test(title);
}

// 从 URL 路径中提取日期
function extractDateFromUrl(url: string): Date | null {
  // Pattern: /202606/t20260626_xxx.shtml (湖北: YYYYMM/tYYYYMMDD_)
  let m = url.match(/\/t(\d{4})(\d{2})(\d{2})_/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Pattern: /202606/t20260626_xxx.shtml (backward compat: 8-digit then /)
  m = url.match(/\/(\d{4})(\d{2})(\d{2})\//);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Pattern: /2026/06-23/xxx.html (河南: YYYY/MM-DD/)
  m = url.match(/\/(\d{4})\/(\d{2})-(\d{2})\//);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Pattern: /2026/06/26/
  m = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Pattern: /art/2026/6/26/
  m = url.match(/\/art\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

// === 爬取源配置 (URLs 已在 2026-06-26 验证) ===
interface CrawlSource {
  name: string;
  province: string;
  url: string;
  waitFor?: string;
  waitUntil?: "networkidle" | "domcontentloaded" | "load";
  /** 翻页配置 — 不配则只爬首页 */
  paginate?: {
    /** index_N: index_2.html…index_N.html; pageNum: ?pageNum=2…N */
    type: "index_N" | "pageNum";
    /** 最多翻到第几页 */
    maxPages: number;
  };
}

const SOURCES: CrawlSource[] = [
  // ── 国家级 ──
  {
    name: "教育部-职成司", province: "全国",
    url: "https://www.moe.gov.cn/s78/A07/",
    waitFor: "a[href*='/s78/A07/']",
  },
  // ── 省级教育厅 (已验证) ──
  {
    name: "湖南省教育厅", province: "湖南省",
    url: "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/",
    waitFor: "a[href*='/tzgg/']",
    paginate: { type: "index_N", maxPages: 10 },
  },
  {
    name: "广东省教育厅", province: "广东省",
    url: "https://edu.gd.gov.cn/zwgknew/jyzcfg/",
    waitFor: "ul li a, .list-content li a",
    paginate: { type: "index_N", maxPages: 10 },
  },
  {
    name: "江苏省教育厅", province: "江苏省",
    url: "https://jyt.jiangsu.gov.cn/col/col58320/index.html",
    waitFor: "a[href*='/art/']",
    paginate: { type: "pageNum", maxPages: 8 },
  },
  {
    name: "浙江省教育厅", province: "浙江省",
    url: "https://jyt.zj.gov.cn/col/col1532983/index.html",
    waitFor: "a[href*='/art/']",
  },
  // ── 扩展省份（用户提供 URL，2026-06-26 验证）──
  {
    name: "山东省教育厅", province: "山东省",
    url: "http://edu.shandong.gov.cn/col/col11990/index.html",
    waitFor: "a[href*='/art/']",
    waitUntil: "domcontentloaded",
    paginate: { type: "pageNum", maxPages: 8 },
  },
  // 四川: JS 动态加载表格数据，需拦截 XHR API 才能抓取，暂跳过
  // {
  //   name: "四川省教育厅", province: "四川省",
  //   url: "https://edu.sc.gov.cn/scedu/zcwjk/newzfwj.shtml",
  //   waitFor: "a[href]",
  // },
  {
    name: "河南省教育厅", province: "河南省",
    url: "https://jyt.henan.gov.cn/xxgk/wjtz/",
    waitFor: "a[href]",
  },
  {
    name: "河北省教育厅", province: "河北省",
    url: "http://www.hee.gov.cn/col/1410097726928/index.html",
    waitFor: "a[href*='/col/']",
  },
  {
    name: "福建省教育厅", province: "福建省",
    url: "https://jyt.fujian.gov.cn/xxgk/zywj/",
    waitFor: "a[href*='/xxgk/']",
  },
  {
    name: "湖北省教育厅", province: "湖北省",
    url: "https://jyt.hubei.gov.cn/zfxxgk/zc_GK2020/gfxwj_GK2020/ztfl/zyjy/",
    waitFor: "a[href*='/zfxxgk/']",
  },
  // ── 新扩展省份（2026-06-29 验证）──
  { name: "北京市教育委员会", province: "北京市", url: "https://jw.beijing.gov.cn/tzgg/", waitFor: "a[href]", },
  { name: "天津市教育委员会", province: "天津市", url: "https://jy.tj.gov.cn/ZWGK_52172/TZGG/", waitFor: "a[href]", },
  { name: "海南省教育厅", province: "海南省", url: "https://edu.hainan.gov.cn/xxgk/tzgg/", waitFor: "a[href]", },
  { name: "贵州省教育厅", province: "贵州省", url: "https://jyt.guizhou.gov.cn/zwgk/tzgg/", waitFor: "a[href]", },
  { name: "云南省教育厅", province: "云南省", url: "https://jyt.yn.gov.cn/web/zwgk/tzgg/", waitFor: "a[href]", },
  { name: "安徽省教育厅", province: "安徽省", url: "https://jyt.ah.gov.cn/xwzx/tzgg/", waitFor: "a[href]", },
  { name: "内蒙古自治区教育厅", province: "内蒙古自治区", url: "https://jyt.nmg.gov.cn/zwgk/tzgg_25132/", waitFor: "a[href]", },
  { name: "上海市教育委员会", province: "上海市", url: "https://edu.sh.gov.cn/xxgk2_zdgz/", waitFor: "a[href]", },
  { name: "重庆市教育委员会", province: "重庆市", url: "https://jw.cq.gov.cn/zwgk/zfxxgkml/zcwj/", waitFor: "a[href]", },
];

/** 从第 1 页提取翻页链接 */
async function discoverPageUrls(page: any, source: CrawlSource): Promise<string[]> {
  if (!source.paginate) return [source.url];

  const urls: string[] = [source.url];
  try {
    const found = await page.evaluate((maxPages: number) => {
      const pageUrls: string[] = [];
      const as = document.querySelectorAll("a[href]");
      for (const el of as) {
        const a = el as HTMLAnchorElement;
        const href = a.href || "";
        const text = a.textContent?.trim() || "";

        // index_N.html pattern (湖南、广东)
        const m1 = href.match(/index[_-](\d+)\.(html|htm|shtml)/i);
        if (m1) {
          const n = +m1[1];
          if (n >= 2 && n <= maxPages) {
            // Store with page number for sorting
            if (!pageUrls.includes(href)) pageUrls.push(href);
          }
        }

        // pageNum=N pattern (江苏、山东)
        const m2 = href.match(/[?&]pageNum=(\d+)/i);
        if (m2) {
          const n = +m2[1];
          if (n >= 2 && n <= maxPages) {
            if (!pageUrls.includes(href)) pageUrls.push(href);
          }
        }

        // "下一页" link as fallback
        if (/^(下一页|下页)$/.test(text) && !pageUrls.includes(href)) {
          pageUrls.push(href);
        }
      }
      return pageUrls;
    }, source.paginate.maxPages);

    for (const u of found) {
      if (!urls.includes(u)) urls.push(u);
    }
  } catch {}
  return urls;
}

async function crawlSource(browser: any, source: CrawlSource): Promise<{
  title: string; url: string; date: string;
}[]> {
  const page = await browser.newPage();
  const allLinks: { title: string; url: string; date: string }[] = [];
  const seenUrls = new Set<string>();

  // Load page 1
  console.log(`  访问 ${source.url.substring(0, 60)}...`);
  try {
    await page.goto(source.url, {
      waitUntil: source.waitUntil || "networkidle",
      timeout: source.waitUntil === "domcontentloaded" ? 60000 : 30000,
    });
  } catch (e: any) {
    console.log(`  ⚠ ${source.name}: ${e.message?.substring(0, 60)}`);
    await page.close();
    return [];
  }

  if (source.waitFor) {
    try { await page.waitForSelector(source.waitFor, { timeout: 8000 }); } catch {}
  }
  await page.waitForTimeout(2000);

  // Discover pagination links from page 1
  const pageUrls = await discoverPageUrls(page, source);
  if (pageUrls.length > 1) {
    console.log(`  发现 ${pageUrls.length} 页可爬取`);
  }

  // Crawl each page
  for (let i = 0; i < pageUrls.length; i++) {
    const pageUrl = pageUrls[i];
    const isFirstPage = i === 0;

    if (!isFirstPage) {
      await randomDelay(1000, 3000); // 频控：翻页间隔
      console.log(`  翻页 ${i+1}/${pageUrls.length}...`);
      try {
        await page.goto(pageUrl, {
          waitUntil: source.waitUntil || "networkidle",
          timeout: source.waitUntil === "domcontentloaded" ? 60000 : 30000,
        });
        await page.waitForTimeout(2000);
      } catch {
        console.log(`  第${i+1}页加载失败，跳过`);
        continue;
      }
    }

    // Generic extraction
    const extracted = await page.evaluate(() => {
      const results: { text: string; href: string; date: string }[] = [];
      const seen = new Set<string>();
      document.querySelectorAll("a[href]").forEach((el) => {
        const a = el as HTMLAnchorElement;
        const text = a.textContent?.trim() || "";
        const href = a.href || "";
        if (text.length < 10 || text.length > 300) return;
        if (/^(首页|下一页|上一页|更多|图片|视频|English|返回|首页$)/.test(text)) return;
        if (/javascript|mailto:|tel:/.test(href)) return;
        const isContent =
          href.endsWith(".html") || href.endsWith(".htm") ||
          href.endsWith(".shtml") ||
          href.includes("/art/") || href.includes("/content/") ||
          href.includes("/tzgg/") || href.includes("/A07_") ||
          href.includes("/xxgk/") || href.includes("/zfxxgk/");
        if (!isContent) return;
        if (seen.has(href)) return;
        seen.add(href);
        let date = "";
        const li = el.closest("li");
        const container = li || el.parentElement;
        if (container) {
          const dateEl = container.querySelector("span, em, i, time, .date, .time, [class*='date'], [class*='time']");
          if (dateEl) date = dateEl.textContent?.trim() || "";
        }
        results.push({ text, href, date });
      });
      return results;
    });

    let pageCount = 0;
    for (const link of extracted.slice(0, 35)) {
      if (seenUrls.has(link.href)) continue;
      seenUrls.add(link.href);
      if (isVocationalPolicy(link.text)) {
        allLinks.push(link);
        pageCount++;
      }
    }
    if (pageCount === 0 && !isFirstPage) break;
  }

  await page.close();
  return allLinks;
}

async function main() {
  console.log("🚀 政策爬虫 v4 (正文提取 + 频控 + 12源)\n");
  const browser = await chromium.launch({ headless: true });
  let totalNew = 0;
  let totalSkipped = 0;
  let totalSummary = 0;

  for (const source of SOURCES) {
    // 频控：源间随机延迟
    await randomDelay(500, 1500);
    console.log(`\n📂 ${source.name} (${source.province})`);
    const items = await crawlSource(browser, source);
    console.log(`  筛选出 ${items.length} 条职教政策`);

    for (const item of items) {
      // 去重 by URL
      const exists = await prisma.policy.findFirst({ where: { url: item.href } });
      if (exists) { totalSkipped++; continue; }

      // 解析日期 — 优先 HTML 中提取的 date text，其次 URL 中的日期
      let publishDate = new Date();
      let dateFound = false;

      if (item.date) {
        let m = item.date.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (!m) m = item.date.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        if (!m) m = item.date.match(/^(\d{1,2})-(\d{1,2})$/);
        if (m) {
          const year = m[1].length === 4 ? +m[1] : new Date().getFullYear();
          const month = m[1].length === 4 ? +m[2] : +m[1];
          const day = m[1].length === 4 ? +m[3] : +m[2];
          publishDate = new Date(year, month - 1, day);
          dateFound = true;
        }
      }

      if (!dateFound) {
        const urlDate = extractDateFromUrl(item.href);
        if (urlDate) { publishDate = urlDate; dateFound = true; }
      }

      // ── Date range filter: 2025-01-01 through today ──
      const MIN_DATE = new Date(2025, 0, 1);
      const TODAY = new Date();
      if (publishDate < MIN_DATE || publishDate > TODAY) {
        const dateStr = publishDate.toISOString().split("T")[0];
        console.log(`  ⏭ 跳过(日期范围外 ${dateStr}): ${item.text.substring(0, 40)}...`);
        continue;
      }

      // ── 正文提取（访问政策详情页，提取摘要）──
      let summary = "";
      try {
        await randomDelay(500, 1500);
        const detailPage = await browser.newPage();
        await detailPage.goto(item.href, { waitUntil: "domcontentloaded", timeout: 15000 });
        await detailPage.waitForTimeout(1000);
        const html = await detailPage.content();
        const extracted = await extractContent(html, item.href);
        if (extracted) {
          summary = extracted;
          totalSummary++;
          if (totalSummary <= 3) console.log(`  📝 摘要: ${extracted.substring(0, 60)}...`);
        }
        await detailPage.close();
      } catch {}

      const type = classifyPolicy(item.text, summary);

      try {
        await prisma.policy.create({
          data: {
            title: item.text,
            province: source.province,
            publishDate,
            type,
            summary: summary || null,
            department: source.name,
            url: item.href,
            sourceOrg: source.name,
          },
        });
        totalNew++;
      } catch (e) {
        console.log(`  ⚠ 插入失败: ${item.text.substring(0, 30)}...`);
      }
    }
  }

  await browser.close();
  console.log(`\n✅ 新增: ${totalNew}, 跳过(重复): ${totalSkipped}, 摘要: ${totalSummary}`);
  const total = await prisma.policy.count();
  console.log(`总政策数: ${total}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
