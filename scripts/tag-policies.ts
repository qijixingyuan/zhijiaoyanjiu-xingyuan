// LLM 批量标注脚本 — 为存量政策打 2-4 个 A-L 多标签
// 用法:
//   npx tsx scripts/tag-policies.ts --dry-run      # 取前 3 条打印结果不写库（先确认标注质量）
//   npx tsx scripts/tag-policies.ts                # 全量标注（tags="" 的自动跳过，可断点续跑）
//   npx tsx scripts/tag-policies.ts --limit 10     # 只处理前 10 条
//   npx tsx scripts/tag-policies.ts --force        # 全量重标（忽略已有 tags）
//   npx tsx scripts/tag-policies.ts --tags-only    # 只写 tags 不动 type
// 运行结束自动生成 POLICY-TAGS-REPORT-{date}.md

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { chat } from "../src/lib/llm";

// ---------- loadEnv: npx tsx 不自动加载 .env，手动解析注入 ----------
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

// ---------- 参数解析 ----------
const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const getArg = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
};
const DRY_RUN = has("--dry-run");
const FORCE = has("--force");
const TAGS_ONLY = has("--tags-only");
const LIMIT = getArg("--limit") ? parseInt(getArg("--limit")!) : Infinity;

// ---------- 规范化 ----------
// 输入 "A"/"A-治理体系" → "A"；非法 → null
function normalizeTag(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-L]$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^([A-L])-/);
  return m ? m[1] : null;
}

// 垃圾标题预判 — 爬虫误入库的分页导航/筛选菜单文本，不浪费 LLM 调用
function isJunkTitle(title: string): boolean {
  const t = title.replace(/\s+/g, "").trim();
  if (t.length < 10) return true;
  if (/^(全部|首页|末页)(意见|办法|规划|方案|其他|通知|公告)?$/.test(t)) return true;
  return /上一页|下一页|转到第|共\s*\d+\s*条|^\d+$/.test(title);
}

// "A-治理体系" 全名格式（与爬虫写入的 type 格式一致）
const TAG_FULL_NAMES: Record<string, string> = {
  "A": "A-治理体系", "B": "B-产教融合", "C": "C-人才培养", "D": "D-专业建设",
  "E": "E-师资队伍", "F": "F-质量评价", "G": "G-招生就业", "H": "H-经费投入",
  "I": "I-数字化", "J": "J-国际化", "K": "K-乡村振兴", "L": "L-职业本科",
};

// ---------- Prompt ----------
const SYSTEM_PROMPT = `你是一位长期研究中国高等职业教育的政策分析专家。你需要对给定的政策文件进行主题归类。

分类体系共 12 个主题（A-L），定义如下：
A 治理体系：管理体制、治理能力、体系建设、职业教育法、督导制度等综合性制度设计
B 产教融合：产教融合、校企合作、职教集团、产业学院、混合所有制办学
C 人才培养：培养模式、学徒制、1+X证书、课程思政、技能人才培养
D 专业建设：专业设置、专业群、课程标准、教材建设、教学资源
E 师资队伍：双师型教师、教师培养培训、教学团队、兼职教师
F 质量评价：质量年报、教学诊改、办学条件达标、评估认证
G 招生就业：招生考试、专升本、就业服务、创新创业
H 经费投入：财政经费、生均拨款、奖补资金、经费保障
I 数字化：智慧校园、教育信息化、虚拟仿真实训、数字资源
J 国际化：职业教育出海、中外合作办学、国际交流
K 乡村振兴：乡村振兴、对口帮扶、东西协作、县域职业教育
L 职业本科：职业本科学校、职教高考、中高本贯通、本科层次职业教育

任务要求：
1. 为该政策选择 2-4 个最贴切的主题标签，标签按相关性从高到低排序，第一个是主标签
2. 只允许输出 JSON，格式：{"tags": ["A", "C"]}
3. 如果该文件不是职业教育领域的政策文件（例如：事业单位招聘公告、考试报名通知、资格复审公示、与职业教育无关的普通教育通知），输出 {"tags": []}
4. 如果政策内容与上述 12 个主题都明显无关，输出 {"tags": []}
5. 标签必须是 A-L 单个大写字母，不得输出其他格式
6. 不要输出 JSON 之外的任何文字`;

function buildUserPrompt(title: string, summary: string | null, department: string | null): string {
  return `请分析以下政策并输出标签：
标题：${title}
摘要：${summary || "（无摘要）"}
发文部门：${department || "（未知）"}`;
}

