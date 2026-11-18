import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarX, Lightbulb, SearchX } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Icon } from '../ui/Icon.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { RoomStatusBadge } from './RoomStatusBadge.jsx';
import { SortableHeader } from './SortableHeader.jsx';
import { buildingColorVar } from '../../utils/constants.js';
import { formatAED, formatNumber } from '../../utils/formatters.js';

const COLUMNS = [
  { key: 'roomName', label: 'Room', align: 'left' },
  { key: 'buildingName', label: 'Building', align: 'left' },
  { key: 'currentKwh', label: 'Current kWh', align: 'right' },
  { key: 'scheduledNow', label: 'Scheduled now', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'wasteHours', label: 'Waste hours', align: 'right' },
  { key: 'aed', label: 'Est. AED/month', align: 'right' },
];

const TEXT_COLUMNS = ['roomName', 'buildingName'];

// Sorting
function compareRooms(roomA, roomB, key) {
  const valueA = roomA[key];
  const valueB = roomB[key];
  if (typeof valueA === 'number' || typeof valueB === 'number') return (valueA ?? -Infinity) - (valueB ?? -Infinity);
  if (typeof valueA === 'boolean') return Number(valueA) - Number(valueB);
  return String(valueA ?? '').localeCompare(String(valueB ?? ''));
}

function sortRooms(rooms, sort) {
  const sorted = [...rooms].sort((roomA, roomB) => compareRooms(roomA, roomB, sort.key));
  if (sort.direction === 'desc') sorted.reverse();
  return sorted;
}

export function RoomsTable({ rooms, recommendationsByRoom, onShowRecommendation, onClearFilters }) {
  const [sort, setSort] = useState({ key: 'aed', direction: 'desc' });
  const sortedRooms = useMemo(() => sortRooms(rooms, sort), [rooms, sort]);
  const allCodes = useMemo(() => [...new Set(rooms.map((room) => room.buildingCode))], [rooms]);

  // Handlers
  const changeSort = (key) => {
    if (sort.key === key) {
      setSort({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
      return;
    }
    setSort({ key, direction: TEXT_COLUMNS.includes(key) ? 'asc' : 'desc' });
  };

  if (!rooms.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="No rooms match these filters"
        description="Try another building or status."
        action={onClearFilters && <button type="button" onClick={onClearFilters} className="text-sm font-semibold text-brand-secondary hover:underline">Clear filters</button>}
      />
    );
  }

  // Render
  return (
    <div className="max-h-[70vh] overflow-auto scrollbar-thin">
      <table className="data-table min-w-[900px]">
        <thead>
          <tr>
            {COLUMNS.map((column) => <SortableHeader key={column.key} column={column} sort={sort} onSort={changeSort} />)}
            <th scope="col" className="text-right"><span className="sr-only">Recommendation</span></th>
          </tr>
        </thead>
        <tbody>
          {sortedRooms.map((room) => {
            const recommendation = recommendationsByRoom?.[room.roomId];
            const isWaste = room.status === 'waste';
            return (
              <tr key={room.roomId} className={isWaste ? 'bg-energy-critical-soft' : ''}>
                <td>
                  <p className="font-semibold">{room.roomName}</p>
                  <p className="text-xs text-ink-muted">{room.roomCode} · {room.roomTypeLabel}</p>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2 text-ink-secondary">
                    <span className="h-2 w-2 rounded-full" style={{ background: buildingColorVar(room.buildingCode, allCodes) }} aria-hidden="true" />
                    {room.buildingName}
                  </span>
                </td>
                <td className="numeric font-medium">{formatNumber(room.currentKwh, 1)}</td>
                <td className="text-center">
                  {room.scheduledNow ? <Badge tone="info" icon={CalendarCheck}>Yes</Badge> : <Badge tone="neutral" icon={CalendarX}>No</Badge>}
                </td>
                <td className="text-center"><RoomStatusBadge room={room} /></td>
                <td className="numeric text-ink-secondary">{room.wasteHours || '-'}</td>
                <td className={`numeric font-semibold ${isWaste ? '' : 'text-ink-muted'}`}>{isWaste ? formatAED(room.aed) : '-'}</td>
                <td className="text-right">
                  {recommendation && (
                    <button type="button" onClick={() => onShowRecommendation(room.roomId)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand-secondary hover:bg-elevated">
                      <Icon icon={Lightbulb} size="sm" /> View tip
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
