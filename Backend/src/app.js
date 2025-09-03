// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes/index.route");
const { webhookHandler } = require("./controllers/payment.controller");

const app = express();
const expressRaw = express.raw;

// Raw webhook endpoint (must be above express.json)
app.post(
  "/api/payment/webhook",
  expressRaw({ type: "application/json" }),
  webhookHandler
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173", // dev
      "https://kisan-collective-frontend.onrender.com" // production frontend
    ],
    credentials: true,
  })
);


app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// API routes
app.use("/api", routes);

// Base route
app.get("/", (req, res) => {
  res.send("🌾 Kisan Collective API is running");
});

module.exports = app;
