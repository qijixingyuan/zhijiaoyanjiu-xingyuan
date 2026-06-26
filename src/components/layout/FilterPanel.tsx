"use client";

import { PROVINCES, NATURE_TYPES } from "@/lib/china-geo";

interface FilterPanelProps {
  filters: Record<string, string>;
  onChange: (updates: Record<string, string>) => void;
  showProvince?: boolean;
  showNature?: boolean;
  showSupervisor?: boolean;
  showHonor?: boolean;
  showType?: boolean;
  showYearRange?: boolean;
  showKeyword?: boolean;
}

const POLICY_TYPES = ["发展规划", "经费保障", "专业设置", "质量评估", "招生就业", "对口援助"];
const HONOR_CATEGORIES = ["双高A类", "双高B类", "国家示范", "国家骨干", "省级示范", "现代学徒制试点", "1+X试点"];

export default function FilterPanel({
  filters,
  onChange,
  showProvince,
  showNature,
  showSupervisor,
  showHonor,
  showType,
  showYearRange,
  showKeyword,
}: FilterPanelProps) {
  const handleChange = (key: string, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {showProvince && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">省份</label>
            <select
              value={filters.province || ""}
              onChange={(e) => handleChange("province", e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="">全部</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        {showNature && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">性质</label>
            <select
              value={filters.nature || ""}
              onChange={(e) => handleChange("nature", e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="">全部</option>
              {NATURE_TYPES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {showSupervisor && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">主管部门</label>
            <select
              value={filters.supervisor || ""}
              onChange={(e) => handleChange("supervisor", e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="">全部</option>
              <option value="教育部">教育部</option>
              <option value="省教育厅">省教育厅</option>
              <option value="省其他厅局">省其他厅局</option>
              <option value="市属">市属</option>
            </select>
          </div>
        )}

        {showHonor && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">质量标签</label>
            <select
              value={filters.honorCategory || ""}
              onChange={(e) => handleChange("honorCategory", e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="">全部</option>
              {HONOR_CATEGORIES.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        )}

        {showType && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">政策类型</label>
            <select
              value={filters.type || ""}
              onChange={(e) => handleChange("type", e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="">全部</option>
              {POLICY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {showYearRange && (
          <>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">年份从</label>
              <input
                type="number"
                value={filters.yearFrom || ""}
                onChange={(e) => handleChange("yearFrom", e.target.value)}
                placeholder="2020"
                className="text-sm border border-gray-300 rounded px-2 py-1 w-20"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">至</label>
              <input
                type="number"
                value={filters.yearTo || ""}
                onChange={(e) => handleChange("yearTo", e.target.value)}
                placeholder="2026"
                className="text-sm border border-gray-300 rounded px-2 py-1 w-20"
              />
            </div>
          </>
        )}

        {showKeyword && (
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 whitespace-nowrap">关键词</label>
            <input
              type="text"
              value={filters.keyword || ""}
              onChange={(e) => handleChange("keyword", e.target.value)}
              placeholder="搜索标题或摘要..."
              className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
