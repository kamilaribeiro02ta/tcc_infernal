"use strict";
const express = require("express");
const { createApi } = require("../server/api");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));
app.use("/api", createApi());

module.exports = app;
