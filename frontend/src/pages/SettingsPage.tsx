import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wifi, Users, GitBranch, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { usePipelines, useCreatePipeline, useCreateStage, useDeleteStage } from '../hooks/usePipelines';
import { WhatsAppProviderConfig } from '../components/whatsapp/WhatsAppProviderConfig';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [deletingStage, setDeletingStage] = useState<{ pipelineId: string; stageId: string } | null>(null);

  const { data: pipelines = [] } = usePipelines();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) });
  const createPipeline = useCreatePipeline();
  const createStage = useCreateStage();
  const deleteStage = useDeleteStage();

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!newPipelineName.trim()) return;
    await createPipeline.mutateAsync({ name: newPipelineName });
    setNewPipelineName('');
  }

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim() || !selectedPipelineId) return;
    await createStage.mutateAsync({ pipelineId: selectedPipelineId, name: newStageName, color: newStageColor });
    setNewStageName('');
    setStageModalOpen(false);
  }

  const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#14b8a6', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e', '#f97316'];

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-dark-50">Configurações</h1>

      {/* WhatsApp — com seletor de provedor */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Wifi size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">WhatsApp Business</h2>
        </div>
        <WhatsAppProviderConfig />
      </div>

      {/* Pipelines */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <GitBranch size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">Pipelines e Etapas</h2>
        </div>

        <form onSubmit={handleCreatePipeline} className="flex gap-2">
          <input className="input flex-1" placeholder="Nome do novo pipeline..." value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={createPipeline.isPending}>
            <Plus size={16} /> Criar
          </button>
        </form>

        <div className="space-y-4">
          {pipelines.map((pipeline: any) => (
            <div key={pipeline.id} className="bg-dark-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-dark-100">{pipeline.name}</p>
                <button
                  className="btn-secondary text-xs px-3 py-1.5"
                  onClick={() => { setSelectedPipelineId(pipeline.id); setStageModalOpen(true); }}
                >
                  <Plus size={13} /> Etapa
                </button>
              </div>
              <div className="space-y-1.5">
                {pipeline.stages?.slice().sort((a: any, b: any) => a.order - b.order).map((stage: any) => (
                  <div key={stage.id} className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm text-dark-200 flex-1">{stage.name}</span>
                    <span className="text-xs text-dark-500">{stage._count?.leads || 0} leads</span>
                    <button
                      className="p-1 hover:bg-red-500/10 rounded text-dark-600 hover:text-red-400 transition-colors"
                      onClick={() => setDeletingStage({ pipelineId: pipeline.id, stageId: stage.id })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {pipeline.stages?.length === 0 && (
                  <p className="text-dark-600 text-xs px-3">Nenhuma etapa. Adicione a primeira.</p>
                )}
              </div>
            </div>
          ))}
          {pipelines.length === 0 && (
            <p className="text-dark-500 text-sm text-center py-4">Crie seu primeiro pipeline acima.</p>
          )}
        </div>
      </div>

      {/* Equipe */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">Equipe</h2>
        </div>
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center text-dark-300 font-medium text-sm">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-100">{user.name}</p>
                  <p className="text-xs text-dark-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.active ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-600 text-dark-300'}`}>
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nova etapa */}
      <Modal open={stageModalOpen} onClose={() => setStageModalOpen(false)} title="Nova Etapa" size="sm">
        <form onSubmit={handleCreateStage} className="space-y-4">
          <div>
            <label className="label">Nome da etapa *</label>
            <input className="input" placeholder="Ex: Proposta enviada" value={newStageName} onChange={e => setNewStageName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((c) => (
                <button key={c} type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${newStageColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} onClick={() => setNewStageColor(c)} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setStageModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createStage.isPending}>Criar etapa</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingStage}
        onClose={() => setDeletingStage(null)}
        onConfirm={async () => { if (deletingStage) { await deleteStage.mutateAsync(deletingStage); setDeletingStage(null); } }}
        title="Remover etapa"
        message="Os leads nesta etapa não serão deletados, mas ficarão sem etapa. Deseja continuar?"
        loading={deleteStage.isPending}
      />
    </div>
  );
}
