# ZUZ — mercado v2

## Aplicado
- Rotas autenticadas: GET /api/market/v2/search?q=termo e GET /api/market/quotes?id=id.
- Histórico CATMAT 2018 fica oculto por padrão, mas pode ser pesquisado com opção explícita.
- Resultados comerciais são compactos nas páginas Produtos, Custos e Simulações.
- A precificação manual, a identidade visual e a navegação existentes continuam.
- SQL: 003-market-quality.sql; aplicar em bancos novos após migrações 001 e 002. No Neon atual, a migração já foi executada.

## Limites
- Open Food Facts é um catálogo alimentar, NÃO fornece preços varejistas.
- Open Prices é uma base colaborativa por GTIN; seus registros não equivalem a anúncios ativos.
- Compras.gov.br inclui preços de compras institucionais, não preços de venda em lojas.
- Mercado Livre, PNCP, SINAPI e ANP não possuem importação comercial autorizada e validada nesta implementação.
- Recomendação comercial depende de equivalência (GTIN/unidade/condição/região) e amostra confiável; não inventar preços nem usar dados privados como catálogo.
- Com menos de três estabelecimentos distintos, NÃO apresentar média de mercado como representativa.
- Cotações antigas ficam separadas; ausência de preço não interrompe o cálculo manual.
- Atualização de código na main inicia deploy automático apenas se a Vercel estiver conectada e a cota de builds permitir. O deployment deve ser verificado.
- Não foram realizados testes automatizados completos no navegador mobile nesta etapa.

## Validação
1. Confirmar build READY no projeto Vercel oficial.
2. Testar login e isolamento de empresas.
3. Testar termos vassoura, absorvente, serviço, código GTIN e produto moderno.
4. Confirmar que o acervo histórico fica oculto até marcar a opção.
5. Conferir contraste no modo escuro e ausência de cartões brancos.
6. Confirmar que um item sem referência nunca recebe preço gerado.
7. Verificar disponibilidade e licenças das fontes para coleta adicional.
