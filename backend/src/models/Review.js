const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Which note this review belongs to
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: [true, "Note reference is required"],
    },

    // Who wrote this review (logged-in user or guest)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Made optional to allow guest reviews
    },

    // Star rating from 1 to 5
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    // Written comment (optional but encouraged)
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// NOTE: Unique constraint removed to allow guest reviews
// reviewSchema.index({ note: 1, user: 1 }, { unique: true });

// ─── Static Method: Recalculate Average Rating for a Note ────────────────────
// This is called automatically AFTER a review is saved.
// It uses MongoDB aggregation to:
//   1. Group all reviews for a specific note
//   2. Calculate the average rating
//   3. Count total reviews
//   4. Save both values back to the Note document

reviewSchema.statics.calcAverageRating = async function (noteId) {
  // 'this' refers to the Review model
  const stats = await this.aggregate([
    {
      $match: { note: noteId }, // Step 1: Filter — only reviews for this note
    },
    {
      $group: {
        _id: "$note",                      // Step 2: Group by noteId
        avgRating: { $avg: "$rating" },    // Step 3: Calculate average
        totalReviews: { $sum: 1 },         // Step 4: Count all reviews
      },
    },
  ]);

  // stats = [{ _id: noteId, avgRating: 4.2, totalReviews: 15 }]
  // or []  if no reviews exist yet

  if (stats.length > 0) {
    // Update the note with the fresh average
    await mongoose.model("Note").findByIdAndUpdate(noteId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // e.g. 4.2
      totalReviews: stats[0].totalReviews,
    });
  } else {
    // No reviews left → reset to defaults
    await mongoose.model("Note").findByIdAndUpdate(noteId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

// ─── Post-Save Hook: Trigger recalculation after every new review ─────────────
// After ANY review is saved, automatically recalculate the average for that note.
reviewSchema.post("save", function () {
  // 'this' = the review document just saved
  // 'this.constructor' = the Review model (needed to call the static method)
  this.constructor.calcAverageRating(this.note);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
