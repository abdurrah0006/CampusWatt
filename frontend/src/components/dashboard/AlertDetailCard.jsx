import { formatDateTime, formatNumber } from '../../utils/formatters.js';

export function AlertDetailCard({ alert }) {
  return (
    <div className="p-4 text-sm">
      <p className="font-semibold">{alert.buildingName}</p>
      <dl className="tabular mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <dt>Current ({alert.type})</dt>
        <dd className="text-right font-semibold">{formatNumber(alert.currentValue)} {alert.unit}</dd>
        <dt>Limit</dt>
        <dd className="text-right font-semibold">{formatNumber(alert.threshold)} {alert.unit}</dd>
        <dt>Over by</dt>
        <dd className="text-right font-semibold">{alert.percentOver}%</dd>
        <dt>As of</dt>
        <dd className="text-right">{formatDateTime(alert.timestamp)}</dd>
      </dl>
    </div>
  );
}
