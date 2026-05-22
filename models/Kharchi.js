// models/Kharchi.js - Updated
import mongoose from "mongoose";

const kharchiSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        default: ""
    },
    date: {
        type: String,
        default: () => new Date().toISOString().split("T")[0] // YYYY-MM-DD format
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for better query performance
kharchiSchema.index({ userId: 1, date: 1 });

export default mongoose.model("Kharchi", kharchiSchema);