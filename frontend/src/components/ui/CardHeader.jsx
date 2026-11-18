import { Icon } from './Icon.jsx';

export function CardHeader({ title, subtitle, icon, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-5 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated text-ink-secondary">
            <Icon icon={icon} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-6 text-ink-primary">{title}</h2>
          {subtitle && <p className="text-sm text-ink-secondary">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
