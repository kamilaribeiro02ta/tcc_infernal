CREATE TABLE IF NOT EXISTS zuz_users (
 id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 full_name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS zuz_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES zuz_users(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_zuz_sessions_user ON zuz_sessions(user_id);
CREATE TABLE IF NOT EXISTS zuz_companies (
 id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 owner_id TEXT NOT NULL UNIQUE REFERENCES zuz_users(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 segment TEXT NOT NULL DEFAULT 'outro',
 operation_type TEXT NOT NULL DEFAULT 'producao' CHECK(operation_type IN ('producao','revenda','servico','misto')),
 costing_mode TEXT NOT NULL DEFAULT 'por_unidade',
 onboarding_status TEXT NOT NULL DEFAULT 'completed',
 settings TEXT NOT NULL DEFAULT '{}',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS zuz_cost_categories (
 id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 company_id TEXT NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 label TEXT NOT NULL,
 cost_type TEXT NOT NULL DEFAULT 'direto' CHECK(cost_type IN ('direto','indireto','fixo','variavel','percentual')),
 unit TEXT NOT NULL DEFAULT 'reais',
 UNIQUE(company_id,label)
);
CREATE INDEX IF NOT EXISTS idx_zuz_categories_company ON zuz_cost_categories(company_id);
CREATE TABLE IF NOT EXISTS zuz_products (
 id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 company_id TEXT NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 operation_type TEXT NOT NULL CHECK(operation_type IN ('producao','revenda','servico','misto')),
 category TEXT NOT NULL DEFAULT 'Sem categoria',
 costing_mode TEXT NOT NULL DEFAULT 'por_unidade',
 inputs TEXT NOT NULL DEFAULT '[]',
 direct_cost REAL NOT NULL DEFAULT 0 CHECK(direct_cost >= 0),
 sale_price REAL NOT NULL DEFAULT 0 CHECK(sale_price >= 0),
 target_margin REAL NOT NULL DEFAULT 30 CHECK(target_margin BETWEEN 0 AND 90),
 units INTEGER NOT NULL DEFAULT 1 CHECK(units >= 1),
 payload TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_zuz_products_company ON zuz_products(company_id);

-- Historico imutavel de calculos por produto, preservado mesmo apos exclusao.
CREATE TABLE IF NOT EXISTS zuz_pricing_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 company_id TEXT NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL,
 product_name TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 snapshot TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_zuz_pricing_history_company_product
 ON zuz_pricing_history(company_id,product_id,id DESC);

-- Somente vendas efetivamente realizadas; projeções não treinam regressão.
CREATE TABLE IF NOT EXISTS zuz_sales_observations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 company_id TEXT NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES zuz_products(id) ON DELETE CASCADE,
 period TEXT NOT NULL,
 average_price REAL NOT NULL CHECK(average_price > 0),
 sold_units INTEGER NOT NULL CHECK(sold_units >= 0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(company_id,product_id,period)
);
CREATE INDEX IF NOT EXISTS idx_zuz_sales_observations_company_product
 ON zuz_sales_observations(company_id,product_id,period);
