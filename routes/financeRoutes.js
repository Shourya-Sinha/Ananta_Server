// routes/financeRoutes.js - CLEANED VERSION
import express from "express";
import {
    addKharchi,
    getWorkerKharchi,
    getAllKharchi,
    workerKharchiList,
    calculateWorkerSalary,
    getAllWorkersSalary,
    getCurrentMonthSalary,
    getWorkerSalaryHistory,
    workerSalarySlips,
    generateMonthlySalaryReport
} from "../controllers/financeController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";
import { adminFinanceStats, getFinanceOverview, getYearlyChartData } from "../controllers/financeAnalyticsController.js";
import { companyProfitLoss, dailyInvestment, dailyKharchi } from "../controllers/investmentController.js";
import { topWorkersAttendance, workerPerformance } from "../controllers/userController.js";

const router = express.Router();

// ============================================
// KHARCHI ROUTES
// ============================================
router.post("/kharchi", protect, allowRoles("admin"), asyncWrapper(addKharchi));
router.get("/kharchi/worker/:workerId", protect, allowRoles("admin"), asyncWrapper(getWorkerKharchi));
router.get("/kharchi/all", protect, allowRoles("admin"), asyncWrapper(getAllKharchi));
router.get("/kharchi/me", protect, allowRoles("worker"), asyncWrapper(workerKharchiList));

// ============================================
// SALARY ROUTES
// ============================================
router.get("/salary/workers", protect, allowRoles("admin"), asyncWrapper(getAllWorkersSalary));
router.get("/salary/worker/:workerId/current", protect, asyncWrapper(getCurrentMonthSalary));
router.get("/salary/worker/:workerId/:month/:year", protect, allowRoles("admin"), asyncWrapper(calculateWorkerSalary));
router.get("/salary/worker/:workerId/history", protect, allowRoles("admin"), asyncWrapper(getWorkerSalaryHistory));
router.get("/salary/me", protect, allowRoles("worker"), asyncWrapper(workerSalarySlips));
router.post("/salary/generate-report", protect, allowRoles("admin"), asyncWrapper(generateMonthlySalaryReport));

// ============================================
// FINANCE ANALYTICS ROUTES
// ============================================
router.get("/finance/stats", protect, allowRoles("admin"), asyncWrapper(adminFinanceStats));
router.get("/finance/daily-kharchi", protect, allowRoles("admin"), asyncWrapper(dailyKharchi));
router.get("/finance/daily-investment", protect, allowRoles("admin"), asyncWrapper(dailyInvestment));
router.get("/finance/company-profit-loss", protect, allowRoles("admin"), asyncWrapper(companyProfitLoss));

router.get("/finance/worker-performance", protect, allowRoles("admin"), asyncWrapper(workerPerformance));
router.get("/finance/top-workers", protect, allowRoles("admin"), asyncWrapper(topWorkersAttendance));


router.get("/overview", protect, allowRoles("admin"), asyncWrapper(getFinanceOverview));
router.get("/yearly-chart", protect, allowRoles("admin"), asyncWrapper(getYearlyChartData));

export default router;


// import express from "express";
// import { addKharchi, addKharchiWithRecalculation, adminKharchi, adminViewWorkerKharchiList, adminWorkerSalary, calculateWorkerSalary, generateMonthlySalary, getAllWorkersSalary, getCurrentMonthSalary, kharchiHistory, workerKharchiList, workerSalary } from "../controllers/financeController.js";
// import { validate } from "../utils/validate.js";
// import { kharchiSchema } from "../validations/financeValidation.js";
// import { protect } from "../middleware/protect.js";
// import { allowRoles } from "../middleware/role.js";
// import { asyncWrapper } from "../utils/asyncWrapper.js";
// import { adminFinanceStats, salaryByWorker } from "../controllers/financeAnalyticsController.js";
// import { companyProfitLoss, dailyInvestment, dailyKharchi, dailySalaryExpense } from "../controllers/investmentController.js";
// import { topWorkersAttendance, workerPerformance } from "../controllers/userController.js";

// const router = express.Router();

// router.post("/add", protect, allowRoles("admin"), validate(kharchiSchema), asyncWrapper(addKharchi));
// router.post("/admin-karchi-add",protect,allowRoles("admin"),asyncWrapper(adminKharchi));
// router.get("/history/:userId", protect, allowRoles("admin"), asyncWrapper(kharchiHistory));

// router.get("/worker-salary-slip/:workerId",allowRoles("admin"),protect,asyncWrapper(generateMonthlySalary));
// router.get("/admin-view-worker-salary/:workerId",protect,allowRoles("admin"),asyncWrapper(adminWorkerSalary));

// router.get("/admin-view-worker-kharchi/:workerId",protect,allowRoles("admin"),asyncWrapper(adminViewWorkerKharchiList));

// // ================================
// // FINANCE ANALYTICS ROUTES
// // ================================
// router.get(
//   "/finance/stats",
//   protect,
//   allowRoles("admin"),
//   adminFinanceStats
// );

// router.get(
//   "/finance/daily-kharchi",
//   protect,
//   allowRoles("admin"),
//   dailyKharchi
// );

// router.get(
//   "/finance/daily-investment",
//   protect,
//   allowRoles("admin"),
//   dailyInvestment
// );

// router.get(
//   "/finance/daily-salary",
//   protect,
//   allowRoles("admin"),
//   dailySalaryExpense
// );

// router.get(
//   "/finance/worker-performance",
//   protect,
//   allowRoles("admin"),
//   workerPerformance
// );

// router.get(
//   "/finance/top-workers",
//   protect,
//   allowRoles("admin"),
//   topWorkersAttendance
// );

// router.get(
//   "/finance/profit-loss",
//   protect,
//   allowRoles("admin"),
//   companyProfitLoss
// );

// router.get(
//   "/salary/user/:userId",
//   protect,
//   allowRoles("admin"),
//   salaryByWorker
// );


// // Worker personal kharchi view
// // router.get(
// //   "/me-kharchi/:workerId",
// //   protect,
// //   allowRoles("worker"),
// //   asyncWrapper(workerKharchi)
// // );

// router.get(
//   "/me-salary",
//   protect,
//   allowRoles("worker"),
//   asyncWrapper(workerSalary)
// );

// router.get(
//   "/me-kharchi-list",
//   protect,
//   allowRoles("worker"),
//   asyncWrapper(workerKharchiList)
// );

// router.get("/workersSalary", protect, getAllWorkersSalary);
// router.get("/currentMonthSalary/:workerId/current", protect, getCurrentMonthSalary);
// router.get("/singleWorkerSalary/:workerId/:month/:year", protect, calculateWorkerSalary);

// router.post("/", protect, addKharchiWithRecalculation);
// router.get("/worker/:workerId", protect, getKharchiByWorker);
// router.get("/getallklharchihistory/:month/:year/:siteId", protect, getAllWorkersSalary);



// export default router;