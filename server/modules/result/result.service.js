import mongoose from "mongoose";

import Result from "./result.model.js";

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

export async function createResult({ studentId, examId, score, status }) {
  ensureObjectId(studentId, "studentId");
  ensureObjectId(examId, "examId");

  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    throw createHttpError(400, "score is invalid");
  }
  if (status !== "pass" && status !== "fail") {
    throw createHttpError(400, "status is invalid");
  }

  const existing = await Result.findOne({ studentId, examId }).lean();
  if (existing) {
    return existing;
  }

  const result = await Result.create({ studentId, examId, score, status });
  return result.toObject();
}

export async function getStudentResults(studentId) {
  ensureObjectId(studentId, "studentId");
  return Result.find({ studentId }).sort({ createdAt: -1 }).lean();
}

export async function getAllResults(filter = {}) {
  const query = {};
  if (filter.examId && filter.examId !== "all") {
    if (mongoose.Types.ObjectId.isValid(filter.examId)) {
      query.examId = filter.examId;
    }
  }
  return Result.find(query)
    .populate("studentId", "fullName email")
    .populate("examId", "title")
    .sort({ createdAt: -1 })
    .lean();
}

export default {
  createResult,
  getStudentResults,
  getAllResults,
};

