import Student from "../student/student.model.js";
import Attempt from "./attempt.model.js";
import {
  addQuestion,
  createExam,
  getAllExams,
  getExamById,
  submitExam,
  updateExam,
  deleteExam,
  updateQuestion,
  deleteQuestion,
} from "./exam.service.js";
import { generateCertificate } from "../certificate/certificate.service.js";
import { createResult } from "../result/result.service.js";

export async function createExamHandler(req, res, next) {
  try {
    const exam = await createExam(req.body, req.user?.id);
    return res.status(201).json({ message: "Exam created", exam });
  } catch (err) {
    return next(err);
  }
}

export async function addQuestionHandler(req, res, next) {
  try {
    const question = await addQuestion(req.params.id, req.body);
    return res.status(201).json({ message: "Question added", question });
  } catch (err) {
    return next(err);
  }
}

export async function listExamsHandler(req, res, next) {
  try {
    let exams = await getAllExams();
    
    // If the requester is a student, only show exams for their enrolled course and attach real attempt info
    if (req.user?.role === "student") {
      const student = await Student.findOne({ userId: req.user.id }).select("_id course").lean();
      if (student && student.course) {
        exams = exams.filter(exam => exam.course === student.course);

        const attempts = await Attempt.find({ studentId: student._id }).select("examId status").lean();

        exams = exams.map(exam => {
          const examAttempts = attempts.filter(a => a.examId.toString() === exam._id.toString());
          const hasPassed = examAttempts.some(a => a.status === "pass");
          return {
            ...exam,
            attemptsCount: examAttempts.length,
            hasPassed,
          };
        });
      } else {
        exams = []; // No course assigned, no exams visible
      }
    }
    
    return res.json({ exams });
  } catch (err) {
    return next(err);
  }
}

export async function getExamHandler(req, res, next) {
  try {
    const isAdmin = req.user?.role === "admin";

    // Pre-flight check for students before giving questions
    if (!isAdmin && req.user?.role === "student") {
      const student = await Student.findOne({ userId: req.user.id }).select("_id course").lean();
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const attempts = await Attempt.find({ studentId: student._id, examId: req.params.id }).lean();
      const hasPassed = attempts.some(a => a.status === "pass");
      if (hasPassed) {
        return res.status(409).json({ message: "You have already passed this exam." });
      }
      if (attempts.length >= 3) {
        return res.status(403).json({ message: "Maximum attempts (3) reached for this exam." });
      }
    }

    const data = await getExamById(req.params.id, isAdmin);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function submitExamHandler(req, res, next) {
  try {
    const userId = req.user?.id;
    const student = await Student.findOne({ userId }).select("_id").lean();
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await submitExam(student._id, req.params.id, req.body?.answers);
    const savedResult = await createResult({
      studentId: student._id,
      examId: req.params.id,
      score: result.score,
      status: result.status,
    });

    let certificate = null;
    if (result.status === "pass") {
      try {
        certificate = await generateCertificate(student._id, req.params.id);
      } catch (certErr) {
        console.error("Certificate generation error upon exam pass:", certErr);
      }
    }

    return res.json({
      message: "Exam submitted",
      result,
      storedResult: savedResult,
      certificate,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateExamHandler(req, res, next) {
  try {
    const exam = await updateExam(req.params.id, req.body);
    return res.json({ message: "Exam updated", exam });
  } catch (err) {
    return next(err);
  }
}

export async function deleteExamHandler(req, res, next) {
  try {
    const exam = await deleteExam(req.params.id);
    return res.json({ message: "Exam deleted", exam });
  } catch (err) {
    return next(err);
  }
}

export async function updateQuestionHandler(req, res, next) {
  try {
    const question = await updateQuestion(req.params.id, req.params.qId, req.body);
    return res.json({ message: "Question updated", question });
  } catch (err) {
    return next(err);
  }
}

export async function deleteQuestionHandler(req, res, next) {
  try {
    const question = await deleteQuestion(req.params.id, req.params.qId);
    return res.json({ message: "Question deleted", question });
  } catch (err) {
    return next(err);
  }
}

export default {
  createExamHandler,
  addQuestionHandler,
  listExamsHandler,
  getExamHandler,
  submitExamHandler,
  updateExamHandler,
  deleteExamHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
};

