import User from "../models/User.js";
import { ERROR, SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCodes.js";
import { CLOG, CERROR } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import sendEmail from "../services/Mailer.js";


function generateSecureOTP() {
  // Generates a cryptographically secure random integer between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
}

// ------------------------------
// Generate Tokens
// ------------------------------
function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
}

// ------------------------------
// REGISTER (Admin + Worker)
// ------------------------------
// export const register = async (req, res) => {
//   const { name, phone, password, role, email } = req.body;

//   CLOG("📥 REGISTER REQUEST:", {
//     name,
//     phone,
//     email,
//     role,
//     password
//   });

//     if (phone) {
//     let existsPhone = await User.findOne({ phone });
//     CLOG("🔍 Checking phone:", phone);

//     existsPhone = await User.findOne({ phone });

//     if (existsPhone) {
//       CLOG("❌ PHONE MATCH FOUND:", {
//         inputPhone: phone,
//         dbPhone: existsPhone.phone,
//         userId: existsPhone._id,
//       });

//       throw new AppError({
//         message: "Phone already exists",
//         statusCode: ERROR_CODES.CONFLICT,
//         type: "USER_ALREADY_EXISTS",
//       });
//     }
//   }

//   CLOG("🔍 Checking email:", email);

//   if (email) {
//   let existsEmail = await User.findOne({ email });

//     CLOG("🔍 Checking email:", email);

//     existsEmail = await User.findOne({ email });

//     if (existsEmail) {
//       CLOG("❌ EMAIL MATCH FOUND:", {
//         inputEmail: email,
//         dbEmail: existsEmail.email,
//         userId: existsEmail._id,
//       });

//       throw new AppError({
//         message: "Email Already Exists",
//         statusCode: ERROR_CODES.CONFLICT,
//         type: "USER_ALREADY_EXISTS",
//       });
//     }
//   }
//   const hashed = await bcrypt.hash(password, 10);

//   const otp = generateSecureOTP(); // 6 digit secure otp
//   CLOG("OTP GENERATED IN REGISTER CONTROLLER:", otp);

//   const hashedOTP = await bcrypt.hash(otp, 10);

//   const userData = {
//     name,
//     password: hashed,
//     role,
//     otp: hashedOTP,
//     otpExpiry: Date.now() + 10 * 60 * 1000,
//     isOtpAccVerified: false,
//     dailyRate: 0,            // Worker will not set
//     Designationverify: "Unverified",
//     idVerified: "Unverified"
//   };
//   if (phone) {
//   userData.phone = phone;
// }
// if (email) {
//   userData.email = email;
// }

// const newUser = await User.create(userData);

//   CLOG("NEW USER REGISTERED:", userData.phone);

//   // send email OTP
//   if (email) {
//     await sendMail({
//       to: email,
//       subject: "Verify your account",
//       // text: `Your OTP is ${otp}`,
//       html: `<h2>Your OTP is: ${otp}</h2>`
//     });
//     CLOG("OTP send in email-:", otp);
//   }

//   CLOG("USER REGISTERED, OTP SENT:", email || phone);

//   // if (err.code === 11000) {
//   //   console.error("🔥 Mongo Duplicate Error:", err.keyValue);

//   //   return res.status(409).json({
//   //     success: false,
//   //     message: `Duplicate value: ${JSON.stringify(err.keyValue)}`
//   //   });
//   // }

//   return SUCCESS(res, "User registered. Please verify OTP.", {
//     userId: userData._id
//   });




