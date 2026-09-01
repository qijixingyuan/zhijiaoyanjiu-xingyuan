// 政策类型共享常量与工具 — 12 类体系 A-L
// 使用方: PolicyPanel(筛选chip/卡片)、政策分析模块(charts)、标签标注脚本、手动标签编辑 API

export const TYPE_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

/** 双键兼容: "A" 与 "A-治理体系" 均可查 */
export const TYPE_LABELS: Record<string, string> = {
  "A": "治理体系", "B": "产教融合", "C": "人才培养",
  "D": "专业建设", "E": "师资队伍", "F": "质量评价",
  "G": "招生就业", "H": "经费投入", "I": "数字化",
  "J": "国际化", "K": "乡村振兴", "L": "职业本科",
  "A-治理体系": "治理体系", "B-产教融合": "产教融合", "C-人才培养": "人才培养",
  "D-专业建设": "专业建设", "E-师资队伍": "师资队伍", "F-质量评价": "质量评价",
  "G-招生就业": "招生就业", "H-经费投入": "经费投入", "I-数字化": "数字化",
  "J-国际化": "国际化", "K-乡村振兴": "乡村振兴", "L-职业本科": "职业本科",
};

/** 政策列表卡片 chip 用的 tailwind 类（键 "A-治理体系"） */
export const TYPE_CLASSES: Record<string, string> = {
  "A-治理体系": "bg-[#FEF3C7] text-[#92400E]", "B-产教融合": "bg-[#FEE2E2] text-[#991B1B]",
  "C-人才培养": "bg-[#D1FAE5] text-[#065F46]", "D-专业建设": "bg-[#DBEAFE] text-[#1D4ED8]",
  "E-师资队伍": "bg-[#EDE9FE] text-[#5B21B6]", "F-质量评价": "bg-[#FCE7F3] text-[#9D174D]",
  "G-招生就业": "bg-[#FFF7ED] text-[#C2410C]", "H-经费投入": "bg-[#ECFDF5] text-[#065F46]",
  "I-数字化": "bg-[#EFF6FF] text-[#1D4ED8]", "J-国际化": "bg-[#F0FDF4] text-[#15803D]",
  "K-乡村振兴": "bg-[#FFFBEB] text-[#A16207]", "L-职业本科": "bg-[#FAF5FF] text-[#7E22CE]",
};

/** ECharts 图表用 hex 色（键 "A"，12 色可区分） */
export const TYPE_COLORS: Record<string, string> = {
  "A": "#F59E0B", "B": "#EF4444", "C": "#10B981", "D": "#3B82F6",
  "E": "#8B5CF6", "F": "#EC4899", "G": "#F97316", "H": "#34D399",
  "I": "#60A5FA", "J": "#22C55E", "K": "#EAB308", "L": "#A855F7",
};

/** 输入归一化为 A-L 单字母; 非法返回 null */
export function normalizeTag(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-L]$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^([A-L])-/);
  return m ? m[1] : null;
}

/** "A,B,K" → ["A","B","K"]，非法值过滤、去重 */
export function splitTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of tags.split(",")) {
    const t = normalizeTag(part);
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out;
}

export function getTypeLabel(key: string): string {
  return TYPE_LABELS[key] || key;
}
