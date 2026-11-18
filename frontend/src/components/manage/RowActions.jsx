import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '../ui/IconButton.jsx';

export function RowActions({ itemName, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-1">
      <IconButton icon={Pencil} label={`Edit ${itemName}`} onClick={onEdit} />
      <IconButton icon={Trash2} label={`Delete ${itemName}`} onClick={onDelete} className="hover:text-energy-critical-ink" />
    </div>
  );
}
