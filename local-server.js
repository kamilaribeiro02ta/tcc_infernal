"use strict";
const express = require("express");
const path = require("path");
const { createApi } = require("./server/api");

const app = express();
const PORT = process.env.PORT || 3000;
app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));
app.use("/api", createApi());
// Nunca exponha o arquivo SQLite ou códigos internos pela rota pública.
app.use(["/data", "/server", "/db"], (_req,res) => res.status(404).end());
app.use(express.static(path.join(__dirname), { dotfiles: "deny" }));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(PORT, () => console.log(`ZUZ disponível em http://localhost:${PORT}`));
