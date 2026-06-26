import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
