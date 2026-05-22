// routes/siteFinanceRoutes.js
import express from "express";
import {
  generateSiteFinance,
  updateSiteRevenue,
  updateSiteExpenses,
  getSiteFinance,
  getAllSiteFinances,
  getSiteFinancialSummary,
  updateSiteFinanceStatus,
  getSiteWorkersFinancials
} from "../controllers/siteFinanceController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

// All routes require admin access
router.use(protect, allowRoles("admin"));

// Generate and manage site finances
router.post("/generate", asyncWrapper(generateSiteFinance));
router.get("/all", asyncWrapper(getAllSiteFinances));
router.get("/summary", asyncWrapper(getSiteFinancialSummary));
router.get("/:siteFinanceId", asyncWrapper(getSiteFinance));
router.put("/:siteFinanceId/revenue", asyncWrapper(updateSiteRevenue));
router.put("/:siteFinanceId/expenses", asyncWrapper(updateSiteExpenses));
router.put("/:siteFinanceId/status", asyncWrapper(updateSiteFinanceStatus));

// Site workers financials
router.get("/workers/:siteId/:month/:year", asyncWrapper(getSiteWorkersFinancials));
router.get("/workers/:siteId", asyncWrapper(getSiteWorkersFinancials));

export default router;