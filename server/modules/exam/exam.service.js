import mongoose from "mongoose";

import Exam from "./exam.model.js";
import Question from "./question.model.js";
import Attempt from "./attempt.model.js";

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

export async function createExam(data, adminId) {
  ensureObjectId(adminId, "adminId");

  const title = data?.title;
  if (!title) {
    throw createHttpError(400, "title is required");
  }

  const duration = data?.duration;
  const totalMarks = data?.totalMarks;
  const passMarks = data?.passMarks;
  const questionCount = data?.questionCount;

  if (totalMarks !== undefined && typeof totalMarks !== "number") {
    throw createHttpError(400, "totalMarks must be a number");
  }
  if (passMarks !== undefined && typeof passMarks !== "number") {
    throw createHttpError(400, "passMarks must be a number");
  }
  if (totalMarks !== undefined && passMarks !== undefined && passMarks > totalMarks) {
    throw createHttpError(400, "passMarks cannot be greater than totalMarks");
  }
  if (questionCount !== undefined && typeof questionCount !== "number") {
    throw createHttpError(400, "questionCount must be a number");
  }

  const exam = await Exam.create({
    title: String(title).trim(),
    course: data.course ? String(data.course).trim() : undefined,
    duration,
    totalMarks,
    passMarks,
    questionCount: questionCount || 0,
    createdBy: adminId,
  });

  return exam.toObject();
}

export async function addQuestion(examId, data) {
  ensureObjectId(examId, "examId");

  const exam = await Exam.findById(examId).select("_id").lean();
  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }

  const question = data?.question;
  const options = data?.options;
  const correctAnswer = data?.correctAnswer;

  if (!question) {
    throw createHttpError(400, "question is required");
  }
  if (!Array.isArray(options) || options.length !== 4 || !options.every((s) => typeof s === "string")) {
    throw createHttpError(400, "options must be an array of 4 strings");
  }
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
    throw createHttpError(400, "correctAnswer must be an integer between 0 and 3");
  }

  const q = await Question.create({
    examId,
    question: String(question).trim(),
    options: options.map((s) => String(s)),
    correctAnswer,
  });

  return q.toObject();
}

export async function getAllExams() {
  return Exam.find().sort({ createdAt: -1 }).lean();
}

export async function getExamById(examId, isAdmin = false) {
  ensureObjectId(examId, "examId");

  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }

  const query = Question.find({ examId });
  if (!isAdmin) {
    query.select("-correctAnswer");
  }
  let questions = await query.sort({ createdAt: 1 }).lean();

  if (!isAdmin && exam.questionCount && exam.questionCount > 0) {
    // Shuffle and pick subset of questions
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, exam.questionCount);
  }

  return { exam, questions };
}

export async function submitExam(studentId, examId, answers) {
  ensureObjectId(studentId, "studentId");
  ensureObjectId(examId, "examId");

  const attemptsCount = await Attempt.countDocuments({ studentId, examId });
  if (attemptsCount >= 3) {
    throw createHttpError(403, "Maximum attempts (3) reached for this exam.");
  }

  const passedAttempt = await Attempt.findOne({ studentId, examId, status: "pass" }).lean();
  if (passedAttempt) {
    throw createHttpError(409, "You have already passed this exam.");
  }

  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }

  if (!Array.isArray(answers)) {
    throw createHttpError(400, "answers must be an array");
  }

  // Validate array elements
  answers.forEach((ans, index) => {
    if (!ans || !mongoose.Types.ObjectId.isValid(ans.questionId) || typeof ans.selectedOption !== "number") {
      throw createHttpError(400, `Invalid answer format at index ${index}`);
    }
  });

  const expectedCount = exam.questionCount && exam.questionCount > 0 ? exam.questionCount : null;
  
  const questionIds = answers.map((a) => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds }, examId }).select("correctAnswer").lean();

  if (expectedCount && questions.length !== expectedCount) {
     // Note: If expectedCount is set but the total questions available in DB is less than expectedCount, this could fail.
     // Assuming admin configures it correctly. We check answers.length to prevent cheating.
     if (answers.length !== expectedCount) {
         throw createHttpError(400, `Expected ${expectedCount} answers, but got ${answers.length}`);
     }
  }

  let correctCount = 0;
  
  const normalizedAnswers = answers.map((a) => {
    const q = questions.find((qItem) => qItem._id.toString() === a.questionId.toString());
    let selectedOption = a.selectedOption;
    if (selectedOption < -1 || selectedOption > 3) selectedOption = -1;
    
    if (q && q.correctAnswer === selectedOption) {
      correctCount++;
    }
    
    return {
      questionId: a.questionId,
      selectedOption: selectedOption
    };
  });

  const totalPossibleQuestions = expectedCount || questions.length;
  const perQuestion = typeof exam.totalMarks === "number" && exam.totalMarks > 0
    ? exam.totalMarks / totalPossibleQuestions
    : 1;

  const rawScore = correctCount * perQuestion;
  const score = Number.isFinite(rawScore) ? Math.round(rawScore * 100) / 100 : 0;

  const passMarks = typeof exam.passMarks === "number" ? exam.passMarks : 0;
  const status = score >= passMarks ? "pass" : "fail";

  const attempt = await Attempt.create({
    studentId,
    examId,
    answers: normalizedAnswers,
    score,
    status,
    startedAt: new Date(),
    submittedAt: new Date(),
  });

  return {
    attemptId: attempt._id.toString(),
    examId: exam._id.toString(),
    score,
    status,
    totalMarks: typeof exam.totalMarks === "number" ? exam.totalMarks : totalPossibleQuestions,
    passMarks,
    correctCount,
    questionCount: totalPossibleQuestions,
  };
}

