// Site Schema - Updated
import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional: Add worker count for quick access (denormalized)
    workerCount: {
      type: Number,
      default: 0,
    },
    // Optional: Site status
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
    // Optional: Site budget or other metadata
    budget: {
      type: Number,
      default: 0,
    },
    startDate: Date,
    estimatedEndDate: Date,
  },
  { timestamps: true }
);

// Method to update worker count
siteSchema.methods.updateWorkerCount = async function() {
  const workerCount = await mongoose.model("User").countDocuments({
    siteId: this._id,
    role: "worker"
  });
  this.workerCount = workerCount;
  await this.save();
  return workerCount;
};

// Static method to get sites with worker counts
siteSchema.statics.getSitesWithWorkerCount = async function() {
  const sites = await this.find().sort({ createdAt: -1 });
  
  for (let site of sites) {
    await site.updateWorkerCount();
  }
  
  return sites;
};

export default mongoose.model("Site", siteSchema);

// import mongoose from "mongoose";

// const siteSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     address: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Site", siteSchema);