import express from "express";
import multer from "multer";
import { aadhaarOCR } from "../controllers/ocrController.js";
import { protect } from "../middleware/protect.js";
import { asyncWrapper } from "../middleware/asyncWrapper.js";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/", protect, upload.single("file"), asyncWrapper(aadhaarOCR));

export default router;