import { store } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { makeId } from '../utils/makeId.js';
import { DAY_NAMES } from '../config/constants.js';
import { assertBuildingExists, assertRoomExists, assertScheduleExists } from '../services/crudGuards.js';
import { findOverlappingBlock, formatHourRange } from '../services/scheduleRules.js';

function toScheduleView(schedule, rooms) {
  const room = rooms.find((item) => item.id === schedule.roomId);
  return {
    ...schedule,
    dayName: DAY_NAMES[schedule.dayOfWeek],
    roomCode: room ? room.code : null,
    roomName: room ? room.name : null,
  };
}

function sortSchedules(schedules) {
  return [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour);
}

async function resolveRoomIds(roomId, buildingId) {
  let roomIds = null;
  if (buildingId) {
    const building = await assertBuildingExists(buildingId);
    const rooms = await store.getRooms({ buildingId: building.id });
    roomIds = rooms.map((room) => room.id);
  }
  if (roomId) {
    const room = await assertRoomExists(roomId);
    if (roomIds && !roomIds.includes(room.id)) {
      return [];
    }
    roomIds = [room.id];
  }
  return roomIds;
}

async function assertNoOverlap(roomId, candidate, ignoreId) {
  const existing = await store.getSchedules({ roomIds: [roomId] });
  const clash = findOverlappingBlock(existing, candidate, ignoreId);
  if (clash) {
    throw ApiError.conflict(
      `This overlaps "${clash.courseName}" in the same room (${formatHourRange(clash.startHour, clash.endHour)}).`,
      { conflictingScheduleId: clash.id },
    );
  }
}

export async function listSchedules(req, res) {
  const { roomId, buildingId } = req.validated.query;
  const roomIds = await resolveRoomIds(roomId, buildingId);
  const filter = roomIds ? { roomIds } : {};
  const schedules = await store.getSchedules(filter);
  const rooms = await store.getRooms();
  const data = sortSchedules(schedules).map((schedule) => toScheduleView(schedule, rooms));
  return sendSuccess(res, data, { count: data.length });
}

export async function createSchedule(req, res) {
  const input = req.validated.body;
  await assertRoomExists(input.roomId);
  await assertNoOverlap(input.roomId, input, null);
  const created = await store.createSchedule({ id: makeId('sch'), ...input });
  const rooms = await store.getRooms();
  return sendSuccess(res, toScheduleView(created, rooms), {}, 201);
}

export async function updateSchedule(req, res) {
  const existing = await assertScheduleExists(req.validated.params.id);
  const input = req.validated.body;
  await assertRoomExists(input.roomId);
  await assertNoOverlap(input.roomId, input, existing.id);
  const updated = await store.updateSchedule(existing.id, input);
  if (!updated) {
    throw ApiError.notFound(`Schedule "${existing.id}" was not found`);
  }
  const rooms = await store.getRooms();
  return sendSuccess(res, toScheduleView(updated, rooms));
}

export async function deleteSchedule(req, res) {
  const existing = await assertScheduleExists(req.validated.params.id);
  await store.deleteSchedule(existing.id);
  return sendSuccess(res, { id: existing.id, deleted: true });
}
