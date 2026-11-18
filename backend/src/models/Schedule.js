import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    roomId: { type: String, ref: 'Room', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday (JS convention)
    startHour: { type: Number, required: true, min: 0, max: 23 },
    endHour: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      validate: {
        validator(value) {
          return value > this.startHour;
        },
        message: 'endHour must be greater than startHour',
      },
    },
    courseName: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true, versionKey: false, bufferCommands: false },
);

scheduleSchema.index({ roomId: 1, dayOfWeek: 1, startHour: 1 });

export const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