// ---------- 单条标注（带重试） ----------
async function tagOne(
  title: string, summary: string | null, department: string | null
): Promise<string[]> {
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(title, summary, department) },
        ],
        { jsonMode: true, temperature: 0.1, maxTokens: 200 }
      );
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.tags)) throw new Error(`tags 非数组: ${raw.slice(0, 100)}`);
      const tags = parsed.tags
        .map((t: unknown) => normalizeTag(String(t)))
        .filter((t: string | null): t is string => t !== null);
      const unique = Array.from(new Set(tags)).slice(0, 4);
      return unique;
    } catch (err: unknown) {
      lastErr = err instanceof Error ? err.message : String(err);
      if (attempt < 3) {
        const wait = Math.pow(3, attempt - 1) * 1000; // 1s / 3s 退避
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw new Error(lastErr);
}

// ---------- 主流程 ----------
interface PolicyRow {
  id: string; title: string; summary: string | null;
  department: string | null; type: string; tags: string;
}

const prisma = new PrismaClient();

async function main() {
  loadEnv();
  const dryRunLabel = DRY_RUN ? "（DRY-RUN，不写库）" : "";
  console.log(`LLM 批量标注 ${dryRunLabel} force=${FORCE} limit=${LIMIT === Infinity ? "∞" : LIMIT}`);

  // 标注前 type 分布（报告对比用）
  const beforeTypeDist = await prisma.$queryRawUnsafe<{ type: string; c: bigint }[]>(
    `SELECT type, COUNT(*) as c FROM Policy GROUP BY type ORDER BY c DESC`
  );

  const where = FORCE ? {} : { tags: "" };
  const rows = await prisma.policy.findMany({
    where: where as never,
    orderBy: { publishDate: "desc" },
    take: LIMIT === Infinity ? undefined : LIMIT,
    select: { id: true, title: true, summary: true, department: true, type: true, tags: true },
  });
  console.log(`待处理: ${rows.length} 条`);

  const failures: { title: string; reason: string }[] = [];
  const successTags: string[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (isJunkTitle(row.title)) {
        failures.push({ title: row.title, reason: "垃圾标题预判（分页/导航/超短文本）" });
        if (!DRY_RUN) {
          await prisma.policy.update({ where: { id: row.id }, data: { tags: "", type: "M-其他" } });
        }
        console.log(`[${i + 1}/${rows.length}] 垃圾(标M-其他): ${row.title.slice(0, 30)}`);
        continue;
      }
      const tags = await tagOne(row.title, row.summary, row.department);
      if (tags.length === 0) {
        failures.push({ title: row.title, reason: "LLM 判定非职教政策/与 12 类无关" });
        if (!DRY_RUN) {
          // 无关政策标记 M-其他，分析 API 自动过滤，用户后续可审查删除
          await prisma.policy.update({
            where: { id: row.id },
            data: { tags: "", type: "M-其他" },
          });
        }
        console.log(`[${i + 1}/${rows.length}] 无关(标M-其他): ${row.title.slice(0, 30)}`);
      } else if (DRY_RUN) {
        console.log(`[${i + 1}/${rows.length}] DRY: [${tags.join(",")}] ${row.title.slice(0, 40)}`);
      } else {
        await prisma.policy.update({
          where: { id: row.id },
          data: {
            tags: tags.join(","),
            ...(TAGS_ONLY ? {} : { type: TAG_FULL_NAMES[tags[0]] || row.type }),
          },
        });
        successTags.push(tags);
        console.log(`[${i + 1}/${rows.length}] ✅ [${tags.join(",")}] ${row.title.slice(0, 40)}`);
      }
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ title: row.title, reason });
      console.log(`[${i + 1}/${rows.length}] ❌ ${reason.slice(0, 80)} | ${row.title.slice(0, 30)}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // 限速
  }

  if (DRY_RUN) {
    console.log("\nDRY-RUN 结束，未写库。确认质量后用 `npx tsx scripts/tag-policies.ts` 全量执行。");
    await prisma.$disconnect();
    return;
  }

  // 生成报告
  const afterTypeDist = await prisma.$queryRawUnsafe<{ type: string; c: bigint }[]>(
    `SELECT type, COUNT(*) as c FROM Policy GROUP BY type ORDER BY c DESC`
  );
  const tagFreq = new Map<string, number>();
  for (const tags of successTags) {
    for (const t of tags) tagFreq.set(t, (tagFreq.get(t) || 0) + 1);
  }
  const mainTagFreq = new Map<string, number>();
  for (const tags of successTags) {
    if (tags.length > 0) mainTagFreq.set(tags[0], (mainTagFreq.get(tags[0]) || 0) + 1);
  }

  const now = new Date().toISOString().split("T")[0];
  const distTable = (d: { type: string; c: bigint }[]) =>
    d.map((r) => `| ${r.type} | ${r.c} |`).join("\n");
  const freqTable = (m: Map<string, number>) =>
    Array.from(m.entries()).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} ${TAG_FULL_NAMES[k]?.split("-")[1] || ""} | ${v} |`).join("\n");

  const report = `# 政策标签 LLM 标注报告 — ${now}

## 运行概况

- 处理总数: ${rows.length}，成功: ${successTags.length}，失败/无关: ${failures.length}
- 模式: ${FORCE ? "全量重标" : "增量（tags 为空）"}${TAGS_ONLY ? "（tags-only，未动 type）" : ""}

## 标注前 type 分布

| type | 数量 |
|------|-----|
${distTable(beforeTypeDist)}

## 标注后 type 分布

| type | 数量 |
|------|-----|
${distTable(afterTypeDist)}

## 标签频次（多标签口径，仅本次成功标注的 ${successTags.length} 条）

| 标签 | 出现次数 |
|------|---------|
${freqTable(tagFreq)}

## 主标签频次

| 标签 | 作为主标签次数 |
|------|--------------|
${freqTable(mainTagFreq)}

## 失败/无关清单（${failures.length} 条）

${failures.length === 0 ? "（无）" : failures.map((f) => `- ${f.title} — ${f.reason}`).join("\n")}
`;

  const reportPath = path.resolve(__dirname, `../POLICY-TAGS-REPORT-${now}.md`);
  fs.writeFileSync(reportPath, report, "utf8");
  console.log(`\n标注完成: 成功 ${successTags.length}, 失败/无关 ${failures.length}`);
  console.log(`报告已生成: ${reportPath}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("标注脚本崩溃:", err);
  process.exit(1);
});
