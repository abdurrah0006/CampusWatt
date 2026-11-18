import { store } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { makeId } from '../utils/makeId.js';
import { ROOM_TYPE_LABELS } from '../config/constants.js';
import { assertBuildingExists, assertRoomCodeFree, assertRoomExists } from '../services/crudGuards.js';

function toRoomView(room, buildings) {
  const building = buildings.find((item) => item.id === room.buildingId);
  return {
    ...room,
    typeLabel: ROOM_TYPE_LABELS[room.type] || room.type,
    buildingName: building ? building.name : null,
  };
}

export async function listRooms(req, res) {
  const { buildingId } = req.validated.query;
  if (buildingId) {
    await assertBuildingExists(buildingId);
  }
  const rooms = await store.getRooms({ buildingId });
  const buildings = await store.getBuildings();
  const data = rooms.map((room) => toRoomView(room, buildings));
  return sendSuccess(res, data, { count: data.length });
}

export async function getRoom(req, res) {
  const room = await assertRoomExists(req.validated.params.id);
  const buildings = await store.getBuildings();
  return sendSuccess(res, toRoomView(room, buildings));
}

export async function createRoom(req, res) {
  const input = req.validated.body;
  await assertBuildingExists(input.buildingId);
  await assertRoomCodeFree(input.code);
  const created = await store.createRoom({ id: makeId('room'), ...input });
  const buildings = await store.getBuildings();
  return sendSuccess(res, toRoomView(created, buildings), {}, 201);
}

export async function updateRoom(req, res) {
  const existing = await assertRoomExists(req.validated.params.id);
  const input = req.validated.body;
  await assertBuildingExists(input.buildingId);
  await assertRoomCodeFree(input.code, existing.id);
  const updated = await store.updateRoom(existing.id, input);
  if (!updated) {
    throw ApiError.notFound(`Room "${existing.id}" was not found`);
  }
  const buildings = await store.getBuildings();
  return sendSuccess(res, toRoomView(updated, buildings));
}

export async function deleteRoom(req, res) {
  const room = await assertRoomExists(req.validated.params.id);
  const schedules = await store.getSchedules({ roomIds: [room.id] });
  const readings = await store.getReadings({ roomIds: [room.id] });
  await store.deleteRoom(room.id);
  return sendSuccess(res, {
    id: room.id,
    deleted: true,
    removedSchedules: schedules.length,
    removedReadings: readings.length,
  });
}
