"use client";

// 政策热力地图 — 复用 useChinaGeo 共享加载（与院校 ChinaMap 同源注册，无冲突）

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useChinaGeo } from "@/lib/use-china-geo";

interface Props {
  mapData: { province: string; count: number }[];
  nationalCount: number;
}

export default function PolicyChinaHeatmap({ mapData, nationalCount }: Props) {
  const { geoLoaded, retry } = useChinaGeo();

  const option = useMemo(() => {
    const maxCount = Math.max(...mapData.map((d) => d.count), 1);
    return {
      tooltip: {
        trigger: "item" as const,
        formatter: (params: { name?: string; value?: number }) =>
          `${params.name || ""}: ${params.value || 0} 条政策`,
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: true,
        inRange: { color: ["#e0f2fe", "#60a5fa", "#1e40af"] },
        text: ["多", "少"],
        textStyle: { color: "#5A6A85", fontSize: 11 },
        left: 10,
        bottom: 10,
      },
      series: [
        {
          type: "map" as const,
          map: "china",
          roam: false,
          zoom: 1.1,
          top: 15,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: "bold" as const },
            itemStyle: { areaColor: "#fbbf24" },
          },
          data: mapData.map((d) => ({ name: d.province, value: d.count })),
        },
      ],
    };
  }, [mapData]);

  if (geoLoaded === null) {
    return (
      <div className="flex items-center justify-center h-[420px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (geoLoaded === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[420px] gap-3">
        <p className="text-sm text-red-500">地图数据加载失败</p>
        <button onClick={retry} className="text-xs text-blue-600 hover:underline">重试</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <ReactECharts option={option} style={{ height: "420px" }} notMerge lazyUpdate />
      {/* 固定标注（overlay 不拦截地图事件: pointer-events-none） */}
      <div className="absolute top-2 right-3 pointer-events-none text-[11px] text-[#5A6A85]">
        全国级政策 {nationalCount} 条未入图
      </div>
    </div>
  );
}
