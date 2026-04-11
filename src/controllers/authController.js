const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
// This function creates a signed JWT token using the user's MongoDB _id.
// The token expires based on JWT_EXPIRE in .env (e.g. "7d" = 7 days).

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },             // Payload: data stored inside the token
    process.env.JWT_SECRET,     // Secret key used to sign the token
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public (no token needed)
// ─────────────────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  try {
    const { name, email, password, college, branch, year } = req.body;

    // Step 1: Check if all required fields are provided
    if (!name || !email || !password || !college || !branch || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Step 2: Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Step 3: Create the user
    // NOTE: Password hashing happens automatically in User model's pre("save") hook
    const user = await User.create({
      name,
      email,
      password,
      college,
      branch,
      year,
    });

    // Step 4: Generate JWT token for the new user
    const token = generateToken(user._id);

    // Step 5: Send response (exclude password from output)
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        year: user.year,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors nicely
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login an existing user
// @route   POST /api/auth/login
// @access  Public (no token needed)
// ─────────────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Make sure email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // Step 2: Find user by email
    // We use .select("+password") because password has select: false in schema
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password", // vague on purpose for security
      });
    }

    // Step 3: Compare entered password with the hashed password in DB
    // This uses the comparePassword() method defined in the User model
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Step 4: Generate a fresh JWT token
    const token = generateToken(user._id);

    // Step 5: Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        year: user.year,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (token required)
// ─────────────────────────────────────────────────────────────────────────────

const getMe = async (req, res) => {
  // req.user is set by the protect middleware (see protect.js)
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = { register, login, getMe };
