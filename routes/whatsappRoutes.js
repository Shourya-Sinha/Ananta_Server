import express from "express";
import { sendWhatsApp } from "../controllers/whatsappController.js";
import { validate } from "../utils/validate.js";
import { whatsappSchema } from "../validations/whatsappValidation.js";
import { protect } from "../middleware/protect.js";
import { asyncWrapper } from "../middleware/asyncWrapper.js";

const router = express.Router();

router.post("/", protect, validate(whatsappSchema), asyncWrapper(sendWhatsApp));

export default router;