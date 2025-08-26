
const healthCheck = (req, res) => {
  res.json({ status: "ok", message: "API is healthy 🚀" });
};

module.exports = { healthCheck };
