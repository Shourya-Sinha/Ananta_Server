import { imagekit } from "../config/imagekit.js";
import fs from "fs";

export async function uploadToImageKit(file) {
  const fileBuffer = fs.readFileSync(file.path);

  const uploaded = await imagekit.upload({
    file: fileBuffer,
    fileName: file.originalname,
    folder: "bhawani_app_uploads",
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    type: file.mimetype,
  };
}

export const uploadAPI = {
  uploadProfilePhoto: async (base64Image) => {
    // Ensure base64 string is properly formatted
    const formattedBase64 = base64Image.startsWith('data:image') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;
    
    return api.post("/upload/profile-photo", 
      { file: formattedBase64 },
      { timeout: 120000 } // 2 minutes timeout for image upload
    );
  },
  
  // ... other functions
};