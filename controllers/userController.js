import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Kharchi from "../models/Kharchi.js";
import Salary from '../models/Salary.js'
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import { CLOG } from "../utils/logger.js";
import Site from "../models/Site.js";

// Fetch all workers (Admin only)
export const getWorkers = async (req, res) => {
  const workers = await User.find({ role: "worker" });
  return SUCCESS(res, "Workers fetched", workers);
};

// Get own profile
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user)
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "USER_NOT_FOUND",
    });

  return SUCCESS(res, "Profile fetched", user);
};

// Worker Stats (Salary, Kharchi, Attendance)
export const workerStats = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user)
    throw new AppError({
      message: "Worker not found",
      statusCode: 404,
      type: "USER_NOT_FOUND",
    });

  const attendance = await Attendance.find({ userId, status: "present" });
  const presentDays = attendance.length;

  const earnings = presentDays * (user.dailyRate || 0);

  const kharchiList = await Kharchi.find({ userId });
  const totalKharchi = kharchiList.reduce((a, b) => a + b.amount, 0);

  const remaining = earnings - totalKharchi;

  return SUCCESS(res, "Worker stats", {
    presentDays,
    earnings,
    totalKharchi,
    remainingSalary: remaining,
  });
};

export const topWorkersAttendance = async (req, res) => {
  const result = await Attendance.aggregate([
    {
      $match: { status: "present" }
    },
    {
      $group: {
        _id: "$workerId",
        presentDays: { $sum: 1 }
      }
    },
    { $sort: { presentDays: -1 } },
    { $limit: 5 }
  ]);

  const data = await User.populate(result, {
    path: "_id",
    select: "name phone"
  });

  return SUCCESS(res, "Top 5 workers by attendance", data);
};

export const workerPerformance = async (req, res) => {
  const result = await Attendance.aggregate([
    {
      $group: {
        _id: "$slab",
        count: { $sum: 1 }
      }
    }
  ]);

  const formatted = {
    P: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0
  };

  result.forEach(r => {
    formatted[r._id] = r.count;
  });

  return SUCCESS(res, "Worker slab performance", formatted);
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Fields that workers are allowed to update
    const allowedFields = [
      'name',
      'phone',
      'email',
      'address',
      'emergencyContact',
      'designation',
      'photo',
      'aadhaarFront',
      'aadhaarBack',
      'documents'
    ];
    
    // Fields that require admin approval or cannot be updated by worker
    const restrictedFields = [
      'role',
      'dailyRate',
      'hourlyRate',
      'siteId',
      'site',
      'isOtpAccVerified',
      'Designationverify',
      'idVerified',
      'totalKharchi',
      'password',
      'refreshToken'
    ];
    
    // Check if trying to update restricted fields
    const restrictedUpdate = Object.keys(updates).some(key => restrictedFields.includes(key));
    if (restrictedUpdate) {
      throw new AppError({
        message: "You cannot update restricted fields. Contact admin for changes.",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN_UPDATE"
      });
    }
    
    // Filter only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new AppError({
        message: "No valid fields to update",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "NO_VALID_FIELDS"
      });
    }
    
    // If updating email, validate format
    if (filteredUpdates.email) {
      const isValidEmail = validator.isEmail(filteredUpdates.email);
      if (!isValidEmail) {
        throw new AppError({
          message: "Invalid email format",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_EMAIL"
        });
      }
      
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: filteredUpdates.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new AppError({
          message: "Email already in use",
          statusCode: ERROR_CODES.CONFLICT,
          type: "EMAIL_EXISTS"
        });
      }
    }
    
    // If updating phone, check uniqueness
    if (filteredUpdates.phone) {
      const existingUser = await User.findOne({ 
        phone: filteredUpdates.phone, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new AppError({
          message: "Phone number already in use",
          statusCode: ERROR_CODES.CONFLICT,
          type: "PHONE_EXISTS"
        });
      }
    }
    
    // Update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select("-password -refreshToken -otp -resetToken -resetTokenExpiry");
    
    if (!user) {
      throw new AppError({
        message: "User not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "USER_NOT_FOUND"
      });
    }
    
    // Log which fields were updated
    const updatedFields = Object.keys(filteredUpdates);
    console.log(`User ${userId} updated fields: ${updatedFields.join(', ')}`);
    
    return SUCCESS(res, "Profile updated successfully", user);
    
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
};

