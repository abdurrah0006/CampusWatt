import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { EnergyReading } from '../models/EnergyReading.js';
import { floorToHour } from '../utils/dateHelpers.js';

const toPlain = ({ _id, createdAt, updatedAt, ...rest }) => ({ id: _id, ...rest });
const toReading = ({ roomId, buildingId, timestamp, kwh }) => ({ roomId, buildingId, timestamp: new Date(timestamp), kwh });

export function createMongoRepository() {
  return {
    source: 'mongo',

    async countBuildings() {
      return Building.estimatedDocumentCount();
    },

    async getBuildings() {
      const docs = await Building.find().sort({ code: 1 }).lean();
      return docs.map(toPlain);
    },

    async getBuildingById(id) {
      const doc = await Building.findOne({ $or: [{ _id: id }, { code: String(id).toUpperCase() }] }).lean();
      return doc ? toPlain(doc) : null;
    },

    async createBuilding(building) {
      const { id, ...fields } = building;
      const doc = await Building.create({ _id: id, ...fields });
      return toPlain(doc.toObject());
    },

    async updateBuilding(id, fields) {
      const doc = await Building.findByIdAndUpdate(id, fields, { new: true }).lean();
      return doc ? toPlain(doc) : null;
    },

    async deleteBuilding(id) {
      const rooms = await Room.find({ buildingId: id }, { _id: 1 }).lean();
      const roomIds = rooms.map((room) => room._id);
      await Schedule.deleteMany({ roomId: { $in: roomIds } });
      await EnergyReading.deleteMany({ buildingId: id });
      await Room.deleteMany({ buildingId: id });
      const result = await Building.deleteOne({ _id: id });
      return result.deletedCount > 0;
    },

    async getRooms({ buildingId } = {}) {
      const docs = await Room.find(buildingId ? { buildingId } : {}).sort({ code: 1 }).lean();
      return docs.map(toPlain);
    },

    async getRoomsByIds(ids) {
      const docs = await Room.find({ _id: { $in: ids } }).lean();
      return docs.map(toPlain);
    },

    async createRoom(room) {
      const { id, ...fields } = room;
      const doc = await Room.create({ _id: id, ...fields });
      return toPlain(doc.toObject());
    },

    async updateRoom(id, fields) {
      const doc = await Room.findByIdAndUpdate(id, fields, { new: true }).lean();
      if (!doc) {
        return null;
      }
      if (fields.buildingId) {
        await EnergyReading.updateMany({ roomId: id }, { buildingId: fields.buildingId });
      }
      return toPlain(doc);
    },

    async deleteRoom(id) {
      await Schedule.deleteMany({ roomId: id });
      await EnergyReading.deleteMany({ roomId: id });
      const result = await Room.deleteOne({ _id: id });
      return result.deletedCount > 0;
    },

    async getSchedules({ roomIds } = {}) {
      const docs = await Schedule.find(roomIds ? { roomId: { $in: roomIds } } : {}).lean();
      return docs.map(toPlain);
    },

    async getScheduleById(id) {
      const doc = await Schedule.findById(id).lean();
      return doc ? toPlain(doc) : null;
    },

    async createSchedule(schedule) {
      const { id, ...fields } = schedule;
      const doc = await Schedule.create({ _id: id, ...fields });
      return toPlain(doc.toObject());
    },

    async updateSchedule(id, fields) {
      const doc = await Schedule.findByIdAndUpdate(id, fields, { new: true }).lean();
      return doc ? toPlain(doc) : null;
    },

    async deleteSchedule(id) {
      const result = await Schedule.deleteOne({ _id: id });
      return result.deletedCount > 0;
    },

    async getReadings({ from, to, buildingId, roomIds } = {}) {
      const query = {};
      if (from || to) {
        query.timestamp = {};
        if (from) {
          query.timestamp.$gte = new Date(from);
        }
        if (to) {
          query.timestamp.$lte = new Date(to);
        }
      }
      if (buildingId) {
        query.buildingId = buildingId;
      }
      if (roomIds) {
        query.roomId = { $in: roomIds };
      }
      const docs = await EnergyReading.find(query, { _id: 0 }).sort({ timestamp: 1 }).lean();
      return docs.map(toReading);
    },

    async getLatestTimestamp() {
      const doc = await EnergyReading.findOne({}, { timestamp: 1 }).sort({ timestamp: -1 }).lean();
      return doc ? new Date(doc.timestamp) : null;
    },

    async insertReadings(items) {
      const roomIds = [...new Set(items.map((item) => item.roomId))];
      const rooms = await Room.find({ _id: { $in: roomIds } }, { buildingId: 1 }).lean();
      const buildingByRoom = new Map(rooms.map((room) => [room._id, room.buildingId]));
      const operations = items.map((item) => ({
        updateOne: {
          filter: { roomId: item.roomId, timestamp: floorToHour(item.timestamp) },
          update: { $inc: { kwh: item.kwh }, $setOnInsert: { buildingId: buildingByRoom.get(item.roomId) } },
          upsert: true,
        },
      }));
      const result = await EnergyReading.bulkWrite(operations, { ordered: false });
      return { inserted: result.upsertedCount, updated: result.modifiedCount, persisted: true };
    },
  };
}
