import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WhatsAppStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () =>
      api.get('/settings/whatsapp/status').then((r) => r.data).catch(() => ({ state: 'disconnected' })),
    refetchInterval: 30_000,
  });

  const connected = data?.state === 'open' || data?.state === 'CONNECTED';
  const label = data?.provider === 'zapi' ? 'Z-API' : 'Evolution';

  return (
    <div className="flex items-center gap-2">
      {isLoading
        ? <RefreshCw size={12} className="animate-spin text-navy-400" />
        : connected
          ? <Wifi size={12} className="text-success-500" />
          : <WifiOff size={12} className="text-danger-500" />}
      <span className={`text-xs font-medium ${connected ? 'text-success-500' : 'text-danger-400'}`}>
        {connected ? `Conectado · ${label}` : 'Desconectado'}
      </span>
      <button onClick={() => refetch()} className="ml-auto p-0.5 rounded hover:bg-navy-700 text-navy-500 hover:text-navy-300 transition-colors">
        <RefreshCw size={9} />
      </button>
    </div>
  );
}
