"use strict";
const { Pool } = require("pg");
let pool;
function getPool() {
  if (!process.env.DATABASE_URL) {
    const err = new Error("DATABASE_URL ausente. Configure o PostgreSQL antes de ativar contas da ZUZ.");
    err.status = 503;
    throw err;
  }
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000
  });
  return pool;
}
function query(sql, params = []) { return getPool().query(sql, params); }
module.exports = { query, getPool };
