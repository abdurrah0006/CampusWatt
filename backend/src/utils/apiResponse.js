import { getActiveSource } from '../repositories/dataStore.js';

/** Every response uses the same envelope: { success, data, error, meta }. */
export function buildMeta(extra = {}) {
  return {
    dataSource: getActiveSource(),
    generatedAt: new Date().toISOString(),
    ...extra,
  };
}

export function sendSuccess(res, data, meta = {}, status = 200) {
  return res.status(status).json({ success: true, data, error: null, meta: buildMeta(meta) });
}

export function sendError(res, status, { code, message, details }) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, ...(details ? { details } : {}) },
    meta: buildMeta(),
  });
}
