// 脏数据清洗脚本 — 删除爬虫垃圾与非职教误抓，职教边缘文件归正类
// 用法:
//   npx tsx scripts/clean-junk-policies.ts --dry-run   # 只列清单不执行
//   npx tsx scripts/clean-junk-policies.ts             # 执行（自动备份 dev.db）
// 仅处理 type='M-其他' 的条目（已被 LLM 标注判定过），不影响已标注数据

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- 删除模式（爬虫垃圾 + 非职教误抓） ----------
const DELETE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "分页导航", re: /共\s*\d+\s*条|上一页|下一页|转到第/ },
  { name: "面包屑", re: /^当前位置[:：]/ },
  { name: "筛选菜单", re: /^全部\s*(意见|办法|规划|方案|其他)/ },
  { name: "栏目导航", re: /^(新闻中心|时政要闻|教育要闻|通知公告|教育动态|媒体聚焦)/ },
  { name: "纯栏目名", re: /^(职业教育|高等教育|基础教育|成人教育)$/ },
  { name: "超短标题", re: /^[一-龥A-Za-z0-9]{1,4}$/ },
  { name: "高校招聘公告", re: /公开招聘|拟聘用人员|招聘.*公告/ },
  { name: "教师资格认定", re: /教师资格认定|高校教师资格/ },
  { name: "非职教活动", re: /艺术节|奖学金|诵写讲|普通话|校园足球|创新大赛|终身学习|研究生英语|国防教育|法治作品|学生实习监督/ },
  { name: "获奖/名单公示", re: /获奖名单|名单公示|拟获奖|优秀毕业生/ },
  { name: "课题申报结项", re: /教育科学规划/ },
  { name: "新闻稿", re: /走进[一-龥]+讲授|讲授[“"“][一-龥]+/ },
  { name: "实验室检查", re: /实验室安全检查/ },
  { name: "纯院校名", re: /^[一-龥]+(职业技术学院|职业学院|专科学校)$/ },
  { name: "非职教技能比赛", re: /英语教学技能大赛|未来教师职业能力/ },
  { name: "校园普法", re: /校园广播普法/ },
  { name: "高中招生名单", re: /具有招生资格的高级中等学校/ },
];

// ---------- 保留但归正类 ----------
const RECLASSIFY_RULES: { name: string; re: RegExp; type: string; tags: string }[] = [
  { name: "高校章程核准书→A", re: /章程核准书/, type: "A-治理体系", tags: "A" },
  { name: "实习监督电话→F", re: /实习监督咨询电话/, type: "F-质量评价", tags: "F" },
  { name: "职教技能大赛→C", re: /职业院校技能大赛|职业学校技能大赛|中等职业(教育)?技能/, type: "C-人才培养", tags: "C" },
  { name: "举办者变更批复→A", re: /变更举办者的批复/, type: "A-治理体系", tags: "A" },
  { name: "自考+技工联合发文→A", re: /高等教育自学考试和技工/, type: "A-治理体系", tags: "A" },
];

function matchRule(title: string): { kind: "delete" | "reclassify"; name: string; type?: string; tags?: string } | null {
  for (const r of RECLASSIFY_RULES) {
    if (r.re.test(title)) return { kind: "reclassify", name: r.name, type: r.type, tags: r.tags };
  }
  for (const p of DELETE_PATTERNS) {
    if (p.re.test(title)) return { kind: "delete", name: p.name };
  }
  return null;
}

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const rows = await prisma.policy.findMany({
    where: { type: "M-其他" },
    select: { id: true, title: true },
  });
  console.log(`M-其他 共 ${rows.length} 条，逐条匹配规则...\n`);

  const toDelete: { id: string; title: string; rule: string }[] = [];
  const toReclassify: { id: string; title: string; rule: string; type: string }[] = [];
  const untouched: string[] = [];

  for (const row of rows) {
    const clean = row.title.replace(/\s+/g, " ").trim();
    const rule = matchRule(clean);
    if (!rule) {
      untouched.push(clean.slice(0, 50));
      continue;
    }
    if (rule.kind === "delete") {
      toDelete.push({ id: row.id, title: clean, rule: rule.name });
      console.log(`❌ 删 [${rule.name}] ${clean.slice(0, 55)}`);
    } else {
      toReclassify.push({ id: row.id, title: clean, rule: rule.name, type: rule.type! });
      console.log(`🔀 改标 [${rule.name}] ${clean.slice(0, 55)}`);
    }
  }

  console.log(`\n删除: ${toDelete.length} | 改标: ${toReclassify.length} | 保留(M-其他): ${untouched.length}`);
  if (untouched.length > 0) {
    console.log("未匹配规则的 M-其他（保留待人工判断）:");
    untouched.forEach((t) => console.log(`  ? ${t}`));
  }

  if (DRY_RUN) {
    console.log("\nDRY-RUN 结束，未执行任何操作。确认后用 `npx tsx scripts/clean-junk-policies.ts` 执行。");
    await prisma.$disconnect();
    return;
  }

  // 备份
  const dbPath = path.resolve(__dirname, "../prisma/dev.db");
  const bakPath = dbPath + `.bak-clean-${new Date().toISOString().split("T")[0]}`;
  fs.copyFileSync(dbPath, bakPath);
  console.log(`\n已备份: ${bakPath}`);

  for (const d of toDelete) {
    await prisma.policy.delete({ where: { id: d.id } });
  }
  for (const r of toReclassify) {
    await prisma.policy.update({
      where: { id: r.id },
      data: { type: r.type, tags: (r.rule.includes("→A") ? "A" : r.rule.includes("→F") ? "F" : "C") },
    });
  }

  const total = await prisma.policy.count();
  const mCount = await prisma.policy.count({ where: { type: "M-其他" } });
  console.log(`\n完成: 删除 ${toDelete.length} 条，改标 ${toReclassify.length} 条`);
  console.log(`当前政策总数: ${total}，M-其他剩余: ${mCount}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("清洗脚本崩溃:", err);
  process.exit(1);
});
