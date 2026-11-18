import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';

const ALIGN_CLASSES = { left: 'text-left', right: 'text-right', center: 'text-center' };

function getSortIcon(isActive, direction) {
  if (!isActive) return ArrowUpDown;
  if (direction === 'asc') return ArrowUp;
  return ArrowDown;
}

export function SortableHeader({ column, sort, onSort }) {
  const isActive = sort.key === column.key;
  let ariaSort = 'none';
  if (isActive) ariaSort = sort.direction === 'asc' ? 'ascending' : 'descending';

  return (
    <th scope="col" aria-sort={ariaSort} className={ALIGN_CLASSES[column.align]}>
      <button type="button" onClick={() => onSort(column.key)} className={`inline-flex items-center gap-1 uppercase hover:text-ink-primary ${isActive ? 'text-ink-primary' : ''}`}>
        {column.label}
        <span className={isActive ? '' : 'opacity-50'}><Icon icon={getSortIcon(isActive, sort.direction)} size="sm" /></span>
      </button>
    </th>
  );
}
