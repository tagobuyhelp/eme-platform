import { Router } from "express";

import protect from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

import { getMyResults, getAllResultsHandler } from "./result.controller.js";

const router = Router();

router.get("/my", protect, authorize("student"), getMyResults);
router.get("/admin", protect, authorize("admin"), getAllResultsHandler);

export default router;

