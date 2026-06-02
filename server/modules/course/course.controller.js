import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from "./course.service.js";

export async function create(req, res, next) {
  try {
    const course = await createCourse(req.body);
    return res.status(201).json({ message: "Course created successfully", course });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const courses = await getAllCourses(req.query);
    return res.json({ courses });
  } catch (err) {
    return next(err);
  }
}

export async function get(req, res, next) {
  try {
    const course = await getCourseById(req.params.id);
    return res.json({ course });
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const course = await updateCourse(req.params.id, req.body);
    return res.json({ message: "Course updated successfully", course });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await deleteCourse(req.params.id);
    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  list,
  get,
  update,
  remove,
};
