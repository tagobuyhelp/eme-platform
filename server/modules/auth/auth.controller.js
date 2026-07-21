import { loginUser, registerUser, sendPhoneOtp, verifyPhoneOtp, verifyMsg91WidgetToken } from "./auth.service.js";

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { updateProfile } = await import("./auth.service.js");
    const user = await updateProfile(req.user.id, req.body);
    return res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    return next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    const { updatePassword } = await import("./auth.service.js");
    await updatePassword(req.user.id, currentPassword, newPassword);
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return next(err);
  }
}

// ─── OTP Endpoints ───────────────────────────────────────────────────

export async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    const result = await sendPhoneOtp(phone);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }
    const result = await verifyPhoneOtp(phone, otp, name);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function verifyWidget(req, res, next) {
  try {
    const { accessToken, name } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }
    const result = await verifyMsg91WidgetToken(accessToken, name);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export default {
  register,
  login,
  updateMe,
  changePassword,
  sendOtp,
  verifyOtp,
  verifyWidget,
};
