import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Stage, Lead } from '../../types';
import { KanbanCard } from './KanbanCard';

interface Props {
  stage: Stage;
  leads: Lead[];
  onAddLead?: (stageId: string) => void;
}

export function KanbanColumn({ stage, leads, onAddLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <div className="shrink-0 w-72 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--tx-1)' }}>{stage.name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--bg-surface2)', color: 'var(--tx-3)', border: '1px solid var(--bd)' }}
          >
            {leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddLead?.(stage.id)}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--tx-4)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface2)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-4)'; }}
          title="Adicionar lead"
        >
          <Plus size={14} />
        </button>
      </div>

      {totalValue > 0 && (
        <p className="text-xs px-1 mb-2" style={{ color: 'var(--tx-4)' }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
        </p>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-colors ${
          isOver ? 'bg-brand-500/10 ring-1 ring-brand-500/40' : ''
        }`}
        style={isOver ? {} : { backgroundColor: 'var(--bg-surface2)' }}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="text-center text-xs py-8" style={{ color: 'var(--tx-4)' }}>Arraste leads aqui</p>
        )}
      </div>
    </div>
  );
}
