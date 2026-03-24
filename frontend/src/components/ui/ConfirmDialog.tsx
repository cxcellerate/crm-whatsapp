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
      <div className="flex gap-3 mb-5">
        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <p className="text-sm text-dark-300 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button
          className="btn bg-red-500 hover:bg-red-400 text-white"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Removendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
