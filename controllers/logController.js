import fs from "fs";
import path from "path";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";

export const readLogs = async (req, res) => {
  const file = req.query.file || "logs.txt";

  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    throw new AppError({
      message: "Log file not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "LOG_FILE_NOT_FOUND",
    });
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return SUCCESS(res, "Log data fetched", content);
};