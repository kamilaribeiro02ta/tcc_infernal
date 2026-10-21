-- Vendas reais e estoque independentes das unidades estimadas de precificacao.
CREATE TABLE IF NOT EXISTS zuz_inventory (
 company_id UUID NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 product_id UUID NOT NULL REFERENCES zuz_products(id) ON DELETE CASCADE,
 quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(company_id,product_id)
);
CREATE TABLE IF NOT EXISTS zuz_sales (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id UUID NOT NULL REFERENCES zuz_companies(id) ON DELETE CASCADE,
 product_id UUID NOT NULL REFERENCES zuz_products(id) ON DELETE RESTRICT,
 quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price NUMERIC(14,2) NOT NULL CHECK(unit_price>0),
 unit_cost NUMERIC(14,2) NOT NULL CHECK(unit_cost>=0),
 sold_at DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zuz_sales_company_date ON zuz_sales(company_id,sold_at DESC);
ALTER TABLE zuz_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE zuz_sales ENABLE ROW LEVEL SECURITY;
