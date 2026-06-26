"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import CrossFilter from "@/components/stats/CrossFilter";
import CrossTable from "@/components/stats/CrossTable";
import StatsCharts from "@/components/stats/StatsCharts";
import { CrossStatRow } from "@/types";

export default function StatsPage() {
  const [rowDim, setRowDim] = useState("province");
  const [metrics, setMetrics] = useState<string[]>(["count"]);
  const [data, setData] = useState<CrossStatRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("rowDim", rowDim);
    params.set("metrics", metrics.join(","));
    const res = await fetch(`/api/stats?${params}`);
    const json = await res.json();
    setData(json.data || []);
    setLoading(false);
  }, [rowDim, metrics]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">统计分析后台</h2>
      <CrossFilter
        rowDim={rowDim}
        onRowDimChange={setRowDim}
        metrics={metrics}
        onMetricsChange={setMetrics}
      />
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <StatsCharts data={data} metrics={metrics} rowDim={rowDim} />
          <CrossTable data={data} metrics={metrics} />
        </>
      )}
    </div>
  );
}
