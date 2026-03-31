import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, DollarSign } from 'lucide-react';
import { Lead } from '../../types';
import { Badge } from '../ui/Badge';

interface Props {
  lead: Lead;
}

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: '#3DA13E',
  FORM: '#086375',
  WHATSAPP: '#BDFD29',
  GOOGLE_ADS: '#FF7919',
  META_ADS: '#086375',
  ORGANIC: '#007F5F',
  REFERRAL: '#FF7919',
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  FORM: 'Formulário',
  WHATSAPP: 'WhatsApp',
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  ORGANIC: 'Orgânico',
  REFERRAL: 'Indicação',
};

export function LeadCard({ lead }: Props) {
  return (
    <Link
      to={`/leads/${lead.id}`}
      className="block card p-3 hover:border-brand-500/40 transition-all hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-dark-100 text-sm group-hover:text-dark-50 leading-tight">{lead.name}</p>
        <Badge color={SOURCE_COLORS[lead.source]}>{SOURCE_LABELS[lead.source]}</Badge>
      </div>

      <div className="space-y-1">
        <p className="text-dark-400 text-xs flex items-center gap-1.5">
          <Phone size={10} className="shrink-0" />
          {lead.phone}
        </p>
        {lead.email && (
          <p className="text-dark-500 text-xs flex items-center gap-1.5">
            <Mail size={10} className="shrink-0" />
            {lead.email}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dark-700">
        {lead.value ? (
          <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
            <DollarSign size={10} />
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
          </span>
        ) : (
          <span />
        )}
        {lead._count && lead._count.messages > 0 && (
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <MessageSquare size={10} />
            {lead._count.messages}
          </span>
        )}
      </div>

      {lead.user && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-4 h-4 bg-dark-600 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-dark-300">{lead.user.name[0]}</span>
          </div>
          <span className="text-[11px] text-dark-500">{lead.user.name}</span>
        </div>
      )}
    </Link>
  );
}
