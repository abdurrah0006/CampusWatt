import mongoose from 'mongoose';

// String _id values (e.g. "bld-eng") keep IDs identical between MongoDB and JSON fallback mode.
const buildingSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 10 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    floors: { type: Number, required: true, min: 1, max: 100 },
    thresholdKwhPerHour: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false, bufferCommands: false },
);

export const Building = mongoose.models.Building || mongoose.model('Building', buildingSchema);
