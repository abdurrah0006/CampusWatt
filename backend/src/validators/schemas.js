import { z } from 'zod';

const id = z.string().trim().min(1, 'id is required').max(64);

export const tariffParam = z.coerce.number().positive().max(10).optional();
export const multiplierParam = z.coerce.number().min(0.5).max(2).optional();

export const roomsQuery = z.object({
  buildingId: id.optional(),
});

export const buildingIdParams = z.object({ id });

export const energyQuery = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    granularity: z.enum(['hour', 'day']).default('hour'),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '"from" must be before "to"', path: ['from'] });

export const dashboardQuery = z.object({
  tariff: tariffParam,
  thresholdMultiplier: multiplierParam,
});

export const forecastQuery = z.object({
  buildingId: id.optional(),
});

export const wasteQuery = z.object({
  tariff: tariffParam,
});

export const recommendationBody = z.object({
  roomIds: z.array(id).min(1, 'Provide at least one roomId').max(100),
  tariff: z.number().positive().max(10).optional(),
});

const readingInput = z.object({
  roomId: id,
  timestamp: z.coerce.date().optional(),
  kwh: z.number().min(0, 'kwh cannot be negative').max(100000),
});

/** Accepts a single reading or a batch of up to 1000. */
export const ingestBody = z.union([readingInput, z.array(readingInput).min(1).max(1000)]);
