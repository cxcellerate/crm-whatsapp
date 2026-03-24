import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Plus, Phone } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function KanbanPage() {
  const queryClient = useQueryClient();

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines').then((r) => r.data),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.get('/leads').then((r) => r.data),
  });

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      api.patch(`/leads/${leadId}/move`, { stageId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
    onError: () => toast.error('Erro ao mover lead'),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    moveMutation.mutate({ leadId: String(active.id), stageId: String(over.id) });
  }

  const pipeline = pipelines[0];
  const stages = pipeline?.stages || [];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-50">Pipeline Kanban</h1>
        <button className="btn-primary"><Plus size={16} /> Novo Lead</button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {stages.map((stage: any) => {
            const stageLeads = leads.filter((l: any) => l.stageId === stage.id);
            return (
              <div key={stage.id} className="shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold text-dark-200">{stage.name}</span>
                  </div>
                  <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[200px] bg-dark-700/30 rounded-xl p-2">
                  {stageLeads.map((lead: any) => (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      className="block card p-3 hover:border-brand-500/50 transition-colors cursor-pointer"
                    >
                      <p className="font-medium text-dark-100 text-sm">{lead.name}</p>
                      <p className="text-dark-400 text-xs flex items-center gap-1 mt-1">
                        <Phone size={10} />{lead.phone}
                      </p>
                      {lead.value && (
                        <p className="text-brand-400 text-xs font-medium mt-1.5">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                        </p>
                      )}
                    </Link>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-center text-dark-600 text-xs py-8">Arraste leads aqui</p>
                  )}
                </div>
              </div>
            );
          })}

          {stages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-dark-500 text-sm">
              Nenhum pipeline configurado. Vá em Configurações para criar.
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
