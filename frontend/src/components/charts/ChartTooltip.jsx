import { formatDateTime, formatKwh } from '../../utils/formatters.js';

function defaultValueFormatter(value) {
  return formatKwh(value, 1);
}

export function ChartTooltip({ active, payload, label, labelFormatter = formatDateTime, valueFormatter = defaultValueFormatter, footer }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((item) => item.value !== null && item.value !== undefined);
  if (!rows.length) return null;

  return (
    <div className="min-w-[180px] rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-popover">
      <p className="mb-2 font-semibold text-ink-primary">{labelFormatter(label)}</p>
      <ul className="space-y-1">
        {rows.map((item) => (
          <li key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.payload?.fill }} />
              {item.name}
            </span>
            <span className="tabular font-semibold text-ink-primary">{valueFormatter(item.value, item)}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-2 border-t border-line pt-2 text-ink-secondary">{footer}</p>}
    </div>
  );
}
