const express = require("express");
const router = express.Router();

const { addReview, getReviewsByNote, deleteReview } = require("../controllers/reviewController");
const protect = require("../middlewares/protect");

// POST /api/reviews            → Submit a new review (rating + comment)
// Body: { noteId, rating, comment }
router.post("/", protect, addReview);

// GET /api/reviews/:noteId     → Get all reviews for a specific note
router.get("/:noteId", protect, getReviewsByNote);

// DELETE /api/reviews/:reviewId → Delete your own review
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
