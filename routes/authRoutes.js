import express from "express";
import { login, register, forgotPassword, resetPassword, sendOtp, verifyOtp, refreshToken } from "../controllers/authController.js";
import { validate } from "../utils/validate.js";
import { loginSchema, registerSchema, forgotSchema, resetSchema, senOTPSchema, verifyOTPSchema } from "../validations/authValidation.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";
import { loginLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", validate(registerSchema), asyncWrapper(register));
router.post("/login", loginLimiter, validate(loginSchema), asyncWrapper(login));
router.post("/forgot-password", validate(forgotSchema), asyncWrapper(forgotPassword));
router.post("/reset-password", validate(resetSchema), asyncWrapper(resetPassword));
router.post("/send-otp", validate(senOTPSchema), asyncWrapper(sendOtp));
router.post("/verify-otp", validate(verifyOTPSchema), asyncWrapper(verifyOtp));
router.post("/refresh", asyncWrapper(refreshToken));

export default router;