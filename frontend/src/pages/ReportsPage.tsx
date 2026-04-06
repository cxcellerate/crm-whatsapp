import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart2, TrendingUp, Users } from 'lucide-react';
import { api } from '../services/api';
import { Lead } from '../types';
import { useThemeStore } from '../store/theme.store';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import toast from 'react-hot-toast';

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads', ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

export function ReportsPage() {
  const [period, setPeriod] = useState<'month' | '3months' | '6months'>('month');
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  // Cores dos gráficos adaptadas ao tema
  const chartColors = {
    grid:    isLight ? '#e2e8f0' : '#2d2d2d',
    tick:    isLight ? '#5a6478' : '#737373',
    tooltip: isLight ? { background: '#ffffff', border: '#dde2ec' } : { background: '#1f1f1f', border: '#2d2d2d' },
  };

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads-all'],
    queryFn: () => api.get('/leads').then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return { date: format(date, 'dd/MM'), fullDate: date, leads: 0 };
  });

  leads.forEach((lead: Lead) => {
    const created = new Date(lead.createdAt);
    const entry = last30.find((d) => format(d.fullDate, 'dd/MM') === format(created, 'dd/MM'));
    if (entry) entry.leads++;
  });

  const bySource = Object.entries(
    leads.reduce((acc: Record<string, number>, lead: Lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {})
  ).map(([source, count]) => ({ name: SOURCE_LABELS[source] || source, leads: count }));

  const valueBySource = Object.entries(
    leads.reduce((acc: Record<string, number>, lead: Lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + (lead.value || 0);
      return acc;
    }, {})
  )
    .filter(([, v]) => v > 0)
    .map(([source, value]) => ({ name: SOURCE_LABELS[source] || source, value }));

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  function exportCSV() {
    const headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Valor', 'Etapa', 'Origem', 'Criado em'];
    const rows = leads.map((l: Lead) => [
      l.name, l.phone, l.email || '', l.company || '', l.value || 0,
      l.stage?.name || '', SOURCE_LABELS[l.source] || l.source,
      format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${leads.length} leads exportados!`);
  }

  function exportReport() {
    const total = leads.length;
    const totalValue = leads.reduce((s: number, l: Lead) => s + (l.value || 0), 0);
    const thisMonth = leads.filter((l: Lead) => {
      const d = new Date(l.createdAt);
      return d >= startOfMonth(new Date()) && d <= endOfMonth(new Date());
    }).length;
    const text = `RELATÓRIO CRM WHATSAPP\nGerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n${'='.repeat(50)}\n\nRESUMO GERAL\n  Total de leads:    ${total}\n  Leads este mês:    ${thisMonth}\n  Valor total:       ${formatCurrency(totalValue)}\n\nLEADS POR ORIGEM\n${bySource.map((s) => `  ${s.name.padEnd(20)} ${s.leads} leads`).join('\n')}\n\nLISTA COMPLETA DE LEADS\n${leads.map((l: Lead, i: number) => `${(i + 1).toString().padStart(3)}. ${l.name} | ${l.phone} | ${l.stage?.name || 'Sem etapa'} | ${SOURCE_LABELS[l.source]}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Relatório exportado!');
  }

  const totalValue = leads.reduce((s: number, l: Lead) => s + (l.value || 0), 0);
  const leadsWithValue = leads.filter((l: Lead) => l.value);
  const ticketMedio = leadsWithValue.length > 0 ? formatCurrency(totalValue / leadsWithValue.length) : 'R$ 0';

  const tooltipStyle = {
    background: chartColors.tooltip.background,
    border: `1px solid ${chartColors.tooltip.border}`,
    borderRadius: 8,
    color: isLight ? '#0f1117' : '#f0f0f0',
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--tx-1)' }}>Relatórios</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-4)' }}>Análise de performance do CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={exportCSV}>
            <Download size={15} /> Exportar CSV
          </button>
          <button className="btn-secondary" onClick={exportReport}>
            <FileText size={15} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de leads', value: leads.length, icon: Users, color: '#086375' },
          { label: 'Este mês', value: stats?.leadsThisMonth ?? 0, icon: TrendingUp, color: '#3DA13E' },
          { label: 'Valor total', value: formatCurrency(totalValue), icon: BarChart2, color: '#BDFD29' },
          { label: 'Ticket médio', value: ticketMedio, icon: TrendingUp, color: '#FF7919' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--tx-4)' }}>{label}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '18', border: `1px solid ${color}28` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--tx-1)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Leads por dia */}
      <div className="card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--tx-4)' }}>
          Leads por dia (últimos 30 dias)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={last30} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: chartColors.tick, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#3DA13E', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="leads" stroke="#3DA13E" strokeWidth={2} dot={false} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por origem */}
        <div className="card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--tx-4)' }}>
            Leads por origem
          </h2>
          {bySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bySource} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: chartColors.tick, fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="leads" fill="#3DA13E" radius={[0, 6, 6, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--tx-4)' }}>Sem dados</div>
          )}
        </div>

        {/* Valor por origem */}
        <div className="card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--tx-4)' }}>
            Valor em negociação por origem
          </h2>
          {valueBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={valueBySource} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: chartColors.tick, fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#FF7919" radius={[0, 6, 6, 0]} name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--tx-4)' }}>Nenhum lead com valor</div>
          )}
        </div>
      </div>

      {/* Tabela resumo por etapa */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--bd)' }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--tx-4)' }}>
            Resumo por Etapa
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b" style={{ borderColor: 'var(--bd)' }}>
            <tr>
              {['Etapa', 'Leads', 'Valor total', 'Ticket médio'].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              leads.reduce((acc: Record<string, { name: string; color: string; leads: Lead[] }>, lead: Lead) => {
                const key = lead.stageId;
                if (!acc[key]) acc[key] = { name: lead.stage?.name || 'Sem etapa', color: lead.stage?.color || '#3DA13E', leads: [] };
                acc[key].leads.push(lead);
                return acc;
              }, {})
            ).map(([stageId, data]) => {
              const total = data.leads.reduce((s, l) => s + (l.value || 0), 0);
              const withValue = data.leads.filter((l) => l.value);
              return (
                <tr
                  key={stageId}
                  className="border-b transition-colors"
                  style={{ borderColor: 'var(--bd)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                      <span style={{ color: 'var(--tx-1)' }}>{data.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3" style={{ color: 'var(--tx-2)' }}>{data.leads.length}</td>
                  <td className="px-6 py-3" style={{ color: 'var(--tx-2)' }}>{total > 0 ? formatCurrency(total) : '—'}</td>
                  <td className="px-6 py-3" style={{ color: 'var(--tx-2)' }}>{withValue.length > 0 ? formatCurrency(total / withValue.length) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
