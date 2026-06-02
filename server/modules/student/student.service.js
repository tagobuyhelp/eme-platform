import mongoose from "mongoose";

import Student from "./student.model.js";
import User from "../auth/auth.model.js";

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function ensureObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, `${fieldName} is invalid`);
  }
  return value;
}

export async function createStudent(data, userId) {
  ensureObjectId(userId, "userId");

  const fullName = data?.fullName;
  if (!fullName) {
    throw createHttpError(400, "fullName is required");
  }

  const user = await User.findById(userId).select("email").lean();
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const existing = await Student.findOne({ userId }).lean();
  if (existing) {
    throw createHttpError(409, "Student profile already exists for this user");
  }

  const student = await Student.create({
    userId,
    fullName: String(fullName).trim(),
    email: String(user.email).trim().toLowerCase(),
    phone: data?.phone ? String(data.phone).trim() : undefined,
    course: data?.course ? String(data.course).trim() : undefined,
    documents: Array.isArray(data?.documents) ? data.documents : [],
    status: data?.status || "pending",
  });

  return student;
}

export async function getAllStudents() {
  return Student.find().sort({ createdAt: -1 }).lean();
}

export async function getStudentById(id) {
  ensureObjectId(id, "id");
  const student = await Student.findById(id).lean();
  if (!student) {
    throw createHttpError(404, "Student not found");
  }
  return student;
}

export async function updateStudent(id, data) {
  ensureObjectId(id, "id");

  const allowed = {};

  if (data?.fullName !== undefined) allowed.fullName = String(data.fullName).trim();
  if (data?.phone !== undefined) allowed.phone = data.phone ? String(data.phone).trim() : "";
  if (data?.course !== undefined) allowed.course = data.course ? String(data.course).trim() : "";
  if (data?.status !== undefined) allowed.status = data.status;
  if (data?.studentId !== undefined) allowed.studentId = data.studentId ? String(data.studentId).trim() : undefined;
  if (data?.profilePhoto !== undefined) allowed.profilePhoto = data.profilePhoto ? String(data.profilePhoto).trim() : undefined;
  if (data?.documents !== undefined && Array.isArray(data.documents)) allowed.documents = data.documents;

  const student = await Student.findById(id);
  if (!student) {
    throw createHttpError(404, "Student not found");
  }

  Object.assign(student, allowed);
  await student.save();

  return student.toObject();
}

export default {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
};

