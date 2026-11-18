import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import { readFile, rm } from 'node:fs/promises';
import { generateDataset } from '../src/data/generator.js';
import { buildJsonRepository } from '../src/repositories/jsonRepository.js';
import { initDataStore } from '../src/repositories/dataStore.js';
import { createApp } from '../src/app.js';

const overridesPath = path.join(os.tmpdir(), `campuswatt-crud-${process.pid}.json`);
let app;

const newBuilding = (overrides = {}) => ({
  code: 'TST',
  name: 'Test Hall',
  floors: 2,
  thresholdKwhPerHour: 20,
  ...overrides,
});

const newRoom = (overrides = {}) => ({
  code: 'BUS-900',
  name: 'Test Lab',
  buildingId: 'bld-bus',
  floor: 1,
  type: 'lab',
  areaM2: 60,
  baselineKw: 2.5,
  ...overrides,
});

const newSchedule = (overrides = {}) => ({
  roomId: 'room-bus-120',
  dayOfWeek: 5,
  startHour: 10,
  endHour: 11,
  courseName: 'Friday Workshop',
  ...overrides,
});

beforeAll(async () => {
  await rm(overridesPath, { force: true });
  const dataset = generateDataset({ now: new Date('2026-11-17T10:30:00Z') });
  await initDataStore({
    preferred: 'json',
    jsonRepository: buildJsonRepository(dataset, { persistPath: overridesPath }),
  });
  app = createApp();
});

afterAll(async () => {
  await rm(overridesPath, { force: true });
});

describe('Buildings CRUD', () => {
  test('creates a building and lists it', async () => {
    const res = await request(app).post('/api/buildings').send(newBuilding({ code: 'NEW1' })).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ code: 'NEW1', name: 'Test Hall', roomCount: 0 });
    expect(res.body.data.id).toMatch(/^bld-/);

    const list = await request(app).get('/api/buildings').expect(200);
    expect(list.body.data.some((b) => b.code === 'NEW1')).toBe(true);
  });

  test('rejects an invalid building code with 400', async () => {
    const res = await request(app).post('/api/buildings').send(newBuilding({ code: 'a' })).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('code');
  });

  test('rejects a duplicate building code with 409', async () => {
    await request(app).post('/api/buildings').send(newBuilding({ code: 'ENG' })).expect(409);
  });

  test('returns 404 for an unknown building', async () => {
    await request(app).get('/api/buildings/bld-missing').expect(404);
  });

  test('updates a building and rejects a code that another building uses', async () => {
    const created = await request(app).post('/api/buildings').send(newBuilding({ code: 'UPD' })).expect(201);
    const id = created.body.data.id;

    const updated = await request(app).put(`/api/buildings/${id}`).send(newBuilding({ code: 'UPD', name: 'Renamed Hall' })).expect(200);
    expect(updated.body.data.name).toBe('Renamed Hall');

    await request(app).put(`/api/buildings/${id}`).send(newBuilding({ code: 'ENG' })).expect(409);
  });

  test('refuses to delete a building that still has rooms', async () => {
    const res = await request(app).delete('/api/buildings/bld-adm').expect(409);
    expect(res.body.error.details.roomCount).toBeGreaterThan(0);
  });

  test('cascade delete removes the building, its rooms and their schedules', async () => {
    const building = await request(app).post('/api/buildings').send(newBuilding({ code: 'CAS' })).expect(201);
    const buildingId = building.body.data.id;
    const room = await request(app).post('/api/rooms').send(newRoom({ code: 'CAS-1', buildingId })).expect(201);
    const roomId = room.body.data.id;
    await request(app).post('/api/schedules').send(newSchedule({ roomId, dayOfWeek: 1, startHour: 9, endHour: 10 })).expect(201);

    const res = await request(app).delete(`/api/buildings/${buildingId}?cascade=true`).expect(200);
    expect(res.body.data).toMatchObject({ deleted: true, removedRooms: 1 });

    await request(app).get(`/api/rooms/${roomId}`).expect(404);
    await request(app).get(`/api/buildings/${buildingId}`).expect(404);
  });
});

describe('Rooms CRUD', () => {
  test('creates a room with its building name and type label', async () => {
    const res = await request(app).post('/api/rooms').send(newRoom({ code: 'BUS-901' })).expect(201);
    expect(res.body.data).toMatchObject({ code: 'BUS-901', typeLabel: 'Lab', buildingName: 'Business School' });
  });

  test('accepts the server_room type and rejects unknown types', async () => {
    await request(app).post('/api/rooms').send(newRoom({ code: 'SRV-1', type: 'server_room' })).expect(201);
    const res = await request(app).post('/api/rooms').send(newRoom({ code: 'BUS-902', type: 'gym' })).expect(400);
    expect(res.body.error.details[0].path).toBe('type');
  });

  test('returns 404 when the building does not exist', async () => {
    await request(app).post('/api/rooms').send(newRoom({ code: 'NOB-1', buildingId: 'bld-nope' })).expect(404);
  });

  test('rejects a duplicate room code with 409', async () => {
    await request(app).post('/api/rooms').send(newRoom({ code: 'ENG-101' })).expect(409);
  });

  test('updates a room', async () => {
    const created = await request(app).post('/api/rooms').send(newRoom({ code: 'BUS-903' })).expect(201);
    const id = created.body.data.id;
    const res = await request(app).put(`/api/rooms/${id}`).send(newRoom({ code: 'BUS-903', name: 'Renamed Lab' })).expect(200);
    expect(res.body.data.name).toBe('Renamed Lab');
  });

  test('deleting a room removes it from the waste list', async () => {
    const created = await request(app).post('/api/rooms').send(newRoom({ code: 'BUS-904' })).expect(201);
    const id = created.body.data.id;

    const before = await request(app).get('/api/waste').expect(200);
    expect(before.body.data.rooms.some((r) => r.roomId === id)).toBe(true);

    await request(app).delete(`/api/rooms/${id}`).expect(200);

    const after = await request(app).get('/api/waste').expect(200);
    expect(after.body.data.rooms.some((r) => r.roomId === id)).toBe(false);
  });
});

