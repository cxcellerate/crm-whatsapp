import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, TrendingUp, MessageSquare, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6'];

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads',
  ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function KpiCard({ label, value, icon: Icon, color, trend, trendLabel }: any) {
  const up = trend === undefined || trend >= 0;
  return (
    <motion.div variants={item} className="card p-5 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${up ? 'text-success-600 bg-success-50' : 'text-danger-600 bg-danger-50'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 tracking-tight">{value ?? '—'}</p>
      <p className="text-xs font-medium text-surface-500 mt-1 uppercase tracking-wide">{label}</p>
      {trendLabel && <p className="text-[11px] text-surface-400 mt-0.5">{trendLabel}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-card-md p-3 text-sm">
      <p className="font-semibold text-surface-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export function DashboardPage() {
  useSocket();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const sourceData = stats?.leadsBySource?.map((s: any) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s._count._all,
  })) || [];

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const kpis = [
    { label: 'Total de Leads',     value: stats?.totalLeads,     icon: Users,          color: '#2563EB', trend: 12, trendLabel: 'vs. mês anterior' },
    { label: 'Leads este mês',     value: stats?.leadsThisMonth, icon: TrendingUp,      color: '#10B981', trend: 8,  trendLabel: 'meta: crescimento' },
    { label: 'Mensagens (semana)', value: stats?.recentMessages, icon: MessageSquare,   color: '#F59E0B' },
    { label: 'Valor em Pipeline',  value: stats?.totalValue != null ? fmt(stats.totalValue) : null, icon: DollarSign, color: '#8B5CF6' },
  ];

  // Dados fictícios de área para demo
  const areaData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i],
    leads: Math.floor(Math.random() * 40 + 10),
    conversoes: Math.floor(Math.random() * 20 + 5),
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Área — leads ao longo do tempo */}
        <motion.div variants={item} className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-surface-800">Evolução de Leads</p>
              <p className="text-xs text-surface-500 mt-0.5">Leads e conversões por mês</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary-500 rounded-full inline-block" />Leads</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-success-500 rounded-full inline-block" />Conversões</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={areaData} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F4FD" />
              <XAxis dataKey="month" tick={{ fill: '#A8B4D8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A8B4D8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads"      stroke="#2563EB" strokeWidth={2} fill="url(#gLeads)" name="Leads" />
              <Area type="monotone" dataKey="conversoes" stroke="#10B981" strokeWidth={2} fill="url(#gConv)"  name="Conversões" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut — por origem */}
        <motion.div variants={item} className="card p-6">
          <p className="font-bold text-surface-800 mb-1">Por Origem</p>
          <p className="text-xs text-surface-500 mb-4">Distribuição de leads</p>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {sourceData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sourceData.slice(0, 4).map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-surface-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-surface-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <Activity size={28} className="text-surface-300 mx-auto mb-2" />
                <p className="text-surface-400 text-xs">Sem dados ainda</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Esta semana',  value: stats?.leadsThisWeek,  color: 'text-primary-600',  bg: 'bg-primary-50',  border: 'border-primary-100' },
          { label: 'Este mês',     value: stats?.leadsThisMonth, color: 'text-success-600',  bg: 'bg-success-50',  border: 'border-green-100' },
          { label: 'Taxa do mês',  value: stats?.totalLeads && stats?.leadsThisMonth ? `${Math.round((stats.leadsThisMonth / stats.totalLeads) * 100)}%` : '—', color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-yellow-100' },
        ].map(({ label, value, color, bg, border }) => (
          <motion.div key={label} variants={item} className={`card p-5 text-center border-2 ${border}`}>
            <p className={`text-3xl font-bold ${color} tracking-tight`}>{value ?? '—'}</p>
            <p className="text-xs font-medium text-surface-500 mt-1 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
