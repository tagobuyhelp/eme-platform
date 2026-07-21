import { Router } from "express";

import { login, register, updateMe, changePassword, sendOtp, verifyOtp, verifyWidget } from "./auth.controller.js";
import protect from "../../core/middleware/authMiddleware.js";

const router = Router();

// Admin: email + password
router.post("/register", register);
router.post("/login", login);

// Student: phone + OTP
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/verify-widget", verifyWidget);

// Profile management (protected)
router.put("/me", protect, updateMe);
router.put("/password", protect, changePassword);

export default router;
