import { useLocation } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { NotificationBell } from './NotificationBell';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard',       subtitle: 'Visão geral do negócio' },
  '/kanban':    { title: 'Pipeline',         subtitle: 'Gerencie seus leads por etapa' },
  '/leads':     { title: 'Leads',            subtitle: 'Todos os seus contatos' },
  '/ai-agent':  { title: 'Agente de IA',     subtitle: 'Qualificação automática via WhatsApp' },
  '/capture':   { title: 'Captura de Leads', subtitle: 'Formulários e webhooks' },
  '/reports':   { title: 'Relatórios',       subtitle: 'Análise e exportação de dados' },
  '/users':     { title: 'Equipe',           subtitle: 'Gerencie usuários e permissões' },
  '/settings':  { title: 'Configurações',    subtitle: 'WhatsApp, pipelines e integrações' },
};

export function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] || { title: 'CRM WhatsApp', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 shrink-0 shadow-card">
      {/* Page title */}
      <div>
        <h1 className="text-base font-bold text-surface-900 leading-tight">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-surface-500 mt-0.5">{page.subtitle}</p>}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 bg-surface-100 hover:bg-surface-200 border border-surface-200 rounded-xl px-3 py-2 cursor-pointer transition-colors">
          <Search size={14} className="text-surface-400" />
          <span className="text-xs text-surface-400 font-medium">Buscar...</span>
          <kbd className="ml-2 text-[10px] text-surface-400 bg-surface-200 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>

        <NotificationBell />

        <div className="flex items-center gap-2.5 pl-3 border-l border-surface-200">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-surface-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-surface-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 p-1.5 rounded-lg hover:bg-danger-50 text-surface-400 hover:text-danger-500 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
