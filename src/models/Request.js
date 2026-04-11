const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // The student who submitted this request
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // What the student is requesting (e.g. "Need IoT Unit 3 notes")
    requestText: {
      type: String,
      required: [true, "Request text is required"],
      trim: true,
      minlength: [10, "Request must be at least 10 characters"],
      maxlength: [300, "Request cannot exceed 300 characters"],
    },

    // Subject the request is for (optional but helpful for admin)
    subject: {
      type: String,
      trim: true,
      maxlength: [80, "Subject cannot exceed 80 characters"],
    },

    // College the request is from (auto-filled from user profile)
    college: {
      type: String,
      trim: true,
    },

    // Moderation status
    // 'pending'   → submitted, waiting for someone to upload
    // 'completed' → an admin has marked it as fulfilled
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // Optional admin note when marking as completed
    // e.g. "Notes uploaded by Yasar — check /api/notes?subject=IoT"
    adminNote: {
      type: String,
      trim: true,
      maxlength: [300, "Admin note cannot exceed 300 characters"],
      default: null,
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

const Request = mongoose.model("Request", requestSchema);
module.exports = Request;
