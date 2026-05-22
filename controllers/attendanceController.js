import Attendance from "../models/Attendance.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import User from "../models/User.js";

// Hours for each attendance code
// export const HOURS_MAP = {
//   absent: 0,
//   P: 8,
//   P1: 9,
//   P2: 10,
//   P3: 11,
//   P4: 12,
//   P5: 13,
//   P6: 14,
// };
// export const HOURS_MAP = {
//   absent: 0,
//   Half_Day: 4,
//   P: 8
// }; 

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

// Helper: Validate date format
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Hours mapping for attendance
export const HOURS_MAP = {
  absent: 0,
  Half_Day: 4,
  P: 8
};

// Generate P1-P18 mapping dynamically
for (let i = 1; i <= 18; i++) {
  HOURS_MAP[`P${i}`] = i;
}

// -----------------------------
// ADMIN MARK ATTENDANCE
// -----------------------------

// export const markAttendance = async (req, res) => {
//   const { workerId, status, siteId } = req.body;

//   console.log("data in server conmark attadace controller",req.body);

//   if (req.user.role !== "admin") {
//     throw new AppError({
//       message: "Only admin can mark attendance",
//       statusCode: ERROR_CODES.FORBIDDEN,
//       type: "FORBIDDEN"
//     });
//   }

//   if (!workerId) {
//     throw new AppError({
//       message: "Worker ID required",
//       statusCode: ERROR_CODES.BAD_REQUEST,
//       type: "WORKER_REQUIRED"
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

//   const today = new Date().toISOString().split("T")[0];

//   const exists = await Attendance.findOne({ workerId, date: today });
//   if (exists) {
//     throw new AppError({
//       message: "Attendance already marked",
//       statusCode: ERROR_CODES.CONFLICT,
//       type: "ATTENDANCE_EXISTS"
//     });
//   }

//   // -----------------------------
//   // CALCULATE WORKED HOURS
//   // -----------------------------
//   let workedHours = 0;

//   if (status === "absent") {
//     workedHours = 0;
//   } else if (status === "Half_Day") {
//     workedHours = 4;
//   } else if (status === "P") {
//     workedHours = 8;
//   } else if (status.startsWith("P")) {
//     const num = Number(status.slice(1));
//     if (num >= 1 && num <= 18) {
//       workedHours = num;
//     } else {
//       throw new AppError({
//         message: "Invalid attendance status",
//         statusCode: ERROR_CODES.BAD_REQUEST,
//         type: "INVALID_STATUS"
//       });
//     }
//   } else {
//     throw new AppError({
//       message: "Invalid attendance status",
//       statusCode: ERROR_CODES.BAD_REQUEST,
//       type: "INVALID_STATUS"
//     });
//   }

//   // -----------------------------
//   // SALARY CALCULATION
//   // -----------------------------
//   const baseSalary = worker.dailyRate; // user base salary
//   const hourRate = baseSalary / 8;

//   let salaryForTheDay = 0;

//   if (workedHours > 0) {
//     // Normal daily salary + extra hours salary
//     const extraHours = workedHours - 8;
//     if (extraHours > 0) {
//       salaryForTheDay = baseSalary + extraHours * hourRate;
//     } else {
//       // workedHours <= 8
//       salaryForTheDay = hourRate * workedHours;
//     }
//   }

//   // -----------------------------
//   // CREATE ATTENDANCE RECORD
//   // -----------------------------
//   const record = await Attendance.create({
//     workerId,
//     adminId: req.user.id,
//     siteId: siteId || null,
//     status,
//     workedHours,
//     salaryForTheDay,
//     date: today
//   });

