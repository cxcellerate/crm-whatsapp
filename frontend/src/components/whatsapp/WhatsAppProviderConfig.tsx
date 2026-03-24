import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wifi, WifiOff, CheckCircle, XCircle, Loader, Copy, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

type Provider = 'evolution' | 'zapi';

interface Settings {
  wa_provider?: Provider;
  wa_evolution_url?: string;
  wa_evolution_key?: string;
  wa_evolution_instance?: string;
  wa_zapi_instance_id?: string;
  wa_zapi_token?: string;
  wa_zapi_client_token?: string;
}

export function WhatsAppProviderConfig() {
  const [provider, setProvider] = useState<Provider>('evolution');
  const [form, setForm] = useState<Settings>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });

  const { data: status } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.get('/settings/whatsapp/status').then((r) => r.data).catch(() => ({ state: 'disconnected' })),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (settings) {
      setProvider(settings.wa_provider || 'evolution');
      setForm(settings);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: (data: Settings) => api.post('/settings', data).then((r) => r.data),
    onSuccess: () => toast.success('Configurações salvas!'),
    onError: () => toast.error('Erro ao salvar'),
  });

  async function handleSave() {
    await save.mutateAsync({ ...form, wa_provider: provider });
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/settings/whatsapp/test', { provider });
      setTestResult(res.data);
    } catch {
      setTestResult({ success: false, message: 'Erro ao conectar' });
    } finally {
      setTesting(false);
    }
  }

  const connected = status?.state === 'open' || status?.state === 'CONNECTED';
  const BASE_URL = window.location.origin;

  function copyWebhook(path: string) {
    navigator.clipboard.writeText(`${BASE_URL}/api/webhooks/${path}`);
    toast.success('URL copiada!');
  }

  if (isLoading) return <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Status atual */}
      <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
        <div className="flex items-center gap-2">
          {connected
            ? <Wifi size={16} className="text-green-400" />
            : <WifiOff size={16} className="text-red-400" />}
          <span className={`text-sm font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
            WhatsApp {connected ? 'conectado' : 'desconectado'}
          </span>
          {status?.provider && (
            <span className="text-xs text-dark-500 ml-1">
              via {status.provider === 'zapi' ? 'Z-API' : 'Evolution API'}
            </span>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {/* Selector de provedor */}
      <div>
        <p className="label mb-2">Provedor de WhatsApp</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: 'evolution', label: 'Evolution API', desc: 'Open source · Self-hosted', logo: '⚡' },
            { id: 'zapi', label: 'Z-API', desc: 'Serviço gerenciado · Cloud', logo: '🟢' },
          ] as const).map(({ id, label, desc, logo }) => (
            <button
              key={id}
              onClick={() => { setProvider(id); setTestResult(null); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                provider === id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-dark-600 bg-dark-800 hover:border-dark-500'
              }`}
            >
              <span className="text-2xl">{logo}</span>
              <div>
                <p className={`font-semibold text-sm ${provider === id ? 'text-brand-400' : 'text-dark-200'}`}>{label}</p>
                <p className="text-dark-500 text-xs">{desc}</p>
              </div>
              {provider === id && <CheckCircle size={16} className="text-brand-500 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Campos Evolution API */}
      {provider === 'evolution' && (
        <div className="space-y-3 p-4 bg-dark-800 rounded-xl">
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Credenciais — Evolution API</p>
          <div>
            <label className="label">URL da API</label>
            <input className="input" placeholder="http://localhost:8080" value={form.wa_evolution_url || ''} onChange={(e) => setForm({ ...form, wa_evolution_url: e.target.value })} />
          </div>
          <div>
            <label className="label">API Key (Global)</label>
            <input className="input" type="password" placeholder="••••••••" value={form.wa_evolution_key || ''} onChange={(e) => setForm({ ...form, wa_evolution_key: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome da instância</label>
            <input className="input" placeholder="default" value={form.wa_evolution_instance || ''} onChange={(e) => setForm({ ...form, wa_evolution_instance: e.target.value })} />
          </div>
          <div className="pt-1">
            <p className="text-xs text-dark-500 mb-2">Configure este webhook na Evolution API:</p>
            <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2">
              <code className="text-xs text-brand-400 flex-1 truncate">{BASE_URL}/api/webhooks/whatsapp</code>
              <button onClick={() => copyWebhook('whatsapp')} className="shrink-0 text-dark-500 hover:text-dark-200">
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campos Z-API */}
      {provider === 'zapi' && (
        <div className="space-y-3 p-4 bg-dark-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Credenciais — Z-API</p>
            <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              Painel Z-API <ExternalLink size={10} />
            </a>
          </div>
          <div>
            <label className="label">Instance ID</label>
            <input className="input" placeholder="Ex: 3B1234ABCD5678..." value={form.wa_zapi_instance_id || ''} onChange={(e) => setForm({ ...form, wa_zapi_instance_id: e.target.value })} />
            <p className="text-xs text-dark-600 mt-1">Encontre em: Z-API → Instâncias → sua instância → Detalhes</p>
          </div>
          <div>
            <label className="label">Token</label>
            <input className="input" type="password" placeholder="••••••••" value={form.wa_zapi_token || ''} onChange={(e) => setForm({ ...form, wa_zapi_token: e.target.value })} />
          </div>
          <div>
            <label className="label">Client-Token (Security Token)</label>
            <input className="input" type="password" placeholder="••••••••" value={form.wa_zapi_client_token || ''} onChange={(e) => setForm({ ...form, wa_zapi_client_token: e.target.value })} />
            <p className="text-xs text-dark-600 mt-1">Encontre em: Z-API → Segurança → Client-Token</p>
          </div>
          <div className="pt-1 space-y-2">
            <p className="text-xs text-dark-500">Configure estes webhooks no painel Z-API:</p>
            {[
              { label: 'On Message Received', path: 'zapi' },
              { label: 'On Connected', path: 'zapi' },
            ].map(({ label, path }) => (
              <div key={label}>
                <p className="text-xs text-dark-500 mb-1">{label}</p>
                <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2">
                  <code className="text-xs text-brand-400 flex-1 truncate">{BASE_URL}/api/webhooks/{path}</code>
                  <button onClick={() => copyWebhook(path)} className="shrink-0 text-dark-500 hover:text-dark-200">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado do teste */}
      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {testResult.message}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          className="btn-secondary flex-1 justify-center"
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? <Loader size={15} className="animate-spin" /> : <Wifi size={15} />}
          {testing ? 'Testando...' : 'Testar Conexão'}
        </button>
        <button
          className="btn-primary flex-1 justify-center"
          onClick={handleSave}
          disabled={save.isPending}
        >
          {save.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
