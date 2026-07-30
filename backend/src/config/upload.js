const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── Step 1: Ensure uploads/ folder exists ────────────────────────────────────
// If the uploads/ directory doesn't exist, create it automatically.
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

// ─── Step 3: File Filter (Allow only PDF, JPG, PNG) ──────────────────────────
// This runs BEFORE the file is saved. If rejected, multer throws an error.

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);  // ✅ Accept the file
  } else {
    cb(
      new Error("Invalid file type. Only PDF, JPG, and PNG are allowed."),
      false // ❌ Reject the file
    );
  }
};

// ─── Step 4: Create the Multer Upload Instance ───────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size: 10MB (10 * 1024 * 1024 bytes)
  },
});

module.exports = upload;
