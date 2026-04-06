import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--bg-surface2)' }}
      >
        <Icon size={24} style={{ color: 'var(--tx-3)' }} />
      </div>
      <p className="font-semibold" style={{ color: 'var(--tx-1)' }}>{title}</p>
      {description && <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--tx-4)' }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
