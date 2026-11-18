import { useEffect, useState } from 'react';
import { useDataRefresh } from '../../context/DataRefreshContext.jsx';
import { formatRelative } from '../../utils/formatters.js';

export function DataFreshness({ isStale, staleReason }) {
  const { lastUpdated } = useDataRefresh();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const dotClass = isStale ? 'bg-energy-moderate' : 'bg-energy-optimal';
  const stateLabel = isStale ? staleReason : 'Live';
  const updatedText = lastUpdated ? `updated ${formatRelative(lastUpdated, now)}` : 'loading…';

  return (
    <p className="tabular hidden items-center gap-2 whitespace-nowrap text-xs text-ink-secondary lg:flex" title={`${stateLabel} · data ${updatedText}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="font-semibold text-ink-primary">{stateLabel}</span>
      <span>· Data {updatedText}</span>
    </p>
  );
}
