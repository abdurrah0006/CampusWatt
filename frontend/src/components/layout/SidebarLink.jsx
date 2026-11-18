import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';

export function SidebarLink({ to, label, icon, end, onNavigate }) {
  const getClassName = ({ isActive }) => {
    const base = 'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition';
    if (isActive) return `${base} bg-brand-soft text-ink-primary`;
    return `${base} text-ink-secondary hover:bg-elevated hover:text-ink-primary`;
  };

  return (
    <NavLink to={to} end={end} onClick={onNavigate} className={getClassName}>
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-brand-primary' : 'text-ink-muted'}>
            <Icon icon={icon} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
