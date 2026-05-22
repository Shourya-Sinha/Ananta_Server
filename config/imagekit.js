import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

// Debug: Check if credentials are loaded
console.log("ImageKit Public Key:", process.env.IMAGEKIT_PUBLIC_KEY ? "✅ Loaded" : "❌ Missing");
console.log("ImageKit Private Key:", process.env.IMAGEKIT_PRIVATE_KEY ? "✅ Loaded" : "❌ Missing");
console.log("ImageKit URL Endpoint:", process.env.IMAGEKIT_URL_ENDPOINT ? "✅ Loaded" : "❌ Missing");

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC,
  privateKey: process.env.IMAGEKIT_PRIVATE,
  urlEndpoint: process.env.IMAGEKIT_URL,
});