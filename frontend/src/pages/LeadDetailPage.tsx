import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Phone, Mail, Building2, Tag } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: lead } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/${id}/send`, { content }).then((r) => r.data),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lead?.messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message);
  }

  if (!lead) return <div className="text-dark-400 p-6">Carregando...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/leads" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-50">{lead.name}</h1>
          <p className="text-dark-400 text-sm">{lead.stage?.name}</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Info */}
        <div className="w-72 space-y-4 shrink-0">
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-dark-200">Informações</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-dark-300"><Phone size={14} />{lead.phone}</p>
              {lead.email && <p className="flex items-center gap-2 text-dark-300"><Mail size={14} />{lead.email}</p>}
              {lead.company && <p className="flex items-center gap-2 text-dark-300"><Building2 size={14} />{lead.company}</p>}
              {lead.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {lead.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-dark-600 text-dark-200 px-2 py-0.5 rounded-full text-xs">
                      <Tag size={10} />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-dark-200 mb-3">Atividades</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lead.activities?.map((a: any) => (
                <div key={a.id} className="text-xs text-dark-400 border-l-2 border-dark-600 pl-2">
                  <p className="text-dark-300">{a.content}</p>
                  <p className="mt-0.5">{format(new Date(a.createdAt), 'dd/MM HH:mm', { locale: ptBR })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="card flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-dark-600">
            <p className="text-sm font-semibold text-dark-200">Conversa WhatsApp</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {lead.messages?.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${
                  msg.direction === 'OUTBOUND'
                    ? 'bg-brand-500 text-dark-900'
                    : 'bg-dark-600 text-dark-100'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-dark-800' : 'text-dark-400'}`}>
                    {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-4 border-t border-dark-600 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Digite uma mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="btn-primary px-4" disabled={sendMutation.isPending}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
