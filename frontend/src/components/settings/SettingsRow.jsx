export function SettingsRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right font-medium text-ink-primary">{children}</dd>
    </div>
  );
}