// Update single field specifically (alternative approach)
export const updateProfileField = async (req, res) => {
  try {
    const userId = req.user.id;
    const { field, value } = req.body;
    console.log("recieving data :- ", userId, req.body)
    // Allowed fields for single update
    const allowedFields = [
      'name', 'phone', 'email', 'address', 'emergencyContact', 'designation'
    ];
    
    if (!allowedFields.includes(field)) {
      throw new AppError({
        message: `Field '${field}' cannot be updated`,
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FIELD_NOT_ALLOWED"
      });
    }
    
    // Validate email if updating
    if (field === 'email') {
      const isValidEmail = validator.isEmail(value);
      if (!isValidEmail) {
        throw new AppError({
          message: "Invalid email format",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_EMAIL"
        });
      }
      
      const existingUser = await User.findOne({ email: value, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError({
          message: "Email already in use",
          statusCode: ERROR_CODES.CONFLICT,
          type: "EMAIL_EXISTS"
        });
      }
    }
    
    // Validate phone if updating
    if (field === 'phone') {
      const existingUser = await User.findOne({ phone: value, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError({
          message: "Phone number already in use",
          statusCode: ERROR_CODES.CONFLICT,
          type: "PHONE_EXISTS"
        });
      }
    }
    
    // Update the specific field
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { [field]: value } },
      { new: true}
    ).select("-password -refreshToken -otp -resetToken -resetTokenExpiry");
    
    return SUCCESS(res, `${field} updated successfully`, {
      field,
      value,
      user
    });
    
  } catch (error) {
    console.error("Profile field update error:", error);
    throw error;
  }
};

