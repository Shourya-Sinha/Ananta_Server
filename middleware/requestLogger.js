import fs from "fs";
import path from "path";

export function requestLogger(req, res, next) {
  const log = `[${new Date().toISOString()}] ${req.method} ${
    req.originalUrl
  } | Body: ${JSON.stringify(req.body)}\n`;

  fs.appendFileSync(path.join("logs", "requests.log"), log);

  next();
}