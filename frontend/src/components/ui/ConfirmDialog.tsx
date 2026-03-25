import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4 mb-6">
        <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-danger-500" />
        </div>
        <p className="text-sm text-surface-600 leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Removendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
