import mongoose from 'mongoose';
import { ROOM_TYPES } from '../config/constants.js';

const roomSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    buildingId: { type: String, ref: 'Building', required: true, index: true },
    floor: { type: Number, required: true, min: -5, max: 100 },
    type: { type: String, required: true, enum: ROOM_TYPES },
    areaM2: { type: Number, required: true, min: 1 },
    // Idle/standby load of the room in kW (= kWh per hour when nobody is using it).
    baselineKw: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false, bufferCommands: false },
);

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
