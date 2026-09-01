"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { GeoData } from "@/types";
import { useChinaGeo } from "@/lib/use-china-geo";

interface ChinaMapProps {
  data: GeoData[];
  viewMode: "province" | "city";
  onProvinceClick?: (province: string) => void;
  onBackToProvince?: () => void;
}

// 台湾、香港、澳门在GeoJSON中有但通常不在地图交互范围内
const EXCLUDED_PROVINCES = new Set(["台湾省", "香港特别行政区", "澳门特别行政区"]);

export default function ChinaMap({ data, viewMode, onProvinceClick, onBackToProvince }: ChinaMapProps) {
  // GeoJSON 加载 + 全局 registerMap（共享 hook，模块级缓存防重复 fetch）
  const { geoLoaded, retry } = useChinaGeo();

  // Build option (memoized to avoid unnecessary ReactECharts re-renders)
  const option = useMemo(() => {
    // GeoJSON uses Chinese province names — match them directly
    const mapData = data.map((d) => ({
      name: d.province,
      value: d.count,
    }));
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return {
      tooltip: {
        trigger: "item" as const,
        formatter: (params: { name?: string; value?: number }) => {
          if (!params.name) return "";
          const geoItem = data.find((d) => d.province === params.name);
          if (!geoItem) return `${params.name}: ${params.value || 0} 所`;
          return `<strong>${params.name}</strong><br/>
            院校总数: ${geoItem.count}<br/>
            公办: ${geoItem.publicCount} | 民办: ${geoItem.privateCount} | 中外合作: ${geoItem.cooperationCount}<br/>
            双高院校: ${geoItem.shuanggaoCount}`;
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: true,
        inRange: { color: ["#bfdbfe", "#3b82f6", "#1e3a8a"] },
        text: ["高", "低"],
        textStyle: { color: "#666" },
      },
      series: [
        {
          type: "map" as const,
          map: "china",
          roam: true,
          zoom: 1.2,
          top: 20,
          label: { show: true, color: "#333", fontSize: 10 },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: "bold" as const },
            itemStyle: { areaColor: "#fbbf24" },
          },
          data: mapData,
        },
      ],
    };
  }, [data]);

  const onEvents = useMemo(() => ({
    click: (params: { name?: string }) => {
      if (viewMode === "province" && params.name && onProvinceClick) {
        // params.name is Chinese province name from GeoJSON (e.g. "湖南省")
        if (!EXCLUDED_PROVINCES.has(params.name)) {
          onProvinceClick(params.name);
        }
      }
    },
    dblclick: () => {
      if (viewMode === "city" && onBackToProvince) {
        onBackToProvince();
      }
    },
  }), [viewMode, onProvinceClick, onBackToProvince]);

  // Loading state
  if (geoLoaded === null) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center h-[550px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">加载地图数据...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (geoLoaded === false) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center h-[550px]">
        <div className="text-center">
          <p className="text-red-500 mb-3">地图数据加载失败</p>
          <button onClick={retry} className="text-sm text-blue-600 hover:underline">重试</button>
        </div>
      </div>
    );
  }

  // geoLoaded === true: map registered globally, safely use option with map:"china"
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ height: "550px", width: "100%" }}
        notMerge
        lazyUpdate
      />
      {viewMode === "city" && (
        <div className="text-center mt-2">
          <button
            onClick={onBackToProvince}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 返回全国视图
          </button>
        </div>
      )}
    </div>
  );
}
