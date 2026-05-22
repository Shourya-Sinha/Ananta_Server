import mongoose from "mongoose";
import { CERROR, CLOG } from "../utils/logger.js";
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  if (!process.env.MONGO_LOCAL_URI) {
    CERROR("Missing MONGO_LOCAL_URI");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_LOCAL_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      keepAlive: true,
    });

    isConnected = conn.connections[0].readyState === 1;

    CLOG("MongoDB Connected");
  } catch (err) {
    CERROR("MongoDB Connection Error:", err);
  }
}