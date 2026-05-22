import User from "../models/User.js";
import Kharchi from "../models/Kharchi.js";
import Salary from "../models/Salary.js";
import Attendance from "../models/Attendance.js";
import Investment from "../models/Investment.js";

import dayjs from "dayjs";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";


export const adminFinanceStats = async (req, res, next) => {
  try {
    const today = dayjs().format("YYYY-MM-DD");
    const month = dayjs().month() + 1;
    const year = dayjs().year();

    // ------------------
    // TOTAL WORKERS
    // ------------------
    const totalWorkers = await User.countDocuments({ role: "worker" });

    // ------------------
    // TOTAL KHARCHI (ALL TIME)
    // ------------------
    const totalKharchiAgg = await Kharchi.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalKharchi = totalKharchiAgg[0]?.total || 0;

    // ------------------
    // TODAY KHARCHI
    // ------------------
    const todayKharchiAgg = await Kharchi.aggregate([
      { $match: { date: today } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const todayKharchi = todayKharchiAgg[0]?.total || 0;

    // ------------------
    // THIS MONTH KHARCHI
    // ------------------
    const monthKharchiAgg = await Kharchi.aggregate([
      { $match: { date: { $regex: `^${year}-${String(month).padStart(2, "0")}` } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthKharchi = monthKharchiAgg[0]?.total || 0;

    // ------------------
    // TODAY ATTENDANCE
    // ------------------
    const todayAttendance = await Attendance.countDocuments({ date: today });

    // ------------------
    // TOTAL INVESTMENT (ALL TIME)
    // ------------------
    const totalInvestmentAgg = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalInvestment = totalInvestmentAgg[0]?.total || 0;

    // ------------------
    // MONTHLY SALARY SUMMARY
    // ------------------
    const monthlySalaryAgg = await Salary.aggregate([
      { $match: { month, year } },
      {
        $group: {
          _id: null,
          totalSalary: { $sum: "$totalEarnings" },
          totalKharchi: { $sum: "$totalKharchi" },
          totalRemaining: { $sum: "$remainingSalary" }
        }
      }
    ]);

    const monthlySalary = {
      totalSalary: monthlySalaryAgg[0]?.totalSalary || 0,
      totalKharchi: monthlySalaryAgg[0]?.totalKharchi || 0,
      remainingSalary: monthlySalaryAgg[0]?.totalRemaining || 0
    };

    return SUCCESS(res, "Finance analytics", {
      totalWorkers,
      totalKharchi,
      todayKharchi,
      monthKharchi,
      todayAttendance,
      totalInvestment,
      monthlySalary
    });

  } catch (err) {
    next(err);
  }
};

export const salaryByWorker = async (req, res) => {
  const { workerId } = req.params;

  const slips = await Salary.find({ workerId })
    .sort({ year: -1, month: -1 });

  return SUCCESS(res, "Worker salary details", slips);
};

export const kharchiByWorker = async (req, res) => {
  const { workerId } = req.params;

  const result = await Kharchi.aggregate([
    { $match: { userId: workerId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return SUCCESS(res, "Worker Kharchi Summary", {
    totalKharchi: result[0]?.total || 0
  });
};

// New
// const getDateRange = (period, selectedDate = null) => {
//   const date = selectedDate ? dayjs(selectedDate) : dayjs();
  
//   switch(period) {
//     case 'weekly':
//       return {
//         startDate: date.startOf('week').format('YYYY-MM-DD'),
//         endDate: date.endOf('week').format('YYYY-MM-DD'),
//         label: `Week of ${date.startOf('week').format('MMM DD')}`
//       };
//     case 'monthly':
//       return {
//         startDate: date.startOf('month').format('YYYY-MM-DD'),
//         endDate: date.endOf('month').format('YYYY-MM-DD'),
//         label: date.format('MMMM YYYY')
//       };
//     case 'yearly':
//       return {
//         startDate: date.startOf('year').format('YYYY-MM-DD'),
//         endDate: date.endOf('year').format('YYYY-MM-DD'),
//         label: date.format('YYYY')
//       };
//     default:
//       return {
//         startDate: date.startOf('month').format('YYYY-MM-DD'),
//         endDate: date.endOf('month').format('YYYY-MM-DD'),
//         label: date.format('MMMM YYYY')
//       };
//   }
// };
const getDateRange = (period, selectedDate = null) => {
  const date = selectedDate ? dayjs(selectedDate) : dayjs();
  
  switch(period) {
    case 'weekly':
      return {
        startDate: date.startOf('week').format('YYYY-MM-DD'),
        endDate: date.endOf('week').format('YYYY-MM-DD'),
        label: `Week of ${date.startOf('week').format('MMM DD')}`
      };
    case 'monthly':
      return {
        startDate: date.startOf('month').format('YYYY-MM-DD'),
        endDate: date.endOf('month').format('YYYY-MM-DD'),
        label: date.format('MMMM YYYY')
      };
    case 'yearly':
      // For yearly, we'll show monthly aggregation, not daily
      return {
        startDate: date.startOf('year').format('YYYY-MM-DD'),
        endDate: date.endOf('year').format('YYYY-MM-DD'),
        label: date.format('YYYY')
      };
    default:
      return {
        startDate: date.startOf('month').format('YYYY-MM-DD'),
        endDate: date.endOf('month').format('YYYY-MM-DD'),
        label: date.format('MMMM YYYY')
      };
  }
};

// Get financial overview with period filtering
// export const getFinanceOverview = async (req, res) => {
//   try {
//     const { period = 'monthly', date } = req.query;
//     const { startDate, endDate, label } = getDateRange(period, date);
    
//     console.log(`📊 Fetching finance data for ${period}: ${startDate} to ${endDate}`);
    
//     // Get all workers
//     const workers = await User.find({ role: "worker" }).select("_id name dailyRate hourlyRate");
    
//     // Get attendance records for the period
//     const attendanceRecords = await Attendance.find({
//       date: { $gte: startDate, $lte: endDate }
//     }).populate("workerId", "name dailyRate hourlyRate");
    
//     // Calculate total worked hours and salary from attendance
//     let totalWorkedHours = 0;
//     let totalSalaryFromAttendance = 0;
//     const dailyAttendance = {};
    
//     attendanceRecords.forEach(record => {
//       const hours = record.workedHours || 0;
//       totalWorkedHours += hours;
      
//       const hourlyRate = record.workerId?.hourlyRate || (record.workerId?.dailyRate / 8) || 0;
//       const salaryForRecord = hours * hourlyRate;
//       totalSalaryFromAttendance += salaryForRecord;
      
//       // Group by date for chart data
//       const dateKey = record.date;
//       if (!dailyAttendance[dateKey]) {
//         dailyAttendance[dateKey] = { salary: 0, kharchi: 0 };
//       }
//       dailyAttendance[dateKey].salary += salaryForRecord;
//     });
    
//     // Get kharchi records for the period
//     const kharchiRecords = await Kharchi.find({
//       date: { $gte: startDate, $lte: endDate }
//     }).populate("userId", "name");
    
//     let totalKharchi = 0;
//     const dailyKharchi = {};
    
//     kharchiRecords.forEach(record => {
//       totalKharchi += record.amount || 0;
      
//       const dateKey = record.date;
//       if (!dailyKharchi[dateKey]) {
//         dailyKharchi[dateKey] = 0;
//       }
//       dailyKharchi[dateKey] += record.amount || 0;
//     });
    
//     // Get investments for the period
//     const investmentRecords = await Investment.find({
//       date: { $gte: startDate, $lte: endDate }
//     });
    
//     const totalInvestment = investmentRecords.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
//     // Calculate totals
//     const totalRevenue = totalSalaryFromAttendance; // Revenue from worker salaries (billable)
//     const totalExpenses = totalKharchi + totalInvestment; // Kharchi + Investments
//     const netProfit = totalRevenue - totalExpenses;
//     const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
//     // Calculate growth rate (compare with previous period)
//     const previousPeriod = getPreviousPeriod(period, startDate, endDate);
//     const previousData = await getPreviousPeriodData(previousPeriod.startDate, previousPeriod.endDate);
    
//     const revenueGrowth = previousData.totalRevenue > 0 
//       ? ((totalRevenue - previousData.totalRevenue) / previousData.totalRevenue) * 100 
//       : 0;
    
//     // Prepare chart data
//     const chartData = prepareChartData(startDate, endDate, dailyAttendance, dailyKharchi, period);
    
//     // Get top expense categories
//     const topKharchi = kharchiRecords
//       .sort((a, b) => b.amount - a.amount)
//       .slice(0, 5)
//       .map(k => ({
//         worker: k.userId?.name || "Unknown",
//         amount: k.amount,
//         reason: k.reason,
//         date: k.date
//       }));
    
//     // Get worker performance summary
//     const workerPerformance = await getWorkerPerformance(workers, attendanceRecords, kharchiRecords);
    
//     return SUCCESS(res, "Finance overview fetched", {
//       period: {
//         type: period,
//         startDate,
//         endDate,
//         label
//       },
//       summary: {
//         totalRevenue,
//         totalExpenses,
//         netProfit,
//         profitMargin: parseFloat(profitMargin.toFixed(2)),
//         revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
//         totalWorkedHours,
//         totalKharchi,
//         totalInvestment,
//         totalWorkers: workers.length
//       },
//       charts: chartData,
//       topExpenses: topKharchi,
//       workerPerformance
//     });
    
//   } catch (error) {
//     console.error("Finance overview error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch finance data",
//       error: error.message
//     });
//   }
// };

export const getFinanceOverview = async (req, res) => {
  try {
    const { period = 'monthly', date } = req.query;
    
    // Validate period
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period. Use 'weekly', 'monthly', or 'yearly'"
      });
    }
    
    const { startDate, endDate, label } = getDateRange(period, date);
    
    console.log(`📊 Fetching finance data for ${period}: ${startDate} to ${endDate}`);
    
    // Get all workers
    const workers = await User.find({ role: "worker" }).select("_id name dailyRate hourlyRate");
    
    // Get attendance records for the period with date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("workerId", "name dailyRate hourlyRate");
    
    // Calculate total worked hours and salary from attendance
    let totalWorkedHours = 0;
    let totalSalaryFromAttendance = 0;
    const dailyAttendance = {};
    
    attendanceRecords.forEach(record => {
      const hours = record.workedHours || 0;
      totalWorkedHours += hours;
      
      const hourlyRate = record.workerId?.hourlyRate || (record.workerId?.dailyRate / 8) || 0;
      const salaryForRecord = hours * hourlyRate;
      totalSalaryFromAttendance += salaryForRecord;
      
      // Group by date for chart data
      const dateKey = record.date;
      if (!dailyAttendance[dateKey]) {
        dailyAttendance[dateKey] = { salary: 0, kharchi: 0 };
      }
      dailyAttendance[dateKey].salary += salaryForRecord;
    });
    
    // Get kharchi records for the period
    const kharchiRecords = await Kharchi.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("userId", "name");
    
    let totalKharchi = 0;
    const dailyKharchi = {};
    
    kharchiRecords.forEach(record => {
      totalKharchi += record.amount || 0;
      
      const dateKey = record.date;
      if (!dailyKharchi[dateKey]) {
        dailyKharchi[dateKey] = 0;
      }
      dailyKharchi[dateKey] += record.amount || 0;
    });
    
    // Get investments for the period
    const investmentRecords = await Investment.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const totalInvestment = investmentRecords.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    // Calculate totals
    const totalRevenue = totalSalaryFromAttendance;
    const totalExpenses = totalKharchi + totalInvestment;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Calculate growth rate (compare with previous period)
    const previousPeriod = getPreviousPeriod(period, startDate, endDate);
    const previousData = await getPreviousPeriodData(previousPeriod.startDate, previousPeriod.endDate);
    
    const revenueGrowth = previousData.totalRevenue > 0 
      ? ((totalRevenue - previousData.totalRevenue) / previousData.totalRevenue) * 100 
      : 0;
    
    // Prepare chart data - LIMIT the number of data points for yearly view
    let chartData;
    if (period === 'yearly') {
      // For yearly, show monthly aggregated data instead of daily
      chartData = await prepareYearlyChartData(startDate, endDate, dailyAttendance, dailyKharchi);
    } else {
      // For weekly/monthly, show daily data
      chartData = prepareChartData(startDate, endDate, dailyAttendance, dailyKharchi, period);
    }
    
    // Get top expense categories (limit to 5)
    const topKharchi = kharchiRecords
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(k => ({
        worker: k.userId?.name || "Unknown",
        amount: k.amount,
        reason: k.reason || "No reason",
        date: k.date
      }));
    
    // Get worker performance summary (limit to top 10)
    const workerPerformance = await getWorkerPerformance(workers, attendanceRecords, kharchiRecords);
    const topWorkerPerformance = workerPerformance.slice(0, 10);
    
    return SUCCESS(res, "Finance overview fetched", {
      period: {
        type: period,
        startDate,
        endDate,
        label
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        totalWorkedHours,
        totalKharchi,
        totalInvestment,
        totalWorkers: workers.length
      },
      charts: chartData,
      topExpenses: topKharchi,
      workerPerformance: topWorkerPerformance
    });
    
  } catch (error) {
    console.error("Finance overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch finance data",
      error: error.message
    });
  }
};

// Get monthly chart data for the year
export const getYearlyChartData = async (req, res) => {
  try {
    const { year = dayjs().year() } = req.query;
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      const { startDate, endDate } = getDateRange('monthly', dayjs(`${year}-${month}-01`));
      
      const attendanceRecords = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
      });
      
      let monthlySalary = 0;
      attendanceRecords.forEach(record => {
        const hours = record.workedHours || 0;
        monthlySalary += hours * (record.hourlyRate || 0);
      });
      
      const kharchiRecords = await Kharchi.find({
        date: { $gte: startDate, $lte: endDate }
      });
      
      const monthlyKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
      
      monthlyData.push({
        month: dayjs().month(month - 1).format('MMM'),
        revenue: monthlySalary,
        expenses: monthlyKharchi,
        profit: monthlySalary - monthlyKharchi
      });
    }
    
    return SUCCESS(res, "Yearly chart data", monthlyData);
    
  } catch (error) {
    console.error("Yearly chart error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message
    });
  }
};

// Helper: Get previous period data
async function getPreviousPeriodData(startDate, endDate) {
  const attendanceRecords = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  let totalRevenue = 0;
  attendanceRecords.forEach(record => {
    const hours = record.workedHours || 0;
    totalRevenue += hours * (record.hourlyRate || 0);
  });
  
  const kharchiRecords = await Kharchi.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalKharchi = kharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
  
  return { totalRevenue, totalKharchi };
}

// Helper: Get previous period dates
function getPreviousPeriod(period, currentStart, currentEnd) {
  const start = dayjs(currentStart);
  const end = dayjs(currentEnd);
  const duration = end.diff(start, 'day');
  
  return {
    startDate: start.subtract(duration + 1, 'day').format('YYYY-MM-DD'),
    endDate: start.subtract(1, 'day').format('YYYY-MM-DD')
  };
}

// Helper: Prepare chart data
// function prepareChartData(startDate, endDate, dailyAttendance, dailyKharchi, period) {
//   const dates = [];
//   let current = dayjs(startDate);
//   const end = dayjs(endDate);
  
//   while (current.isBefore(end) || current.isSame(end)) {
//     const dateKey = current.format('YYYY-MM-DD');
//     dates.push({
//       date: period === 'weekly' ? current.format('ddd') : 
//             period === 'monthly' ? current.format('DD') : 
//             current.format('MMM'),
//       fullDate: dateKey,
//       revenue: dailyAttendance[dateKey]?.salary || 0,
//       expenses: dailyKharchi[dateKey] || 0,
//       profit: (dailyAttendance[dateKey]?.salary || 0) - (dailyKharchi[dateKey] || 0)
//     });
//     current = current.add(1, 'day');
//   }
  
//   return dates;
// }
function prepareChartData(startDate, endDate, dailyAttendance, dailyKharchi, period) {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  
  // Limit the number of data points based on period
  let maxDays = 31; // Default for monthly
  if (period === 'weekly') maxDays = 7;
  if (period === 'yearly') maxDays = 12; // Show months, not days
  
  let dayCount = 0;
  
  while ((current.isBefore(end) || current.isSame(end)) && dayCount < maxDays) {
    const dateKey = current.format('YYYY-MM-DD');
    let label;
    
    if (period === 'weekly') {
      label = current.format('ddd');
    } else if (period === 'yearly') {
      label = current.format('MMM');
    } else {
      label = current.format('DD');
    }
    
    dates.push({
      date: label,
      fullDate: dateKey,
      revenue: dailyAttendance[dateKey]?.salary || 0,
      expenses: dailyKharchi[dateKey] || 0,
      profit: (dailyAttendance[dateKey]?.salary || 0) - (dailyKharchi[dateKey] || 0)
    });
    
    current = current.add(1, 'day');
    dayCount++;
  }
  
  return dates;
}

// Helper: Get worker performance
async function getWorkerPerformance(workers, attendanceRecords, kharchiRecords) {
  const workerMap = new Map();
  
  // Initialize workers
  workers.forEach(worker => {
    workerMap.set(worker._id.toString(), {
      workerId: worker._id,
      name: worker.name,
      totalHours: 0,
      totalSalary: 0,
      totalKharchi: 0,
      netEarning: 0
    });
  });
  
  // Add attendance data
  attendanceRecords.forEach(record => {
    const workerId = record.workerId?._id?.toString();
    if (workerId && workerMap.has(workerId)) {
      const hours = record.workedHours || 0;
      const hourlyRate = record.workerId?.hourlyRate || (record.workerId?.dailyRate / 8) || 0;
      const salary = hours * hourlyRate;
      
      const data = workerMap.get(workerId);
      data.totalHours += hours;
      data.totalSalary += salary;
    }
  });
  
  // Add kharchi data
  kharchiRecords.forEach(record => {
    const workerId = record.userId?._id?.toString();
    if (workerId && workerMap.has(workerId)) {
      const data = workerMap.get(workerId);
      data.totalKharchi += record.amount || 0;
    }
  });
  
  // Calculate net earnings
  const performance = Array.from(workerMap.values()).map(data => ({
    ...data,
    netEarning: data.totalSalary - data.totalKharchi
  }));
  
  return performance.sort((a, b) => b.netEarning - a.netEarning);
}

async function prepareYearlyChartData(startDate, endDate, dailyAttendance, dailyKharchi) {
  const monthlyData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 12; i++) {
    const month = (i + 1).toString().padStart(2, '0');
    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    
    // Aggregate daily data for this month
    Object.keys(dailyAttendance).forEach(date => {
      if (date.endsWith(`-${month}`)) {
        monthlyRevenue += dailyAttendance[date]?.salary || 0;
      }
    });
    
    Object.keys(dailyKharchi).forEach(date => {
      if (date.endsWith(`-${month}`)) {
        monthlyExpenses += dailyKharchi[date] || 0;
      }
    });
    
    monthlyData.push({
      date: months[i],
      fullDate: `${startDate.substring(0, 4)}-${month}`,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      profit: monthlyRevenue - monthlyExpenses
    });
  }
  
  return monthlyData;
}