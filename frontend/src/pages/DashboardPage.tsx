import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, MessageSquare, DollarSign, Zap, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useSocket } from '../hooks/useSocket';
import { LeadSource } from '../types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = ['#3DA13E', '#086375', '#BDFD29', '#FF7919', '#007F5F', '#4D4D4D'];

const SOURCE_LABELS: Record<LeadSource, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads',
  ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

interface DashboardStats {
  totalLeads: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  recentMessages: number;
  totalValue: number;
  leadsBySource: Array<{ source: LeadSource; _count: { _all: number } }>;
  leadsByStage: Array<{ stageId: string; _count: { _all: number } }>;
}

function EmptyChart({ height = 180 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg"
      style={{ height, backgroundColor: 'var(--bg-surface2)' }}
    >
      <Zap size={20} style={{ color: 'var(--tx-4)' }} />
      <p className="text-xs" style={{ color: 'var(--tx-4)' }}>Sem dados ainda</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--tx-4)' }}>
      {children}
    </p>
  );
}

export function DashboardPage() {
  useSocket();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const sourceData = stats?.leadsBySource?.map((s) => ({
    name: SOURCE_LABELS[s.source] ?? s.source,
    value: s._count._all,
  })) ?? [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const monthPercent =
    stats?.totalLeads && stats?.leadsThisMonth
      ? Math.round((stats.leadsThisMonth / stats.totalLeads) * 100)
      : null;

  return (
    <div className="space-y-5">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--tx-1)' }}>Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-4)' }}>
            Visão geral do seu CRM
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'var(--bg-surface2)', color: 'var(--tx-3)', border: '1px solid var(--bd)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Tempo real
        </div>
      </div>

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="Total de Leads"     value={stats?.totalLeads ?? '—'}     icon={Users}         color="#086375" />
        <StatsCard label="Leads este mês"     value={stats?.leadsThisMonth ?? '—'} icon={TrendingUp}    color="#3DA13E" />
        <StatsCard label="Mensagens (semana)" value={stats?.recentMessages ?? '—'} icon={MessageSquare} color="#BDFD29" />
        <StatsCard
          label="Valor total"
          value={stats?.totalValue != null ? formatCurrency(stats.totalValue) : '—'}
          icon={DollarSign}
          color="#FF7919"
        />
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Leads por Origem (pie) — 1 col */}
        <div className="card p-5">
          <SectionHeading>Leads por origem</SectionHeading>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%" cy="50%"
                    outerRadius={72} innerRadius={40}
                    dataKey="value" paddingAngle={3}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bd)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1">
                {sourceData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[11px]" style={{ color: 'var(--tx-3)' }}>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Leads por Etapa (bar) — 2 cols */}
        <div className="card p-5 xl:col-span-2">
          <SectionHeading>Leads por etapa do pipeline</SectionHeading>
          {stats?.leadsByStage?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.leadsByStage} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                <XAxis
                  dataKey="stageId"
                  tick={{ fill: 'var(--tx-4)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--tx-4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bd)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'var(--bg-surface2)' }}
                />
                <Bar dataKey="_count._all" fill="#3DA13E" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart height={220} />
          )}
        </div>
      </div>

      {/* ── Row 3: Bento stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Leads esta semana */}
        <div className="card p-5">
          <SectionHeading>Esta semana</SectionHeading>
          <p className="text-4xl font-bold tabular-nums mt-2" style={{ color: 'var(--tx-1)' }}>
            {stats?.leadsThisWeek ?? '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tx-4)' }}>novos leads</p>
        </div>

        {/* Leads este mês */}
        <div className="card p-5">
          <SectionHeading>Este mês</SectionHeading>
          <p className="text-4xl font-bold tabular-nums mt-2" style={{ color: 'var(--tx-1)' }}>
            {stats?.leadsThisMonth ?? '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tx-4)' }}>novos leads</p>
        </div>

        {/* Percentual do mês */}
        <div
          className="card p-5 xl:col-span-2 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #3DA13E18 0%, var(--bg-surface) 60%)' }}
        >
          <div>
            <SectionHeading>Eficiência mensal</SectionHeading>
            <p className="text-4xl font-bold tabular-nums mt-2" style={{ color: '#3DA13E' }}>
              {monthPercent !== null ? `${monthPercent}%` : '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--tx-4)' }}>
              dos leads totais vieram este mês
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#3DA13E18', border: '2px solid #3DA13E28' }}
          >
            <ArrowUpRight size={22} style={{ color: '#3DA13E' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
