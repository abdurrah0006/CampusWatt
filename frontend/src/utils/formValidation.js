// Number checks
function isWholeNumber(value) {
  return value !== '' && Number.isInteger(Number(value));
}

function isPositiveNumber(value) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
}

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

// Building form
export function validateBuildingForm(form) {
  const errors = {};
  const code = String(form.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,6}$/.test(code)) errors.code = 'Use 2 to 6 letters or numbers, for example ENG.';
  if (isBlank(form.name)) errors.name = 'Enter a building name.';
  if (!isWholeNumber(form.floors) || Number(form.floors) < 1 || Number(form.floors) > 30) errors.floors = 'Floors must be a whole number from 1 to 30.';
  if (!isPositiveNumber(form.thresholdKwhPerHour)) errors.thresholdKwhPerHour = 'Enter a limit above 0 kWh per hour.';
  return errors;
}

// Room form
export function validateRoomForm(form) {
  const errors = {};
  const code = String(form.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,20}$/.test(code)) errors.code = 'Use 2 to 20 letters, numbers or dashes, for example ENG-101.';
  if (isBlank(form.name)) errors.name = 'Enter a room name.';
  if (isBlank(form.buildingId)) errors.buildingId = 'Choose a building.';
  if (!isWholeNumber(form.floor) || Number(form.floor) < -5 || Number(form.floor) > 100) errors.floor = 'Floor must be a whole number from -5 to 100.';
  if (isBlank(form.type)) errors.type = 'Choose a room type.';
  if (!isPositiveNumber(form.areaM2)) errors.areaM2 = 'Enter an area above 0 m².';
  if (!isPositiveNumber(form.baselineKw) || Number(form.baselineKw) > 100) errors.baselineKw = 'Baseline must be above 0 and at most 100 kW.';
  return errors;
}

// Schedule form
export function validateScheduleForm(form) {
  const errors = {};
  if (isBlank(form.roomId)) errors.roomId = 'Choose a room.';
  if (isBlank(form.courseName)) errors.courseName = 'Enter a course or class name.';
  const startHour = Number(form.startHour);
  const endHour = Number(form.endHour);
  if (startHour >= endHour) errors.endHour = 'End time must be after the start time.';
  return errors;
}

// Server errors
export function mapServerFieldErrors(error) {
  const fieldErrors = {};
  if (!Array.isArray(error?.details)) return fieldErrors;
  error.details.forEach((detail) => {
    const fieldName = String(detail.path || '').split('.').pop();
    if (fieldName) fieldErrors[fieldName] = detail.message;
  });
  return fieldErrors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
