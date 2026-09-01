// 广东政策真实发布日期修复 — 从详情页 HTML 提取发布日，纠正爬取日
// 用法:
//   npx tsx scripts/fix-gd-dates.ts --dry-run   # 只检测不更新
//   npx tsx scripts/fix-gd-dates.ts             # 提取并更新（自动备份 db）
// 提取优先级: meta PubDate → 「时间：」→ 页面首个日期串

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function fetchDateFromPage(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const html = await res.text();

  // 1. meta PubDate
  const meta = html.match(/<meta\s+name="PubDate"\s+content="([^"]+)"/);
  if (meta) return meta[1].slice(0, 10);

  // 2. 「时间：」
  const timeSpan = html.match(/时间[:：]\s*(20\d{2}-\d{2}-\d{2})/);
  if (timeSpan) return timeSpan[1];

  // 3. 页面首个日期串
  const first = html.match(/20\d{2}-\d{2}-\d{2}/);
  return first ? first[0] : null;
}

async function main() {
  const rows = await prisma.policy.findMany({
    where: { url: { contains: "/content/post_" } },
    select: { id: true, title: true, url: true, publishDate: true },
  });
  console.log(`广东 post_ 格式共 ${rows.length} 条，逐条提取真实发布日期...\n`);

  const updates: { id: string; title: string; oldDate: string; newDate: string }[] = [];
  const fails: { title: string; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const oldDate = row.publishDate.toISOString().split("T")[0];
    try {
      const realDate = await fetchDateFromPage(row.url!);
      if (!realDate) {
        fails.push({ title: row.title, reason: "页面无日期" });
        console.log(`[${i + 1}/${rows.length}] ⚠️ 无日期: ${row.title.slice(0, 40)}`);
      } else if (realDate === oldDate) {
        console.log(`[${i + 1}/${rows.length}] ✅ 已准确: ${oldDate} ${row.title.slice(0, 40)}`);
      } else {
        updates.push({ id: row.id, title: row.title, oldDate, newDate: realDate });
        console.log(`[${i + 1}/${rows.length}] 🔧 ${oldDate} → ${realDate} | ${row.title.slice(0, 40)}`);
      }
    } catch (err) {
      fails.push({ title: row.title, reason: err instanceof Error ? err.message : String(err) });
      console.log(`[${i + 1}/${rows.length}] ❌ 失败: ${row.title.slice(0, 40)}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // 限速
  }

  console.log(`\n需修正: ${updates.length} | 已准确: ${rows.length - updates.length - fails.length} | 失败/无日期: ${fails.length}`);

  if (DRY_RUN || updates.length === 0) {
    console.log(DRY_RUN ? "DRY-RUN 结束，未写库。" : "无需要修正的条目。");
    await prisma.$disconnect();
    return;
  }

  // 备份后更新
  const dbPath = path.resolve(__dirname, "../prisma/dev.db");
  fs.copyFileSync(dbPath, dbPath + `.bak-dates-${new Date().toISOString().split("T")[0]}`);
  for (const u of updates) {
    await prisma.policy.update({
      where: { id: u.id },
      data: { publishDate: new Date(u.newDate + "T00:00:00.000Z") },
    });
  }
  console.log(`已更新 ${updates.length} 条（备份: dev.db.bak-dates-*）`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("日期修复脚本崩溃:", err);
  process.exit(1);
});
