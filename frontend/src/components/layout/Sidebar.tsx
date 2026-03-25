import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Kanban, Users, Settings,
  QrCode, BarChart2, UserCog, Bot,
  ChevronLeft, ChevronRight, Building2,
  MessageSquareText,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { WhatsAppStatus } from '../whatsapp/WhatsAppStatus';

const navGroups = [
  {
    label: 'Visão Geral',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/kanban',    icon: Kanban,           label: 'Pipeline' },
      { to: '/leads',     icon: Users,             label: 'Leads' },
    ],
  },
  {
    label: 'Automação',
    items: [
      { to: '/ai-agent', icon: Bot,       label: 'Agente de IA' },
      { to: '/capture',  icon: QrCode,    label: 'Captura de Leads' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/reports', icon: BarChart2, label: 'Relatórios' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/users',    icon: UserCog, label: 'Equipe' },
      { to: '/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col bg-navy-900 shrink-0 overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
          <MessageSquareText size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <p className="text-white font-bold text-sm leading-tight truncate">CRM WhatsApp</p>
              <p className="text-navy-300 text-xs">by CXCellerate</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-5 overflow-y-auto overflow-x-hidden">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold text-navy-500 uppercase tracking-widest px-2 mb-1.5"
                >
                  {label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? itemLabel : undefined}
                    className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 group
                      ${active
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                      }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-primary-600 rounded-xl"
                        style={{ zIndex: -1 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      />
                    )}
                    <Icon size={17} className="shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="truncate"
                        >
                          {itemLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* WhatsApp status */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-2"
          >
            <div className="px-3 py-2 bg-navy-800/60 rounded-xl">
              <WhatsAppStatus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usuário */}
      <div className="border-t border-navy-800 px-3 py-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-primary-600/30 flex items-center justify-center shrink-0">
            <span className="text-primary-300 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="min-w-0 flex-1"
              >
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-navy-400 text-[10px] truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white border border-surface-300
          rounded-full flex items-center justify-center shadow-card-md
          hover:bg-primary-50 hover:border-primary-300 transition-colors z-10"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-surface-500" />
          : <ChevronLeft size={12} className="text-surface-500" />
        }
      </button>
    </motion.aside>
  );
}
