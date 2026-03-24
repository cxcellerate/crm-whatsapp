import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Tag, Building2, DollarSign, User, Clock } from 'lucide-react';
import { useLead } from '../hooks/useLeads';
import { WhatsAppChat } from '../components/whatsapp/WhatsAppChat';
import { LeadModal } from '../components/leads/LeadModal';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Activity } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: '📝',
  STAGE_CHANGE: '🔄',
  MESSAGE_SENT: '📤',
  MESSAGE_RECEIVED: '📥',
  CALL: '📞',
  MEETING: '📅',
  EMAIL: '✉️',
  TASK: '✅',
};

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [editOpen, setEditOpen] = useState(false);

  const { data: lead, isLoading } = useLead(id!);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size={32} /></div>;
  if (!lead) return <p className="text-dark-400">Lead não encontrado.</p>;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/leads" className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-dark-50 truncate">{lead.name}</h1>
            <Badge color={lead.stage?.color}>{lead.stage?.name}</Badge>
          </div>
          {lead.company && <p className="text-dark-500 text-sm flex items-center gap-1 mt-0.5"><Building2 size={12} />{lead.company}</p>}
        </div>
        <button className="btn-secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={14} /> Editar
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
          {/* Info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Informações</h3>
            <div className="space-y-2.5">
              {lead.value && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-brand-400 shrink-0" />
                  <span className="text-brand-400 font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                  </span>
                </div>
              )}
              {lead.user && (
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <User size={14} className="text-dark-500 shrink-0" />
                  <span>{lead.user.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <Clock size={14} className="text-dark-500 shrink-0" />
                <span>{format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {lead.source && (
                <div>
                  <span className="text-xs text-dark-500">Origem</span>
                  <p className="text-dark-300 text-sm mt-0.5">{lead.source}</p>
                </div>
              )}
              {(lead.utmSource || lead.utmCampaign) && (
                <div className="bg-dark-800 rounded-lg p-2 text-xs space-y-1 text-dark-500">
                  {lead.utmSource && <p>Fonte: <span className="text-dark-300">{lead.utmSource}</span></p>}
                  {lead.utmMedium && <p>Mídia: <span className="text-dark-300">{lead.utmMedium}</span></p>}
                  {lead.utmCampaign && <p>Campanha: <span className="text-dark-300">{lead.utmCampaign}</span></p>}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full text-xs">
                    <Tag size={9} />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">Observações</h3>
              <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Activities */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-3">Atividades</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {lead.activities?.map((a: Activity) => (
                <div key={a.id} className="flex gap-2">
                  <span className="text-sm shrink-0">{ACTIVITY_ICONS[a.type]}</span>
                  <div>
                    <p className="text-dark-300 text-xs leading-relaxed">{a.content}</p>
                    <p className="text-dark-600 text-[10px] mt-0.5">
                      {format(new Date(a.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      {a.user && ` · ${a.user.name}`}
                    </p>
                  </div>
                </div>
              ))}
              {(!lead.activities || lead.activities.length === 0) && (
                <p className="text-dark-600 text-xs">Nenhuma atividade ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
          <WhatsAppChat leadId={lead.id} leadPhone={lead.phone} />
        </div>
      </div>

      <LeadModal open={editOpen} onClose={() => setEditOpen(false)} lead={lead} />
    </div>
  );
}
