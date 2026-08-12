const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const noteRoutes = require("./routes/noteRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const requestRoutes = require("./routes/requestRoutes");
const errorHandler = require("./middlewares/errorHandler");

// Initialize Express app
const app = express();

// Trust reverse proxy (for Render/Heroku HTTPS)
app.set("trust proxy", 1);

// ─── Middlewares ──────────────────────────────────────────────────────────────

// Allow cross-origin requests (useful when a frontend calls this API)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (shows method, url, status, response time)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
// Serve uploaded files: http://localhost:5000/uploads/note-123.pdf
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve existing static HTML files
app.use(express.static(path.join(__dirname, "../public")));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Backend API Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "YUR Library Backend API is running"
  });
});

// Auth routes (register, login)
app.use("/api/auth", authRoutes);

// Notes API routes
app.use("/api/notes", noteRoutes);

// Reviews API routes
app.use("/api/reviews", reviewRoutes);

const statRoutes = require("./routes/statRoutes");

// ... (other route mounts)
// Requests API routes
app.use("/api/requests", requestRoutes);

// Stats API routes
app.use("/api/stats", statRoutes);

// ─── Multer Error Handler ────────────────────────────────────────────────────
// Catches multer errors (wrong file type, file too large) and returns clean JSON
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum allowed size is 10MB.",
    });
  }
  if (err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// 404 - Unknown Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
