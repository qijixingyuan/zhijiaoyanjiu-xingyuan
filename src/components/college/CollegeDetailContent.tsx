"use client";

import { CollegeDetail, PolicyItem } from "@/types";

const TABS = [
  { key: "info", label: "基本信息" },
  { key: "honors", label: "荣誉头衔" },
  { key: "policies", label: "关联政策" },
  { key: "opinion", label: "舆情评价" },
];

interface Props {
  college: CollegeDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  relatedPolicies: PolicyItem[];
  policiesLoading: boolean;
}

export default function CollegeDetailContent({
  college,
  activeTab,
  onTabChange,
  relatedPolicies,
  policiesLoading,
}: Props) {
  return (
    <div>
      {/* College header */}
      <div className="flex gap-4 items-start mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-[#0C2340] to-[#1A56A0] rounded-[10px] flex items-center justify-center text-white text-[22px] font-extrabold flex-shrink-0 shadow-md">
          {college.name?.substring(college.name.length - 2)}
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0C2340] mb-1.5">{college.name}</h2>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {college.honors?.some((h) => h.category?.startsWith("双高A")) && (
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-50 text-[#C1272D]">双高计划 A类</span>
            )}
            {college.honors?.some((h) => h.category?.startsWith("双高B")) && (
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-orange-50 text-orange-700">双高计划 B类</span>
            )}
            {college.honors?.some((h) => h.category === "国家示范") && (
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700">国家示范性高职</span>
            )}
            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${college.nature === "民办" ? "bg-red-50 text-[#C1272D]" : "bg-green-50 text-green-700"}`}>
              {college.nature}
            </span>
            {college.level === "职业本科" && (
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-cyan-50 text-cyan-700">职业本科</span>
            )}
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
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === t.key ? "bg-white text-[#1A56A0] shadow-sm font-medium" : "text-[#5A6A85] hover:text-[#1A2742]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {([
              ["所在地", college.location],
              ["主管部门", college.supervisor],
              ["办学性质", college.nature],
              ["办学层次", college.level],
              ["官方网站", college.website ? <a href={college.website} target="_blank" rel="noopener" className="text-[#1A56A0] hover:underline">{college.website}</a> : "暂无"],
              ["微信公众号", college.wechatName || "暂无"],
              ["曾用名", college.formerNames ? JSON.parse(college.formerNames).join("、") : "无"],
              ["备注", college.remarks || "无"],
            ] as [string, React.ReactNode][]).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[#5A6A85] mb-1">{label}</dt>
                <dd className="text-[#1A2742]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {activeTab === "honors" && (
        <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
          {college.honors?.length > 0 ? (
            <div className="space-y-3">
              {college.honors.map((h) => (
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
          ) : (
            <p className="text-sm text-[#5A6A85]">暂无荣誉数据</p>
          )}
        </div>
      )}

      {activeTab === "policies" && (
        <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
          {policiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : relatedPolicies.length > 0 ? (
            <div className="space-y-2">
              {relatedPolicies.slice(0, 10).map((p) => (
                <a key={p.id} href={p.url || "#"} target="_blank" rel="noopener"
                  className="block bg-white border border-[#D8E2F0] rounded-lg px-3.5 py-3 hover:border-[#3B82C4] transition-colors">
                  <div className="text-sm font-medium text-[#1A2742] mb-1">{p.title}</div>
                  <div className="flex gap-2 text-xs text-[#5A6A85]">
                    <span>{p.province}</span>
                    <span>{String(p.publishDate)}</span>
                    {p.type && <span className="text-[#1A56A0]">{p.type}</span>}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5A6A85]">暂无关联政策</p>
          )}
        </div>
      )}

      {activeTab === "opinion" && (
        <div className="bg-[#F2F5FA] border border-[#D8E2F0] rounded-lg p-4">
          {college.opinions?.length > 0 ? (
            <div>
              <div className="flex gap-5 items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-[28px] font-extrabold text-[#2D8E7C]">
                    {college.opinions[0]?.overallScore?.toFixed(1)}
                  </div>
                  <div className="text-xs text-[#5A6A85]">综合舆情指数 / 10</div>
                </div>
                <div className="flex-1 space-y-1">
                  {["正面声音", "中性声音", "负面声音"].map((label, i) => {
                    const ratios = [
                      college.opinions[0]?.positiveRatio,
                      college.opinions[0]?.neutralRatio,
                      college.opinions[0]?.negativeRatio,
                    ];
                    const colors = ["bg-[#2D8E7C]", "bg-[#D97706]", "bg-[#C1272D]"];
                    return (
                      <div key={label}>
                        <div className="text-[11px] text-[#5A6A85] mb-0.5">{label}</div>
                        <div className="h-1.5 bg-[#D8E2F0] rounded">
                          <div className={`h-1.5 ${colors[i]} rounded`} style={{ width: `${(ratios[i] || 0) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[11px] text-[#5A6A85] text-right">微博/知乎/贴吧<br />小红书/B站</div>
              </div>
              {college.opinions[0]?.sampleComments && typeof college.opinions[0].sampleComments === "string" && (
                <div className="space-y-2">
                  {JSON.parse(college.opinions[0].sampleComments).map((c: any, i: number) => (
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
          ) : (
            <p className="text-sm text-[#5A6A85]">暂无舆情数据</p>
          )}
        </div>
      )}
    </div>
  );
}
