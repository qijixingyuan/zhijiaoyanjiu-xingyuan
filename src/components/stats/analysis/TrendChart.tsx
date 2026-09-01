"use client";

// 维度 1: 政策演进趋势 — 按年 × 类型堆叠面积图

import ReactECharts from "echarts-for-react";
import { TrendView } from "@/lib/policy-analysis";
import { TYPE_COLORS } from "@/lib/policy-types";

export default function TrendChart({ view }: { view: TrendView }) {
  if (!view || view.years.length === 0 || view.series.length === 0) {
    return <EmptyTip text="暂无政策数据，无法生成演进趋势" />;
  }

  const option = {
    title: {
      text: "政策演进趋势（按年 × 类型）",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      formatter: (params: any) => {
        const lines = params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value} 条`);
        return `${params[0]?.axisValue} 年<br/>${lines.join("<br/>")}`;
      },
    },
    legend: {
      bottom: 0,
      type: "scroll" as const,
      textStyle: { fontSize: 11 },
    },
    grid: { left: 50, right: 30, top: 50, bottom: 45 },
    xAxis: {
      type: "category" as const,
      data: view.years.map((y) => `${y}`),
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11 },
      name: "条数",
      nameTextStyle: { fontSize: 11, color: "#5A6A85" },
    },
    series: view.series.map((s) => ({
      name: s.name,
      type: "line" as const,
      stack: "total",
      smooth: true,
      areaStyle: { opacity: 0.25 },
      emphasis: { focus: "series" as const },
      itemStyle: { color: TYPE_COLORS[s.type] || "#94A3B8" },
      lineStyle: { width: 1.5 },
      data: s.data,
    })),
  };

  return (
    <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
      <ReactECharts option={option} style={{ height: "420px" }} notMerge lazyUpdate />
      <p className="text-[11px] text-[#5A6A85] mt-2">
        * 堆叠面积按多标签口径统计：一条政策可计入多个类型，各类型计数之和 ≥ 政策总数。
      </p>
    </div>
  );
}

function EmptyTip({ text }: { text: string }) {
  return (
    <div className="bg-white border border-[#D8E2F0] rounded-lg p-8 text-center">
      <p className="text-sm text-[#5A6A85]">{text}</p>
    </div>
  );
}
