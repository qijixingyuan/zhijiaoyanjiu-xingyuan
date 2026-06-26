"use client";

import { useState, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { CrossStatRow } from "@/types";

export default function StatsPanel() {
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

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const topData = [...data].sort((a, b) => (b.metrics.count || 0) - (a.metrics.count || 0)).slice(0, 10);

  const barOption = {
    title: { text: `各省高职院校数量 TOP 10`, left: "center", textStyle: { fontSize: 12, fontWeight: 700, color: "#0C2340" } },
    tooltip: { trigger: "axis" as const },
    grid: { left: 100, right: 30, top: 40, bottom: 20 },
    xAxis: { type: "value" as const },
    yAxis: { type: "category" as const, data: topData.map(d => d.label).reverse(), axisLabel: { fontSize: 11 } },
    series: [{ type: "bar", data: topData.map(d => d.metrics.count || 0).reverse(), barMaxWidth: 20, itemStyle: { color: "#1A56A0", borderRadius: [0, 2, 2, 0] } }],
  };

  const natureData = data.filter(d => ["公办", "民办", "中外合作办学"].includes(d.label));
  const pieOption = {
    title: { text: "举办性质分布", left: "center", textStyle: { fontSize: 12, fontWeight: 700, color: "#0C2340" } },
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["40%", "65%"], center: ["50%", "48%"],
      data: [
        { name: "公办", value: natureData.find(d => d.label === "公办")?.metrics.count || 0, itemStyle: { color: "#1A56A0" } },
        { name: "民办", value: natureData.find(d => d.label === "民办")?.metrics.count || 0, itemStyle: { color: "#D97706" } },
        { name: "中外合作", value: natureData.find(d => d.label === "中外合作办学")?.metrics.count || 0, itemStyle: { color: "#6EE7B7" } },
      ],
      label: { formatter: "{b}\n{d}%" },
    }],
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Config Panel */}
      <div className="w-[220px] border-r border-[#D8E2F0] bg-white flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-[#D8E2F0]">
          <h2 className="text-sm font-bold text-[#0C2340] mb-4">数据统计后台</h2>

          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-wide text-[#5A6A85] uppercase mb-2">行维度</div>
            <div className="flex flex-col gap-1">
              {[{ k: "province", l: "省份" }, { k: "nature", l: "举办性质" }, { k: "supervisor", l: "主管部门" }].map(d => (
                <button key={d.k} onClick={() => setRowDim(d.k)}
                  className={`text-left px-3 py-1.5 text-xs rounded transition-colors ${rowDim === d.k ? "bg-[#0C2340] text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-wide text-[#5A6A85] uppercase mb-2">指标（多选）</div>
            <div className="flex flex-col gap-1">
              {[
                { k: "count", l: "院校数量" }, { k: "publicCount", l: "公办数量" },
                { k: "privateRatio", l: "民办占比" }, { k: "shuanggaoCount", l: "双高院校" }, { k: "shuanggaoRatio", l: "双高占比" },
              ].map(m => (
                <button key={m.k} onClick={() => setMetrics(prev => prev.includes(m.k) ? prev.filter(x => x !== m.k) : [...prev, m.k])}
                  className={`text-left px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${metrics.includes(m.k) ? "bg-[#E8EFF8] text-[#1A56A0] font-medium" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"}`}>
                  <span className={`w-3 h-3 rounded border-2 flex items-center justify-center ${metrics.includes(m.k) ? "border-[#1A56A0] bg-[#1A56A0]" : "border-[#D8E2F0]"}`}>
                    {metrics.includes(m.k) && <span className="text-white text-[8px]">✓</span>}
                  </span>
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          <button onClick={fetchStats}
            className="w-full bg-[#1A56A0] text-white border-none rounded py-2 text-xs font-semibold cursor-pointer hover:bg-[#1D4ED8] transition-colors">
            ▶ 生成报表
          </button>
        </div>
      </div>

      {/* Right: Visualization */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
                <ReactECharts option={barOption} style={{ height: "340px" }} />
              </div>
              <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
                <ReactECharts option={pieOption} style={{ height: "340px" }} />
              </div>
            </div>

            {/* Cross table */}
            <div className="bg-white border border-[#D8E2F0] rounded-lg p-4">
              <div className="text-xs font-bold text-[#0C2340] mb-3">
                {rowDim === "province" ? "省份" : rowDim === "nature" ? "举办性质" : "主管部门"} × 交叉统计
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-[#F2F5FA] px-2.5 py-1.5 text-left text-[#5A6A85] font-bold border-b border-[#D8E2F0] sticky left-0 bg-[#F2F5FA]">#</th>
                      <th className="bg-[#F2F5FA] px-2.5 py-1.5 text-left text-[#5A6A85] font-bold border-b border-[#D8E2F0]">类别</th>
                      {metrics.map(m => (
                        <th key={m} className="bg-[#F2F5FA] px-2.5 py-1.5 text-right text-[#5A6A85] font-bold border-b border-[#D8E2F0]">
                          {m === "count" ? "院校总数" : m === "publicCount" ? "公办" : m === "privateRatio" ? "民办占比" : m === "shuanggaoCount" ? "双高院校" : "双高占比"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={row.key} className="hover:bg-[#F2F5FA]">
                        <td className="px-2.5 py-1.5 text-[#5A6A85] border-b border-[#F0F4F9]">{i + 1}</td>
                        <td className="px-2.5 py-1.5 font-semibold text-[#1A2742] border-b border-[#F0F4F9]">{row.label}</td>
                        {metrics.map(m => (
                          <td key={m} className="px-2.5 py-1.5 text-right font-bold text-[#1A56A0] border-b border-[#F0F4F9]">
                            {m.endsWith("Ratio") ? `${((row.metrics[m] || 0) * 100).toFixed(1)}%` : (row.metrics[m] || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
