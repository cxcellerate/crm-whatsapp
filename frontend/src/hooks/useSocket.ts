import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationsStore } from '../store/notifications.store';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const addNotification = useNotificationsStore((s) => s.add);
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;
    initialized.current = true;

    socket = io(import.meta.env.VITE_WS_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('[Socket] conectado'));

    socket.on('lead:created', (lead: any) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addNotification({
        type: 'lead',
        title: 'Novo lead capturado',
        body: `${lead.name} — ${lead.phone}`,
        leadId: lead.id,
      });
      toast.success(`Novo lead: ${lead.name}`);
    });

    socket.on('lead:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('lead:moved', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('lead:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    socket.on('whatsapp:message', (data: { lead: any; message: any }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.lead.id] });
      addNotification({
        type: 'message',
        title: `Mensagem de ${data.lead.name}`,
        body: data.message.content?.substring(0, 80) || 'Nova mensagem recebida',
        leadId: data.lead.id,
      });
      toast(`💬 ${data.lead.name}`, { duration: 4000 });
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, [token, queryClient, addNotification]);

  return socket;
}

export function getSocket() {
  return socket;
}
