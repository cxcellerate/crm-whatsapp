import { useQuery } from '@tanstack/react-query';
import { Settings, Wifi, Users, GitBranch } from 'lucide-react';
import { api } from '../services/api';

export function SettingsPage() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-dark-50">Configurações</h1>

      {/* WhatsApp */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wifi size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">WhatsApp Business API</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">URL da Evolution API</label>
            <input className="input" placeholder="http://localhost:8080" />
          </div>
          <div>
            <label className="label">API Key</label>
            <input className="input" type="password" placeholder="••••••••••••" />
          </div>
          <button className="btn-primary">Salvar e Testar Conexão</button>
        </div>
      </div>

      {/* Equipe */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">Equipe</h2>
        </div>
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-dark-100">{user.name}</p>
                <p className="text-xs text-dark-400">{user.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                user.role === 'ADMIN' ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-600 text-dark-300'
              }`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch size={18} className="text-brand-400" />
          <h2 className="font-semibold text-dark-100">Captura de Leads via Formulário</h2>
        </div>
        <p className="text-sm text-dark-400 mb-3">
          Use a URL abaixo para integrar formulários externos ao CRM:
        </p>
        <div className="bg-dark-800 rounded-lg p-3 font-mono text-xs text-brand-400">
          POST /api/webhooks/form/:token
        </div>
        <p className="text-xs text-dark-500 mt-2">
          Campos: name, phone, email (opcional), utmSource, utmMedium, utmCampaign
        </p>
      </div>
    </div>
  );
}
