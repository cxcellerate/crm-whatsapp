import { LogOut, Sun, Moon, Search, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-6 shrink-0 gap-4"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--bd)' }}
    >
      {/* Search bar */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--tx-4)' }}
        />
        <input
          type="text"
          placeholder="Buscar leads, contatos..."
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg transition-all duration-150 focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-surface2)',
            border: '1px solid var(--bd)',
            color: 'var(--tx-1)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#3DA13E';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,161,62,0.12)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--bd)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">
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

        {/* Divisor */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--bd)' }} />

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ backgroundColor: '#3DA13E', color: '#0a0a0a' }}
          >
            {initials}
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-semibold text-xs leading-tight" style={{ color: 'var(--tx-1)' }}>
              {user?.name}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--tx-4)' }}>
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
