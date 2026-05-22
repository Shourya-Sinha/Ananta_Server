// controllers/financeController.js - CLEANED VERSION
import Kharchi from "../models/Kharchi.js";
import User from "../models/User.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import Attendance from "../models/Attendance.js";
import Salary from "../models/Salary.js";

// Helper function to get month date range
function getMonthDateRange(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return { startDate, endDate };
}

// Helper to get current month/year
function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
}

// ============================================
// KHARCHI MANAGEMENT
// ============================================

// Add kharchi with automatic salary recalculation
// export const addKharchi = async (req, res) => {
//     try {
//         const { userId, amount, reason } = req.body;

//         if (req.user.role !== "admin") {
//             throw new AppError({
//                 message: "Only admin can add kharchi",
//                 statusCode: ERROR_CODES.FORBIDDEN,
//                 type: "FORBIDDEN"
//             });
//         }

//         const worker = await User.findById(userId);
//         if (!worker) {
//             throw new AppError({
//                 message: "Worker not found",
//                 statusCode: ERROR_CODES.NOT_FOUND,
//                 type: "WORKER_NOT_FOUND"
//             });
//         }

//         // Create kharchi entry with proper date format
//         const today = new Date().toISOString().split("T")[0];
//         const kharchi = await Kharchi.create({
//             userId,
//             amount,
//             reason: reason || "",
//             date: today
//         });

//         // Recalculate salary for current month
//         const { month, year } = getCurrentMonthYear();
//         await recalculateWorkerSalary(userId, month, year);

//         return SUCCESS(res, "Kharchi added successfully", kharchi);

//     } catch (error) {
//         console.error("Add kharchi error:", error);
//         throw error;
//     }
// };
export const addKharchi = async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;

        if (req.user.role !== "admin") {
            throw new AppError({
                message: "Only admin can add kharchi",
                statusCode: ERROR_CODES.FORBIDDEN,
                type: "FORBIDDEN"
            });
        }

        const worker = await User.findById(userId);
        if (!worker) {
            throw new AppError({
                message: "Worker not found",
                statusCode: ERROR_CODES.NOT_FOUND,
                type: "WORKER_NOT_FOUND"
            });
        }

        // Create kharchi entry with proper date format
        const today = new Date().toISOString().split("T")[0];
        const kharchi = await Kharchi.create({
            userId,
            amount,
            reason: reason || "",
            date: today
        });

        // Recalculate salary for current month (pass admin ID)
        const { month, year } = getCurrentMonthYear();
        await recalculateWorkerSalary(userId, month, year, req.user.id);

        return SUCCESS(res, "Kharchi added successfully", kharchi);

    } catch (error) {
        console.error("Add kharchi error:", error);
        throw error;
    }
};

// Get kharchi history for a worker
export const getWorkerKharchi = async (req, res) => {
    try {
        const { workerId } = req.params;
        
        const kharchiList = await Kharchi.find({ userId: workerId })
            .sort({ date: -1, createdAt: -1 });
        
        return SUCCESS(res, "Kharchi history fetched", kharchiList);
        
    } catch (error) {
        console.error("Get kharchi error:", error);
        throw error;
    }
};

