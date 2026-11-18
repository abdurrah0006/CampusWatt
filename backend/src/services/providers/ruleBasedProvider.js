import { DAY_NAMES } from '../../config/constants.js';
import { formatHourLabel } from '../../utils/dateHelpers.js';

const fmtKwh = (n) => `${Math.round(n).toLocaleString('en-US')} kWh`;
const fmtAed = (n) => `AED ${Math.round(n).toLocaleString('en-US')}`;

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const pick = (options, key) => options[hash(key) % options.length];

export function wasteProfile(details = []) {
  const counts = { overnight: 0, evening: 0, weekend: 0, daytime: 0 };
  details.forEach(({ hour, dayOfWeek }) => {
    if (dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 12)) counts.weekend += 1;
    else if (hour >= 22 || hour < 6) counts.overnight += 1;
    else if (hour >= 17) counts.evening += 1;
    else counts.daytime += 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Playbook
const PLAYBOOK = {
  lecture_hall: {
    evening: { cause: 'AC and projector left running after the last class', action: 'Schedule auto-shutoff' },
    overnight: { cause: 'HVAC and lighting running overnight in an empty hall', action: 'Add BMS HVAC schedule' },
    weekend: { cause: 'air conditioning left on over the weekend with no bookings', action: 'Install occupancy sensor' },
    daytime: { cause: 'cooling running between classes while the hall is empty', action: 'Install occupancy sensor' },
  },
  lab: {
    evening: { cause: 'lab equipment and workstations left on after the session ends', action: 'Smart plug / equipment timer' },
    overnight: { cause: 'lab equipment and ventilation left running overnight', action: 'Smart plug / equipment timer' },
    weekend: { cause: 'lab ventilation and equipment running through the weekend', action: 'Add BMS HVAC schedule' },
    daytime: { cause: 'equipment idling between lab sessions', action: 'Smart plug / equipment timer' },
  },
  library: {
    evening: { cause: 'lighting and cooling kept at full level after peak hours', action: 'Lighting timer' },
    overnight: { cause: 'reading-hall lighting left on after closing', action: 'Lighting timer' },
    weekend: { cause: 'HVAC and lighting running while the library is closed', action: 'Add BMS HVAC schedule' },
    daytime: { cause: 'full lighting in low-occupancy zones', action: 'Install occupancy sensor' },
  },
  office: {
    evening: { cause: 'workstations and split AC units left on after working hours', action: 'Schedule auto-shutoff' },
    overnight: { cause: 'PCs, printers and AC left on overnight', action: 'Schedule auto-shutoff' },
    weekend: { cause: 'office AC and IT equipment running on non-working days', action: 'Schedule auto-shutoff' },
    daytime: { cause: 'cooling empty offices outside staff hours', action: 'Install occupancy sensor' },
  },
  server_room: {
    evening: { cause: 'cooling set point lower than the IT load needs', action: 'Raise cooling setpoint' },
    overnight: { cause: 'cooling set point lower than the IT load needs', action: 'Raise cooling setpoint' },
    weekend: { cause: 'idle servers kept running at full power', action: 'Consolidate idle servers' },
    daytime: { cause: 'cooling set point lower than the IT load needs', action: 'Raise cooling setpoint' },
  },
};

const OPENERS = {
  lecture_hall: [
    (f, c) => `${f.roomName} drew power for ${f.wasteHours} hours with no class booked, most likely ${c}.`,
    (f, c) => `No class was scheduled in ${f.roomName} for ${f.wasteHours} hours, yet usage stayed high - a typical sign of ${c}.`,
  ],
  lab: [
    (f, c) => `${f.roomName} kept consuming well above its standby level for ${f.wasteHours} unscheduled hours, pointing to ${c}.`,
    (f, c) => `Outside its booked sessions, ${f.roomName} logged ${f.wasteHours} hours of high usage, which usually means ${c}.`,
  ],
  library: [
    (f, c) => `${f.roomName} stayed at high load for ${f.wasteHours} hours outside opening hours, consistent with ${c}.`,
    (f, c) => `Outside opening hours, ${f.roomName} recorded ${f.wasteHours} hours of elevated usage - likely ${c}.`,
  ],
  office: [
    (f, c) => `${f.roomName} used energy at daytime levels for ${f.wasteHours} hours after staff left, suggesting ${c}.`,
    (f, c) => `We detected ${f.wasteHours} after-hours hours of high load in ${f.roomName}, typically caused by ${c}.`,
  ],
  server_room: [
    (f, c) => `${f.roomName} ran above its expected load for ${f.wasteHours} hours, possibly due to ${c}.`,
  ],
};

const ACTIONS = {
  'Schedule auto-shutoff': [
    (f) => `Set an automatic shut-off for AC and AV equipment at ${f.shutoffLabel} on the building management system.`,
    (f) => `Programme the room controller to switch everything off at ${f.shutoffLabel} unless a booking exists.`,
  ],
  'Add BMS HVAC schedule': [
    (f) => `Link the HVAC zone for ${f.roomCode} to the timetable so cooling only runs during booked hours.`,
    () => 'Add a BMS time schedule so the HVAC zone follows the class timetable instead of running continuously.',
  ],
  'Install occupancy sensor': [
    () => 'An occupancy sensor tied to the AC and lights would cut this automatically when the room is empty.',
    () => 'Fit a ceiling occupancy sensor so cooling and lighting switch off after 15 minutes without movement.',
  ],
  'Smart plug / equipment timer': [
    () => 'Put non-critical equipment on smart plugs with an end-of-day timer and add a "power down" step to the lab checklist.',
    () => 'Use timed smart plugs for printers, rigs and chargers, and keep only safety-critical devices on 24/7 circuits.',
  ],
  'Lighting timer': [
    (f) => `Add a lighting timer that drops the hall to security lighting at ${f.shutoffLabel}.`,
    () => 'Zone the lighting and switch to security lighting after closing with a simple timer.',
  ],
  'Raise cooling setpoint': [
    () => 'Raise the cooling set point by 1-2 °C within ASHRAE limits and check rack inlet temperatures.',
  ],
  'Consolidate idle servers': [
    () => 'Consolidate or power-cap idle servers outside working hours.',
  ],
};

const IMPACT = [
  (f) => `Fixing it saves about ${fmtKwh(f.monthlySavingsKwh)} and ${fmtAed(f.monthlySavingsAED)} per month (peak waste around ${f.peakLabel}).`,
  (f) => `That is roughly ${fmtKwh(f.wasteKwh)} wasted in the last day - about ${fmtAed(f.monthlySavingsAED)} a month if left unchanged.`,
  (f) => `Estimated savings: ${fmtAed(f.monthlySavingsAED)}/month (${fmtKwh(f.monthlySavingsKwh)}), with the worst hour at ${f.peakLabel}.`,
];

export function priorityFor({ monthlySavingsAED, wasteHours }) {
  if (monthlySavingsAED >= 400 || wasteHours >= 8) return 'High';
  if (monthlySavingsAED >= 150 || wasteHours >= 4) return 'Medium';
  return 'Low';
}

export function recommendForRoom(facts) {
  const profile = wasteProfile(facts.wasteHourDetails);
  const play = (PLAYBOOK[facts.roomType] || PLAYBOOK.office)[profile];
  const firstWasteHour = [...(facts.wasteHourDetails || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
  const peakDay = facts.peakDayOfWeek !== undefined ? DAY_NAMES[facts.peakDayOfWeek] : null;

  const ctx = {
    ...facts,
    peakLabel: facts.peakHour !== undefined && facts.peakHour !== null
      ? `${formatHourLabel(facts.peakHour)}${peakDay ? ` on ${peakDay}` : ''}`
      : 'after hours',
    shutoffLabel: firstWasteHour ? formatHourLabel(firstWasteHour.hour) : '6:00 PM',
  };

  const opener = pick(OPENERS[facts.roomType] || OPENERS.office, `${facts.roomCode}-open`)(ctx, play.cause);
  const action = pick(ACTIONS[play.action], `${facts.roomCode}-act`)(ctx);
  const impact = pick(IMPACT, `${facts.roomCode}-impact`)(ctx);

  return {
    roomId: facts.roomId,
    roomCode: facts.roomCode,
    roomName: facts.roomName,
    buildingName: facts.buildingName,
    recommendation: `${opener} ${action} ${impact}`,
    likelyCause: play.cause,
    actionTag: play.action,
    priority: priorityFor(facts),
    wasteProfile: profile,
    monthlySavingsAED: facts.monthlySavingsAED,
    monthlySavingsKwh: facts.monthlySavingsKwh,
  };
}

export const ruleBasedProvider = {
  name: 'rule-based',
  async generate(factsList) {
    return factsList.map(recommendForRoom);
  },
};
