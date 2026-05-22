import mongoose from "mongoose";
import validator from "validator";

const documentSchema = new mongoose.Schema({
  url: String,
  fileId: String,
  type: String,
  name: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Invalid email format"
    }
  },
  emergencyContact: {
    type: String
  },
  password: String,

  otp: String,
  noOfSentOtp: {
    type: Number,
    max: 3
  },
  otpExpiry: {
    type: Date
  },
  isOtpAccVerified: {
    type: Boolean,
    default: false
  },
  otpAccVerifiedAt: {
    type: Date
  },

  role: { type: String, enum: ["admin", "worker", "partner"], default: "worker" },
  partnerDetails: {
    companyName: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    investmentPercentage: { type: Number, default: 0 },
    profitShare: { type: Number, default: 0 }
  },

  site: { type: String, default: "" },
  dailyRate: { type: Number, default: 0 },

  // Worker Designation Verification  
  designation: {
    type: String
  },
  Designationverify: {
    type: String,
    enum: ["Verified", "Unverified", "Processing", "Fail"],
    default: "Unverified",
  },
  DesignationVerifiedBy: String,
  DesignationVerifiedAt: Date,

    photo: documentSchema,

  // Aadhaar - FIXED: Use document schema (not String)
  aadhaarFront: documentSchema,
  aadhaarBack: documentSchema,

  // Additional Documents
  panCard: documentSchema,
  drivingLicense: documentSchema,
  selfVideo: {
    url: String,
    fileId: String,
    type: String,
    name: String,
    size: Number,
    duration: Number, // in seconds
    thumbnailUrl: String,
    uploadedAt: { type: Date, default: Date.now },
  },

  // Additional IDs (PAN, Driving License, etc.)
  panCard: documentSchema,
  drivingLicense:documentSchema,

  // Bank Details
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String,
  },

  // Work Experience
  experience: [{
    company: String,
    role: String,
    fromDate: Date,
    toDate: Date,
    certificate: {
      url: String,
      fileId: String,
      type: String,
      name: String,
    }
  }],
  address: {
    type: String
  },

  // ID Verification Status
  idVerified: {
    type: String,
    enum: ["Verified", "Unverified", "Fail"],
    default: "Unverified",
  },

  idVerifiedBy: String,
  idVerifiedAt: Date,

  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: "Site",
    // required: function () {
    //   return this.role === "worker"; // Required for workers
    // }
  },

  // Keep for backward compatibility
  site: { type: String, default: "" },

  // For additional PDFs or images
  documents: [documentSchema],

  totalKharchi: { type: Number, default: 0 },

  // Password Reset Fields
  resetToken: String,
  resetTokenExpiry: Date,

  // Refresh Token
  refreshToken: String,
}, { timestamps: true });


export default mongoose.model("User", userSchema);