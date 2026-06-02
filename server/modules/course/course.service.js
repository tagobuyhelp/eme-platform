import mongoose from "mongoose";
import Course from "./course.model.js";

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

export async function createCourse(data) {
  const { title, category, description, duration, status } = data;

  if (!title || !category) {
    throw createHttpError(400, "Title and category are required");
  }

  const existing = await Course.findOne({ title: String(title).trim() }).lean();
  if (existing) {
    throw createHttpError(409, "Course with this title already exists");
  }

  const course = await Course.create({
    title: String(title).trim(),
    category: String(category).trim(),
    description: description ? String(description).trim() : undefined,
    duration: duration ? String(duration).trim() : undefined,
    status: status || "active",
  });

  return course;
}

export async function getAllCourses(query = {}) {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  
  return Course.find(filter).sort({ category: 1, title: 1 }).lean();
}

export async function getCourseById(id) {
  ensureObjectId(id, "id");
  const course = await Course.findById(id).lean();
  if (!course) {
    throw createHttpError(404, "Course not found");
  }
  return course;
}

export async function updateCourse(id, data) {
  ensureObjectId(id, "id");

  const allowed = {};

  if (data?.title !== undefined) allowed.title = String(data.title).trim();
  if (data?.category !== undefined) allowed.category = String(data.category).trim();
  if (data?.description !== undefined) allowed.description = String(data.description).trim();
  if (data?.duration !== undefined) allowed.duration = String(data.duration).trim();
  if (data?.status !== undefined) allowed.status = data.status;

  const course = await Course.findById(id);
  if (!course) {
    throw createHttpError(404, "Course not found");
  }

  if (allowed.title && allowed.title !== course.title) {
    const existing = await Course.findOne({ title: allowed.title }).lean();
    if (existing && existing._id.toString() !== id) {
       throw createHttpError(409, "Another course with this title already exists");
    }
  }

  Object.assign(course, allowed);
  await course.save();

  return course.toObject();
}

export async function deleteCourse(id) {
  ensureObjectId(id, "id");
  const course = await Course.findByIdAndDelete(id);
  if (!course) {
    throw createHttpError(404, "Course not found");
  }
  return course;
}

export default {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
