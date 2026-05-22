// routes/uploadRoutes.js
import express from "express";
import {
  uploadProfilePhoto,
  uploadAadhaar,
  uploadSelfVideo,
  uploadDocument,
  getUserDocuments,
  deleteDocument,
  updateBankDetails,
  updateSkills
} from "../controllers/uploadController.js";
import { protect } from "../middleware/protect.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Document uploads
router.post("/profile-photo", asyncWrapper(uploadProfilePhoto));
router.post("/aadhaar", asyncWrapper(uploadAadhaar));
router.post("/self-video", asyncWrapper(uploadSelfVideo));
router.post("/document", asyncWrapper(uploadDocument));

// Get all documents
router.get("/documents", asyncWrapper(getUserDocuments));


// Delete document - separate routes for different types
router.delete("/photo", asyncWrapper((req, res) => deleteDocument(req, res, "profilePhoto")));
router.delete("/aadhaar-front", asyncWrapper((req, res) => deleteDocument(req, res, "aadhaarFront")));
router.delete("/aadhaar-back", asyncWrapper((req, res) => deleteDocument(req, res, "aadhaarBack")));
router.delete("/pan-card", asyncWrapper((req, res) => deleteDocument(req, res, "panCard")));
router.delete("/driving-license", asyncWrapper((req, res) => deleteDocument(req, res, "drivingLicense")));
router.delete("/self-video", asyncWrapper((req, res) => deleteDocument(req, res, "selfVideo")));
router.delete("/:documentId", asyncWrapper((req, res) => deleteDocument(req, res, "document")));

// Update information
router.put("/bank-details", asyncWrapper(updateBankDetails));
router.put("/skills", asyncWrapper(updateSkills));

export default router;