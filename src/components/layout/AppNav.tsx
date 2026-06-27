"use client";


const TABS = [
  { key: "map", label: "院校分布地图", icon: "🗺" },
  { key: "policy", label: "政策数据库", icon: "📄" },
  { key: "college", label: "院校详情", icon: "🏫" },
  { key: "stats", label: "统计后台", icon: "📊" },
];

export default function AppNav({ activeTab, onTabChange, counts }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: { total: number; zhiyeBenke: number };
}) {
  return (
    <header className="bg-[#0C2340] flex items-center h-[52px] px-5 gap-0 flex-shrink-0">
      {/* Logo */}
      <div className="text-white text-[15px] font-bold tracking-wide mr-8 flex items-center gap-2 cursor-pointer" onClick={() => onTabChange("map")}>
        <div className="w-2 h-2 bg-[#C1272D] rounded-full" />
        高职政策研究平台
      </div>

      {/* Nav Tabs */}
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-[18px] h-[52px] flex items-center cursor-pointer text-[13px] tracking-wide border-b-[3px] transition-all duration-150 gap-1.5 ${
            activeTab === tab.key
              ? "text-white border-[#C1272D]"
              : "text-white/60 border-transparent hover:text-white"
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}

      {/* Right badges */}
      <div className="ml-auto flex gap-2 items-center">
        <span className="bg-white/10 text-white text-[11px] px-2 py-0.5 rounded-[10px]">
          数据截至 2026-06-17
        </span>
        <span className="bg-white/10 text-white text-[11px] px-2 py-0.5 rounded-[10px]">
          {counts.total} 所高职院校
        </span>
      </div>
    </header>
  );
}
