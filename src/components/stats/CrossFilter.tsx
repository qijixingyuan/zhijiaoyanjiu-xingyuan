const ROW_DIMENSIONS = [
  { value: "province", label: "省份" },
  { value: "nature", label: "办学性质" },
  { value: "supervisor", label: "主管部门" },
];

const METRIC_OPTIONS = [
  { value: "count", label: "院校数量" },
  { value: "publicCount", label: "公办数量" },
  { value: "privateRatio", label: "民办占比" },
  { value: "shuanggaoCount", label: "双高院校数" },
  { value: "shuanggaoRatio", label: "双高占比" },
];

interface CrossFilterProps {
  rowDim: string;
  onRowDimChange: (dim: string) => void;
  metrics: string[];
  onMetricsChange: (metrics: string[]) => void;
}

export default function CrossFilter({
  rowDim,
  onRowDimChange,
  metrics,
  onMetricsChange,
}: CrossFilterProps) {
  const toggleMetric = (value: string) => {
    if (metrics.includes(value)) {
      if (metrics.length > 1) onMetricsChange(metrics.filter((m) => m !== value));
    } else {
      onMetricsChange([...metrics, value]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">行维度</span>
          <div className="flex gap-1">
            {ROW_DIMENSIONS.map((dim) => (
              <button
                key={dim.value}
                onClick={() => onRowDimChange(dim.value)}
                className={`px-3 py-1 text-sm rounded ${
                  rowDim === dim.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">指标</span>
          <div className="flex gap-1 flex-wrap">
            {METRIC_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => toggleMetric(m.value)}
                className={`px-3 py-1 text-sm rounded ${
                  metrics.includes(m.value)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
