import express from "express";
import { protect } from "../middleware/protect.js";
import { allowRoles } from "../middleware/role.js";
import { validate } from "../utils/validate.js";
import {
  createSite,
  getAllSites,
  getSingleSite,
  updateSite,
  deleteSite
} from "../controllers/siteController.js";

import {
  createSiteSchema,
  updateSiteSchema
} from "../validations/siteValidators.js";

const router = express.Router();

// Create site
router.post(
  "/",
  protect,
  allowRoles("admin"),
  validate(createSiteSchema),
  createSite
);

// Get all
router.get("/getallsites", protect, getAllSites);

// Get one
router.get("/:id", protect, getSingleSite);

// Update
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  validate(updateSiteSchema),
  updateSite
);

// Delete
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteSite
);

export default router;