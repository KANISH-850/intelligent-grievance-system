const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { CLIENT_URL, NODE_ENV } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Enable CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Request Logging in Development
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API v1 Routes
app.use("/api/v1", routes);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
