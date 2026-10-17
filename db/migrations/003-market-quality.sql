-- ZUZ mercado v2. Migração aditiva, segura e idempotente. Executar após 001 e 002.
-- Já aplicada no banco Neon atual. Jamais copia dados de empresas para tabelas globais.
CREATE TABLE IF NOT EXISTS zuz_market_sources (
 source TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,
 provider_url TEXT NOT NULL,license_name TEXT,
 needs_authorization BOOLEAN NOT NULL DEFAULT FALSE,
 is_active BOOLEAN NOT NULL DEFAULT FALSE,
 has_product_ids BOOLEAN NOT NULL DEFAULT FALSE,
 has_observed_prices BOOLEAN NOT NULL DEFAULT FALSE,
 last_successful_sync TIMESTAMPTZ,last_error TEXT,notes TEXT,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE zuz_market_sources ADD COLUMN IF NOT EXISTS operational_status TEXT NOT NULL DEFAULT 'not_verified';
CREATE TABLE IF NOT EXISTS zuz_market_price_history (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 quote_id TEXT NOT NULL REFERENCES zuz_market_prices(id) ON DELETE RESTRICT,
 source TEXT NOT NULL,source_ref TEXT NOT NULL,
 price NUMERIC(14,2) NOT NULL CHECK(price>0),
 observed_at TIMESTAMPTZ NOT NULL,
 collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(quote_id,observed_at,price)
);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS gtin VARCHAR(32);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS offer_title TEXT;
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS brand VARCHAR(120);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS model VARCHAR(140);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS variant VARCHAR(140);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC(14,5);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS min_order_quantity NUMERIC(14,5);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(14,2);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS previous_price NUMERIC(14,2);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS region_state VARCHAR(32);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS region_city VARCHAR(120);
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) DEFAULT 'unverified';
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS confidence_score SMALLINT;
ALTER TABLE zuz_market_prices ADD COLUMN IF NOT EXISTS price_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE zuz_market_catalog ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE zuz_market_catalog ADD COLUMN IF NOT EXISTS commercial_name VARCHAR(240);
ALTER TABLE zuz_market_catalog ADD COLUMN IF NOT EXISTS commercial_search_ready BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE zuz_market_catalog ADD COLUMN IF NOT EXISTS category_normalized VARCHAR(160);
UPDATE zuz_market_catalog
 SET is_historical=TRUE,commercial_search_ready=FALSE,
 commercial_name=LEFT(TRIM(SPLIT_PART(name,',',1)),240)
 WHERE source='catmat_archive_2018'
 AND (is_historical=FALSE OR commercial_name IS NULL OR commercial_search_ready=TRUE);
UPDATE zuz_market_catalog
 SET commercial_name=LEFT(TRIM(SPLIT_PART(name,',',1)),240),
 commercial_search_ready=(source='openfoodfacts' AND barcode IS NOT NULL)
 WHERE source!='catmat_archive_2018' AND commercial_name IS NULL;
CREATE INDEX IF NOT EXISTS idx_zuz_market_catalog_relevance
 ON zuz_market_catalog(commercial_search_ready,is_historical,source);
CREATE INDEX IF NOT EXISTS idx_zuz_market_catalog_search_new
 ON zuz_market_catalog(is_historical,kind,commercial_search_ready,lower(commercial_name));
CREATE INDEX IF NOT EXISTS idx_zuz_market_prices_gtin ON zuz_market_prices(gtin);
CREATE INDEX IF NOT EXISTS idx_zuz_market_price_history_quote_date
 ON zuz_market_price_history(quote_id,observed_at DESC);
CREATE OR REPLACE FUNCTION zuz_market_search_v2(
 p_term TEXT,p_kind TEXT DEFAULT NULL,p_category TEXT DEFAULT NULL,
 p_include_historical BOOLEAN DEFAULT FALSE,p_limit INTEGER DEFAULT 16)
RETURNS TABLE(item_id TEXT,kind TEXT,display_name TEXT,brand TEXT,model TEXT,barcode TEXT,category TEXT,source TEXT,is_historical BOOLEAN,has_price BOOLEAN,match_score INTEGER)
LANGUAGE sql STABLE AS $$
 WITH input AS(
 SELECT lower(trim(coalesce(p_term,''))) AS q,least(30,greatest(1,coalesce(p_limit,16))) AS lim
 ), ranked AS(
 SELECT c.id,c.kind,COALESCE(NULLIF(c.commercial_name,''),split_part(c.name,',',1)) AS title,
 c.brand,c.model,c.barcode,c.category,c.source,c.is_historical,
 EXISTS(SELECT 1 FROM zuz_market_prices p WHERE p.catalog_id=c.id) AS has_price,
 CASE WHEN lower(coalesce(c.barcode,''))=input.q THEN 100
 WHEN lower(coalesce(c.commercial_name,c.name))=input.q THEN 95
 WHEN lower(coalesce(c.commercial_name,c.name)) LIKE input.q||'%' THEN 85
 WHEN lower(c.name) LIKE input.q||'%' THEN 75
 WHEN lower(c.name) LIKE '% '||input.q||'%' THEN 65
 WHEN lower(coalesce(c.brand,''))=input.q THEN 60
 WHEN lower(coalesce(c.model,''))=input.q THEN 60
 WHEN lower(coalesce(c.category,'')) LIKE '%'||input.q||'%' THEN 22
 ELSE 0 END AS relevance
 FROM zuz_market_catalog c CROSS JOIN input
 WHERE length(input.q)>=2 AND
 (p_include_historical OR NOT c.is_historical)
 AND (p_kind IS NULL OR c.kind=p_kind)
 AND (p_category IS NULL OR lower(coalesce(c.category,'')) LIKE '%'||lower(p_category)||'%')
 AND (lower(c.name) LIKE '%'||input.q||'%'
 OR lower(coalesce(c.brand,'')) LIKE '%'||input.q||'%'
 OR lower(coalesce(c.model,'')) LIKE '%'||input.q||'%'
 OR lower(coalesce(c.barcode,''))=input.q)
 )
 SELECT id,kind,left(title,140),brand,model,barcode,category,source,is_historical,has_price,
 (relevance+CASE WHEN has_price THEN 12 ELSE 0 END
 -CASE WHEN is_historical THEN 40 ELSE 0 END)::integer
 FROM ranked WHERE relevance>0
 ORDER BY (relevance+CASE WHEN has_price THEN 12 ELSE 0 END
 -CASE WHEN is_historical THEN 40 ELSE 0 END) DESC,length(title),title
 LIMIT(SELECT lim FROM input)
$$;
ALTER TABLE zuz_market_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE zuz_market_price_history ENABLE ROW LEVEL SECURITY;
