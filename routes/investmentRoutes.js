// routes/investmentRoutes.js
import express from "express";
import {
  getAllInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  getPartnerCashOut,
  addCashOut,
  getInvestmentSummary,
  getCompanyFinancialSummary
} from "../controllers/investmentController.js";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

// All routes require admin access
router.use(protect, allowRoles("admin"));

// Investment CRUD
router.get("/all-investment", asyncWrapper(getAllInvestments));
router.post("/add-investment", asyncWrapper(addInvestment));
router.put("/update-invest/:investmentId", asyncWrapper(updateInvestment));
router.delete("/delete-invest/:investmentId", asyncWrapper(deleteInvestment));

// Partner cash out
router.get("/partner-cashout/:partnerId", asyncWrapper(getPartnerCashOut));
router.post("/cashout", asyncWrapper(addCashOut));

// Summaries
router.get("/summary/partners", asyncWrapper(getInvestmentSummary));
router.get("/summary/company", asyncWrapper(getCompanyFinancialSummary));

export default router;