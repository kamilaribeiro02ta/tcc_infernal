-- Preços acadêmicos históricos ficam fora do catálogo e das cotações comerciais.
CREATE TABLE IF NOT EXISTS zuz_market_research_prices (
 source TEXT NOT NULL CHECK(source='uci_online_retail'),
 product_code TEXT NOT NULL,
 original_name TEXT NOT NULL CHECK(length(trim(original_name))>0),
 display_name TEXT,
 price NUMERIC NOT NULL CHECK(price>0 AND price<100000000),
 currency CHAR(3) NOT NULL CHECK(currency='GBP'),
 observed_at TIMESTAMP NOT NULL CHECK(observed_at>='2010-12-01' AND observed_at<'2011-12-10'),
 source_url TEXT NOT NULL CHECK(source_url='https://doi.org/10.24432/C5BW33'),
 source_sha256 CHAR(64) NOT NULL,
 license TEXT NOT NULL DEFAULT 'CC BY 4.0',
 imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(source,product_code)
);
-- Conserva toda a precisão publicada na planilha, sem arredondar a observação.
ALTER TABLE zuz_market_research_prices ALTER COLUMN price TYPE NUMERIC;
CREATE INDEX IF NOT EXISTS idx_market_research_name ON zuz_market_research_prices(lower(original_name));
ALTER TABLE zuz_market_research_prices ENABLE ROW LEVEL SECURITY;
