const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── User Schema ──────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // Full name of the student
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,                          // removes leading/trailing spaces
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Email — used for login, must be unique across all users
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,                        // enforces no duplicate emails in DB
      lowercase: true,                     // always stored as lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    // Password — stored as a bcrypt hash, NEVER as plain text
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // ← IMPORTANT: password won't be returned in queries by default
    },

    // Name of the college/university
    college: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
      maxlength: [100, "College name cannot exceed 100 characters"],
    },

    // Department or stream (e.g. "Computer Science", "Mechanical")
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      maxlength: [60, "Branch name cannot exceed 60 characters"],
    },

    // Current year of study
    year: {
      type: Number,
      required: [true, "Year of study is required"],
      min: [1, "Year must be between 1 and 5"],
      max: [5, "Year must be between 1 and 5"],
    },

    // Role — controls what the user can do in the system
    // 'user'  → regular student (default)
    // 'admin' → can approve or reject uploaded notes
    role: {
      type: String,
      enum: ["user", "admin"],  // only these two values are allowed
      default: "user",          // every new signup is a regular user
    },
  },
  {
    timestamps: true, // Auto-adds: createdAt, updatedAt
  }
);

// ─── Middleware: Hash Password Before Saving ──────────────────────────────────
// This runs automatically before every .save() call.
// It only hashes the password if it was newly set or modified.

userSchema.pre("save", async function () {
  // If password was NOT changed, skip hashing and move on
  if (!this.isModified("password")) return;

  // Generate a salt (complexity factor = 12)
  // Higher number = more secure but slower. 10-12 is the industry standard.
  const salt = await bcrypt.genSalt(12);

  // Replace the plain-text password with its hashed version
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method: Compare Password ───────────────────────────────────────
// Called during login to check if the entered password matches the stored hash.
// Usage: const isMatch = await user.comparePassword(enteredPassword);

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Export Model ─────────────────────────────────────────────────────────────
const User = mongoose.model("User", userSchema);

module.exports = User;
