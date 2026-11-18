import { AlertOctagon, CheckCircle2, CircleDashed } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

export function RoomStatusBadge({ room }) {
  if (room.currentKwh === null || room.currentKwh === undefined) {
    return <Badge tone="neutral" icon={CircleDashed}>No data yet</Badge>;
  }
  if (room.status === 'waste') {
    return <Badge tone="critical" icon={AlertOctagon}>Waste</Badge>;
  }
  return <Badge tone="optimal" icon={CheckCircle2}>OK</Badge>;
}
