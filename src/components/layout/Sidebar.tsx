"use client";

import { PROVINCES } from "@/lib/china-geo";

interface SidebarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  stats: { total: number; publicCount: number; privateCount: number; zhiyeBenkeCount: number; shuanggaoCount: number };
  provinceRanking: { province: string; count: number }[];
}

const NATURE_CHIPS = [
  { key: "", label: "全部" },
  { key: "公办", label: "公办", className: "" },
  { key: "民办", label: "民办", className: "!border-red-200 !text-[#C1272D] !bg-red-50" },
  { key: "中外合作办学", label: "合作", className: "" },
];

const HONOR_CHIPS = [
  { key: "", label: "全部" },
  { key: "双高A类", label: "双高A类" },
  { key: "双高B类", label: "双高B类" },
  { key: "国家示范", label: "国家示范" },
  { key: "国家骨干", label: "骨干高职" },
  { key: "省级示范", label: "省级示范" },
];

const SUPERVISOR_CHIPS = [
  { key: "", label: "全部" },
  { key: "省教育厅", label: "省级教育厅" },
  { key: "教育部", label: "部委直属" },
];

export default function Sidebar({ filters, onFilterChange, stats, provinceRanking }: SidebarProps) {
  const handleChip = (key: string, value: string) => {
    onFilterChange(key, value);
  };

  return (
    <aside className="w-[236px] bg-white border-r border-[#D8E2F0] flex flex-col overflow-y-auto flex-shrink-0">
      {/* Filters section */}
      <div className="border-b border-[#D8E2F0] px-4 py-3.5">
        <div className="text-[10px] font-bold tracking-[1px] text-[#5A6A85] uppercase mb-2.5">筛选维度</div>

        {/* Province */}
        <div className="mb-3">
          <div className="text-[11px] text-[#5A6A85] mb-1.5 font-semibold">省份 / 地区</div>
          <select
            value={filters.province || ""}
            onChange={(e) => handleChip("province", e.target.value)}
            className="w-full px-2 py-1.5 border border-[#D8E2F0] rounded text-xs text-[#1A2742] bg-white font-sans"
          >
            <option value="">全部省份</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Nature */}
        <div className="mb-3">
          <div className="text-[11px] text-[#5A6A85] mb-1.5 font-semibold">举办性质</div>
          <div className="flex flex-wrap gap-1.5">
            {NATURE_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => handleChip("nature", c.key)}
                className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                  (filters.nature || "") === c.key
                    ? "bg-[#1A56A0] text-white border-[#1A56A0]"
                    : `bg-[#E8EFF8] border-[#D8E2F0] text-[#1A2742] hover:border-[#3B82C4] ${c.className || ""}`
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Supervisor */}
        <div className="mb-3">
          <div className="text-[11px] text-[#5A6A85] mb-1.5 font-semibold">主管部门</div>
          <div className="flex flex-wrap gap-1.5">
            {SUPERVISOR_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => handleChip("supervisor", c.key)}
                className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                  (filters.supervisor || "") === c.key
                    ? "bg-[#1A56A0] text-white border-[#1A56A0]"
                    : "bg-[#E8EFF8] border-[#D8E2F0] text-[#1A2742] hover:border-[#3B82C4]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Honor tags */}
        <div className="mb-3">
          <div className="text-[11px] text-[#5A6A85] mb-1.5 font-semibold">质量认定标签</div>
          <div className="flex flex-wrap gap-1.5">
            {HONOR_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => handleChip("honorCategory", c.key)}
                className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                  (filters.honorCategory || "") === c.key
                    ? "bg-[#1A56A0] text-white border-[#1A56A0]"
                    : "bg-[#E8EFF8] border-[#D8E2F0] text-[#1A2742] hover:border-[#3B82C4]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="border-b border-[#D8E2F0] px-4 py-3.5">
        <div className="text-[10px] font-bold tracking-[1px] text-[#5A6A85] uppercase mb-2.5">当前筛选结果</div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-[22px] font-extrabold text-[#0C2340]">{stats.total}</span>
          <span className="text-[11px] text-[#5A6A85]">所</span>
        </div>
        <div className="text-[11px] text-[#5A6A85] mb-3">符合条件的高职专科院校</div>
        <div className="flex gap-4">
          <div>
            <div className="text-base font-bold text-[#1A56A0]">{stats.publicCount}</div>
            <div className="text-[10px] text-[#5A6A85] mt-0.5">公办</div>
          </div>
          <div>
            <div className="text-base font-bold text-[#1A56A0]">{stats.privateCount}</div>
            <div className="text-[10px] text-[#5A6A85] mt-0.5">民办</div>
          </div>
          <div>
            <div className="text-base font-bold text-[#1A56A0]">{stats.zhiyeBenkeCount}</div>
            <div className="text-[10px] text-[#5A6A85] mt-0.5">职业本科</div>
          </div>
        </div>
      </div>

      {/* Province ranking */}
      <div className="flex-1 px-4 py-3.5 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-[1px] text-[#5A6A85] uppercase mb-2.5">省份排名（院校数）</div>
        <div className="flex flex-col gap-1">
          {provinceRanking.map((p) => (
            <div
              key={p.province}
              className="flex items-center justify-between py-1 cursor-pointer"
              onClick={() => handleChip("province", p.province)}
            >
              <span className="text-xs hover:text-[#1A56A0]">{p.province}</span>
              <div className="flex-1 mx-2 h-1 bg-[#E8EFF8] rounded-sm">
                <div
                  className="h-1 bg-[#3B82C4] rounded-sm"
                  style={{ width: `${Math.min(100, (p.count / (provinceRanking[0]?.count || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-[#5A6A85] min-w-6 text-right">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
