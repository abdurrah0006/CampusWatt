import { HOUR_MS, campusParts, floorToHour, addHours } from '../utils/dateHelpers.js';
import { HISTORY_DAYS } from '../config/constants.js';

export const DATA_SEED = 'campuswatt-liwa-2026';
const UTC_OFFSET = 4;
const DAILY_LOAD_FACTOR = 0.7;

export const BUILDINGS = [
  { id: 'bld-eng', code: 'ENG', name: 'Engineering Building', floors: 3 },
  { id: 'bld-bus', code: 'BUS', name: 'Business School', floors: 3 },
  { id: 'bld-lib', code: 'LIB', name: 'Central Library', floors: 2 },
  { id: 'bld-sci', code: 'SCI', name: 'Science Labs', floors: 3 },
  { id: 'bld-adm', code: 'ADM', name: 'Administration', floors: 2 },
];

const THRESHOLD_RATIOS = { ENG: 0.95, BUS: 0.72, LIB: 0.68, SCI: 1.14, ADM: 0.62 };

const ROOMS = [
  { code: 'ENG-101', name: 'Lecture Hall A', building: 'ENG', floor: 1, type: 'lecture_hall', areaM2: 220, baselineKw: 3.2, pattern: 'lectureA' },
  { code: 'ENG-204', name: 'Robotics Lab', building: 'ENG', floor: 2, type: 'lab', areaM2: 160, baselineKw: 5.5, pattern: 'lab' },
  { code: 'ENG-310', name: 'Computer Lab 3', building: 'ENG', floor: 3, type: 'lab', areaM2: 140, baselineKw: 4.8, pattern: 'labB' },
  { code: 'ENG-115', name: 'Faculty Offices', building: 'ENG', floor: 1, type: 'office', areaM2: 180, baselineKw: 1.6, pattern: 'office' },

  { code: 'BUS-G01', name: 'Main Auditorium', building: 'BUS', floor: 0, type: 'lecture_hall', areaM2: 420, baselineKw: 6.0, pattern: 'auditorium' },
  { code: 'BUS-120', name: 'Seminar Room 1', building: 'BUS', floor: 1, type: 'lecture_hall', areaM2: 90, baselineKw: 2.2, pattern: 'lectureB' },
  { code: 'BUS-230', name: 'Trading Floor Lab', building: 'BUS', floor: 2, type: 'lab', areaM2: 130, baselineKw: 4.0, pattern: 'labB' },
  { code: 'BUS-305', name: "Dean's Office Suite", building: 'BUS', floor: 3, type: 'office', areaM2: 120, baselineKw: 1.4, pattern: 'office' },

  { code: 'LIB-G10', name: 'Main Reading Hall', building: 'LIB', floor: 0, type: 'library', areaM2: 600, baselineKw: 5.0, pattern: 'library' },
  { code: 'LIB-150', name: 'Group Study Rooms', building: 'LIB', floor: 1, type: 'library', areaM2: 200, baselineKw: 2.4, pattern: 'library' },
  { code: 'LIB-210', name: 'Digital Media Lab', building: 'LIB', floor: 2, type: 'lab', areaM2: 110, baselineKw: 3.6, pattern: 'lab' },
  { code: 'LIB-220', name: 'Archive & Staff Offices', building: 'LIB', floor: 2, type: 'office', areaM2: 150, baselineKw: 1.5, pattern: 'office' },

  { code: 'SCI-110', name: 'Chemistry Lab', building: 'SCI', floor: 1, type: 'lab', areaM2: 190, baselineKw: 6.5, pattern: 'lab' },
  { code: 'SCI-205', name: 'Biology Lab', building: 'SCI', floor: 2, type: 'lab', areaM2: 170, baselineKw: 6.0, pattern: 'labB' },
  { code: 'SCI-B01', name: 'Campus Server Room', building: 'SCI', floor: -1, type: 'server_room', areaM2: 80, baselineKw: 9.0, pattern: 'none' },
  { code: 'SCI-301', name: 'Physics Lecture Hall', building: 'SCI', floor: 3, type: 'lecture_hall', areaM2: 200, baselineKw: 3.0, pattern: 'lectureB' },

  { code: 'ADM-101', name: 'Student Services Center', building: 'ADM', floor: 1, type: 'office', areaM2: 210, baselineKw: 2.0, pattern: 'office' },
  { code: 'ADM-201', name: 'Administration Offices', building: 'ADM', floor: 2, type: 'office', areaM2: 260, baselineKw: 2.2, pattern: 'office' },
  { code: 'ADM-G05', name: 'Conference Hall', building: 'ADM', floor: 0, type: 'lecture_hall', areaM2: 240, baselineKw: 3.4, pattern: 'conference' },
  { code: 'ADM-210', name: 'IT Help Desk', building: 'ADM', floor: 2, type: 'office', areaM2: 90, baselineKw: 1.8, pattern: 'office' },
];

