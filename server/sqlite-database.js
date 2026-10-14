"use strict";
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

const directory = path.join(__dirname, "..", "data");
fs.mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(path.join(directory, "zuz.db"));
db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
db.exec(fs.readFileSync(path.join(__dirname, "..", "db", "sqlite.sql"), "utf8"));

let locked = false;
const waiters = [];
function acquire() {
  if (!locked) { locked = true; return Promise.resolve(); }
  return new Promise(resolve => waiters.push(resolve));
}
function release() {
  const next = waiters.shift();
  if (next) next(); else locked = false;
}
function execute(sql, params = []) {
  let statement = sql
    .replace(/NOW\(\)\s*\+\s*INTERVAL\s*'7 days'/gi, "datetime('now','+7 days')")
    .replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/::jsonb/gi, "");
  const bindings = [];
  statement = statement.replace(/\$(\d+)/g, (_, index) => {
    bindings.push(params[Number(index) - 1]);
    return "?";
  });
  const stmt = db.prepare(statement);
  const values = bindings.map(v => typeof v === "boolean" ? Number(v) : v);
  const rows = stmt.columns().length ? stmt.all(...values) : (stmt.run(...values), []);
  for (const row of rows) {
    for (const key of ["settings", "inputs", "payload"]) {
      if (typeof row[key] === "string") {
        try { row[key] = JSON.parse(row[key]); } catch {}
      }
    }
  }
  return { rows, rowCount: rows.length };
}
async function query(sql, params = []) {
  await acquire();
  try { return execute(sql, params); }
  finally { release(); }
}
function getPool() {
  return {
    async connect() {
      await acquire();
      let finished = false;
      return {
        query: async (sql, params = []) => execute(sql, params),
        release() { if (!finished) { finished = true; release(); } }
      };
    }
  };
}
module.exports = { query, getPool };
