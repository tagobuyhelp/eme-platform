import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./auth.model.js";

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
  updateProfile,
  updatePassword,
};
