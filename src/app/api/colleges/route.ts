import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const nature = searchParams.get("nature");
  const supervisor = searchParams.get("supervisor");
  const honorCategory = searchParams.get("honorCategory");
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const where: Record<string, unknown> = {};

  if (province) {
    const provinces = province.split(",");
    where.province = { in: provinces } as unknown as string;
  }
  if (nature) {
    const natures = nature.split(",");
    where.nature = { in: natures } as unknown as string;
  }
  if (supervisor) where.supervisor = { contains: supervisor };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { location: { contains: keyword } },
    ];
  }

  // If honor filter is applied, find colleges that have matching honors
  if (honorCategory) {
    const collegeIds = await prisma.honor.findMany({
      where: { category: honorCategory },
      select: { collegeId: true },
      distinct: ["collegeId"],
    });
    where.id = { in: collegeIds.map((h) => h.collegeId) } as unknown as string;
  }

  const [total, colleges] = await Promise.all([
    prisma.college.count({ where: where as any }),
    prisma.college.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { seqNo: "asc" },
      select: {
        id: true,
        name: true,
        province: true,
        city: true,
        nature: true,
        level: true,
        supervisor: true,
        location: true,
        website: true,
        honors: { select: { category: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: colleges,
    total,
    page,
    limit,
  });
}
