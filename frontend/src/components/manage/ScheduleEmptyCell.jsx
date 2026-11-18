import { DAY_NAMES } from '../../utils/constants.js';

export function ScheduleEmptyCell({ dayOfWeek, hour, onAdd }) {
  const hourLabel = `${String(hour).padStart(2, '0')}:00`;
  return (
    <button
      type="button"
      onClick={() => onAdd(dayOfWeek, hour)}
      className="h-12 w-full rounded-md border border-dashed border-line text-xs text-ink-muted hover:border-brand-secondary hover:text-brand-secondary"
      aria-label={`Add class on ${DAY_NAMES[dayOfWeek]} at ${hourLabel}`}
    >
      +
    </button>
  );
}
