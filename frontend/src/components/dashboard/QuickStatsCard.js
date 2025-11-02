export default function QuickStatsCard({ value, label, icon }) {
  return (
    <div className="flex flex-col items-center w-28">
      <img src={icon} alt="" className="w-12 h-12 mb-1 rounded" />
      <span className="text-blue-800 font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
