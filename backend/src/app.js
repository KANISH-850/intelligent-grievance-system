const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { CLIENT_URL, NODE_ENV } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Enable CORS — support comma-separated origins for production + dev
// Also allows all Vercel preview deployment URLs (*.vercel.app)
const allowedOrigins = CLIENT_URL
  ? CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, health checks, curl)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview/production deployment URL
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow explicitly listed origins (localhost, custom domains)
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Return a clean 403 — do not propagate through the generic error handler
      const err = new Error("CORS: Origin not allowed");
      err.statusCode = 403;
      return callback(err);
    },
    credentials: true,
  })
);

// Request Logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("short"));
}

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check (for Render's default health probe at /)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "grievance-backend" });
});

// Mount API v1 Routes
app.use("/api/v1", routes);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

