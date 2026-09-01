"use client";

// 维度 4: 发文主体分析 — 部门分组饼图 + 联合发文检测列表

import ReactECharts from "echarts-for-react";
import { DepartmentView } from "@/lib/policy-analysis";

interface Props {
  view: DepartmentView;
  total: number;
}

export default function DepartmentAnalysis({ view, total }: Props) {
  if (!view || view.stats.length === 0) {
    return (
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-8 text-center">
        <p className="text-sm text-[#5A6A85]">暂无政策数据，无法生成发文主体分析</p>
      </div>
    );
  }

  const top8 = view.stats.slice(0, 8);
  const otherCount = view.stats.slice(8).reduce((s, d) => s + d.count, 0);
  const pieData = [
    ...top8.map((d) => ({ name: d.department, value: d.count })),
    ...(otherCount > 0 ? [{ name: "其他", value: otherCount }] : []),
  ];

  const pieOption = {
    title: {
      text: "发文主体分布",
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} 条 ({d}%)" },
    legend: {
      bottom: 0,
      type: "scroll" as const,
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        type: "pie" as const,
        radius: ["38%", "62%"],
        center: ["50%", "46%"],
        label: { formatter: "{b}\n{c} 条", fontSize: 10 },
        data: pieData,
      },
    ],
  };

  const jointRatio = total > 0 ? ((view.jointCount / total) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
        <ReactECharts option={pieOption} style={{ height: "420px" }} notMerge lazyUpdate />
      </div>

      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4 overflow-y-auto">
        <div className="text-[13px] font-bold text-[#0C2340] mb-1">联合发文检测</div>
        <p className="text-[11px] text-[#5A6A85] mb-3">
          检测到 <span className="font-bold text-[#1A56A0]">{view.jointCount}</span> 份联合发文（占 {jointRatio}%），
          以下为样本（最多 50 条）:
        </p>
        {view.jointDocs.length === 0 ? (
          <p className="text-[11px] text-[#5A6A85]">未检测到联合发文</p>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {view.jointDocs.map((doc) => (
              <div key={doc.id} className="border border-[#F0F4F9] rounded p-2.5 hover:bg-[#F8FAFD]">
                <div className="text-[12px] font-medium text-[#1A2742] leading-snug mb-1.5">{doc.title}</div>
                <div className="flex flex-wrap gap-1 items-center">
                  {doc.departments.map((dep, i) => (
                    <span key={i} className="text-[10px] bg-[#E8EFF8] text-[#1A56A0] px-1.5 py-0.5 rounded-sm">
                      {dep}
                    </span>
                  ))}
                  <span className="text-[10px] text-[#5A6A85] ml-auto">{doc.publishDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-[#9AA8BC] mt-3">
          * 判定规则: 发文部门字段多机构分隔，或标题中提取 ≥2 个机构名（XX厅/XX委/XX局）。缺失部门记录归入「未标注」。
        </p>
      </div>
    </div>
  );
}
