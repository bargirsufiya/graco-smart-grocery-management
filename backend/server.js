const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ override: true });

const app = express();

// Websites allowed to call this API: FRONTEND_URL plus any extra comma-separated CORS_ORIGINS
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173", ...(process.env.CORS_ORIGINS || "").split(",")]
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Module 4: lists, sharing, notifications, reminders
app.use("/api/lists", require("./routes/lists"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reminders", require("./routes/reminders"));

// Module 5: AI grocery assistant
app.use("/api/ai", require("./routes/ai"));

app.get("/", (req, res) => {
  res.send("Grocery API running");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    require("./jobs/reminderJob");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port " + (process.env.PORT || 5000));
    });
  })
  .catch((err) => console.log("DB error:", err.message));