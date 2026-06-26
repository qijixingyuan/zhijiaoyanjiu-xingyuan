"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CollegeDetail, PolicyItem } from "@/types";

const TABS = [
  { key: "info", label: "基本信息" },
  { key: "honors", label: "荣誉头衔" },
  { key: "policies", label: "关联政策" },
  { key: "opinion", label: "舆情评价" },
];

export default function CollegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/colleges/${id}`)
      .then((r) => r.json())
      .then((data) => { setCollege(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!college) return;
    setPoliciesLoading(true);
    fetch(`/api/policies?keyword=${encodeURIComponent(college.name.substring(0, 4))}&limit=20`)
      .then((r) => r.json())
      .then((json) => { setPolicies(json.data || []); setPoliciesLoading(false); })
      .catch(() => setPoliciesLoading(false));
  }, [college]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!college) {
    return <div className="text-center py-20 text-[#5A6A85] text-sm">院校未找到</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <a href="/" onClick={(e) => { e.preventDefault(); window.history.back(); }}
          className="text-sm text-[#1A56A0] hover:underline">← 返回</a>
      </div>

      {/* Header */}
      <div className="flex gap-4 items-start mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-[#0C2340] to-[#1A56A0] rounded-[10px] flex items-center justify-center text-white text-[22px] font-extrabold flex-shrink-0 shadow-md">
          {college.name.substring(college.name.length - 2)}
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-[#0C2340] mb-1.5">{college.name}</h1>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {college.honors?.some((h) => h.category?.startsWith("双高A")) && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-50 text-[#C1272D]">双高计划 A类</span>}
            {college.honors?.some((h) => h.category?.startsWith("双高B")) && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-orange-50 text-orange-700">双高计划 B类</span>}
            {college.honors?.some((h) => h.category === "国家示范") && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700">国家示范性高职</span>}
            {college.level === "职业本科" && <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-cyan-50 text-cyan-700">职业本科</span>}
            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${college.nature === "民办" ? "bg-red-50 text-[#C1272D]" : "bg-green-50 text-green-700"}`}>{college.nature}</span>
          </div>
          <div className="text-xs text-[#5A6A85] flex gap-3">
            <span>📍 {college.location}</span>
            <span>🏷 标识码：{college.id}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${tab === t.key ? "bg-white text-[#1A56A0] shadow-sm font-medium" : "text-[#5A6A85] hover:text-[#1A2742]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["所在地", college.location], ["主管部门", college.supervisor],
              ["办学性质", college.nature], ["办学层次", college.level],
              ["官方网站", college.website ? <a href={college.website} target="_blank" rel="noopener" className="text-[#1A56A0] hover:underline">{college.website}</a> : "暂无"],
              ["微信公众号", college.wechatName || "暂无"],
              ["曾用名", college.formerNames ? JSON.parse(college.formerNames).join("、") : "无"],
              ["备注", college.remarks || "无"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[#5A6A85] mb-1">{label}</dt>
                <dd className="text-[#1A2742]">{value as React.ReactNode}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {tab === "honors" && (
        <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
          {college.honors?.length > 0 ? (
            <div className="space-y-3">
              {college.honors.map((h) => (
                <div key={h.id} className="flex items-center gap-3 pl-4 border-l-2 border-[#1A56A0]">
                  <div>
                    <div className="text-sm text-[#1A2742]">{h.title}</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">
                      {h.category && <span className="px-1.5 py-0.5 rounded bg-gray-100 border mr-2">{h.category}</span>}
                      {h.year && `${h.year}年`}{h.batch && ` · ${h.batch}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[#5A6A85]">暂无荣誉数据</p>}
        </div>
      )}

      {tab === "policies" && (
        <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
          {policiesLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : policies.length > 0 ? (
            <div className="space-y-2">
              {policies.slice(0, 10).map((p) => (
                <div key={p.id} className="block border rounded-lg px-3.5 py-3">
                  <div className="text-sm font-medium text-[#1A2742] mb-1">{p.title}</div>
                  <div className="flex gap-2 text-xs text-[#5A6A85]">
                    <span>{p.province}</span><span>{p.publishDate}</span>
                    {p.type && <span className="text-[#1A56A0]">{p.type}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[#5A6A85]">暂无关联政策</p>}
        </div>
      )}

      {tab === "opinion" && (
        <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
          {college.opinions?.length > 0 ? (
            <div>
              <div className="flex gap-5 items-start mb-4">
                <div className="text-[28px] font-extrabold text-[#2D8E7C]">{college.opinions[0]?.overallScore?.toFixed(1)}</div>
                <div className="text-xs text-[#5A6A85]">综合舆情指数 / 10</div>
                <div className="flex-1 space-y-1">
                  {["正面声音", "中性声音", "负面声音"].map((label, i) => {
                    const ratios = [college.opinions[0]?.positiveRatio, college.opinions[0]?.neutralRatio, college.opinions[0]?.negativeRatio];
                    const colors = ["bg-[#2D8E7C]", "bg-[#D97706]", "bg-[#C1272D]"];
                    return (
                      <div key={label}>
                        <div className="text-[11px] text-[#5A6A85] mb-0.5">{label}</div>
                        <div className="h-1.5 bg-[#D8E2F0] rounded"><div className={`h-1.5 ${colors[i]} rounded`} style={{ width: `${(ratios[i] || 0) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-[#5A6A85]">暂无舆情数据</p>}
        </div>
      )}
    </div>
  );
}
