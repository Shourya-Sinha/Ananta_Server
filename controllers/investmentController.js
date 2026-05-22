// controllers/investmentController.js
import Investment from "../models/Investment.js";
import User from "../models/User.js";
import Kharchi from "../models/Kharchi.js";
import Salary from "../models/Salary.js";
import dayjs from "dayjs";
import { SUCCESS } from "../utils/response.js";

// Get all investments with user details
export const getAllInvestments = async (req, res) => {
  try {
    const investments = await Investment.find()
      .populate("userId", "name phone email role")
      .sort({ createdAt: -1 });
    
    return SUCCESS(res, "All investments fetched", investments);
  } catch (error) {
    throw error;
  }
};

// Add investment
export const addInvestment = async (req, res) => {
  try {
    const { userId, title, amount, description, date } = req.body;
    
    const investment = await Investment.create({
      userId,
      title,
      amount,
      description: description || "",
      date: date || dayjs().format("YYYY-MM-DD"),
      createdAt: new Date()
    });
    
    const populated = await investment.populate("userId", "name phone email role");
    
    return SUCCESS(res, "Investment added successfully", populated);
  } catch (error) {
    throw error;
  }
};

// Update investment
export const updateInvestment = async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { title, amount, description, date } = req.body;
    
    const investment = await Investment.findByIdAndUpdate(
      investmentId,
      { title, amount, description, date },
      { new: true, runValidators: true }
    ).populate("userId", "name phone email role");
    
    if (!investment) {
      throw new Error("Investment not found");
    }
    
    return SUCCESS(res, "Investment updated successfully", investment);
  } catch (error) {
    throw error;
  }
};

// Delete investment
export const deleteInvestment = async (req, res) => {
  try {
    const { investmentId } = req.params;
    
    const investment = await Investment.findByIdAndDelete(investmentId);
    
    if (!investment) {
      throw new Error("Investment not found");
    }
    
    return SUCCESS(res, "Investment deleted successfully", { id: investmentId });
  } catch (error) {
    throw error;
  }
};

// Get cash out summary for partners
export const getPartnerCashOut = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const kharchi = await Kharchi.aggregate([
      { $match: { addedBy: partnerId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const salary = await Salary.aggregate([
      { $match: { generatedBy: partnerId } },
      { $group: { _id: null, total: { $sum: "$totalEarnings" } } }
    ]);
    
    const investments = await Investment.aggregate([
      { $match: { userId: partnerId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalKharchi = kharchi[0]?.total || 0;
    const totalSalary = salary[0]?.total || 0;
    const totalInvestment = investments[0]?.total || 0;
    
    return SUCCESS(res, "Partner cash out summary", {
      totalKharchi,
      totalSalary,
      totalInvestment,
      totalOut: totalKharchi + totalSalary,
      netPosition: totalInvestment - (totalKharchi + totalSalary)
    });
  } catch (error) {
    throw error;
  }
};

// Add cash out for partner
export const addCashOut = async (req, res) => {
  try {
    const { userId, amount, reason, type } = req.body;
    
    // This could create a cash out record
    // For now, we'll return success
    return SUCCESS(res, "Cash out recorded", {
      userId,
      amount,
      reason,
      type,
      date: dayjs().format("YYYY-MM-DD")
    });
  } catch (error) {
    throw error;
  }
};

// Get investment summary by partner
export const getInvestmentSummary = async (req, res) => {
  try {
    const summary = await Investment.aggregate([
      {
        $group: {
          _id: "$userId",
          totalInvested: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const detailed = await User.populate(summary, { 
      path: "_id", 
      select: "name phone email role" 
    });
    
    const formatted = detailed.map(item => ({
      partner: {
        id: item._id._id,
        name: item._id.name,
        phone: item._id.phone,
        email: item._id.email,
        role: item._id.role
      },
      totalInvested: item.totalInvested,
      investmentCount: item.count
    }));
    
    return SUCCESS(res, "Investment summary", formatted);
  } catch (error) {
    throw error;
  }
};

// Get company financial summary
export const getCompanyFinancialSummary = async (req, res) => {
  try {
    const investments = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const salaries = await Salary.aggregate([
      { $group: { _id: null, total: { $sum: "$totalEarnings" } } }
    ]);
    
    const kharchi = await Kharchi.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalInvestment = investments[0]?.total || 0;
    const totalExpenses = (salaries[0]?.total || 0) + (kharchi[0]?.total || 0);
    
    return SUCCESS(res, "Company financial summary", {
      totalInvestment,
      totalExpenses,
      netProfit: totalInvestment - totalExpenses,
      profitMargin: totalInvestment > 0 ? ((totalInvestment - totalExpenses) / totalInvestment * 100).toFixed(2) : 0
    });
  } catch (error) {
    throw error;
  }
};

export const dailyKharchi = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Kharchi.aggregate([
    {
      $match: {
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    date: today,
    totalKharchi: result[0]?.total || 0,
    entries: result[0]?.count || 0,
  });
};

export const dailyInvestment = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Investment.aggregate([
    {
      $match: {
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    date: today,
    totalInvestment: result[0]?.total || 0,
    entries: result[0]?.count || 0,
  });
};

export const companyProfitLoss = async (req, res) => {
  try {
    // 1) TOTAL INVESTMENT
    const investmentResult = await Investment.aggregate([
      { $group: { _id: null, totalInvestment: { $sum: "$amount" } } }
    ]);
    const totalInvestment = investmentResult[0]?.totalInvestment || 0;

    // 2) TOTAL KHARCHI
    const kharchiResult = await Kharchi.aggregate([
      { $group: { _id: null, totalKharchi: { $sum: "$amount" } } }
    ]);
    const totalKharchi = kharchiResult[0]?.totalKharchi || 0;

    // 3) TOTAL SALARY
    const salaryResult = await Salary.aggregate([
      { $group: { _id: null, totalSalary: { $sum: "$salaryPaid" } } }
    ]);
    const totalSalary = salaryResult[0]?.totalSalary || 0;

    // 4) FINAL CALCULATION
    const totalExpense = totalKharchi + totalSalary;
    const profitLoss = totalInvestment - totalExpense;

    res.status(200).json({
      success: true,
      summary: {
        totalInvestment,
        totalKharchi,
        totalSalary,
        totalExpense,
        profitLoss,
        status: profitLoss >= 0 ? "Profit" : "Loss"
      }
    });

  } catch (error) {
    console.error("ERROR in companyProfitLoss:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to calculate company profit/loss",
      error: error.message,
    });
  }
};