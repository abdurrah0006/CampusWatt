import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, Bell, Gauge, LineChart as LineChartIcon, PiggyBank, Zap } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CardHeader } from '../components/ui/CardHeader.jsx';
import { ChartSkeleton } from '../components/ui/ChartSkeleton.jsx';
import { CardSkeleton } from '../components/ui/CardSkeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { KpiCard } from '../components/dashboard/KpiCard.jsx';
import { HighestConsumerCard } from '../components/dashboard/HighestConsumerCard.jsx';
import { AlertBanner } from '../components/dashboard/AlertBanner.jsx';
import { AlertsList } from '../components/dashboard/AlertsList.jsx';
import { BuildingChips } from '../components/dashboard/BuildingChips.jsx';
import { BuildingUsageChart } from '../components/charts/BuildingUsageChart.jsx';
import { ForecastChart } from '../components/charts/ForecastChart.jsx';
import { WeeklyBarChart } from '../components/charts/WeeklyBarChart.jsx';
import { useApi } from '../hooks/useApi.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { dashboardApi } from '../api/endpoints.js';
import { buildingColorVar } from '../utils/constants.js';
import { formatAED, formatDateTime, formatKwh, formatNumber } from '../utils/formatters.js';

// Helpers
function getAlertTone(kpis) {
  if (!kpis) return 'neutral';
  if (kpis.criticalAlerts) return 'critical';
  if (kpis.activeAlerts) return 'moderate';
  return 'optimal';
}

function getAlertSummary(kpis) {
  if (!kpis) return null;
  if (!kpis.activeAlerts) return 'All buildings within limits';
  return `${kpis.criticalAlerts} critical · ${kpis.activeAlerts - kpis.criticalAlerts} warning`;
}

function buildForecastSubtitle(forecastData, forecastTitle) {
  if (!forecastData?.summary) return 'Average of the same hour over the previous 7 days';
  const { forecastTotalKwh, lookbackDays } = forecastData.summary;
  return `${forecastTitle} · next 24h ≈ ${formatKwh(forecastTotalKwh, 0)} · average of the same hour over the last ${lookbackDays} days`;
}

export default function DashboardPage() {
  const { tariff, thresholdMultiplier } = useSettings();
  const [usageBuilding, setUsageBuilding] = useState('all');
  const [forecastBuilding, setForecastBuilding] = useState('all');

  const summary = useApi(() => dashboardApi.summary({ tariff, thresholdMultiplier }), [tariff, thresholdMultiplier]);
  const forecast = useApi(() => dashboardApi.forecast(forecastBuilding), [forecastBuilding]);

  const data = summary.data;
  const buildings = data?.buildings || [];
  const allCodes = buildings.map((building) => building.code);
  const savingsAED = data ? data.kpis.potentialMonthlySavingsKwh * tariff : 0;
  const forecastTitle = useMemo(() => {
    if (forecastBuilding === 'all') return 'All buildings';
    return buildings.find((building) => building.id === forecastBuilding)?.name;
  }, [forecastBuilding, buildings]);

  if (summary.error && !data) {
    return (
      <PageContainer title="Energy Dashboard">
        <Card><ErrorState error={summary.error} onRetry={summary.retry} /></Card>
      </PageContainer>
    );
  }

  const loading = summary.loading && !data;
  const hasNoReadings = data && !data.referenceTime;
  const highestCode = data?.highestConsumer?.code;
  const description = data?.referenceTime
    ? `Campus-wide energy use, alerts and forecast from simulated data · as of ${formatDateTime(data.referenceTime)} (UAE time)`
    : 'Campus-wide energy use, alerts and forecast from simulated data.';

  return (
    <PageContainer title="Energy Dashboard" description={description}>
      {data && <AlertBanner alerts={data.alerts} />}

      {hasNoReadings && (
        <Card>
          <EmptyState icon={Activity} title="No energy readings yet" description='Run "npm run seed" in the backend, or send readings to POST /api/energy/ingest.' />
        </Card>
      )}

      {!hasNoReadings && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard loading={loading} label="Campus energy today" value={data && formatNumber(data.kpis.todayKwh)} unit="kWh" icon={Zap} tone="info" delta={data?.kpis.todayChangePct} sub="vs. same time yesterday" />
            <HighestConsumerCard loading={loading} consumer={data?.highestConsumer} colorVar={buildingColorVar(highestCode, allCodes)} />
            <KpiCard loading={loading} label="Active alerts" value={data && data.kpis.activeAlerts} icon={Bell} tone={getAlertTone(data?.kpis)} sub={getAlertSummary(data?.kpis)} />
            <KpiCard
              loading={loading}
              highlight
              label="Potential savings"
              value={data && formatAED(savingsAED)}
              unit="/month"
              icon={PiggyBank}
              tone="brand"
              sub={data && `${data.kpis.flaggedRooms} rooms wasting energy`}
              footer={data && <Link to="/waste" className="mt-3 inline-flex text-xs font-semibold text-brand-secondary hover:underline">Open Waste Finder →</Link>}
            />
          </div>

          {/* Usage charts */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Hourly usage by building" subtitle="Last 24 hours, kWh per hour" icon={LineChartIcon} />
              <div className="px-5 pt-3">
                {!loading && <BuildingChips buildings={buildings} value={usageBuilding} onChange={setUsageBuilding} />}
              </div>
              <div className="p-5 pt-3">
                {loading && <ChartSkeleton height={300} />}
                {!loading && <BuildingUsageChart data={data.hourlySeries} buildings={buildings} selected={usageBuilding} />}
              </div>
            </Card>

            <Card>
              <CardHeader title="This week vs last week" subtitle="Total kWh per building" icon={BarChart3} />
              <div className="p-5">
                {loading && <ChartSkeleton height={300} />}
                {!loading && data.weeklyTotals.length > 0 && <WeeklyBarChart data={data.weeklyTotals} />}
                {!loading && data.weeklyTotals.length === 0 && <EmptyState icon={BarChart3} title="No weekly data yet" />}
              </div>
            </Card>
          </div>

          {/* Forecast and alerts */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="24-hour forecast"
                subtitle={buildForecastSubtitle(forecast.data, forecastTitle)}
                icon={Gauge}
                action={buildings.length > 0 && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="sr-only">Forecast building</span>
                    <select className="select w-48" value={forecastBuilding} onChange={(event) => setForecastBuilding(event.target.value)}>
                      <option value="all">All buildings</option>
                      {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
                    </select>
                  </label>
                )}
              />
              <div className="p-5">
                {forecast.error && !forecast.data && <ErrorState error={forecast.error} onRetry={forecast.retry} title="Forecast unavailable" />}
                {!forecast.error && !forecast.data && <ChartSkeleton height={300} />}
                {forecast.data && forecast.data.points.length > 0 && <ForecastChart points={forecast.data.points} />}
                {forecast.data && forecast.data.points.length === 0 && (
                  <EmptyState icon={Gauge} title="Not enough history to forecast" description="The forecast needs at least one previous day of readings." />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Alerts"
                subtitle="Buildings above 90% of their limit"
                icon={Bell}
                action={data?.alerts.length ? <span className="tabular text-sm font-semibold text-ink-secondary">{data.alerts.length}</span> : null}
              />
              <div className="pt-2">
                {loading && <CardSkeleton lines={4} className="border-0 shadow-none" />}
                {!loading && <AlertsList alerts={data.alerts} />}
              </div>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
