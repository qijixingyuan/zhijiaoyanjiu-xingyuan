"use client";

// 中国地图 GeoJSON 加载 hook — 地图组件共享
// 红线（CLAUDE.md）: registerMap 必须在 echarts 全局对象上，绝不调用在 chart 实例上
// 模块级 promise 缓存: 多个地图组件先后挂载只 fetch 一次 582KB GeoJSON

import { useEffect, useState, useCallback } from "react";
import * as echarts from "echarts";

let geoPromise: Promise<boolean> | null = null;

async function loadChinaGeo(): Promise<boolean> {
  const res = await fetch("/china.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  echarts.registerMap("china", json);
  return true;
}

/** geoLoaded: null=loading, false=failed, true=registered */
export function useChinaGeo(): { geoLoaded: boolean | null; retry: () => void } {
  const [geoLoaded, setGeoLoaded] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!geoPromise) {
      geoPromise = loadChinaGeo().then(
        (ok) => ok,
        (err) => {
          geoPromise = null; // 失败清缓存，retry 时重新 fetch
          throw err;
        }
      );
    }
    geoPromise
      .then(() => {
        if (!cancelled) setGeoLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setGeoLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { geoLoaded, retry };
}
