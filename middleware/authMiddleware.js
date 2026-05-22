import jwt from "jsonwebtoken";
import User from "../models/User.js";


// -----------------------------------------
// AUTH MIDDLEWARE: VERIFY ACCESS TOKEN
// -----------------------------------------
export async function protect(req, res, next) {
  try {
    let token = req.headers.authorization;

    // Handle "Bearer <token>" format
    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    // No token provided
    if (!token) {
      throw new AppError({
        message: "Access denied. No token provided.",
        statusCode: ERROR_CODES.UNAUTHORIZED,
        type: "TOKEN_MISSING",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      CERROR("TOKEN VERIFICATION FAILED", err);
      throw new AppError({
        message: "Invalid or expired token",
        statusCode: ERROR_CODES.UNAUTHORIZED,
        type: "TOKEN_INVALID",
      });
    }

    // Fetch full user
    const user = await User.findById(decoded.id).select("-password -refreshToken");

    if (!user) {
      throw new AppError({
        message: "User not found or removed",
        statusCode: ERROR_CODES.UNAUTHORIZED,
        type: "USER_NOT_FOUND",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------
// ROLE-BASED ACCESS CONTROL
// ------------------------------
export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    try {
      // No user found in token
      if (!req.user) {
        CERROR("ACCESS DENIED: No user in request");
        throw new AppError({
          message: "Authentication required",
          statusCode: ERROR_CODES.UNAUTHORIZED,
          type: "AUTH_REQUIRED",
        });
      }

      // User does not have required role
      if (!allowedRoles.includes(req.user.role)) {
        CERROR("ACCESS DENIED: Wrong role", {
          role: req.user.role,
          required: allowedRoles,
        });

        throw new AppError({
          message: "You do not have permission for this action",
          statusCode: ERROR_CODES.FORBIDDEN,
          type: "FORBIDDEN_ACCESS",
        });
      }

      next();
    } catch (error) {
      next(error); // Global error handler will handle it properly
    }
  };
}