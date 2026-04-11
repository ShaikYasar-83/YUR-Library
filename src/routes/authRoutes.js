const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middlewares/protect");

// ─── Public Routes (no token required) ───────────────────────────────────────

// POST /api/auth/register  → Create a new account
router.post("/register", register);

// POST /api/auth/login  → Login and get a JWT token
router.post("/login", login);

// ─── Private Routes (token required) ─────────────────────────────────────────

// GET /api/auth/me  → Get logged-in user's profile
// `protect` runs first, verifies token, then `getMe` runs
router.get("/me", protect, getMe);

module.exports = router;
