import vision from "@google-cloud/vision";
import path from "path";

export const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), "gcloud-key.json"),
});