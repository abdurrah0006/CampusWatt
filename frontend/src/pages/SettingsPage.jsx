import { useEffect, useState } from 'react';
import { RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CardHeader } from '../components/ui/CardHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { SystemStatusCard } from '../components/settings/SystemStatusCard.jsx';
import { IngestInfoCard } from '../components/settings/IngestInfoCard.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../hooks/useToast.js';
import { healthApi, wasteApi } from '../api/endpoints.js';
import { DEFAULT_SETTINGS, REFRESH_OPTIONS } from '../utils/constants.js';
import { formatAED, formatNumber } from '../utils/formatters.js';

// Helpers
function isValidTariff(value) {
  const tariff = Number(value);
  return Number.isFinite(tariff) && tariff > 0 && tariff <= 10;
}

function hasUnsavedChanges(draft, saved) {
  return Object.keys(DEFAULT_SETTINGS).some((key) => Number(draft[key]) !== saved[key]);
}

export default function SettingsPage() {
  const settings = useSettings();
  const toast = useToast();
  const [draft, setDraft] = useState(settings.settings);
  const health = useApi(() => healthApi.get(), []);
  const waste = useApi(() => wasteApi.list({ tariff: settings.tariff }), [settings.tariff]);

  useEffect(() => {
    setDraft(settings.settings);
  }, [settings.settings]);

  const tariffValid = isValidTariff(draft.tariff);
  const isDirty = hasUnsavedChanges(draft, settings.settings);
  const monthlyKwh = waste.data?.totals.monthlySavingsKwh;
  const previewAED = tariffValid && Number.isFinite(monthlyKwh) ? monthlyKwh * Number(draft.tariff) : null;

  // Handlers
  const updateDraft = (fieldName, value) => {
    setDraft((previous) => ({ ...previous, [fieldName]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!tariffValid) return;
    settings.updateSettings({ ...draft, tariff: Number(draft.tariff) });
    toast.success('Settings saved', 'Savings and alerts were recalculated with the new values.');
  };

  const handleReset = () => {
    settings.resetSettings();
    toast.info('Defaults restored', `Tariff AED ${DEFAULT_SETTINGS.tariff}/kWh, alert limit 100%.`);
  };

  // Render
  return (
    <PageContainer title="Settings" description="Assumptions used for savings and alerts. Saved in this browser.">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Calculation settings" subtitle="Changes apply everywhere after you save" icon={SlidersHorizontal} />
          <form onSubmit={handleSave} className="space-y-6 p-5" noValidate>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tariff */}
              <div>
                <label htmlFor="tariff" className="label">Electricity tariff (AED per kWh)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted">AED</span>
                  <input
                    id="tariff"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max="10"
                    className={`input tabular pl-12 ${tariffValid ? '' : 'input-invalid'}`}
                    value={draft.tariff}
                    onChange={(event) => updateDraft('tariff', event.target.value)}
                    aria-invalid={!tariffValid}
                    aria-describedby="tariff-help"
                  />
                </div>
                <p id="tariff-help" className={`mt-1 text-xs ${tariffValid ? 'text-ink-muted' : 'font-medium text-energy-critical-ink'}`}>
                  {tariffValid ? `Default ${DEFAULT_SETTINGS.tariff} is an assumption; the real rate depends on the utility and tariff band.` : 'Enter a value between 0.01 and 10.'}
                </p>
              </div>

              {/* Multiplier */}
              <div>
                <label htmlFor="multiplier" className="label">
                  Alert threshold multiplier
                  <span className="tabular ml-2 font-semibold text-ink-primary">{Math.round(Number(draft.thresholdMultiplier) * 100)}%</span>
                </label>
                <input id="multiplier" type="range" min="0.5" max="2" step="0.05" className="mt-2 w-full accent-brand-primary" value={draft.thresholdMultiplier} onChange={(event) => updateDraft('thresholdMultiplier', Number(event.target.value))} />
                <div className="mt-1 flex justify-between text-xs text-ink-muted">
                  <span>50% (stricter)</span><span>100%</span><span>200% (looser)</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">Scales every building's hourly and daily limit.</p>
              </div>

              {/* Refresh */}
              <div>
                <label htmlFor="refresh" className="label">Auto-refresh interval</label>
                <select id="refresh" className="select" value={draft.refreshSeconds} onChange={(event) => updateDraft('refreshSeconds', Number(event.target.value))}>
                  {REFRESH_OPTIONS.map((seconds) => <option key={seconds} value={seconds}>Every {seconds} seconds</option>)}
                </select>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-line bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Live preview</p>
                {waste.loading && !waste.data && <Skeleton className="mt-2 h-7 w-40" />}
                {previewAED !== null && (
                  <>
                    <p className="tabular mt-1 text-2xl font-bold text-brand-primary">{formatAED(previewAED)}<span className="text-sm font-medium text-ink-secondary">/month</span></p>
                    <p className="text-xs text-ink-secondary">potential savings from {formatNumber(monthlyKwh)} kWh of monthly waste</p>
                  </>
                )}
                {previewAED === null && !(waste.loading && !waste.data) && (
                  <p className="mt-1 text-sm text-ink-secondary">Preview unavailable. Check the tariff value or API connection.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
              <Button variant="ghost" icon={RotateCcw} onClick={handleReset} disabled={settings.isDefault && !isDirty}>Restore defaults</Button>
              <Button type="submit" icon={Save} disabled={!isDirty || !tariffValid}>Save changes</Button>
            </div>
          </form>
        </Card>

        <SystemStatusCard health={health} />
      </div>

      <IngestInfoCard />
    </PageContainer>
  );
}
