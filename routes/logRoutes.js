import express from "express";
import { readLogs } from "../controllers/logController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../middleware/asyncWrapper.js";

const router = express.Router();

router.get("/", protect, allowRoles("admin"), asyncWrapper(readLogs));

export default router;