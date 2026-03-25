import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, Users, Info, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationsStore, Notification } from '../../store/notifications.store';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_ICONS = { message: MessageSquare, lead: Users, info: Info };
const TYPE_COLORS = {
  message: 'bg-success-50 text-success-600',
  lead:    'bg-primary-50 text-primary-600',
  info:    'bg-surface-100 text-surface-500',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotificationsStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-surface-100 text-surface-500 hover:text-surface-800 transition-colors"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-surface-200 rounded-2xl shadow-card-lg z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-surface-800">Notificações</p>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-full font-medium">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-surface-700 transition-colors" title="Marcar todas como lidas">
                    <CheckCheck size={13} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clear} className="p-1.5 hover:bg-danger-50 rounded-lg text-surface-400 hover:text-danger-500 transition-colors" title="Limpar">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={22} className="text-surface-300 mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n: Notification) => {
                  const Icon = TYPE_ICONS[n.type];
                  const colorClass = TYPE_COLORS[n.type];
                  const content = (
                    <div
                      key={n.id}
                      onClick={() => { markRead(n.id); setOpen(false); }}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-surface-50 last:border-0 hover:bg-surface-50 ${!n.read ? 'bg-primary-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${n.read ? 'text-surface-600' : 'text-surface-900'}`}>{n.title}</p>
                          {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1" />}
                        </div>
                        <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-surface-400 mt-1">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                  return n.leadId
                    ? <Link key={n.id} to={`/leads/${n.leadId}`}>{content}</Link>
                    : <div key={n.id}>{content}</div>;
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
