"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AppNav from "@/components/layout/AppNav";
import Sidebar from "@/components/layout/Sidebar";
import MapPanel from "@/components/map/MapPanel";
import PolicyPanel from "@/components/policy/PolicyPanel";
import CollegePanel from "@/components/college/CollegePanel";
import StatsPanel from "@/components/stats/StatsPanel";
import { GeoData } from "@/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("map");
  const [filters, setFilters] = useState<Record<string, string>>({
    province: "", nature: "", supervisor: "", honorCategory: "",
  });
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [stats, setStats] = useState({ total: 1666, publicCount: 0, privateCount: 0, zhiyeBenkeCount: 0, shuanggaoCount: 0 });
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const handleProvinceClick = useCallback((province: string) => {
    setSelectedProvince(province);
    // Stay on map page — Phase B will open Drawer instead
  }, []);

  const fetchGeoData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.nature) params.set("nature", filters.nature);
    if (filters.supervisor) params.set("supervisor", filters.supervisor);
    if (filters.honorCategory) params.set("honorCategory", filters.honorCategory);
    const res = await fetch(`/api/colleges/geo?${params}`);
    const json = await res.json();
    if (json.data) {
      setGeoData(json.data);
      setStats(json.stats || stats);
    }
  }, [filters]);

  useEffect(() => { fetchGeoData(); }, [fetchGeoData]);

  const provinceRanking = useMemo(() =>
    geoData
      .map((d) => ({ province: d.province, count: d.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  [geoData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const isMapTab = activeTab === "map";

  return (
    <>
      <AppNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{ total: stats.total, zhiyeBenke: stats.zhiyeBenkeCount }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — 仅地图页显示 */}
        {isMapTab && (
          <Sidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            stats={stats}
            provinceRanking={provinceRanking}
          />
        )}

        {/* Main content — 全宽无 padding */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {isMapTab && (
            <MapPanel
              data={geoData}
              stats={stats}
              filters={filters}
              onProvinceClick={handleProvinceClick}
            />
          )}
          {activeTab === "policy" && <PolicyPanel filters={filters} />}
          {activeTab === "college" && <CollegePanel province={selectedProvince} />}
          {activeTab === "stats" && <StatsPanel />}
        </main>
      </div>
    </>
  );
}
