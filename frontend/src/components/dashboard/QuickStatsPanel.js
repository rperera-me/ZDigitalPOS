import QuickStatsCard from "./QuickStatsCard";

export default function QuickStatsPanel({ stats }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 justify-between">
      {stats.map(stat => <QuickStatsCard key={stat.label} {...stat} />)}
    </div>
  );
}
