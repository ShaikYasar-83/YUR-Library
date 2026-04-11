const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./src/models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@notes.edu" });
    if (adminExists) {
      console.log("Admin account already exists: admin@notes.edu / admin123");
      process.exit();
    }

    // Create a new admin user
    const adminUser = new User({
      name: "Master Admin",
      email: "admin@notes.edu",
      password: "admin123", // Will be hashed by pre-save hook
      college: "Global Admin",
      branch: "System",
      year: 5,
      role: "admin", // <-- THIS MAKES IT AN ADMIN
    });

    await adminUser.save();
    console.log("✅ Admin account created successfully!");
    console.log("👉 Email: admin@notes.edu");
    console.log("👉 Password: admin123");

    process.exit();
  } catch (err) {
    console.error("Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();
