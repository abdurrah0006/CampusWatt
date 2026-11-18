import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.INGEST_API_KEY = 'test-ingest-key';
  process.env.LLM_API_KEY = '';
  const { generateDataset } = await import('../src/data/generator.js');
  const { buildJsonRepository } = await import('../src/repositories/jsonRepository.js');
  const { initDataStore } = await import('../src/repositories/dataStore.js');
  const { createApp } = await import('../src/app.js');
  await initDataStore({ preferred: 'json', jsonRepository: buildJsonRepository(generateDataset({ now: new Date('2026-11-17T10:30:00Z') })) });
  app = createApp();
});

describe('API (JSON data source)', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ success: true, error: null, data: { status: 'ok', dataSource: 'json' } });
  });

  test('GET /api/buildings returns 5 buildings with room counts', async () => {
    const res = await request(app).get('/api/buildings').expect(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.data.reduce((a, b) => a + b.roomCount, 0)).toBe(20);
  });

  test('GET /api/rooms filters by building and 404s on unknown building', async () => {
    const res = await request(app).get('/api/rooms?buildingId=bld-sci').expect(200);
    expect(res.body.data.every((r) => r.buildingId === 'bld-sci')).toBe(true);
    await request(app).get('/api/rooms?buildingId=nope').expect(404);
  });

  test('GET /api/waste always has flagged rooms and positive savings', async () => {
    const res = await request(app).get('/api/waste').expect(200);
    expect(res.body.data.totals.flaggedRooms).toBeGreaterThanOrEqual(4);
    expect(res.body.data.totals.monthlySavingsAED).toBeGreaterThan(0);
  });

  test('GET /api/waste scales AED with tariff', async () => {
    const a = await request(app).get('/api/waste?tariff=0.38');
    const b = await request(app).get('/api/waste?tariff=0.76');
    expect(b.body.data.totals.monthlySavingsAED).toBeCloseTo(a.body.data.totals.monthlySavingsAED * 2, 0);
    await request(app).get('/api/waste?tariff=-1').expect(400);
  });

  test('GET /api/dashboard/summary includes a critical alert and a highest consumer', async () => {
    const res = await request(app).get('/api/dashboard/summary').expect(200);
    const { kpis, alerts, highestConsumer, hourlySeries, weeklyTotals } = res.body.data;
    expect(alerts.some((a) => a.severity === 'critical')).toBe(true);
    expect(kpis.activeAlerts).toBe(alerts.length);
    expect(highestConsumer.code).toBeDefined();
    expect(hourlySeries).toHaveLength(24);
    expect(weeklyTotals).toHaveLength(5);
  });

  test('GET /api/dashboard/forecast returns history and forecast', async () => {
    const res = await request(app).get('/api/dashboard/forecast?buildingId=bld-eng').expect(200);
    expect(res.body.data.points).toHaveLength(48);
    await request(app).get('/api/dashboard/forecast?buildingId=nope').expect(404);
  });

  test('GET /api/energy/building/:id supports day granularity', async () => {
    const res = await request(app).get('/api/energy/building/bld-lib?granularity=day').expect(200);
    expect(res.body.data.series.length).toBeGreaterThanOrEqual(13);
    await request(app).get('/api/energy/building/bld-lib?granularity=week').expect(400);
  });

  test('POST /api/recommendations works without an LLM key', async () => {
    const waste = await request(app).get('/api/waste');
    const roomIds = waste.body.data.rooms.filter((r) => r.flagged).map((r) => r.roomId);
    const res = await request(app).post('/api/recommendations').send({ roomIds }).expect(200);
    expect(res.body.data.source).toBe('rule-based');
    expect(res.body.data.items).toHaveLength(roomIds.length);
    await request(app).post('/api/recommendations').send({ roomIds: [] }).expect(400);
  });

  test('POST /api/energy/ingest requires the API key and validates input', async () => {
    await request(app).post('/api/energy/ingest').send({ roomId: 'room-eng-101', kwh: 1 }).expect(401);
    await request(app).post('/api/energy/ingest').set('x-api-key', 'test-ingest-key').send({ roomId: 'room-eng-101', kwh: -1 }).expect(400);
    await request(app).post('/api/energy/ingest').set('x-api-key', 'test-ingest-key').send({ roomId: 'ghost', kwh: 1 }).expect(422);
    const res = await request(app)
      .post('/api/energy/ingest')
      .set('x-api-key', 'test-ingest-key')
      .send([{ roomId: 'room-eng-101', kwh: 0.5, timestamp: '2026-11-17T10:15:00Z' }])
      .expect(201);
    expect(res.body.data.received).toBe(1);
  });

  test('unknown routes return the JSON envelope with 404', async () => {
    const res = await request(app).get('/api/does-not-exist').expect(404);
    expect(res.body).toMatchObject({ success: false, data: null, error: { code: 'NOT_FOUND' } });
  });
});
