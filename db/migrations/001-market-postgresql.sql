-- ZUZ Market 001. Migração aditiva: preserva produtos, empresas, contas e simulações.
-- Os dados deste catálogo são externos/públicos; NUNCA registrar nele custos da empresa.
CREATE TABLE IF NOT EXISTS zuz_market_catalog (
 id TEXT PRIMARY KEY,
 source VARCHAR(40) NOT NULL,
 external_id VARCHAR(120) NOT NULL,
 kind VARCHAR(12) NOT NULL CHECK (kind IN ('product','service')),
 name VARCHAR(240) NOT NULL,
 brand VARCHAR(120),
 model VARCHAR(120),
 barcode VARCHAR(32),
 category VARCHAR(160),
 unit VARCHAR(40),
 attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source,external_id)
);
CREATE INDEX IF NOT EXISTS idx_zuz_market_catalog_name ON zuz_market_catalog (lower(name));
CREATE INDEX IF NOT EXISTS idx_zuz_market_catalog_barcode ON zuz_market_catalog (barcode);
CREATE INDEX IF NOT EXISTS idx_zuz_market_catalog_category ON zuz_market_catalog (kind,category);
CREATE TABLE IF NOT EXISTS zuz_market_prices (
 id TEXT PRIMARY KEY,
 catalog_id TEXT NOT NULL REFERENCES zuz_market_catalog(id) ON DELETE CASCADE,
 source VARCHAR(40) NOT NULL,
 source_ref VARCHAR(160) NOT NULL,
 seller VARCHAR(180),
 price NUMERIC(14,2) NOT NULL CHECK (price > 0),
 currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
 unit VARCHAR(40),
 region VARCHAR(120),
 condition VARCHAR(32) NOT NULL DEFAULT 'new',
 price_type VARCHAR(32) NOT NULL CHECK (price_type IN ('retail','public_purchase','wholesale')),
 url TEXT,
 observed_at TIMESTAMPTZ NOT NULL,
 fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source,source_ref)
);
CREATE INDEX IF NOT EXISTS idx_zuz_market_prices_lookup ON zuz_market_prices (catalog_id,price_type,observed_at DESC);
CREATE TABLE IF NOT EXISTS zuz_market_cache (
 cache_key VARCHAR(180) PRIMARY KEY,
 payload JSONB NOT NULL,
 fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Sem políticas públicas de leitura: o backend autenticado controla todas as consultas.
ALTER TABLE zuz_market_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE zuz_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE zuz_market_cache ENABLE ROW LEVEL SECURITY;
