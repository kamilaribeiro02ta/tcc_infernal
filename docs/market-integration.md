# ZUZ — referências públicas de mercado

## Estado da implementação

Integração **aditiva**, diretamente na main, sem redesenho de páginas:
- Produtos: busca por nome ou código, seleção de item e vínculo opcional ao cadastro privado. Cálculo assistido depende dos custos informados e confirmação no formulário.
- Custos: consulta pública informativa dentro da seção Referências de mercado; não modifica os custos e referências privadas automaticamente.
- Simulações: pesquisa de cotações na seção Concorrência. A importação exige confirmação, código de barras idêntico, unidade e condição compatíveis, cotação recente e três lojas distintas. Valores públicos de compra governamental não são automaticamente adicionados aos cenários.
- Continua possível cadastrar produtos/serviços e precificar inteiramente sem referências externas.

## Fontes ativas e limitações

1. Open Food Facts: API pública para catálogo de **produtos alimentícios** (nome, GTIN, marca e quantidade). Busca por texto usa a API legada de pesquisa, cuja disponibilidade pode mudar. A fonte **não retorna preços** de varejo por si só.
2. Open Prices: API colaborativa de **preços por código de barras**. A ZUZ filtra moeda BRL, unidade individual, GTIN idêntico, preços regulares e datas válidas. Alguns produtos/regiões podem ter zero cotações.
3. Compras.gov.br: **consulta por código oficial** de CATMAT/CATSER (material e serviço) e respectivas referências de aquisições. Os códigos são a entrada para pesquisa por setor; compras públicas não representam preços de varejo.

Os conectores Mercado Livre, PNCP, SINAPI e outras fontes comerciais **não estão ativados**. Antes de ativá-los, validar documentação, permissões, uso de dados, cotas e metodologia de equivalência. Nunca declarar cobertura universal nem preços em tempo real sem provas.

Fontes de documentação:
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/products/get-product-by-code/
- https://prices.openfoodfacts.org/api/docs
- https://github.com/openfoodfacts/open-prices/blob/main/API.md
- https://manual-api-compras.readthedocs.io/pt-br/latest/

**Licenciamento:** Open Food Facts/Open Prices utilizam ODbL; manter atribuição, consultar obrigações de compartilhamento e não misturar indiscriminadamente com dados de licença incompatível. Registros de cada fonte mantêm rótulo, data e origem. Verificar os termos antes de construir uma base derivada para redistribuição.

## PostgreSQL e SQLite

- Esquema PostgreSQL aditivo em `db/migrations/001-market-postgresql.sql`.
- Índices GIN de busca por nome, marca, modelo e categoria em `db/migrations/002-market-search-indexes.sql`, utilizando `pg_trgm`.
- As tabelas equivalentes já estão em `db/sqlite.sql`; ao iniciar o servidor local, o SQLite cria as novas tabelas sem descartar as anteriores.
- A migração de mercado foi aplicada no projeto Neon de produção já existente. Em **novos bancos PostgreSQL**, aplicar primeiro `db/schema.sql` e depois `db/migrations/001-market-postgresql.sql` e `db/migrations/002-market-search-indexes.sql`.
- Tabelas `zuz_market_catalog`, `zuz_market_prices`, `zuz_market_cache` não contêm `company_id`, custos, margens, faturamento ou informações internas de outras empresas. São exclusivamente dados públicos e cache.
- Os produtos e resultados privados continuam armazenados nas tabelas de empresas existentes com controle autenticado por `company_id`.
- RLS foi habilitado nas tabelas públicas e o acesso é mediado pelo backend. Não fornecer credenciais PostgreSQL ao navegador.
- `DATABASE_URL` deve estar configurada **no ambiente server-side** na Vercel. Não utilizar SQLite efêmero em Vercel.

### Popular o catálogo global com dados públicos

O índice começa vazio e é preenchido por buscas e por importação oficial paginada. Para importar materiais e serviços de Compras.gov.br, em ambiente com acesso à internet e `DATABASE_URL` configurada para o banco escolhido:

```bash
npm run market:import -- --kind=service --pages=10 --start=1
npm run market:import -- --kind=product --pages=10 --start=1
```

O parâmetro `--start` permite continuar em outra página e `--pages` aceita no máximo 200 por execução. O processo é idempotente e nunca importa dados de usuários. Ele **não foi executado nesta entrega**, pois a sessão de desenvolvimento não tem acesso HTTP direto ao endpoint externo; portanto, não existe promessa de milhões de produtos já carregados.

## Endpoints (todos exigem autenticação)

- `GET /api/market/catalog?q=<termo-ou-codigo>`: busca local e consulta pública; retorna lista de candidatos e eventuais erros de fonte.
- `GET /api/market/quotes?id=<id-do-catalogo>`: recupera cotações e estatísticas segregadas por natureza, condição e unidade.
- `POST /api/market/recommend`: `{ "directCost": 50, "targetMargin": 30, "itemId": "opcional" }`; retorna custo informado, mínimo sustentável, preço técnico, sugestão e justificativa. Todos os cálculos são determinísticos com `shared/pricing-core.js`.

## Regras de confiabilidade

- Estatísticas de preço consideram registros de até 90 dias, exibindo cotações antigas separadamente.
- Só usar mediana de varejo na sugestão quando há GTIN igual e pelo menos três lojas distintas; nunca usar preço público governamental como varejo.
- Dados incompletos retornam ausência de referência, **sem preenchimento fictício**.
- Cachê global por consulta: catálogo 12h; cotações Open Prices 12h; cotações Compras.gov.br 7 dias.
- Falhas externas não interrompem o cálculo manual. Resposta exibirá aviso e poderá listar preços antigos, devidamente identificados.
- Para produção com alto tráfego, substituir rate limit em memória por um serviço persistente e acrescentar monitoramento, paginação extensa e tarefas agendadas de importação autorizada.

## Testes e implantação

Executar na máquina do projeto:

```bash
npm install
npm run test:core
npm start
```

Após iniciar, validar login, cadastro, edição, histórico e exclusão de produtos; buscar por GTIN alimentício real; consultar CATMAT/CATSER pelo código; confirmar a ausência de dados para categoria sem cotação; verificar confirmação antes de aplicar preço e testar mobile / temas claro e escuro.

**Limitação desta entrega:** o teste de sintaxe e um teste de fluxo usando respostas controladas passaram, mas não foi executado um teste de navegação no navegador nem consulta efetiva a APIs externas no ambiente Vercel. Não considerar a funcionalidade validada em produção antes dessas verificações.
