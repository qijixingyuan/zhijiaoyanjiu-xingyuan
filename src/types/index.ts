// 共享类型定义

export interface CollegeSummary {
  id: string;
  name: string;
  province: string;
  city: string | null;
  nature: string;
  supervisor: string;
  honors?: string[]; // honor categories
}

export interface CollegeDetail extends Omit<CollegeSummary, "honors"> {
  seqNo: number | null;
  location: string;
  level: string;
  remarks: string | null;
  website: string | null;
  wechatName: string | null;
  wechatQr: string | null;
  formerNames: string | null;
  honors: HonorItem[];
  opinions: OpinionItem[];
}

export interface HonorItem {
  id: string;
  title: string;
  category: string;
  batch: string | null;
  year: number | null;
  source: string | null;
}

export interface OpinionItem {
  id: string;
  platform: string;
  overallScore: number;
  positiveRatio: number;
  neutralRatio: number;
  negativeRatio: number;
  summary: string | null;
  sampleComments: SampleComment[] | null;
}

export interface SampleComment {
  text: string;
  platform: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface PolicyItem {
  id: string;
  title: string;
  province: string;
  publishDate: string;
  type: string;
  department: string | null;
  summary: string | null;
  docNumber: string | null;
  sourceOrg: string | null;
  url: string | null;
  downloadUrl: string | null;
}

export interface GeoData {
  province: string;
  count: number;
  publicCount: number;
  privateCount: number;
  cooperationCount: number;
  zhiyeBenkeCount: number;
  shuanggaoCount: number;
  cities?: CityGeoData[];
}

export interface CollegeListItem {
  id: string;
  name: string;
  province: string;
  city: string | null;
  nature: string;
  level: string;
  supervisor: string;
  location: string;
  website?: string | null;
  honors: { category: string }[];
}

export interface CityGeoData {
  city: string;
  count: number;
  publicCount: number;
  privateCount: number;
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CrossStatRow {
  key: string;
  label: string;
  metrics: Record<string, number>;
}
