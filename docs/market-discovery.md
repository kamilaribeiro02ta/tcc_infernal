# Catálogo da ZUZ — restauração da busca e fichas de produto

Os 5.875 itens CATMAT não foram excluídos do Neon. O filtro anterior os ocultava. A interface agora separa produtos comerciais atuais e dados técnicos de 2018.

Fontes de identificação: Open Food Facts, Open Beauty Facts, Open Products Facts e Open Pet Food Facts. Nenhuma delas garante preços de lojas. A Open Prices é consultada por GTIN, porém pode não ter observações recentes em reais no Brasil. Não existe cotação fictícia.

A ficha do produto exibe nome, descrição completa, marca, categoria, quantidade, código de barras, imagem disponível e link da origem. O botão de cadastro preenche os dados da ficha no formulário de Produtos, mantendo custos e preços sob controle do usuário.

Migração: db/migrations/004-market-catalog-fixes.sql, executar após 003 em bancos PostgreSQL novos.

Limitações: cotas das APIs públicas; resultados sem GTIN válido não entram nos novos catálogos; CATMAT não equivale a oferta atual; marketplace exige credenciais autorizadas.
