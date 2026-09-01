"use client";

import { useEffect, useState } from "react";
import { PolicyItem } from "@/types";
import { TYPE_CLASSES, TYPE_LABELS, TYPE_ORDER, splitTags, normalizeTag, getTypeLabel } from "@/lib/policy-types";

interface PolicyModalProps {
  policy: PolicyItem | null;
  onClose: () => void;
  onUpdated?: (updated: PolicyItem) => void;
  onEdit?: (policy: PolicyItem) => void;
  onDeleted?: (id: string) => void;
}

export default function PolicyModal({ policy, onClose, onUpdated, onEdit, onDeleted }: PolicyModalProps) {
  const [editing, setEditing] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Close on ESC（编辑态时先退出编辑）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editing) setEditing(false);
      else onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, editing]);

  // 弹窗关闭时重置编辑态
  useEffect(() => {
    setEditing(false);
    setSaveError("");
  }, [policy?.id]);

  if (!policy) return null;

  const handleStartEdit = () => {
    setDraftTags(splitTags(policy.tags).length > 0 ? splitTags(policy.tags) : (normalizeTag(policy.type) ? [normalizeTag(policy.type)!] : []));
    setEditing(true);
    setSaveError("");
  };

  const toggleDraftTag = (t: string) => {
    setDraftTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/policies/${policy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: draftTags }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.data) throw new Error("响应缺少 data");
      onUpdated?.(json.data);
      setEditing(false);
    } catch (err) {
      console.error("PolicyModal save tags:", err);
      setSaveError("保存失败，请重试");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定删除该政策？\n\n${policy.title}\n\n此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/policies/${policy.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDeleted?.(policy.id);
      onClose();
    } catch (err) {
      console.error("PolicyModal delete:", err);
      window.alert("删除失败，请重试");
    }
  };

  const currentTags = splitTags(policy.tags);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 pr-8">{policy.title}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Meta tags + 编辑入口 */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {!editing && currentTags.map((t) => (
              <span key={t} className={`px-2.5 py-1 text-xs rounded-full ${TYPE_CLASSES[t] || "bg-gray-100 text-gray-600"}`}>
                {getTypeLabel(t)}
              </span>
            ))}
            {!editing && currentTags.length === 0 && policy.type && (
              <span className={`px-2.5 py-1 text-xs rounded-full ${TYPE_CLASSES[policy.type] || "bg-gray-100 text-gray-600"}`}>
                {getTypeLabel(policy.type)}
              </span>
            )}
            {policy.province && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{policy.province}</span>
            )}
            {policy.publishDate && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">📅 {policy.publishDate}</span>
            )}
            {!editing && (
              <button
                onClick={handleStartEdit}
                className="px-2.5 py-1 text-xs rounded-full border border-dashed border-[#3B82C4] text-[#1A56A0] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                ✏️ 编辑标签
              </button>
            )}
            {!editing && onEdit && (
              <button
                onClick={() => onEdit(policy)}
                className="px-2.5 py-1 text-xs rounded-full border border-dashed border-[#10B981] text-[#065F46] hover:bg-green-50 transition-colors cursor-pointer"
              >
                📝 编辑信息
              </button>
            )}
            {!editing && onDeleted && (
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 text-xs rounded-full border border-dashed border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                🗑 删除
              </button>
            )}
          </div>

          {/* 编辑态面板 */}
          {editing && (
            <div className="mb-4 p-3 bg-[#F8FAFD] border border-[#D8E2F0] rounded-lg">
              <div className="text-xs font-semibold text-[#0C2340] mb-2">
                当前标签（点击删除）:
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                {draftTags.length === 0 && <span className="text-[11px] text-[#5A6A85]">（无标签）</span>}
                {draftTags.map((t) => (
                  <span key={t} className={`px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 ${TYPE_CLASSES[t] || "bg-gray-100 text-gray-600"}`}>
                    {getTypeLabel(t)}
                    <button onClick={() => toggleDraftTag(t)} className="cursor-pointer opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
              <div className="text-xs font-semibold text-[#0C2340] mb-2">
                添加标签（最多 4 个）:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_ORDER.filter((t) => !draftTags.includes(t)).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleDraftTag(t)}
                    disabled={draftTags.length >= 4}
                    className="px-2 py-0.5 text-[11px] rounded-full border border-[#D8E2F0] text-[#5A6A85] hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    + {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              {saveError && <div className="text-[11px] text-red-500 mt-2">{saveError}</div>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3.5 py-1.5 text-xs rounded bg-[#1A56A0] text-white font-semibold cursor-pointer hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3.5 py-1.5 text-xs rounded border border-[#D8E2F0] text-[#5A6A85] cursor-pointer hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Detail fields */}
          <dl className="space-y-3 text-sm">
            {policy.department && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">发文部门</dt>
                <dd className="text-gray-800">{policy.department}</dd>
              </div>
            )}
            {policy.docNumber && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">发文字号</dt>
                <dd className="text-gray-800">{policy.docNumber}</dd>
              </div>
            )}
            {policy.sourceOrg && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">来源机构</dt>
                <dd className="text-gray-800">{policy.sourceOrg}</dd>
              </div>
            )}
            {policy.summary && (
              <div className="flex">
                <dt className="w-20 text-gray-500 shrink-0">政策摘要</dt>
                <dd className="text-gray-700 leading-relaxed">{policy.summary}</dd>
              </div>
            )}
          </dl>

          {/* Links */}
          <div className="mt-6 space-y-2">
            {policy.url && (
              <a
                href={policy.url}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看原文链接
              </a>
            )}
            {policy.downloadUrl && (
              <a
                href={policy.downloadUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载政策文件
              </a>
            )}
            {!policy.url && !policy.downloadUrl && (
              <p className="text-sm text-gray-400 text-center py-4">暂无原文链接和下载链接</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
