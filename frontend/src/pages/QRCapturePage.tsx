import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Plus, Copy, Trash2, ToggleRight, ToggleLeft, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { usePipelines } from '../hooks/usePipelines';
import { useQuery as useUsersQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface FormCaptureForm {
  name: string;
  stageId: string;
  assignTo: string;
}

export function QRCapturePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: forms = [] } = useQuery({
    queryKey: ['form-captures'],
    queryFn: () => api.get('/form-captures').then((r) => r.data),
  });

  const { data: pipelines = [] } = usePipelines();
  const { data: users = [] } = useUsersQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const allStages = pipelines.flatMap((p: any) =>
    p.stages.map((s: any) => ({ ...s, pipelineName: p.name }))
  );

  const create = useMutation({
    mutationFn: (data: FormCaptureForm) => api.post('/form-captures', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-captures'] });
      toast.success('Formulário criado!');
      setCreateOpen(false);
      reset();
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/form-captures/${id}`, { active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-captures'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/form-captures/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-captures'] });
      toast.success('Formulário removido');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormCaptureForm>();

  const BASE_URL = window.location.origin;

  function copyWebhook(token: string) {
    const url = `${BASE_URL}/api/webhooks/form/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  }

  function copyFormEmbed(token: string) {
    const snippet = `<script>
  fetch('${BASE_URL}/api/webhooks/form/${token}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
    })
  });
</script>`;
    navigator.clipboard.writeText(snippet);
    toast.success('Snippet copiado!');
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Captura de Leads</h1>
          <p className="text-dark-500 text-sm mt-0.5">Formulários e webhooks para capturar leads automaticamente</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Novo Formulário
        </button>
      </div>

      {/* Como funciona */}
      <div className="card p-5 bg-brand-500/5 border-brand-500/20">
        <h3 className="font-medium text-dark-100 mb-3 flex items-center gap-2">
          <QrCode size={16} className="text-brand-400" /> Como funciona
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-dark-400">
          {[
            { step: '1', title: 'Crie um formulário', desc: 'Defina etapa e responsável padrão' },
            { step: '2', title: 'Integre no seu site', desc: 'Use a URL webhook ou snippet JS' },
            { step: '3', title: 'Leads chegam automático', desc: 'Notificação em tempo real no CRM' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-8 h-8 bg-brand-500/20 text-brand-400 rounded-lg flex items-center justify-center text-sm font-bold mx-auto mb-2">{step}</div>
              <p className="text-dark-200 font-medium text-xs">{title}</p>
              <p className="text-dark-500 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de formulários */}
      {forms.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Nenhum formulário criado"
          description="Crie um formulário para começar a capturar leads automaticamente"
          action={<button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Novo Formulário</button>}
        />
      ) : (
        <div className="space-y-3">
          {forms.map((form: any) => (
            <div key={form.id} className={`card p-5 space-y-3 ${!form.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-dark-100">{form.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${form.active ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-500'}`}>
                      {form.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-dark-500 text-xs mt-1 font-mono">{form.token}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggle.mutate({ id: form.id, active: !form.active })} className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors" title={form.active ? 'Desativar' : 'Ativar'}>
                    {form.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => remove.mutate(form.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-dark-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-dark-500 mb-1">URL Webhook (POST)</p>
                  <div className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2">
                    <code className="text-xs text-brand-400 flex-1 truncate">
                      {BASE_URL}/api/webhooks/form/{form.token}
                    </code>
                    <button onClick={() => copyWebhook(form.token)} className="shrink-0 p-1 hover:bg-dark-700 rounded text-dark-500 hover:text-dark-200">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyFormEmbed(form.token)} className="btn-secondary text-xs px-3 py-1.5">
                    <Copy size={12} /> Copiar snippet JS
                  </button>
                  <button onClick={() => setQrPreview(form.token)} className="btn-secondary text-xs px-3 py-1.5">
                    <QrCode size={12} /> Ver QR Code
                  </button>
                  <a href={`/api/webhooks/form/${form.token}/preview`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">
                    <ExternalLink size={12} /> Preview
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Novo Formulário de Captura" size="sm">
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nome do formulário *</label>
            <input className="input" placeholder="Ex: Formulário do site, Landing Page..." {...register('name', { required: true })} />
            {errors.name && <p className="text-red-400 text-xs mt-1">Nome obrigatório</p>}
          </div>
          <div>
            <label className="label">Etapa padrão dos leads</label>
            <select className="input" {...register('stageId')}>
              <option value="">Primeira etapa do pipeline</option>
              {allStages.map((s: any) => (
                <option key={s.id} value={s.id}>{s.pipelineName} → {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Responsável padrão</label>
            <select className="input" {...register('assignTo')}>
              <option value="">Sem responsável</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => { setCreateOpen(false); reset(); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Criando...' : 'Criar formulário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal QR Code */}
      <Modal open={!!qrPreview} onClose={() => setQrPreview(null)} title="QR Code do Formulário" size="sm">
        {qrPreview && (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-white rounded-xl mx-auto flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${BASE_URL}/api/webhooks/form/${qrPreview}`)}`}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-dark-400 text-sm">Escaneie para abrir o formulário de captura</p>
            <button
              className="btn-secondary w-full justify-center"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${BASE_URL}/api/webhooks/form/${qrPreview}`)}`;
                link.download = 'qrcode-captura.png';
                link.click();
              }}
            >
              Baixar QR Code
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
