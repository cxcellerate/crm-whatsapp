import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;
    initialized.current = true;

    socket = io(import.meta.env.VITE_WS_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket conectado');
    });

    socket.on('lead:created', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Novo lead capturado!');
    });

    socket.on('lead:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('lead:moved', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socket.on('whatsapp:message', (data: { lead: any; message: any }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast(`Nova mensagem de ${data.lead.name}`, { icon: '💬' });
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, [token, queryClient]);

  return socket;
}
