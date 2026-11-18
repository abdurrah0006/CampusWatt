import { z } from 'zod';
import { ROOM_TYPES } from '../config/constants.js';

const requiredText = (maxLength) =>
  z.string().trim().min(1, 'This field is required').max(maxLength, `Keep it under ${maxLength} characters`);

const buildingCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,6}$/, 'Building code must be 2 to 6 letters or numbers, e.g. ENG');

const roomCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{2,20}$/, 'Room code must be 2 to 20 letters, numbers or dashes, e.g. ENG-101');

export const idParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const buildingBodySchema = z.object({
  code: buildingCode,
  name: requiredText(120),
  floors: z.coerce.number().int('Floors must be a whole number').min(1, 'Floors must be at least 1').max(30, 'Floors cannot exceed 30'),
  thresholdKwhPerHour: z.coerce.number().positive('Threshold must be above 0').max(10000),
});

export const deleteBuildingQuerySchema = z.object({
  cascade: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});

export const roomBodySchema = z.object({
  code: roomCode,
  name: requiredText(120),
  buildingId: requiredText(64),
  floor: z.coerce.number().int('Floor must be a whole number').min(-5).max(100),
  type: z.enum(ROOM_TYPES, { errorMap: () => ({ message: 'Choose a valid room type' }) }),
  areaM2: z.coerce.number().positive('Area must be above 0').max(100000),
  baselineKw: z.coerce.number().positive('Baseline must be above 0').max(100),
});

export const scheduleBodySchema = z
  .object({
    roomId: requiredText(64),
    dayOfWeek: z.coerce.number().int().min(0, 'Day must be 0 to 6').max(6, 'Day must be 0 to 6'),
    startHour: z.coerce.number().int().min(0, 'Start hour must be 0 to 23').max(23, 'Start hour must be 0 to 23'),
    endHour: z.coerce.number().int().min(1, 'End hour must be 1 to 24').max(24, 'End hour must be 1 to 24'),
    courseName: requiredText(120),
  })
  .refine((schedule) => schedule.startHour < schedule.endHour, {
    message: 'Start hour must be before end hour',
    path: ['endHour'],
  });

export const scheduleQuerySchema = z.object({
  roomId: z.string().trim().min(1).max(64).optional(),
  buildingId: z.string().trim().min(1).max(64).optional(),
});
