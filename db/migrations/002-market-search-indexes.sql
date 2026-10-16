-- ZUZ Market 002: índices de pesquisa escaláveis para catálogo multissetorial.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_zuz_market_name_trgm ON zuz_market_catalog USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_zuz_market_brand_trgm ON zuz_market_catalog USING gin (lower(brand) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_zuz_market_model_trgm ON zuz_market_catalog USING gin (lower(model) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_zuz_market_category_trgm ON zuz_market_catalog USING gin (lower(category) gin_trgm_ops);
