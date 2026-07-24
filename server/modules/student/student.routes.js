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
  importExcelCandidates,
} from "./student.controller.js";

import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post("/", protect, authorize("admin", "student"), createStudentProfile);
router.get("/", protect, authorize("admin"), listStudents);
router.get("/me", protect, authorize("student"), getMe);
router.post("/import-excel", protect, authorize("admin"), memoryUpload.single("file"), importExcelCandidates);
router.post("/upload", protect, authorize("student", "admin"), upload.single("document"), uploadDocument);
router.get("/preview", previewDocument);
router.get("/:id", protect, authorize("admin", "student"), getStudent);
router.put("/:id", protect, authorize("admin", "student"), updateStudentProfile);

export default router;

