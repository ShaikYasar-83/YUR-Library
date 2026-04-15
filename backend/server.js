// server.js - Entry point of the application

const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

// ADD THIS LINE
app.use('/uploads', require('express').static('uploads'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log("─────────────────────────────────────────────");
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api/notes`);
    console.log("─────────────────────────────────────────────");
  });
};

startServer();