//   return SUCCESS(res, "Attendance saved", record);
// };
export const markAttendance = async (req, res) => {
  const { workerId, status, siteId, date } = req.body;

  console.log("Marking attendance:", req.body);

  if (req.user.role !== "admin") {
    throw new AppError({
      message: "Only admin can mark attendance",
      statusCode: ERROR_CODES.FORBIDDEN,
      type: "FORBIDDEN"
    });
  }

  if (!workerId) {
    throw new AppError({
      message: "Worker ID required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "WORKER_REQUIRED"
    });
  }

  // Use provided date or today's date
  const targetDate = date || getTodayDate();
  
  // Validate date format
  if (!isValidDate(targetDate)) {
    throw new AppError({
      message: "Invalid date format. Use YYYY-MM-DD",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_DATE"
    });
  }

  const worker = await User.findById(workerId);
  if (!worker) {
    throw new AppError({
      message: "Worker not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "WORKER_NOT_FOUND"
    });
  }

  // Check if attendance already exists for this specific date
  // This allows marking attendance for different dates
  const existingRecord = await Attendance.findOne({ 
    workerId, 
    date: targetDate 
  });

  // Calculate worked hours
  let workedHours = 0;

  if (status === "absent") {
    workedHours = 0;
  } else if (status === "Half_Day") {
    workedHours = 4;
  } else if (status === "P") {
    workedHours = 8;
  } else if (status.startsWith("P")) {
    const num = Number(status.slice(1));
    if (num >= 1 && num <= 18) {
      workedHours = num;
    } else {
      throw new AppError({
        message: "Invalid attendance status",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_STATUS"
      });
    }
  } else {
    throw new AppError({
      message: "Invalid attendance status",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_STATUS"
    });
  }

  // Calculate salary
  const baseSalary = worker.dailyRate || 0;
  const hourRate = baseSalary / 8;
  let salaryForTheDay = 0;

  if (workedHours > 0) {
    const extraHours = workedHours - 8;
    if (extraHours > 0) {
      salaryForTheDay = baseSalary + (extraHours * hourRate);
    } else {
      salaryForTheDay = hourRate * workedHours;
    }
  }

  let record;
  
  if (existingRecord) {
    // UPDATE existing record for this date (allows editing past attendance)
    existingRecord.status = status;
    existingRecord.workedHours = workedHours;
    existingRecord.salaryForTheDay = salaryForTheDay;
    existingRecord.adminId = req.user.id;
    if (siteId) existingRecord.siteId = siteId;
    record = await existingRecord.save();
    
    return SUCCESS(res, `Attendance updated for ${targetDate}`, record);
  } else {
    // CREATE new record for this date
    record = await Attendance.create({
      workerId,
      adminId: req.user.id,
      siteId: siteId || worker.siteId || null,
      status,
      workedHours,
      salaryForTheDay,
      date: targetDate,
      dailyRate: worker.dailyRate,
      hourlyRate: worker.hourlyRate
    });
    
    return SUCCESS(res, `Attendance saved for ${targetDate}`, record);
  }
};

// -----------------------------
// ADMIN UPDATE ATTENDANCE
// -----------------------------
// export const updateAttendance = async (req, res) => {
//   const { recordId } = req.params;
//   const { status } = req.body;

//   if (req.user.role !== "admin") {
//     throw new AppError({
//       message: "Only admin can update attendance",
//       statusCode: ERROR_CODES.FORBIDDEN,
//       type: "FORBIDDEN"
//     });
//   }

//   if (!HOURS_MAP[status]) {
//     throw new AppError({
//       message: "Invalid attendance code",
//       statusCode: ERROR_CODES.BAD_REQUEST,
//       type: "INVALID_STATUS"
//     });
//   }

//   const record = await Attendance.findById(recordId);
//   if (!record) {
//     throw new AppError({
//       message: "Attendance not found",
//       statusCode: ERROR_CODES.NOT_FOUND,
//       type: "NOT_FOUND"
//     });
//   }

//   const worker = await User.findById(record.workerId);

//   const workedHours = HOURS_MAP[status];
//   const hourRate = worker.dailyRate / 8;

//   let salary = 0;
//   if (status !== "absent") {
//     salary = worker.dailyRate + (workedHours - 8) * hourRate;
//   }

//   record.status = status;
//   record.workedHours = workedHours;
//   record.salaryForTheDay = salary;
//   record.adminId = req.user.id;

//   await record.save();

//   return SUCCESS(res, "Attendance updated", record);
// };
export const updateAttendance = async (req, res) => {
  const { recordId } = req.params;
  const { status } = req.body;

  if (req.user.role !== "admin") {
    throw new AppError({
      message: "Only admin can update attendance",
      statusCode: ERROR_CODES.FORBIDDEN,
      type: "FORBIDDEN"
    });
  }

  const record = await Attendance.findById(recordId);
  if (!record) {
    throw new AppError({
      message: "Attendance record not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "NOT_FOUND"
    });
  }

  const worker = await User.findById(record.workerId);
  
  // Calculate hours based on status
  let workedHours = 0;
  if (status === "absent") {
    workedHours = 0;
  } else if (status === "Half_Day") {
    workedHours = 4;
  } else if (status === "P") {
    workedHours = 8;
  } else if (status.startsWith("P")) {
    workedHours = Number(status.slice(1));
  }

  // Calculate salary
  const hourRate = (worker.dailyRate || 0) / 8;
  let salary = 0;
  if (workedHours > 0) {
    const extraHours = workedHours - 8;
    if (extraHours > 0) {
      salary = (worker.dailyRate || 0) + (extraHours * hourRate);
    } else {
      salary = hourRate * workedHours;
    }
  }

  record.status = status;
  record.workedHours = workedHours;
  record.salaryForTheDay = salary;
  record.adminId = req.user.id;

  await record.save();

  return SUCCESS(res, "Attendance updated", record);
};

