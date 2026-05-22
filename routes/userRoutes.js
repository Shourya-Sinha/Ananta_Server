import express from "express";
import { getWorkers, getProfile, workerStats, assignWorkerToSite, updateWorkerSite, getWorkersBySite, getUnassignedWorkers, removeWorkerFromSite, createPartner, getAllPartners, getWorkerDashboardStats, getWorkerAttendanceHistory, getWorkerKharchiHistory, getWorkerSalaryHistory, updateProfile, updateProfileField, createWorkerByAdmin } from "../controllers/userController.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";

const router = express.Router();

router.get("/profile", protect, asyncWrapper(getProfile));
router.get("/stats", protect, allowRoles("worker"), asyncWrapper(workerStats));
router.get("/workers", protect, allowRoles("admin"), asyncWrapper(getWorkers));

// Assign/Update worker site
router.post("/assign",protect ,assignWorkerToSite);
router.put("/update",protect ,updateWorkerSite);

// Get workers by site
router.get("/site/:siteId/workers",protect, getWorkersBySite);

// Get unassigned workers
router.get("/unassigned-workers",protect,getUnassignedWorkers);

// Remove worker from site
router.delete("/remove/:workerId",protect ,removeWorkerFromSite);

router.post("/create-partner", protect,createPartner);

router.get("/all-partners", protect, allowRoles("admin"), asyncWrapper(getAllPartners));


router.get("/worker/dashboard",protect,allowRoles("worker"), asyncWrapper(getWorkerDashboardStats));
router.get("/worker/attendance",protect,allowRoles("worker"), asyncWrapper(getWorkerAttendanceHistory));
router.get("/worker/kharchi",protect,allowRoles("worker"), asyncWrapper(getWorkerKharchiHistory));
router.get("/worker/salary",protect,allowRoles("worker"), asyncWrapper(getWorkerSalaryHistory));

// Update profile (multiple fields)
router.put("/profile", protect,allowRoles("worker"), asyncWrapper(updateProfile));

// Update single field
router.patch("/profile/field", protect,allowRoles("worker"), asyncWrapper(updateProfileField));

router.post("/create-worker", protect, allowRoles("admin"), asyncWrapper(createWorkerByAdmin));

export default router;