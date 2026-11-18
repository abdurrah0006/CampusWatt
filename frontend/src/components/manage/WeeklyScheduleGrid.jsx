import { DAY_SHORT_NAMES } from '../../utils/constants.js';
import { ScheduleBookedCell } from './ScheduleBookedCell.jsx';
import { ScheduleEmptyCell } from './ScheduleEmptyCell.jsx';

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, index) => GRID_START_HOUR + index);

// Helpers
function findBlockAt(schedules, dayOfWeek, hour) {
  return schedules.find((block) => block.dayOfWeek === dayOfWeek && block.startHour <= hour && hour < block.endHour);
}

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function isFirstVisibleHour(block, hour) {
  return block.startHour === hour || hour === GRID_START_HOUR;
}

// Grid
export function WeeklyScheduleGrid({ schedules, onAdd, onEdit }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th scope="col" className="w-14 text-left font-semibold text-ink-muted"><span className="sr-only">Day</span></th>
            {GRID_HOURS.map((hour) => (
              <th key={hour} scope="col" className="tabular text-left font-medium text-ink-muted">{formatHourLabel(hour)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_SHORT_NAMES.map((dayName, dayOfWeek) => (
            <tr key={dayName}>
              <th scope="row" className="pr-2 text-left font-semibold text-ink-secondary">{dayName}</th>
              {GRID_HOURS.map((hour) => {
                const block = findBlockAt(schedules, dayOfWeek, hour);
                return (
                  <td key={hour}>
                    {block && <ScheduleBookedCell block={block} showLabel={isFirstVisibleHour(block, hour)} onEdit={onEdit} />}
                    {!block && <ScheduleEmptyCell dayOfWeek={dayOfWeek} hour={hour} onAdd={onAdd} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-muted">Showing 07:00 to 22:00. Click an empty cell to add a class, or a booked cell to edit it.</p>
    </div>
  );
}
