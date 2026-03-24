import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Phone, Mail, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const SOURCE_BADGE: Record<string, string> = {
  MANUAL: 'bg-dark-600 text-dark-200',
  FORM: 'bg-blue-500/20 text-blue-400',
  WHATSAPP: 'bg-green-500/20 text-green-400',
  GOOGLE_ADS: 'bg-yellow-500/20 text-yellow-400',
  META_ADS: 'bg-purple-500/20 text-purple-400',
};

export function LeadsPage() {
  const [search, setSearch] = useState('');

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', search],
    queryFn: () => api.get('/leads', { params: { search: search || undefined } }).then((r) => r.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-50">Leads</h1>
        <button className="btn-primary">
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-dark-600">
            <tr>
              {['Lead', 'Contato', 'Etapa', 'Origem', 'Valor', 'Ações'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-dark-400 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {leads.map((lead: any) => (
              <tr key={lead.id} className="hover:bg-dark-700/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-dark-100">{lead.name}</p>
                    {lead.company && <p className="text-dark-400 text-xs flex items-center gap-1 mt-0.5"><Building2 size={11} />{lead.company}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <p className="text-dark-300 flex items-center gap-1.5"><Phone size={11} />{lead.phone}</p>
                    {lead.email && <p className="text-dark-400 flex items-center gap-1.5 text-xs"><Mail size={11} />{lead.email}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: lead.stage?.color + '33', color: lead.stage?.color }}
                  >
                    {lead.stage?.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_BADGE[lead.source] || SOURCE_BADGE.MANUAL}`}>
                    {lead.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-dark-200">
                  {lead.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value) : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/leads/${lead.id}`} className="btn-secondary text-xs px-3 py-1.5">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-dark-500">
                  Nenhum lead encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
