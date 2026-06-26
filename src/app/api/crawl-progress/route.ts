import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const total = await prisma.college.count();
  const withWebsite = await prisma.college.count({ where: { website: { not: null } } });
  const withoutWebsite = total - withWebsite;
  const coverage = total > 0 ? ((withWebsite / total) * 100).toFixed(1) + "%" : "0%";

  return NextResponse.json({
    total,
    withWebsite,
    withoutWebsite,
    coverage,
    lastBatch: "—",
    lastUpdate: new Date().toLocaleString("zh-CN"),
  });
}
