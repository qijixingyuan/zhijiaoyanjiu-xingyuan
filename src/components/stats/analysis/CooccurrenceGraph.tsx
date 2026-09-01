"use client";

// 维度 3: 政策主题共现 — 共现矩阵热力图 / 力导向网络图 双视图切换

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { CooccurView } from "@/lib/policy-analysis";
import { TYPE_COLORS } from "@/lib/policy-types";

export default function CooccurrenceGraph({ view }: { view: CooccurView }) {
  const [mode, setMode] = useState<"matrix" | "graph">("matrix");

  if (!view || view.nodes.length === 0) {
    return (
      <div className="bg-white border border-[#D8E2F0] rounded-lg p-8 text-center">
        <p className="text-sm text-[#5A6A85]">暂无标签数据，请先完成政策标注</p>
      </div>
    );
  }

  const matrixOption = {
    title: {
      text: "政策主题共现矩阵",
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      position: "top" as const,
      formatter: (params: any) => {
        const [x, y] = params.value;
        return `${view.matrix.labels[x]} × ${view.matrix.labels[y]}<br/>共现: ${y === x ? "标签频次" : "共现次数"} ${params.value[2]} 次`;
      },
    },
    grid: { left: 90, right: 30, top: 45, bottom: 80 },
    xAxis: {
      type: "category" as const,
      data: view.matrix.labels,
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: {
      type: "category" as const,
      data: view.matrix.labels,
      axisLabel: { fontSize: 10 },
    },
    visualMap: {
      min: 0,
      max: Math.max(...view.matrix.data.flat(), 1),
      calculable: true,
      orient: "horizontal" as const,
      left: "center",
      bottom: 10,
      inRange: { color: ["#f0f9ff", "#7dd3fc", "#1d4ed8"] },
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        type: "heatmap" as const,
        data: view.matrix.data.flatMap((row, y) =>
          row.map((v, x) => [x, y, v] as [number, number, number])
        ),
        label: { show: true, fontSize: 9, formatter: (p: any) => (p.value[2] > 0 ? String(p.value[2]) : "") },
        itemStyle: { borderColor: "#fff", borderWidth: 1 },
      },
    ],
  };

  const maxCount = Math.max(...view.nodes.map((n) => n.count), 1);
  const maxValue = Math.max(...view.links.map((l) => l.value), 1);
  const graphOption = {
    title: {
      text: "政策主题共现网络",
      left: "center",
      textStyle: { fontSize: 13, fontWeight: 700, color: "#0C2340" },
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === "node") return `${params.data.name}: ${params.data.count} 条`;
        return `${params.data.source} × ${params.data.target}: 共现 ${params.data.value} 次`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10 },
      data: ["主题标签", "共现关系"],
    },
    series: [
      {
        type: "graph" as const,
        layout: "force" as const,
        roam: true,
        label: { show: true, fontSize: 11, position: "right" as const },
        force: { repulsion: 300, edgeLength: [80, 180], gravity: 0.08 },
        edgeSymbol: ["none", "none"] as const,
        lineStyle: { color: "#cbd5e1", curveness: 0.1, opacity: 0.7 },
        data: view.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          value: n.count,
          symbolSize: Math.round(15 + (n.count / maxCount) * 35),
          itemStyle: { color: TYPE_COLORS[n.id] || "#94A3B8" },
        })),
        links: view.links.map((l) => ({
          source: l.source,
          target: l.target,
          value: l.value,
          lineStyle: { width: Math.max(1, (l.value / maxValue) * 5) },
        })),
      },
    ],
  };

  return (
    <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          <button
            onClick={() => setMode("matrix")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${mode === "matrix" ? "bg-[#0C2340] text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}
          >
            共现矩阵
          </button>
          <button
            onClick={() => setMode("graph")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${mode === "graph" ? "bg-[#0C2340] text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}
          >
            网络图
          </button>
        </div>
        <span className="text-[11px] text-[#5A6A85]">
          {mode === "matrix" ? "对角线 = 标签频次；其余格 = 两主题共现次数" : "节点大小 = 标签频次；连线粗细 = 共现强度"}
        </span>
      </div>
      <ReactECharts
        option={mode === "matrix" ? matrixOption : graphOption}
        style={{ height: "420px" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
