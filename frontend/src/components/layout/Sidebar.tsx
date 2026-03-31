import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Users,
  Settings, QrCode, BarChart2, UserCog, Bot,
} from 'lucide-react';
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
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-dark-700">
        <img src="/logo-mr.png" alt="Máquina de Resultados" className="h-10 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-dark-600 uppercase tracking-widest px-3 mb-1">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-dark-900'
                        : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
                    }`
                  }
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
      <div className="p-4 border-t border-dark-700">
        <div className="px-3 py-2 bg-dark-800 rounded-lg">
          <WhatsAppStatus />
        </div>
      </div>
    </aside>
  );
}
