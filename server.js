// =======================================
// SERVER.JS — Clean, Optimized, Production-Ready
// =======================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import router from "./routes/index.js";

import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import { CLOG, CERROR } from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6001;


// =======================================
// GLOBAL MIDDLEWARES
// =======================================

// Security
app.use(helmet());

// Enable CORS
app.use(cors({ origin: "*", credentials: true }));

// Body parser
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// GZIP Compression
app.use(compression());

// API Rate Limiter (Security)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 500,
    message: "Too many requests, try again later.",
  })
);

// Log every request
app.use(requestLogger);


// =======================================
// ROUTES
// =======================================
app.use("/api/v1", router);


// =======================================
// GLOBAL ERROR HANDLER
// =======================================
app.use(errorHandler);


// =======================================
// SERVER BOOTSTRAP
// =======================================

let server;

const startServer = async () => {
  try {
    await connectDB();

    // if (!isConnected) {
    //   CERROR("❌ Database connection failed");
    //   process.exit(1);
    // }

    CLOG("✅ Database Connected");

    server = app.listen(PORT, "0.0.0.0", () => {
      CLOG(`
────────────────────────────────────
🚀 Server Running: http://localhost:${PORT}
📅 Launched: ${new Date().toLocaleString()}
🔐 Secure Middlewares Active
📊 Memory Monitoring Active
────────────────────────────────────
`);
    });

    server.on("error", (err) => {
      CERROR("💥 SERVER ERROR:", err);
      process.exit(1);
    });
  } catch (error) {
    CERROR("🔥 STARTUP ERROR:", error);
    process.exit(1);
  }
};

startServer();


// =======================================
// MEMORY MONITORING + CLEANUP
// =======================================
let maxMemory = 0;

setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const MB = Math.round(used);
  maxMemory = Math.max(maxMemory, MB);

  if (MB > (process.env.MEMORY_WARNING_THRESHOLD || 450)) {
    CERROR("⚠️ HIGH MEMORY USAGE:", MB, "MB (Max:", maxMemory, "MB)");

    if (global.gc) {
      global.gc();
      CLOG("♻ Garbage Collector executed");
    }
  }
}, 20000);


// =======================================
// GRACEFUL SHUTDOWN
// =======================================
const shutdown = async (type) => {
  CERROR(`🔻 ${type} RECEIVED — Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      CLOG("💤 Database disconnected");
      process.exit(0);
    });
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


// =======================================
// CRASH CATCHERS
// =======================================
process.on("uncaughtException", (err) => {
  CERROR("💣 UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  CERROR("❌ UNHANDLED PROMISE REJECTION:", err);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});