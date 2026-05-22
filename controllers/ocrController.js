
import { SUCCESS } from "../utils/response.js";
import { OcrFailed } from "../utils/errorFactory.js";
import { parseAadhaar } from "../utils/ocrHelper.js";

export const aadhaarOCR = async (req, res) => {
  try {
    const result = await parseAadhaar(req.file.path);
    return SUCCESS(res, "OCR success", result);
  } catch (err) {
    throw OcrFailed(err);
  }
};

// export async function extractAadhaar(req, res, next) {
//   try {
//     const imagePath = req.file.path;

//     const data = await parseAadhaar(imagePath);

//     res.json({ success: true, data });
//   } catch (err) {
//     next(err);
//   }
// }