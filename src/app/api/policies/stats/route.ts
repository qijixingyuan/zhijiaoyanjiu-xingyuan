import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

// GET /api/policies/stats — 轻量统计（政策总数 + 最新政策日期），导航栏数据条使用
export async function GET() {
  const [total, latest] = await Promise.all([
    prisma.policy.count(),
    prisma.policy.findFirst({
      orderBy: { publishDate: "desc" },
      select: { publishDate: true },
    }),
  ]);

  return NextResponse.json({
    total,
    latestDate: latest?.publishDate.toISOString().split("T")[0] || "",
  });
}
