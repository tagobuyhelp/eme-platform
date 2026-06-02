import { Router } from "express";

import protect from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

import {
  createStudentProfile,
  getStudent,
  getMe,
  listStudents,
  updateStudentProfile,
  uploadDocument,
  previewDocument,
} from "./student.controller.js";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists or is created automatically
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const router = Router();

router.post("/", protect, authorize("admin", "student"), createStudentProfile);
router.get("/", protect, authorize("admin"), listStudents);
router.get("/me", protect, authorize("student"), getMe);
router.post("/upload", protect, authorize("student", "admin"), upload.single("document"), uploadDocument);
router.get("/preview", previewDocument);
router.get("/:id", protect, authorize("admin", "student"), getStudent);
router.put("/:id", protect, authorize("admin", "student"), updateStudentProfile);

export default router;

