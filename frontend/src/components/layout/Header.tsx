import { LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-6 shrink-0"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--bd)' }}
    >
      <div />
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Botão de tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--tx-3)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div
          className="flex items-center gap-2 pl-3 border-l"
          style={{ borderColor: 'var(--bd)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-surface2)', color: 'var(--tx-3)' }}
          >
            {user?.name?.[0]?.toUpperCase() || <User size={12} />}
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-xs leading-tight" style={{ color: 'var(--tx-1)' }}>
              {user?.name}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-1 p-1.5 rounded-lg hover:text-red-400 transition-colors"
            style={{ color: 'var(--tx-4)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
