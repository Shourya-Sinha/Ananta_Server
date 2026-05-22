// controllers/databaseController.js
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Kharchi from "../models/Kharchi.js";
import Salary from "../models/Salary.js";
import Site from "../models/Site.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import mongoose from "mongoose";

// ============================================
// DATABASE STATISTICS
// ============================================

// Get counts for all tables
export const getDatabaseStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can access database stats",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }

    const [usersCount, attendanceCount, kharchiCount, salaryCount, sitesCount] = await Promise.all([
      User.countDocuments(),
      Attendance.countDocuments(),
      Kharchi.countDocuments(),
      Salary.countDocuments(),
      Site.countDocuments()
    ]);

    return SUCCESS(res, "Database statistics fetched", {
      users: usersCount,
      attendance: attendanceCount,
      kharchi: kharchiCount,
      salary: salaryCount,
      sites: sitesCount,
      totalRecords: usersCount + attendanceCount + kharchiCount + salaryCount + sitesCount,
      tables: 5
    });
  } catch (error) {
    console.error("Database stats error:", error);
    throw error;
  }
};

// ============================================
// TABLE DATA (Recent Records)
// ============================================

// Get recent users
export const getRecentUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const users = await User.find()
      .select("_id name email phone role site createdAt Designationverify idVerified")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    return SUCCESS(res, "Recent users fetched", users);
  } catch (error) {
    console.error("Recent users error:", error);
    throw error;
  }
};

// Get recent attendance
export const getRecentAttendance = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const attendance = await Attendance.find()
      .populate("workerId", "name phone")
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    const formatted = attendance.map(record => ({
      _id: record._id,
      workerName: record.workerId?.name || "Unknown",
      workerPhone: record.workerId?.phone || "N/A",
      date: record.date,
      status: record.status,
      workedHours: record.workedHours,
      salaryForTheDay: record.salaryForTheDay
    }));
    
    return SUCCESS(res, "Recent attendance fetched", formatted);
  } catch (error) {
    console.error("Recent attendance error:", error);
    throw error;
  }
};

// Get recent kharchi
export const getRecentKharchi = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const kharchi = await Kharchi.find()
      .populate("userId", "name phone")
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    const formatted = kharchi.map(record => ({
      _id: record._id,
      workerName: record.userId?.name || "Unknown",
      amount: record.amount,
      reason: record.reason || "No reason",
      date: record.date
    }));
    
    return SUCCESS(res, "Recent kharchi fetched", formatted);
  } catch (error) {
    console.error("Recent kharchi error:", error);
    throw error;
  }
};

// Get recent salary
export const getRecentSalary = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const salary = await Salary.find()
      .populate("workerId", "name phone")
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit));
    
    const formatted = salary.map(record => ({
      _id: record._id,
      workerName: record.workerId?.name || "Unknown",
      month: record.month,
      year: record.year,
      totalSalary: record.totalSalary,
      totalKharchi: record.totalKharchi,
      remainingSalary: record.remainingSalary,
      generatedAt: record.generatedAt
    }));
    
    return SUCCESS(res, "Recent salary fetched", formatted);
  } catch (error) {
    console.error("Recent salary error:", error);
    throw error;
  }
};

// Get recent sites
export const getRecentSites = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sites = await Site.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const formatted = sites.map(site => ({
      _id: site._id,
      name: site.name,
      address: site.address,
      workerCount: site.workerCount || 0,
      createdBy: site.createdBy?.name || "Unknown",
      createdAt: site.createdAt
    }));
    
    return SUCCESS(res, "Recent sites fetched", formatted);
  } catch (error) {
    console.error("Recent sites error:", error);
    throw error;
  }
};

// ============================================
// TABLE OPERATIONS (CRUD)
// ============================================

// Get all records from a table
export const getAllTableRecords = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = 20, search = "" } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let Model, query = {};
    
    switch(tableName) {
      case "users":
        Model = User;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
          ];
        }
        break;
      case "attendance":
        Model = Attendance;
        if (search) {
          const workers = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
          query.workerId = { $in: workers.map(w => w._id) };
        }
        break;
      case "kharchi":
        Model = Kharchi;
        if (search) {
          const workers = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
          query.userId = { $in: workers.map(w => w._id) };
        }
        break;
      case "salary":
        Model = Salary;
        if (search) {
          const workers = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
          query.workerId = { $in: workers.map(w => w._id) };
        }
        break;
      case "sites":
        Model = Site;
        if (search) {
          query.name = { $regex: search, $options: "i" };
        }
        break;
      default:
        throw new AppError({
          message: "Invalid table name",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_TABLE"
        });
    }
    
    const records = await Model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Model.countDocuments(query);
    
    return SUCCESS(res, `${tableName} records fetched`, {
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get table records error:", error);
    throw error;
  }
};

