// controllers/uploadController.js
import imagekit from "../services/imagekit.js";
import User from "../models/User.js";
import { SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import fs from "fs";
import path from "path";

// Generate user-specific folder path
const getUserFolder = (userId) => `anantaDocs/users/${userId}`;

// Helper to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Helper to check file type
const getFileType = (mimetype, filename) => {
  if (mimetype?.startsWith("image/")) return "image";
  if (mimetype?.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  const ext = getFileExtension(filename);
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
  return "document";
};

// Validate file size
const validateFileSize = (fileSize, type) => {
  const limits = {
    image: 5 * 1024 * 1024, // 5MB
    pdf: 10 * 1024 * 1024,  // 10MB
    video: 150 * 1024 * 1024 // 150MB for 3-minute video
  };

  const maxSize = limits[type] || 5 * 1024 * 1024;
  if (fileSize > maxSize) {
    throw new AppError({
      message: `File size exceeds limit. Max ${maxSize / (1024 * 1024)}MB`,
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "FILE_TOO_LARGE"
    });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { file } = req.body;

    if (!file) {
      throw new AppError({
        message: "No file provided",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "NO_FILE"
      });
    }

    const userFolder = getUserFolder(userId);
    const fileName = `profile_${Date.now()}.jpg`;

    const uploadResult = await imagekit.upload({
      file: file, // base64 string or buffer
      fileName: fileName,
      folder: userFolder,
      tags: ["profile", userId],
      useUniqueFileName: true,
    });

    const documentData = {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      type: 'image',
      name: fileName,
      size: uploadResult.size,
      uploadedAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { photo: documentData } },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return SUCCESS(res, "Profile photo uploaded successfully", {
      photo: user.photo
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);
    throw error;
  }
};

// Upload Aadhaar document
export const uploadAadhaar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, file } = req.body; // type: 'front' or 'back'

    if (!file || !type) {
      throw new AppError({
        message: "File and type (front/back) required",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "MISSING_REQUIRED"
      });
    }

    const userFolder = getUserFolder(userId);
    const fileName = `aadhaar_${type}_${Date.now()}.jpg`;

    const uploadResult = await imagekit.upload({
      file: file,
      fileName: fileName,
      folder: userFolder,
      tags: ["aadhaar", type, userId],
      useUniqueFileName: true,
    });

    const documentData = {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      type: 'image',
      name: fileName,
      size: uploadResult.size,
      uploadedAt: new Date()
    };

    const updateField = type === 'front' ? 'aadhaarFront' : 'aadhaarBack';

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { [updateField]: documentData } },
      { new: true, runValidators: true } // FIXED: Use 'new' instead of deprecated option
    ).select("-password -refreshToken");

    return SUCCESS(res, `Aadhaar ${type} uploaded successfully`, {
      aadhaar: user[updateField]
    });
  } catch (error) {
    console.error("Aadhaar upload error:", error);
    throw error;
  }
};

// Upload self introduction video
export const uploadSelfVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { file, duration } = req.body;

    if (!file) {
      throw new AppError({
        message: "No video file provided",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "NO_FILE"
      });
    }

    // Validate video duration (max 3 minutes = 180 seconds)
    if (duration && duration > 180) {
      throw new AppError({
        message: "Video duration cannot exceed 3 minutes",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "VIDEO_TOO_LONG"
      });
    }

    const userFolder = getUserFolder(userId);
    const fileName = `self_intro_${Date.now()}.mp4`;

    const uploadResult = await imagekit.upload({
      file: file,
      fileName: fileName,
      folder: userFolder,
      tags: ["self_video", userId],
      useUniqueFileName: true,
    });

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'selfVideo.url': uploadResult.url,
          'selfVideo.fileId': uploadResult.fileId,
          'selfVideo.type': 'video',
          'selfVideo.name': fileName,
          'selfVideo.size': uploadResult.size,
          'selfVideo.duration': duration || 0,
          'selfVideo.thumbnailUrl': uploadResult.thumbnailUrl || null
        }
      },
      { new: true }
    ).select("-password -refreshToken");

    return SUCCESS(res, "Self introduction video uploaded successfully", {
      selfVideo: user.selfVideo
    });
  } catch (error) {
    console.error("Self video upload error:", error);
    throw error;
  }
};

