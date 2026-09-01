import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TYPE_LABELS } from "@/lib/policy-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const type = searchParams.get("type");
  const yearFrom = searchParams.get("yearFrom");
  const yearTo = searchParams.get("yearTo");
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const where: Record<string, unknown> = {};

  if (province) where.province = province;
  if (type) where.type = type;

  if (yearFrom || yearTo) {
    const dateFilter: Record<string, Date> = {};
    if (yearFrom) dateFilter.gte = new Date(`${yearFrom}-01-01`);
    if (yearTo) dateFilter.lte = new Date(`${yearTo}-12-31`);
    where.publishDate = dateFilter;
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { summary: { contains: keyword } },
    ];
  }

  const [total, policies] = await Promise.all([
    prisma.policy.count({ where: where as any }),
    prisma.policy.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { publishDate: "desc" },
      select: {
        id: true,
        title: true,
        province: true,
        publishDate: true,
        type: true,
        tags: true,
        department: true,
        summary: true,
        docNumber: true,
        sourceOrg: true,
        url: true,
        downloadUrl: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: policies.map((p) => ({
      ...p,
      publishDate: p.publishDate.toISOString().split("T")[0],
    })),
    total,
    page,
    limit,
  });
}

// POST /api/policies — 手动新增政策
// body: { title(必填), province(必填), publishDate(必填), tags?, department?, summary?, docNumber?, url?, downloadUrl? }
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const province = String(body.province || "").trim();
  const publishDateStr = String(body.publishDate || "").trim();
  if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  if (!province) return NextResponse.json({ error: "省份不能为空" }, { status: 400 });
  if (!publishDateStr) return NextResponse.json({ error: "发布日期不能为空" }, { status: 400 });

  const publishDate = new Date(publishDateStr);
  if (isNaN(publishDate.getTime())) {
    return NextResponse.json({ error: "发布日期格式无效" }, { status: 400 });
  }

  // 标签规范化
  const tags: string[] = [];
  if (Array.isArray(body.tags)) {
    const seen = new Set<string>();
    for (const raw of body.tags) {
      const t = (String(raw).match(/^([A-L])/) || [])[1];
      if (t && !seen.has(t)) { seen.add(t); tags.push(t); }
    }
    tags.sort();
  }
  const finalTags = tags.slice(0, 4);
  const type = finalTags.length > 0
    ? `${finalTags[0]}-${TYPE_LABELS[finalTags[0]] || finalTags[0]}`
    : "M-其他";

  const policy = await prisma.policy.create({
    data: {
      title,
      province,
      publishDate,
      type,
      tags: finalTags.join(","),
      department: body.department ? String(body.department) : null,
      summary: body.summary ? String(body.summary) : null,
      docNumber: body.docNumber ? String(body.docNumber) : null,
      sourceOrg: body.sourceOrg ? String(body.sourceOrg) : null,
      url: body.url ? String(body.url) : null,
      downloadUrl: body.downloadUrl ? String(body.downloadUrl) : null,
    },
  });

  return NextResponse.json({
    data: {
      ...policy,
      publishDate: policy.publishDate.toISOString().split("T")[0],
    },
  });
}
