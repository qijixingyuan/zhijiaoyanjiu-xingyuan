import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `你是一个职教政策检索助手。用户会用自然语言描述想查找的政策，你需要提取结构化筛选条件。

## 政策分类体系（12类，返回编码）

A-治理体系: 现代职教体系、类型定位、管理体制、标准体系
B-产教融合: 产教融合型企业、职教集团、产业学院、混合所有制
C-人才培养: 现代学徒制、工学结合、1+X证书、现场工程师
D-专业建设: 专业目录、高水平专业群、课程标准、教学资源库
E-师资队伍: 双师型教师、教师企业实践、教学创新团队
F-质量评价: 教学诊改、质量年报、办学条件达标、专业认证
G-招生就业: 分类考试、单独招生、专升本、就业创业
H-经费投入: 生均拨款、专项经费、奖补资金、实训基地投入
I-数字化: 智慧校园、虚拟仿真实训、数字教学资源
J-国际化: 职教出海、中外合作办学、鲁班工坊、一带一路
K-乡村振兴: 对口帮扶、东西协作、乡村振兴、县域职教
L-职业本科: 职业本科、职业技术大学、中高本贯通、职教高考

## 省份（31个）

北京、天津、河北、山西、内蒙古、辽宁、吉林、黑龙江、上海、江苏、浙江、安徽、福建、江西、山东、河南、湖北、湖南、广东、广西、海南、重庆、四川、贵州、云南、西藏、陕西、甘肃、青海、宁夏、新疆

## 输出格式（严格 JSON）

{
  "province": "广东",        // 匹配到的省份全名，无则 null
  "yearFrom": "2025",        // 年份起，无则 null
  "yearTo": null,            // 年份止，无则 null
  "types": ["B-产教融合"],    // 匹配到的政策类型编码列表，无则 []
  "keywords": "产教融合 高职", // 提取的核心关键词（原样，用于标题检索）
  "explanation": "帮你找广东省2025年关于产教融合的政策"  // 一句话解释，让用户知道被理解了什么
}

## 规则

- 时间表达: "最近半年" → yearFrom=当前年份; "去年" → yearFrom=去年; "近三年" → yearFrom=三年前
- 否定表达: "不要XX"、"除了XX" → 从 types/keywords 中排除
- 如果用户查询过于模糊，返回 types:[] 并给 explanation 说明需要更多信息
- 只返回 JSON，不要有任何其他文字`;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "请输入至少2个字" }, { status: 400 });
    }

    // Step 1: Call LLM to extract structured filters
    let filters: {
      province: string | null;
      yearFrom: string | null;
      yearTo: string | null;
      types: string[];
      keywords: string;
      explanation: string;
    };

    try {
      const llmResponse = await chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query.trim() },
        ],
        { jsonMode: true, temperature: 0.1, maxTokens: 400 }
      );
      filters = JSON.parse(llmResponse);
    } catch (llmError) {
      // LLM 不可用时降级为纯关键词搜索
      console.error("LLM unavailable, falling back to keyword search:", llmError);
      filters = {
        province: null,
        yearFrom: null,
        yearTo: null,
        types: [],
        keywords: query.trim(),
        explanation: "（智能分析暂不可用，使用关键词匹配）",
      };
    }

    // Step 2: Build Prisma query from extracted filters
    const where: Record<string, unknown> = {};

    if (filters.province) {
      where.province = { contains: filters.province };
    }

    if (filters.yearFrom || filters.yearTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.yearFrom) dateFilter.gte = new Date(`${filters.yearFrom}-01-01`);
      if (filters.yearTo) dateFilter.lte = new Date(`${filters.yearTo}-12-31`);
      where.publishDate = dateFilter;
    }

    // Combine LLM keywords + type filter
    const orConditions: Record<string, unknown>[] = [];

    if (filters.keywords) {
      orConditions.push({ title: { contains: filters.keywords } });
      orConditions.push({ summary: { contains: filters.keywords } });
    }

    if (filters.types.length > 0) {
      orConditions.push({ type: { in: filters.types } });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Step 3: Query database
    const policies = await prisma.policy.findMany({
      where: where as any,
      take: 20,
      orderBy: { publishDate: "desc" },
      select: {
        id: true, title: true, province: true, publishDate: true,
        type: true, department: true, summary: true,
        docNumber: true, sourceOrg: true, url: true, downloadUrl: true,
      },
    });

    return NextResponse.json({
      filters,
      data: policies.map((p) => ({
        ...p,
        publishDate: p.publishDate.toISOString().split("T")[0],
      })),
      total: policies.length,
    });
  } catch (e) {
    console.error("/api/policies/search error:", e);
    return NextResponse.json({ error: "检索失败" }, { status: 500 });
  }
}
