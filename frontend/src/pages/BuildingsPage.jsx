import { Building2 } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CardSkeleton } from '../components/ui/CardSkeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { BuildingCard } from '../components/buildings/BuildingCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { dashboardApi } from '../api/endpoints.js';
import { buildingColorVar } from '../utils/constants.js';

const STATUS_ORDER = { critical: 0, warning: 1, normal: 2 };
const SKELETON_COUNT = [0, 1, 2, 3, 4, 5];

// Sorting
function sortBuildings(buildings) {
  return [...buildings].sort((buildingA, buildingB) => {
    const statusDifference = STATUS_ORDER[buildingA.status] - STATUS_ORDER[buildingB.status];
    if (statusDifference !== 0) return statusDifference;
    return buildingB.weekKwh - buildingA.weekKwh;
  });
}

export default function BuildingsPage() {
  const { tariff, thresholdMultiplier } = useSettings();
  const summary = useApi(() => dashboardApi.summary({ tariff, thresholdMultiplier }), [tariff, thresholdMultiplier]);
  const data = summary.data;
  const allCodes = (data?.buildings || []).map((building) => building.code);

  return (
    <PageContainer title="Buildings" description="Per-building consumption, limits and status from simulated data. Limits scale with the alert multiplier in Settings.">
      {summary.error && !data && <Card><ErrorState error={summary.error} onRetry={summary.retry} /></Card>}

      {!summary.error && !data && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SKELETON_COUNT.map((index) => <CardSkeleton key={index} lines={6} />)}
        </div>
      )}

      {data && data.buildings.length === 0 && (
        <Card><EmptyState icon={Building2} title="No buildings yet" description="Add one under Manage → Buildings, or run npm run seed in the backend." /></Card>
      )}

      {data && data.buildings.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortBuildings(data.buildings).map((building) => (
            <BuildingCard key={building.id} building={building} series={data.hourlySeries} colorVar={buildingColorVar(building.code, allCodes)} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
