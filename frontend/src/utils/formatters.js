import { CAMPUS_TIMEZONE } from './constants.js';

// Numbers
const wholeNumberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecimalFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const twoDecimalFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatNumber(value, digits = 0) {
  if (!isNumber(value)) return '-';
  if (digits === 0) return wholeNumberFormat.format(value);
  if (digits === 1) return oneDecimalFormat.format(value);
  return twoDecimalFormat.format(value);
}

export function formatAED(value, { decimals = 0 } = {}) {
  if (!isNumber(value)) return '-';
  return `AED ${formatNumber(value, decimals)}`;
}

export function formatKwh(value, digits) {
  if (!isNumber(value)) return '-';
  let decimals = digits;
  if (decimals === undefined) decimals = Math.abs(value) >= 100 ? 0 : 1;
  return `${formatNumber(value, decimals)} kWh`;
}

export function formatPercent(value, { signed = false, digits = 1 } = {}) {
  if (!isNumber(value)) return '-';
  const text = formatNumber(Math.abs(value), digits);
  if (!signed) return `${value < 0 ? '-' : ''}${text}%`;
  if (value > 0) return `+${text}%`;
  if (value < 0) return `−${text}%`;
  return `${text}%`;
}

// Dates
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: CAMPUS_TIMEZONE });
const hourFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', timeZone: CAMPUS_TIMEZONE });
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: CAMPUS_TIMEZONE,
});
const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: CAMPUS_TIMEZONE });

function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatWith(format, value) {
  const date = toValidDate(value);
  if (!date) return '-';
  return format.format(date);
}

export const formatTime = (value) => formatWith(timeFormat, value);
export const formatHour = (value) => formatWith(hourFormat, value);
export const formatDateTime = (value) => formatWith(dateTimeFormat, value);
export const formatDay = (value) => formatWith(dayFormat, value);

export function formatRelative(date, now = Date.now()) {
  if (!date) return 'never';
  const secondsAgo = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000));
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const minutesAgo = Math.round(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  return `${Math.round(minutesAgo / 60)} h ago`;
}

export function formatHourOfDay(hour) {
  const normalisedHour = ((hour % 24) + 24) % 24;
  const twelveHour = normalisedHour % 12 === 0 ? 12 : normalisedHour % 12;
  const suffix = normalisedHour < 12 ? 'AM' : 'PM';
  return `${twelveHour} ${suffix}`;
}

export function formatHourRange(startHour, endHour) {
  const pad = (hour) => String(hour).padStart(2, '0');
  return `${pad(startHour)}:00 to ${pad(endHour)}:00`;
}
