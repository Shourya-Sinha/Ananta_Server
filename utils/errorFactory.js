import { AppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

// USER ERRORS
export const UserNotFound = () =>
  new AppError({
    message: "User not found",
    statusCode: ERROR_CODES.NOT_FOUND,
    type: "USER_NOT_FOUND"
  });

export const UserAlreadyExists = () =>
  new AppError({
    message: "User already exists",
    statusCode: ERROR_CODES.CONFLICT,
    type: "USER_ALREADY_EXISTS"
  });

export const InvalidPassword = () =>
  new AppError({
    message: "Invalid password",
    statusCode: ERROR_CODES.BAD_REQUEST,
    type: "INVALID_PASSWORD"
  });

// OTP ERRORS
export const OtpLimitReached = () =>
  new AppError({
    message: "OTP limit reached",
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS,
    type: "OTP_LIMIT_REACHED"
  });

// FILE UPLOAD
export const FileUploadError = (err) =>
  new AppError({
    message: "File upload failed",
    statusCode: ERROR_CODES.FILE_UPLOAD_ERROR,
    type: "FILE_UPLOAD_ERROR",
    details: err
  });

// OCR ERRORS
export const OcrFailed = (err) =>
  new AppError({
    message: "Failed to extract Aadhaar",
    statusCode: ERROR_CODES.OCR_ERROR,
    type: "OCR_FAILED",
    details: err
  });

// WhatsApp API error
export const WhatsAppSendFailed = (err) =>
  new AppError({
    message: "Failed to send WhatsApp message",
    statusCode: ERROR_CODES.WHATSAPP_ERROR,
    type: "WHATSAPP_SEND_FAILED",
    details: err
  });