import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTag, TYPE_LABELS } from "@/lib/policy-types";

// PATCH /api/policies/[id] — 手动调整标签
// body: { tags: ["A", "C"] } → 规范化后写 tags 并同步 type = 主标签
// tags: [] → 清空 tags（type 保留原值）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { tags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  if (!Array.isArray(body?.tags)) {
    return NextResponse.json({ error: "tags 必须是数组" }, { status: 400 });
  }

  // 规范化: 非 A-L 丢弃、去重、按 A-L 排序、上限 4
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of body.tags) {
    const t = normalizeTag(String(raw));
    if (t && !seen.has(t)) {
      seen.add(t);
      tags.push(t);
    }
  }
  tags.sort();
  const finalTags = tags.slice(0, 4);

  const policy = await prisma.policy.update({
    where: { id: params.id },
    data: {
      tags: finalTags.join(","),
      ...(finalTags.length > 0 ? { type: `${finalTags[0]}-${TYPE_LABELS[finalTags[0]]}` } : {}),
    },
  });

  return NextResponse.json({
    data: {
      ...policy,
      publishDate: policy.publishDate.toISOString().split("T")[0],
    },
  });
}
