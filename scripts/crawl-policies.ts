// 政策爬虫 — 教育部 + 各省教育厅
// Phase 1: 教育部官网 (moe.gov.cn)
// Phase 2: 各省教育厅 (待扩展)
// 运行: npx tsx scripts/crawl-policies.ts

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();

const SOURCES = [
  {
    name: "教育部",
    province: null, // 中央政策，不限省份
    // 教育部职业教育相关政策列表
    urls: [
      "https://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/", // 职业教育政策法规
      "https://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcjd/", // 职业教育政策解读
    ],
  },
  // 重点省份教育厅
  {
    name: "湖南省教育厅",
    province: "湖南省",
    urls: [
      "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/",
    ],
  },
  {
    name: "广东省教育厅",
    province: "广东省",
    urls: [
      "https://edu.gd.gov.cn/gkmlpt/content/",
    ],
  },
  {
    name: "江苏省教育厅",
    province: "江苏省",
    urls: [
      "https://jyt.jiangsu.gov.cn/col/col57890/",
    ],
  },
];

interface CrawledPolicy {
  title: string;
  url: string;
  publishDate: string;
  department: string;
  province: string | null;
  type: string;
  summary: string;
  docNumber: string;
}

function classifyType(title: string): string {
  const t = title.toLowerCase();
  if (/规划|计划|行动|方案|发展|十四五|十五五/.test(t)) return "发展规划";
  if (/经费|拨款|财政|资金|补助|奖补|收费/.test(t)) return "经费保障";
  if (/专业|课程|教学标准|专业目录|人才培养/.test(t)) return "专业设置";
  if (/评估|质量|督导|检查|考核|年报|达标/.test(t)) return "质量评估";
  if (/招生|考试|录取|就业|创业/.test(t)) return "招生就业";
  if (/援助|帮扶|对口|支援|合作/.test(t)) return "对口援助";
  return "发展规划";
}

function extractDocNumber(text: string): string {
  const m = text.match(/[〔\[]?\d{4}[〕\]]?\s*\d+\s*号/);
  return m ? m[0] : "";
}

async function crawlPage(browser: any, url: string, source: typeof SOURCES[0]): Promise<CrawledPolicy[]> {
  const page = await browser.newPage();
  const results: CrawledPolicy[] = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for content to load (try different selectors)
    try {
      await page.waitForSelector("a[href]", { timeout: 5000 });
    } catch {
      // Page might have loaded anyway
    }

    // Extract links that look like policy documents
    const links = await page.evaluate(() => {
      const items: { title: string; href: string }[] = [];
      const anchors = document.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        const title = (a.textContent || "").trim();
        const href = a.getAttribute("href") || "";
        // Filter for policy-like links
        if (
          title.length > 10 &&
          /职业|院校|高职|教育|教学|招生|专业|教师|学生|经费|评估|培训/.test(title) &&
          !/首页|下一页|上一页|更多|图片|视频/.test(title)
        ) {
          items.push({ title, href });
        }
      });
      return items;
    });

    for (const link of links.slice(0, 10)) {
      // Resolve relative URLs
      const fullUrl = link.href.startsWith("http")
        ? link.href
        : new URL(link.href, url).href;

      // Try to get publish date from the page context
      results.push({
        title: link.title,
        url: fullUrl,
        publishDate: "",
        department: source.name,
        province: source.province,
        type: classifyType(link.title),
        summary: "",
        docNumber: extractDocNumber(link.title),
      });
    }
  } catch (e) {
    console.error(`  爬取失败: ${url}`, (e as Error).message);
  } finally {
    await page.close();
  }

  return results;
}

async function main() {
  console.log("启动政策爬虫 (Playwright)...\n");

  const browser = await chromium.launch({ headless: true });
  const allPolicies: CrawledPolicy[] = [];

  for (const source of SOURCES) {
    console.log(`\n📂 ${source.name}`);
    for (const url of source.urls) {
      console.log(`  🔗 ${url.substring(0, 80)}...`);
      const policies = await crawlPage(browser, url, source);
      console.log(`     → 发现 ${policies.length} 条潜在政策`);
      allPolicies.push(...policies);
    }
  }

  await browser.close();

  console.log(`\n\n总计发现: ${allPolicies.length} 条政策`);

  // Import into database (deduplicate by URL)
  let imported = 0;
  let skipped = 0;

  for (const policy of allPolicies) {
    const existing = await prisma.policy.findFirst({
      where: { url: policy.url },
    });

    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.policy.create({
        data: {
          title: policy.title,
          province: policy.province || "全国",
          publishDate: policy.publishDate ? new Date(policy.publishDate) : new Date(),
          type: policy.type,
          department: policy.department,
          summary: policy.summary || null,
          docNumber: policy.docNumber || null,
          url: policy.url,
          sourceOrg: policy.department,
        },
      });
      imported++;
    } catch (e) {
      console.error(`  导入失败: ${policy.title}`);
    }
  }

  console.log(`\n导入: ${imported} 条新增, ${skipped} 条已存在`);
  console.log(`总政策数: ${await prisma.policy.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
