// routes/databaseRoutes.js
import express from "express";
import {
  getDatabaseStats,
  getRecentUsers,
  getRecentAttendance,
  getRecentKharchi,
  getRecentSalary,
  getRecentSites,
  getAllTableRecords,
  deleteRecord,
  clearTable,
  createDatabaseBackup,
  getDatabaseAnalytics,
  exportTableData
} from "../controllers/databaseController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

// All routes require admin access
router.use(protect, allowRoles("admin"));

// ============================================
// STATISTICS & ANALYTICS
// ============================================
router.get("/stats", asyncWrapper(getDatabaseStats));
router.get("/analytics", asyncWrapper(getDatabaseAnalytics));
router.post("/backup", asyncWrapper(createDatabaseBackup));

// ============================================
// RECENT RECORDS (for dashboard cards)
// ============================================
router.get("/recent/users", asyncWrapper(getRecentUsers));
router.get("/recent/attendance", asyncWrapper(getRecentAttendance));
router.get("/recent/kharchi", asyncWrapper(getRecentKharchi));
router.get("/recent/salary", asyncWrapper(getRecentSalary));
router.get("/recent/sites", asyncWrapper(getRecentSites));

// ============================================
// TABLE OPERATIONS (CRUD)
// ============================================
router.get("/table/:tableName", asyncWrapper(getAllTableRecords));
router.delete("/table/:tableName/record/:recordId", asyncWrapper(deleteRecord));
router.delete("/table/:tableName/clear", asyncWrapper(clearTable));
router.get("/table/:tableName/export", asyncWrapper(exportTableData));

export default router;