import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let listenersAttached = false;
let everConnected = false;

/**
 * Connects to MongoDB with a short timeout so the server never hangs at startup.
 * Commands are not buffered: if the connection drops, queries fail fast and the
 * data store switches to the JSON fallback instead of freezing the demo.
 */
export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  if (!listenersAttached) {
    mongoose.connection.on('disconnected', () => everConnected && logger.warn('MongoDB disconnected. Serving JSON fallback data until it reconnects.'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected.'));
    mongoose.connection.on('error', (err) => everConnected && logger.warn(`MongoDB error: ${err.message}`));
    listenersAttached = true;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: env.mongoTimeoutMs });
  everConnected = true;
  return mongoose.connection;
}

export const isMongoConnected = () => mongoose.connection.readyState === 1;

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
