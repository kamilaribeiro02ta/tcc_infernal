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
app.use(express.static(path.join(__dirname)));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(PORT, () => console.log(`ZUZ disponível em http://localhost:${PORT}`));
