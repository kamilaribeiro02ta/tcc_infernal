# ZUZ — Reformulação da consulta de mercado

Data: 18/10/2026
Branch: feat/mercado-ux-precificacao-20261018
Base: 8ebbbb8997f4741a244c93cd3de75487e9db5fa0

## Objetivo
O usuário pesquisa por produto, marca, modelo ou GTIN, escolhe uma opção, consulta preços comerciais verificáveis e decide se deseja utilizar o produto ou a referência em uma simulação. O CATMAT, impostos, histórico e fontes não aparecem como documentação na experiência principal.

## Alterações de frontend
- shared/market-ui-v2.js: refeito como interface única; pesquisa em destaque, lista curta, detalhes do produto, cotações e uma ação principal. Até 12 resultados comerciais ou 5 materiais relacionados quando não existem resultados atuais.
- shared/market-ui-v2.css: hierarquia, espaçamento, componentes responsivos, cores e tema escuro coerentes com a identidade roxa e Poppins.
- produtos/produtos.html, custos/custos.html e simulacoes/simulacoes.html: retiradas interfaces redundantes market-intelligence-ui e market-extended-ui, sem remover os conectores de backend.
- simulacoes/simulacoes.html: consulta visível diretamente; referências manuais e seus campos recolhidos em detalhes.
- produtos/produtos.js: preenche dados públicos após confirmação; anúncios semelhantes preenchem apenas o nome, nunca o custo ou o preço de venda.
- simulacoes/simulacoes.js: não calcula média de mercado a partir de valores manuais heterogêneos; permite acrescentar referência verificada à simulação e preservar dados do produto.

## Correções no backend
- server/api.js: pesquisa comercial como padrão, CATMAT somente quando necessário; equivalência textual por tokens.
- server/market-quality.js: varejo válido exige mesmo GTIN, nova condição, unidade, moeda BRL, estabelecimento, região, URL e origem verificáveis, observado há até 30 dias.
- server/market.js: endpoint de verificação por identificador da cotação, resumo comercial separado de compras públicas. Média, mínimo e máximo somente com pelo menos três estabelecimentos independentes e produtos/regiões equivalentes.
- server/simulations-routes.js: cotação externa validada novamente ao salvar, com valor, data, origem e equivalência. Os valores manuais permanecem identificados como manuais.
- server/market-intelligence.js: anúncios SerpApi classificados como semelhantes, preservação de variantes Plus, uso de HTTPS e distinção entre data da consulta e data da atualização da loja.

## Estado do banco nesta revisão (somente leitura)
- 5.898 itens de catálogo; 5.875 CATMAT, 12 Open Food Facts, 1 Open Beauty Facts e 10 serviços Compras.gov.
- 100 registros de preços, todos compras governamentais; 0 preços atuais de varejo; 0 cotações dos últimos 30 dias; 0 BPS/SINAPI importados.
- Não houve alteração de dados privados, usuários, custos, preços, índices ou tabelas do Neon.

## Credenciais e limite de cobertura
Na Vercel, a variável DATABASE_URL estava presente. SerpApi, Keepa e IBPT dependem de credenciais próprias para resultados externos. A reformulação não cria preços nem finge média quando o fornecedor não retorna dados. CATMAT é referência de descrição, não varejo atual.

## Validações realizadas
- Testes determinísticos de filtragem de loja, data, GTIN, duplicações, moeda, regiões, compras públicas e tamanho mínimo da amostra.
- Testes simulados de DOM para busca por vassoura sem preço, cadastro manual, anúncio moderno e transferência confirmada para Simulações.
- Revisão de sintaxe de arquivos JavaScript e verificações de montagem de scripts nas páginas.

## Pendências antes de integrar a main
1. Executar npm run test:core em Node 24 com dependências instaladas.
2. Testar autenticação, APIs reais, navegação em desktop/mobile, temas claro/escuro e foco de teclado em navegador real.
3. Validar o preenchimento dos catálogos e as chaves de fornecedores autorizados.
4. Aprovar integração da branch e publicação no endereço de produção.
5. Confirmar os preços, a origem e o SHA do deploy antes de anunciar funcionalidade operacional.

Situação: mudanças salvas na branch de desenvolvimento; sem merge na main e sem publicação manual em produção.
