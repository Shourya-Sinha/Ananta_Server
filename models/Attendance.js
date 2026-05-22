import mongoose from "mongoose";

const hourStatuses = Array.from({ length: 18 }, (_, i) => `P${i + 1}`);

const attendanceSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Site",
    default: null
  },

  // status: {
  //   type: String,
  //   enum: ["absent","", "P", "P1", "P2", "P3", "P4", "P5", "P6","Half_Day"],
  //   required: true
  // },
  status: {
    type: String,
    enum: ["absent", "P", ...hourStatuses, "Half_Day"],
    required: true
  },

  workedHours: {
    type: Number,
    required: true
  },

  salaryForTheDay: {
    type: Number,
    default: 0
  },

  date: {
    type: String,
    required: true
  },
  dailyRate: {
    type: Number,
    default: 0
  },

  hourlyRate: {
    type: Number,
    default: 0
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});


export default mongoose.model("Attendance", attendanceSchema);

// import mongoose from "mongoose";

// const attendanceSchema = new mongoose.Schema({
//   userId: mongoose.Types.ObjectId,
//   date: String,
//   status: String,
// });

// export default mongoose.model("Attendance", attendanceSchema);