// Get all kharchi (with filters)
export const getAllKharchi = async (req, res) => {
    try {
        const { month, year, siteId } = req.query;
        
        let query = {};
        
        if (month && year) {
            const { startDate, endDate } = getMonthDateRange(year, month);
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        let kharchiList = await Kharchi.find(query)
            .populate("userId", "name phone site")
            .sort({ date: -1, createdAt: -1 });
        
        // Filter by site if needed
        if (siteId) {
            kharchiList = kharchiList.filter(k => k.userId?.siteId?.toString() === siteId);
        }
        
        const totalAmount = kharchiList.reduce((sum, k) => sum + (k.amount || 0), 0);
        
        return SUCCESS(res, "Kharchi list fetched", {
            kharchi: kharchiList,
            totalAmount,
            count: kharchiList.length
        });
        
    } catch (error) {
        console.error("Get all kharchi error:", error);
        throw error;
    }
};

// Worker view their own kharchi
export const workerKharchiList = async (req, res) => {
    try {
        const kharchiList = await Kharchi.find({ userId: req.user.id })
            .sort({ date: -1, createdAt: -1 });
        
        const totalKharchi = kharchiList.reduce((sum, k) => sum + (k.amount || 0), 0);
        
        return SUCCESS(res, "Your kharchi history", {
            kharchi: kharchiList,
            totalKharchi
        });
        
    } catch (error) {
        console.error("Worker kharchi error:", error);
        throw error;
    }
};

// ============================================
// SALARY MANAGEMENT
// ============================================

// Recalculate worker salary (internal function)
// Recalculate worker salary (internal function) - FIXED
async function recalculateWorkerSalary(workerId, month, year, adminId = null) {
    const { startDate, endDate } = getMonthDateRange(year, month);
    
    const worker = await User.findById(workerId);
    if (!worker) return null;
    
    // Get hourly rate (prefer hourlyRate, otherwise calculate from dailyRate)
    const hourlyRate = worker.hourlyRate || (worker.dailyRate / 8) || 0;
    
    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
        workerId,
        date: { $gte: startDate, $lte: endDate }
    });
    
    console.log(`Attendance records for ${worker.name}:`, attendanceRecords.length);
    
    // Calculate totals
    let totalHours = 0;
    let totalSalary = 0;
    let totalPresentDays = 0;
    let totalAbsentDays = 0;
    
    const hourCounts = {
        P: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0,
        P7: 0, P8: 0, P9: 0, P10: 0, P11: 0, P12: 0,
        P13: 0, P14: 0, P15: 0, P16: 0, P17: 0, P18: 0,
        Half_Day: 0, absent: 0
    };
    
    attendanceRecords.forEach(record => {
        const status = record.status;
        const hours = getHoursFromStatus(status);
        
        totalHours += hours;
        
        // Count status
        if (status in hourCounts) {
            hourCounts[status]++;
        }
        
        // Count present/absent
        if (status === "absent") {
            totalAbsentDays++;
        } else {
            totalPresentDays++;
        }
        
        // Calculate salary for this record (hours × hourly rate)
        const recordSalary = hours * hourlyRate;
        totalSalary += recordSalary;
        
        console.log(`  ${status}: ${hours} hours × ₹${hourlyRate} = ₹${recordSalary}`);
    });
    
    // Get kharchi entries for the month
    const kharchiRecords = await Kharchi.find({
        userId: workerId,
        date: { $gte: startDate, $lte: endDate }
    });
    
    const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
    const remainingSalary = totalSalary - totalKharchi;
    
    console.log(`Summary for ${worker.name}:`);
    console.log(`  Total Hours: ${totalHours}`);
    console.log(`  Hourly Rate: ₹${hourlyRate}`);
    console.log(`  Total Salary: ₹${totalSalary}`);
    console.log(`  Total Kharchi: ₹${totalKharchi}`);
    console.log(`  Remaining: ₹${remainingSalary}`);
    
    // Prepare update data
    const updateData = {
        workerId,
        month,
        year,
        totalPresentDays,
        totalAbsentDays,
        ...hourCounts,
        dailyRate: worker.dailyRate || 0,
        hourlyRate: hourlyRate,
        totalHours,
        totalSalary,
        totalKharchi,
        remainingSalary,
        generatedAt: new Date()
    };
    
    // Only add generatedBy if adminId is provided
    if (adminId) {
        updateData.generatedBy = adminId;
    }
    
    // Update or create salary record
    const salary = await Salary.findOneAndUpdate(
        { workerId, month, year },
        updateData,
        { upsert: true, new: true }
    );
    
    return salary;
}
// Calculate salary for a specific worker
export const calculateWorkerSalary = async (req, res) => {
    try {
        const { workerId } = req.params;
        let { month, year } = req.params;
        
        const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
        const targetMonth = month ? parseInt(month) : currentMonth;
        const targetYear = year ? parseInt(year) : currentYear;
        
        // Pass the admin ID from req.user
        const salary = await recalculateWorkerSalary(workerId, targetMonth, targetYear, req.user?.id);
        
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }
        
        const worker = await User.findById(workerId);
        
        return res.json({
            success: true,
            data: salary,
            summary: {
                workerName: worker?.name,
                workerId: worker?._id,
                totalHours: salary.totalHours,
                totalSalary: salary.totalSalary,
                totalKharchi: salary.totalKharchi,
                remainingSalary: salary.remainingSalary
            }
        });
        
    } catch (error) {
        console.error("Salary calculation error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate salary",
            error: error.message
        });
    }
};


