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

  // Refs para usar dentro dos listeners sem colocá-los como dependência do useEffect
  const queryClientRef = useRef(queryClient);
  const addNotificationRef = useRef(addNotification);
  queryClientRef.current = queryClient;
  addNotificationRef.current = addNotification;

  useEffect(() => {
    if (!token) {
      // Logout explícito: desconecta se ainda estava conectado
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (socket) return; // Já conectado com este token

    socket = io(import.meta.env.VITE_WS_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('[Socket] conectado'));

    socket.on('lead:created', (lead: any) => {
      queryClientRef.current.invalidateQueries({ queryKey: ['leads'] });
      queryClientRef.current.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addNotificationRef.current({
        type: 'lead',
        title: 'Novo lead capturado',
        body: `${lead.name} — ${lead.phone}`,
        leadId: lead.id,
      });
      toast.success(`Novo lead: ${lead.name}`);
    });

    socket.on('lead:updated', () => {
      queryClientRef.current.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('lead:moved', () => {
      queryClientRef.current.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('lead:deleted', () => {
      queryClientRef.current.invalidateQueries({ queryKey: ['leads'] });
      queryClientRef.current.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    socket.on('whatsapp:message', (data: { lead: any; message: any }) => {
      queryClientRef.current.invalidateQueries({ queryKey: ['leads'] });
      queryClientRef.current.invalidateQueries({ queryKey: ['messages', data.lead.id] });
      addNotificationRef.current({
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
    };
  }, [token]); // Apenas token como dependência — reconecta somente ao fazer login/logout

  return socket;
}

export function getSocket() {
  return socket;
}
