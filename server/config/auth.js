import crypto from "crypto";
import { sendEmail } from "../utils/email.js";

// Generate OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send verification email (via central provider)
export const sendVerificationEmail = async (email, otp) => {
  const istNow = new Date(Date.now() + 330 * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const subject = 'Your AlgoBucks code (valid 60 min)';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Thanks for registering! Use this code to verify your email:</p>
      <h1 style="text-align:center; font-size:32px; letter-spacing:5px; margin:20px 0;">${otp}</h1>
      <p>It expires in <b>60 minutes</b>. If you didn’t start this, you can ignore this email.</p>
      <p style="color:#666;">Sent (IST): ${istNow}</p>
    </div>
  `;
  const text = `Your AlgoBucks verification code is ${otp}. It expires in 60 minutes.\nSent (IST): ${istNow}`;
  try {
    const result = await sendEmail({ to: email, subject, text, html });
    console.log("✅ Verification email queued:", result?.messageId || result?.message || 'ok');
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error?.message || error);
    return false;
  }
};

// Google OAuth configuration
export const googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL || "http://localhost:5000"}/api/auth/google/callback`,
  passReqToCallback: true,
};

// Generate random password for Google OAuth users
export const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Generate a unique username by appending random numbers if needed
export const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!username) username = "user" + Math.floor(Math.random() * 1000);

  let count = 1;
  let uniqueUsername = username;
  const User = (await import("../models/User.js")).default;

  while (true) {
    const existingUser = await User.findOne({ username: uniqueUsername });
    if (!existingUser) break;
    uniqueUsername = `${username}${count++}`;

    if (count > 100) {
      uniqueUsername = `${username}${Date.now()}`;
      break;
    }
  }

  return uniqueUsername;
};