// Get all workers salary for current month - FIXED
export const getAllWorkersSalary = async (req, res) => {
    try {
        const { month, year, siteId } = req.query;
        const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
        const targetMonth = month ? parseInt(month) : currentMonth;
        const targetYear = year ? parseInt(year) : currentYear;
        
        const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);
        
        // Build worker query
        let workersQuery = { role: "worker" };
        if (siteId) {
            workersQuery.siteId = siteId;
        }
        
        const workers = await User.find(workersQuery)
            .select("_id name phone site dailyRate hourlyRate siteId totalKharchi");
        
        console.log(`Processing ${workers.length} workers for ${targetMonth}/${targetYear}`);
        
        const salaries = [];
        let summary = {
            totalWorkers: workers.length,
            totalSalary: 0,
            totalKharchi: 0,
            totalRemaining: 0,
            totalHours: 0
        };
        
        for (const worker of workers) {
            // Always recalculate to ensure accuracy (or find existing)
            // Calculate fresh to get correct hours and salary
            const salary = await recalculateWorkerSalary(worker._id, targetMonth, targetYear, null);
            
            if (salary) {
                salaries.push({
                    ...salary.toObject(),
                    workerName: worker.name,
                    workerPhone: worker.phone,
                    workerSite: worker.site,
                    workerDailyRate: worker.dailyRate,
                    workerHourlyRate: worker.hourlyRate
                });
                
                summary.totalSalary += salary.totalSalary || 0;
                summary.totalKharchi += salary.totalKharchi || 0;
                summary.totalRemaining += salary.remainingSalary || 0;
                summary.totalHours += salary.totalHours || 0;
            }
        }
        
        console.log("Summary:", summary);
        
        return res.json({
            success: true,
            data: salaries,
            summary,
            period: {
                month: targetMonth,
                year: targetYear,
                startDate,
                endDate
            }
        });
        
    } catch (error) {
        console.error("Error fetching salaries:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch salaries",
            error: error.message
        });
    }
};



// Get current month salary for a worker - FIXED
export const getCurrentMonthSalary = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { month, year } = getCurrentMonthYear();
        
        // Always recalculate to get latest data
        const salary = await recalculateWorkerSalary(workerId, month, year, null);
        
        if (!salary) {
            return res.json({
                success: true,
                data: null,
                message: "No salary data available"
            });
        }
        
        const worker = await User.findById(workerId).select("name dailyRate hourlyRate");
        
        return res.json({
            success: true,
            data: {
                ...salary.toObject(),
                workerName: worker?.name,
                workerDailyRate: worker?.dailyRate,
                workerHourlyRate: worker?.hourlyRate
            }
        });
        
    } catch (error) {
        console.error("Error fetching current month salary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch salary",
            error: error.message
        });
    }
};

// Get salary history for a worker (admin view)
export const getWorkerSalaryHistory = async (req, res) => {
    try {
        const { workerId } = req.params;
        
        const salaries = await Salary.find({ workerId })
            .sort({ year: -1, month: -1 });
        
        const worker = await User.findById(workerId).select("name phone");
        
        return SUCCESS(res, "Salary history fetched", {
            worker: worker,
            salaries: salaries,
            totalRecords: salaries.length
        });
        
    } catch (error) {
        console.error("Get salary history error:", error);
        throw error;
    }
};

// Worker view their own salary slips
export const workerSalarySlips = async (req, res) => {
    try {
        const salaries = await Salary.find({ workerId: req.user.id })
            .sort({ year: -1, month: -1 });
        
        const summary = {
            totalEarned: salaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0),
            totalKharchi: salaries.reduce((sum, s) => sum + (s.totalKharchi || 0), 0),
            totalReceived: salaries.reduce((sum, s) => sum + (s.remainingSalary || 0), 0)
        };
        
        return SUCCESS(res, "Your salary slips", {
            salaries,
            summary
        });
        
    } catch (error) {
        console.error("Worker salary error:", error);
        throw error;
    }
};

