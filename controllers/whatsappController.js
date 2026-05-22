import axios from "axios";
import { SUCCESS } from "../utils/response.js";
import { WhatsAppSendFailed } from "../utils/errorFactory.js";

export const sendWhatsApp = async (req, res) => {
  const { phone, message } = req.body;

  try {
    const apiRes = await axios.post(
      "https://graph.facebook.com/v17.0/YOUR_META_ID/messages",
      {
        messaging_product: "whatsapp",
        to: phone,
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );

    return SUCCESS(res, "WhatsApp sent", apiRes.data);
  } catch (err) {
    throw WhatsAppSendFailed(err);
  }
};