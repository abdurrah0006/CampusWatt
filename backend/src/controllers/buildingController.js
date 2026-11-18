import { store } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { makeId } from '../utils/makeId.js';
import { assertBuildingCodeFree, assertBuildingExists } from '../services/crudGuards.js';

function withRoomCount(building, rooms) {
  const roomCount = rooms.filter((room) => room.buildingId === building.id).length;
  return { ...building, roomCount };
}

export async function listBuildings(req, res) {
  const buildings = await store.getBuildings();
  const rooms = await store.getRooms();
  const data = buildings.map((building) => withRoomCount(building, rooms));
  return sendSuccess(res, data, { count: data.length });
}

export async function getBuilding(req, res) {
  const building = await assertBuildingExists(req.validated.params.id);
  const rooms = await store.getRooms();
  return sendSuccess(res, withRoomCount(building, rooms));
}

export async function createBuilding(req, res) {
  const input = req.validated.body;
  await assertBuildingCodeFree(input.code);
  const created = await store.createBuilding({ id: makeId('bld'), ...input });
  return sendSuccess(res, withRoomCount(created, []), {}, 201);
}

export async function updateBuilding(req, res) {
  const existing = await assertBuildingExists(req.validated.params.id);
  const input = req.validated.body;
  await assertBuildingCodeFree(input.code, existing.id);
  const updated = await store.updateBuilding(existing.id, input);
  if (!updated) {
    throw ApiError.notFound(`Building "${existing.id}" was not found`);
  }
  const rooms = await store.getRooms();
  return sendSuccess(res, withRoomCount(updated, rooms));
}

export async function deleteBuilding(req, res) {
  const building = await assertBuildingExists(req.validated.params.id);
  const rooms = await store.getRooms({ buildingId: building.id });
  const { cascade } = req.validated.query;
  if (rooms.length > 0 && !cascade) {
    throw ApiError.conflict(
      `This building still has ${rooms.length} room${rooms.length === 1 ? '' : 's'}. Delete the rooms first, or confirm a cascade delete.`,
      { roomCount: rooms.length },
    );
  }
  await store.deleteBuilding(building.id);
  return sendSuccess(res, { id: building.id, deleted: true, removedRooms: rooms.length });
}
