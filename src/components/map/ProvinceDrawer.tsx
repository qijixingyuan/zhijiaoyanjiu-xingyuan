"use client";

import { useState, useEffect, useMemo } from "react";
import { CollegeListItem } from "@/types";

interface ProvinceDrawerProps {
  province: string;
  colleges: CollegeListItem[];
  loading: boolean;
  onClose: () => void;
}

const FILTER_BTNS = [
  { key: "all", label: "全部" },
  { key: "zhiyeBenke", label: "职业本科" },
  { key: "public", label: "公办" },
  { key: "private", label: "民办" },
  { key: "shuanggao", label: "双高" },
] as const;

const PAGE_SIZE = 20;

export default function ProvinceDrawer({ province, colleges, loading, onClose }: ProvinceDrawerProps) {
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => { setFilter("all"); setPage(1); }, [province]);

  const filtered = useMemo(() => {
    let result = colleges;
    switch (filter) {
      case "zhiyeBenke": result = result.filter(c => c.level === "职业本科"); break;
      case "public": result = result.filter(c => c.nature === "公办" && c.level !== "职业本科"); break;
      case "private": result = result.filter(c => c.nature === "民办"); break;
      case "shuanggao": result = result.filter(c => c.honors?.some(h => h.category.startsWith("双高"))); break;
    }
    return result;
  }, [colleges, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      data-drawer
      className={`absolute right-0 top-0 bottom-0 w-[620px] bg-white/80 backdrop-blur-md border-l border-[#D8E2F0] shadow-2xl flex flex-col z-30 transition-transform duration-300 ${province ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8E2F0] flex-shrink-0">
        <div>
          <h3 className="text-base font-bold text-[#0C2340]">{province}</h3>
          <p className="text-xs text-[#5A6A85]">
            {loading ? "加载中..." : `${colleges.length} 所院校`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#5A6A85] text-sm"
        >
          ✕
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1.5 px-5 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
        {FILTER_BTNS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              filter === f.key ? "bg-[#1A56A0] text-white" : "bg-gray-100 text-[#5A6A85] hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* College list */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#5A6A85]">无匹配院校</div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {paged.map((c) => (
              <a
                key={c.id}
                href={`/college/${c.id}`}
                target="_blank"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/80 transition-colors group min-w-0"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  c.level === "职业本科" ? "bg-cyan-500" : c.nature === "公办" ? "bg-green-500" : c.nature === "民办" ? "bg-orange-500" : "bg-purple-500"
                }`} />
                <span className="text-[13px] text-[#1A2742] group-hover:text-[#1A56A0] truncate flex-1 min-w-0">{c.name}</span>
                {c.level === "职业本科" && <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-50 text-cyan-700 shrink-0 hidden lg:inline">本科</span>}
                {c.honors?.some(h => h.category.startsWith("双高")) && <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 text-purple-700 shrink-0 hidden lg:inline">双高</span>}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <span className="text-[10px] text-[#5A6A85]">共 {filtered.length} 所</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="px-2 py-0.5 text-[10px] border rounded disabled:opacity-30">上一页</button>
            <span className="px-2 py-0.5 text-[10px] text-[#5A6A85]">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              className="px-2 py-0.5 text-[10px] border rounded disabled:opacity-30">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
