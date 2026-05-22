import mongoose from "mongoose";
import { CERROR, CLOG } from "../utils/logger.js";

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_LOCAL_URI);

    CLOG("MongoDB Connected");

    // IMPORTANT: return an object
    return { isConnected: true };
  } catch (err) {
     CERROR("DB Error:", err);

    return { isConnected: false };
  }
}