const PATTERNS = {
  lectureA: {
    1: [[8, 10], [10, 12], [13, 15], [15, 17]],
    2: [[9, 11], [11, 13], [14, 16]],
    3: [[8, 10], [10, 12], [13, 15], [15, 17]],
    4: [[9, 11], [11, 13], [14, 16]],
    5: [[9, 11]],
  },
  lectureB: {
    1: [[9, 11], [13, 15]],
    2: [[8, 10], [10, 12], [14, 16]],
    3: [[9, 11], [13, 15]],
    4: [[10, 12], [14, 16]],
  },
  lab: {
    1: [[9, 12], [13, 16]],
    2: [[10, 13], [14, 17]],
    3: [[9, 12], [13, 16]],
    4: [[10, 13]],
    5: [[9, 12]],
  },
  labB: {
    1: [[10, 13]],
    2: [[9, 12], [13, 16]],
    3: [[10, 13], [14, 17]],
    4: [[9, 12], [13, 16]],
  },
  auditorium: { 1: [[10, 12]], 2: [[13, 15]], 3: [[10, 12], [15, 17]], 4: [[11, 13]] },
  conference: { 1: [[10, 12]], 2: [[14, 16]], 3: [[9, 11]], 4: [[13, 15]] },
  office: { 1: [[8, 17]], 2: [[8, 17]], 3: [[8, 17]], 4: [[8, 17]], 5: [[8, 12]] },
  library: { 0: [[10, 18]], 1: [[8, 22]], 2: [[8, 22]], 3: [[8, 22]], 4: [[8, 22]], 5: [[9, 16]] },
  none: {},
};

const COURSES = {
  ENG: ['Circuit Analysis', 'Thermodynamics', 'Engineering Mathematics II', 'Digital Logic Design', 'Statics & Dynamics', 'Control Systems', 'Embedded Systems', 'Robotics Fundamentals'],
  BUS: ['Principles of Marketing', 'Financial Accounting', 'Business Analytics', 'Corporate Finance', 'Organizational Behavior', 'Entrepreneurship', 'Investment Trading Lab'],
  LIB: ['Library opening hours', 'Media Production Workshop', 'Research Skills Seminar'],
  SCI: ['General Chemistry Lab', 'Organic Chemistry', 'Cell Biology Lab', 'Microbiology', 'Physics I', 'Modern Physics'],
  ADM: ['Board Meeting', 'Faculty Council', 'Student Orientation', 'Staff Training'],
};

const WASTE_RULES = [
  { code: 'ENG-101', days: [1, 2, 3, 4], hours: [18, 19, 20, 21, 22], factor: [2.3, 2.8] }, // AC + projector left on after last class
  { code: 'ENG-204', days: 'all', hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5], factor: [1.8, 2.1] }, // robotics rigs/3D printers left on overnight
  { code: 'BUS-G01', days: 'all', hours: [19, 20, 21, 22, 23], factor: [2.4, 2.9] }, // auditorium HVAC + stage lights after evening use
  { code: 'LIB-G10', days: 'all', hours: [23, 0, 1, 2, 3, 4, 5], factor: [1.7, 2.0] }, // reading-hall lighting left on overnight
  { code: 'SCI-110', days: [1, 2, 3, 4, 5], hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6], factor: [1.6, 1.9] }, // fume hoods running overnight
  { code: 'ADM-G05', days: [5, 6, 0], hours: [13, 14, 15, 16, 17], factor: [2.5, 3.0] }, // conference hall AC on during weekend afternoons
];

// Randomness
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (key) => mulberry32(hashString(`${DATA_SEED}|${key}`));
const between = (rng, [min, max]) => min + rng() * (max - min);
const round2 = (n) => Math.round(n * 100) / 100;

// Builders
const slug = (code) => code.toLowerCase();

export function buildBuildings() {
  return BUILDINGS.map((b) => ({ ...b, thresholdKwhPerHour: 0 }));
}

export function buildRooms() {
  return ROOMS.map((r) => ({
    id: `room-${slug(r.code)}`,
    code: r.code,
    name: r.name,
    buildingId: `bld-${slug(r.building)}`,
    floor: r.floor,
    type: r.type,
    areaM2: r.areaM2,
    baselineKw: r.baselineKw,
  }));
}

