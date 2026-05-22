// models/SiteFinance.js
import mongoose from "mongoose";

const siteFinanceSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Site",
    required: true
  },
  
  month: {
    type: Number,
    required: true // 1-12
  },
  
  year: {
    type: Number,
    required: true
  },
  
  // Revenue from the site
  revenue: {
    type: Number,
    default: 0
  },
  
  // Expenses
  expenses: {
    workerSalaries: { type: Number, default: 0 },
    kharchi: { type: Number, default: 0 },
    materialCost: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 }
  },
  
  // Money released/paid
  moneyReleased: {
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ["cash", "bank", "cheque"], default: "bank" },
    transactionId: { type: String, default: "" }
  },
  
  // Financial summary
  totalExpenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  
  // Status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "audited"],
    default: "pending"
  },
  
  notes: { type: String, default: "" },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

// Compound index for unique site-month-year
siteFinanceSchema.index({ siteId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("SiteFinance", siteFinanceSchema);