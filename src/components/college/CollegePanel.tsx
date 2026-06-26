"use client";

import { useState, useEffect } from "react";
import { CollegeDetail, PolicyItem } from "@/types";
import { PROVINCES } from "@/lib/china-geo";

interface CollegePanelProps {
  province: string | null;
}

const TABS = [
  { key: "info", label: "基本信息" },
  { key: "honors", label: "荣誉头衔" },
  { key: "policies", label: "关联政策" },
  { key: "opinion", label: "舆情评价" },
] as const;

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
  const [activeTab, setActiveTab] = useState<string>("info");

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

  // When filters change, re-search
  useEffect(() => {
    if (search) loadColleges(search, province ? search === province : false);
  }, [fProvince, fNature, fHonor]);

  // Load detail
  useEffect(() => {
    if (!selectedId) return;
    setActiveTab("info");
    setDetailLoading(true);
    fetch(`/api/colleges/${selectedId}`)
      .then((r) => r.json())
      .then((json) => { setDetail(json); setDetailLoading(false); })
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Search + College List */}
      <div className="w-[260px] border-r border-[#D8E2F0] bg-white flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-2.5 border-b border-[#D8E2F0] flex-shrink-0 space-y-2">
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
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : colleges.length === 0 ? (
            <p className="text-xs text-[#5A6A85] text-center py-10">输入关键词搜索院校</p>
          ) : (
            colleges.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                className={`px-3.5 py-2.5 border-b border-[#F0F4F9] cursor-pointer hover:bg-[#F2F5FA] ${selectedId === c.id ? "bg-[#E8EFF8] border-l-[3px] border-l-[#1A56A0]" : "border-l-[3px] border-l-transparent"}`}>
                <div className="text-[13px] font-semibold text-[#1A2742] mb-0.5 truncate">{c.name}</div>
                <div className="text-[11px] text-[#5A6A85] flex gap-1.5 flex-wrap">
                  <span className={`px-1 py-0.5 rounded-sm text-[10px] ${c.level === "职业本科" ? "bg-cyan-50 text-cyan-700" : c.nature === "公办" ? "bg-[#E8EFF8] text-[#1A56A0]" : "bg-red-50 text-[#C1272D]"}`}>
                    {c.level === "职业本科" ? "职业本科" : c.nature}
                  </span>
                  {hasShuanggao(c.honors) && <span className="px-1 py-0.5 rounded-sm text-[10px] bg-red-50 text-[#C1272D]">双高</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Tab Detail */}
      <div className="flex-1 overflow-y-auto">
        {!detail ? (
          <div className="text-center py-20 text-[#5A6A85] text-sm">
            {detailLoading ? "加载中..." : province ? `${province} — 选择左侧院校查看详情` : "选择左侧院校查看详情"}
          </div>
        ) : (
          <div className="px-6 py-5">
            {/* College header */}
            <div className="flex gap-4 items-start mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0C2340] to-[#1A56A0] rounded-[10px] flex items-center justify-center text-white text-[22px] font-extrabold flex-shrink-0 shadow-md">
                {detail.name.substring(detail.name.length - 2)}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0C2340] mb-1.5">{detail.name}</h2>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {detail.honors?.some((h) => h.category.startsWith("双高A")) && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-50 text-[#C1272D]">双高计划 A类</span>}
                  {detail.honors?.some((h) => h.category.startsWith("双高B")) && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-orange-50 text-orange-700">双高计划 B类</span>}
                  {detail.honors?.some((h) => h.category === "国家示范") && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700">国家示范性高职</span>}
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${detail.nature === "民办" ? "bg-red-50 text-[#C1272D]" : "bg-green-50 text-green-700"}`}>{detail.nature}</span>
                  {detail.level === "职业本科" && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-cyan-50 text-cyan-700">职业本科</span>}
                </div>
                <div className="text-xs text-[#5A6A85] flex gap-3">
                  <span>📍 {detail.location}</span>
                  <span>🏷 标识码：{detail.id}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === t.key ? "bg-white text-[#1A56A0] shadow-sm font-medium" : "text-[#5A6A85] hover:text-[#1A2742]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "info" && (
              <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["所在地", detail.location], ["主管部门", detail.supervisor],
                    ["办学性质", detail.nature], ["办学层次", detail.level],
                    ["官方网站", detail.website ? <a href={detail.website} target="_blank" className="text-[#1A56A0] hover:underline">{detail.website}</a> : "暂无"],
                    ["微信公众号", detail.wechatName || "暂无"],
                    ["曾用名", detail.formerNames ? JSON.parse(detail.formerNames).join("、") : "无"],
                    ["备注", detail.remarks || "无"],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-[#5A6A85] mb-1">{label}</dt>
                      <dd className="text-[#1A2742]">{value as React.ReactNode}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {activeTab === "honors" && (
              <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
                {detail.honors?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.honors.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 pl-4 border-l-2 border-[#1A56A0]">
                        <div>
                          <div className="text-sm text-[#1A2742]">{h.title}</div>
                          <div className="text-xs text-[#5A6A85] mt-0.5">
                            {h.category && <span className="px-1.5 py-0.5 rounded bg-white border border-[#D8E2F0] mr-2">{h.category}</span>}
                            {h.year && `${h.year}年`}
                            {h.batch && ` · ${h.batch}`}
                            {h.source && ` · ${h.source}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-[#5A6A85]">暂无荣誉数据</p>}
              </div>
            )}

            {activeTab === "policies" && (
              <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
                {policiesLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : relatedPolicies.length > 0 ? (
                  <div className="space-y-2">
                    {relatedPolicies.slice(0, 10).map((p) => (
                      <a key={p.id} href={p.url || "#"} target="_blank"
                        className="block bg-white border border-[#D8E2F0] rounded-lg px-3.5 py-3 hover:border-[#3B82C4] transition-colors">
                        <div className="text-sm font-medium text-[#1A2742] mb-1">{p.title}</div>
                        <div className="flex gap-2 text-xs text-[#5A6A85]">
                          <span>{p.province}</span>
                          <span>{p.publishDate}</span>
                          {p.type && <span className="text-[#1A56A0]">{p.type}</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : <p className="text-sm text-[#5A6A85]">暂无关联政策</p>}
              </div>
            )}

            {activeTab === "opinion" && (
              <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
                {detail.opinions?.length > 0 ? (
                  <div>
                    <div className="flex gap-5 items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="text-[28px] font-extrabold text-[#2D8E7C]">{detail.opinions[0]?.overallScore?.toFixed(1)}</div>
                        <div className="text-xs text-[#5A6A85]">综合舆情指数 / 10</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        {["正面声音", "中性声音", "负面声音"].map((label, i) => {
                          const ratios = [detail.opinions[0]?.positiveRatio, detail.opinions[0]?.neutralRatio, detail.opinions[0]?.negativeRatio];
                          const colors = ["bg-[#2D8E7C]", "bg-[#D97706]", "bg-[#C1272D]"];
                          return (
                            <div key={label}>
                              <div className="text-[11px] text-[#5A6A85] mb-0.5">{label}</div>
                              <div className="h-1.5 bg-[#D8E2F0] rounded"><div className={`h-1.5 ${colors[i]} rounded`} style={{ width: `${(ratios[i] || 0) * 100}%` }} /></div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[11px] text-[#5A6A85] text-right">微博/知乎/贴吧<br/>小红书/B站</div>
                    </div>
                    {detail.opinions[0]?.sampleComments && typeof detail.opinions[0].sampleComments === "string" && (
                      <div className="space-y-2">
                        {JSON.parse(detail.opinions[0].sampleComments).map((c: any, i: number) => (
                          <div key={i} className="bg-white border border-[#D8E2F0] rounded-md px-3 py-2 text-xs">
                            <div className="text-[#5A6A85] mb-1">{c.platform}</div>
                            <div className="text-[#1A2742]">{c.text}</div>
                            <div className={`mt-1 ${c.sentiment === "positive" ? "text-green-600" : c.sentiment === "negative" ? "text-red-600" : "text-gray-500"}`}>
                              {c.sentiment === "positive" ? "正面" : c.sentiment === "negative" ? "负面" : "中性"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : <p className="text-sm text-[#5A6A85]">暂无舆情数据</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
