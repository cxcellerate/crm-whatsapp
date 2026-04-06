import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useLeads, useMoveLead } from '../hooks/useLeads';
import { usePipelines } from '../hooks/usePipelines';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadModal } from '../components/leads/LeadModal';
import { Spinner } from '../components/ui/Spinner';
import { Lead, Stage } from '../types';

export function KanbanPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  const { data: pipelines = [], isLoading: loadingPipelines } = usePipelines();
  const { data: leads = [], isLoading: loadingLeads } = useLeads();
  const moveLead = useMoveLead();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeLead = leads.find((l: Lead) => l.id === activeId);
  const pipeline = pipelines[0];
  const stages: Stage[] = pipeline?.stages?.slice().sort((a: Stage, b: Stage) => a.order - b.order) ?? [];

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(_event: DragOverEvent) {}

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const targetStageId = stages.find((s: Stage) => s.id === over.id)
      ? String(over.id)
      : leads.find((l: Lead) => l.id === over.id)?.stageId;

    if (targetStageId) {
      moveLead.mutate({ leadId: String(active.id), stageId: targetStageId });
    }
  }

  function handleAddLead(stageId: string) {
    setDefaultStageId(stageId);
    setModalOpen(true);
  }

  if (loadingPipelines || loadingLeads) {
    return <div className="flex items-center justify-center h-full"><Spinner size={32} /></div>;
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Pipeline Kanban</h1>
          {pipeline && <p className="text-dark-500 text-sm mt-0.5">{pipeline.name}</p>}
        </div>
        <button className="btn-primary" onClick={() => { setDefaultStageId(stages[0]?.id); setModalOpen(true); }}>
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
          {stages.map((stage: Stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={leads.filter((l: Lead) => l.stageId === stage.id)}
              onAddLead={handleAddLead}
            />
          ))}
          {stages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-dark-500 text-sm">
              Nenhum pipeline configurado. Vá em <strong className="mx-1 text-dark-300">Configurações</strong> para criar etapas.
            </div>
          )}
        </div>

        <DragOverlay>
          {activeLead && <div className="rotate-2 opacity-90"><LeadCard lead={activeLead} /></div>}
        </DragOverlay>
      </DndContext>

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