export async function updateExam(examId, data) {
  ensureObjectId(examId, "examId");

  const allowed = {};
  if (data?.title !== undefined) allowed.title = String(data.title).trim();
  if (data?.course !== undefined) allowed.course = String(data.course).trim();
  if (data?.duration !== undefined) allowed.duration = Number(data.duration);
  if (data?.totalMarks !== undefined) allowed.totalMarks = Number(data.totalMarks);
  if (data?.passMarks !== undefined) allowed.passMarks = Number(data.passMarks);
  if (data?.questionCount !== undefined) allowed.questionCount = Number(data.questionCount);

  if (allowed.totalMarks !== undefined && allowed.passMarks !== undefined && allowed.passMarks > allowed.totalMarks) {
    throw createHttpError(400, "passMarks cannot be greater than totalMarks");
  }

  const exam = await Exam.findByIdAndUpdate(examId, { $set: allowed }, { new: true }).lean();
  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }
  return exam;
}

export async function deleteExam(examId) {
  ensureObjectId(examId, "examId");

  const exam = await Exam.findByIdAndDelete(examId).lean();
  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }

  // Delete all questions associated with this exam
  await Question.deleteMany({ examId });
  return exam;
}

export async function updateQuestion(examId, questionId, data) {
  ensureObjectId(examId, "examId");
  ensureObjectId(questionId, "questionId");

  const allowed = {};
  if (data?.question !== undefined) allowed.question = String(data.question).trim();
  if (data?.options !== undefined) {
    if (!Array.isArray(data.options) || data.options.length !== 4 || !data.options.every((s) => typeof s === "string")) {
      throw createHttpError(400, "options must be an array of 4 strings");
    }
    allowed.options = data.options.map(s => String(s));
  }
  if (data?.correctAnswer !== undefined) {
    const val = Number(data.correctAnswer);
    if (!Number.isInteger(val) || val < 0 || val > 3) {
      throw createHttpError(400, "correctAnswer must be an integer between 0 and 3");
    }
    allowed.correctAnswer = val;
  }

  const question = await Question.findOneAndUpdate(
    { _id: questionId, examId },
    { $set: allowed },
    { new: true }
  ).lean();

  if (!question) {
    throw createHttpError(404, "Question not found");
  }
  return question;
}

export async function deleteQuestion(examId, questionId) {
  ensureObjectId(examId, "examId");
  ensureObjectId(questionId, "questionId");

  const question = await Question.findOneAndDelete({ _id: questionId, examId }).lean();
  if (!question) {
    throw createHttpError(404, "Question not found");
  }
  return question;
}

export default {
  createExam,
  addQuestion,
  getAllExams,
  getExamById,
  submitExam,
  updateExam,
  deleteExam,
  updateQuestion,
  deleteQuestion,
};

