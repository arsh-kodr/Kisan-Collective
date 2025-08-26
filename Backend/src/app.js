// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes/index.route");
const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(express.json());

// 🔹 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// 🔹 Main Routes
app.use("/api", routes);
app.use("/api/auth", authRoutes);

// 🔹 Base Route
app.get("/", (req, res) => {
  res.send("🌾 Kisan Collective API is running");
});

module.exports = app;
