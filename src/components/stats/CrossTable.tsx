import { CrossStatRow } from "@/types";

interface CrossTableProps {
  data: CrossStatRow[];
  metrics: string[];
}

const METRIC_LABELS: Record<string, string> = {
  count: "院校数量",
  publicCount: "公办数量",
  privateRatio: "民办占比",
  shuanggaoCount: "双高院校数",
  shuanggaoRatio: "双高占比",
};

export default function CrossTable({ data, metrics }: CrossTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
        暂无统计数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 sticky top-0">
            <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">
              维度
            </th>
            {metrics.map((m) => (
              <th key={m} className="text-right px-4 py-3 font-medium text-gray-600">
                {METRIC_LABELS[m] || m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-white">
                {row.label}
              </td>
              {metrics.map((m) => (
                <td key={m} className="px-4 py-2.5 text-right text-gray-700">
                  {m.endsWith("Ratio")
                    ? `${(row.metrics[m] * 100).toFixed(1)}%`
                    : row.metrics[m]?.toLocaleString() || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
