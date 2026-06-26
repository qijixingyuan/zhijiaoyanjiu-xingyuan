"use client";

import ReactECharts from "echarts-for-react";
import { CrossStatRow } from "@/types";

interface StatsChartsProps {
  data: CrossStatRow[];
  metrics: string[];
  rowDim: string;
}

const METRIC_LABELS: Record<string, string> = {
  count: "院校数量",
  publicCount: "公办数量",
  privateRatio: "民办占比",
  shuanggaoCount: "双高院校数",
  shuanggaoRatio: "双高占比",
};

const DIM_LABELS: Record<string, string> = {
  province: "省份",
  nature: "办学性质",
  supervisor: "主管部门",
};

export default function StatsCharts({ data, metrics, rowDim }: StatsChartsProps) {
  if (data.length === 0) return null;

  // Top 10 by first metric for bar chart
  const firstMetric = metrics[0];
  const sorted = [...data]
    .sort((a, b) => (b.metrics[firstMetric] || 0) - (a.metrics[firstMetric] || 0))
    .slice(0, 15);

  const dimLabel = DIM_LABELS[rowDim] || rowDim;
  const metricLabel = METRIC_LABELS[firstMetric] || firstMetric;

  const isRatio = firstMetric.endsWith("Ratio");

  const barOption = {
    title: {
      text: `${dimLabel} × ${metricLabel} 排名`,
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold", color: "#374151" },
    },
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>${metricLabel}: ${isRatio ? (p.value * 100).toFixed(1) + "%" : p.value.toLocaleString()}`;
      },
    },
    grid: { left: 140, right: 40, top: 50, bottom: 30 },
    xAxis: {
      type: "value" as const,
      axisLabel: {
        formatter: (v: number) => isRatio ? (v * 100).toFixed(0) + "%" : v >= 10000 ? (v / 10000).toFixed(1) + "万" : String(v),
      },
    },
    yAxis: {
      type: "category" as const,
      data: sorted.map((d) => d.label).reverse(),
      axisLabel: { fontSize: 11 },
      inverse: true,
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.metrics[firstMetric] || 0,
          itemStyle: {
            color: firstMetric === "count"
              ? "#3b82f6"
              : firstMetric === "publicCount"
              ? "#22c55e"
              : firstMetric.includes("private")
              ? "#f97316"
              : firstMetric.includes("shuanggao")
              ? "#a855f7"
              : "#3b82f6",
          },
        })).reverse(),
        barMaxWidth: 30,
      },
    ],
  };

  // Pie chart using the full data (not just top 10)
  const pieData = data.map((d) => ({
    name: d.label,
    value: d.metrics[firstMetric] || 0,
  }));

  const pieOption = {
    title: {
      text: `${dimLabel} × ${metricLabel} 占比`,
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold", color: "#374151" },
    },
    tooltip: {
      trigger: "item" as const,
      formatter: (params: any) => {
        return `${params.name}<br/>${metricLabel}: ${params.value.toLocaleString()} (${params.percent}%)`;
      },
    },
    legend: {
      orient: "vertical" as const,
      left: "left",
      top: 40,
      type: "scroll" as const,
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["35%", "65%"],
        center: ["58%", "55%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
        label: {
          show: true,
          formatter: (params: any) => `${params.name} (${params.percent}%)`,
          fontSize: 10,
        },
        emphasis: {
          label: { fontSize: 14, fontWeight: "bold" },
        },
        data: pieData,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ReactECharts option={barOption} style={{ height: "400px" }} lazyUpdate />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ReactECharts option={pieOption} style={{ height: "400px" }} lazyUpdate />
      </div>
    </div>
  );
}
