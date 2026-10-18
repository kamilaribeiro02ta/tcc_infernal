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


## Segunda revisão — usabilidade para pessoas sem conhecimento técnico

Mudanças realizadas somente no frontend, na branch de desenvolvimento, sem alterar backend, banco, `main` ou Vercel Production:

- **Entrada acessível:** um único bloco para pesquisar por nome, marca ou código. É o principal destaque da seção de mercado, inserido próximo da escolha do produto em Simulações; em Custos, a inclusão manual permanece sob `Minhas referências de preço`.
- **Espaço de pesquisa focado:** abre uma janela própria com exemplos de pesquisa, mensagens simples e resultados organizados como linhas de produtos. Não há formulário fiscal ou documentação de APIs na primeira tela.
- **Ficha que sobe:** ao selecionar o produto, uma folha/cartão surge de baixo no celular e uma gaveta surge à direita no computador. O restante fica ao fundo; é possível fechar pelo fundo, pelo botão **Voltar aos produtos**, pela tecla Esc e por gesto descendente no topo da ficha.
- **Hierarquia de preço:** quando o backend fornece média comercial validada, **Preço médio nas lojas** é o destaque, seguido de menor/maior preço e observações das ofertas. Sem uma média validada, mostra ofertas individuais; sem preços, informa diretamente **Ainda não encontramos preços em lojas** e orienta a continuar a precificação manual.
- **Divulgação progressiva:** marcas, modelos, embalagem e condições essenciais aparecem primeiro. Detalhes do catálogo, impostos, histórico e informações técnicas ficam em **Ver detalhes e informações adicionais**, recolhido por padrão.
- **Prevenção de erros:** anúncios semelhantes são apresentados como anúncios a verificar na loja, nunca misturados à média confirmada. A importação exige confirmação; o preço anunciado não substitui custos nem o preço de venda.
- **Acessibilidade e controle:** botão de fechar com área de toque de 44 px, foco no cartão ao abrir e retorno ao produto ao fechar, teclado/Esc, `aria-live` nos estados e desativação da animação para quem prefere movimento reduzido.
- **Identidade preservada:** Poppins, cor roxa e modo escuro/claro existentes; sem alterar sidebar nem o design das outras seções.

### Heurísticas aplicadas

1. **Visibilidade do estado:** busca, carregamento, indisponibilidade e sucesso apresentam mensagens contextuais.
2. **Correspondência com a realidade:** a pessoa procura produto e preço, não APIs, NCM ou bancos.
3. **Controle e liberdade:** voltar, fechar, gesto descendente e cancelar confirmações.
4. **Consistência:** mesmo fluxo nas três páginas e componentes da identidade ZUZ.
5. **Prevenção de erros:** cotações sem validação não viram média; nada sobrescreve custos.
6. **Reconhecimento:** resultados com nome, marca e embalagem antes dos detalhes.
7. **Flexibilidade:** busca por texto, marca, código e sugestões.
8. **Minimalismo:** elementos técnicos deixam a interface principal.
9. **Recuperação de falhas:** mensagens em linguagem simples com próxima ação disponível.
10. **Ajuda contextual:** histórico, dados de origem e tributos acessíveis por expansão somente quando solicitados.

Os testes determinísticos da interface precisam continuar passando e a validação com navegador real e público-alvo é necessária antes de considerar a experiência definitivamente aprovada. A tela foi implementada e verificada em testes simulados, **não foi publicada na versão principal**.
