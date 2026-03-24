import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, Phone } from 'lucide-react';
import { api } from '../../services/api';
import { Message } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Props {
  leadId: string;
  leadPhone: string;
}

const STATUS_ICONS: Record<string, string> = {
  PENDING: '🕐',
  SENT: '✓',
  DELIVERED: '✓✓',
  READ: '✓✓',
  FAILED: '✗',
};

export function WhatsAppChat({ leadId, leadPhone }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', leadId],
    queryFn: () => api.get(`/messages/${leadId}`).then((r) => r.data),
  });

  const send = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/${leadId}/send`, { content }).then((r) => r.data),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', leadId] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    send.mutate(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) send.mutate(text);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-600 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Phone size={14} className="text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-dark-100">Conversa WhatsApp</p>
          <p className="text-xs text-dark-500">{leadPhone}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-dark-800/50">
        {messages.length === 0 && (
          <p className="text-center text-dark-600 text-xs py-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.direction === 'OUTBOUND'
                ? 'bg-brand-500 text-dark-900 rounded-br-sm'
                : 'bg-dark-600 text-dark-100 rounded-bl-sm'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${
                msg.direction === 'OUTBOUND' ? 'text-dark-800' : 'text-dark-500'
              }`}>
                <span>{format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}</span>
                {msg.direction === 'OUTBOUND' && (
                  <span className={msg.status === 'READ' ? 'text-blue-600' : ''}>{STATUS_ICONS[msg.status]}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-dark-600 flex items-end gap-2">
        <button type="button" className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors shrink-0">
          <Paperclip size={16} />
        </button>
        <textarea
          className="input flex-1 resize-none min-h-[38px] max-h-32"
          placeholder="Digite uma mensagem..."
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="btn-primary p-2 shrink-0"
          disabled={!text.trim() || send.isPending}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