describe('Schedules CRUD', () => {
  test('creates a schedule and filters the list by room', async () => {
    const res = await request(app).post('/api/schedules').send(newSchedule({ startHour: 8, endHour: 9 })).expect(201);
    expect(res.body.data).toMatchObject({ dayName: 'Friday', roomCode: 'BUS-120' });

    const list = await request(app).get('/api/schedules?roomId=room-bus-120').expect(200);
    expect(list.body.data.some((s) => s.id === res.body.data.id)).toBe(true);
  });

  test('rejects start hour that is not before end hour', async () => {
    await request(app).post('/api/schedules').send(newSchedule({ startHour: 12, endHour: 12 })).expect(400);
  });

  test('rejects an overlapping block in the same room with 409', async () => {
    await request(app).post('/api/schedules').send(newSchedule({ startHour: 16, endHour: 18, dayOfWeek: 5 })).expect(201);
    const res = await request(app).post('/api/schedules').send(newSchedule({ startHour: 17, endHour: 19, dayOfWeek: 5 })).expect(409);
    expect(res.body.error.message).toMatch(/overlaps/);
  });

  test('allows back-to-back blocks that only touch', async () => {
    await request(app).post('/api/schedules').send(newSchedule({ startHour: 14, endHour: 15, dayOfWeek: 0 })).expect(201);
    await request(app).post('/api/schedules').send(newSchedule({ startHour: 15, endHour: 16, dayOfWeek: 0 })).expect(201);
  });

  test('returns 404 for an unknown room', async () => {
    await request(app).post('/api/schedules').send(newSchedule({ roomId: 'room-nope' })).expect(404);
  });

  test('updates a block without clashing with itself', async () => {
    const created = await request(app).post('/api/schedules').send(newSchedule({ startHour: 16, endHour: 17, dayOfWeek: 6 })).expect(201);
    const id = created.body.data.id;
    const res = await request(app).put(`/api/schedules/${id}`).send(newSchedule({ startHour: 16, endHour: 18, dayOfWeek: 6 })).expect(200);
    expect(res.body.data.endHour).toBe(18);
  });

  test('deleting a schedule removes only that block', async () => {
    const created = await request(app).post('/api/schedules').send(newSchedule({ startHour: 8, endHour: 9, dayOfWeek: 0 })).expect(201);
    const id = created.body.data.id;
    const before = await request(app).get('/api/schedules?roomId=room-bus-120').expect(200);
    await request(app).delete(`/api/schedules/${id}`).expect(200);
    const after = await request(app).get('/api/schedules?roomId=room-bus-120').expect(200);
    expect(after.body.data.length).toBe(before.body.data.length - 1);
    await request(app).get(`/api/schedules/${id}`).expect(404);
  });

  test('filters schedules by building', async () => {
    const res = await request(app).get('/api/schedules?buildingId=bld-lib').expect(200);
    expect(res.body.data.every((s) => s.roomId.startsWith('room-lib-'))).toBe(true);
  });
});

describe('New rooms with no readings', () => {
  test('appear in the waste list with status ok and no kWh yet', async () => {
    const created = await request(app).post('/api/rooms').send(newRoom({ code: 'BUS-905' })).expect(201);
    const waste = await request(app).get('/api/waste').expect(200);
    const row = waste.body.data.rooms.find((r) => r.roomId === created.body.data.id);
    expect(row).toMatchObject({ status: 'ok', flagged: false, currentKwh: null });
  });

  test('dashboard summary still responds and shows the empty building', async () => {
    await request(app).post('/api/buildings').send(newBuilding({ code: 'EMP' })).expect(201);
    const res = await request(app).get('/api/dashboard/summary').expect(200);
    const empty = res.body.data.buildings.find((b) => b.code === 'EMP');
    expect(empty).toMatchObject({ latestKwh: 0, last24hKwh: 0 });
  });
});

describe('Saved runtime changes', () => {
  test('writes changes to the overrides file', async () => {
    const raw = await readFile(overridesPath, 'utf8');
    const snapshot = JSON.parse(raw);
    expect(snapshot.buildings.some((b) => b.code === 'NEW1')).toBe(true);
    expect(Array.isArray(snapshot.readings)).toBe(true);
  });
});
