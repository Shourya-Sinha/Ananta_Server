import { visionClient } from "../config/ocr.js";

export async function parseAadhaar(imagePath) {
  const [result] = await visionClient.textDetection(imagePath);
  const detections = result.textAnnotations;

  const fullText = detections[0]?.description || "";

  const nameMatch = fullText.match(/([A-Z][a-z]+\s[A-Z][a-z]+)/);
  const dobMatch = fullText.match(/(\d{2}\/\d{2}\/\d{4})/);
  const aadhaarMatch = fullText.replace(/\s/g, "").match(/\d{4}\d{4}\d{4}/);

  return {
    name: nameMatch?.[1] || "",
    dob: dobMatch?.[1] || "",
    aadhaarNumber: aadhaarMatch?.[0] || "",
    rawText: fullText,
  };
}