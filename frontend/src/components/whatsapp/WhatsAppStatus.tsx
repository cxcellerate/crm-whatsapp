import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WhatsAppStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.get('/webhooks/whatsapp/status').then((r) => r.data).catch(() => ({ state: 'disconnected' })),
    refetchInterval: 30_000,
  });

  const connected = data?.state === 'open';

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <RefreshCw size={14} className="animate-spin text-dark-400" />
      ) : connected ? (
        <Wifi size={14} className="text-green-400" />
      ) : (
        <WifiOff size={14} className="text-red-400" />
      )}
      <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
        WhatsApp {connected ? 'conectado' : 'desconectado'}
      </span>
      <button onClick={() => refetch()} className="p-1 hover:bg-dark-600 rounded transition-colors" title="Atualizar status">
        <RefreshCw size={11} className="text-dark-500" />
      </button>
    </div>
  );
}
