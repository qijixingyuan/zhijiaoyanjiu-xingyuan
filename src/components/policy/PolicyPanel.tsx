"use client";

import { useState, useEffect } from "react";
import { PolicyItem } from "@/types";
import PolicyModal from "./PolicyModal";
import PolicyCrawlProgress from "./PolicyCrawlProgress";
import { PROVINCES } from "@/lib/china-geo";

const POLICY_TYPES = ["全部", "发展规划", "经费保障", "专业设置", "质量评估", "招生就业", "对口援助"];

const TYPE_CLASSES: Record<string, string> = {
  "A-治理体系": "bg-[#FEF3C7] text-[#92400E]", "B-产教融合": "bg-[#FEE2E2] text-[#991B1B]",
  "C-人才培养": "bg-[#D1FAE5] text-[#065F46]", "D-专业建设": "bg-[#DBEAFE] text-[#1D4ED8]",
  "E-师资队伍": "bg-[#EDE9FE] text-[#5B21B6]", "F-质量评价": "bg-[#FCE7F3] text-[#9D174D]",
  "G-招生就业": "bg-[#FFF7ED] text-[#C2410C]", "H-经费投入": "bg-[#ECFDF5] text-[#065F46]",
  "I-数字化": "bg-[#EFF6FF] text-[#1D4ED8]", "J-国际化": "bg-[#F0FDF4] text-[#15803D]",
  "K-乡村振兴": "bg-[#FFFBEB] text-[#A16207]", "L-职业本科": "bg-[#FAF5FF] text-[#7E22CE]",
};

const TYPE_LABELS: Record<string, string> = {
  "A-治理体系": "治理体系", "B-产教融合": "产教融合", "C-人才培养": "人才培养",
  "D-专业建设": "专业建设", "E-师资队伍": "师资队伍", "F-质量评价": "质量评价",
  "G-招生就业": "招生就业", "H-经费投入": "经费投入", "I-数字化": "数字化",
  "J-国际化": "国际化", "K-乡村振兴": "乡村振兴", "L-职业本科": "职业本科",
};

interface SmartFilter {
  province: string | null;
  yearFrom: string | null;
  yearTo: string | null;
  types: string[];
  keywords: string;
  explanation: string;
}

interface PolicyPanelProps {
  filters: Record<string, string>;
}

