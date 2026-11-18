import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const safeEqual = (a, b) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Protects device endpoints with the `x-api-key` header (INGEST_API_KEY). */
export function requireApiKey(req, res, next) {
  if (!env.ingestApiKey) {
    return next(ApiError.unavailable('Ingestion is disabled. Set INGEST_API_KEY in backend/.env to enable it.'));
  }
  const provided = req.get('x-api-key') || '';
  if (!provided || !safeEqual(provided, env.ingestApiKey)) return next(ApiError.unauthorized());
  return next();
}
