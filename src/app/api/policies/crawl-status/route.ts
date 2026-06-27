import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 爬虫源配置（与 crawl-policies-real.ts 保持同步）
const CRAWLER_SOURCES = [
  { province: "全国", name: "教育部-职成司" },
  { province: "湖南省", name: "湖南省教育厅" },
  { province: "广东省", name: "广东省教育厅" },
  { province: "江苏省", name: "江苏省教育厅" },
  { province: "浙江省", name: "浙江省教育厅" },
  { province: "山东省", name: "山东省教育厅" },
  { province: "河南省", name: "河南省教育厅" },
  { province: "河北省", name: "河北省教育厅" },
  { province: "福建省", name: "福建省教育厅" },
  { province: "湖北省", name: "湖北省教育厅" },
];

function getStatus(count: number, dateTo: Date | null): "success" | "partial" | "empty" {
  if (count === 0) return "empty";
  if (count >= 5 && dateTo) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (dateTo >= threeMonthsAgo) return "success";
  }
  return "partial";
}

export async function GET() {
  // Per-province policy stats
  const byProvince = await prisma.policy.groupBy({
    by: ["province"],
    _count: true,
    _min: { publishDate: true },
    _max: { publishDate: true },
  });

  // Sources per province
  const sources = await prisma.policy.findMany({
    select: { province: true, sourceOrg: true },
    distinct: ["province", "sourceOrg"],
  });

  // Build province status list
  const provMap = new Map(byProvince.map((p) => [p.province, p]));
  const sourceMap = new Map<string, string[]>();
  for (const s of sources) {
    if (!sourceMap.has(s.province)) sourceMap.set(s.province, []);
    sourceMap.get(s.province)!.push(s.sourceOrg || "");
  }

  // All provinces from China geo data
  const { PROVINCES } = await import("@/lib/china-geo");
  const validProvinces = PROVINCES.filter(
    (p) => !["香港特别行政区", "澳门特别行政区", "台湾省"].includes(p)
  );

  const provinces = validProvinces.map((province) => {
    const data = provMap.get(province);
    const count = data?._count || 0;
    const dateFrom = data?._min?.publishDate || null;
    const dateTo = data?._max?.publishDate || null;
    const provSources = sourceMap.get(province) || [];

    return {
      province,
      count,
      dateFrom: dateFrom ? dateFrom.toISOString().substring(0, 10) : null,
      dateTo: dateTo ? dateTo.toISOString().substring(0, 10) : null,
      sources: provSources.filter(Boolean),
      status: getStatus(count, dateTo),
    };
  });

  // Sort by count desc
  provinces.sort((a, b) => b.count - a.count);

  // Summary
  const total = provinces.reduce((s, p) => s + p.count, 0);
  const covered = provinces.filter((p) => p.count > 0).length;
  const allDates = provinces
    .filter((p) => p.dateFrom)
    .flatMap((p) => [p.dateFrom, p.dateTo] as (string | null)[]);

  // Crawler source health
  const workingSources = CRAWLER_SOURCES.filter((s) => {
    const p = provMap.get(s.province);
    return p && p._count > 0;
  });

  return NextResponse.json({
    total,
    provinceCount: covered,
    dateFrom: allDates.filter(Boolean).sort()[0] || null,
    dateTo: allDates.filter(Boolean).sort().pop() || null,
    provinces,
    crawlerSources: {
      total: CRAWLER_SOURCES.length,
      working: workingSources.length,
      broken: CRAWLER_SOURCES.length - workingSources.length,
    },
  });
}
