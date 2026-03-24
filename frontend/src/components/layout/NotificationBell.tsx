import { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Users, Info, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationsStore, Notification } from '../../store/notifications.store';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_ICONS = {
  message: MessageSquare,
  lead: Users,
  info: Info,
};
const TYPE_COLORS = {
  message: 'text-green-400',
  lead: 'text-blue-400',
  info: 'text-dark-400',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotificationsStore();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleNotifClick(n: Notification) {
    markRead(n.id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-100 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-dark-900 text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            <p className="text-sm font-semibold text-dark-100">Notificações</p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1.5 hover:bg-dark-700 rounded-lg text-dark-500 hover:text-dark-200 transition-colors" title="Marcar todas como lidas">
                  <CheckCheck size={13} />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clear} className="p-1.5 hover:bg-dark-700 rounded-lg text-dark-500 hover:text-red-400 transition-colors" title="Limpar tudo">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-dark-600 mx-auto mb-2" />
                <p className="text-dark-500 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type];
                const content = (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`flex gap-3 px-4 py-3 hover:bg-dark-700/60 cursor-pointer transition-colors border-b border-dark-700/50 last:border-0 ${!n.read ? 'bg-dark-700/30' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-medium leading-tight ${n.read ? 'text-dark-300' : 'text-dark-100'}`}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-dark-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-dark-600 mt-1">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );

                return n.leadId ? (
                  <Link key={n.id} to={`/leads/${n.leadId}`}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
