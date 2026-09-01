"use client";

// 维度 2: 省份政策活跃度 — 条形图排名 + 地图热力

import ReactECharts from "echarts-for-react";
import { ProvinceView } from "@/lib/policy-analysis";
import PolicyChinaHeatmap from "./PolicyChinaHeatmap";

interface Props {
  view: ProvinceView;
  nationalCount: number;
}

export default function ProvinceActivity({ view, nationalCount }: Props) {
  if (!view || view.ranking.length === 0) {
    return (
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-8 text-center">
        <p className="text-sm text-[#5A6A85]">暂无政策数据，无法生成省份活跃度分析</p>
      </div>
    );
  }

  const top10 = view.ranking.slice(0, 10);

  const barOption = {
    title: {
      text: "各省政策发布量 TOP 10",
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      formatter: (params: any) => `${params[0]?.name}: ${params[0]?.value} 条`,
    },
    grid: { left: 90, right: 30, top: 40, bottom: 25 },
    xAxis: { type: "value" as const, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: "category" as const,
      data: top10.map((d) => d.province).reverse(),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar" as const,
        data: top10.map((d) => d.count).reverse(),
        barMaxWidth: 18,
        itemStyle: { color: "#1A56A0", borderRadius: [0, 2, 2, 0] },
        label: { show: true, position: "right" as const, fontSize: 10, color: "#5A6A85" },
      },
    ],
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
        <ReactECharts option={barOption} style={{ height: "440px" }} notMerge lazyUpdate />
      </div>
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
        <div className="text-center text-[13px] font-bold text-[#0C2340] mb-1">省级政策发布热力分布</div>
        <PolicyChinaHeatmap mapData={view.mapData} nationalCount={nationalCount} />
      </div>
    </div>
  );
}