export function buildSchedules() {
  const schedules = [];
  ROOMS.forEach((room, roomIndex) => {
    const pattern = PATTERNS[room.pattern] || {};
    const pool = COURSES[room.building];
    Object.entries(pattern).forEach(([day, blocks]) => {
      blocks.forEach(([startHour, endHour], blockIndex) => {
        let courseName;
        if (room.type === 'office') courseName = 'Staff working hours';
        else if (room.type === 'library') courseName = 'Library opening hours';
        else courseName = pool[(roomIndex * 3 + Number(day) * 2 + blockIndex) % pool.length];
        schedules.push({
          id: `sch-${slug(room.code)}-${day}-${startHour}`,
          roomId: `room-${slug(room.code)}`,
          dayOfWeek: Number(day),
          startHour,
          endHour,
          courseName,
        });
      });
    });
  });
  return schedules;
}

function scheduledAt(pattern, dayOfWeek, hour) {
  return (pattern[dayOfWeek] || []).some(([s, e]) => hour >= s && hour < e);
}

function wasteRuleFor(code, dayOfWeek, hour) {
  return WASTE_RULES.find(
    (rule) => rule.code === code && rule.hours.includes(hour) && (rule.days === 'all' || rule.days.includes(dayOfWeek)),
  );
}

const OCCUPIED_FACTORS = {
  lecture_hall: [2.4, 3.3],
  lab: [2.0, 2.6],
  office: [2.0, 2.5],
  library: [1.9, 2.4],
};

export function usageForHour(room, ts) {
  const { dayOfWeek, hour } = campusParts(ts, UTC_OFFSET);
  const rng = rngFor(`${room.code}|${Math.floor(ts.getTime() / HOUR_MS)}`);
  const base = room.baselineKw;

  if (room.type === 'server_room') {
    const heat = hour >= 12 && hour <= 17 ? 0.12 : 0;
    return round2(base * (1.02 + heat + rng() * 0.12));
  }

  const pattern = PATTERNS[room.pattern] || {};
  if (scheduledAt(pattern, dayOfWeek, hour)) {
    const heat = hour >= 12 && hour <= 16 ? 1.08 : 1;
    return round2(base * between(rng, OCCUPIED_FACTORS[room.type]) * heat);
  }

  const waste = wasteRuleFor(room.code, dayOfWeek, hour);
  if (waste) return round2(base * between(rng, waste.factor));

  const nearClass = scheduledAt(pattern, dayOfWeek, hour - 1) || scheduledAt(pattern, dayOfWeek, hour + 1);
  if (nearClass) return round2(base * between(rng, [1.12, 1.35])); // pre-cooling / wind-down
  if (hour < 6 || hour >= 22) return round2(base * between(rng, [0.55, 0.8]));
  return round2(base * between(rng, [0.75, 1.05]));
}

export function generateDataset({ now = new Date(), days = HISTORY_DAYS } = {}) {
  const end = floorToHour(now);
  const start = addHours(end, -(days * 24 - 1));
  const rooms = buildRooms();
  const roomByCode = new Map(ROOMS.map((r) => [r.code, r]));

  const readings = [];
  for (let t = start.getTime(); t <= end.getTime(); t += HOUR_MS) {
    const ts = new Date(t);
    rooms.forEach((room) => {
      const source = roomByCode.get(room.code);
      readings.push({
        roomId: room.id,
        buildingId: room.buildingId,
        timestamp: ts.toISOString(),
        kwh: usageForHour({ ...room, pattern: source.pattern }, ts),
      });
    });
  }

  const windowStart = addHours(end, -23).getTime();
  const rolling = {};
  readings.forEach((r) => {
    const t = new Date(r.timestamp).getTime();
    if (t >= windowStart) rolling[r.buildingId] = (rolling[r.buildingId] || 0) + r.kwh;
  });

  const buildings = buildBuildings().map((b) => {
    const dailyLimit = (rolling[b.id] || 0) / THRESHOLD_RATIOS[b.code];
    return { ...b, thresholdKwhPerHour: Math.round((dailyLimit / (24 * DAILY_LOAD_FACTOR)) * 10) / 10 };
  });

  return {
    meta: {
      seed: DATA_SEED,
      generatedAt: new Date().toISOString(),
      referenceTime: end.toISOString(),
      days,
      readings: readings.length,
    },
    buildings,
    rooms,
    schedules: buildSchedules(),
    readings,
  };
}
