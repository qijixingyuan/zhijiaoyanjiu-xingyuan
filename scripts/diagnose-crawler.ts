// 爬虫诊断：逐个站点截图 + DOM 分析
// 运行: npx tsx scripts/diagnose-crawler.ts

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const DIAG_DIR = path.resolve("crawler-diag");
if (!fs.existsSync(DIAG_DIR)) fs.mkdirSync(DIAG_DIR);

const SOURCES = [
  {
    name: "教育部", url: "https://www.moe.gov.cn/jyb_xxgk/xxgk_zjjy/zcfg/",
    waitFor: ".moe_list li, .zcfg_list li, ul li a",
  },
  {
    name: "湖南省教育厅", url: "https://jyt.hunan.gov.cn/jyt/sjyt/xxgk/tzgg/",
    waitFor: ".gov_czfx_content li, ul li a",
  },
  {
    name: "广东省教育厅", url: "https://edu.gd.gov.cn/zwgknew/gsgg/",
    waitFor: ".list-content li, ul li a",
  },
  {
    name: "江苏省教育厅", url: "https://jyt.jiangsu.gov.cn/col/col57890/index.html",
    waitFor: ".list_main_content li, ul li a",
  },
  {
    name: "浙江省教育厅", url: "https://jyt.zj.gov.cn/col/col1543966/index.html",
    waitFor: ".list li, ul li a",
  },
];

async function diagnose() {
  console.log("爬虫诊断启动...\n");
  const browser = await chromium.launch({ headless: true });

  for (const src of SOURCES) {
    console.log(`\n━━━ ${src.name} ━━━`);
    console.log(`URL: ${src.url}`);
    const page = await browser.newPage();

    try {
      await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(3000);

      // Screenshot
      const safeName = src.name.replace(/[\\/:*?"<>|]/g, "_");
      await page.screenshot({ path: path.join(DIAG_DIR, `${safeName}.png`), fullPage: false });
      console.log(`  截图: ${safeName}.png`);

      // DOM analysis
      const diag = await page.evaluate(() => {
        const info: Record<string, number> = {};
        info["总链接数"] = document.querySelectorAll("a").length;
        info["ul数量"] = document.querySelectorAll("ul").length;
        info["li数量"] = document.querySelectorAll("li").length;
        info["含/tzgg/链接"] = document.querySelectorAll("a[href*='/tzgg/']").length;
        info["含/content/链接"] = document.querySelectorAll("a[href*='/content/']").length;
        info["含/art/链接"] = document.querySelectorAll("a[href*='/art/']").length;

        // Extract policy-like links
        const policyLinks: string[] = [];
        document.querySelectorAll("a").forEach((a) => {
          const t = a.textContent?.trim() || "";
          if (t.length > 10 && /职业|高职|院校|教育|教学|招生|政策|通知|办法|方案|意见/.test(t)) {
            policyLinks.push(t.substring(0, 60));
          }
        });

        return { info, policyTitles: policyLinks.slice(0, 10), title: document.title };
      });

      console.log(`  标题: ${diag.title}`);
      console.log(`  统计:`, JSON.stringify(diag.info));
      console.log(`  政策标题 (前5):`);
      diag.policyTitles.slice(0, 5).forEach((t) => console.log(`    - ${t}`));

      if (diag.policyTitles.length === 0) {
        console.log(`  ⚠ 未找到任何政策相关链接！可能是 SPA 页面或反爬拦截`);
      }
    } catch (e) {
      console.log(`  ❌ 错误: ${(e as Error).message?.substring(0, 80)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n诊断完成。截图保存在 ${DIAG_DIR}/`);
}

diagnose().catch(console.error);
