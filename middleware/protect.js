import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token)
    throw new AppError({
      message: "Not authorized",
      statusCode: ERROR_CODES.UNAUTHORIZED,
      type: "NO_TOKEN",
    });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;

  const user = await User.findById(decoded.id);
  if (!user)
    throw new AppError({
      message: "User not found",
      statusCode: 404,
      type: "USER_NOT_FOUND",
    });

  next();
};