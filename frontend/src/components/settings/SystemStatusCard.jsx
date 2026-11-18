import { CheckCircle2, Database } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { CardHeader } from '../ui/CardHeader.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SettingsRow } from './SettingsRow.jsx';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export function SystemStatusCard({ health }) {
  return (
    <Card className="h-full">
      <CardHeader title="System status" subtitle="Backend services" icon={Database} />
      <div className="p-5 pt-3">
        {health.loading && !health.data && (
          <div className="space-y-3">{SKELETON_ROWS.map((index) => <Skeleton key={index} className="h-5 w-full" />)}</div>
        )}
        {health.error && !health.data && <p className="text-sm text-energy-critical-ink">{health.error.message}</p>}
        {health.data && (
          <dl className="divide-y divide-line">
            <SettingsRow label="API"><Badge tone="optimal" icon={CheckCircle2}>Online</Badge></SettingsRow>
            <SettingsRow label="Data source">
              {health.data.dataSource === 'mongo' ? <Badge tone="optimal">MongoDB</Badge> : <Badge tone="moderate">Offline dataset (JSON)</Badge>}
            </SettingsRow>
            <SettingsRow label="Data type"><Badge tone="neutral">Simulated</Badge></SettingsRow>
            <SettingsRow label="Recommendations">{health.data.recommendationProvider}</SettingsRow>
            <SettingsRow label="Ingest endpoint">{health.data.ingestEnabled ? 'Enabled' : 'Disabled'}</SettingsRow>
            <SettingsRow label="Version">{health.data.version}</SettingsRow>
          </dl>
        )}
      </div>
    </Card>
  );
}
