const app = require("./app");
const { PORT, NODE_ENV } = require("./config/env");

const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`[Backend Service] Running in ${NODE_ENV} mode on ${HOST}:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
