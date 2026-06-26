import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const nature = searchParams.get("nature");
  const supervisor = searchParams.get("supervisor");
  const honorCategory = searchParams.get("honorCategory");

  const where: Record<string, unknown> = {};

  if (province) where.province = province;
  if (nature) where.nature = nature;
  if (supervisor) where.supervisor = { contains: supervisor };

  // Get all matching colleges
  let collegeFilter: any = { ...where };

  if (honorCategory) {
    const collegeIds = await prisma.honor.findMany({
      where: { category: honorCategory },
      select: { collegeId: true },
      distinct: ["collegeId"],
    });
    collegeFilter.id = { in: collegeIds.map((h) => h.collegeId) };
  }

  const colleges = await prisma.college.findMany({
    where: collegeFilter,
    select: {
      id: true,
      province: true,
      city: true,
      nature: true,
      level: true,
      honors: { select: { category: true } },
    },
  });

  // Aggregate by province
  const provinceMap = new Map<string, {
    count: number; publicCount: number; privateCount: number;
    cooperationCount: number; zhiyeBenkeCount: number; shuanggaoCount: number; cities: Map<string, any>;
  }>();

  for (const college of colleges) {
    const p = college.province || "未知";
    if (!provinceMap.has(p)) {
      provinceMap.set(p, {
        count: 0, publicCount: 0, privateCount: 0, cooperationCount: 0,
        zhiyeBenkeCount: 0, shuanggaoCount: 0, cities: new Map(),
      });
    }
    const entry = provinceMap.get(p)!;
    entry.count++;
    if (college.nature === "公办") entry.publicCount++;
    else if (college.nature === "民办") entry.privateCount++;
    else if (college.nature?.includes("中外合作")) entry.cooperationCount++;

    if (college.level === "职业本科") entry.zhiyeBenkeCount++;

    if (college.honors?.some((h) => h.category.startsWith("双高"))) {
      entry.shuanggaoCount++;
    }

    // City aggregation
    if (college.city) {
      const city = college.city;
      if (!entry.cities.has(city)) {
        entry.cities.set(city, { city, count: 0, publicCount: 0, privateCount: 0 });
      }
      const ce = entry.cities.get(city)!;
      ce.count++;
      if (college.nature === "公办") ce.publicCount++;
      else if (college.nature === "民办") ce.privateCount++;
    }
  }

  const data = Array.from(provinceMap.entries()).map(([province, entry]) => ({
    province,
    count: entry.count,
    publicCount: entry.publicCount,
    privateCount: entry.privateCount,
    cooperationCount: entry.cooperationCount,
    zhiyeBenkeCount: entry.zhiyeBenkeCount,
    shuanggaoCount: entry.shuanggaoCount,
    cities: Array.from(entry.cities.values()),
  }));

  // Overall stats
  const total = colleges.length;
  const publicCount = colleges.filter((c) => c.nature === "公办").length;
  const privateCount = colleges.filter((c) => c.nature === "民办").length;
  const zhiyeBenkeCount = colleges.filter((c) => c.level === "职业本科").length;
  const shuanggaoCount = colleges.filter((c) =>
    c.honors?.some((h) => h.category.startsWith("双高"))
  ).length;

  return NextResponse.json({
    data,
    stats: { total, publicCount, privateCount, zhiyeBenkeCount, shuanggaoCount },
  });
}
