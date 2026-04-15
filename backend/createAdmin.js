const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./src/models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const adminEmail = "admin@notes.edu";
    const adminPassword = "Yasar@630"; // Updated per request

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`Admin account [${adminEmail}] already exists.`);
      console.log("Updating password...");
      admin.password = adminPassword;
      await admin.save();
      console.log("✅ Admin password updated successfully!");
    } else {
      // Create a new admin user
      admin = new User({
        name: "Master Admin",
        email: adminEmail,
        password: adminPassword,
        college: "Global Admin",
        branch: "System",
        year: 5,
        role: "admin",
      });

      await admin.save();
      console.log("✅ Admin account created successfully!");
    }

    console.log("👉 Email: " + adminEmail);
    console.log("👉 Password: " + adminPassword);

    process.exit();
  } catch (err) {
    console.error("Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();