// -----------------------------
// ADMIN DELETE ATTENDANCE
// -----------------------------
// export const deleteAttendance = async (req, res) => {
//   const { recordId } = req.params;

//   if (req.user.role !== "admin") {
//     throw new AppError({
//       message: "Only admin can delete attendance",
//       statusCode: ERROR_CODES.FORBIDDEN,
//       type: "FORBIDDEN"
//     });
//   }

//   const record = await Attendance.findById(recordId);
//   if (!record) {
//     throw new AppError({
//       message: "Attendance not found",
//       statusCode: ERROR_CODES.NOT_FOUND,
//       type: "NOT_FOUND"
//     });
//   }

//   await record.remove();

//   return SUCCESS(res, "Attendance deleted");
// };
export const deleteAttendance = async (req, res) => {
  const { recordId } = req.params;

  if (req.user.role !== "admin") {
    throw new AppError({
      message: "Only admin can delete attendance",
      statusCode: ERROR_CODES.FORBIDDEN,
      type: "FORBIDDEN"
    });
  }

  const record = await Attendance.findById(recordId);
  if (!record) {
    throw new AppError({
      message: "Attendance record not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "NOT_FOUND"
    });
  }

  await Attendance.deleteOne({ _id: recordId });

  return SUCCESS(res, "Attendance record deleted");
};
// -----------------------------
// GET ATTENDANCE BY DATE
// -----------------------------
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, siteId } = req.query;
    const targetDate = date || getTodayDate();
    
    const filter = { date: targetDate };
    if (siteId) filter.siteId = siteId;
    
    const attendance = await Attendance.find(filter)
      .populate("workerId", "name phone site dailyRate hourlyRate")
      .populate("adminId", "name");
    
    return SUCCESS(res, `Attendance for ${targetDate}`, attendance);
  } catch (error) {
    throw new AppError({
      message: "Failed to fetch attendance",
      statusCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      type: "FETCH_ERROR"
    });
  }
};

// -----------------------------
// GET WORKER ATTENDANCE HISTORY
// -----------------------------
// export const getUserAttendance = async (req, res) => {
//   const { workerId } = req.params;
//   const { startDate, endDate } = req.query;
  
//   const filter = { workerId };
//   if (startDate && endDate) {
//     filter.date = { $gte: startDate, $lte: endDate };
//   }
  
//   const list = await Attendance.find(filter)
//     .sort({ date: -1 });
    
//   // Calculate summary
//   const totalDays = list.length;
//   const totalHours = list.reduce((sum, record) => sum + record.workedHours, 0);
//   const totalSalary = list.reduce((sum, record) => sum + record.salaryForTheDay, 0);
  
//   return SUCCESS(res, "Attendance history", {
//     records: list,
//     summary: {
//       totalDays,
//       totalHours,
//       totalSalary,
//       averageHours: totalDays > 0 ? totalHours / totalDays : 0,
//       averageDailySalary: totalDays > 0 ? totalSalary / totalDays : 0
//     }
//   });
// };
// -----------------------------
// ADMIN — VIEW WORKER ATTENDANCE
// -----------------------------
export const getUserAttendance = async (req, res) => {
  const { workerId } = req.params;

  const list = await Attendance.find({ workerId })
    .sort({ date: -1 });

  return SUCCESS(res, "Attendance fetched", list);
};

