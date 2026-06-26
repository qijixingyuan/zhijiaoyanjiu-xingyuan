"use client";

import { useState } from "react";
import PolicyTable from "@/components/policy/PolicyTable";
import FilterPanel from "@/components/layout/FilterPanel";

export default function PolicyPage() {
  const [filters, setFilters] = useState({
    province: "",
    type: "",
    yearFrom: "",
    yearTo: "",
    keyword: "",
  });
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">省级政策数据库</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 text-sm rounded ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}
          >
            表格视图
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1 text-sm rounded ${viewMode === "timeline" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"}`}
          >
            时间轴
          </button>
        </div>
      </div>
      <FilterPanel
        filters={filters}
        onChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        showProvince
        showType
        showYearRange
        showKeyword
      />
      <PolicyTable filters={filters} />
    </div>
  );
}
