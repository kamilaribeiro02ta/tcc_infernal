-- Dados oficiais de aquisicao e custos; nao sao precos de varejo
CREATE TABLE IF NOT EXISTS zuz_sector_public_prices (
 id TEXT PRIMARY KEY, source TEXT NOT NULL CHECK(source IN ('bps','sinapi')),
 source_ref TEXT NOT NULL, product_name TEXT NOT NULL, product_code TEXT,
 uf CHAR(2), unit TEXT NOT NULL, price NUMERIC(16,4) NOT NULL CHECK(price>0),
 reference_date DATE NOT NULL, category TEXT NOT NULL CHECK(category IN ('health_purchase','construction_input')),
 provenance_url TEXT NOT NULL, imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source,source_ref,reference_date,uf,unit)
);
CREATE INDEX IF NOT EXISTS idx_sector_prices_name ON zuz_sector_public_prices USING gin (lower(product_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sector_prices_date ON zuz_sector_public_prices(source,reference_date DESC);