// };
export const register = async (req, res) => {
  try {
    const { name, phone, password, role, email } = req.body;

    CLOG("📥 REGISTER REQUEST:", { name, phone, email, role });

    /* -----------------------------------------
     CHECK PHONE
    ------------------------------------------ */
    if (phone) {
      const existsPhone = await User.findOne({ phone });
      if (existsPhone) {
        CLOG("❌ PHONE MATCH FOUND:", {
          inputPhone: phone,
          dbPhone: existsPhone.phone,
          userId: existsPhone._id,
        });

        throw new AppError({
          message: "Phone already exists",
          statusCode: ERROR_CODES.CONFLICT,
          type: "USER_ALREADY_EXISTS",
        });
      }
    }

    /* -----------------------------------------
     CHECK EMAIL
    ------------------------------------------ */
    if (email) {
      const existsEmail = await User.findOne({ email });
      if (existsEmail) {
        CLOG("❌ EMAIL MATCH FOUND:", {
          inputEmail: email,
          dbEmail: existsEmail.email,
          userId: existsEmail._id,
        });

        throw new AppError({
          message: "Email already exists",
          statusCode: ERROR_CODES.CONFLICT,
          type: "USER_ALREADY_EXISTS",
        });
      }
    }

    /* -----------------------------------------
     HASH PASSWORD + OTP
    ------------------------------------------ */
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateSecureOTP();
    CLOG("OTP GENERATED:", otp);

    const hashedOTP = await bcrypt.hash(otp, 10);

    /* -----------------------------------------
     BUILD USER DATA
    ------------------------------------------ */
    const userData = {
      name,
      password: hashedPassword,
      role,
      otp: hashedOTP,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      isOtpAccVerified: false,
      dailyRate: 0,
      Designationverify: "Unverified",
      idVerified: "Unverified",
    };

    if (phone) userData.phone = phone;
    if (email) userData.email = email;

    /* -----------------------------------------
     SAVE USER
    ------------------------------------------ */
    const newUser = await User.create(userData);

    CLOG("NEW USER REGISTERED:", {
      _id: newUser._id,
      phone: newUser.phone,
      email: newUser.email,
    });

    /* -----------------------------------------
     SEND OTP EMAIL IF EMAIL PRESENT
    ------------------------------------------ */
    try {
      if (email) {
        await sendEmail({
          from: "Ananta App <no-reply@test-y7zpl98rkvr45vx6.mlsender.net>", // MUST match MailerSend sender
          to: email,
          subject: "Verify your account",
          html: `<h2>Your OTP is: ${otp}</h2>`,
        });

        CLOG("📧 OTP Email Sent:", { email, otp });
      }
    } catch (error) {
      CLOG("Error in sending email ! Please try again later");

      await User.findByIdAndDelete(newUser._id);  // rollback

      return ERROR(
        res,
        error.message || "Failed to send OTP. Please try again later."
      );
    }


    CLOG("USER REGISTERED, OTP SENT TO:", email || phone);

    /* -----------------------------------------
     SUCCESS RESPONSE
    ------------------------------------------ */
    return SUCCESS(res, "User registered. Please verify OTP.", {
      userId: newUser._id,
    });

  } catch (error) {
    CLOG("🔥 REGISTER ERROR:", error);
    return ERROR(res, error.message || "Registration failed", 500, error);
  }
};

//------------------------------
// SEND OTP
// -----------------------------

