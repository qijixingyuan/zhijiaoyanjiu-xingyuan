"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { GeoData, CollegeListItem } from "@/types";
import ProvinceDrawer from "./ProvinceDrawer";

interface MapPanelProps {
  data: GeoData[];
  stats: { total: number; publicCount: number; privateCount: number; zhiyeBenkeCount: number; shuanggaoCount: number };
  filters: Record<string, string>;
  onProvinceClick: (province: string) => void;
}

const EXCLUDED_PROVINCES = new Set(["台湾省", "香港特别行政区", "澳门特别行政区"]);

export default function MapPanel({ data, stats, filters, onProvinceClick }: MapPanelProps) {
  const [geoLoaded, setGeoLoaded] = useState<boolean | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<GeoData | null>(null);
  const chartRef = useRef<ECharts | null>(null);

  // Drawer state
  const [drawerProvince, setDrawerProvince] = useState<string | null>(null);
  const [drawerColleges, setDrawerColleges] = useState<CollegeListItem[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Refs to keep latest values accessible from stable event handlers
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const dataRef = useRef(data);
  dataRef.current = data;
  const onProvinceClickRef = useRef(onProvinceClick);
  onProvinceClickRef.current = onProvinceClick;

  // Load GeoJSON and register map
  useEffect(() => {
    let cancelled = false;
    fetch("/china.json")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        echarts.registerMap("china", json);
        setGeoLoaded(true);
      })
      .catch(() => { if (!cancelled) setGeoLoaded(false); });
    return () => { cancelled = true; };
  }, []);

  // Build chart option
  const option = useMemo(() => {
    const mapData = data.map((d) => ({ name: d.province, value: d.count }));
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    return {
      tooltip: { show: false },
      visualMap: {
        min: 0, max: maxCount, calculable: true,
        inRange: { color: ["#fff5eb", "#fdae61", "#d94801"] },
        text: ["高", "低"], textStyle: { color: "#999" },
        left: 20, bottom: 20,
      },
      series: [{
        type: "map", map: "china", roam: true, zoom: 1.15, top: 50, bottom: 30,
        label: { show: true, color: "#fff", fontSize: 9, textShadowColor: "rgba(0,0,0,0.5)", textShadowBlur: 2 },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: "bold", color: "#fff" },
          itemStyle: { areaColor: "#34d399" },
        },
        data: mapData,
      }],
    };
  }, [data]);

  // Attach events — stable callback, reads latest values from refs
  const handleChartReady = useCallback((instance: ECharts) => {
    chartRef.current = instance;

    instance.off("click");
    instance.off("mouseover");
    instance.off("mouseout");

    instance.on("click", async (params: any) => {
      if (params.name && !EXCLUDED_PROVINCES.has(params.name)) {
        const province = params.name;
        setDrawerProvince(province);
        setDrawerLoading(true);
        try {
          const p = new URLSearchParams({ province, limit: "300" });
          if (filtersRef.current.nature) p.set("nature", filtersRef.current.nature);
          if (filtersRef.current.supervisor) p.set("supervisor", filtersRef.current.supervisor);
          const res = await fetch(`/api/colleges?${p}`);
          const json = await res.json();
          setDrawerColleges(json.data || []);
        } catch { setDrawerColleges([]); }
        setDrawerLoading(false);
        onProvinceClickRef.current(province);
      }
    });

    instance.on("mouseover", (params: any) => {
      if (params.name) {
        const d = dataRef.current.find((d: GeoData) => d.province === params.name);
        if (d) setHoveredProvince(d);
      }
    });

    instance.on("mouseout", () => {
      setHoveredProvince(null);
    });
  }, []); // Stable — refs keep values fresh

  // Close drawer when clicking map background (not the drawer)
  const closeDrawer = useCallback(() => {
    setDrawerProvince(null);
    setDrawerColleges([]);
  }, []);

  // Update chart when option changes
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.setOption(option, true);
    }
  }, [option]);


  if (geoLoaded === null) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#EEF3FB] to-[#E0EAF8]">
        <div className="text-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-[#5A6A85]">加载地图数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-[#EEF3FB] to-[#E0EAF8]">
      {/* Click-outside backdrop: visible when drawer is open, click to close */}
      {drawerProvince && (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => {
            e.stopPropagation();
            closeDrawer();
          }}
        />
      )}
      {/* Stats overlay — top-left */}
      <div className="absolute top-4 left-4 z-10 flex gap-2.5 pointer-events-none">
        {[
          { label: "院校总数", value: stats.total, cls: "" },
          { label: "双高院校", value: stats.shuanggaoCount, cls: "!text-[#C1272D]" },
          { label: "职业本科", value: stats.zhiyeBenkeCount, cls: "!text-[#D97706]" },
          { label: "民办院校", value: stats.privateCount, cls: "!text-[#C1272D]" },
        ].map((c) => (
          <div key={c.label} className="bg-white/95 border border-[#D8E2F0] rounded-lg px-4 py-2.5 text-center shadow-sm min-w-[90px]">
            <div className={`text-xl font-extrabold text-[#0C2340] ${c.cls}`}>{c.value.toLocaleString()}</div>
            <div className="text-[10px] text-[#5A6A85] mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ECharts Map */}
      <div className="absolute inset-0">
        <ReactECharts
          option={option}
          onChartReady={handleChartReady}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      </div>

      {/* Custom tooltip */}
      {hoveredProvince && (
        <div className="absolute bg-[#0C2340] text-white rounded-lg px-3.5 py-2.5 text-xs shadow-lg z-20 pointer-events-none"
          style={{ top: 120, right: 20, width: 200 }}>
          <div className="font-bold text-[13px] mb-1.5">{hoveredProvince.province}</div>
          <div className="flex justify-between mb-0.5 opacity-85"><span>院校总数</span><span>{hoveredProvince.count} 所</span></div>
          <div className="flex justify-between mb-0.5 opacity-85"><span>公办</span><span>{hoveredProvince.publicCount} 所</span></div>
          <div className="flex justify-between mb-0.5 opacity-85"><span>民办</span><span>{hoveredProvince.privateCount} 所</span></div>
          <div className="flex justify-between mb-0.5 opacity-85"><span>双高院校</span><span>{hoveredProvince.shuanggaoCount} 所</span></div>
          <span className="inline-block bg-[#C1272D] text-white text-[10px] px-1.5 py-0.5 rounded mt-1.5">点击查看详情</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-5 left-5 bg-white/95 border border-[#D8E2F0] rounded-lg px-4 py-3 shadow-sm z-10 pointer-events-none">
        <div className="text-[11px] font-bold text-[#5A6A85] mb-2">图例</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#1A56A0] border-2 border-white shadow-sm" /><span className="text-[11px] text-[#1A2742]">热力密度</span></div>
        </div>
        <div className="text-[10px] text-[#5A6A85] mt-1.5">点击省份 → 查看院校列表</div>
      </div>

      {/* Province Drawer — semi-transparent slide-out */}
      {drawerProvince && (
        <ProvinceDrawer
          province={drawerProvince}
          colleges={drawerColleges}
          loading={drawerLoading}
          onClose={() => { setDrawerProvince(null); setDrawerColleges([]); }}
        />
      )}
    </div>
  );
}
