// 官网爬取 — Playwright 版本
// 使用无头浏览器搜索百度，突破反爬限制
// 运行: npx tsx scripts/crawl-websites-playwright.ts

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();

async function searchBaiduForWebsite(page: any, schoolName: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(schoolName + " 官网")}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait for results
    try {
      await page.waitForSelector("#content_left", { timeout: 5000 });
    } catch {
      // Results might still be there
    }

    // Extract URLs from search results
    const urls: string[] = await page.evaluate(() => {
      const links: string[] = [];
      const anchors = document.querySelectorAll("#content_left a");
      anchors.forEach((a) => {
        const href = a.getAttribute("href") || "";
        // Target .edu.cn domains specifically
        if (href.includes(".edu.cn")) {
          // Extract actual URL from Baidu's redirect wrapper
          const match = href.match(/https?:\/\/[^\s&"']+\.edu\.cn[^\s&"']*/);
          if (match) links.push(match[0]);
          else if (href.startsWith("http") && href.includes(".edu.cn")) {
            links.push(href.split("&")[0]);
          }
        }
      });
      return links;
    });

    // Return the most likely official website URL (shortest .edu.cn domain)
    const officialUrls = urls
      .filter((u) => u.includes(schoolName.substring(0, 2)) || u.includes(".edu.cn"))
      .sort((a, b) => a.length - b.length);

    return officialUrls[0] || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("启动 Playwright 官网爬虫...\n");

  // Get schools without websites
  const colleges = await prisma.college.findMany({
    where: { website: null },
    select: { id: true, name: true },
    take: 100, // Batch 100 per run
  });

  console.log(`待爬取: ${colleges.length} 所\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  let success = 0;
  let failed = 0;
  const page = await context.newPage();

  for (let i = 0; i < colleges.length; i++) {
    const college = colleges[i];
    const progress = `[${String(i + 1).padStart(3)}/${colleges.length}]`;

    const website = await searchBaiduForWebsite(page, college.name);

    if (website) {
      await prisma.college.update({
        where: { id: college.id },
        data: { website },
      });
      console.log(`${progress} ✅ ${college.name} → ${website}`);
      success++;
    } else {
      console.log(`${progress} ❌ ${college.name}`);
      failed++;
    }

    // Rate limit: delay between searches
    if (i < colleges.length - 1) {
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
    }
  }

  await page.close();
  await browser.close();

  const total = await prisma.college.count();
  const withWebsite = await prisma.college.count({ where: { website: { not: null } } });
  console.log(`\n成功: ${success}, 未找到: ${failed}`);
  console.log(`总覆盖率: ${withWebsite}/${total} (${((withWebsite / total) * 100).toFixed(1)}%)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
