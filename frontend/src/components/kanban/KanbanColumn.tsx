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
  const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0);

  return (
    <div className="shrink-0 w-72 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-bold text-surface-700 truncate">{stage.name}</span>
          <span className="text-xs bg-surface-200 text-surface-500 font-semibold px-2 py-0.5 rounded-full">{leads.length}</span>
        </div>
        <button
          onClick={() => onAddLead?.(stage.id)}
          className="p-1 hover:bg-surface-200 rounded-lg text-surface-400 hover:text-surface-700 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {totalValue > 0 && (
        <p className="text-xs font-semibold text-primary-600 px-0.5 mb-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue)}
        </p>
      )}

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[160px] rounded-2xl p-2 space-y-2 transition-colors duration-150 ${
          isOver ? 'bg-primary-50 ring-2 ring-primary-200' : 'bg-surface-200/60'
        }`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => <KanbanCard key={lead.id} lead={lead} />)}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-surface-400 text-xs">Arraste leads aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
