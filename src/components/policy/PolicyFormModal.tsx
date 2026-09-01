"use client";

// 政策表单弹窗 — 新增（POST）/ 编辑（PATCH）共用
// 标签编辑复用 12 类 chips 交互（点选/删除，上限 4）

import { useEffect, useState } from "react";
import { PolicyItem } from "@/types";
import { PROVINCES } from "@/lib/china-geo";
import { TYPE_CLASSES, TYPE_LABELS, TYPE_ORDER, splitTags, normalizeTag, getTypeLabel } from "@/lib/policy-types";

interface PolicyFormModalProps {
  mode: "create" | "edit";
  policy?: PolicyItem | null;
  onClose: () => void;
  onSaved: (p: PolicyItem, isNew: boolean) => void;
}

export default function PolicyFormModal({ mode, policy, onClose, onSaved }: PolicyFormModalProps) {
  const [title, setTitle] = useState("");
  const [province, setProvince] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [department, setDepartment] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 初始化（edit 模式从 policy 填充）
  useEffect(() => {
    if (mode === "edit" && policy) {
      setTitle(policy.title);
      setProvince(policy.province);
      setPublishDate(policy.publishDate);
      setDepartment(policy.department || "");
      setSummary(policy.summary || "");
      setUrl(policy.url || "");
      const t = splitTags(policy.tags);
      setTags(t.length > 0 ? t : (normalizeTag(policy.type) ? [normalizeTag(policy.type)!] : []));
    }
  }, [mode, policy]);

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("请填写标题"); return; }
    if (!province) { setError("请选择省份"); return; }
    if (!publishDate) { setError("请选择发布日期"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { title: title.trim(), province, publishDate, department: department.trim(), summary: summary.trim(), url: url.trim(), tags };
      const isNew = mode === "create";
      const res = await fetch(isNew ? "/api/policies" : `/api/policies/${policy!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.data) throw new Error("响应缺少 data");
      onSaved(json.data, isNew);
      onClose();
    } catch (err) {
      console.error("PolicyFormModal save:", err);
      setError(err instanceof Error ? err.message : "保存失败，请重试");
    }
    setSaving(false);
  };

  const inputCls = "w-full border border-[#D8E2F0] rounded px-2.5 py-1.5 text-xs text-[#1A2742] font-sans outline-none focus:border-[#3B82C4]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">{mode === "create" ? "新增政策" : "编辑政策"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">标题 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="政策文件标题" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">省份 *</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls}>
                <option value="">选择省份</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                <option value="全国">全国</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">发布日期 *</label>
              <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">发文部门</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="如: 湖南省教育厅" className={inputCls} />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">政策摘要</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="政策内容摘要（可选）" className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5A6A85] block mb-1">原文链接</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputCls} />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#5A6A85] block mb-1.5">主题标签（2-4 个，第一个为主标签）</label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
              {tags.length === 0 && <span className="text-[11px] text-[#5A6A85]">（未选择，将标记为 M-其他）</span>}
              {tags.map((t) => (
                <span key={t} className={`px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 ${TYPE_CLASSES[t] || "bg-gray-100 text-gray-600"}`}>
                  {getTypeLabel(t)}
                  <button onClick={() => toggleTag(t)} className="cursor-pointer opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_ORDER.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  disabled={tags.length >= 4}
                  className="px-2 py-0.5 text-[11px] rounded-full border border-[#D8E2F0] text-[#5A6A85] hover:bg-white disabled:opacity-40 cursor-pointer"
                >
                  + {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-[11px] text-red-500">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-1.5 text-xs rounded border border-[#D8E2F0] text-[#5A6A85] cursor-pointer hover:bg-gray-50">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-1.5 text-xs rounded bg-[#1A56A0] text-white font-semibold cursor-pointer hover:bg-[#1D4ED8] disabled:opacity-60">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
