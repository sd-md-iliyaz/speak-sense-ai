const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const getDbStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const readyState = mongoose.connection.readyState;
  return states[readyState] || "unknown";
};

app.get(["/health", "/api/health"], (_req, res) => {
  const database = getDbStatus();
  const healthy = database === "connected" || process.env.NODE_ENV === "test";

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "speak-sense-server",
    database
  });
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

if (process.env.NODE_ENV !== "test") {
  const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
  }

  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = app;