import express from "express";
import { markAttendance, getUserAttendance, workerSelfAttendanceView, getAllAttendance, deleteAttendance, updateAttendance, updateDailyRate, updateHourlyRate, getAttendanceByDate, getMonthlyAttendance, calculateSalary } from "../controllers/attendanceController.js";
import { validate } from "../utils/validate.js";
import { markAttendanceSchema } from "../validations/attendanceValidation.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

router.post("/mark", protect, allowRoles("admin"),asyncWrapper(markAttendance));

router.put(
  "/attendance/update/:recordId",
  protect,
  allowRoles("admin"),
  asyncWrapper(updateAttendance)
);

router.delete(
  "/attendance/delete/:recordId",
  protect,
  allowRoles("admin"),
  asyncWrapper(deleteAttendance)
);

router.get(
  "/user/:workerId",
  protect,
  allowRoles("admin"),
  asyncWrapper(getUserAttendance)
);

router.get(
  "/all",
  protect,
  allowRoles("admin"),
  asyncWrapper(getAllAttendance)
);


// Worker Self Attendance View
router.get(
  "/me",
  protect,
  allowRoles("worker"),
  asyncWrapper(workerSelfAttendanceView)
);

router.put("/add_daily_rate",protect,allowRoles("admin"),updateDailyRate);

router.put("/add_hourly_rate",protect,allowRoles("admin"),updateHourlyRate);

// New endpoints
router.get("/by-date", protect, allowRoles("admin"), getAttendanceByDate);
router.get("/monthly-summary", protect, allowRoles("admin"), getMonthlyAttendance);
router.get("/calculate-salary", protect, allowRoles("admin"), calculateSalary);


export default router;