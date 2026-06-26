// 政策爬虫 v2 — Playwright 抓取省级教育厅真实政策
// 运行: npx tsx scripts/crawl-policies-real.ts

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();

// === 12 类分类体系 (from 架构设计-v3.0 Phase D) ===
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
  return "A-治理体系"; // default
}

// 关键词过滤: 只保留职教相关政策
const MUST_MATCH = /职业|高职|专科|中职|技能|双高|产教融合|校企合作|学徒制|1\+X|实训|双师型|职教|技术技能/;
const EXCLUDE = /中小学|幼儿园|义务教育|研究生|留学生/;

function isVocationalPolicy(title: string): boolean {
  return MUST_MATCH.test(title) && !EXCLUDE.test(title);
}

// === 爬取源配置 ===
const SOURCES = [
  // 教育部 — SPA, 需 waitForSelector 等 Vue 渲染
  {
    name: "教育部", province: "全国",
    url: "https://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/",
    waitFor: ".moe_list li a, .zcfg_list li a, ul li a",
    selectors: { list: "ul li", title: "a", date: "span", link: "a" },
  },
  // 湖南省教育厅 — document.write, 需 networkidle
  {
    name: "湖南省教育厅", province: "湖南省",
    url: "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/",
    waitFor: "ul li a",
    selectors: { list: "ul li", title: "a", date: "span", link: "a" },
  },
  // 广东省教育厅 — 换为政策法规栏目 (from 公示公告 gsgg)
  {
    name: "广东省教育厅", province: "广东省",
    url: "https://edu.gd.gov.cn/zwgknew/jyzcfg/",
    waitFor: "ul li a, .list-content li a",
    selectors: { list: "ul li, .list-content li", title: "a", date: "span.date", link: "a" },
  },
];

async function crawlSource(browser: any, source: typeof SOURCES[0]): Promise<{
  title: string; url: string; date: string;
}[]> {
  const page = await browser.newPage();
  const results: { title: string; url: string; date: string }[] = [];

  try {
    console.log(`  访问 ${source.url.substring(0, 60)}...`);
    await page.goto(source.url, {
      waitUntil: "networkidle",  // 等所有 JS 执行完 (解决 SPA + document.write)
      timeout: 20000,
    });

    // Wait for specific content to render
    if (source.waitFor) {
      try {
        await page.waitForSelector(source.waitFor, { timeout: 8000 });
      } catch {
        console.log(`  ⚠ 选择器 ${source.waitFor} 未出现，尝试通用提取`);
      }
    }

    // Extract list items
    const items = await page.evaluate((sel: typeof source.selectors) => {
      const results: { title: string; url: string; date: string }[] = [];

      // Strategy 1: Use configured selectors
      const listItems = document.querySelectorAll(sel.list);
      if (listItems.length > 0) {
        listItems.forEach((item) => {
          const link = item.querySelector(sel.link) as HTMLAnchorElement | null;
          const dateEl = item.querySelector(sel.date);
          if (link?.textContent) {
            results.push({
              title: link.textContent.trim(),
              url: link.href,
              date: dateEl?.textContent?.trim() || "",
            });
          }
        });
        return results;
      }

      // Strategy 2: Generic — find all links that look like policy docs
      const allLinks = document.querySelectorAll("a[href]");
      allLinks.forEach((a) => {
        const text = a.textContent?.trim() || "";
        const href = a.getAttribute("href") || "";
        if (
          text.length > 10 &&
          /职业|高职|院校|教育|教学|招生|专业|教师|学生|经费|评估/.test(text) &&
          !/首页|下一页|更多|图片|视频|English/.test(text) &&
          (href.endsWith(".html") || href.endsWith(".htm") || href.includes("/content/"))
        ) {
          results.push({ title: text, url: href, date: "" });
        }
      });
      return results;
    }, source.selectors);

    // Resolve relative URLs and take first 15
    const baseUrl = source.url;
    for (const item of items.slice(0, 15)) {
      try {
        const fullUrl = item.url.startsWith("http") ? item.url : new URL(item.url, baseUrl).href;
        if (isVocationalPolicy(item.title)) {
          results.push({ ...item, url: fullUrl });
        }
      } catch {}
    }
  } catch (e) {
    console.log(`  ⚠ ${source.name}: ${(e as Error).message?.substring(0, 60)}`);
  } finally {
    await page.close();
  }

  return results;
}

async function main() {
  console.log("启动政策爬虫 (Playwright)...\n");
  const browser = await chromium.launch({ headless: true });
  let totalNew = 0;
  let totalSkipped = 0;

  for (const source of SOURCES) {
    console.log(`\n📂 ${source.name} (${source.province})`);
    const items = await crawlSource(browser, source);
    console.log(`  发现 ${items.length} 条潜在政策`);

    for (const item of items) {
      // 去重 by URL
      const exists = await prisma.policy.findFirst({ where: { url: item.url } });
      if (exists) { totalSkipped++; continue; }

      // 解析日期 — 支持多种格式: 2026-06-26, 2026年6月26日, 2026/06/26, 06-26
      let publishDate = new Date();
      if (item.date) {
        // Try: 2026-06-26 or 2026/06/26
        let m = item.date.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        // Try: 2026年6月26日
        if (!m) m = item.date.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        // Try: 06-26 (month-day only, assume current year)
        if (!m) m = item.date.match(/^(\d{1,2})-(\d{1,2})$/);
        if (m) {
          const year = m[1].length === 4 ? +m[1] : new Date().getFullYear();
          const month = m[1].length === 4 ? +m[2] : +m[1];
          const day = m[1].length === 4 ? +m[3] : +m[2];
          publishDate = new Date(year, month - 1, day);
        }
      }

      const type = classifyPolicy(item.title, "");

      await prisma.policy.create({
        data: {
          title: item.title,
          province: source.province,
          publishDate,
          type,
          department: source.name,
          url: item.url,
          sourceOrg: source.name,
        },
      });
      totalNew++;
    }
  }

  await browser.close();
  console.log(`\n✅ 新增: ${totalNew}, 跳过(重复): ${totalSkipped}`);
  console.log(`总政策数: ${await prisma.policy.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
