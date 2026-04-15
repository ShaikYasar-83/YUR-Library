const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");


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

    console.log("-----------------------------------------");
    console.log(`NEW USER REGISTRATION: ${email}`);
    console.log("-----------------------------------------");

    // Step 3: Create the user (auto-verified, no OTP required)
    // NOTE: Password hashing happens automatically in User model's pre("save") hook
    const user = await User.create({
      name,
      email,
      password,
      college,
      branch,
      year,
      isVerified: true, // auto-verify, no email OTP needed
    });

    // Step 4: Generate token and respond
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
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

    // Step 4: Compare entered password with the hashed password in DB
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Please provide email and OTP" });
    }

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = otpExpires;
    
    console.log("-----------------------------------------");
    console.log(`RESEND OTP FOR: ${email}`);
    console.log(`NEW OTP: ${otp}`);
    console.log("-----------------------------------------");

    await user.save();

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: "Your New Verification Code - YUR LIBRARY",
        message: `Your new verification code is: ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">New Verification Code</h2>
            <p>Please use the following code to verify your account:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email could not be sent:", emailError.message);
      return res.status(500).json({ success: false, message: "Could not send OTP email. Please try again later." });
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

module.exports = { register, login, getMe, verifyOTP, resendOTP };

