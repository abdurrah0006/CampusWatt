import { Trash2 } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading = false, onConfirm, onCancel }) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
      <Button variant="danger" icon={Trash2} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
    </>
  );

  return (
    <Modal open={open} title={title} onClose={onCancel} footer={footer} size="sm">
      <p className="text-sm text-ink-secondary">{message}</p>
    </Modal>
  );
}
