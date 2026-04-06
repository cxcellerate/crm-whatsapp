import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { usePipelines } from '../../hooks/usePipelines';
import { useCreateLead, useUpdateLead } from '../../hooks/useLeads';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Lead } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  value: string;
  stageId: string;
  assignedTo: string;
  source: string;
  notes: string;
}

const SOURCES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'FORM', label: 'Formulário' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'META_ADS', label: 'Meta Ads' },
  { value: 'ORGANIC', label: 'Orgânico' },
  { value: 'REFERRAL', label: 'Indicação' },
];

export function LeadModal({ open, onClose, lead }: Props) {
  const { data: pipelines = [] } = usePipelines();
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const allStages = pipelines.flatMap((p: any) =>
    p.stages.map((s: any) => ({ ...s, pipelineName: p.name }))
  );

  // Captura allStages no momento em que o modal abre para não colocá-lo
  // no dep array do useEffect (evita reset do form em refetches automáticos)
  const allStagesRef = useRef(allStages);
  if (open) allStagesRef.current = allStages;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      source: 'MANUAL',
      stageId: allStages[0]?.id || '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (lead) {
      reset({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        company: lead.company || '',
        value: lead.value?.toString() || '',
        stageId: lead.stageId,
        assignedTo: lead.assignedTo || '',
        source: lead.source,
        notes: lead.notes || '',
      });
    } else {
      reset({ source: 'MANUAL', stageId: allStagesRef.current[0]?.id || '' });
    }
  }, [lead, open]); // allStages propositalmente fora do array — usa ref para não resetar durante edição

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      value: data.value ? parseFloat(data.value) : undefined,
      assignedTo: data.assignedTo || undefined,
      email: data.email || undefined,
      company: data.company || undefined,
      notes: data.notes || undefined,
    };

    if (lead) {
      await updateLead.mutateAsync({ id: lead.id, ...payload });
    } else {
      await createLead.mutateAsync(payload);
    }
    onClose();
  }

  const loading = createLead.isPending || updateLead.isPending;

  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Editar Lead' : 'Novo Lead'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" placeholder="Nome completo" {...register('name', { required: true })} />
            {errors.name && <p className="text-red-400 text-xs mt-1">Nome é obrigatório</p>}
          </div>

          <div>
            <label className="label">Telefone / WhatsApp *</label>
            <input className="input" placeholder="(11) 99999-9999" {...register('phone', { required: true })} />
            {errors.phone && <p className="text-red-400 text-xs mt-1">Telefone é obrigatório</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="email@exemplo.com" {...register('email')} />
          </div>

          <div>
            <label className="label">Empresa</label>
            <input className="input" placeholder="Nome da empresa" {...register('company')} />
          </div>

          <div>
            <label className="label">Valor (R$)</label>
            <input className="input" type="number" step="0.01" placeholder="0,00" {...register('value')} />
          </div>

          <div>
            <label className="label">Etapa *</label>
            <select className="input" {...register('stageId', { required: true })}>
              <option value="">Selecione a etapa</option>
              {allStages.map((s: any) => (
                <option key={s.id} value={s.id}>{s.pipelineName} → {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Origem</label>
            <select className="input" {...register('source')}>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Responsável</label>
            <select className="input" {...register('assignedTo')}>
              <option value="">Sem responsável</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea className="input resize-none" rows={3} placeholder="Anotações sobre o lead..." {...register('notes')} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : lead ? 'Salvar alterações' : 'Criar lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
