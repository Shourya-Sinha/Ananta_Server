import mongoose from "mongoose";
import { CERROR, CLOG } from "../utils/logger.js";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    CERROR("Missing MONGO_URI");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
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