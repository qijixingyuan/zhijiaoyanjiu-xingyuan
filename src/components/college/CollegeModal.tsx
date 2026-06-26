"use client";

import { useState, useMemo, useEffect } from "react";
import { CollegeListItem } from "@/types";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "zhiyeBenke", label: "职业本科" },
  { key: "public", label: "公办" },
  { key: "private", label: "民办" },
  { key: "shuanggao", label: "双高" },
] as const;

const PAGE_SIZE = 30;

export default function CollegeModal({
  province,
  colleges,
  loading,
  onClose,
}: {
  province: string;
  colleges: CollegeListItem[];
  loading: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Reset filter and page when province changes
  useEffect(() => {
    setFilter("all");
    setPage(1);
  }, [province]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = colleges;
    switch (filter) {
      case "zhiyeBenke":
        result = result.filter((c) => c.level === "职业本科");
        break;
      case "public":
        result = result.filter((c) => c.nature === "公办" && c.level !== "职业本科");
        break;
      case "private":
        result = result.filter((c) => c.nature === "民办");
        break;
      case "shuanggao":
        result = result.filter((c) => c.honors?.some((h) => h.category.startsWith("双高")));
        break;
    }
    return result;
  }, [colleges, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[720px] max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{province}</h2>
            <p className="text-sm text-gray-500">
              {loading ? "加载中..." : `${colleges.length} 所院校`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-gray-100 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              无匹配院校
            </div>
          ) : (
            <div className="space-y-1">
              {paged.map((c) => (
                <a
                  key={c.id}
                  href={`/college/${c.id}`}
                  target="_blank"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  {/* Nature dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      c.level === "职业本科"
                        ? "bg-cyan-500"
                        : c.nature === "公办"
                        ? "bg-green-500"
                        : c.nature === "民办"
                        ? "bg-orange-500"
                        : "bg-purple-500"
                    }`}
                  />

                  {/* Name */}
                  <span className="text-sm text-gray-800 group-hover:text-blue-700 truncate flex-1">
                    {c.name}
                  </span>

                  {/* Badges */}
                  {c.level === "职业本科" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 shrink-0">
                      职业本科
                    </span>
                  )}
                  {c.nature !== "公办" && c.level !== "职业本科" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 shrink-0">
                      {c.nature}
                    </span>
                  )}
                  {c.honors?.some((h) => h.category.startsWith("双高")) && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 shrink-0">
                      双高
                    </span>
                  )}

                  {/* City */}
                  <span className="text-xs text-gray-400 w-16 text-right shrink-0 truncate">
                    {c.city || c.location}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-xs text-gray-400">共 {filtered.length} 所</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-2 py-1 text-xs text-gray-500">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
