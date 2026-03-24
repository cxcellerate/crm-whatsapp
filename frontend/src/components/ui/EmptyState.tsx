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
      <div className="w-14 h-14 bg-dark-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-dark-400" />
      </div>
      <p className="font-semibold text-dark-200">{title}</p>
      {description && <p className="text-dark-500 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
