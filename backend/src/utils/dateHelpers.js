export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export const toMs = (date) => (date instanceof Date ? date.getTime() : new Date(date).getTime());

export function floorToHour(date) {
  const t = toMs(date);
  return new Date(t - (((t % HOUR_MS) + HOUR_MS) % HOUR_MS));
}

export const addHours = (date, hours) => new Date(toMs(date) + hours * HOUR_MS);

/**
 * Converts a UTC instant into campus-local calendar parts using a fixed UTC offset.
 * The UAE has no daylight saving, so a fixed offset is exact and keeps results
 * independent of the server's own timezone.
 */
export function campusParts(date, utcOffsetHours = 4) {
  const local = new Date(toMs(date) + utcOffsetHours * HOUR_MS);
  return {
    dayOfWeek: local.getUTCDay(),
    hour: local.getUTCHours(),
    dateKey: local.toISOString().slice(0, 10),
  };
}

/** Start of the campus-local day that contains `date`, returned as a UTC Date. */
export function startOfCampusDay(date, utcOffsetHours = 4) {
  const localMs = toMs(date) + utcOffsetHours * HOUR_MS;
  const localDayStart = localMs - (((localMs % DAY_MS) + DAY_MS) % DAY_MS);
  return new Date(localDayStart - utcOffsetHours * HOUR_MS);
}

/** Inclusive window of `hours` hourly slots ending at `end`: [end-(hours-1)h, end]. */
export function hourWindow(end, hours) {
  const to = floorToHour(end);
  return { from: addHours(to, -(hours - 1)), to };
}

export function formatHourLabel(hour) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
}
