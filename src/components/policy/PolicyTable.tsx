"use client";

import { useState, useEffect } from "react";
import { PolicyItem } from "@/types";
import PolicyModal from "./PolicyModal";

interface PolicyTableProps {
  filters: Record<string, string>;
}

const TYPE_COLORS: Record<string, string> = {
  "发展规划": "bg-blue-50 text-blue-700",
  "经费保障": "bg-green-50 text-green-700",
  "专业设置": "bg-orange-50 text-orange-700",
  "质量评估": "bg-purple-50 text-purple-700",
  "招生就业": "bg-cyan-50 text-cyan-700",
  "对口援助": "bg-pink-50 text-pink-700",
};

export default function PolicyTable({ filters }: PolicyTableProps) {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PolicyItem | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.province) params.set("province", filters.province);
    if (filters.type) params.set("type", filters.type);
    if (filters.yearFrom) params.set("yearFrom", filters.yearFrom);
    if (filters.yearTo) params.set("yearTo", filters.yearTo);
    if (filters.keyword) params.set("keyword", filters.keyword);
    params.set("page", String(page));
    params.set("limit", "20");

    fetch(`/api/policies?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setPolicies(json.data || []);
        setTotal(json.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters, page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-[35%]">政策标题</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">省份</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">发文部门</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">发布日期</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">加载中...</td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">暂无政策数据</td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelected(policy)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 hover:text-blue-700">{policy.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{policy.province}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{policy.department || policy.sourceOrg || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${TYPE_COLORS[policy.type] || "bg-gray-50 text-gray-600"}`}>
                        {policy.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{policy.publishDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">共 {total} 条</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <PolicyModal policy={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
