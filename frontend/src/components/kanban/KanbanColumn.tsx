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
          <span className="text-sm font-semibold text-dark-200 truncate">{stage.name}</span>
          <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full shrink-0">{leads.length}</span>
        </div>
        <button
          onClick={() => onAddLead?.(stage.id)}
          className="p-1 hover:bg-dark-700 rounded-lg text-dark-500 hover:text-dark-300 transition-colors"
          title="Adicionar lead"
        >
          <Plus size={14} />
        </button>
      </div>

      {totalValue > 0 && (
        <p className="text-xs text-dark-500 px-1 mb-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
        </p>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-colors ${
          isOver ? 'bg-brand-500/10 ring-1 ring-brand-500/40' : 'bg-dark-700/30'
        }`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="text-center text-dark-600 text-xs py-8">Arraste leads aqui</p>
        )}
      </div>
    </div>
  );
}
