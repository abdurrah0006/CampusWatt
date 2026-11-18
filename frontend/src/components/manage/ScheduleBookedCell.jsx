import { DAY_NAMES } from '../../utils/constants.js';
import { formatHourRange } from '../../utils/formatters.js';

export function ScheduleBookedCell({ block, showLabel, onEdit }) {
  const timeText = formatHourRange(block.startHour, block.endHour);
  return (
    <button
      type="button"
      onClick={() => onEdit(block)}
      className="h-12 w-full overflow-hidden rounded-md bg-energy-info-soft px-1 text-left text-[11px] font-semibold leading-tight text-energy-info-ink hover:outline hover:outline-2 hover:outline-brand-secondary"
      aria-label={`${block.courseName}, ${DAY_NAMES[block.dayOfWeek]} ${timeText}. Edit`}
      title={`${block.courseName} · ${timeText}`}
    >
      {showLabel ? block.courseName : ''}
    </button>
  );
}
