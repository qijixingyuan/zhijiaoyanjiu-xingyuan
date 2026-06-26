export default function MapStatsBanner({
  stats,
}: {
  stats: { total: number; publicCount: number; privateCount: number; zhiyeBenkeCount: number; shuanggaoCount: number };
}) {
  const items = [
    { label: "院校总数", value: stats.total, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "公办院校", value: stats.publicCount, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    { label: "民办院校", value: stats.privateCount, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "职业本科", value: stats.zhiyeBenkeCount, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
    { label: "双高院校", value: stats.shuanggaoCount, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${item.bg} border ${item.border} rounded-lg px-4 py-3 flex items-center justify-between`}
        >
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className={`text-xl font-bold ${item.color}`}>{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
