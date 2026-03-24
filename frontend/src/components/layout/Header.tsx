import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2 rounded-lg relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-dark-700">
          <div className="w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center">
            <User size={14} className="text-dark-300" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-dark-100 leading-tight">{user?.name}</p>
            <p className="text-dark-400 text-xs">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-100 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
