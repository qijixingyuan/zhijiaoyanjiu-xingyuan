"use client";

import { useState, useEffect } from "react";

interface ProvinceStatus {
  province: string;
  count: number;
  dateFrom: string | null;
  dateTo: string | null;
  sources: string[];
  status: "success" | "partial" | "empty";
}

interface CrawlStatus {
  total: number;
  provinceCount: number;
  dateFrom: string | null;
  dateTo: string | null;
  provinces: ProvinceStatus[];
  crawlerSources: { total: number; working: number; broken: number };
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  success: { icon: "✅", label: "正常", color: "text-green-600" },
  partial: { icon: "⚠️", label: "不足", color: "text-yellow-600" },
  empty: { icon: "❌", label: "无数据", color: "text-red-500" },
};

export default function PolicyCrawlProgress() {
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("全部");

  useEffect(() => {
    fetch("/api/policies/crawl-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  if (!status) return null;

  const pct = status.crawlerSources.total > 0
    ? Math.round((status.crawlerSources.working / status.crawlerSources.total) * 100)
    : 0;

  const filtered = filter === "全部"
    ? status.provinces
    : status.provinces.filter((p) => {
        if (filter === "✅正常") return p.status === "success";
        if (filter === "⚠️不足") return p.status === "partial";
        if (filter === "❌无数据") return p.status === "empty";
        return true;
      });

  return (
    <>
      {/* Compact bar */}
      <div
        className="flex items-center gap-3 px-3 py-2 bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg cursor-pointer hover:border-[#1A56A0] transition-colors"
        onClick={() => setOpen(true)}
      >
        <span className="text-xs">📊</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[#1A2742]">
            政策爬取进度 · 覆盖 <b>{status.provinceCount}/31</b> 省 · <b>{status.total}</b> 条 ·{" "}
            <span className={status.crawlerSources.broken > 0 ? "text-yellow-600" : "text-green-600"}>
              {status.crawlerSources.working}/{status.crawlerSources.total} 源正常
            </span>
          </div>
          <div className="h-1.5 bg-[#D8E2F0] rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#1A56A0] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(pct, 3)}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-[#5A6A85]">{pct}%</span>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-xl shadow-2xl w-[720px] max-h-[80vh] flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#0C2340]">政策爬取详情</h2>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="px-5 py-3 border-b border-[#F0F4F9] flex-shrink-0">
              <div className="flex gap-4 text-[11px] text-[#5A6A85]">
                <span>总政策: <b className="text-[#1A2742]">{status.total}</b></span>
                <span>覆盖省份: <b className="text-[#1A2742]">{status.provinceCount}/31</b></span>
                <span>时间段: <b className="text-[#1A2742]">{status.dateFrom || "—"} ~ {status.dateTo || "—"}</b></span>
                <span>爬虫源:{" "}
                  <b className={status.crawlerSources.broken > 0 ? "text-yellow-600" : "text-green-600"}>
                    {status.crawlerSources.working}/{status.crawlerSources.total} 正常
                  </b>
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-1 px-5 py-2 flex-shrink-0">
              {["全部", "✅正常", "⚠️不足", "❌无数据"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                    filter === f ? "bg-[#1A56A0] text-white" : "bg-[#F2F5FA] text-[#5A6A85] hover:bg-gray-200"
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Province table */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-[#D8E2F0]">
                    <th className="text-left py-2 text-[#5A6A85] font-medium w-24">省份</th>
                    <th className="text-center py-2 text-[#5A6A85] font-medium w-12">数量</th>
                    <th className="text-left py-2 text-[#5A6A85] font-medium w-36">时间段</th>
                    <th className="text-left py-2 text-[#5A6A85] font-medium">来源</th>
                    <th className="text-center py-2 text-[#5A6A85] font-medium w-16">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const cfg = STATUS_CONFIG[p.status];
                    return (
                      <tr key={p.province} className="border-b border-[#F0F4F9] hover:bg-[#F2F5FA]">
                        <td className="py-2 font-medium text-[#1A2742]">{p.province}</td>
                        <td className="py-2 text-center font-bold text-[#1A56A0]">{p.count}</td>
                        <td className="py-2 text-[#5A6A85]">
                          {p.dateFrom ? `${p.dateFrom} ~ ${p.dateTo}` : "—"}
                        </td>
                        <td className="py-2 text-[#5A6A85] truncate max-w-[180px]" title={p.sources.join(", ")}>
                          {p.sources.slice(0, 2).join(", ") || "—"}
                          {p.sources.length > 2 && ` +${p.sources.length - 2}`}
                        </td>
                        <td className={`py-2 text-center font-medium ${cfg.color}`}>
                          {cfg.icon}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-[#5A6A85] text-xs">无匹配省份</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
