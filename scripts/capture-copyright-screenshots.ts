// 软著操作手册截图 — Playwright 自动截取测试环境各页面
// 运行: npx tsx scripts/capture-copyright-screenshots.ts
// 输出: 软件著作权申请资料/用户截图/*.png

import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

const BASE = "http://47.107.31.231:3002";
const OUT_DIR = path.resolve(__dirname, "../软件著作权申请资料/用户截图");

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. 分布地图
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "01-院校分布地图.png") });
  console.log("1. 院校分布地图");

  // 2. 点省份开抽屉
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width * 0.57, y: box.height * 0.55 } });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, "02-省份院校抽屉.png") });
    console.log("2. 省份院校抽屉");
    const backdrop = page.locator("div.absolute.inset-0.z-20").first();
    if (await backdrop.count() > 0) {
      await backdrop.click({ position: { x: 20, y: 20 } });
      await page.waitForTimeout(800);
    }
  }

  // 3. 院校详情
  await page.locator("button:has-text('院校详情')").click();
  await page.waitForTimeout(2000);
  await page.locator("input").first().fill("职业技术学院");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "03-院校详情查询.png") });
  console.log("3. 院校详情查询");
  // 打开详情弹窗
  const collegeCard = page.locator("div.cursor-pointer").filter({ hasText: /职业|学院|学校/ }).first();
  if (await collegeCard.count() > 0) {
    await collegeCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, "04-院校详情弹窗.png") });
    console.log("4. 院校详情弹窗");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  // 5. 政策数据库
  await page.locator("button:has-text('政策数据库')").click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, "05-政策数据库检索.png") });
  console.log("5. 政策数据库检索");

  // 6. 政策详情弹窗（含编辑标签）
  const policyCard = page.locator("div.cursor-pointer").filter({ hasText: /职业技术学院|教育厅|通知|意见|计划|办法/ }).first();
  if (await policyCard.count() > 0) {
    await policyCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, "06-政策详情与标签编辑.png") });
    console.log("6. 政策详情弹窗");
    // 点弹窗外层遮罩关闭（PolicyModal 遮罩自带 onClick 关闭）
    const overlay = page.locator("div.fixed.inset-0.z-50 > div.absolute").first();
    if (await overlay.count() > 0) {
      await overlay.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(800);
    }
  }

  // 7. 新增政策表单
  const addBtn = page.locator("button:has-text('新增政策')");
  await addBtn.waitFor({ timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, "07-新增政策表单.png") });
  console.log("7. 新增政策表单");
  const formClose = page.locator("div.relative button:has-text('取消')").first();
  if (await formClose.count() > 0) {
    await formClose.click();
    await page.waitForTimeout(800);
  }

  // 8-13. 数据分析-政策分析 5 维度 + 院校统计
  await page.locator("button:has-text('数据分析')").click();
  await page.waitForTimeout(1500);
  await page.locator("button:has-text('政策分析')").first().click();
  await page.waitForTimeout(2500);
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, "08-政策分析-演进趋势.png") });
  console.log("8. 演进趋势");

  await page.locator("button:has-text('省份活跃度')").click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, "09-政策分析-省份活跃度.png") });
  console.log("9. 省份活跃度");

  await page.locator("button:has-text('主题共现')").click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "10-政策分析-主题共现.png") });
  console.log("10. 主题共现");

  await page.locator("button:has-text('发文主体')").click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "11-政策分析-发文主体.png") });
  console.log("11. 发文主体");

  await page.locator("button:has-text('密集度时序')").click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "12-政策分析-密集度时序.png") });
  console.log("12. 密集度时序");

  await page.locator("button:has-text('院校统计')").first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "13-院校统计报表.png") });
  console.log("13. 院校统计报表");

  await browser.close();
  console.log("截图完成，输出目录:", OUT_DIR);
}

main().catch((err) => {
  console.error("截图崩溃:", err);
  process.exit(1);
});
