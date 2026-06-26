// 数据导入脚本: 从教育部 XLS 导入 1540 所高职院校
// 运行: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import { extractProvince, extractCity } from "../src/lib/china-geo";

const prisma = new PrismaClient();

// XLS 文件路径
const XLS_PATH = path.resolve(
  "D:/AI Projects/中国高校地图分布/全国普通高等学校名单.xls"
);

interface CollegeRow {
  序号: number;
  学校名称: string;
  学校标识码: string;
  主管部门: string;
  所在地: string;
  办学层次: string;
  备注: string;
}

function parseXls(filePath: string): CollegeRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // header at row index 2, data starts from index 3
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip first 3 rows (title rows + header), data starts at row index 3
  return rawData
    .slice(3)
    .filter((row) => row[0] != null && row[2] != null)
    .map((row) => ({
      序号: Number(row[0]) || 0,
      学校名称: String(row[1] || "").trim(),
      学校标识码: String(row[2] || "").trim(),
      主管部门: String(row[3] || "").trim(),
      所在地: String(row[4] || "").trim(),
      办学层次: String(row[5] || "").trim(),
      备注: String(row[6] || "").trim(),
    }))
    .filter((row) => {
      // 专科 + 职业本科（本科层次中含"职业"的院校）
      if (!row.学校标识码 || !/^\d+$/.test(row.学校标识码)) return false;
      if (row.办学层次 === "专科") return true;
      if (row.办学层次 === "本科" && row.学校名称.includes("职业")) return true;
      return false;
    })
    .map((row) => ({
      ...row,
      level:
        row.办学层次 === "本科" && row.学校名称.includes("职业")
          ? "职业本科"
          : row.办学层次,
    }));
}

function classifyNature(remarks: string): string {
  if (!remarks) return "公办";
  if (remarks.includes("中外合作")) return "中外合作办学";
  if (remarks.includes("民办")) return "民办";
  return "公办";
}

