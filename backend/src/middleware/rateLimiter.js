import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const handler = (req, res) =>
  sendError(res, 429, { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again shortly.' });

// Generous enough for several dashboards auto-refreshing on the same network.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler,
});

// Sensors post frequently but predictably; cap bursts per device/IP.
export const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler,
});
