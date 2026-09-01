import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAllViews } from "@/lib/policy-analysis";

export const revalidate = 0;

// GET /api/policies/analysis — 一次返回全部 5 个分析视图
export async function GET() {
  const policies = await prisma.policy.findMany({
    select: {
      id: true,
      title: true,
      province: true,
      publishDate: true,
      type: true,
      tags: true,
      department: true,
    },
  });

  const views = buildAllViews(policies);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    total: policies.length,
    nationalCount: views.province.nationalCount,
    views,
  });
}
