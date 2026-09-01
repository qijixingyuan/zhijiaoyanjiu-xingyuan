"use client";

// 维度 5: 政策密集度时序 — 月份 × 年份热力图 + 月度总量柱状图（识别发布季节规律）

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { CalendarView } from "@/lib/policy-analysis";
import { TYPE_LABELS, TYPE_ORDER, TYPE_COLORS } from "@/lib/policy-types";

export default function CalendarHeatmap({ view }: { view: CalendarView }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (!view || view.data.length === 0) {
    return (
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-8 text-center">
        <p className="text-sm text-[#5A6A85]">暂无政策数据，无法生成密集度时序</p>
      </div>
    );
  }

  const years = [...view.years].sort((a, b) => a - b);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 前端本地过滤类型
  const filtered = useMemo(
    () => (typeFilter === "all" ? view.data : view.data.filter((d) => d.type === typeFilter)),
    [view.data, typeFilter]
  );

  // 热力数据: [yearIndex, monthIndex, count]
  const cellMap = new Map<string, number>();
  for (const d of filtered) {
    const key = `${d.year}-${d.month}`;
    cellMap.set(key, (cellMap.get(key) || 0) + d.count);
  }
  const heatData = Array.from(cellMap.entries()).map(([key, count]) => {
    const [y, m] = key.split("-").map(Number);
    return [years.indexOf(y), m - 1, count] as [number, number, number];
  });

  const maxCell = Math.max(...heatData.map((d) => d[2]), 1);

  const heatOption = {
    title: {
      text: `政策密集度时序（${typeFilter === "all" ? "全部类型" : TYPE_LABELS[typeFilter] || typeFilter}）`,
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      position: "top" as const,
      formatter: (params: any) => {
        const [xi, yi, v] = params.value;
        return `${years[xi]} 年 ${yi + 1} 月: ${v} 条`;
      },
    },
    grid: { left: 50, right: 30, top: 45, bottom: 25 },
    xAxis: {
      type: "category" as const,
      data: years.map(String),
      axisLabel: { fontSize: 11 },
      splitArea: { show: true },
    },
    yAxis: {
      type: "category" as const,
      data: months.map((m) => `${m}月`),
      axisLabel: { fontSize: 11 },
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxCell,
      calculable: true,
      orient: "vertical" as const,
      right: 0,
      top: "center",
      inRange: { color: ["#f0f9ff", "#7dd3fc", "#1d4ed8"] },
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        type: "heatmap" as const,
        data: heatData,
        label: { show: true, fontSize: 9, formatter: (p: any) => (p.value[2] > 0 ? String(p.value[2]) : "") },
        itemStyle: { borderColor: "#fff", borderWidth: 1 },
      },
    ],
  };

  const monthBarOption = {
    title: {
      text: "月度发布总量（识别季节规律）",
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: any) => `${params[0]?.name}: ${params[0]?.value} 条`,
    },
    grid: { left: 40, right: 20, top: 40, bottom: 25 },
    xAxis: {
      type: "category" as const,
      data: months.map((m) => `${m}月`),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: "value" as const, axisLabel: { fontSize: 10 } },
    series: [
      {
        type: "bar" as const,
        data: months.map((m) => view.monthTotal.find((t) => t.month === m)?.count || 0),
        barMaxWidth: 20,
        itemStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#60a5fa" },
              { offset: 1, color: "#1e40af" },
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
        {/* 类型过滤 */}
        <div className="flex gap-1.5 items-center flex-wrap mb-2">
          <span className="text-[11px] text-[#5A6A85] mr-1">类型:</span>
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1 text-[11px] rounded-full cursor-pointer ${typeFilter === "all" ? "bg-[#0C2340] text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}
          >
            全部
          </button>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              className={`px-2.5 py-1 text-[11px] rounded-full cursor-pointer ${typeFilter === t ? "text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}
              style={typeFilter === t ? { backgroundColor: TYPE_COLORS[t] } : undefined}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <ReactECharts option={heatOption} style={{ height: "340px" }} notMerge lazyUpdate />
        <p className="text-[11px] text-[#5A6A85] mt-2">
          * 部分条目日期为爬取日期而非发布日期，季节性结论仅供参考。
        </p>
      </div>

      <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
        <ReactECharts option={monthBarOption} style={{ height: "260px" }} notMerge lazyUpdate />
      </div>
    </div>
  );
}
