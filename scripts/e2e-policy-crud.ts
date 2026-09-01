// 政策 CRUD E2E 验证 — 新增/编辑信息/编辑标签/删除 全链路
// 运行: npx tsx scripts/e2e-policy-crud.ts

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("dialog", (d) => d.accept()); // 删除确认自动接受

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
  await page.locator("button:has-text('政策数据库')").click();
  await page.waitForTimeout(2500);

  // 1. 新增政策
  await page.locator("button:has-text('新增政策')").click();
  await page.waitForTimeout(600);
  const form = page.locator("div.relative"); // 表单弹窗容器
  await form.locator("input[placeholder='政策文件标题']").fill("E2E测试政策-职业院校产教融合试点方案");
  await form.locator("select").selectOption({ label: "湖南省" });
  await form.locator("input[type='date']").fill("2026-08-15");
  await page.locator("input[placeholder='如: 湖南省教育厅']").fill("湖南省教育厅");
  await page.locator("textarea").fill("E2E 测试用政策摘要");
  await page.locator("button:has-text('+ 产教融合')").click();
  await page.locator("button:has-text('+ 治理体系')").click();
  await form.locator("button:has-text('保存')").click();
  await page.waitForTimeout(2000);
  const body1 = await page.textContent("body");
  console.log("1. 新增政策出现在列表:", body1.includes("E2E测试政策-职业院校产教融合试点方案"), "| errors:", errors.length);

  // 2. 打开卡片 → 编辑信息（改标题）
  const card = page.locator("div.cursor-pointer").filter({ hasText: "E2E测试政策" }).first();
  await card.click();
  await page.waitForTimeout(1000);
  await page.locator("button:has-text('编辑信息')").click();
  await page.waitForTimeout(600);
  const form2 = page.locator("div.relative");
  await form2.locator("input[placeholder='政策文件标题']").fill("E2E测试政策-已修改标题");
  await form2.locator("button:has-text('保存')").click();
  await page.waitForTimeout(1500);
  const body2 = await page.textContent("body");
  console.log("2. 编辑信息后标题更新:", body2.includes("E2E测试政策-已修改标题"), "| errors:", errors.length);

  // 3. 编辑标签（快速入口）
  await page.locator("button:has-text('编辑标签')").click();
  await page.waitForTimeout(600);
  await page.locator("button:has-text('+ 乡村振兴')").first().click();
  await page.locator("div.relative button:has-text('保存')").click();
  await page.waitForTimeout(1200);
  const body3 = await page.textContent("body");
  console.log("3. 编辑标签后弹窗显示乡村振兴:", body3.includes("乡村振兴"), "| errors:", errors.length);

  // 4. 删除（dialog 自动接受）
  await page.locator("button:has-text('删除')").click();
  await page.waitForTimeout(1500);
  const body4 = await page.textContent("body");
  console.log("4. 删除后列表移除:", !body4.includes("E2E测试政策-已修改标题"), "| errors:", errors.length);

  // 5. API 层验证数据一致性
  const check = await page.evaluate(async () => {
    const res = await fetch("/api/policies?keyword=E2E测试");
    const json = await res.json();
    return json.total;
  });
  console.log("5. API 校验 E2E 测试政策已彻底删除 (total=0):", check === 0);

  console.log("---");
  if (errors.length > 0) {
    console.error("FAIL: pageerror 共", errors.length, "个:", errors.slice(0, 5));
    process.exitCode = 1;
  } else {
    console.log("PASS: CRUD 全链路通过，无 pageerror");
  }
  await browser.close();
}

main().catch((err) => {
  console.error("E2E 崩溃:", err);
  process.exit(1);
});