export const sendOtp = async (req, res) => {
  const { phone, email } = req.body;

  let targetUser = null;
  let registerType = null;

  // --------------------------
  // CASE 1: Worker registration via phone
  // --------------------------
  if (phone) {
    targetUser = await User.findOne({ phone });

    if (targetUser)
      throw new AppError({
        message: "Worker already exists",
        statusCode: ERROR_CODES.CONFLICT,
        type: "USER_ALREADY_EXISTS",
      });

    registerType = "worker"; // sending OTP via phone
  }

  // --------------------------
  // CASE 2: Admin registration via email
  // --------------------------
  if (email) {
    targetUser = await User.findOne({ email });

    if (targetUser)
      throw new AppError({
        message: "Admin already exists",
        statusCode: ERROR_CODES.CONFLICT,
        type: "USER_ALREADY_EXISTS",
      });

    registerType = "admin"; // sending OTP via email
  }

  if (!registerType) {
    throw new AppError({
      message: "Phone or email required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_REQUEST",
    });
  }

  // --------------------------
  // NEW TEMP USER OBJECT (not saving yet)
  // --------------------------
  const otp = generateSecureOTP(); // 6 digit secure otp
  CLOG("OTP GENERATED IN SEND_OTP CONTROLLER:", otp);

  const hashedOTP = await bcrypt.hash(otp, 10);

  // Store temporary OTP in DB for phone/email
  // const tempData = {
  //   otp: hashedOTP,
  //   otpExpiry: Date.now() + 10 * 60 * 1000, // valid 10 minutes
  //   phone,
  //   email,
  // };

  // // Save in a temporary collection or enhance logic:
  // await User.updateOne(
  //   { phone: phone || null, email: email || null },
  //   tempData,
  //   { upsert: true }
  // );
  await User.updateOne(
    { phone: phone || null, email: email || null },
    {
      otp: hashedOTP,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      noOfSentOtp: 1,
    },
    { upsert: true }
  );

  // Send OTP via correct channel
  if (registerType === "worker") {
    CLOG("SENDING OTP TO PHONE:", phone);
    // TODO: use WhatsApp API or SMS gateway
  }

  if (registerType === "admin") {
    CLOG("SENDING OTP TO EMAIL:", email);

    await sendMail({
      to: email,
      subject: "Your OTP for Account Verification",
      // text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
            <h2>Your Verification Code</h2>
            <p>Use the OTP below to verify your account:</p>
            <h1 style="background:#f1f1f1; padding:10px; display:inline-block;">
               ${otp}
            </h1>
            <p>This code is valid for 10 minutes.</p>
        </div>
      `
    });
  }

  const responseData = {};

  if (process.env.NODE_ENV === "Development") {
    responseData.previewOtp = otp;
  }

  return SUCCESS(res, "OTP SENT SUCCESSFULLY", responseData);
}

//------------------------------
// VERIFY OTP
// -----------------------------
export const verifyOtp = async (req, res) => {
  const { phone, email, otp } = req.body;

  if (!otp) {
    throw new AppError({
      message: "OTP is required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "OTP_REQUIRED",
    });
  }

  let tempUser = null;

  // -----------------------------------
  // WORKER (Phone based)
  // -----------------------------------
  if (phone) {
    tempUser = await User.findOne({ phone });
    if (!tempUser) {
      throw new AppError({
        message: "User not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "USER_NOT_FOUND",
      });
    }
  }

  // -----------------------------------
  // ADMIN (Email based)
  // -----------------------------------
  if (email) {
    tempUser = await User.findOne({ email });
    if (!tempUser) {
      throw new AppError({
        message: "User not found",
        statusCode: ERROR_CODES.NOT_FOUND,
        type: "USER_NOT_FOUND",
      });
    }
  }

  // -----------------------------------
  // OTP expiry validation
  // -----------------------------------
  if (!tempUser.otpExpiry || tempUser.otpExpiry < Date.now()) {
    throw new AppError({
      message: "OTP expired",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "OTP_EXPIRED",
    });
  }

  // -----------------------------------
  // OTP hash comparison
  // -----------------------------------
  const otpValid = await bcrypt.compare(otp, tempUser.otp);
  if (!otpValid) {
    throw new AppError({
      message: "Invalid OTP",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_OTP",
    });
  }

  // -----------------------------------
  // OTP verification success
  // -----------------------------------
  tempUser.otp = null;
  tempUser.otpExpiry = null;
  tempUser.isOtpAccVerified = true;
  tempUser.otpAccVerifiedAt = new Date();

  // -----------------------------------
  // Auto Login (JWT + Cookies)
  // -----------------------------------
  const { accessToken, refreshToken } = generateTokens(tempUser);
  // const accessToken = jwt.sign(
  //   { id: tempUser._id, role: tempUser.role },
  //   process.env.JWT_SECRET,
  //   { expiresIn: process.env.JWT_COOKIE_EXPIRY }
  // );

  // const refreshToken = jwt.sign(
  //   { id: tempUser._id, role: tempUser.role },
  //   process.env.JWT_REFRESH_SECRET,
  //   { expiresIn: "7d" }
  // );

  // save refresh token in DB
  tempUser.refreshToken = refreshToken;
  await tempUser.save();

  CLOG("OTP VERIFIED & AUTO LOGIN:", phone || email);

  // -----------------------------------
  // Set Cookies
  // -----------------------------------
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "Development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "Development",
    sameSite: "strict",
    maxAge: 60 * 24 * 60 * 60 * 1000, // 7 days
  });

  // -----------------------------------
  // Final Response
  // -----------------------------------
  return SUCCESS(res, "OTP verified & logged in", {
    userId: tempUser._id,
    role: tempUser.role,
    otpVerified: true,
    autoLogin: true,
    accessToken,
    refreshToken,
    user: {
      id: tempUser._id,
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      role: tempUser.role,
    },
  });
};

// ------------------------------
// LOGIN CONTROLLER (Admin + Worker)
// ------------------------------
export const login = async (req, res) => {
  const { phone, email, password } = req.body;

  if (!phone && !email) {
    throw new AppError({
      message: "Phone or email is required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_REQUEST",
    });
  }

  // ---------------------------
  // FIND USER
  // ---------------------------
  let user = null;

  if (phone) {
    user = await User.findOne({ phone });
  } else if (email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "USER_NOT_FOUND",
    });
  }

  if (!user.isOtpAccVerified) {
    throw new AppError({
      message: "Please verify your account first",
      statusCode: ERROR_CODES.FORBIDDEN,
    });
  }

  // ---------------------------
  // PASSWORD CHECK
  // ---------------------------
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError({
      message: "Invalid password",
      statusCode: ERROR_CODES.UNAUTHORIZED,
      type: "INVALID_PASSWORD",
    });
  }

  // ---------------------------
  // GENERATE TOKENS
  // ---------------------------
  // const accessToken = jwt.sign(
  //   { id: user._id, role: user.role },
  //   process.env.JWT_SECRET,
  //   { expiresIn: "30d" }
  // );

  // const refreshToken = jwt.sign(
  //   { id: user._id, role: user.role },
  //   process.env.JWT_REFRESH_SECRET,
  //   { expiresIn: "60d" }
  // );
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  CLOG("LOGIN SUCCESS:", phone || email);

  // ---------------------------
  // SET COOKIES
  // ---------------------------
  const isDev = process.env.NODE_ENV === "Development";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // ---------------------------
  // SUCCESS RESPONSE
  // ---------------------------
  return SUCCESS(res, "Login successful", {
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
};

// export const refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return res.status(401).json({ success: false, message: "Refresh token missing" });
//     }

//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//     const newAccessToken = jwt.sign(
//       { id: decoded.id, role: decoded.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "15m" }
//     );

//     return res.json({
//       success: true,
//       accessToken: newAccessToken
//     });

//   } catch (err) {
//     return res.status(403).json({
//       success: false,
//       message: "Refresh token expired"
//     });
//   }
// };
// ------------------------------
// FORGOT PASSWORD (Admin + Worker)
// OTP via phone (worker) or email (admin)
// ------------------------------

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ success: false, message: "Missing refresh token" });

  const user = await User.findOne({ refreshToken });
  if (!user)
    return res.status(403).json({ success: false, message: "Invalid refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);

    // Save new refresh token
    user.refreshToken = newRefresh;
    await user.save();

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefresh
      },
    });

  } catch (err) {
    return res.status(403).json({ success: false, message: "Refresh token expired" });
  }
};

export const forgotPassword = async (req, res) => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    throw new AppError({
      message: "Phone or Email required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_REQUEST",
    });
  }

  // --------------------------------
  // FIND USER
  // --------------------------------
  let user = null;

  if (phone) {
    user = await User.findOne({ phone });
  } else if (email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "USER_NOT_FOUND",
    });
  }

  // --------------------------------
  // GENERATE OTP
  // --------------------------------
  const otp = generateSecureOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.resetOtp = hashedOtp;
  user.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 min validity
  await user.save();

  CLOG("RESET OTP GENERATED:", otp);

  // --------------------------------
  // SEND OTP
  // --------------------------------
  if (phone) {
    CLOG("SENDING OTP TO WORKER PHONE:", phone);
    // TODO: WhatsApp/SMS send
  }

  if (email) {
    CLOG("SENDING OTP TO ADMIN EMAIL:", email);
    // TODO: Nodemailer send
  }

  const responseData = {};
  if (process.env.NODE_ENV === "Development") {
    responseData.previewOtp = otp;
  }

  return SUCCESS(res, "Reset OTP sent successfully", responseData);
};

// ------------------------------
// RESET PASSWORD CONTROLLER
// ------------------------------
export const resetPassword = async (req, res) => {
  const { phone, email, otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    throw new AppError({
      message: "OTP and new password required",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "INVALID_REQUEST",
    });
  }

  // --------------------------------
  // FIND USER
  // --------------------------------
  let user = null;

  if (phone) user = await User.findOne({ phone });
  if (email) user = await User.findOne({ email });

  if (!user) {
    throw new AppError({
      message: "User not found",
      statusCode: ERROR_CODES.NOT_FOUND,
      type: "USER_NOT_FOUND",
    });
  }

  // --------------------------------
  // CHECK OTP EXPIRY
  // --------------------------------
  if (!user.resetOtpExpire || user.resetOtpExpire < Date.now()) {
    throw new AppError({
      message: "OTP expired",
      statusCode: ERROR_CODES.BAD_REQUEST,
      type: "OTP_EXPIRED",
    });
  }

  // --------------------------------
  // MATCH OTP WITH HASH
  // --------------------------------
  const validOtp = await bcrypt.compare(otp, user.resetOtp);
  if (!validOtp) {
    throw new AppError({
      message: "Invalid OTP",
      statusCode: ERROR_CODES.UNAUTHORIZED,
      type: "INVALID_OTP",
    });
  }

  // --------------------------------
  // UPDATE PASSWORD
  // --------------------------------
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetOtp = null;
  user.resetOtpExpire = null;

  await user.save();

  return SUCCESS(res, "Password reset successful");
};