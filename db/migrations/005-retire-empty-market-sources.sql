-- Retira a ativação de conectores sem dados, preservando cadastros e observações.
-- Executar após as migrações 003 (qualidade/setoriais) e 004.
UPDATE zuz_market_sources AS s
SET is_active=FALSE,
    operational_status='retired_no_imported_data',
    updated_at=NOW()
WHERE s.source IN (
  'openproductsfacts','openpetfoodfacts','openprices',
  'keepa','serpapi','bps','sinapi','mercadolivre','pncp','anp'
)
AND (s.is_active OR s.operational_status IS DISTINCT FROM 'retired_no_imported_data')
AND NOT EXISTS (SELECT 1 FROM zuz_market_catalog c WHERE c.source=s.source)
AND NOT EXISTS (SELECT 1 FROM zuz_market_prices p WHERE p.source=s.source)
AND NOT EXISTS (SELECT 1 FROM zuz_sector_public_prices p WHERE p.source=s.source);
