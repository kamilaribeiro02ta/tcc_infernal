# ZUZ — pesquisa, preços históricos e tributos (2026-10-17)

## Implementado no código
- Busca de produtos atuais e catálogo histórico CATMAT 2018 (separados e identificados), com paginação dos registros antigos.
- Consulta opcional a ofertas anunciadas por **SerpApi / Google Shopping**, somente quando **SERPAPI_API_KEY** estiver presente no ambiente server-side. Não grava anúncios no banco nem afirma equivalência perfeita entre modelos. A API pode consumir créditos e sua utilização depende dos termos do provedor.
- Ficha detalhada de produtos e ofertas similares em Produtos, Custos e Simulações.
- Histórico de **cotações observadas** guardadas no PostgreSQL/SQLite por ano, com 2018 e 2026 explicitamente mostrados como "sem cotação" quando não há registro. O ano do catálogo não é ano da cotação. Comparação nominal de anos exige correspondência verificável do mesmo código de barras e unidade.
- Busca opcional de códigos NCM candidatos por nome ou código na BrasilAPI (sem tratar sugestão como classificação fiscal confirmada).
- Formulário de enquadramento tributário com operação (revenda/produção/serviço), regime, UF, NCM ou código de serviço, preço e eventual alíquota informada. Simulação é **hipotética**, não cálculo do DAS ou apuração fiscal.
- Consulta opcional à API IBPT "De Olho no Imposto" quando **IBPT_TOKEN** está configurado e o usuário fornece CNPJ, UF, NCM/NBS e preço **voluntariamente**. A estimativa IBPT é carga aproximada incluída no preço ao consumidor, não o valor a recolher pela empresa. CNPJ não é gravado no banco nem no log.

## Fontes
- Produtos: Open Food Facts, Open Beauty Facts, Open Products Facts, Open Pet Food Facts; CATMAT histórico; Compras.gov (integrações já existentes).
- Preços: Open Prices, Compras.gov (já existentes); SerpApi Google Shopping (novo e opcional).
- Orientação fiscal: TIPI da Receita Federal, tabela NCM e IBS/CBS do Portal NF-e, CNAE do IBGE, IBPT mediante autorização; não existe uma alíquota universal para cada categoria.
- DataForSEO, Mercado Livre, Preço da Hora, Menor Preço Nota Gaúcha, ANP e Conab exigem análise dos contratos, credenciais e dos formatos antes de operar como conectores. **Não estão ativados** nesta entrega.

## Variáveis de ambiente (somente servidor)
- A fonte de NCM BrasilAPI não exige chave, mas pode ficar indisponível e não fornece alíquotas fiscais.
- SERPAPI_API_KEY: ativa a pesquisa de anúncios do Google Shopping via SerpApi.
- IBPT_TOKEN: ativa consulta opcional à API do IBPT com consentimento e identificação fornecidos pelo próprio usuário.
- DATABASE_URL: banco PostgreSQL persistente para a Vercel.

Sem SERPAPI_API_KEY os registros internos continuam encontráveis, mas ofertas comerciais externas não serão apresentadas.
Sem IBPT_TOKEN funciona a simulação manual de taxa, mas não são inventadas alíquotas fiscais.

## SQLite local
- A pesquisa de catálogo v2 tem alternativa local sem dependência de funções PostgreSQL; no SQLite, o arquivo do banco local não contém automaticamente os registros históricos do Neon.
- O histórico anual de preços com rastreabilidade depende de PostgreSQL; não inventar preços no ambiente local.

## Validação necessária antes de declarar produção pronta
1. Testar npm run test:core.
2. Fazer login e pesquisar "vassoura", "arroz" e "iPhone 18 Plus", conferir histórico e a seção de produtos comerciais separadas.
3. Consultar o endpoint autenticado GET /api/market/v2/search?q=vassoura&historical=true e avançar page=1.
4. Conferir GET /api/market/history?id=... e exigir explicitamente "sem cotação" quando não houver histórico confiável.
5. Testar valores do formulário fiscal, sem CNPJ nem IBPT, e checar que nenhuma alíquota é presumida.
6. Com credenciais próprias do provedor, testar no ambiente de produção uma pesquisa comercial e, voluntariamente, a consulta IBPT autorizada.
7. Validar a responsividade, modo escuro e comportamento em Produtos, Custos e Simulações.

**Não transformar preço médio de anúncios semelhantes em preço ideal de venda.** A sugestão financeira deve continuar calculada a partir dos custos do negócio e condições de comparabilidade.
