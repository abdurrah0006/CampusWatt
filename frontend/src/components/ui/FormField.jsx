export function FormField({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p id={`${id}-message`} className="mt-1 text-xs font-medium text-energy-critical-ink">{error}</p>}
      {!error && hint && <p id={`${id}-message`} className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
