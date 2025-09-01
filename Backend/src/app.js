// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes/index.route");

const app = express();
const expressRaw = express.raw;
const { webhookHandler } = require("./controllers/payment.controller");

app.post("/api/payment/webhook", expressRaw({ type: "application/json" }), webhookHandler);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow credentials so refresh cookie can be sent by browser; set FRONTEND_URL in .env
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // in prod set FRONTEND_URL explicitly
  credentials: true,
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// Routes
app.use("/api", routes);

// Base route
app.get("/", (req, res) => {
  res.send("🌾 Kisan Collective API is running");
});

module.exports = app;
