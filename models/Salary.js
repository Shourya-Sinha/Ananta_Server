import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  month: { type: Number, required: true }, // 1–12
  year: { type: Number, required: true },

  totalPresentDays: { type: Number, default: 0 },
  totalAbsentDays: { type: Number, default: 0 },

  // Slab counters
  P: { type: Number, default: 0 },
  P1: { type: Number, default: 0 },
  P2: { type: Number, default: 0 },
  P3: { type: Number, default: 0 },
  P4: { type: Number, default: 0 },
  P5: { type: Number, default: 0 },
  P6: { type: Number, default: 0 },
  P7: { type: Number, default: 0 },
  P8: { type: Number, default: 0 },
  P9: { type: Number, default: 0 },
  P10: { type: Number, default: 0 },
  P11: { type: Number, default: 0 },
  P12: { type: Number, default: 0 },
  P13: { type: Number, default: 0 },
  P14: { type: Number, default: 0 },
  P15: { type: Number, default: 0 },
  P16: { type: Number, default: 0 },
  P17: { type: Number, default: 0 },
  P18: { type: Number, default: 0 },

  // Amounts
  dailyRate: Number,
  totalEarnings: Number,

  // Kharchi deduction
  totalKharchi: Number,
  remainingSalary: Number,

  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Salary", salarySchema);