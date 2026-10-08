const app = require("./app");
const { PORT, NODE_ENV } = require("./config/env");

const server = app.listen(PORT, () => {
  console.log(`[Backend Service] Running in ${NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