// Generate monthly salary report (admin)
export const generateMonthlySalaryReport = async (req, res) => {
    try {
        const { month, year, siteId } = req.body;
        
        if (req.user.role !== "admin") {
            throw new AppError({
                message: "Only admin can generate salary report",
                statusCode: ERROR_CODES.FORBIDDEN,
                type: "FORBIDDEN"
            });
        }
        
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        
        // Get all workers
        let workersQuery = { role: "worker" };
        if (siteId) workersQuery.siteId = siteId;
        
        const workers = await User.find(workersQuery);
        
        const report = [];
        let totalSalary = 0;
        let totalKharchi = 0;
        let totalRemaining = 0;
        
        for (const worker of workers) {
            const salary = await recalculateWorkerSalary(worker._id, targetMonth, targetYear);
            if (salary) {
                report.push({
                    worker: {
                        id: worker._id,
                        name: worker.name,
                        phone: worker.phone,
                        site: worker.site
                    },
                    salary: salary
                });
                
                totalSalary += salary.totalSalary || 0;
                totalKharchi += salary.totalKharchi || 0;
                totalRemaining += salary.remainingSalary || 0;
            }
        }
        
        return SUCCESS(res, "Monthly salary report generated", {
            period: {
                month: targetMonth,
                year: targetYear
            },
            summary: {
                totalWorkers: workers.length,
                totalSalary,
                totalKharchi,
                totalRemaining
            },
            report
        });
        
    } catch (error) {
        console.error("Generate salary report error:", error);
        throw error;
    }
};

//HELPER
function getHourlyRateFromStatus(status, dailyRate, hourlyRate) {
    // If hourly rate exists, use it
    if (hourlyRate && hourlyRate > 0) return hourlyRate;
    
    // Otherwise calculate from daily rate (8 hours per day)
    if (dailyRate && dailyRate > 0) return dailyRate / 8;
    
    return 0; // Default
}

// Helper function to get hours from status
function getHoursFromStatus(status) {
    if (status === "absent") return 0;
    if (status === "Half_Day") return 4;
    if (status === "P") return 8;
    if (status.startsWith("P")) {
        const hours = parseInt(status.substring(1));
        if (hours >= 1 && hours <= 18) return hours;
    }
    return 0;
}



// import Kharchi from "../models/Kharchi.js";
// import User from "../models/User.js";
// import { SUCCESS } from "../utils/response.js";
// import { AppError } from "../utils/AppError.js";
// import { ERROR_CODES } from "../utils/errorCodes.js";
// import Attendance from "../models/Attendance.js";
// import Salary from "../models/Salary.js";

// function getMonthDateRange(year, month) {
//     const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
//     const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
//     return { startDate, endDate };
// }


// // ------------------------------
// // GENERATE MONTHLY SALARY (ADMIN)
// // ------------------------------
// export const generateMonthlySalary = async (req, res) => {
//   const { workerId, month, year } = req.body;

//   if (req.user.role !== "admin") {
//     throw new AppError({
//       message: "Only admin can generate salary",
//       statusCode: ERROR_CODES.FORBIDDEN,
//       type: "FORBIDDEN"
//     });
//   }

//   const worker = await User.findById(workerId);
//   if (!worker) {
//     throw new AppError({
//       message: "Worker not found",
//       statusCode: ERROR_CODES.NOT_FOUND,
//       type: "WORKER_NOT_FOUND"
//     });
//   }

//   const allAttendance = await Attendance.find({
//     workerId,
//     date: { $regex: `^${year}-${String(month).padStart(2, "0")}` }
//   });

//   if (!allAttendance.length) {
//     throw new AppError({
//       message: "No attendance found for this month",
//       statusCode: ERROR_CODES.NOT_FOUND,
//       type: "NO_ATTENDANCE"
//     });
//   }

//   // --- Count slabs ---
//   const slabCounter = { P: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0 };
//   let totalEarnings = 0;
//   let totalPresentDays = 0;
//   let totalAbsentDays = 0;

//   allAttendance.forEach((att) => {
//     if (att.status === "absent") {
//       totalAbsentDays++;
//     } else {
//       totalPresentDays++;
//       slabCounter[att.status]++;
//       totalEarnings += att.salaryForTheDay;
//     }
//   });

//   // --- Get Kharchi ---
//   const kharchiList = await Kharchi.find({
//     userId: workerId,
//     date: { $regex: `^${year}-${String(month).padStart(2, "0")}` }
//   });

//   const totalKharchi = kharchiList.reduce((s, k) => s + k.amount, 0);

//   const remainingSalary = totalEarnings - totalKharchi;