async function main() {
  console.log("开始导入院校数据...");
  console.log(`数据源: ${XLS_PATH}`);

  const rows = parseXls(XLS_PATH);
  console.log(`解析到 ${rows.length} 条院校记录（含职业本科）`);

  // 批量 upsert
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const province = extractProvince(row.所在地);
    const city = extractCity(row.所在地);
    const nature = classifyNature(row.备注);

    try {
      await prisma.college.upsert({
        where: { id: row.学校标识码 },
        create: {
          id: row.学校标识码,
          seqNo: row.序号,
          name: row.学校名称,
          supervisor: row.主管部门,
          location: row.所在地,
          province,
          city,
          nature,
          level: (row as any).level || "专科",
          remarks: row.备注 || null,
        },
        update: {
          seqNo: row.序号,
          name: row.学校名称,
          supervisor: row.主管部门,
          location: row.所在地,
          province,
          city,
          nature,
          level: (row as any).level || "专科",
          remarks: row.备注 || null,
        },
      });
      imported++;
    } catch (e) {
      console.error(`导入失败: ${row.学校名称} (${row.学校标识码})`, e);
      skipped++;
    }
  }

  console.log(`导入完成: ${imported} 所, 失败: ${skipped} 所`);

  // === 种子数据: 示例政策 ===
  const existingPolicies = await prisma.policy.count();
  if (existingPolicies === 0) {
    console.log("插入示例政策数据...");
    const samplePolicies = [
      {
        title: "湖南省职业教育改革实施方案",
        province: "湖南省",
        publishDate: new Date("2025-03-15"),
        type: "发展规划",
        summary: "推动高职院校产教融合，建设50个省级高水平专业群，到2027年实现职业院校办学条件全面达标。",
        docNumber: "湘政发〔2025〕8号",
        sourceOrg: "湖南省人民政府",
      },
      {
        title: "广东省关于深化现代职业教育体系改革的意见",
        province: "广东省",
        publishDate: new Date("2025-06-01"),
        type: "发展规划",
        summary: "打造粤港澳大湾区职业教育高地，支持深圳职业技术大学等院校建设本科层次职业教育。",
        docNumber: "粤府〔2025〕15号",
        sourceOrg: "广东省人民政府",
      },
      {
        title: "江苏省高等职业院校生均财政拨款标准调整通知",
        province: "江苏省",
        publishDate: new Date("2025-01-20"),
        type: "经费保障",
        summary: "2025年度公办高职院校生均财政拨款标准提高至2万元/生，民办院校给予生均2000元补贴。",
        docNumber: "苏财教〔2025〕3号",
        sourceOrg: "江苏省财政厅、教育厅",
      },
      {
        title: "浙江省高职院校专业设置优化指导意见",
        province: "浙江省",
        publishDate: new Date("2025-04-10"),
        type: "专业设置",
        summary: "优先发展数字经济、智能制造等相关专业，限制布点过多、就业率低的专业新增。",
        docNumber: "浙教职〔2025〕12号",
        sourceOrg: "浙江省教育厅",
      },
      {
        title: "四川省职业教育质量年度报告编写规范（2025版）",
        province: "四川省",
        publishDate: new Date("2025-02-28"),
        type: "质量评估",
        summary: "统一全省高职院校质量年报指标体系，新增产教融合、社会服务等10项核心指标。",
        docNumber: "川教函〔2025〕45号",
        sourceOrg: "四川省教育厅",
      },
      {
        title: "河南省2025年高职单独招生工作实施方案",
        province: "河南省",
        publishDate: new Date("2025-03-01"),
        type: "招生就业",
        summary: "2025年全省高职单独招生计划增至15万人，强化技能测试权重，技能测试成绩占比不低于50%。",
        docNumber: "豫教招〔2025〕6号",
        sourceOrg: "河南省教育厅",
      },
      {
        title: "山东省对口支援新疆职业教育行动计划",
        province: "山东省",
        publishDate: new Date("2025-05-15"),
        type: "对口援助",
        summary: "组织15所国家示范高职对口支援喀什地区职业院校，支持共建专业、联合培养。",
        docNumber: "鲁教职〔2025〕18号",
        sourceOrg: "山东省教育厅",
      },
    ];

    for (const policy of samplePolicies) {
      await prisma.policy.create({ data: policy });
    }
    console.log(`插入 ${samplePolicies.length} 条示例政策`);
  }

  // === 种子数据: 示例荣誉 (为前几所院校添加) ===
  const existingHonors = await prisma.honor.count();
  if (existingHonors === 0) {
    console.log("插入示例荣誉数据...");
    const colleges = await prisma.college.findMany({ take: 20 });
    const honorTemplates = [
      { title: "中国特色高水平高职学校和专业建设计划建设单位", category: "双高A类", year: 2019, batch: "第一轮" },
      { title: "中国特色高水平高职学校和专业建设计划建设单位", category: "双高B类", year: 2019, batch: "第一轮" },
      { title: "国家示范性高等职业院校", category: "国家示范", year: 2006, batch: "第一批" },
      { title: "国家骨干高职院校", category: "国家骨干", year: 2010, batch: "第一批" },
      { title: "教育部现代学徒制试点单位", category: "现代学徒制试点", year: 2018 },
      { title: "1+X证书制度试点院校", category: "1+X试点", year: 2019 },
      { title: "省级示范性高职院校", category: "省级示范", year: 2012 },
    ];

    let honorCount = 0;
    for (let i = 0; i < colleges.length && i < 10; i++) {
      const college = colleges[i];
      const honorsToAdd = honorTemplates.slice(0, 1 + (i % 3));
      for (const honor of honorsToAdd) {
        await prisma.honor.create({
          data: {
            collegeId: college.id,
            title: honor.title,
            category: honor.category,
            batch: honor.batch || null,
            year: honor.year,
            source: "教育部官网公示名单",
          },
        });
        honorCount++;
      }
    }
    console.log(`插入 ${honorCount} 条示例荣誉`);
  }

  // === 种子数据: 示例舆情 ===
  const existingOpinions = await prisma.publicOpinion.count();
  if (existingOpinions === 0) {
    console.log("插入示例舆情数据...");
    const colleges = await prisma.college.findMany({ take: 5 });
    const platforms = ["知乎", "微博", "B站", "小红书"];
    let opinionCount = 0;

    for (const college of colleges) {
      for (const platform of platforms.slice(0, 1 + (opinionCount % 3))) {
        const pos = 0.4 + Math.random() * 0.4;
        const neg = Math.random() * 0.25;
        const neu = 1 - pos - neg;
        await prisma.publicOpinion.create({
          data: {
            collegeId: college.id,
            platform,
            overallScore: 5 + Math.random() * 4.5,
            positiveRatio: pos,
            neutralRatio: neu,
            negativeRatio: neg,
            summary: `${college.name}在${platform}平台上的综合舆情评价较好，主要集中在教学质量和就业方面。`,
            sampleComments: JSON.stringify([
              { text: "这所学校的xx专业很不错，老师很负责", platform, sentiment: "positive" },
              { text: "宿舍条件有待改善，但学习氛围还行", platform, sentiment: "neutral" },
              { text: "就业率在省内专科里算好的", platform, sentiment: "positive" },
            ]),
          },
        });
        opinionCount++;
      }
    }
    console.log(`插入 ${opinionCount} 条示例舆情`);
  }

  console.log("种子数据导入完成!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
