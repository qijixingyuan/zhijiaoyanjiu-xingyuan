// 政策分析聚合纯函数 — 5 个学术维度视图
// 数据规模 300+ 条，全量内存聚合；tags 为空时 fallback 取 type（A-L 内），M-其他一律过滤

import { splitTags, TYPE_ORDER, TYPE_LABELS } from "./policy-types";

export interface PolicyRow {
  id: string;
  title: string;
  province: string;
  publishDate: Date;
  type: string;
  tags: string;
  department: string | null;
}

/** 标签解析: tags 优先，空则 fallback type 首字母（仅 A-L） */
export function resolveTags(row: PolicyRow): string[] {
  const t = splitTags(row.tags);
  if (t.length > 0) return t;
  const m = /^([A-L])/.exec(row.type || "");
  return m ? [m[1]] : [];
}

/** 部门名归并: "湖南省教育厅" 保留、"教育部职业教育与成人教育司" → "教育部"、空 → "未标注" */
export function normalizeDepartment(raw: string | null): string {
  if (!raw || !raw.trim()) return "未标注";
  const d = raw.trim();
  if (d.includes("教育部")) return "教育部";
  if (d.includes("教育厅")) return d; // 已是"X省教育厅"格式
  if (d.includes("人力资源和社会保障")) return "人社部门";
  if (d.includes("财政")) return "财政部门";
  return d;
}

/** 联合发文判定: 顿号/逗号/分号分隔 ≥2 段；或空格分隔且每段以 厅/局/委/部/办 结尾 ≥2 段 */
export function isJointDocument(department: string | null): boolean {
  if (!department || !department.trim()) return false;
  const d = department.trim();
  const byPunct = d.split(/[、，,；;]/).map((s) => s.trim()).filter(Boolean);
  if (byPunct.length >= 2) return true;
  const bySpace = d.split(/\s+/).filter(Boolean);
  if (bySpace.length >= 2 && bySpace.every((s) => /[厅局委部办]$/.test(s))) return true;
  return false;
}

// ---------------- 维度 1: 演进趋势（年 × 类型堆叠面积） ----------------
export interface TrendView {
  years: number[];
  series: { type: string; name: string; data: number[] }[];
}

export function buildTrendView(rows: PolicyRow[]): TrendView {
  const byYearType = new Map<number, Map<string, number>>();
  const yearSet = new Set<number>();
  const typeSet = new Set<string>();

  for (const row of rows) {
    const year = row.publishDate.getUTCFullYear();
    const tags = resolveTags(row);
    if (tags.length === 0) continue;
    yearSet.add(year);
    if (!byYearType.has(year)) byYearType.set(year, new Map());
    const typeMap = byYearType.get(year)!;
    for (const t of tags) {
      typeSet.add(t);
      typeMap.set(t, (typeMap.get(t) || 0) + 1);
    }
  }

  const years = Array.from(yearSet).sort((a, b) => a - b);
  const types = Array.from(typeSet).sort();
  const series = types.map((t) => ({
    type: t,
    name: TYPE_LABELS[t] || t,
    data: years.map((y) => byYearType.get(y)?.get(t) || 0),
  }));
  return { years, series };
}

// ---------------- 维度 2: 省份活跃度（排名 + 地图热力） ----------------
export interface ProvinceView {
  ranking: { province: string; count: number; byType: Record<string, number> }[];
  mapData: { province: string; count: number }[];
  nationalCount: number;
}

export function buildProvinceView(rows: PolicyRow[]): ProvinceView {
  const map = new Map<string, { count: number; byType: Map<string, number> }>();
  for (const row of rows) {
    const tags = resolveTags(row);
    if (tags.length === 0) continue;
    if (!map.has(row.province)) map.set(row.province, { count: 0, byType: new Map() });
    const entry = map.get(row.province)!;
    entry.count++;
    for (const t of tags) entry.byType.set(t, (entry.byType.get(t) || 0) + 1);
  }

  const ranking = Array.from(map.entries())
    .map(([province, e]) => ({
      province,
      count: e.count,
      byType: Object.fromEntries(e.byType),
    }))
    .sort((a, b) => b.count - a.count);

  // 地图热力排除"全国"（GeoJSON name 匹配不上）
  const mapData = ranking
    .filter((r) => r.province !== "全国")
    .map((r) => ({ province: r.province, count: r.count }));
  const nationalCount = map.get("全国")?.count || 0;

  return { ranking, mapData, nationalCount };
}

// ---------------- 维度 3: 主题共现（矩阵 + 网络图） ----------------
export interface CooccurView {
  nodes: { id: string; name: string; count: number }[];
  links: { source: string; target: string; value: number }[];
  matrix: { types: string[]; labels: string[]; data: number[][] };
}

