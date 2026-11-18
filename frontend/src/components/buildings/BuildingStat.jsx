export function BuildingStat({ label, value, unit }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="tabular mt-0.5 text-sm font-semibold text-ink-primary">
        {value}
        {unit && <span className="ml-0.5 font-normal text-ink-muted">{unit}</span>}
      </dd>
    </div>
  );
}