export default function PolicyPanel({ filters }: PolicyPanelProps) {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selProvince, setSelProvince] = useState("");
  const [selType, setSelType] = useState("");
  const [selYear, setSelYear] = useState("");
  const [selected, setSelected] = useState<PolicyItem | null>(null);

  // Smart search state
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResult, setNlResult] = useState<SmartFilter | null>(null);
  const [nlError, setNlError] = useState("");

  // Standard filter search
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selProvince) params.set("province", selProvince);
    if (selType) params.set("type", selType);
    if (selYear) params.set("yearFrom", selYear);
    if (filters.keyword) params.set("keyword", filters.keyword);
    params.set("page", String(page));
    params.set("limit", "20");

    fetch(`/api/policies?${params}`)
      .then((r) => r.json())
      .then((json) => { setPolicies(json.data || []); setTotal(json.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selProvince, selType, selYear, filters.keyword, page]);

  // Smart search
  const handleSmartSearch = async () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    setNlError("");
    try {
      const res = await fetch("/api/policies/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlQuery.trim() }),
      });
      const json = await res.json();
      if (json.error) { setNlError(json.error); setNlResult(null); }
      else { setNlResult(json.filters); setPolicies(json.data || []); setTotal(json.total || 0); }
    } catch {
      setNlError("智能分析请求失败");
    }
    setNlLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-[#D8E2F0] flex-shrink-0">
        <h1 className="text-base font-bold text-[#0C2340] mb-1">高职（专科）政策数据库</h1>
        <p className="text-xs text-[#5A6A85] mb-3">自动爬取各省教育厅官网，覆盖 2021 年至今的省级高职政策文件</p>

        {/* Crawl progress bar */}
        <div className="mb-3">
          <PolicyCrawlProgress />
        </div>

        {/* Smart search bar */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center bg-[#F2F5FA] border border-[#D8E2F0] rounded px-3 py-1.5 gap-2">
            <span className="text-xs">💬</span>
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSmartSearch()}
              placeholder="自然语言搜索，如：去年广东关于产教融合的政策有哪些"
              className="border-none bg-transparent text-xs font-sans text-[#1A2742] outline-none w-full"
            />
          </div>
          <button
            onClick={handleSmartSearch}
            disabled={nlLoading}
            className="bg-[#1A56A0] text-white border-none rounded px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {nlLoading ? "分析中..." : "智能分析"}
          </button>
        </div>

        {/* LLM parsed chips */}
        {nlResult && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[11px] text-[#5A6A85]">💡 {nlResult.explanation}</span>
            {nlResult.province && (
              <span className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700">
                {nlResult.province}
              </span>
            )}
            {nlResult.yearFrom && (
              <span className="px-2 py-0.5 text-[11px] rounded bg-green-50 text-green-700">
                {nlResult.yearFrom}{nlResult.yearTo ? `-${nlResult.yearTo}` : ""}
              </span>
            )}
            {nlResult.types.map((t) => (
              <span key={t} className="px-2 py-0.5 text-[11px] rounded bg-purple-50 text-purple-700">
                {TYPE_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}
        {nlError && (
          <div className="text-[11px] text-red-500 mb-2">{nlError}</div>
        )}

        {/* Traditional filters (fallback / fine-tuning) */}
        <div className="flex gap-2 flex-wrap items-center">
          <select value={selProvince} onChange={(e) => { setSelProvince(e.target.value); setPage(1); }}
            className="border border-[#D8E2F0] rounded px-2.5 py-1.5 text-xs text-[#1A2742] bg-white font-sans">
            <option value="">全部省份</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={selYear} onChange={(e) => { setSelYear(e.target.value); setPage(1); }}
            className="border border-[#D8E2F0] rounded px-2.5 py-1.5 text-xs text-[#1A2742] bg-white font-sans">
            <option value="">全部年份</option>
            {[2026, 2025, 2024, 2023, 2022, 2021].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-[11px] text-[#5A6A85] ml-1">类型:</span>
          <div className="flex gap-1 flex-wrap">
            {Object.entries(TYPE_LABELS).map(([k, v]) => {
              const cls = TYPE_CLASSES[k] || "bg-gray-100 text-gray-600";
              return (
                <button key={k} onClick={() => { setSelType(selType === k ? "" : k); setPage(1); }}
                  className={`px-2 py-0.5 text-[11px] rounded-full whitespace-nowrap transition-colors ${
                    selType === k ? "bg-[#1A56A0] text-white" : cls
                  }`}>{v}</button>
              );
            })}
          </div>
          <button className="bg-[#F2F5FA] border border-[#D8E2F0] rounded px-3.5 py-1.5 text-xs text-[#5A6A85] cursor-pointer">
            ⬇ 批量下载
          </button>
        </div>
      </div>

      {/* Policy Cards — 2 column grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-[#5A6A85] text-sm">暂无政策数据</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {policies.map((policy) => {
              const d = new Date(policy.publishDate);
              return (
                <div key={policy.id}
                  className="bg-white border border-[#D8E2F0] rounded-lg p-3 flex gap-2.5 items-start cursor-pointer hover:shadow-md hover:border-[#3B82C4] transition-all min-w-0"
                  onClick={() => setSelected(policy)}>
                  <div className="text-[11px] text-[#5A6A85] min-w-[50px] pt-0.5 text-center flex-shrink-0">
                    <div className="text-base font-bold text-[#1A56A0]">{d.getDate()}</div>
                    <div className="text-[11px] text-[#5A6A85]">{d.getFullYear()}-{String(d.getMonth() + 1).padStart(2, "0")}</div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-[13px] font-semibold text-[#1A2742] mb-1 leading-snug truncate">{policy.title}</div>
                    <div className="flex gap-1 items-center flex-wrap mb-1">
                      <span className="text-[11px] bg-[#E8EFF8] px-1.5 py-0.5 rounded-sm text-[#1A56A0] shrink-0">{policy.province}</span>
                      {policy.type && <span className={`text-[11px] px-1.5 py-0.5 rounded-sm shrink-0 ${TYPE_CLASSES[policy.type] || "bg-gray-100 text-gray-600"}`}>{policy.type}</span>}
                    </div>
                    {policy.summary && <p className="text-[11px] text-[#5A6A85] leading-relaxed line-clamp-2">{policy.summary}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination — always visible */}
        <div className="flex justify-center items-center gap-2 py-4 border-t border-[#D8E2F0] mt-3">
          <span className="text-xs text-[#5A6A85]">共 {total} 条</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">上一页</button>
          <span className="px-2 py-1 text-xs text-[#5A6A85]">{page}/{Math.max(1, Math.ceil(total / 20))}</span>
          <button onClick={() => setPage((p) => Math.min(Math.ceil(total / 20), p + 1))} disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">下一页</button>
        </div>
      </div>

      {selected && <PolicyModal policy={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
