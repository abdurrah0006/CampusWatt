import { AlertOctagon, AlertTriangle } from 'lucide-react';

export const ALERT_SEVERITY = {
  critical: { tone: 'critical', icon: AlertOctagon, label: 'Critical' },
  warning: { tone: 'moderate', icon: AlertTriangle, label: 'Warning' },
};
