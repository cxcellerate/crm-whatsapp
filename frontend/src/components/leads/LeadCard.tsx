import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, DollarSign, Building2 } from 'lucide-react';
import { Lead } from '../../types';

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: '#6366f1', FORM: '#2563EB', WHATSAPP: '#10B981',
  GOOGLE_ADS: '#F59E0B', META_ADS: '#8B5CF6', ORGANIC: '#14B8A6', REFERRAL: '#EF4444',
};
const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual', FORM: 'Formulário', WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads', META_ADS: 'Meta Ads', ORGANIC: 'Orgânico', REFERRAL: 'Indicação',
};

export function LeadCard({ lead }: { lead: Lead }) {
  const color = SOURCE_COLORS[lead.source] || '#6366f1';

  return (
    <Link
      to={`/leads/${lead.id}`}
      className="block bg-white border border-surface-200 rounded-xl p-3.5 shadow-card
        hover:shadow-card-md hover:border-primary-200 transition-all duration-150 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="font-semibold text-surface-800 text-sm group-hover:text-primary-700 leading-tight line-clamp-1">
          {lead.name}
        </p>
        <span
          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + '18', color }}
        >
          {SOURCE_LABELS[lead.source]}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-surface-500 text-xs flex items-center gap-1.5">
          <Phone size={10} className="shrink-0 text-surface-400" />{lead.phone}
        </p>
        {lead.email && (
          <p className="text-surface-400 text-xs flex items-center gap-1.5">
            <Mail size={10} className="shrink-0" />{lead.email}
          </p>
        )}
        {lead.company && (
          <p className="text-surface-400 text-xs flex items-center gap-1.5">
            <Building2 size={10} className="shrink-0" />{lead.company}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-surface-100">
        {lead.value ? (
          <span className="text-xs text-primary-600 font-semibold flex items-center gap-1">
            <DollarSign size={10} />
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
          </span>
        ) : <span />}
        {lead._count && lead._count.messages > 0 && (
          <span className="text-xs text-surface-400 flex items-center gap-1">
            <MessageSquare size={10} />{lead._count.messages}
          </span>
        )}
      </div>

      {lead.user && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">{lead.user.name[0]}</span>
          </div>
          <span className="text-[11px] text-surface-400">{lead.user.name}</span>
        </div>
      )}
    </Link>
  );
}
