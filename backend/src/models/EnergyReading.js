import mongoose from 'mongoose';

// One document = kWh consumed by one room during one clock hour (timestamp = start of that hour, UTC).
const energyReadingSchema = new mongoose.Schema(
  {
    roomId: { type: String, ref: 'Room', required: true },
    buildingId: { type: String, ref: 'Building', required: true },
    timestamp: { type: Date, required: true },
    kwh: { type: Number, required: true, min: 0 },
  },
  { versionKey: false, bufferCommands: false },
);

energyReadingSchema.index({ buildingId: 1, timestamp: 1 });
energyReadingSchema.index({ roomId: 1, timestamp: 1 }, { unique: true });
energyReadingSchema.index({ timestamp: -1 });

export const EnergyReading = mongoose.models.EnergyReading || mongoose.model('EnergyReading', energyReadingSchema);
