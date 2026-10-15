"use strict";
const express = require("express");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));

// Se uma dependência do backend falhar na inicialização, responda JSON
// controlado em vez de deixar a função da Vercel cair com erro 500 sem contexto.
try {
  const { createApi } = require("../server/api");
  app.use("/api", createApi());
} catch (error) {
  console.error("ZUZ API initialization failed:", error);
  app.use("/api", (_req, res) => {
    res.status(503).json({
      error: "O backend da ZUZ não conseguiu iniciar. Verifique a implantação.",
      code: "ZUZ_API_INIT_FAILURE"
    });
  });
}

module.exports = app;
