import { Router } from "express";

import protect from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

import {
  addQuestionHandler,
  createExamHandler,
  getExamHandler,
  listExamsHandler,
  submitExamHandler,
  updateExamHandler,
  deleteExamHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
} from "./exam.controller.js";

const router = Router();

router.post("/", protect, authorize("admin"), createExamHandler);
router.put("/:id", protect, authorize("admin"), updateExamHandler);
router.delete("/:id", protect, authorize("admin"), deleteExamHandler);

router.post("/:id/question", protect, authorize("admin"), addQuestionHandler);
router.put("/:id/question/:qId", protect, authorize("admin"), updateQuestionHandler);
router.delete("/:id/question/:qId", protect, authorize("admin"), deleteQuestionHandler);

router.get("/", protect, authorize("admin", "student"), listExamsHandler);
router.get("/:id", protect, authorize("admin", "student"), getExamHandler);

router.post("/:id/submit", protect, authorize("student"), submitExamHandler);

export default router;

