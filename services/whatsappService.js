import axios from "axios";
import { WHATSAPP_API_URL, WHATSAPP_TOKEN } from "../config/whatsapp.js";

export async function sendWhatsAppMessage(phone, message) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    };

    const res = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (e) {
    console.log("WhatsApp Error:", e.response?.data || e);
    throw new Error("Failed to send WhatsApp message");
  }
}