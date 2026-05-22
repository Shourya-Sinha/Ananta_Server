import Site from "../models/Site.js";
import { ERROR, SUCCESS } from "../utils/response.js";
import { AppError } from "../utils/AppError.js";
import User from '../models/User.js';

// -----------------------------
// CREATE SITE
// -----------------------------
export const createSite = async (req, res) => {
  if (req.user.role !== "admin") {
    throw new AppError({
      message: "Only admin can create sites",
      statusCode: 403,
    });
  }

  const { name, address } = req.body;

  const exists = await Site.findOne({ name });
  if (exists) {
    throw new AppError({
      message: "Site already exists",
      statusCode: 409,
    });
  }

  const site = await Site.create({
    name,
    address,
    createdBy: req.user.id,
  });

  return SUCCESS(res, "Site created", site);
};

// -----------------------------
// GET ALL SITES
// -----------------------------
export const getAllSites = async (req, res) => {
  // const sites = await Site.find().sort({ createdAt: -1 });
  // return SUCCESS(res, "Sites fetched", sites);
  try {
    const sites = await Site.find().sort({ createdAt: -1 });

    // Get worker counts for each site
    const sitesWithCounts = await Promise.all(
      sites.map(async (site) => {
        const workerCount = await User.countDocuments({
          siteId: site._id,
          role: "worker"
        });
        return {
          ...site.toObject(),
          workerCount
        };
      })
    );
    console.log("all sites Data in sites controller", sitesWithCounts);

    return SUCCESS(res, "Sites Fetched", sitesWithCounts)

    // res.json({
    //   success: true,
    //   data: sitesWithCounts,
    //   message: "Sites retrieved successfully"
    // });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return ERROR(error, "Error Fetching in Controller")
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to fetch sites",
    //   error: error.message
    // });
  }
};

// -----------------------------
// GET SINGLE SITE
// -----------------------------
export const getSingleSite = async (req, res) => {
  const site = await Site.findById(req.params.id);
  try {
    if (!site) {
      throw new AppError({
        message: "Site not found",
        statusCode: 404,
      });
    }

    const workers = await User.find({
      siteId: site._id,
      role: "worker"
    }).select("name phone dailyRate Designationverify");


    // return SUCCESS(res, "Site fetched", site);

    const data = {
      ...site.toObject(),
      workers,
      workerCount: workers.length
    };

    return SUCCESS(res, "Site fetched", data);
  } catch (error) {

    return ERROR(error.message, "Failed to fetch Site",)

  }


};

// -----------------------------
// UPDATE SITE
// -----------------------------
export const updateSite = async (req, res) => {
  const site = await Site.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!site) {
    throw new AppError({
      message: "Site not found",
      statusCode: 404,
    });
  }

  return SUCCESS(res, "Site updated", site);
};

// -----------------------------
// DELETE SITE
// -----------------------------
export const deleteSite = async (req, res) => {
  const site = await Site.findById(req.params.id);

  if (!site) {
    throw new AppError({
      message: "Site not found",
      statusCode: 404,
    });
  }

  const workerCount = await User.countDocuments({
    siteId: site._id,
    role: "worker"
  });

  if (workerCount > 0) {
    // Option 1: Prevent deletion
    return res.status(400).json({
      success: false,
      message: `Cannot delete site with ${workerCount} workers assigned. Please reassign or remove workers first.`
    });

    // Option 2: Unassign workers (alternative)
    // await User.updateMany(
    //   { siteId: site._id },
    //   { $unset: { siteId: "" } }
    // );
  }

  await site.deleteOne();

  return SUCCESS(res, "Site deleted", null);
};

// -----------------------------
// ASSIGN WORKER TO SITE
// -----------------------------

// export const assignWokerToSite = async (req, res) => {
//   try {
//     const { siteId, workerId } = req.params;

//     const site = await Site.findById(siteId);
//     if (!site) {
//       return res.status(404).json({ success: false, message: "Site not found" });
//     }

//     const worker = await User.findById(workerId);
//     if (!worker || worker.role !== "worker") {
//       return res.status(404).json({ success: false, message: "Worker not found" });
//     }

//     worker.siteId = siteId;
//     worker.site = site.name; // Keep backward compatibility
//     await worker.save();

//     // Update site worker count
//     await site.updateWorkerCount();

//     return SUCCESS(res, "Site Assigned Success")
//   } catch (error) {
//     console.log("Error in controller", error.message)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to assign worker",
//       error: error.message
//     })
//   }
// }

// -----------------------------
// GET WORKER BY SITE
// -----------------------------
export const getWokerBySite = async (req, res) => {
  try {
    const workers = await User.find({
      siteId: req.params.siteId,
      role: "worker"
    }).select("name phone email dailyRate Designationverify createdAt");

    return SUCCESS(res, "Worker Fetched By Site", {
      data: workers,
      count: workers.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workers",
      error: error.message
    });
  }
}
