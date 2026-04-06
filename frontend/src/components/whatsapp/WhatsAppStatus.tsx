import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WhatsAppStatus() {
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () =>
      api.get('/settings/whatsapp/status').then((r) => r.data).catch(() => ({ state: 'disconnected' })),
    refetchInterval: token ? 30_000 : false,
    enabled: !!token,
  });

  const connected = data?.state === 'open' || data?.state === 'CONNECTED';
  const providerLabel = data?.provider === 'zapi' ? 'Z-API' : 'Evolution';

  return (
    <div className="flex items-center gap-2">
      {isLoading
        ? <RefreshCw size={13} className="animate-spin text-dark-500" />
        : connected
          ? <Wifi size={13} className="text-green-400" />
          : <WifiOff size={13} className="text-red-400" />}
      <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
        {connected ? `Conectado · ${providerLabel}` : 'Desconectado'}
      </span>
      <button onClick={() => refetch()} className="p-0.5 hover:bg-dark-600 rounded text-dark-600 hover:text-dark-400 transition-colors">
        <RefreshCw size={10} />
      </button>
    </div>
  );
}
