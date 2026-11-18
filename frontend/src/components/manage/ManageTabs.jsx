import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';
import { MANAGE_ITEMS } from '../../utils/constants.js';

export function ManageTabs() {
  const getClassName = ({ isActive }) => {
    const base = 'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition';
    if (isActive) return `${base} bg-surface text-ink-primary shadow-subtle`;
    return `${base} text-ink-secondary hover:text-ink-primary`;
  };

  return (
    <nav className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-elevated p-1" aria-label="Manage sections">
      {MANAGE_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={getClassName}>
          <Icon icon={item.icon} size="sm" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
