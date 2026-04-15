const express = require("express");
const router = express.Router();

const { register, login, getMe, verifyOTP, resendOTP } = require("../controllers/authController");
const { protect } = require("../middlewares/protect");

// ─── Public Routes (no token required) ───────────────────────────────────────

// POST /api/auth/register  → Create a new account
router.post("/register", register);

// POST /api/auth/login  → Login and get a JWT token
router.post("/login", login);

// POST /api/auth/verify-otp → Confirm account using 6-digit code
router.post("/verify-otp", verifyOTP);

// POST /api/auth/resend-otp → Send a new code if expired
router.post("/resend-otp", resendOTP);


// ─── Private Routes (token required) ─────────────────────────────────────────

// GET /api/auth/me  → Get logged-in user's profile
// `protect` runs first, verifies token, then `getMe` runs
router.get("/me", protect, getMe);

module.exports = router;