export const workerSelfAttendanceView = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filter = { workerId: req.user.id };
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  }
  
  const list = await Attendance.find(filter)
    .sort({ date: -1 });
    
  return SUCCESS(res, "Your attendance", list);
};
// -----------------------------
// GET ALL ATTENDANCE (with filters)
// -----------------------------
export const getAllAttendance = async (req, res) => {
  const { date, siteId, startDate, endDate, workerId } = req.query;

  const filter = {};
  
  if (date) filter.date = date;
  if (siteId) filter.siteId = siteId;
  if (workerId) filter.workerId = workerId;
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  }

  const list = await Attendance.find(filter)
    .populate("workerId", "name phone site dailyRate hourlyRate")
    .populate("adminId", "name")
    .sort({ date: -1, timestamp: -1 });

  return SUCCESS(res, "Attendance records", list);
};

// -----------------------------
// GET MONTHLY ATTENDANCE SUMMARY
// -----------------------------
export const getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month, siteId } = req.query;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    
    const filter = {
      date: { $gte: startDate, $lte: endDate }
    };
    if (siteId) filter.siteId = siteId;
    
    const attendance = await Attendance.find(filter)
      .populate("workerId", "name phone site")
      .sort({ date: 1 });
    
    // Group by worker
    const workerSummary = {};
    attendance.forEach(record => {
      const workerId = record.workerId._id.toString();
      if (!workerSummary[workerId]) {
        workerSummary[workerId] = {
          worker: record.workerId,
          totalDays: 0,
          totalHours: 0,
          totalSalary: 0,
          presentDays: 0,
          absentDays: 0,
          halfDays: 0
        };
      }
      
      workerSummary[workerId].totalDays++;
      workerSummary[workerId].totalHours += record.workedHours;
      workerSummary[workerId].totalSalary += record.salaryForTheDay;
      
      if (record.status === "absent") {
        workerSummary[workerId].absentDays++;
      } else if (record.status === "Half_Day") {
        workerSummary[workerId].halfDays++;
        workerSummary[workerId].presentDays++;
      } else {
        workerSummary[workerId].presentDays++;
      }
    });
    
    return SUCCESS(res, `Attendance summary for ${year}-${month}`, {
      summary: Object.values(workerSummary),
      totalRecords: attendance.length,
      period: { startDate, endDate }
    });
  } catch (error) {
    throw new AppError({
      message: "Failed to fetch monthly summary",
      statusCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      type: "FETCH_ERROR"
    });
  }
};

// -----------------------------
// CALCULATE SALARY FOR WORKER
// -----------------------------
export const calculateSalary = async (req, res) => {
  try {
    const { workerId, startDate, endDate } = req.query;
    
    const attendance = await Attendance.find({
      workerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    const totalDays = attendance.length;
    const totalHours = attendance.reduce((sum, record) => sum + record.workedHours, 0);
    const totalSalary = attendance.reduce((sum, record) => sum + record.salaryForTheDay, 0);
    
    return SUCCESS(res, "Salary calculation", {
      workerId,
      period: { startDate, endDate },
      summary: {
        totalDays,
        totalHours,
        totalSalary,
        averageDailySalary: totalDays > 0 ? totalSalary / totalDays : 0,
        averageDailyHours: totalDays > 0 ? totalHours / totalDays : 0
      },
      details: attendance
    });
  } catch (error) {
    throw new AppError({
      message: "Failed to calculate salary",
      statusCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      type: "CALCULATION_ERROR"
    });
  }
};


// -----------------------------
// UPDATE DAILY RATE
// -----------------------------
export const updateDailyRate = async (req, res) => {
  const { userId, dailyRate } = req.body;

  if (!userId || !dailyRate) {
    throw new AppError({
      message: "userId and dailyRate required",
      statusCode: ERROR_CODES.BAD_REQUEST
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND
    });
  }

  const hourlyRate = dailyRate / 8;

  user.dailyRate = dailyRate;
  user.hourlyRate = hourlyRate;

  await user.save();

  return SUCCESS(res, "Daily & hourly rate updated", {
    userId,
    dailyRate,
    hourlyRate
  });
};

// -----------------------------
// UPDATE HOURLY RATE
// -----------------------------
export const updateHourlyRate = async (req, res) => {
  const { userId, hourlyRate } = req.body;

  if (!userId || !hourlyRate) {
    throw new AppError({
      message: "userId and hourlyRate required",
      statusCode: ERROR_CODES.BAD_REQUEST
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND
    });
  }

  user.hourlyRate = hourlyRate;
  user.dailyRate = hourlyRate * 8;

  await user.save();

  return SUCCESS(res, "Hourly & daily rate updated", {
    userId,
    hourlyRate,
    dailyRate: user.dailyRate
  });
};