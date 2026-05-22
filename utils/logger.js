// import fs from "fs";

// const logFile = "logs.txt";

// function writeLog(type, args) {
//   const log = `[${new Date().toISOString()}] [${type}] ${args.join(" ")}\n`;
//   fs.appendFileSync(logFile, log);
// }

export function CLOG(...args) {
  console.log("\x1b[32m%s\x1b[0m", "[LOG]", ...args);
  // writeLog("LOG", args);
}

export function CWARNING(...args) {
  console.warn("\x1b[33m%s\x1b[0m", "[WARN]", ...args);
  // writeLog("WARN", args);
}

export function CERROR(...args) {
  console.error("\x1b[31m%s\x1b[0m", "[ERROR]", ...args);
  // writeLog("ERROR", args);
}

// export function CLOG(...args) {
//   console.log("\x1b[32m%s\x1b[0m", "[LOG]", ...args); // green
// }

// export function CWARNING(...args) {
//   console.warn("\x1b[33m%s\x1b[0m", "[WARNING]", ...args); // yellow
// }

// export function CERROR(...args) {
//   console.error("\x1b[31m%s\x1b[0m", "[ERROR]", ...args); // red
// }