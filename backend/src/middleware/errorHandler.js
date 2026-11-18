import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const DUPLICATE_KEY_CODE = 11000;

function formatZodIssues(error) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return sendError(res, 400, { code: 'VALIDATION_ERROR', message: 'Invalid request', details: formatZodIssues(err) });
  }

  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, { code: err.code, message: err.message, details: err.details });
  }

  if (err.code === DUPLICATE_KEY_CODE) {
    return sendError(res, 409, { code: 'CONFLICT', message: 'A record with this code already exists' });
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, { code: 'INVALID_JSON', message: 'Request body is not valid JSON' });
  }

  if (err.type === 'entity.too.large') {
    return sendError(res, 413, { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' });
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
  return sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: env.isProduction ? 'Something went wrong. Please try again.' : err.message,
  });
}
