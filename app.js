import express from 'express';
import cors from 'cors';
import expresSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import index from './routes/index.js'
const app = express();


app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 500,
    message: "Too many requests, try again later.",
    skip: () => process.env.NODE_ENV === "development", // Skip in dev
  })
);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", process.env.TRUSTED_CDN_URL || ''],
            styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'", process.env.API_BASE_URL || '']
        }
    },
    crossOriginEmbedderPolicy: false // Disable for CDN compatibility
}));

app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:7171",
    "http://localhost:8080",
    "https://ananta-server.vercel.app/api/v1",
    "https://ananta-server.vercel.app/",
    "https://ananta-server.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
    ],
}));

app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({extended:true,limit:'10kb'}));

app.use((req, res, next) => {
    if (req.query) res.locals.sanitizedQuery = expresSanitize.sanitize(req.query);
    if (req.body) res.locals.sanitizedBody = expresSanitize.sanitize(req.body);
    next();
});

// app.use(rateLimit(limiter));

// HEALTH CHECK ENDPOINT
// =======================================
app.get("/api/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: statusMap[dbStatus] || "unknown",
    environment: process.env.NODE_ENV,
  });
});

// Initial Router
app.use("/api/v1",index);
const mem = process.memoryUsage();
console.log(`Initial memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

export default app;