// Upload general document
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, file, name } = req.body;

    const validTypes = ['panCard', 'drivingLicense', 'certificate', 'other'];
    if (!validTypes.includes(documentType)) {
      throw new AppError({
        message: "Invalid document type",
        statusCode: ERROR_CODES.BAD_REQUEST,
        type: "INVALID_TYPE"
      });
    }

    const userFolder = getUserFolder(userId);
    const docFolder = `${userFolder}/documents`;
    const fileName = `${documentType}_${Date.now()}${path.extname(name) || '.jpg'}`;

    const uploadResult = await imagekit.upload({
      file: file,
      fileName: fileName,
      folder: docFolder,
      tags: [documentType, userId],
      useUniqueFileName: true,
    });

    const documentData = {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      type: 'image',
      name: name || fileName,
      size: uploadResult.size,
      uploadedAt: new Date()
    };

    let updateQuery = {};

    if (documentType === 'panCard') {
      updateQuery = { $set: { panCard: documentData } };
    } else if (documentType === 'drivingLicense') {
      updateQuery = { $set: { drivingLicense: documentData } };
    } else {
      updateQuery = { $push: { documents: documentData } };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateQuery,
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return SUCCESS(res, `${documentType} uploaded successfully`, {
      document: documentType === 'other' ? user.documents?.slice(-1)[0] : user[documentType]
    });
  } catch (error) {
    console.error("Document upload error:", error);
    throw error;
  }
};

// Get all user documents
export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "photo aadhaarFront aadhaarBack selfVideo panCard drivingLicense documents"
    );

    return SUCCESS(res, "User documents fetched", {
      profilePhoto: user.photo,
      aadhaarFront: user.aadhaarFront,
      aadhaarBack: user.aadhaarBack,
      selfVideo: user.selfVideo,
      panCard: user.panCard,
      drivingLicense: user.drivingLicense,
      documents: user.documents
    });
  } catch (error) {
    console.error("Get documents error:", error);
    throw error;
  }
};

// Delete document from ImageKit and MongoDB
export const deleteDocument = async (req, res, documentType) => {
  try {
    const userId = req.user.id;
    // For regular document deletion, get documentId from params
    const documentId = req.params.documentId;

    let fileId = null;
    let updateQuery = {};

    const user = await User.findById(userId);

    switch (documentType) {
      case 'profilePhoto':
        fileId = user.photo?.fileId;
        updateQuery = { $unset: { photo: "" } };
        break;
      case 'aadhaarFront':
        fileId = user.aadhaarFront?.fileId;
        updateQuery = { $unset: { aadhaarFront: "" } };
        break;
      case 'aadhaarBack':
        fileId = user.aadhaarBack?.fileId;
        updateQuery = { $unset: { aadhaarBack: "" } };
        break;
      case 'selfVideo':
        fileId = user.selfVideo?.fileId;
        updateQuery = { $unset: { selfVideo: "" } };
        break;
      case 'panCard':
        fileId = user.panCard?.fileId;
        updateQuery = { $unset: { panCard: "" } };
        break;
      case 'drivingLicense':
        fileId = user.drivingLicense?.fileId;
        updateQuery = { $unset: { drivingLicense: "" } };
        break;
      case 'document':
        const doc = user.documents.id(documentId);
        if (doc) {
          fileId = doc.fileId;
          updateQuery = { $pull: { documents: { _id: documentId } } };
        }
        break;
      default:
        throw new AppError({
          message: "Invalid document type",
          statusCode: ERROR_CODES.BAD_REQUEST,
          type: "INVALID_TYPE"
        });
    }

    if (fileId) {
      // Delete from ImageKit
      await imagekit.deleteFile(fileId);
    }

    await User.findByIdAndUpdate(userId, updateQuery);

    return SUCCESS(res, "Document deleted successfully");
  } catch (error) {
    console.error("Delete document error:", error);
    throw error;
  }
};

// Update bank details
export const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountNumber, ifscCode, bankName, accountHolderName, upiId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          bankDetails: {
            accountNumber,
            ifscCode,
            bankName,
            accountHolderName,
            upiId
          }
        }
      },
      { new: true }
    ).select("bankDetails");

    return SUCCESS(res, "Bank details updated successfully", {
      bankDetails: user.bankDetails
    });
  } catch (error) {
    console.error("Update bank details error:", error);
    throw error;
  }
};

// Update skills
export const updateSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { skills } },
      { new: true }
    ).select("skills");

    return SUCCESS(res, "Skills updated successfully", {
      skills: user.skills
    });
  } catch (error) {
    console.error("Update skills error:", error);
    throw error;
  }
};