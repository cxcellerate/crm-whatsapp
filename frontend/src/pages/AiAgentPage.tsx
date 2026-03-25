import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageSquare, CheckCircle, Clock, XCircle, ChevronRight, ToggleLeft, ToggleRight, Save, Eye } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Em andamento', color: 'text-blue-400',  bg: 'bg-blue-500/10',  icon: Clock },
  COMPLETED: { label: 'Concluída',    color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  ABANDONED: { label: 'Abandonada',   color: 'text-dark-500',  bg: 'bg-dark-700',     icon: XCircle },
};

export function AiAgentPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [viewSession, setViewSession] = useState<any>(null);
  const [configForm, setConfigForm] = useState({
    ai_agent_enabled: 'false',
    ai_agent_api_key: '',
    ai_agent_max_turns: '8',
    ai_agent_company_name: '',
  });
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => api.get('/ai-agent/sessions').then((r) => r.data),
    refetchInterval: 15_000,
  });

  const { data: config } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => api.get('/ai-agent/config').then((r) => r.data),
    onSuccess: (d: any) => setConfigForm((prev) => ({ ...prev, ...d })),
  } as any);

  const saveConfig = useMutation({
    mutationFn: (data: typeof configForm) => api.post('/ai-agent/config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-config'] });
      toast.success('Configurações do agente salvas!');
      setConfigOpen(false);
    },
  });

  const abandonSession = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-agent/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-sessions'] });
      toast.success('Sessão encerrada');
    },
  });

  const { data: sessionDetail } = useQuery({
    queryKey: ['ai-session', viewSession?.id],
    queryFn: () => api.get(`/ai-agent/sessions/${viewSession.id}`).then((r) => r.data),
    enabled: !!viewSession?.id,
  });

  const agentEnabled = config?.ai_agent_enabled === 'true';
  const list = sessions?.sessions || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Agente de IA</h1>
            <p className="text-dark-500 text-sm">Qualifica leads automaticamente via WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${agentEnabled ? 'bg-green-500/10 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
            {agentEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {agentEnabled ? 'Ativo' : 'Inativo'}
          </div>
          <button className="btn-primary" onClick={() => setConfigOpen(true)}>
            <Bot size={15} /> Configurar Agente
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      {sessions && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total de sessões', value: sessions.total, color: 'text-dark-200' },
            { label: 'Em andamento', value: list.filter((s: any) => s.status === 'ACTIVE').length, color: 'text-blue-400' },
            { label: 'Concluídas', value: list.filter((s: any) => s.status === 'COMPLETED').length, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-dark-500 text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Como funciona */}
      {!agentEnabled && (
        <div className="card p-5 border-brand-500/20 bg-brand-500/5">
          <div className="flex items-start gap-3">
            <Bot size={18} className="text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-dark-100 mb-2">Como o Agente de IA funciona</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-dark-400">
                {[
                  { n: '1', t: 'Cliente envia mensagem', d: 'Via WhatsApp (Z-API ou Evolution API)' },
                  { n: '2', t: 'IA conduz a conversa', d: 'Coleta nome, email, interesse e mais' },
                  { n: '3', t: 'Lead criado/atualizado', d: 'Dados salvos automaticamente no CRM' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{n}</span>
                    <div>
                      <p className="text-dark-200 font-medium text-xs">{t}</p>
                      <p className="text-dark-500 text-xs mt-0.5">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary mt-3 text-sm" onClick={() => setConfigOpen(true)}>
                Configurar e ativar agente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de sessões */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma sessão ainda"
          description="As sessões aparecem aqui assim que o agente iniciar conversas via WhatsApp"
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-700">
              <tr>
                {['Contato', 'Lead', 'Status', 'Turnos', 'Dados extraídos', 'Última atualização', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-dark-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {list.map((s: any) => {
                const st = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG];
                const Icon = st.icon;
                const extracted = s.extractedData || {};
                const fields = [extracted.name, extracted.email, extracted.interest].filter(Boolean);
                return (
                  <tr key={s.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3 text-dark-200 font-mono text-xs">{s.phone}</td>
                    <td className="px-4 py-3">
                      {s.lead ? (
                        <p className="text-dark-200 text-xs">{s.lead.name}</p>
                      ) : (
                        <p className="text-dark-600 text-xs">—</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                        <Icon size={10} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-center">{s.turnCount}</td>
                    <td className="px-4 py-3">
                      {fields.length > 0 ? (
                        <p className="text-dark-300 text-xs truncate max-w-[180px]">{fields.join(' · ')}</p>
                      ) : (
                        <p className="text-dark-600 text-xs">Coletando...</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-500 text-xs">
                      {format(new Date(s.updatedAt), 'dd/MM HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewSession(s)}
                          className="p-1.5 hover:bg-dark-600 rounded-lg text-dark-400 hover:text-dark-100 transition-colors"
                          title="Ver conversa"
                        >
                          <Eye size={13} />
                        </button>
                        {s.status === 'ACTIVE' && (
                          <button
                            onClick={() => abandonSession.mutate(s.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-400 hover:text-red-400 transition-colors"
                            title="Encerrar sessão"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — Configurar agente */}
      <Modal open={configOpen} onClose={() => setConfigOpen(false)} title="Configurar Agente de IA" size="md">
        <div className="space-y-4">
          {/* Toggle ativo */}
          <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
            <div>
              <p className="font-medium text-dark-100 text-sm">Agente ativo</p>
              <p className="text-dark-500 text-xs">Responde automaticamente mensagens do WhatsApp</p>
            </div>
            <button
              onClick={() => setConfigForm((f) => ({ ...f, ai_agent_enabled: f.ai_agent_enabled === 'true' ? 'false' : 'true' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${configForm.ai_agent_enabled === 'true' ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400'}`}
            >
              {configForm.ai_agent_enabled === 'true' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {configForm.ai_agent_enabled === 'true' ? 'Ativado' : 'Desativado'}
            </button>
          </div>

          <div>
            <label className="label">Nome da empresa</label>
            <input
              className="input"
              placeholder="Ex: Acme Soluções"
              value={configForm.ai_agent_company_name}
              onChange={(e) => setConfigForm({ ...configForm, ai_agent_company_name: e.target.value })}
            />
            <p className="text-xs text-dark-600 mt-1">Usado pelo agente para se identificar na conversa</p>
          </div>

          <div>
            <label className="label">Anthropic API Key</label>
            <input
              className="input font-mono text-xs"
              type="password"
              placeholder="sk-ant-api03-..."
              value={configForm.ai_agent_api_key}
              onChange={(e) => setConfigForm({ ...configForm, ai_agent_api_key: e.target.value })}
            />
            <p className="text-xs text-dark-600 mt-1">
              Obtenha em{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                console.anthropic.com
              </a>
              {' '}→ API Keys
            </p>
          </div>

          <div>
            <label className="label">Máximo de turnos por conversa</label>
            <input
              className="input"
              type="number"
              min="3"
              max="20"
              value={configForm.ai_agent_max_turns}
              onChange={(e) => setConfigForm({ ...configForm, ai_agent_max_turns: e.target.value })}
            />
            <p className="text-xs text-dark-600 mt-1">Após este número de trocas, o agente encerra e salva os dados (recomendado: 6–10)</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-3 text-xs text-dark-400 space-y-1">
            <p className="font-medium text-dark-300">Campos que o agente coleta automaticamente:</p>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {['Nome completo', 'Email', 'Empresa', 'Produto/interesse', 'Orçamento estimado', 'Observações'].map((f) => (
                <div key={f} className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-brand-400" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button className="btn-secondary" onClick={() => setConfigOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => saveConfig.mutate(configForm)} disabled={saveConfig.isPending}>
              <Save size={15} />
              {saveConfig.isPending ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Ver conversa */}
      <Modal open={!!viewSession} onClose={() => setViewSession(null)} title={`Conversa — ${viewSession?.phone || ''}`} size="lg">
        {sessionDetail && (
          <div className="space-y-4">
            {/* Dados extraídos */}
            {Object.keys(sessionDetail.extractedData || {}).length > 0 && (
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-3">Dados extraídos</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(sessionDetail.extractedData).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-dark-500 text-xs capitalize">{k}</p>
                      <p className="text-dark-200 text-sm font-medium">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de mensagens */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sessionDetail.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-dark-700 text-dark-100 rounded-bl-sm'
                      : 'bg-brand-500/20 text-brand-100 rounded-br-sm border border-brand-500/30'
                  }`}>
                    <div className={`text-[10px] mb-1 font-medium ${msg.role === 'assistant' ? 'text-brand-400' : 'text-dark-400'}`}>
                      {msg.role === 'assistant' ? '🤖 Agente IA' : '👤 Cliente'}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] text-dark-600 mt-1 text-right">
                      {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
