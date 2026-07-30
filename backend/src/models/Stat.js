const mongoose = require("mongoose");

const statSchema = new mongoose.Schema(
  {
    // A single document will be used to track global stats, so we give it a static ID string
    type: {
      type: String,
      default: "global",
      unique: true,
    },
    visitsCount: {
      type: Number,
      default: 0,
    }
  }
);

module.exports = mongoose.model("Stat", statSchema);
