import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2, DoorOpen, Layers } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Icon } from '../ui/Icon.jsx';
import { UsageMeter } from '../ui/UsageMeter.jsx';
import { MiniUsageChart } from '../charts/MiniUsageChart.jsx';
import { BuildingStat } from './BuildingStat.jsx';
import { useChartColors, resolveSeriesColor } from '../../hooks/useChartColors.js';
import { formatNumber, formatPercent } from '../../utils/formatters.js';

const BUILDING_STATUS = {
  critical: { tone: 'critical', label: 'Critical', icon: AlertOctagon },
  warning: { tone: 'moderate', label: 'Warning', icon: AlertTriangle },
  normal: { tone: 'optimal', label: 'Normal', icon: CheckCircle2 },
};

export function BuildingCard({ building, series, colorVar }) {
  const colors = useChartColors();
  const status = BUILDING_STATUS[building.status] || BUILDING_STATUS.normal;
  const dailyPercent = Math.round((building.dailyRatio || 0) * 100);
  const weekChange = building.weekOverWeekPct;
  const flaggedCount = building.flaggedRooms;

  return (
    <Card className={`flex h-full flex-col ${building.status === 'critical' ? 'border-energy-critical' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-xs font-bold text-ink-primary" style={{ borderColor: colorVar }}>
            {building.code}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink-primary">{building.name}</h2>
            <p className="flex items-center gap-3 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1"><Icon icon={Layers} size="sm" />{building.floors} floors</span>
              <span className="inline-flex items-center gap-1"><Icon icon={DoorOpen} size="sm" />{building.roomCount} rooms</span>
            </p>
          </div>
        </div>
        <Badge tone={status.tone} icon={status.icon}>{status.label}</Badge>
      </div>

      {/* Chart */}
      <div className="px-3 pt-3">
        <MiniUsageChart data={series} dataKey={building.id} color={resolveSeriesColor(colorVar, colors)} threshold={building.thresholdKwhPerHour} />
        <p className="px-2 text-xs text-ink-muted">Last 24h · dashed line = hourly limit</p>
      </div>

      {/* Stats */}
      <dl className="grid grid-cols-3 gap-3 px-5 pt-4">
        <BuildingStat label="Now" value={formatNumber(building.latestKwh, 1)} unit="kWh/h" />
        <BuildingStat label="Limit" value={formatNumber(building.thresholdKwhPerHour, 1)} unit="kWh/h" />
        <BuildingStat label="Last 24h" value={formatNumber(building.last24hKwh)} unit="kWh" />
        <BuildingStat label="This week" value={formatNumber(building.weekKwh)} unit="kWh" />
        <BuildingStat label="vs last week" value={typeof weekChange === 'number' ? formatPercent(weekChange, { signed: true }) : '-'} />
        <BuildingStat label="Campus share" value={formatPercent(building.sharePct)} />
      </dl>

      {/* Daily budget */}
      <div className="mt-auto px-5 pb-5 pt-4">
        <UsageMeter percent={dailyPercent} label="Daily limit used" detail={`of ${formatNumber(building.dailyThresholdKwh)} kWh per day`} />
        {flaggedCount > 0 && (
          <Link to="/waste" className="mt-3 inline-flex text-xs font-semibold text-energy-critical-ink hover:underline">
            {flaggedCount} room{flaggedCount > 1 ? 's' : ''} wasting energy → Waste Finder
          </Link>
        )}
      </div>
    </Card>
  );
}
