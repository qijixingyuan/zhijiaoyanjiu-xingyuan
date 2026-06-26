import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rowDim = searchParams.get("rowDim") || "province";
  const metricsStr = searchParams.get("metrics") || "count";
  const metrics = metricsStr.split(",");

  // Fetch all colleges with their honors
  const colleges = await prisma.college.findMany({
    select: {
      id: true,
      province: true,
      nature: true,
      supervisor: true,
      honors: { select: { category: true } },
    },
  });

  // Group by rowDim
  const groupMap = new Map<string, {
    total: number; publicCount: number; privateCount: number; shuanggaoCount: number;
  }>();

  const getGroupKey = (college: typeof colleges[0]) => {
    switch (rowDim) {
      case "province": return college.province || "未知";
      case "nature": return college.nature || "未知";
      case "supervisor":
        if (!college.supervisor) return "未知";
        if (college.supervisor.includes("教育厅")) return "省教育厅";
        if (college.supervisor.includes("厅") || college.supervisor.includes("局")) return "省其他厅局";
        if (college.supervisor.includes("市")) return "市属";
        return college.supervisor;
      default: return college.province || "未知";
    }
  };

  for (const college of colleges) {
    const key = getGroupKey(college);
    if (!groupMap.has(key)) {
      groupMap.set(key, { total: 0, publicCount: 0, privateCount: 0, shuanggaoCount: 0 });
    }
    const entry = groupMap.get(key)!;
    entry.total++;
    if (college.nature === "公办") entry.publicCount++;
    else if (college.nature === "民办") entry.privateCount++;
    if (college.honors?.some((h) => h.category.startsWith("双高"))) entry.shuanggaoCount++;
  }

  const data = Array.from(groupMap.entries())
    .map(([key, entry]) => {
      const metricsData: Record<string, number> = {};
      for (const m of metrics) {
        switch (m) {
          case "count": metricsData.count = entry.total; break;
          case "publicCount": metricsData.publicCount = entry.publicCount; break;
          case "privateRatio":
            metricsData.privateRatio = entry.total > 0 ? entry.privateCount / entry.total : 0;
            break;
          case "shuanggaoCount": metricsData.shuanggaoCount = entry.shuanggaoCount; break;
          case "shuanggaoRatio":
            metricsData.shuanggaoRatio = entry.total > 0 ? entry.shuanggaoCount / entry.total : 0;
            break;
        }
      }
      return { key, label: key, metrics: metricsData };
    })
    .sort((a, b) => (b.metrics.count || 0) - (a.metrics.count || 0));

  return NextResponse.json({ data });
}
