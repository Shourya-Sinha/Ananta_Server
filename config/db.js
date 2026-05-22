// import mongoose from "mongoose";
// import { CERROR, CLOG } from "../utils/logger.js";

// export default async function connectDB() {
//   try {
//     await mongoose.connect(process.env.MONGO_LOCAL_URI);

//     CLOG("MongoDB Connected");

//     // IMPORTANT: return an object
//     return { isConnected: true };
//   } catch (err) {
//      CERROR("DB Error:", err);

//     return { isConnected: false };
//   }
// }
import mongoose from "mongoose";
import { CERROR, CLOG } from "../utils/logger.JS";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGO_URI) {
    CERROR("❌ Missing MONGO_URI");
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

    CLOG("✅ MongoDB Connected");
    return { isConnected: true };
  } catch (err) {
    CERROR("❌ MongoDB Connection Error:", err);
  }
}