import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    code: 429,
    message: "OTP request limit exceeded",
  },
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    code: 429,
    message: "Too many login attempts",
  },
});