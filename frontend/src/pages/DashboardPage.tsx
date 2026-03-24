import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, MessageSquare, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#f59f0a', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  FORM: 'Formulário',
  WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  ORGANIC: 'Orgânico',
  REFERRAL: 'Indicação',
};

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const sourceData = stats?.leadsBySource?.map((s: any) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s._count._all,
  })) || [];

  const cards = [
    { label: 'Total de Leads', value: stats?.totalLeads || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Leads este mês', value: stats?.leadsThisMonth || 0, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Mensagens (semana)', value: stats?.recentMessages || 0, icon: MessageSquare, color: 'text-brand-400' },
    {
      label: 'Valor total',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalValue || 0),
      icon: DollarSign,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-50">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-dark-400 text-sm">{label}</p>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-dark-50">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-dark-100 mb-4">Leads por Origem</h2>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {sourceData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">Sem dados ainda</div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-dark-100 mb-4">Leads por Etapa</h2>
          {stats?.leadsByStage?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.leadsByStage}>
                <XAxis dataKey="stageId" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="_count._all" fill="#f59f0a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">Sem dados ainda</div>
          )}
        </div>
      </div>
    </div>
  );
}
