// routes/verificationRoutes.js
import express from "express";
import {
  getAccountVerificationStatus,
  adminVerifyAccount,
  getDesignationVerificationStatus,
  updateDesignationVerification,
  getIdVerificationStatus,
  updateIdVerification,
  getCompleteVerificationStatus,
  getDesignationOptions,
  getWorkerDesignation,
  updateWorkerDesignation
} from "../controllers/verificationController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

// Account verification
router.get("/account/:workerId", protect, allowRoles("admin"), asyncWrapper(getAccountVerificationStatus));
router.post("/account/:workerId/verify", protect, allowRoles("admin"), asyncWrapper(adminVerifyAccount));

// Designation verification
router.get("/designation/:workerId", protect, allowRoles("admin"), asyncWrapper(getDesignationVerificationStatus));
router.put("/designation/:workerId", protect, allowRoles("admin"), asyncWrapper(updateDesignationVerification));

// ID verification
router.get("/id/:workerId", protect, allowRoles("admin"), asyncWrapper(getIdVerificationStatus));
router.put("/id/:workerId", protect, allowRoles("admin"), asyncWrapper(updateIdVerification));

// Complete status
router.get("/complete/:workerId", protect, allowRoles("admin"), asyncWrapper(getCompleteVerificationStatus));

router.get("/designation-options", protect, allowRoles("admin"), asyncWrapper(getDesignationOptions));
router.get("/get-designation/:workerId", protect, allowRoles("admin"), asyncWrapper(getWorkerDesignation));
router.put("/update-designation/:workerId", protect, allowRoles("admin"), asyncWrapper(updateWorkerDesignation));
router.put("/designation/verify/:workerId", protect, allowRoles("admin"), asyncWrapper(updateDesignationVerification));

export default router;