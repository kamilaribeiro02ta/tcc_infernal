-- Catálogos complementares atuais. Identificação de produtos não é cotação.
CREATE EXTENSION IF NOT EXISTS unaccent;
INSERT INTO zuz_market_sources(source,name,category,provider_url,license_name,needs_authorization,is_active,has_product_ids,has_observed_prices,notes,operational_status) VALUES
('openbeautyfacts','Open Beauty Facts','catalog','https://world.openbeautyfacts.org/','ODbL',FALSE,TRUE,TRUE,FALSE,'Identificação de produtos de beleza e higiene, sem preços de varejo garantidos.','connector_pending_live_test'),
('openproductsfacts','Open Products Facts','catalog','https://world.openproductsfacts.org/','ODbL',FALSE,TRUE,TRUE,FALSE,'Catálogo geral por marca e GTIN, sem preços.','connector_pending_live_test'),
('openpetfoodfacts','Open Pet Food Facts','catalog','https://world.openpetfoodfacts.org/','ODbL',FALSE,TRUE,TRUE,FALSE,'Alimentos para animais, sem preços.','connector_pending_live_test')
ON CONFLICT(source) DO UPDATE SET provider_url=excluded.provider_url,has_product_ids=excluded.has_product_ids,has_observed_prices=excluded.has_observed_prices,notes=excluded.notes;
-- Mantém a assinatura da função, permitindo busca sem acentos.
DO $$
DECLARE ddl TEXT;
BEGIN
 SELECT pg_get_functiondef('zuz_market_search_v2(text,text,text,boolean,integer)'::regprocedure) INTO ddl;
 ddl=replace(ddl,'lower(c.name) LIKE','unaccent(lower(c.name)) LIKE');
 ddl=replace(ddl,'input.q','unaccent(input.q)');
 EXECUTE ddl;
END $$;
