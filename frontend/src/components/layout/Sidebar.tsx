import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Users,
  Settings, QrCode, BarChart2, UserCog, Bot,
  ChevronRight,
} from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { WhatsAppStatus } from '../whatsapp/WhatsAppStatus';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/kanban', icon: Kanban, label: 'Pipeline' },
      { to: '/leads', icon: Users, label: 'Leads' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/ai-agent', icon: Bot, label: 'Agente de IA' },
      { to: '/capture', icon: QrCode, label: 'Captura de Leads' },
      { to: '/reports', icon: BarChart2, label: 'Relatórios' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/users', icon: UserCog, label: 'Equipe' },
      { to: '/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

export function Sidebar() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isLight = theme === 'light';

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <aside
      className="w-64 flex flex-col border-r"
      style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--bd)' }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 border-b flex items-center justify-center"
        style={{
          borderColor: 'var(--bd)',
          backgroundColor: isLight ? '#ffffff' : 'transparent',
          boxShadow: isLight ? '0 2px 8px rgba(61,161,62,0.10)' : 'none',
        }}
      >
        <img
          src="/logo-mr.png"
          alt="Máquina de Resultados"
          className="h-10 w-auto transition-all duration-300"
          style={{ filter: 'var(--logo-filter)' }}
        />
      </div>

      {/* User profile */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'var(--bd)' }}
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-surface2)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: '#3DA13E', color: '#0a0a0a' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--tx-1)' }}>
              {user?.name ?? 'Usuário'}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--tx-4)' }}>
              {user?.email ?? user?.role ?? ''}
            </p>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--tx-4)' }} className="shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5"
              style={{ color: 'var(--tx-4)' }}
            >
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-500 text-dark-900 sidebar-active' : ''
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {}
                      : { color: 'var(--tx-3)' }
                  }
                  onMouseEnter={e => {
                    if (!e.currentTarget.classList.contains('bg-brand-500')) {
                      e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)';
                      e.currentTarget.style.color = 'var(--nav-hover-tx)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.classList.contains('bg-brand-500')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--tx-3)';
                    }
                  }}
                >
                  <Icon size={16} />
                  {itemLabel}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* WhatsApp status */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--bd)' }}>
        <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface2)' }}>
          <WhatsAppStatus />
        </div>
      </div>
    </aside>
  );
}
