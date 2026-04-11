const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  markCompleted,
  deleteRequest,
} = require("../controllers/requestController");

const protect = require("../middlewares/protect");
const isAdmin = require("../middlewares/isAdmin");

// ─── User Routes (JWT required) ───────────────────────────────────────────────

// POST /api/requests           → Submit a new note request
// Body: { requestText, subject }
router.post("/", protect, createRequest);

// GET /api/requests/my         → View your own requests
// IMPORTANT: /my must come BEFORE /:id to prevent Express
// from treating "my" as a MongoDB ObjectId
router.get("/my", protect, getMyRequests);

// DELETE /api/requests/:id     → Delete your own request
router.delete("/:id", protect, deleteRequest);

// ─── Admin Routes (JWT + Admin role required) ─────────────────────────────────

// GET /api/requests            → View ALL requests (filterable by status)
// ?status=pending              → filter pending only
// ?status=completed            → filter completed only
router.get("/", protect, isAdmin, getAllRequests);

// PUT /api/requests/:id        → Mark a request as completed
// Body: { adminNote: "..." }   → optional message to requester
router.put("/:id", protect, isAdmin, markCompleted);

module.exports = router;
