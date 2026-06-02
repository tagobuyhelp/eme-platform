import { Router } from "express";

import protect from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";

import {
  create,
  get,
  list,
  remove,
  update,
} from "./course.controller.js";

const router = Router();

// Public or student route to fetch courses (e.g. for registration dropdown)
router.get("/", list);
router.get("/:id", get);

// Admin only routes
router.post("/", protect, authorize("admin"), create);
router.put("/:id", protect, authorize("admin"), update);
router.delete("/:id", protect, authorize("admin"), remove);

export default router;
