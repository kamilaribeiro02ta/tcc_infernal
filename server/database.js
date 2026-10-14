"use strict";
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL obrigatória na Vercel; SQLite não é persistente.");
}
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
  module.exports = { query: (sql, params = []) => pool.query(sql, params),
    getPool: () => pool, provider: "postgresql" };
} else {
  module.exports = { ...require("./sqlite-database"), provider: "sqlite" };
}