// Create worker by admin
export const createWorkerByAdmin = async (req, res) => {
  try {
    const { name, phone, email, address, designation, role, siteId, dailyRate, password } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can create workers",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    // Validate required fields
    if (!name) {
      throw new AppError({
        message: "Name is required",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "NAME_REQUIRED"
      });
    }
    
    // Check if phone or email already exists
    const existingUser = await User.findOne({
      $or: [
        { phone: phone },
        { email: email }
      ]
    });
    
    if (existingUser) {
      throw new AppError({
        message: "User with this phone or email already exists",
        statusCode: ERROR_CODES.CONFLICT,
        type: "USER_EXISTS"
      });
    }
    
    // Generate a default password if not provided
    const defaultPassword = password || `Worker@${Math.random().toString(36).substring(2, 8)}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create the worker
    const worker = await User.create({
      name,
      phone: phone || "",
      email: email || "",
      address: address || "",
      designation: designation || "Worker",
      role: role || "worker",
      siteId: siteId || null,
      dailyRate: dailyRate || 0,
      password: hashedPassword,
      isOtpAccVerified: true, // Admin-created accounts are pre-verified
      otpAccVerifiedAt: new Date()
    });
    
    // Return worker info (without password)
    const workerData = worker.toObject();
    delete workerData.password;
    delete workerData.refreshToken;
    
    // Generate temporary password for response
    return SUCCESS(res, "Worker created successfully", {
      worker: workerData,
      temporaryPassword: defaultPassword,
      message: `Worker created. Temporary password: ${defaultPassword}`
    });
  } catch (error) {
    console.error("Create worker error:", error);
    throw error;
  }
};

// -----------------------------
// ADD SITE IN WORKER 
// -----------------------------

export const assignWorkerToSite = async (req, res) => {
  try {
    const { workerId, siteId } = req.body;

    // Validate worker exists
    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // Check if user is a worker
    if (worker.role !== "worker") {
      return res.status(400).json({
        success: false,
        message: "User is not a worker"
      });
    }

    // Validate site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Assign site to worker
    worker.siteId = siteId;
    worker.site = site.name; // For backward compatibility
    await worker.save();

    // Update site worker count
    await site.updateWorkerCount();

    res.json({
      success: true,
      message: `Worker ${worker.name} assigned to site ${site.name}`,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          phone: worker.phone
        },
        site: {
          id: site._id,
          name: site.name,
          address: site.address
        }
      }
    });

  } catch (error) {
    console.error("Error assigning worker to site:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign worker to site",
      error: error.message
    });
  }
};

// Get all workers for a specific site
export const getWorkersBySite = async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    const workers = await User.find({
      siteId: siteId,
      role: "worker"
    }).select("name phone email dailyRate Designationverify createdAt");

    res.json({
      success: true,
      data: {
        site: {
          id: site._id,
          name: site.name,
          address: site.address
        },
        workers: workers,
        totalWorkers: workers.length
      }
    });

  } catch (error) {
    console.error("Error getting workers by site:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get workers",
      error: error.message
    });
  }
};

// Get unassigned workers (workers without a site)
export const getUnassignedWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      role: "worker",
      $or: [
        { siteId: { $exists: false } },
        { siteId: null }
      ]
    }).select("name phone email dailyRate Designationverify createdAt");

    res.json({
      success: true,
      data: workers,
      total: workers.length
    });

  } catch (error) {
    console.error("Error getting unassigned workers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unassigned workers",
      error: error.message
    });
  }
};

// Remove worker from site
export const removeWorkerFromSite = async (req, res) => {
  try {
    const { workerId } = req.params;

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    const oldSiteId = worker.siteId;

    // Remove site assignment
    worker.siteId = null;
    worker.site = "";
    await worker.save();

    // Update old site worker count if exists
    if (oldSiteId) {
      const oldSite = await Site.findById(oldSiteId);
      if (oldSite) {
        await oldSite.updateWorkerCount();
      }
    }

    res.json({
      success: true,
      message: `Worker ${worker.name} removed from site`,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          phone: worker.phone
        }
      }
    });

  } catch (error) {
    console.error("Error removing worker from site:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove worker from site",
      error: error.message
    });
  }
};

// Update worker's site
export const updateWorkerSite = async (req, res) => {
  try {
    const { workerId, siteId } = req.body;

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Remove worker from old site
    if (worker.siteId) {
      const oldSite = await Site.findById(worker.siteId);
      if (oldSite) {
        await oldSite.updateWorkerCount();
      }
    }

    // Assign to new site
    worker.siteId = siteId;
    worker.site = site.name;
    await worker.save();

    // Update new site worker count
    await site.updateWorkerCount();

    res.json({
      success: true,
      message: `Worker ${worker.name} moved to site ${site.name}`,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          phone: worker.phone
        },
        site: {
          id: site._id,
          name: site.name,
          address: site.address
        }
      }
    });

  } catch (error) {
    console.error("Error updating worker site:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update worker site",
      error: error.message
    });
  }
};

export const createPartner = async (req, res) => {
  try {
    const { name, phone, email, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      throw new AppError({
        message: "User with this phone or email already exists",
        statusCode: ERROR_CODES.CONFLICT,
        type: "USER_EXISTS"
      });
    }

    const partner = await User.create({
      name,
      phone,
      email: email || undefined,
      address,
      role: role || "partner",
      password: "partner123", // Default password, they can change later
      isOtpAccVerified: true
    });

    return SUCCESS(res, "Partner created successfully", partner);
  } catch (error) {
    throw error;
  }
};

export const getAllPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: "partner" })
      .select("_id name phone email address role createdAt")
      .sort({ createdAt: -1 });

    return SUCCESS(res, "Partners fetched successfully", partners);
  } catch (error) {
    console.error("Get partners error:", error);
    throw error;
  }
};

// Worker specific

export const getWorkerDashboardStats = async (req, res) => {
  try {
    const workerId = req.user.id;

    // Get worker profile
    const worker = await User.findById(workerId).select("name email phone site designation dailyRate hourlyRate isOtpAccVerified Designationverify idVerified");

    // Get current month attendance
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

    const currentMonthAttendance = await Attendance.find({
      workerId,
      date: { $gte: startDate, $lte: endDate }
    });

    const currentMonthPresentDays = currentMonthAttendance.filter(a => a.status !== "absent").length;
    const currentMonthWorkedHours = currentMonthAttendance.reduce((sum, a) => sum + (a.workedHours || 0), 0);
    const currentMonthSalary = currentMonthWorkedHours * (worker.hourlyRate || 0);

    // Get current month kharchi
    const currentMonthKharchiRecords = await Kharchi.find({
      userId: workerId,
      date: { $gte: startDate, $lte: endDate }
    });
    const currentMonthKharchi = currentMonthKharchiRecords.reduce((sum, k) => sum + (k.amount || 0), 0);
    const currentMonthNetEarning = currentMonthSalary - currentMonthKharchi;

    // Get total attendance (all time)
    const allAttendance = await Attendance.find({ workerId });
    const totalPresentDays = allAttendance.filter(a => a.status !== "absent").length;
    const totalAbsentDays = allAttendance.filter(a => a.status === "absent").length;
    const totalWorkedHours = allAttendance.reduce((sum, a) => sum + (a.workedHours || 0), 0);
    const attendancePercentage = totalPresentDays + totalAbsentDays > 0
      ? (totalPresentDays / (totalPresentDays + totalAbsentDays)) * 100
      : 0;

    // Get total salary
    const allSalaries = await Salary.find({ workerId });
    const totalSalary = allSalaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0);

    // Get total kharchi
    const allKharchi = await Kharchi.find({ userId: workerId });
    const totalKharchi = allKharchi.reduce((sum, k) => sum + (k.amount || 0), 0);
    const netEarning = totalSalary - totalKharchi;

    // Expected salary for current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const expectedSalary = worker.dailyRate * daysInMonth;

    // Today's status
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = await Attendance.findOne({ workerId, date: today });

    return SUCCESS(res, "Worker dashboard stats", {
      profile: {
        name: worker.name,
        email: worker.email,
        phone: worker.phone || "",
        site: worker.site || "Not assigned",
        designation: worker.designation || "Worker",
        dailyRate: worker.dailyRate,
        hourlyRate: worker.hourlyRate,
        accountVerified: worker.isOtpAccVerified || false,
        designationVerified: worker.Designationverify || "Unverified",
        idVerified: worker.idVerified || "Unverified"
      },
      currentMonth: {
        presentDays: currentMonthPresentDays,
        workedHours: currentMonthWorkedHours,
        salary: currentMonthSalary,
        kharchi: currentMonthKharchi,
        netEarning: currentMonthNetEarning,
        expectedSalary
      },
      overall: {
        totalPresentDays,
        totalAbsentDays,
        totalWorkedHours,
        attendancePercentage,
        totalSalary,
        totalKharchi,
        netEarning
      },
      today: {
        status: todayAttendance?.status || null,
        workedHours: todayAttendance?.workedHours || 0,
        earning: (todayAttendance?.workedHours || 0) * (worker.hourlyRate || 0)
      }
    });
  } catch (error) {
    console.error("Worker dashboard error:", error);
    throw error;
  }
};

// Get worker attendance history
export const getWorkerAttendanceHistory = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { limit = 30 } = req.query;

    const attendance = await Attendance.find({ workerId })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    return SUCCESS(res, "Attendance history", attendance);
  } catch (error) {
    console.error("Attendance history error:", error);
    throw error;
  }
};

// Get worker kharchi history
export const getWorkerKharchiHistory = async (req, res) => {
  try {
    const workerId = req.user.id;

    const kharchi = await Kharchi.find({ userId: workerId })
      .sort({ date: -1, createdAt: -1 });

    const totalKharchi = kharchi.reduce((sum, k) => sum + (k.amount || 0), 0);

    return SUCCESS(res, "Kharchi history", {
      kharchi,
      totalKharchi
    });
  } catch (error) {
    console.error("Kharchi history error:", error);
    throw error;
  }
};

// Get worker salary history
export const getWorkerSalaryHistory = async (req, res) => {
  try {
    const workerId = req.user.id;

    const salaries = await Salary.find({ workerId })
      .sort({ year: -1, month: -1 });

    const summary = {
      totalSalary: salaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0),
      totalKharchi: salaries.reduce((sum, s) => sum + (s.totalKharchi || 0), 0),
      totalNet: salaries.reduce((sum, s) => sum + (s.remainingSalary || 0), 0)
    };

    return SUCCESS(res, "Salary history", {
      salaries,
      summary
    });
  } catch (error) {
    console.error("Salary history error:", error);
    throw error;
  }
};