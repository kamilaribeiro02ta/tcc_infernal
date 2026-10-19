"use strict";

// Endpoint público de diagnóstico: só retorna ok depois de consultar o Neon.
// Nunca inclua credenciais nem mensagens internas do Postgres na resposta.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { query, provider } = require("../server/database");
    return res.status(200).json(await require("../server/backend-status").health(query,provider));
  } catch (error) {
    console.error("ZUZ health check failed:", error.code || error.message);
    return res.status(503).json({
      ok: false,
      app: "ZUZ",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      database: "unavailable",
      code: error.code === "28P01" ? "DB_AUTH_FAILED" :
        error.code === "3D000" ? "DB_NAME_INVALID" :
        error.code === "ENOTFOUND" ? "DB_HOST_UNREACHABLE" :
        process.env.DATABASE_URL ? "DB_CONNECT_FAILED" : "DATABASE_URL_MISSING"
    });
  }
};

