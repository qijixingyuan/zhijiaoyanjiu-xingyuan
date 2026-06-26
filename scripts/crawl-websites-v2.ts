// 官网爬取 v2 — Playwright 百度搜索 + .edu.cn 提取
// 运行: npx tsx scripts/crawl-websites-v2.ts [batchSize=30]

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();
const BATCH_SIZE = parseInt(process.argv[2] || "30");

async function searchWebsite(page: any, schoolName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${schoolName} 官方网站`);
    await page.goto(`https://www.baidu.com/s?wd=${query}`, {
      waitUntil: "domcontentloaded",
      timeout: 12000,
    });

    // Wait briefly for results to render
    await page.waitForTimeout(1500);

    // Extract .edu.cn URLs from search results
    const urls: string[] = await page.evaluate(() => {
      const found = new Set<string>();
      // Check ALL text content for .edu.cn patterns
      const bodyText = document.body.textContent || "";
      const matches = bodyText.match(/[\w-]+\.edu\.cn/gi);
      if (matches) {
        matches.forEach((m) => {
          const domain = m.toLowerCase();
          // Skip common non-school domains
          if (!/baidu|google|bing|sogou|360/.test(domain)) {
            found.add(`https://www.${domain}`);
          }
        });
      }
      // Also check href attributes
      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        const m = href.match(/(https?:\/\/[\w.-]+\.edu\.cn)/i);
        if (m && !m[1].includes("baidu.com")) {
          found.add(m[1].replace(/\/$/, ""));
        }
      });
      return [...found].slice(0, 3);
    });

    return urls[0] || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("官网爬取 (Playwright 百度搜索)...\n");

  const colleges = await prisma.college.findMany({
    where: { website: null },
    select: { id: true, name: true },
    take: BATCH_SIZE,
    orderBy: { seqNo: "asc" },
  });

  console.log(`本批: ${colleges.length} 所 (总计 ${await prisma.college.count({ where: { website: null } })} 待爬取)\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  let found = 0;
  let failed = 0;

  for (let i = 0; i < colleges.length; i++) {
    const c = colleges[i];
    const pct = `[${String(i + 1).padStart(3)}/${colleges.length}]`;

    const website = await searchWebsite(page, c.name);

    if (website) {
      // Quick validation: HEAD request to check if URL is reachable
      let valid = false;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(website, { method: "HEAD", signal: ctrl.signal });
        clearTimeout(t);
        valid = r.ok;
      } catch {}

      if (valid) {
        await prisma.college.update({ where: { id: c.id }, data: { website } });
        console.log(`${pct} ✅ ${c.name} → ${website}`);
        found++;
      } else {
        console.log(`${pct} ⚠ ${c.name} → ${website} (不可达)`);
        failed++;
      }
    } else {
      console.log(`${pct} ❌ ${c.name}`);
      failed++;
    }

    // Rate limit
    if (i < colleges.length - 1) {
      await page.waitForTimeout(1500 + Math.random() * 1000);
    }
  }

  await page.close();
  await browser.close();

  const total = await prisma.college.count();
  const withWeb = await prisma.college.count({ where: { website: { not: null } } });
  console.log(`\n本轮: ${found} 找到, ${failed} 未找到`);
  console.log(`总覆盖率: ${withWeb}/${total} (${((withWeb / total) * 100).toFixed(1)}%)`);
  console.log(`\n继续运行: npx tsx scripts/crawl-websites-v2.ts ${BATCH_SIZE}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
