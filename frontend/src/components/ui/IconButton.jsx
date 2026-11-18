import { Icon } from './Icon.jsx';

export function IconButton({ icon, label, onClick, className = '', disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`icon-button disabled:opacity-50 ${className}`} aria-label={label} title={label}>
      <Icon icon={icon} />
    </button>
  );
}