//   // --- Save Salary Report ---
//   const salarySlip = await Salary.create({
//     workerId,
//     month,
//     year,
//     totalPresentDays,
//     totalAbsentDays,
//     dailyRate: worker.dailyRate,
//     ...slabCounter,
//     totalEarnings,
//     totalKharchi,
//     remainingSalary,
//     generatedBy: req.user.id
//   });

//   return SUCCESS(res, "Salary generated", salarySlip);
// };

// // ADMIN ADD KHARCHI
// export const addKharchi = async (req, res) => {
//   const { userId, amount, reason } = req.body;

//   if (req.user.role !== "admin") {
//     throw new AppError({
//       message: "Only admin can add kharchi",
//       statusCode: ERROR_CODES.FORBIDDEN,
//       type: "FORBIDDEN"
//     });
//   }

//   const worker = await User.findById(userId);
//   if (!worker)
//     throw new AppError({
//       message: "Worker not found",
//       statusCode: ERROR_CODES.NOT_FOUND,
//       type: "WORKER_NOT_FOUND"
//     });

//   const entry = await Kharchi.create({
//     userId,
//     amount,
//     reason,
//     date: new Date().toISOString()
//   });

//   console.log("kharchi added in controller",entry);

//   return SUCCESS(res, "Kharchi added", entry);
// };

// export async function adminKharchi(req, res) {
//   const { userId, amount } = req.body;

//   await Kharchi.create({
//     userId,
//     amount,
//     date: dayjs().format("YYYY-MM-DD"),
//   });

//   const addedKharchi = await User.findByIdAndUpdate(userId, { $inc: { totalKharchi: amount } });

//    return SUCCESS(res, "Admin Kharchi", addedKharchi);
// }

// export const workerSalary = async (req, res) => {
//   const slips = await Salary.find({ workerId: req.user.id }).sort({ year: -1, month: -1 });
//   return SUCCESS(res, "Your salary slips", slips);
// };

// //Admin view
// export const adminWorkerSalary = async (req, res) => {
//   const { workerId } = req.params;

//   const slips = await Salary.find({ workerId }).sort({ year: -1, month: -1 });

//   return SUCCESS(res, "Salary history", slips);
// };

// // ADMIN VIEW WORKER KHARCHI
// export const adminViewWorkerKharchiList = async (req, res) => {
//   const { workerId } = req.params;
//   const list = await Kharchi.find({ userId: workerId }).sort({ date: -1 });
//   return SUCCESS(res, "Worker kharchi", list);
// };


// export async function kharchiHistory(req, res) {
//   const userId = req.params.userId;

//   const list = await Kharchi.find({ userId });
//   return SUCCESS(res, "Kharchi list", list);
// }
// // WORKER VIEW KHARCHI
// export const workerKharchiList = async (req, res) => {
//   const list = await Kharchi.find({ userId: req.user.id }).sort({ date: -1 });
//   return SUCCESS(res, "Kharchi list", list);
// };

// //New 
// // Calculate salary for a specific worker
// export const calculateWorkerSalary = async (req, res) => {
//     try {
//         const { workerId } = req.params;
//         let { month, year } = req.params;
        
//         // Use current month if not specified
//         const now = new Date();
//         const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
//         const targetYear = year ? parseInt(year) : now.getFullYear();
        
//         const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);
        
//         // Get worker details
//         const worker = await User.findById(workerId);
//         if (!worker) {
//             return res.status(404).json({ success: false, message: "Worker not found" });
//         }
        
//         // Get attendance records for the month
//         const attendanceRecords = await Attendance.find({
//             workerId,
//             date: { $gte: startDate, $lte: endDate }
//         });
        
//         // Calculate total worked hours and salary
//         let totalHours = 0;
//         let totalSalary = 0;
//         const hourCounts = {
//             P: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0,
//             P7: 0, P8: 0, P9: 0, P10: 0, P11: 0, P12: 0,
//             P13: 0, P14: 0, P15: 0, P16: 0, P17: 0, P18: 0,
//             Half_Day: 0, absent: 0
//         };
        
//         attendanceRecords.forEach(record => {
//             const hours = record.workedHours || 0;
//             totalHours += hours;
            
//             if (record.status in hourCounts) {
//                 hourCounts[record.status]++;
//             }
            
