import { store } from '../repositories/dataStore.js';
import { ApiError } from '../utils/ApiError.js';

export async function assertBuildingExists(buildingId) {
  const building = await store.getBuildingById(buildingId);
  if (!building) {
    throw ApiError.notFound(`Building "${buildingId}" was not found`);
  }
  return building;
}

export async function assertRoomExists(roomId) {
  const [room] = await store.getRoomsByIds([roomId]);
  if (!room) {
    throw ApiError.notFound(`Room "${roomId}" was not found`);
  }
  return room;
}

export async function assertScheduleExists(scheduleId) {
  const schedule = await store.getScheduleById(scheduleId);
  if (!schedule) {
    throw ApiError.notFound(`Schedule "${scheduleId}" was not found`);
  }
  return schedule;
}

export async function assertBuildingCodeFree(code, exceptId = null) {
  const buildings = await store.getBuildings();
  const clash = buildings.find((building) => building.code === code && building.id !== exceptId);
  if (clash) {
    throw ApiError.conflict(`A building with code ${code} already exists`);
  }
}

export async function assertRoomCodeFree(code, exceptId = null) {
  const rooms = await store.getRooms();
  const clash = rooms.find((room) => room.code === code && room.id !== exceptId);
  if (clash) {
    throw ApiError.conflict(`A room with code ${code} already exists`);
  }
}