export function buildCooccurView(rows: PolicyRow[]): CooccurView {
  const typeFreq = new Map<string, number>();
  const pairFreq = new Map<string, number>();

  for (const row of rows) {
    const tags = resolveTags(row);
    if (tags.length === 0) continue;
    for (const t of tags) typeFreq.set(t, (typeFreq.get(t) || 0) + 1);
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const [a, b] = tags[i] < tags[j] ? [tags[i], tags[j]] : [tags[j], tags[i]];
        const key = `${a},${b}`;
        pairFreq.set(key, (pairFreq.get(key) || 0) + 1);
      }
    }
  }

  const activeTypes = Array.from(typeFreq.keys()).sort();
  const nodes = activeTypes.map((t) => ({ id: t, name: TYPE_LABELS[t] || t, count: typeFreq.get(t) || 0 }));
  const links = Array.from(pairFreq.entries())
    .filter(([, v]) => v > 0)
    .map(([key, value]) => {
      const [source, target] = key.split(",");
      return { source, target, value };
    });

  // 全 12 类对称矩阵（对角线 = 标签总频次）
  const data = TYPE_ORDER.map((t1) =>
    TYPE_ORDER.map((t2) => {
      if (t1 === t2) return typeFreq.get(t1) || 0;
      const [a, b] = t1 < t2 ? [t1, t2] : [t2, t1];
      return pairFreq.get(`${a},${b}`) || 0;
    })
  );

  return {
    nodes,
    links,
    matrix: { types: [...TYPE_ORDER], labels: TYPE_ORDER.map((t) => TYPE_LABELS[t] || t), data },
  };
}

// ---------------- 维度 4: 发文主体（分组 + 联合发文检测） ----------------
export interface DepartmentView {
  stats: { department: string; count: number; byType: Record<string, number> }[];
  jointCount: number;
  jointDocs: { id: string; title: string; departments: string[]; publishDate: string }[];
}

export function buildDepartmentView(rows: PolicyRow[]): DepartmentView {
  const map = new Map<string, { count: number; byType: Map<string, number> }>();
  let jointCount = 0;
  const jointDocs: DepartmentView["jointDocs"] = [];

  for (const row of rows) {
    const dep = normalizeDepartment(row.department);
    if (!map.has(dep)) map.set(dep, { count: 0, byType: new Map() });
    const entry = map.get(dep)!;
    entry.count++;
    const tags = resolveTags(row);
    if (tags.length > 0) entry.byType.set(tags[0], (entry.byType.get(tags[0]) || 0) + 1);

    if (isJointDocument(row.department)) {
      jointCount++;
      if (jointDocs.length < 50) {
        const parts = row.department!.split(/[、，,；;]/).map((s) => s.trim()).filter(Boolean);
        jointDocs.push({
          id: row.id,
          title: row.title,
          departments: parts,
          publishDate: row.publishDate.toISOString().split("T")[0],
        });
      }
    }
  }

  const stats = Array.from(map.entries())
    .map(([department, e]) => ({
      department,
      count: e.count,
      byType: Object.fromEntries(e.byType),
    }))
    .sort((a, b) => b.count - a.count);

  return { stats, jointCount, jointDocs };
}

// ---------------- 维度 5: 密集度时序（月 × 类型热力 + 月度总量） ----------------
export interface CalendarView {
  years: number[];
  data: { year: number; month: number; type: string; count: number }[];
  monthTotal: { month: number; count: number }[];
}

export function buildCalendarView(rows: PolicyRow[]): CalendarView {
  const byMonthType = new Map<string, number>(); // key: `${year}-${month}-${type}`
  const monthTotals = new Map<number, number>();
  const yearSet = new Set<number>();

  for (const row of rows) {
    const tags = resolveTags(row);
    if (tags.length === 0) continue;
    const year = row.publishDate.getUTCFullYear();
    const month = row.publishDate.getUTCMonth() + 1;
    yearSet.add(year);
    monthTotals.set(month, (monthTotals.get(month) || 0) + 1);
    for (const t of tags) {
      const key = `${year}-${month}-${t}`;
      byMonthType.set(key, (byMonthType.get(key) || 0) + 1);
    }
  }

  const data = Array.from(byMonthType.entries()).map(([key, count]) => {
    const [y, m, t] = key.split("-");
    return { year: parseInt(y), month: parseInt(m), type: t, count };
  });
  const monthTotal = Array.from(monthTotals.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month - b.month);

  return { years: Array.from(yearSet).sort((a, b) => a - b), data, monthTotal };
}

// ---------------- 汇总 ----------------
export interface PolicyAnalysisViews {
  trend: TrendView;
  province: ProvinceView;
  cooccur: CooccurView;
  department: DepartmentView;
  calendar: CalendarView;
}

export function buildAllViews(rows: PolicyRow[]): PolicyAnalysisViews {
  return {
    trend: buildTrendView(rows),
    province: buildProvinceView(rows),
    cooccur: buildCooccurView(rows),
    department: buildDepartmentView(rows),
    calendar: buildCalendarView(rows),
  };
}
