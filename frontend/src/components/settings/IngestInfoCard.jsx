import { useState } from 'react';
import { Check, Copy, Cpu } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { CardHeader } from '../ui/CardHeader.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useToast } from '../../hooks/useToast.js';
import { API_BASE_URL } from '../../api/client.js';
import { copyText } from '../../utils/copyText.js';

function buildIngestUrl() {
  if (API_BASE_URL.startsWith('http')) return `${API_BASE_URL}/energy/ingest`;
  return `${window.location.origin}${API_BASE_URL}/energy/ingest`;
}

export function IngestInfoCard() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const curlCommand = `curl -X POST ${buildIngestUrl()} \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: $INGEST_API_KEY" \\\n  -d '{"roomId":"room-eng-101","kwh":0.85}'`;

  const handleCopy = async () => {
    const success = await copyText(curlCommand);
    if (!success) {
      toast.error('Copy failed', 'Select the text and copy it manually.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card>
      <CardHeader title="Adding readings" subtitle="How readings could arrive in a future version" icon={Cpu} />
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-3 text-sm text-ink-secondary">
          <p>This prototype runs on simulated data. No real sensors or utility meters are connected.</p>
          <p>
            The API already has an ingest endpoint, <code className="rounded bg-elevated px-1.5 py-0.5 text-xs text-ink-primary">POST /api/energy/ingest</code>, protected by the{' '}
            <code className="rounded bg-elevated px-1.5 py-0.5 text-xs text-ink-primary">x-api-key</code> header. You can use it to add test readings, for example for a new room.
          </p>
          <p>Batches of up to 1,000 readings are accepted. Unknown rooms, negative values and future timestamps are rejected.</p>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-ink-primary scrollbar-thin"><code>{curlCommand}</code></pre>
          <button type="button" onClick={handleCopy} className="absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-ink-primary hover:bg-elevated">
            <Icon icon={copied ? Check : Copy} size="sm" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </Card>
  );
}
