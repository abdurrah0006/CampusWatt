import { Building2, CalendarDays, DoorOpen, LayoutDashboard, ScanSearch, Settings, Warehouse } from 'lucide-react';

// App
export const APP_NAME = 'CampusWatt';
export const CAMPUS_TIMEZONE = 'Asia/Dubai';

// Navigation
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/waste', label: 'Waste Finder', icon: ScanSearch },
  { to: '/buildings', label: 'Buildings', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const MANAGE_ITEMS = [
  { to: '/manage/buildings', label: 'Buildings', icon: Warehouse },
  { to: '/manage/rooms', label: 'Rooms', icon: DoorOpen },
  { to: '/manage/schedules', label: 'Schedules', icon: CalendarDays },
];

// Building colors
const FIXED_SERIES_SLOTS = { ENG: 1, BUS: 2, LIB: 3, SCI: 4, ADM: 5 };
const SERIES_SLOT_COUNT = 5;

export function getBuildingSeriesSlot(code, allCodes = []) {
  if (FIXED_SERIES_SLOTS[code]) return FIXED_SERIES_SLOTS[code];
  const usedSlots = allCodes.map((otherCode) => FIXED_SERIES_SLOTS[otherCode]).filter(Boolean);
  const freeSlots = [];
  for (let slot = 1; slot <= SERIES_SLOT_COUNT; slot += 1) {
    if (!usedSlots.includes(slot)) freeSlots.push(slot);
  }
  const newCodes = allCodes.filter((otherCode) => !FIXED_SERIES_SLOTS[otherCode]).sort();
  const position = newCodes.indexOf(code);
  if (position >= 0 && position < freeSlots.length) return freeSlots[position];
  return null;
}

export function buildingColorVar(code, allCodes = []) {
  const slot = getBuildingSeriesSlot(code, allCodes);
  if (!slot) return 'var(--series-other)';
  return `var(--series-${slot})`;
}

// Settings
export const DEFAULT_SETTINGS = Object.freeze({
  tariff: 0.38,
  thresholdMultiplier: 1,
  refreshSeconds: 60,
});

export const REFRESH_OPTIONS = [30, 45, 60];

// Rooms and schedules
export const ROOM_TYPES = [
  { value: 'lecture_hall', label: 'Lecture hall (classroom)' },
  { value: 'lab', label: 'Lab' },
  { value: 'office', label: 'Office' },
  { value: 'library', label: 'Library' },
  { value: 'server_room', label: 'Server room' },
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
