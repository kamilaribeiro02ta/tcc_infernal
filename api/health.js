module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    app: "ZUZ",
    message: "Servidor Node funcionando na Vercel"
  });
};
