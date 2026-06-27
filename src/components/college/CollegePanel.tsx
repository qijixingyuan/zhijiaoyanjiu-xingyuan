"use client";

import { useState, useEffect } from "react";
import { CollegeDetail, PolicyItem } from "@/types";
import { PROVINCES } from "@/lib/china-geo";
import CollegeDetailModal from "./CollegeDetailModal";

interface CollegePanelProps {
  province: string | null;
}

const NATURE_OPTS = ["", "公办", "民办", "中外合作办学"];
const HONOR_OPTS = ["", "双高A类", "双高B类", "国家示范", "国家骨干", "省级示范"];

export default function CollegePanel({ province }: CollegePanelProps) {
  const [search, setSearch] = useState("");
  const [fProvince, setFProvince] = useState("");
  const [fNature, setFNature] = useState("");
  const [fHonor, setFHonor] = useState("");
  const [colleges, setColleges] = useState<{ id: string; name: string; nature: string; city: string | null; level: string; honors: { category: string }[] }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [relatedPolicies, setRelatedPolicies] = useState<PolicyItem[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // ── loadColleges MUST be declared BEFORE any useEffect that calls it ──
  const loadColleges = (query: string, isProvince: boolean) => {
    if (!query) { setColleges([]); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (isProvince) params.set("province", query);
    else params.set("keyword", query);
    if (fProvince) { params.set("province", fProvince); isProvince = true; }
    if (fNature) params.set("nature", fNature);
    if (fHonor) params.set("honorCategory", fHonor);
    params.set("limit", "50");
    fetch(`/api/colleges?${params}`)
      .then((r) => r.json())
      .then((json) => { setColleges(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // ── useEffects — declared AFTER loadColleges ──

  // When province prop changes (from map click), auto-search
  useEffect(() => {
    if (province) { setSearch(province); loadColleges(province, true); }
  }, [province]);

  // When user types in search box
  useEffect(() => {
    if (search && search !== province) { loadColleges(search, false); }
  }, [search]);

  // When filters change, re-search (province filter works independently)
  useEffect(() => {
    if (fProvince) {
      loadColleges(fProvince, true);
    } else if (search) {
      loadColleges(search, province ? search === province : false);
    }
  }, [fProvince, fNature, fHonor]);

  // Load detail
  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    fetch(`/api/colleges/${selectedId}`)
      .then((r) => r.json())
      .then((json) => { setDetail(json.error ? null : json); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [selectedId]);

  // Load related policies when detail changes
  useEffect(() => {
    if (!detail) return;
    setPoliciesLoading(true);
    const params = new URLSearchParams({ keyword: detail.name.substring(0, 4), limit: "20" });
    fetch(`/api/policies?${params}`)
      .then((r) => r.json())
      .then((json) => { setRelatedPolicies(json.data || []); setPoliciesLoading(false); })
      .catch(() => setPoliciesLoading(false));
  }, [detail]);

  const hasShuanggao = (h: { category: string }[]) => h?.some((c) => c.category.startsWith("双高"));

  const handleCloseModal = () => setSelectedId(null);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Compact Filters Only */}
      <div className="w-[220px] border-r border-[#D8E2F0] bg-white flex flex-col flex-shrink-0">
        <div className="p-2.5 space-y-2">
          <input
            type="text" placeholder="搜索院校…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#D8E2F0] rounded px-2.5 py-1.5 text-xs font-sans text-[#1A2742] outline-none"
          />
          <select value={fProvince} onChange={(e) => setFProvince(e.target.value)}
            className="w-full border border-[#D8E2F0] rounded px-2 py-1 text-[11px] text-[#1A2742] bg-white font-sans">
            <option value="">全部省份</option>
            {PROVINCES.filter(p => !["香港特别行政区","澳门特别行政区","台湾省"].includes(p)).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={fNature} onChange={(e) => setFNature(e.target.value)}
            className="w-full border border-[#D8E2F0] rounded px-2 py-1 text-[11px] text-[#1A2742] bg-white font-sans">
            <option value="">全部性质</option>
            {NATURE_OPTS.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={fHonor} onChange={(e) => setFHonor(e.target.value)}
            className="w-full border border-[#D8E2F0] rounded px-2 py-1 text-[11px] text-[#1A2742] bg-white font-sans">
            <option value="">全部荣誉</option>
            {HONOR_OPTS.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Right: College Results — card list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : colleges.length === 0 ? (
          <div className="text-center py-16 text-[#5A6A85] text-sm">
            {search ? "未找到匹配的院校" : "输入关键词或选择筛选条件查看院校"}
          </div>
        ) : (
          <div className="space-y-2">
            {colleges.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-4 py-3 border border-[#D8E2F0] rounded-lg cursor-pointer hover:border-[#3B82C4] hover:bg-[#F2F5FA] transition-all ${
                  selectedId === c.id && detailLoading ? "border-l-[3px] border-l-[#1A56A0] bg-[#E8EFF8]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[13px] font-semibold text-[#1A2742] truncate flex-1 mr-3">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-[#5A6A85] flex gap-1.5 flex-shrink-0">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                      c.level === "职业本科" ? "bg-cyan-50 text-cyan-700" :
                      c.nature === "公办" ? "bg-[#E8EFF8] text-[#1A56A0]" :
                      "bg-red-50 text-[#C1272D]"
                    }`}>
                      {c.level === "职业本科" ? "职业本科" : c.nature}
                    </span>
                    {hasShuanggao(c.honors) && (
                      <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-red-50 text-[#C1272D]">双高</span>
                    )}
                  </div>
                </div>
                {c.city && (
                  <div className="text-[11px] text-[#5A6A85]">{c.city}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* College Detail Modal — overlay on top of everything */}
      {detail && selectedId && (
        <CollegeDetailModal
          college={detail}
          relatedPolicies={relatedPolicies}
          policiesLoading={policiesLoading}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
