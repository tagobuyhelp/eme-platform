import Student from "../student/student.model.js";

import { getStudentResults, getAllResults } from "./result.service.js";

export async function getMyResults(req, res, next) {
  try {
    const userId = req.user?.id;
    const student = await Student.findOne({ userId }).select("_id").lean();
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const results = await getStudentResults(student._id);
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

export async function getAllResultsHandler(req, res, next) {
  try {
    const filter = { examId: req.query.examId };
    const results = await getAllResults(filter);
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

export default {
  getMyResults,
  getAllResultsHandler,
};

