import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';
import { CAMPUS_TIMEZONE } from '../../utils/constants.js';

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: CAMPUS_TIMEZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

// Formatting
function getClockParts(date) {
  const parts = {};
  clockFormat.formatToParts(date).forEach((part) => {
    parts[part.type] = part.value;
  });
  return parts;
}

function buildClockText(date) {
  const parts = getClockParts(date);
  return {
    fullText: `${parts.weekday} ${parts.day} ${parts.month} ${parts.year} · ${parts.hour}:${parts.minute}:${parts.second} GST`,
    shortText: `${parts.hour}:${parts.minute}`,
    isoText: date.toISOString(),
  };
}

// Component
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const clock = buildClockText(now);

  return (
    <time
      dateTime={clock.isoText}
      className="tabular inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-primary"
      title="Campus time (UAE, Asia/Dubai)"
    >
      <span className="text-brand-primary"><Icon icon={Clock} size="sm" /></span>
      <span className="hidden md:inline">{clock.fullText}</span>
      <span className="md:hidden">{clock.shortText}</span>
    </time>
  );
}
