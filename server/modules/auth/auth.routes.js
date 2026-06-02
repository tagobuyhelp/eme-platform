import { Router } from "express";

import { login, register, updateMe, changePassword } from "./auth.controller.js";
import protect from "../../core/middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.put("/me", protect, updateMe);
router.put("/password", protect, changePassword);

export default router;

