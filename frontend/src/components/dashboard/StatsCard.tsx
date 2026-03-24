import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: number;
  trendLabel?: string;
}

export function StatsCard({ label, value, icon: Icon, color, trend, trendLabel }: Props) {
  const up = trend !== undefined && trend >= 0;

  return (
    <div className="card p-5 hover:border-dark-500 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-dark-400 text-sm">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-dark-50">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{up ? '+' : ''}{trend}%</span>
          {trendLabel && <span className="text-dark-500 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
