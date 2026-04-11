const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // Title of the note
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Subject / topic of the note (e.g. "Data Structures")
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [80, "Subject cannot exceed 80 characters"],
    },

    // College the note belongs to
    college: {
      type: String,
      required: [true, "College is required"],
      trim: true,
      maxlength: [100, "College name cannot exceed 100 characters"],
    },

    // Short description of what the note covers
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Path/URL of the uploaded file (set by multer after upload)
    fileUrl: {
      type: String,
      required: [true, "File is required"],
    },

    // Original file name (for display purposes)
    fileName: {
      type: String,
    },

    // File type: "pdf", "jpg", or "png"
    fileType: {
      type: String,
      enum: ["pdf", "jpg", "png","jpeg"],
    },

    // Reference to the User who uploaded this note
    // This links the Note to a User document using ObjectId
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",               // refers to the "User" model
      required: [true, "Uploader reference is required"],
    },

    // Moderation status — new notes start as "pending"
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Tracks how many times this note has been downloaded
    // Incremented by 1 every time a user hits the download endpoint
    downloadsCount: {
      type: Number,
      default: 0, // starts at zero for every new note
    },

    // Average rating (computed from all reviews on this note)
    // Updated automatically each time a review is added
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Total number of reviews submitted for this note
    totalReviews: {
      type: Number,
      default: 0,
    },

    // Semester the note belongs to (1-8)
    semester: {
      type: Number,
      min: [1, "Semester must be between 1 and 8"],
      max: [8, "Semester must be between 1 and 8"],
    },

    // Tracks how many times this note has been viewed inline
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // auto-adds createdAt & updatedAt
  }
);

// ─── Text Index (enables fast $text search on title + description) ────────────
// This tells MongoDB to build a search index so queries like
// { $text: { $search: "machine learning" } } work quickly at scale.
noteSchema.index({ title: "text", description: "text" });

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
