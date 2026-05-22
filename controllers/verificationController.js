// controllers/verificationController.js
import User from "../models/User.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";

export const DESIGNATION_OPTIONS = [
  { value: "Laborer", label: "🏗️ Laborer", category: "General" },
  { value: "Carpenter", label: "🪚 Carpenter", category: "Skilled" },
  { value: "Plumber", label: "🔧 Plumber", category: "Skilled" },
  { value: "Electrician", label: "⚡ Electrician", category: "Skilled" },
  { value: "Mason", label: "🧱 Mason", category: "Skilled" },
  { value: "Painter", label: "🎨 Painter", category: "Skilled" },
  { value: "Welder", label: "🔥 Welder", category: "Skilled" },
  { value: "Operator", label: "🚜 Equipment Operator", category: "Heavy Equipment" },
  { value: "Driver", label: "🚛 Driver", category: "Transport" },
  { value: "Supervisor", label: "👔 Supervisor", category: "Management" },
  { value: "Site Engineer", label: "📐 Site Engineer", category: "Management" },
  { value: "Safety Officer", label: "🛡️ Safety Officer", category: "Management" },
  { value: "Store Keeper", label: "📦 Store Keeper", category: "Support" },
  { value: "Security", label: "🔒 Security", category: "Support" },
  { value: "Helper", label: "🤝 Helper", category: "General" },
];

export const getDesignationOptions = async (req, res) => {
  try {
    return SUCCESS(res, "Designation options fetched", DESIGNATION_OPTIONS);
  } catch (error) {
    throw error;
  }
};

