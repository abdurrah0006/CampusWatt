import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useToast } from '../../hooks/useToast.js';
import { copyText } from '../../utils/copyText.js';
import { formatAED } from '../../utils/formatters.js';

const PRIORITY_TONES = { High: 'critical', Medium: 'moderate', Low: 'neutral' };

export function RecommendationCard({ item, tariff, highlighted }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const cardRef = useRef(null);
  const monthlyAED = item.monthlySavingsKwh * tariff;

  useEffect(() => {
    if (highlighted) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted]);

  // Handlers
  const handleCopy = async () => {
    const text = `${item.roomName} (${item.roomCode}) - ${item.actionTag} [${item.priority} priority]\n${item.recommendation}`;
    const success = await copyText(text);
    if (!success) {
      toast.error('Copy failed', 'Your browser blocked clipboard access.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Render
  const borderClass = highlighted ? 'border-brand-secondary' : 'border-line';
  return (
    <article ref={cardRef} className={`rounded-xl border bg-surface p-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink-primary">{item.roomName}</p>
          <p className="text-xs text-ink-secondary">{item.roomCode} · {item.buildingName}</p>
        </div>
        <Badge tone={PRIORITY_TONES[item.priority]}>{item.priority} priority</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{item.recommendation}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{item.actionTag}</Badge>
          <Badge tone="brand">{formatAED(monthlyAED)}/month</Badge>
        </div>
        <button type="button" onClick={handleCopy} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-ink-secondary hover:bg-elevated hover:text-ink-primary">
          <Icon icon={copied ? Check : Copy} size="sm" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </article>
  );
}
