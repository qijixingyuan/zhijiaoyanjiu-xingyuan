import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const college = await prisma.college.findUnique({
    where: { id },
    include: {
      honors: {
        orderBy: { year: "desc" },
      },
      opinions: true,
    },
  });

  if (!college) {
    return NextResponse.json({ error: "院校未找到" }, { status: 404 });
  }

  return NextResponse.json(college);
}