// Delete a specific record
export const deleteRecord = async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    
    let Model;
    switch(tableName) {
      case "users":
        Model = User;
        break;
      case "attendance":
        Model = Attendance;
        break;
      case "kharchi":
        Model = Kharchi;
        break;
      case "salary":
        Model = Salary;
        break;
      case "sites":
        Model = Site;
        break;
      default:
        throw new AppError({
          message: "Invalid table name",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_TABLE"
        });
    }
    
    const record = await Model.findByIdAndDelete(recordId);
    if (!record) {
      throw new AppError({
        message: "Record not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Record deleted successfully", { id: recordId });
  } catch (error) {
    console.error("Delete record error:", error);
    throw error;
  }
};

// Clear entire table (dangerous - requires confirmation)
export const clearTable = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { confirm } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can clear tables",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    if (!confirm || confirm !== "CONFIRM_DELETE_ALL") {
      throw new AppError({
        message: "Confirmation required. Send 'confirm: CONFIRM_DELETE_ALL'",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "CONFIRMATION_REQUIRED"
      });
    }
    
    let Model, deletedCount;
    switch(tableName) {
      case "users":
        const result = await User.deleteMany({ role: "worker" }); // Don't delete admins
        deletedCount = result.deletedCount;
        break;
      case "attendance":
        const attResult = await Attendance.deleteMany({});
        deletedCount = attResult.deletedCount;
        break;
      case "kharchi":
        const khResult = await Kharchi.deleteMany({});
        deletedCount = khResult.deletedCount;
        break;
      case "salary":
        const salResult = await Salary.deleteMany({});
        deletedCount = salResult.deletedCount;
        break;
      case "sites":
        const siteResult = await Site.deleteMany({});
        deletedCount = siteResult.deletedCount;
        break;
      default:
        throw new AppError({
          message: "Invalid table name",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_TABLE"
        });
    }
    
    return SUCCESS(res, `Cleared ${deletedCount} records from ${tableName}`, {
      deletedCount
    });
  } catch (error) {
    console.error("Clear table error:", error);
    throw error;
  }
};

// ============================================
// DATABASE BACKUP
// ============================================

export const createDatabaseBackup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can create backups",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    // Fetch all data from all collections
    const [users, attendance, kharchi, salary, sites] = await Promise.all([
      User.find().lean(),
      Attendance.find().populate("workerId", "name phone").lean(),
      Kharchi.find().populate("userId", "name phone").lean(),
      Salary.find().populate("workerId", "name phone").lean(),
      Site.find().populate("createdBy", "name").lean()
    ]);
    
    const backup = {
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      tables: {
        users: { count: users.length, data: users },
        attendance: { count: attendance.length, data: attendance },
        kharchi: { count: kharchi.length, data: kharchi },
        salary: { count: salary.length, data: salary },
        sites: { count: sites.length, data: sites }
      },
      summary: {
        totalRecords: users.length + attendance.length + kharchi.length + salary.length + sites.length
      }
    };
    
    // In a real app, you'd save this to a file or cloud storage
    // For now, return the backup data
    return SUCCESS(res, "Database backup created", backup);
  } catch (error) {
    console.error("Backup error:", error);
    throw error;
  }
};

// ============================================
// DATABASE ANALYTICS
// ============================================

export const getDatabaseAnalytics = async (req, res) => {
  try {
    // Get growth data for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const attendanceGrowth = await Attendance.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const kharchiGrowth = await Kharchi.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    return SUCCESS(res, "Database analytics", {
      userGrowth,
      attendanceGrowth,
      kharchiGrowth,
      summary: {
        totalUsers: await User.countDocuments(),
        totalAttendance: await Attendance.countDocuments(),
        totalKharchi: await Kharchi.countDocuments(),
        totalKharchiAmount: await Kharchi.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).then(r => r[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error("Database analytics error:", error);
    throw error;
  }
};

// ============================================
// EXPORT DATA
// ============================================

export const exportTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const { format = "json" } = req.query;
    
    let Model;
    switch(tableName) {
      case "users": Model = User; break;
      case "attendance": Model = Attendance; break;
      case "kharchi": Model = Kharchi; break;
      case "salary": Model = Salary; break;
      case "sites": Model = Site; break;
      default:
        throw new AppError({
          message: "Invalid table name",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_TABLE"
        });
    }
    
    const data = await Model.find().lean();
    
    if (format === "csv") {
      // Convert to CSV format
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(","),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
      ];
      const csv = csvRows.join("\n");
      
      return res.setHeader("Content-Type", "text/csv").send(csv);
    }
    
    // Default JSON format
    return SUCCESS(res, `${tableName} data exported`, data);
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};