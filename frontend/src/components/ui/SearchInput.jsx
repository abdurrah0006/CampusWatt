import { Search } from 'lucide-react';
import { Icon } from './Icon.jsx';

export function SearchInput({ id, value, onChange, placeholder = 'Search', label = 'Search' }) {
  return (
    <div className="relative w-full sm:w-72">
      <label htmlFor={id} className="sr-only">{label}</label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
        <Icon icon={Search} size="sm" />
      </span>
      <input id={id} type="search" className="input pl-9" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
