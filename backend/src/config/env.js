const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-key-change-in-env",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8001",
};

