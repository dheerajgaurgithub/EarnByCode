import crypto from "crypto";
import sgMail from "@sendgrid/mail";

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL, // must be your verified sender email
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
        <h1 style="text-align: center; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
        <p>This OTP will expire in 1 hour.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Verification email sent successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error.response?.body || error.message);
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
