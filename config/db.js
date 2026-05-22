// import mongoose from "mongoose";
// import { CERROR, CLOG } from "../utils/logger.js";
// import dotenv from 'dotenv';

// dotenv.config();

// let isConnected = false;

// export async function connectDB() {
//   if (isConnected) return;

//   if (!process.env.MONGO_LOCAL_URI) {
//     CERROR("Missing MONGO_LOCAL_URI");
//     return;
//   }

//   try {
//     const conn = await mongoose.connect(process.env.MONGO_LOCAL_URI, {
//       bufferCommands: false,
//       serverSelectionTimeoutMS: 8000,
//       socketTimeoutMS: 45000,
//       maxPoolSize: 5,
//       keepAlive: true,
//     });

//     isConnected = conn.connections[0].readyState === 1;

//     CLOG("MongoDB Connected");
//   } catch (err) {
//     CERROR("MongoDB Connection Error:", err);
//   }
// }

// config/db.js - Optimized for Vercel
import mongoose from "mongoose";
import { CERROR, CLOG } from "../utils/logger.js";

let isConnected = false;
let connectionPromise = null;

export async function connectDB() {
  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Prevent multiple connection attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGO_LOCAL_URI) {
    CERROR("Missing MONGO_LOCAL_URI");
    throw new Error("MONGO_LOCAL_URI is not defined");
  }

  // Vercel-specific: Use cached connection
  if (process.env.VERCEL) {
    if (global.mongoose) {
      isConnected = global.mongoose.readyState === 1;
      if (isConnected) {
        return global.mongoose;
      }
    }
  }

  const options = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 15000, // Increased timeout
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    // keepAlive: true,
    family: 4, // Use IPv4
    retryWrites: true,
    retryReads: true,
    connectTimeoutMS: 30000,
  };

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_LOCAL_URI, options);
    const conn = await connectionPromise;
    
    isConnected = conn.connections[0].readyState === 1;
    
    // Cache for Vercel
    if (process.env.VERCEL) {
      global.mongoose = conn;
    }
    
    CLOG("MongoDB Connected Successfully");
    return conn;
  } catch (err) {
    CERROR("MongoDB Connection Error:", err);
    connectionPromise = null;
    throw err;
  } finally {
    connectionPromise = null;
  }
}

// Helper to check connection status
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection?.host,
    name: mongoose.connection?.name,
  };
}