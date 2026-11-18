import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// Friendly messages
const STATUS_MESSAGES = {
  400: 'Some fields are not valid. Please check the form.',
  404: 'That item no longer exists. It may have been deleted.',
  409: 'This change conflicts with existing data.',
  503: 'The database is offline, so this change cannot be saved right now.',
};

function pickErrorMessage(error, envelope) {
  if (envelope?.error?.code === 'VALIDATION_ERROR') return STATUS_MESSAGES[400];
  if (envelope?.error?.message) return envelope.error.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error.response) return "Can't reach the CampusWatt API. Make sure the backend is running.";
  return STATUS_MESSAGES[error.response.status] || `Request failed (${error.response.status}).`;
}

function toFriendlyError(error) {
  if (axios.isCancel(error)) return error;
  const envelope = error.response?.data;
  const friendlyError = new Error(pickErrorMessage(error, envelope));
  friendlyError.status = error.response?.status;
  friendlyError.code = envelope?.error?.code;
  friendlyError.details = envelope?.error?.details;
  return friendlyError;
}

// Envelope unwrap
function unwrapEnvelope(response) {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) return Promise.reject(toFriendlyError({ response }));
    return { data: body.data, meta: body.meta };
  }
  return { data: body, meta: {} };
}

api.interceptors.response.use(unwrapEnvelope, (error) => Promise.reject(toFriendlyError(error)));
