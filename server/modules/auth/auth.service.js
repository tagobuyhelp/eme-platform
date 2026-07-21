import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./auth.model.js";
import { createOtp, verifyOtp } from "./otp.store.js";
import { sendOtpSms } from "./sms.service.js";

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createHttpError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

async function ensureUser({ name, email, password, role }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) return null;

  const hashedPassword = await bcrypt.hash(String(password), 12);
  await User.create({
    name: String(name || "").trim() || normalizedEmail,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  return normalizedEmail;
}

export async function ensureDefaultUsers() {
  const created = [];

  const adminEmail = await ensureUser({
    name: process.env.DEFAULT_ADMIN_NAME,
    email: process.env.DEFAULT_ADMIN_EMAIL,
    password: process.env.DEFAULT_ADMIN_PASSWORD,
    role: "admin",
  });
  if (adminEmail) created.push({ role: "admin", email: adminEmail });

  const studentEmail = await ensureUser({
    name: process.env.DEFAULT_STUDENT_NAME,
    email: process.env.DEFAULT_STUDENT_EMAIL,
    password: process.env.DEFAULT_STUDENT_PASSWORD,
    role: "student",
  });
  if (studentEmail) created.push({ role: "student", email: studentEmail });

  return created;
}

// ─── Admin: email + password registration ────────────────────────────

export async function registerUser(data) {
  const name = data?.name;
  const email = data?.email;
  const password = data?.password;

  if (!name || !email || !password) {
    throw createHttpError(400, "name, email, and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw createHttpError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(String(password), 12);

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "student",
  });

  return user;
}

// ─── Admin: email + password login ───────────────────────────────────

export async function loginUser(data) {
  const email = data?.email;
  const password = data?.password;

  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  const safeUser = user.toObject();
  delete safeUser.password;

  return { token, user: safeUser };
}

// ─── Student: Phone + OTP ────────────────────────────────────────────

function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  // Support +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 10) {
    return cleaned;
  }
  throw createHttpError(400, "Please enter a valid 10-digit mobile number");
}

/**
 * Send OTP to a phone number.
 * Creates an OTP, stores it, and sends via SMS.
 */
export async function sendPhoneOtp(phone) {
  const normalizedPhone = normalizePhone(phone);

  const { otp } = createOtp(normalizedPhone);
  await sendOtpSms(normalizedPhone, otp);

  return { phone: normalizedPhone, message: "OTP sent successfully" };
}

/**
 * Verify OTP and login/register the student.
 * - If user exists with this phone → login
 * - If user doesn't exist → register with provided name
 */
export async function verifyPhoneOtp(phone, otp, name) {
  const normalizedPhone = normalizePhone(phone);

  // Verify the OTP (throws on failure)
  verifyOtp(normalizedPhone, otp);

  // Check if user already exists
  let user = await User.findOne({ phone: normalizedPhone });

  if (user) {
    // Existing user — login
    const token = signToken({ id: user._id.toString(), role: user.role });
    return { token, user: user.toObject(), isNewUser: false };
  }

  // New user — register
  if (!name || !String(name).trim()) {
    throw createHttpError(400, "Full name is required for new registration");
  }

  user = await User.create({
    name: String(name).trim(),
    phone: normalizedPhone,
    role: "student",
  });

  // Also create a Student profile linked to this user
  const { default: Student } = await import("../student/student.model.js");
  try {
    await Student.create({
      userId: user._id,
      fullName: String(name).trim(),
      email: "",
      phone: normalizedPhone,
      status: "pending",
    });
  } catch (profileErr) {
    console.warn("Failed to auto-create student profile:", profileErr.message);
  }

  const token = signToken({ id: user._id.toString(), role: user.role });
  return { token, user: user.toObject(), isNewUser: true };
}

/**
 * Verify MSG91 Widget Access Token and login/register student.
 */
export async function verifyMsg91WidgetToken(accessToken, name) {
  if (!accessToken) {
    throw createHttpError(400, "Access token is required");
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey || authKey === "your_auth_key_here") {
    throw createHttpError(500, "MSG91_AUTH_KEY is not configured on server");
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ "access-token": accessToken }),
    });

    const data = await res.json();

    if (data.type === "error") {
      throw createHttpError(401, data.message || "Invalid or expired MSG91 widget token");
    }

    // Extract phone number from various possible MSG91 payload structures
    const phoneRaw =
      data.mobile ||
      data.phone ||
      data.message?.mobile ||
      data.message?.phone ||
      data.data?.mobile ||
      (typeof data.message === "string" && data.message.match(/\d{10,12}/) ? data.message : null);

    if (!phoneRaw) {
      console.error("❌ Could not find mobile number in MSG91 response:", data);
      throw createHttpError(401, data.message || "Could not retrieve verified phone number from MSG91");
    }

    const normalizedPhone = normalizePhone(phoneRaw);

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });

    if (user) {
      const token = signToken({ id: user._id.toString(), role: user.role });
      return { token, user: user.toObject(), isNewUser: false };
    }

    user = await User.create({
      name: String(name || "Student").trim(),
      phone: normalizedPhone,
      role: "student",
    });

    const { default: Student } = await import("../student/student.model.js");
    try {
      await Student.create({
        userId: user._id,
        fullName: String(name || "Student").trim(),
        email: "",
        phone: normalizedPhone,
        status: "pending",
      });
    } catch (profileErr) {
      console.warn("Failed to auto-create student profile:", profileErr.message);
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    return { token, user: user.toObject(), isNewUser: true };
  } catch (err) {
    if (err.statusCode) throw err;
    throw createHttpError(500, "MSG91 widget token verification failed: " + err.message);
  }
}

// ─── Profile Management ─────────────────────────────────────────────

export async function updateProfile(userId, data) {
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (data.name) user.name = String(data.name).trim();
  if (data.profilePhoto !== undefined) user.profilePhoto = data.profilePhoto;

  await user.save();
  return user;
}

export async function updatePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(String(currentPassword), user.password);
  if (!isMatch) {
    throw createHttpError(401, "Incorrect current password");
  }

  user.password = await bcrypt.hash(String(newPassword), 12);
  await user.save();
  return true;
}

export default {
  registerUser,
  loginUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  verifyMsg91WidgetToken,
  updateProfile,
  updatePassword,
};
