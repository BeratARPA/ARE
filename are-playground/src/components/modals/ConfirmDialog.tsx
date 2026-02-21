import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-surface-200/70 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('crud.cancel')}
        </Button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-error/20 px-4 py-2 text-sm font-semibold text-error hover:bg-error/30 transition-colors cursor-pointer"
        >
          {t('crud.delete')}
        </button>
      </div>
    </Modal>
  );
}
