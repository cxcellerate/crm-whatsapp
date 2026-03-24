import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Users,
  MessageSquare,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kanban', icon: Kanban, label: 'Pipeline' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-dark-900" />
          </div>
          <div>
            <p className="font-bold text-dark-50 text-sm leading-tight">CRM</p>
            <p className="text-brand-500 text-xs font-medium">WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500 text-dark-900'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-dark-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* WhatsApp status */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
          <MessageSquare size={15} className="text-green-400" />
          <span className="text-xs text-dark-300">WhatsApp conectado</span>
          <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
