# ZUZ — Fontes ampliadas de preços e impostos — 18/10/2026

## Implementado no código
- Keepa: integração por GTIN/EAN ou ASIN na Amazon Brasil, histórico de preço quando a assinatura está ativa. Necessita KEEPA_API_KEY, consulta consome tokens. Cache de 6 horas para reduzir chamadas. Não presume pesquisa textual Keepa no marketplace brasileiro.
- BPS: esquema PostgreSQL, importador de CSV oficial e rota de consulta. **Compra de medicamentos e dispositivos médicos, não varejo**. Necessita importar arquivos oficiais.
- SINAPI: mesma infraestrutura, exclusivamente para referências de custos de materiais e construção, não anúncios de lojas. Necessita importar arquivos oficiais; preço zero é rejeitado. A Caixa informa preços zerados em alguns relatórios a partir da referência outubro de 2025.
- Classif: consulta do JSON da NCM vigente disponibilizado pela Receita Federal e seleção de candidatos, com fallback BrasilAPI; NCM não é alíquota automática.
- IPCA: série mensal SGS 433 do Banco Central. Permite referência de inflação, distinta de variação histórica do preço de um produto; intervalos incompletos não devem ser extrapolados.
- RTC: adaptador para API oficial **offline auto-hospedada**. Não há API pública de cálculo online livre para integração com sites. Só encaminhar solicitações com dados fiscais completos a motor que já tenha sido hospedado e validado.
- IBPT, Open Prices, Compras.gov e SerpApi: conectores anteriores preservados, cada qual sujeito a suas credenciais, cobertura e limites.

## URLs oficiais
- Keepa produto: https://keepa.com/api-docs/product.html
- BPS arquivos: https://dadosabertos.saude.gov.br/dataset/bps
- SINAPI: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx
- Classif NCM JSON: https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO
- IPCA BCB SGS 433: https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json
- RTC offline oficial: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora/calculadora-offline/calculadora-offline-instrucoes
- RTC Swagger: https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/api/swagger-ui/index.html

## Ativação
1. Configure DATABASE_URL no backend, não no frontend. A migração db/migrations/003-sector-public-prices.sql foi aplicada ao banco Neon vinculado na sessão; nenhum preço setorial foi importado ainda.
2. Para Keepa, configure KEEPA_API_KEY da sua assinatura no servidor. O código consulta produto por código ou ASIN na Amazon Brasil (domain 12).
3. Para BPS, baixe e descompacte CSV oficial; para SINAPI, baixe XLSX oficial e exporte a planilha relevante em CSV UTF-8. Verifique cabeçalhos, data e unidade.
4. Importe somente colunas comprovadas, usando mapeamento CLI real. Exemplo SINTÁTICO, não nomes confirmados do dataset:
   npm run market:sector-import -- --source=bps --file=./dados/bps.csv --url=https://dadosabertos.saude.gov.br/dataset/bps --map=name:DESCRICAO,price:PRECO,unit:UNIDADE,date:DATA,ref:ID,uf:UF --dryRun=true
   Remova --dryRun=true somente depois de inspecionar os registros; o importador exige PostgreSQL persistente e limita CSV a 200MB por lote.
   Para SINAPI, substitua --source=sinapi, o endereço da Caixa e o mapa de colunas real.
5. Para RTC, hospede o pacote oficial Docker/Java 21 separado da Vercel e configure RTC_OFFLINE_API_BASE_URL como HTTPS terminando em /api; RTC_OFFLINE_API_TOKEN é opcional. Valide a versão e contrato Swagger antes de utilizar cálculo real; é necessário informar classificação, UF, município, base, CST e cClassTrib.
6. Para IBPT, mantenha IBPT_TOKEN autorizado se quiser exibir carga aproximada ao consumidor; não é DAS ou tributo líquido da empresa.

## Consultas autenticadas
- GET /api/market/v2/search?q=vassoura&historical=true — resultados e histórico por páginas.
- GET /api/market/v2/item?id=... — identificação.
- GET /api/market/keepa?gtin=... — histórico Amazon Brasil.
- GET /api/market/sector-prices?q=...&source=bps — preços BPS importados.
- GET /api/market/sector-prices?q=...&source=sinapi — preços SINAPI importados.
- GET /api/market/classif?q=... — NCM oficial candidato.
- GET /api/market/ipca?fromYear=2018 — IPCA mensal.
- GET /api/market/rtc/status — motor RTC configurado ou não.
- POST /api/market/rtc/calculate — motor RTC offline configurado, com solicitação validada.
- POST /api/market/tax-context — simulação tributária manual contextual, IBPT opcional.

## Integridade e limites
- Ano do CATMAT 2018 nunca é apresentado como preço de 2018.
- BPS/SINAPI sempre identificados como aquisição/custos, não varejo.
- Keepa registra alterações de preço, não contagem de vendas ou preço médio diário.
- Comparação entre produtos exige mesma unidade, versão, condição e identificador quando possível.
- ICMS, substituição tributária, ISS, IPI, IBS/CBS, Simples Nacional e MEI não podem ser determinados somente pelo nome, NCM ou preço sem demais informações.
- O IPCA não cria cotação histórica: só atualiza matematicamente um valor fornecido.
- Não há garantia de deploy funcional até testes HTTP em produção. Durante a execução, o acesso da Vercel para verificar logs retornou erro 403.
