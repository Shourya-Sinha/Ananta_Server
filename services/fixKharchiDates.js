// scripts/fixKharchiDates.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Kharchi from "../models/Kharchi.js";

dotenv.config();

async function fixKharchiDates() {
    try {
        await mongoose.connect(process.env.MONGO_LOCAL_URI);
        console.log("Connected to database");
        
        const kharchis = await Kharchi.find({});
        console.log(`Found ${kharchis.length} kharchi records`);
        
        let fixed = 0;
        
        for (const kharchi of kharchis) {
            const originalDate = kharchi.date;
            
            // Check if date is in ISO format with time
            if (originalDate && originalDate.includes("T")) {
                const fixedDate = originalDate.split("T")[0];
                kharchi.date = fixedDate;
                await kharchi.save();
                console.log(`Fixed: ${originalDate} -> ${fixedDate}`);
                fixed++;
            }
        }
        
        console.log(`\n✅ Fixed ${fixed} kharchi records`);
        process.exit(0);
        
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixKharchiDates();