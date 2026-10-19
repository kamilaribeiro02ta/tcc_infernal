-- Curadoria reversível do catálogo público. Não altera produtos de empresas.
-- Criar a estrutura não executa a limpeza: usar market:curate (prévia por padrão).
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE TABLE IF NOT EXISTS zuz_market_catalog_archive (
  catalog_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  reference_group TEXT NOT NULL,
  reason TEXT NOT NULL,
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  row_data JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source,external_id)
);
CREATE INDEX IF NOT EXISTS idx_zuz_catalog_archive_batch ON zuz_market_catalog_archive(batch_id);
CREATE TABLE IF NOT EXISTS zuz_market_catalog_policy (
  id SMALLINT PRIMARY KEY CHECK(id=1),
  max_per_group SMALLINT NOT NULL CHECK(max_per_group BETWEEN 1 AND 10)
);
INSERT INTO zuz_market_catalog_policy(id,max_per_group) VALUES(1,3) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION zuz_market_normalize(value TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT trim(regexp_replace(unaccent(lower(COALESCE(value,''))), '[^a-z0-9]+', ' ', 'g'))
$$;
CREATE OR REPLACE FUNCTION zuz_market_group_key(item_kind TEXT,commercial TEXT,full_name TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT COALESCE(item_kind,'product') || '|' ||
    zuz_market_normalize(split_part(COALESCE(NULLIF(trim(commercial),''),full_name,''),',',1)) ||
    CASE WHEN species IS NULL THEN '' ELSE '|especie ' || zuz_market_normalize(species) END
  FROM (SELECT (regexp_match(COALESCE(full_name,''), '(?:^|,)\s*ESP[ÉE]CIE\s*(?:[0-9]+\s+)?([^,]+)', 'i'))[1] AS species) s
$$;
CREATE OR REPLACE FUNCTION zuz_market_catalog_quality(item JSONB)
RETURNS INTEGER LANGUAGE SQL IMMUTABLE AS $$
  SELECT
    CASE WHEN COALESCE(item->>'barcode','') ~ '^[0-9]{8,14}$' THEN 40 ELSE 0 END +
    CASE WHEN NULLIF(trim(item->>'brand'),'') IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN NULLIF(trim(item->>'model'),'') IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN NULLIF(trim(item->>'unit'),'') IS NOT NULL THEN 7 ELSE 0 END +
    CASE WHEN position(',' in COALESCE(item->>'name',''))>0 THEN 8 ELSE 0 END +
    CASE WHEN NULLIF(trim(item->'attributes'->>'description'),'') IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN NULLIF(trim(item->'attributes'->>'image_url'),'') IS NOT NULL THEN 2 ELSE 0 END +
    CASE WHEN COALESCE(item->>'source','') <> 'catmat_archive_2018' THEN 5 ELSE 0 END
$$;
CREATE OR REPLACE FUNCTION zuz_market_catalog_is_used(item_id TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM zuz_products p WHERE p.payload::text LIKE '%'||item_id||'%')
    OR EXISTS(SELECT 1 FROM zuz_simulations s WHERE s.snapshot::text LIKE '%'||item_id||'%')
    OR EXISTS(SELECT 1 FROM zuz_companies c WHERE c.settings::text LIKE '%'||item_id||'%')
$$;
ALTER TABLE zuz_market_catalog ADD COLUMN IF NOT EXISTS reference_group TEXT;
UPDATE zuz_market_catalog
SET reference_group=zuz_market_group_key(kind,commercial_name,name)
WHERE reference_group IS DISTINCT FROM zuz_market_group_key(kind,commercial_name,name);
ALTER TABLE zuz_market_catalog ALTER COLUMN reference_group SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_zuz_market_reference_group ON zuz_market_catalog(reference_group);

CREATE OR REPLACE FUNCTION zuz_market_catalog_plan(max_per_group INTEGER DEFAULT 3)
RETURNS TABLE(catalog_id TEXT,reference_group TEXT,protected BOOLEAN,quality INTEGER,position_in_group BIGINT)
LANGUAGE SQL STABLE AS $$
 WITH identified AS (
  SELECT c.id,c.reference_group AS group_key,
    (EXISTS(SELECT 1 FROM zuz_market_prices p WHERE p.catalog_id=c.id) OR zuz_market_catalog_is_used(c.id)) AS protected,
    zuz_market_catalog_quality(to_jsonb(c)) AS quality,
    CASE WHEN COALESCE(c.barcode,'') ~ '^[0-9]{8,14}$' THEN c.barcode ELSE zuz_market_normalize(c.name) END AS signature
  FROM zuz_market_catalog c
 ), distinct_first AS (
  SELECT *,row_number() OVER(PARTITION BY group_key,signature ORDER BY protected DESC,quality DESC,id) AS signature_position
  FROM identified
 ), ranked AS (
  SELECT id,group_key,protected,quality,
    row_number() OVER(PARTITION BY group_key ORDER BY protected DESC,(signature_position=1) DESC,quality DESC,id) AS position_in_group
  FROM distinct_first
 )
 SELECT * FROM ranked
$$;

CREATE OR REPLACE FUNCTION zuz_market_curate_catalog(max_per_group INTEGER DEFAULT 3,dry_run BOOLEAN DEFAULT TRUE)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  candidates TEXT[]; initial_count INTEGER; removed_count INTEGER; groups_count INTEGER;
  protected_count INTEGER; cleanup_batch UUID:=gen_random_uuid(); result JSONB;
BEGIN
  IF max_per_group<1 OR max_per_group>10 THEN RAISE EXCEPTION 'Use limite entre 1 e 10'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('zuz-market-curation',0));
  LOCK TABLE zuz_market_catalog,zuz_market_prices IN SHARE ROW EXCLUSIVE MODE;
  SELECT COUNT(*),COUNT(DISTINCT reference_group) INTO initial_count,groups_count FROM zuz_market_catalog;
  SELECT COALESCE(array_agg(catalog_id) FILTER(WHERE NOT protected AND position_in_group>max_per_group),'{}'::text[]),
    COUNT(*) FILTER(WHERE protected)
  INTO candidates,protected_count FROM zuz_market_catalog_plan(max_per_group);
  result:=jsonb_build_object('before',initial_count,'after',initial_count-cardinality(candidates),
    'removed',cardinality(candidates),'groups',groups_count,'protected',protected_count,
    'limit',max_per_group,'dryRun',dry_run,'batchId',cleanup_batch);
  IF dry_run THEN RETURN result; END IF;
  UPDATE zuz_market_catalog_policy SET max_per_group=zuz_market_curate_catalog.max_per_group WHERE id=1;
  IF cardinality(candidates)=0 THEN RETURN result; END IF;
  WITH archived AS (
    INSERT INTO zuz_market_catalog_archive(catalog_id,source,external_id,reference_group,reason,batch_id,row_data)
    SELECT c.id,c.source,c.external_id,c.reference_group,'excess_without_price_or_usage',cleanup_batch,to_jsonb(c)
    FROM zuz_market_catalog c WHERE c.id=ANY(candidates)
    ON CONFLICT DO NOTHING RETURNING catalog_id
  ), deleted AS (
    DELETE FROM zuz_market_catalog c USING archived a
    WHERE c.id=a.catalog_id AND NOT EXISTS(SELECT 1 FROM zuz_market_prices p WHERE p.catalog_id=c.id)
      AND NOT zuz_market_catalog_is_used(c.id)
    RETURNING c.id
  ) SELECT COUNT(*) INTO removed_count FROM deleted;
  IF removed_count<>cardinality(candidates) THEN RAISE EXCEPTION 'Catálogo mudou; limpeza cancelada integralmente'; END IF;
  DELETE FROM zuz_market_cache WHERE cache_key LIKE 'search:%' OR cache_key LIKE 'discovery%';
  RETURN result;
END
$$;

CREATE OR REPLACE FUNCTION zuz_market_guard_catalog_import()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.reference_group:=zuz_market_group_key(NEW.kind,NEW.commercial_name,NEW.name);
  IF TG_OP='UPDATE' OR current_setting('zuz.catalog_restore',TRUE)='on' THEN RETURN NEW; END IF;
  -- Clientes antigos esperam uma linha em RETURNING. A nova versão opta pela
  -- curadoria na própria transação para contabilizar corretamente linhas recusadas.
  IF current_setting('zuz.catalog_curated_import',TRUE) IS DISTINCT FROM 'on' THEN RETURN NEW; END IF;
  IF EXISTS(SELECT 1 FROM zuz_market_catalog c WHERE c.id=NEW.id OR (c.source=NEW.source AND c.external_id=NEW.external_id)) THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('zuz-market-group:'||NEW.reference_group,0));
  IF EXISTS(SELECT 1 FROM zuz_market_catalog_archive a WHERE a.catalog_id=NEW.id OR (a.source=NEW.source AND a.external_id=NEW.external_id)) THEN RETURN NULL; END IF;
  IF (SELECT COUNT(*) FROM zuz_market_catalog WHERE reference_group=NEW.reference_group)>=(SELECT max_per_group FROM zuz_market_catalog_policy WHERE id=1) THEN
    INSERT INTO zuz_market_catalog_archive(catalog_id,source,external_id,reference_group,reason,row_data)
    VALUES(NEW.id,NEW.source,NEW.external_id,NEW.reference_group,'import_group_capacity',to_jsonb(NEW))
    ON CONFLICT DO NOTHING;
    RETURN NULL;
  END IF;
  RETURN NEW;
END
$$;
CREATE OR REPLACE FUNCTION zuz_market_use_curated_import()
RETURNS BOOLEAN LANGUAGE plpgsql VOLATILE AS $$
BEGIN
  PERFORM set_config('zuz.catalog_curated_import','on',TRUE);
  RETURN TRUE;
END
$$;
DROP TRIGGER IF EXISTS zuz_market_catalog_import_guard ON zuz_market_catalog;
CREATE TRIGGER zuz_market_catalog_import_guard BEFORE INSERT OR UPDATE ON zuz_market_catalog
FOR EACH ROW EXECUTE FUNCTION zuz_market_guard_catalog_import();
