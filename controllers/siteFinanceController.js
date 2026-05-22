// controllers/siteFinanceController.js
import SiteFinance from "../models/SiteFinance.js";
import Site from "../models/Site.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Kharchi from "../models/Kharchi.js";
import Salary from "../models/Salary.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import dayjs from "dayjs";

// ============================================
// CALCULATE SITE FINANCIALS
// ============================================

// Calculate site expenses for a given month
async function calculateSiteExpenses(siteId, month, year) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  
  // Get workers in this site
  const workers = await User.find({ siteId, role: "worker" });
  const workerIds = workers.map(w => w._id);
  
  // Calculate salaries
  const salaries = await Salary.find({
    workerId: { $in: workerIds },
    month,
    year
  });
  
  const totalSalaries = salaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0);
  
  // Calculate kharchi
  const kharchiRecords = await Kharchi.find({
    userId: { $in: workerIds },
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
  
  return {
    workerSalaries: totalSalaries,
    kharchi: totalKharchi,
    totalExpenses: totalSalaries + totalKharchi
  };
}

// Generate site financial report
export const generateSiteFinance = async (req, res) => {
  try {
    const { siteId, month, year } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can generate site finance",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    const site = await Site.findById(siteId);
    if (!site) {
      throw new AppError({
        message: "Site not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    const targetMonth = month || dayjs().month() + 1;
    const targetYear = year || dayjs().year();
    
    // Calculate expenses
    const expenses = await calculateSiteExpenses(siteId, targetMonth, targetYear);
    
    // Create or update site finance record
    const siteFinance = await SiteFinance.findOneAndUpdate(
      { siteId, month: targetMonth, year: targetYear },
      {
        siteId,
        month: targetMonth,
        year: targetYear,
        expenses: {
          workerSalaries: expenses.workerSalaries,
          kharchi: expenses.kharchi,
          materialCost: 0,
          transportCost: 0,
          otherExpenses: 0
        },
        totalExpenses: expenses.totalExpenses,
        netProfit: 0, // Will be updated when revenue is added
        updatedBy: req.user.id
      },
      { upsert: true, new: true }
    );
    
    return SUCCESS(res, "Site finance generated", siteFinance);
  } catch (error) {
    console.error("Generate site finance error:", error);
    throw error;
  }
};

// Update site revenue/money release
export const updateSiteRevenue = async (req, res) => {
  try {
    const { siteFinanceId } = req.params;
    const { revenue, moneyReleased, notes } = req.body;
    
    const siteFinance = await SiteFinance.findById(siteFinanceId);
    if (!siteFinance) {
      throw new AppError({
        message: "Site finance record not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    if (revenue !== undefined) {
      siteFinance.revenue = revenue;
    }
    
    if (moneyReleased) {
      siteFinance.moneyReleased = {
        amount: moneyReleased.amount,
        date: moneyReleased.date || new Date(),
        paymentMode: moneyReleased.paymentMode || "bank",
        transactionId: moneyReleased.transactionId || ""
      };
    }
    
    if (notes) siteFinance.notes = notes;
    
    // Recalculate net profit
    siteFinance.netProfit = siteFinance.revenue - siteFinance.totalExpenses;
    siteFinance.updatedBy = req.user.id;
    
    await siteFinance.save();
    
    return SUCCESS(res, "Site revenue updated", siteFinance);
  } catch (error) {
    console.error("Update site revenue error:", error);
    throw error;
  }
};

// Update site expenses
export const updateSiteExpenses = async (req, res) => {
  try {
    const { siteFinanceId } = req.params;
    const { materialCost, transportCost, otherExpenses } = req.body;
    
    const siteFinance = await SiteFinance.findById(siteFinanceId);
    if (!siteFinance) {
      throw new AppError({
        message: "Site finance record not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    if (materialCost !== undefined) siteFinance.expenses.materialCost = materialCost;
    if (transportCost !== undefined) siteFinance.expenses.transportCost = transportCost;
    if (otherExpenses !== undefined) siteFinance.expenses.otherExpenses = otherExpenses;
    
    // Recalculate total expenses
    siteFinance.totalExpenses = 
      siteFinance.expenses.workerSalaries +
      siteFinance.expenses.kharchi +
      siteFinance.expenses.materialCost +
      siteFinance.expenses.transportCost +
      siteFinance.expenses.otherExpenses;
    
    // Recalculate net profit
    siteFinance.netProfit = siteFinance.revenue - siteFinance.totalExpenses;
    siteFinance.updatedBy = req.user.id;
    
    await siteFinance.save();
    
    return SUCCESS(res, "Site expenses updated", siteFinance);
  } catch (error) {
    console.error("Update site expenses error:", error);
    throw error;
  }
};

// Get site finance by ID
export const getSiteFinance = async (req, res) => {
  try {
    const { siteFinanceId } = req.params;
    
    const siteFinance = await SiteFinance.findById(siteFinanceId)
      .populate("siteId", "name address")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");
    
    if (!siteFinance) {
      throw new AppError({
        message: "Site finance record not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Site finance fetched", siteFinance);
  } catch (error) {
    console.error("Get site finance error:", error);
    throw error;
  }
};

// Get all site finances with filters
export const getAllSiteFinances = async (req, res) => {
  try {
    const { siteId, month, year, status } = req.query;
    
    let filter = {};
    if (siteId) filter.siteId = siteId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    
    const finances = await SiteFinance.find(filter)
      .populate("siteId", "name address workerCount")
      .populate("createdBy", "name")
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    // Calculate summary
    const summary = {
      totalRevenue: finances.reduce((sum, f) => sum + (f.revenue || 0), 0),
      totalExpenses: finances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0),
      totalProfit: finances.reduce((sum, f) => sum + (f.netProfit || 0), 0),
      totalMoneyReleased: finances.reduce((sum, f) => sum + (f.moneyReleased?.amount || 0), 0)
    };
    
    return SUCCESS(res, "Site finances fetched", {
      finances,
      summary
    });
  } catch (error) {
    console.error("Get all site finances error:", error);
    throw error;
  }
};

// Get site financial summary for dashboard
export const getSiteFinancialSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || dayjs().year();
    
    // Get all sites
    const sites = await Site.find().select("_id name address");
    
    const monthlySummary = [];
    for (let month = 1; month <= 12; month++) {
      const finances = await SiteFinance.find({
        month,
        year: targetYear
      }).populate("siteId", "name");
      
      const monthlyRevenue = finances.reduce((sum, f) => sum + (f.revenue || 0), 0);
      const monthlyExpenses = finances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      
      monthlySummary.push({
        month,
        monthName: dayjs().month(month - 1).format("MMM"),
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyProfit,
        sitesCount: finances.length
      });
    }
    
    // Get overall summary
    const allFinances = await SiteFinance.find({ year: targetYear });
    const totalRevenue = allFinances.reduce((sum, f) => sum + (f.revenue || 0), 0);
    const totalExpenses = allFinances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    
    // Best performing site
    const sitePerformance = await SiteFinance.aggregate([
      { $match: { year: targetYear } },
      {
        $group: {
          _id: "$siteId",
          totalRevenue: { $sum: "$revenue" },
          totalExpenses: { $sum: "$totalExpenses" },
          totalProfit: { $sum: "$netProfit" }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 }
    ]);
    
    const populatedSitePerformance = await Site.populate(sitePerformance, {
      path: "_id",
      select: "name address"
    });
    
    return SUCCESS(res, "Site financial summary", {
      year: targetYear,
      overall: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      monthlySummary,
      topSites: populatedSitePerformance.map(s => ({
        site: s._id,
        totalRevenue: s.totalRevenue,
        totalExpenses: s.totalExpenses,
        totalProfit: s.totalProfit
      }))
    });
  } catch (error) {
    console.error("Site financial summary error:", error);
    throw error;
  }
};

// Update site finance status
export const updateSiteFinanceStatus = async (req, res) => {
  try {
    const { siteFinanceId } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ["pending", "processing", "completed", "audited"];
    if (!validStatuses.includes(status)) {
      throw new AppError({
        message: "Invalid status",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_STATUS"
      });
    }
    
    const siteFinance = await SiteFinance.findByIdAndUpdate(
      siteFinanceId,
      { status, notes, updatedBy: req.user.id },
      { new: true }
    );
    
    if (!siteFinance) {
      throw new AppError({
        message: "Site finance record not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Site finance status updated", siteFinance);
  } catch (error) {
    console.error("Update site finance status error:", error);
    throw error;
  }
};

// Get site workers and their salary details
export const getSiteWorkersFinancials = async (req, res) => {
  try {
    const { siteId, month, year } = req.params;
    
    const targetMonth = month || dayjs().month() + 1;
    const targetYear = year || dayjs().year();
    
    // Get workers in this site
    const workers = await User.find({ siteId, role: "worker" })
      .select("name phone dailyRate hourlyRate");
    
    // Get salaries for these workers
    const salaries = await Salary.find({
      workerId: { $in: workers.map(w => w._id) },
      month: targetMonth,
      year: targetYear
    }).populate("workerId", "name phone");
    
    // Get kharchi for these workers
    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`;
    
    const kharchiRecords = await Kharchi.find({
      userId: { $in: workers.map(w => w._id) },
      date: { $gte: startDate, $lte: endDate }
    }).populate("userId", "name phone");
    
    const workerSummary = workers.map(worker => {
      const salary = salaries.find(s => s.workerId?._id?.toString() === worker._id.toString());
      const kharchi = kharchiRecords.filter(k => k.userId?._id?.toString() === worker._id.toString());
      const totalKharchi = kharchi.reduce((sum, k) => sum + (k.amount || 0), 0);
      
      return {
        worker: {
          id: worker._id,
          name: worker.name,
          phone: worker.phone,
          dailyRate: worker.dailyRate,
          hourlyRate: worker.hourlyRate
        },
        salary: salary ? {
          totalSalary: salary.totalSalary,
          totalHours: salary.totalHours,
          totalPresentDays: salary.totalPresentDays
        } : null,
        kharchi: {
          total: totalKharchi,
          records: kharchi
        },
        netEarning: (salary?.totalSalary || 0) - totalKharchi
      };
    });
    
    const siteTotal = {
      totalSalary: workerSummary.reduce((sum, w) => sum + (w.salary?.totalSalary || 0), 0),
      totalKharchi: workerSummary.reduce((sum, w) => sum + w.kharchi.total, 0),
      netTotal: workerSummary.reduce((sum, w) => sum + w.netEarning, 0)
    };
    
    return SUCCESS(res, "Site workers financials fetched", {
      period: { month: targetMonth, year: targetYear },
      workers: workerSummary,
      siteTotal
    });
  } catch (error) {
    console.error("Get site workers financials error:", error);
    throw error;
  }
};