//             // Calculate salary based on hourly rate
//             totalSalary += (hours * (worker.hourlyRate || 0));
//         });
        
//         // Get kharchi entries for the month - FIXED: using string date range
//         const kharchiRecords = await Kharchi.find({
//             userId: workerId,
//             date: { $gte: startDate, $lte: endDate }
//         });
        
//         console.log(`Kharchi records for ${worker.name} in ${startDate} to ${endDate}:`, kharchiRecords.length);
        
//         const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
//         const remainingSalary = totalSalary - totalKharchi;
        
//         // Create or update salary record
//         const salaryData = {
//             workerId,
//             month: targetMonth,
//             year: targetYear,
//             totalPresentDays: attendanceRecords.filter(r => r.status !== "absent").length,
//             totalAbsentDays: attendanceRecords.filter(r => r.status === "absent").length,
//             ...hourCounts,
//             dailyRate: worker.dailyRate,
//             hourlyRate: worker.hourlyRate,
//             totalHours,
//             totalSalary,
//             totalKharchi,
//             remainingSalary,
//             generatedAt: new Date(),
//             generatedBy: req.user?.id
//         };
        
//         const salary = await Salary.findOneAndUpdate(
//             { workerId, month: targetMonth, year: targetYear },
//             salaryData,
//             { upsert: true, new: true }
//         );
        
//         return res.json({
//             success: true,
//             data: salary,
//             summary: {
//                 workerName: worker.name,
//                 workerId: worker._id,
//                 totalHours,
//                 totalSalary,
//                 totalKharchi,
//                 remainingSalary,
//                 attendanceCount: attendanceRecords.length,
//                 kharchiCount: kharchiRecords.length
//             }
//         });
        
//     } catch (error) {
//         console.error("Salary calculation error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to calculate salary",
//             error: error.message
//         });
//     }
// };


// // Get all workers salary for current month
// export const getAllWorkersSalary = async (req, res) => {
//     try {
//         const { month, year, siteId } = req.query;
//         const now = new Date();
//         const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
//         const targetYear = year ? parseInt(year) : now.getFullYear();
        
//         const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);
        
//         // Get all workers
//         let workersQuery = { role: "worker" };
//         if (siteId) {
//             workersQuery.siteId = siteId;
//         }
        
//         const workers = await User.find(workersQuery).select("_id name phone site dailyRate hourlyRate siteId");
        
//         const salaries = [];
//         let summary = {
//             totalWorkers: workers.length,
//             totalSalary: 0,
//             totalKharchi: 0,
//             totalRemaining: 0,
//             totalHours: 0
//         };
        
//         for (const worker of workers) {
//             // Get attendance
//             const attendanceRecords = await Attendance.find({
//                 workerId: worker._id,
//                 date: { $gte: startDate, $lte: endDate }
//             });
            
//             let totalHours = 0;
//             let totalSalary = 0;
            
//             attendanceRecords.forEach(record => {
//                 const hours = record.workedHours || 0;
//                 totalHours += hours;
//                 totalSalary += (hours * (worker.hourlyRate || 0));
//             });
            
//             // Get kharchi - FIXED: using string date range
//             const kharchiRecords = await Kharchi.find({
//                 userId: worker._id,
//                 date: { $gte: startDate, $lte: endDate }
//             });
            
//             const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
//             const remainingSalary = totalSalary - totalKharchi;
            
//             // Update summary
//             summary.totalSalary += totalSalary;
//             summary.totalKharchi += totalKharchi;
//             summary.totalRemaining += remainingSalary;
//             summary.totalHours += totalHours;
            
//             // Find or create salary record
//             let salary = await Salary.findOne({
//                 workerId: worker._id,
//                 month: targetMonth,
//                 year: targetYear
//             });
            
//             if (!salary) {
//                 salary = new Salary({
//                     workerId: worker._id,
//                     month: targetMonth,
//                     year: targetYear,
//                     dailyRate: worker.dailyRate,
//                     hourlyRate: worker.hourlyRate,
//                     totalHours,
//                     totalSalary,
//                     totalKharchi,
//                     remainingSalary,
//                     generatedAt: new Date()
//                 });
//                 await salary.save();
//             }
            
//             salaries.push({
//                 ...salary.toObject(),
//                 workerName: worker.name,
//                 workerPhone: worker.phone,
//                 workerSite: worker.site
//             });
//         }
        
