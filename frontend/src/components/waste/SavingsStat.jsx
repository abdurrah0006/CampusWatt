import { Icon } from '../ui/Icon.jsx';

export function SavingsStat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
      <span className="text-energy-optimal-ink"><Icon icon={icon} /></span>
      <div>
        <p className="tabular text-lg font-bold leading-tight text-ink-primary">{value}</p>
        <p className="text-xs text-ink-secondary">{label}</p>
      </div>
    </div>
  );
}
