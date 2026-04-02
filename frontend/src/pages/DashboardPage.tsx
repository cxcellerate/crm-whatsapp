import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, MessageSquare, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useSocket } from '../hooks/useSocket';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = ['#3DA13E', '#086375', '#BDFD29', '#FF7919', '#007F5F', '#4D4D4D'];

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads',
  ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

export function DashboardPage() {
  useSocket(); // inicia conexão WebSocket global

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    staleTime: 1000 * 60 * 5, // WebSocket invalida ao criar/mover leads
  });

  const sourceData = stats?.leadsBySource?.map((s: any) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s._count._all,
  })) || [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-50">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="Total de Leads" value={stats?.totalLeads ?? '—'} icon={Users} color="#086375" />
        <StatsCard label="Leads este mês" value={stats?.leadsThisMonth ?? '—'} icon={TrendingUp} color="#3DA13E" />
        <StatsCard label="Mensagens (semana)" value={stats?.recentMessages ?? '—'} icon={MessageSquare} color="#BDFD29" />
        <StatsCard
          label="Valor total"
          value={stats?.totalValue != null ? formatCurrency(stats.totalValue) : '—'}
          icon={DollarSign}
          color="#FF7919"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Origem */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 uppercase tracking-wide">Leads por Origem</h2>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {sourceData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f1f1f', border: '1px solid #2d2d2d', borderRadius: 8 }}
                  labelStyle={{ color: '#d4d4d4' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-600 text-sm">
              Sem dados ainda
            </div>
          )}
          {sourceData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {sourceData.map((item: any, i: number) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-dark-400">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads por semana */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-dark-200 mb-4 uppercase tracking-wide">Leads por Etapa</h2>
          {stats?.leadsByStage?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.leadsByStage} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                <XAxis dataKey="stageId" tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1f1f1f', border: '1px solid #2d2d2d', borderRadius: 8 }}
                  cursor={{ fill: '#2d2d2d' }}
                />
                <Bar dataKey="_count._all" fill="#3DA13E" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-600 text-sm">
              Sem dados ainda
            </div>
          )}
        </div>
      </div>

      {/* Leads esta semana vs mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-dark-50">{stats?.leadsThisWeek ?? '—'}</p>
          <p className="text-dark-500 text-sm mt-1">Leads esta semana</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-dark-50">{stats?.leadsThisMonth ?? '—'}</p>
          <p className="text-dark-500 text-sm mt-1">Leads este mês</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-brand-400">
            {stats?.totalLeads && stats?.leadsThisMonth
              ? `${Math.round((stats.leadsThisMonth / stats.totalLeads) * 100)}%`
              : '—'}
          </p>
          <p className="text-dark-500 text-sm mt-1">Leads do mês / total</p>
        </div>
      </div>
    </div>
  );
}