//         return res.json({
//             success: true,
//             data: salaries,
//             summary,
//             period: {
//                 month: targetMonth,
//                 year: targetYear,
//                 startDate,
//                 endDate
//             }
//         });
        
//     } catch (error) {
//         console.error("Error fetching salaries:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch salaries",
//             error: error.message
//         });
//     }
// };


// export const getCurrentMonthSalary = async (req, res) => {
//     try {
//         const { workerId } = req.params;
//         const now = new Date();
//         const month = now.getMonth() + 1;
//         const year = now.getFullYear();
        
//         const salary = await Salary.findOne({ workerId, month, year });
        
//         if (!salary) {
//             // Calculate on the fly if not exists
//             const calculated = await calculateWorkerSalaryLogic(workerId, month, year);
//             return res.json({ success: true, data: calculated });
//         }
        
//         return res.json({ success: true, data: salary });
        
//     } catch (error) {
//         console.error("Error fetching current month salary:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch salary",
//             error: error.message
//         });
//     }
// };

// // Add kharchi and recalculate salary automatically
// export const addKharchiWithRecalculation = async (req, res) => {
//     try {
//         const { userId, amount, reason } = req.body;
        
//         if (req.user.role !== "admin") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Only admin can add kharchi"
//             });
//         }
        
//         const worker = await User.findById(userId);
//         if (!worker) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Worker not found"
//             });
//         }
        
//         // Create kharchi entry with proper date format
//         const today = new Date().toISOString().split("T")[0];
//         const kharchi = await Kharchi.create({
//             userId,
//             amount,
//             reason,
//             date: today
//         });
        
//         // Recalculate salary for current month
//         const now = new Date();
//         const currentMonth = now.getMonth() + 1;
//         const currentYear = now.getFullYear();
        
//         const { startDate, endDate } = getMonthDateRange(currentYear, currentMonth);
        
//         // Get updated kharchi total
//         const kharchiRecords = await Kharchi.find({
//             userId,
//             date: { $gte: startDate, $lte: endDate }
//         });
        
//         const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
        
//         // Get attendance and calculate salary
//         const attendanceRecords = await Attendance.find({
//             workerId: userId,
//             date: { $gte: startDate, $lte: endDate }
//         });
        
//         let totalHours = 0;
//         let totalSalary = 0;
        
//         attendanceRecords.forEach(record => {
//             const hours = record.workedHours || 0;
//             totalHours += hours;
//             totalSalary += (hours * (worker.hourlyRate || 0));
//         });
        
//         const remainingSalary = totalSalary - totalKharchi;
        
//         // Update salary record
//         await Salary.findOneAndUpdate(
//             { workerId: userId, month: currentMonth, year: currentYear },
//             {
//                 totalKharchi,
//                 remainingSalary,
//                 totalHours,
//                 totalSalary,
//                 generatedAt: new Date()
//             },
//             { upsert: true }
//         );
        
//         return res.json({
//             success: true,
//             message: "Kharchi added and salary recalculated",
//             data: kharchi,
//             salarySummary: {
//                 totalSalary,
//                 totalKharchi,
//                 remainingSalary,
//                 totalHours
//             }
//         });
        
//     } catch (error) {
//         console.error("Error adding kharchi:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to add kharchi",
//             error: error.message
//         });
//     }
// };

// // Helper function to calculate salary logic
// async function calculateWorkerSalaryLogic(workerId, month, year) {
//     const worker = await User.findById(workerId);
//     const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
//     const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
//     const attendanceRecords = await Attendance.find({
//         workerId,
//         date: { $gte: startDate, $lte: endDate }
//     });
    
//     let totalHours = 0;
//     let totalSalary = 0;
    
//     attendanceRecords.forEach(record => {
//         const hours = record.workedHours || 0;
//         totalHours += hours;
//         totalSalary += (hours * (worker.hourlyRate || 0));
//     });
    
//     const kharchiRecords = await Kharchi.find({
//         userId: workerId,
//         date: { $gte: startDate, $lte: endDate }
//     });
    
//     const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
    
//     return {
//         workerId,
//         workerName: worker.name,
//         month,
//         year,
//         totalHours,
//         totalSalary,
//         totalKharchi,
//         remainingSalary: totalSalary - totalKharchi,
//         attendanceCount: attendanceRecords.length
//     };
// }