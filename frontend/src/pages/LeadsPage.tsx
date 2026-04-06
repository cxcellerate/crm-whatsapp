import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useLeads, useDeleteLead } from '../hooks/useLeads';
import { LeadModal } from '../components/leads/LeadModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Lead } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: '#3DA13E', FORM: '#086375', WHATSAPP: '#BDFD29',
  GOOGLE_ADS: '#FF7919', META_ADS: '#086375', ORGANIC: '#007F5F', REFERRAL: '#FF7919',
};
const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads', ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: leads = [], isLoading } = useLeads(search ? { search } : undefined);
  const deleteLead = useDeleteLead();

  function handleEdit(lead: Lead) {
    setEditingLead(lead);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingLead(null);
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteLead.mutateAsync(deletingId);
    setDeletingId(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tx-1)' }}>Leads</h1>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tx-4)' }} />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead encontrado"
          description={search ? 'Tente outro termo de busca' : 'Crie seu primeiro lead clicando em "Novo Lead"'}
          action={!search && <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Novo Lead</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: 'var(--bd)' }}>
              <tr>
                {['Lead', 'Contato', 'Etapa', 'Origem', 'Valor', 'Criado em', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--tx-3)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: Lead) => (
                <tr
                  key={lead.id}
                  className="border-b transition-colors"
                  style={{ borderColor: 'var(--bd)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm" style={{ color: 'var(--tx-1)' }}>{lead.name}</p>
                    {lead.company && <p className="text-xs mt-0.5" style={{ color: 'var(--tx-4)' }}>{lead.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--tx-2)' }}>{lead.phone}</p>
                    {lead.email && <p className="text-xs mt-0.5" style={{ color: 'var(--tx-4)' }}>{lead.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={lead.stage?.color}>{lead.stage?.name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={SOURCE_COLORS[lead.source]}>{SOURCE_LABELS[lead.source]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--tx-2)' }}>
                    {lead.value
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--tx-4)' }}>
                    {format(new Date(lead.createdAt), "dd/MM/yy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--tx-3)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface2)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-3)'; }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingId(lead.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--tx-3)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-3)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--bd)', color: 'var(--tx-4)' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <LeadModal open={modalOpen} onClose={closeModal} lead={editingLead} />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover lead"
        message="Tem certeza que deseja remover este lead? Todas as mensagens e atividades serão perdidas."
        loading={deleteLead.isPending}
      />
    </div>
  );
}
