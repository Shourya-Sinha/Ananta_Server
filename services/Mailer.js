import { Resend } from "resend";
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    const result = await resend.emails.send({
      from: "Ananta Infratech Solutions <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", result);
    return true;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return false;
  }
}

export default sendEmail;



// import nodemailer from "nodemailer";

//  const sendMail = async (emailData) => {
//   const transports = [
//     {
//       name: "Gmail 465 (secure)",
//       config: {
//         host: "smtp.gmail.com",
//         port: 465,
//         secure: true,
//         auth: {
//           user: process.env.MAIL_ID,
//           pass: process.env.MAIL_PASSWORD,
//         },
//         family: 4, // Force IPv4
//       },
//     },
//     {
//       name: "Gmail 587 (TLS)",
//       config: {
//         host: "smtp.gmail.com",
//         port: 587,
//         secure: false,
//         auth: {
//           user: process.env.MAIL_ID,
//           pass: process.env.MAIL_PASSWORD,
//         },
//         tls: { rejectUnauthorized: false },
//         family: 4,
//       },
//     },
//   ];

//   let lastError = null;

//   for (const t of transports) {
//     try {
//       console.log(`🚀 Trying SMTP: ${t.name}`);
//       const transporter = nodemailer.createTransport(t.config);

//       const info = await transporter.sendMail({
//         from: `"Hey 👻" <${process.env.MAIL_ID}>`,
//         to: emailData.recipient,
//         subject: emailData.subject,
//         text: emailData.text,
//         html: emailData.html,
//       });

//       console.log(`✅ Email sent using: ${t.name}`);
//       return info;
//     } catch (err) {
//       console.error(`❌ Failed on ${t.name}:`, err.message);
//       lastError = err;
//     }
//   }

//   throw new Error("All SMTP transports failed: " + lastError?.message);
// };

// export default sendMail;


// import nodeMailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const sendMail = async(emailData)=>{
//     try {
//         let transporter = nodeMailer.createTransport({
//             host:"smtp.gmail.com",
//             port:465,
//             secure:true,
//             auth:{
//                 user:process.env.MAIL_ID,
//                 pass:process.env.MAIL_PASSWORD
//             }
//         });

//         let info = await transporter.sendMail({
//             from: '"Hey 👻" <info@maabhawanicon.com>',
//             to:emailData.recipient,
//             subject: emailData.subject,
//             text: emailData.text,
//             html: emailData.html,
//         });
//         return info;
//     } catch (error) {
//         console.error("Error sending email:", error);
//         throw error;
//     }
// }
// export default sendMail;