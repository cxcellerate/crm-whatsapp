import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="flex items-center gap-2 pl-3 border-l border-dark-700">
          <div className="w-7 h-7 bg-dark-700 rounded-full flex items-center justify-center text-dark-300 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || <User size={12} />}
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-dark-100 text-xs leading-tight">{user?.name}</p>
            <p className="text-dark-500 text-[10px]">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 p-1.5 rounded-lg hover:bg-dark-700 text-dark-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
