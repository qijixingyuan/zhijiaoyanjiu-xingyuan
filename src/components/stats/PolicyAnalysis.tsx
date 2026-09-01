"use client";

// 政策分析模块容器 — 一次请求返回全部 5 个视图，子 tab 纯本地切换

import { useState, useEffect, useCallback } from "react";
import TrendChart from "./analysis/TrendChart";
import ProvinceActivity from "./analysis/ProvinceActivity";
import CooccurrenceGraph from "./analysis/CooccurrenceGraph";
import DepartmentAnalysis from "./analysis/DepartmentAnalysis";
import CalendarHeatmap from "./analysis/CalendarHeatmap";
import { PolicyAnalysisViews } from "@/lib/policy-analysis";

const SUB_TABS = [
  { key: "trend", label: "演进趋势" },
  { key: "province", label: "省份活跃度" },
  { key: "cooccur", label: "主题共现" },
  { key: "department", label: "发文主体" },
  { key: "calendar", label: "密集度时序" },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]["key"];

export default function PolicyAnalysis() {
  const [subTab, setSubTab] = useState<SubTabKey>("trend");
  const [views, setViews] = useState<PolicyAnalysisViews | null>(null);
  const [total, setTotal] = useState(0);
  const [nationalCount, setNationalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalysis = useCallback(() => {
    setLoading(true);
    const ac = new AbortController();
    fetch("/api/policies/analysis", { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!json.views) throw new Error("响应结构错误");
        setViews(json.views);
        setTotal(json.total || 0);
        setNationalCount(json.nationalCount || 0);
        setError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("PolicyAnalysis fetch:", err);
        setError(true);
        setLoading(false);
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const cleanup = loadAnalysis();
    return cleanup;
  }, [loadAnalysis]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 px-4 py-2.5 bg-white border-b border-[#D8E2F0] flex-shrink-0">
        <span className="text-xs font-bold text-[#0C2340] mr-3">政策分析</span>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-3.5 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
              subTab === t.key ? "bg-[#0C2340] text-white" : "bg-[#F2F5FA] text-[#1A2742] hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[#5A6A85]">共 {total} 条政策</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : error || !views ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-[#5A6A85]">分析数据加载失败</p>
            <button
              onClick={() => loadAnalysis()}
              className="px-4 py-1.5 text-xs rounded bg-[#1A56A0] text-white cursor-pointer hover:bg-[#1D4ED8]"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            {subTab === "trend" && <TrendChart view={views.trend} />}
            {subTab === "province" && <ProvinceActivity view={views.province} nationalCount={nationalCount} />}
            {subTab === "cooccur" && <CooccurrenceGraph view={views.cooccur} />}
            {subTab === "department" && <DepartmentAnalysis view={views.department} total={total} />}
            {subTab === "calendar" && <CalendarHeatmap view={views.calendar} />}
          </>
        )}
      </div>
    </div>
  );
}
