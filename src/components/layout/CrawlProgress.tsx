"use client";

import { useState, useEffect, useRef } from "react";

interface CrawlProgress {
  total: number;
  withWebsite: number;
  withoutWebsite: number;
  coverage: string;
}

// Dropdown offset: AppNav h-[52px] + 4px clearance — keep in sync with AppNav header height
const DROPDOWN_TOP = "top-[56px]";

export default function CrawlProgress() {
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch progress from API (polling only when expanded)
  useEffect(() => {
    if (!expanded) return;

    const ac = new AbortController();
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/crawl-progress", { signal: ac.signal });
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
          setFetchError(false);
        } else {
          console.error("CrawlProgress fetch failed:", res.status, res.statusText);
          setFetchError(true);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("CrawlProgress fetch error:", err);
        setFetchError(true);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);
    return () => { clearInterval(interval); ac.abort(); };
  }, [expanded]);

  // Close panel on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // ESC close
  useEffect(() => {
    if (!expanded) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [expanded]);

  if (!progress) {
    if (fetchError) return <span className="bg-white/10 text-white/50 text-[11px] px-2 py-0.5 rounded-[10px]">🌐 加载失败</span>;
    return null;
  }

  const rawPct = parseFloat(progress.coverage);
  const pct = Number.isNaN(rawPct) ? 0 : rawPct;

  return (
    <div className="relative" ref={panelRef}>
      {/* Badge */}
      <span
        className="bg-white/10 text-white text-[11px] px-2 py-0.5 rounded-[10px] cursor-pointer hover:bg-white/20 transition-colors inline-block"
        onClick={() => setExpanded(!expanded)}
      >
        🌐 {progress.withWebsite}/{progress.total}
      </span>

      {/* Expanded panel */}
      {expanded && (
        <div className={`fixed ${DROPDOWN_TOP} right-4 bg-white border border-[#D8E2F0] rounded-lg shadow-2xl p-4 z-[100] w-72`}>
          <div className="text-sm font-bold text-[#0C2340] mb-3">院校官网采集进度</div>

          <div className="h-2 bg-[#F2F5FA] rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#fdae61] rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pct, 1)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[#5A6A85]">总院校</div>
              <div className="font-bold text-[#1A2742]">{progress.total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[#5A6A85]">已采集</div>
              <div className="font-bold text-green-600">{progress.withWebsite.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[#5A6A85]">覆盖率</div>
              <div className="font-bold text-[#1A56A0]">{progress.coverage}</div>
            </div>
            <div>
              <div className="text-[#5A6A85]">待采集</div>
              <div className="font-bold text-[#D97706]">{progress.withoutWebsite.toLocaleString()}</div>
            </div>
          </div>

          <div className="text-[10px] text-[#5A6A85] mt-3 pt-3 border-t border-[#F0F4F9]">
            运行 scripts/crawl-websites-v2.ts
          </div>
        </div>
      )}
    </div>
  );
}
