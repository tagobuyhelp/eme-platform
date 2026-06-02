import { Router } from "express";

import protect from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

import {
  downloadCertificateHandler,
  generateCertificateHandler,
  getMyCertificates,
  getAllCertificatesHandler,
  verifyCertificateHandler,
} from "./certificate.controller.js";

const router = Router();

router.post("/generate", protect, authorize("student"), generateCertificateHandler);
router.get("/my", protect, authorize("student"), getMyCertificates);
router.get("/all", protect, authorize("admin"), getAllCertificatesHandler);
router.get("/download/:id", downloadCertificateHandler);
router.get("/verify/:id", verifyCertificateHandler);

export default router;
