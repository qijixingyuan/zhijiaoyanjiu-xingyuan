import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTag, TYPE_LABELS } from "@/lib/policy-types";

// 允许更新的字段白名单
const EDITABLE_FIELDS = [
  "title", "province", "publishDate", "department", "summary",
  "docNumber", "sourceOrg", "url", "downloadUrl",
] as const;

// PATCH /api/policies/[id] — 编辑政策（全字段）+ 手动调整标签
// body: { title?, province?, publishDate?, department?, summary?, url?, tags? }
// tags: ["A","C"] → 规范化后写 tags 并同步 type = 主标签；[] → 清空 tags（type 保留）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  // 全字段更新（白名单内）
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      const value = body[field];
      if (field === "title" && (!value || !String(value).trim())) {
        return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
      }
      if (field === "publishDate" && value) {
        const d = new Date(String(value));
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "发布日期格式无效" }, { status: 400 });
        }
        data[field] = d;
      } else {
        data[field] = value === "" ? null : value;
      }
    }
  }

  // 标签规范化: 非 A-L 丢弃、去重、按 A-L 排序、上限 4
  if (Array.isArray(body.tags)) {
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
    data.tags = finalTags.join(",");
    if (finalTags.length > 0) {
      data.type = `${finalTags[0]}-${TYPE_LABELS[finalTags[0]]}`;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
  }

  const policy = await prisma.policy.update({
    where: { id: params.id },
    data: data as never,
  });

  return NextResponse.json({
    data: {
      ...policy,
      publishDate: policy.publishDate.toISOString().split("T")[0],
    },
  });
}

// DELETE /api/policies/[id] — 删除政策
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.policy.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
