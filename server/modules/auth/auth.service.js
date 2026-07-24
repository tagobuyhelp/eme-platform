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
 * Checks if the candidate mobile number exists in DB first.
 */
export async function sendPhoneOtp(phone) {
  const normalizedPhone = normalizePhone(phone);

  // Candidate DB Whitelist Check
  const existingUser = await User.findOne({ phone: normalizedPhone });
  if (!existingUser) {
    throw createHttpError(
      404,
      "আপনার মোবাইল নম্বরটি ক্যান্ডিডেট তালিকায় পাওয়া যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
    );
  }

  const { otp } = createOtp(normalizedPhone);
  await sendOtpSms(normalizedPhone, otp);

  return { phone: normalizedPhone, message: "OTP sent successfully" };
}

/**
 * Verify OTP and log in the student.
 * - Requires mobile number to exist in DB (pre-registered candidate)
 */
export async function verifyPhoneOtp(phone, otp) {
  const normalizedPhone = normalizePhone(phone);

  // Candidate DB Whitelist Check
  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) {
    throw createHttpError(
      404,
      "আপনার মোবাইল নম্বরটি নিবন্ধিত ক্যান্ডিডেট তালিকায় পাওয়া যায়নি।"
    );
  }

  // Verify the OTP (throws on failure)
  verifyOtp(normalizedPhone, otp);

  // Ensure Student profile status is active for direct exam access
  const { default: Student } = await import("../student/student.model.js");
  let studentProfile = await Student.findOne({ userId: user._id });
  if (!studentProfile) {
    studentProfile = await Student.create({
      userId: user._id,
      fullName: user.name,
      phone: normalizedPhone,
      status: "active",
    });
  } else if (studentProfile.status !== "active") {
    studentProfile.status = "active";
    await studentProfile.save();
  }

  const token = signToken({ id: user._id.toString(), role: user.role });
  return { token, user: user.toObject(), isNewUser: false };
}

/**
 * Verify MSG91 Widget Access Token and login student.
 */
export async function verifyMsg91WidgetToken(accessToken) {
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

    // Candidate DB Whitelist Check
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      throw createHttpError(
        404,
        "আপনার মোবাইল নম্বরটি নিবন্ধিত ক্যান্ডিডেট তালিকায় পাওয়া যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
      );
    }

    const { default: Student } = await import("../student/student.model.js");
    let studentProfile = await Student.findOne({ userId: user._id });
    if (!studentProfile) {
      studentProfile = await Student.create({
        userId: user._id,
        fullName: user.name,
        phone: normalizedPhone,
        status: "active",
      });
    } else if (studentProfile.status !== "active") {
      studentProfile.status = "active";
      await studentProfile.save();
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    return { token, user: user.toObject(), isNewUser: false };
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
