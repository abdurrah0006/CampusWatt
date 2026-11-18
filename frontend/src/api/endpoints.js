import { api } from './client.js';

// Helpers
function removeEmptyParams(params) {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') cleaned[key] = value;
  });
  return cleaned;
}

async function getData(request) {
  const response = await request;
  return response.data;
}

function encodeId(id) {
  return encodeURIComponent(id);
}

// Health
export const healthApi = {
  get: () => getData(api.get('/health')),
};

// Buildings
export const buildingsApi = {
  list: () => getData(api.get('/buildings')),
  get: (id) => getData(api.get(`/buildings/${encodeId(id)}`)),
  create: (building) => getData(api.post('/buildings', building)),
  update: (id, building) => getData(api.put(`/buildings/${encodeId(id)}`, building)),
  remove: (id, { cascade = false } = {}) => getData(api.delete(`/buildings/${encodeId(id)}`, { params: { cascade: String(cascade) } })),
  energy: (id, { from, to, granularity = 'hour' } = {}) =>
    getData(api.get(`/energy/building/${encodeId(id)}`, { params: removeEmptyParams({ from, to, granularity }) })),
};

// Rooms
export const roomsApi = {
  list: (buildingId) => getData(api.get('/rooms', { params: removeEmptyParams({ buildingId }) })),
  get: (id) => getData(api.get(`/rooms/${encodeId(id)}`)),
  create: (room) => getData(api.post('/rooms', room)),
  update: (id, room) => getData(api.put(`/rooms/${encodeId(id)}`, room)),
  remove: (id) => getData(api.delete(`/rooms/${encodeId(id)}`)),
};

// Schedules
export const schedulesApi = {
  list: ({ roomId, buildingId } = {}) => getData(api.get('/schedules', { params: removeEmptyParams({ roomId, buildingId }) })),
  create: (schedule) => getData(api.post('/schedules', schedule)),
  update: (id, schedule) => getData(api.put(`/schedules/${encodeId(id)}`, schedule)),
  remove: (id) => getData(api.delete(`/schedules/${encodeId(id)}`)),
};

// Dashboard
export const dashboardApi = {
  summary: ({ tariff, thresholdMultiplier } = {}) =>
    getData(api.get('/dashboard/summary', { params: removeEmptyParams({ tariff, thresholdMultiplier }) })),
  forecast: (buildingId) => {
    const params = removeEmptyParams({ buildingId: buildingId === 'all' ? undefined : buildingId });
    return getData(api.get('/dashboard/forecast', { params }));
  },
  alerts: ({ thresholdMultiplier } = {}) => getData(api.get('/dashboard/alerts', { params: removeEmptyParams({ thresholdMultiplier }) })),
};

// Waste
export const wasteApi = {
  list: ({ tariff } = {}) => getData(api.get('/waste', { params: removeEmptyParams({ tariff }) })),
};

// Recommendations
export const recommendationsApi = {
  generate: ({ roomIds, tariff }) => getData(api.post('/recommendations', removeEmptyParams({ roomIds, tariff }))),
};