// Get worker's current designation
export const getWorkerDesignation = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select("designation Designationverify DesignationVerifiedBy DesignationVerifiedAt");
    if (!worker) {
      throw new AppError({
        message: "Worker not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "WORKER_NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Worker designation fetched", {
      designation: worker.designation || "",
      verificationStatus: worker.Designationverify,
      verifiedBy: worker.DesignationVerifiedBy,
      verifiedAt: worker.DesignationVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};

// Update designation and verification together
export const updateWorkerDesignation = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { designation, status, statusNote } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can update designation",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    const validStatuses = ["Verified", "Unverified", "Processing", "Fail"];
    if (status && !validStatuses.includes(status)) {
      throw new AppError({
        message: "Invalid status. Must be Verified, Unverified, Processing, or Fail",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_STATUS"
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
    
    // Update designation if provided
    if (designation !== undefined) {
      worker.designation = designation;
    }
    
    // Update verification status if provided
    if (status) {
      worker.Designationverify = status;
      worker.DesignationVerifiedBy = req.user.id;
      worker.DesignationVerifiedAt = new Date();
    }
    
    await worker.save();
    
    return SUCCESS(res, "Worker designation updated", {
      designation: worker.designation,
      verificationStatus: worker.Designationverify,
      verifiedBy: worker.DesignationVerifiedBy,
      verifiedAt: worker.DesignationVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};

// Update just the verification status
export const updateDesignationVerification = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can update designation verification",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    const validStatuses = ["Verified", "Unverified", "Processing", "Fail"];
    if (!validStatuses.includes(status)) {
      throw new AppError({
        message: "Invalid status. Must be Verified, Unverified, Processing, or Fail",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_STATUS"
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
    
    worker.Designationverify = status;
    worker.DesignationVerifiedBy = req.user.id;
    worker.DesignationVerifiedAt = new Date();
    await worker.save();
    
    return SUCCESS(res, `Designation verification updated to ${status}`, {
      status: worker.Designationverify,
      verifiedBy: worker.DesignationVerifiedBy,
      verifiedAt: worker.DesignationVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};


// ============================================
// ACCOUNT VERIFICATION (OTP BASED)
// ============================================

// Get account verification status
export const getAccountVerificationStatus = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select("isOtpAccVerified otpAccVerifiedAt");
    if (!worker) {
      throw new AppError({
        message: "Worker not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "WORKER_NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Account verification status", {
      isVerified: worker.isOtpAccVerified,
      verifiedAt: worker.otpAccVerifiedAt,
      status: worker.isOtpAccVerified ? "Verified" : "Unverified"
    });
  } catch (error) {
    throw error;
  }
};

// Admin manually verify account (bypass OTP)
export const adminVerifyAccount = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can verify accounts",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
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
    
    worker.isOtpAccVerified = true;
    worker.otpAccVerifiedAt = new Date();
    await worker.save();
    
    return SUCCESS(res, "Account verified successfully", {
      isVerified: worker.isOtpAccVerified,
      verifiedAt: worker.otpAccVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};

// ============================================
// DESIGNATION VERIFICATION (ADMIN APPROVAL)
// ============================================

// Get designation verification status
export const getDesignationVerificationStatus = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select("Designationverify DesignationVerifiedBy DesignationVerifiedAt");
    if (!worker) {
      throw new AppError({
        message: "Worker not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "WORKER_NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "Designation verification status", {
      status: worker.Designationverify,
      verifiedBy: worker.DesignationVerifiedBy,
      verifiedAt: worker.DesignationVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};

// ============================================
// ID VERIFICATION (AADHAAR/DOCUMENTS)
// ============================================

// Get ID verification status
export const getIdVerificationStatus = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select("idVerified idVerifiedBy idVerifiedAt aadhaarFront aadhaarBack photo");
    if (!worker) {
      throw new AppError({
        message: "Worker not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "WORKER_NOT_FOUND"
      });
    }
    
    return SUCCESS(res, "ID verification status", {
      status: worker.idVerified,
      verifiedBy: worker.idVerifiedBy,
      verifiedAt: worker.idVerifiedAt,
      hasAadhaarFront: !!worker.aadhaarFront?.url,
      hasAadhaarBack: !!worker.aadhaarBack?.url,
      hasPhoto: !!worker.photo?.url
    });
  } catch (error) {
    throw error;
  }
};

// Update ID verification (Admin only)
export const updateIdVerification = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, remarks } = req.body;
    
    if (req.user.role !== "admin") {
      throw new AppError({
        message: "Only admin can update ID verification",
        statusCode: ERROR_CODES.FORBIDDEN,
        type: "FORBIDDEN"
      });
    }
    
    const validStatuses = ["Verified", "Unverified", "Fail"];
    if (!validStatuses.includes(status)) {
      throw new AppError({
        message: "Invalid status. Must be Verified, Unverified, or Fail",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_STATUS"
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
    
    worker.idVerified = status;
    worker.idVerifiedBy = req.user.id;
    worker.idVerifiedAt = new Date();
    await worker.save();
    
    return SUCCESS(res, `ID verification updated to ${status}`, {
      status: worker.idVerified,
      verifiedBy: worker.idVerifiedBy,
      verifiedAt: worker.idVerifiedAt
    });
  } catch (error) {
    throw error;
  }
};

// ============================================
// COMPLETE WORKER VERIFICATION STATUS
// ============================================

export const getCompleteVerificationStatus = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select(
      "isOtpAccVerified otpAccVerifiedAt Designationverify DesignationVerifiedBy DesignationVerifiedAt idVerified idVerifiedBy idVerifiedAt aadhaarFront aadhaarBack photo name email phone"
    );
    
    if (!worker) {
      throw new AppError({
        message: "Worker not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "WORKER_NOT_FOUND"
      });
    }
    
    const verificationStatus = {
      account: {
        status: worker.isOtpAccVerified ? "Verified" : "Unverified",
        verifiedAt: worker.otpAccVerifiedAt,
        description: "Email/Phone verification via OTP"
      },
      designation: {
        status: worker.Designationverify,
        verifiedBy: worker.DesignationVerifiedBy,
        verifiedAt: worker.DesignationVerifiedAt,
        description: "Admin approves worker's designation/skills"
      },
      idDocument: {
        status: worker.idVerified,
        verifiedBy: worker.idVerifiedBy,
        verifiedAt: worker.idVerifiedAt,
        hasDocuments: !!(worker.aadhaarFront?.url || worker.aadhaarBack?.url),
        description: "Aadhaar/ID card verification"
      }
    };
    
    // Calculate overall verification percentage
    let verifiedCount = 0;
    let totalCount = 3;
    
    if (verificationStatus.account.status === "Verified") verifiedCount++;
    if (verificationStatus.designation.status === "Verified") verifiedCount++;
    if (verificationStatus.idDocument.status === "Verified") verifiedCount++;
    
    const overallProgress = (verifiedCount / totalCount) * 100;
    
    return SUCCESS(res, "Complete verification status", {
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone
      },
      verificationStatus,
      overallProgress,
      summary: {
        verifiedCount,
        totalCount,
        isFullyVerified: verifiedCount === totalCount
      }
    });
  } catch (error) {
    throw error;
  }
};