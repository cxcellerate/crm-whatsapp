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
    <div
      className="card p-5 flex flex-col justify-between hover:translate-y-[-1px] transition-all duration-200"
      style={{ minHeight: '120px' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '18', border: `1px solid ${color}28` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums leading-none mt-3" style={{ color: 'var(--tx-1)' }}>
          {value}
        </p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{up ? '+' : ''}{trend}%</span>
            {trendLabel && <span className="font-normal" style={{ color: 'var(--tx-4)' }}>{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
