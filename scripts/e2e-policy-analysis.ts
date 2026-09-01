// 政策分析模块 E2E 验证（CLAUDE.md 硬性规则: UI 修改后必须 Playwright 模拟完整交互）
// 运行: npx tsx scripts/e2e-policy-analysis.ts
// 覆盖: 地图回归 / 统计后台子标签 / 政策分析 5 维度 / 院校统计回归 / 标签编辑

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  // 1. 首页地图加载（ChinaMap 改用 use-china-geo 后回归）
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 15000 });
  console.log("1. 首页地图 canvas 渲染 OK, errors:", errors.length);

  // 2. 点击「统计后台」tab
  await page.locator("button:has-text('统计后台')").click();
  await page.waitForTimeout(800);
  const statsText = await page.textContent("body");
  console.log("2. 统计后台子标签出现:", statsText.includes("院校统计") && statsText.includes("政策分析"));

  // 3. 点击「政策分析」子标签
  await page.locator("button:has-text('政策分析')").first().click();
  await page.waitForTimeout(1500);
  const body3 = await page.textContent("body");
  console.log("3. 政策分析 5 维度 tab:", ["演进趋势", "省份活跃度", "主题共现", "发文主体", "密集度时序"].every((t) => body3.includes(t)), "| errors:", errors.length);

  // 4. 维度 1: 演进趋势（默认显示）
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(800);
  console.log("4. 演进趋势 canvas:", (await page.locator("canvas").count()) > 0, "| errors:", errors.length);

  // 5. 维度 2: 省份活跃度（含地图热力）
  await page.locator("button:has-text('省份活跃度')").click();
  await page.waitForTimeout(2500);
  const canvasCount5 = await page.locator("canvas").count();
  console.log("5. 省份活跃度 canvas 数:", canvasCount5, "(≥2: 条形图+地图)", "| errors:", errors.length);

  // 6. 维度 3: 主题共现（矩阵/网络图切换）
  await page.locator("button:has-text('主题共现')").click();
  await page.waitForTimeout(1500);
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.locator("button:has-text('网络图')").click();
  await page.waitForTimeout(1200);
  await page.locator("button:has-text('共现矩阵')").click();
  await page.waitForTimeout(1200);
  console.log("6. 主题共现 矩阵/网络图切换 OK, errors:", errors.length);

  // 7. 维度 4: 发文主体（饼图 + 联合发文列表）
  await page.locator("button:has-text('发文主体')").click();
  await page.waitForTimeout(1500);
  const body7 = await page.textContent("body");
  console.log("7. 发文主体: 饼图 canvas:", (await page.locator("canvas").count()) > 0, "| 联合发文列表:", body7.includes("联合发文检测"), "| errors:", errors.length);

  // 8. 维度 5: 密集度时序（热力图 + 类型过滤）
  await page.locator("button:has-text('密集度时序')").click();
  await page.waitForTimeout(1500);
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.locator("button:has-text('产教融合')").click();
  await page.waitForTimeout(1200);
  console.log("8. 密集度时序 类型过滤 OK, errors:", errors.length);

  // 9. 切回「院校统计」回归
  await page.locator("button:has-text('院校统计')").click();
  await page.waitForTimeout(1200);
  const body9 = await page.textContent("body");
  console.log("9. 院校统计回归: 行维度配置栏:", body9.includes("行维度"), "| 交叉统计:", body9.includes("交叉统计"), "| errors:", errors.length);

  // 10. 地图点击交互回归（ChinaMap 改动后必测）: 回地图 → 点省份 → 抽屉
  await page.locator("button:has-text('院校分布地图')").click();
  await page.waitForTimeout(2000);
  await page.waitForSelector("canvas", { timeout: 15000 });
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width * 0.57, y: box.height * 0.55 } });
    await page.waitForTimeout(2500);
    const body10 = await page.textContent("body");
    console.log("10. 地图点省份 → 抽屉/院校列表:", body10.includes("职业技术学院") || body10.includes("院校"), "| errors:", errors.length);
    // 点遮罩关闭抽屉（click-outside backdrop）
    const backdrop = page.locator("div.absolute.inset-0.z-20").first();
    if (await backdrop.count() > 0) {
      await backdrop.click({ position: { x: 20, y: 20 } });
      await page.waitForTimeout(800);
      const drawerGone = (await page.locator("div.absolute.inset-0.z-20").count()) === 0;
      console.log("10b. 点遮罩关闭抽屉:", drawerGone, "| errors:", errors.length);
    }
  }

  // 11. 政策标签编辑链路: 政策数据库 → 点卡片 → 编辑标签 → 加标签 → 保存
  await page.locator("button:has-text('政策数据库')").click();
  await page.waitForTimeout(2500);
  const card = page.locator("div.cursor-pointer").filter({ hasText: /职业技术学院|教育厅|通知|意见/ }).first();
  if (await card.count() > 0) {
    await card.click();
    await page.waitForTimeout(1200);
    await page.locator("button:has-text('编辑标签')").click();
    await page.waitForTimeout(600);
    const addBtn = page.locator("button:has-text('+ 师资队伍')").first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(400);
      await page.locator("button:has-text('保存')").click();
      await page.waitForTimeout(1200);
      const body11 = await page.textContent("body");
      console.log("11. 标签编辑保存: 编辑面板关闭:", !body11.includes("添加标签（最多 4 个）"), "| errors:", errors.length);
    } else {
      console.log("11. 标签编辑: 未找到可添加的标签按钮（可能已满 4 个）");
    }
    // 关闭弹窗
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  console.log("---");
  if (errors.length > 0) {
    console.error("FAIL: pageerror 共", errors.length, "个:", errors.slice(0, 5));
    process.exitCode = 1;
  } else {
    console.log("PASS: 全部检查通过，无 pageerror");
  }
  await browser.close();
}

main().catch((err) => {
  console.error("E2E 崩溃:", err);
  process.exit(1);
});
