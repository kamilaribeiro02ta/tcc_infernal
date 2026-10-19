# ZUZ — Relatório de busca, fontes de dados e bibliotecas
Auditoria e testes: 18/10/2026, horário de Brasília.

## Propósito e conclusão
A pesquisa deve aceitar qualquer termo e procurar referências nas fontes integradas. Os exemplos do usuário não definem um catálogo fechado. O problema encontrado combina fluxo desconectado, importação pequena e falta de cobertura de preços.

A base auditada tem 5.898 registros: 5.888 produtos e 10 serviços. Há 150 observações de preço, todas de compras públicas, ligadas a apenas três referências de vassoura. O número de registros de catálogo não representa o número de ofertas disponíveis.

## Correções realizadas
- O endpoint de referências no backend agora chama a descoberta externa antes da consulta local, mesmo quando já existem resultados no arquivo histórico.
- A priorização por categoria passou a reordenar as quatro fontes, sem excluir nenhuma delas.
- A busca SQL passou a considerar também a descrição completa, além do nome comercial.
- Falhas na descoberta mantêm a consulta aos dados locais e produzem um aviso.
- O limite de espera do cliente para referências foi ajustado para 35 segundos, mantendo o encerramento e o tratamento de erro.
- Na versão para celular, cada termo consulta as quatro fontes públicas e reúne os resultados ao catálogo disponível. Novas referências podem ter seus preços consultados sem precisar constar previamente na extração do banco.
- A versão para celular deixou de declarar o conector de anúncios de lojas como habilitado quando ele não possui integração configurada.

Não foram adicionados produtos ou preços fictícios. Nenhum dado financeiro interno de fornecedores foi inferido.

## Situação das fontes
“Respondeu” significa uma resposta observada nesta auditoria, não disponibilidade garantida. “Sem registros” significa ausência no banco auditado, não inexistência de dados no serviço externo.

| Fonte | Dados no banco | Evidência e diagnóstico |
|---|---:|---|
| CATMAT, arquivo de 2018 | 5.875 produtos | Importação existente. Catálogo histórico de identificação, sem preços próprios. Não representa um catálogo atual de varejo. |
| Compras.gov.br | 10 serviços; 150 observações de preço ligadas a itens CATMAT | Conector de preços existente e resposta HTTP 200 observada na auditoria anterior desta sessão. Única fonte com preços armazenados. Valores de compras públicas, não anúncios de lojas. |
| Open Food Facts | 12 produtos; zero preços | Conector existente. Produto por GTIN respondeu anteriormente; busca textual de teste retornou HTTP 503 agora. Disponibilidade intermitente. |
| Open Beauty Facts | 1 produto; zero preços | Busca de teste respondeu HTTP 200. Catálogo de identificação; não fornece preço automaticamente. Importação mínima. |
| Open Products Facts | Zero | Busca de teste respondeu HTTP 200. Conector existente, sem extração persistida. Não foi comprovada cobertura ampla de eletrônicos brasileiros. |
| Open Pet Food Facts | Zero | Busca de teste respondeu HTTP 200. Conector existente, sem extração persistida. |
| Open Prices | Zero preços armazenados | API respondeu HTTP 200. Consulta preços colaborativos por identificador. Uma API disponível não garante observações em reais para cada produto. |
| BPS | Zero registros setoriais | Importador e rota existem, mas a base não foi abastecida. Adequada para aquisições em saúde. |
| SINAPI | Zero registros setoriais | Importador e rota existem, mas a base não foi abastecida. Adequada para referências de construção. |
| Google Shopping via SerpApi | Sem persistência, por projeto | Conector no backend, depende de chave e serviço externo. Configuração e sucesso na produção não confirmados. Na versão para celular, não está conectado. |
| Keepa / Amazon Brasil | Sem persistência, por projeto | Conector por GTIN/ASIN; exige chave e assinatura. Não alimenta a pesquisa livre principal. Funcionamento em produção não confirmado. |
| Mercado Livre | Zero | Fonte planejada/inativa no cadastro; sem adaptador operacional identificado no fluxo atual. |
| PNCP | Zero | Fonte planejada/inativa; sem adaptador operacional identificado. |
| ANP | Zero | Fonte planejada/inativa; sem adaptador operacional identificado. É específica de combustíveis. |
| IPCA / Banco Central | Não é catálogo | Código para atualização monetária hipotética. Não fornece preço observado de um produto. Sucesso atual da rota não testado. |
| Classificação NCM / BrasilAPI / Classif | Não são preços | Integrações auxiliares de classificação. Não comprovam imposto efetivamente pago nem custo de uma loja. Sucesso atual das rotas não testado. |
| IBPT | Não é preço comercial | Integração opcional com token; pode informar carga tributária aproximada, não a tributação interna real de terceiros. Não validada em produção. |
| RTC offline | Não é catálogo | Ponte para serviço externo opcional. Existência do código não comprova motor instalado; não validada em produção. |

## Bibliotecas de código
Essas dependências são diferentes das bases comerciais acima.

| Biblioteca | Uso identificado | Situação comprovada |
|---|---|---|
| Express 5 | Servidor HTTP e rotas | Importado no servidor local; não é fonte de produtos. Publicação atual na Vercel não foi revalidada. |
| pg 8 | Acesso ao PostgreSQL | Importado no módulo de banco; banco foi consultado nesta sessão. Não resolve cobertura de dados por si só. |
| ml-regression 6 | Regressão linear na previsão de preços | Importado em price-prediction.js, com testes da lógica. Não consulta preços de mercado e não deve substituir referências verificáveis. |

Nenhuma dessas três dependências declaradas está simplesmente sem uso no código inspecionado. Isso não equivale a uma certificação completa de todas as rotas de produção.

## Prioridades para ampliar a cobertura
1. **Feeds autorizados de lojas e distribuidores brasileiros.** Minha prioridade para a ZUZ: importar identificação, GTIN, variante, embalagem, fornecedor, preço em BRL, URL e data. Uma mesma consulta deve reunir várias ofertas. Exigir permissão de uso, formato estável e atualização definida. É uma proposta de integração, não uma fonte já contratada.
2. **Concluir a integração comercial já escrita.** SerpApi pode ampliar busca textual de anúncios em várias categorias. Antes de ativar: confirmar orçamento, condições de uso e autorização para exibição. Não é uma base gratuita ilimitada e correspondência textual não garante produto idêntico.
3. **Mercado Livre, por integração oficial autorizada.** Avaliar os recursos e permissões efetivamente disponíveis à aplicação; não presumir acesso irrestrito a todo o marketplace. Útil como possível fonte adicional de identificação e ofertas, após validar acesso.
4. **Open Facts + Open Prices como complemento.** Melhorar importação, normalização e busca por GTIN. Manter explícita a ausência de observações brasileiras. Esses serviços sozinhos não resolvem o varejo geral.
5. **PNCP/Compras.gov, BPS, SINAPI e ANP em seus contextos.** Adicionar amplitude setorial sem misturar contratação pública, custo de construção, combustível e anúncio de varejo numa média única.
6. **Keepa como complemento por identificador.** Adequado para produtos identificados na Amazon Brasil, condicionado a assinatura e limites; não substitui busca geral.

## Estrutura recomendada
Separar produto de oferta. Produto tem identificadores, categoria, marca, modelo, variante e quantidade. Oferta tem vendedor, fonte, preço, moeda, unidade, condição, frete quando informado, data observada e data de consulta.

Cada conector deve registrar: habilitação, última tentativa, último sucesso, falha, quantidade retornada, quantidade importada e quantidade de preços válidos. A marca “ativa” no cadastro não deve ser tratada como prova de funcionamento.

Paginar resultados e permitir nova consulta sem perder a pesquisa. Deduplicar por fonte e identificador. Comparar como equivalentes apenas referências com identificação, variante e unidade compatíveis.

## Validação e limites
- 80 testes automatizados passaram no projeto, incluindo descoberta anterior à busca local, preservação em falha externa e manutenção de todas as fontes.
- Teste adicional do motor da versão móvel confirmou consulta às quatro fontes para um termo arbitrário, sem criar preços quando só há identificação.
- Testes HTTP reais distinguiram respostas 200 e indisponibilidade 503; não garantem estabilidade futura.
- A descoberta ao vivo retornou 29 identificações para “shampoo” (Open Beauty Facts e Open Products Facts) e 1 para “smartphone” (Open Products Facts). São identificações de catálogo, não ofertas com preço confirmado. Houve fontes indisponíveis nesses testes, informadas separadamente.
- Não foi realizada inspeção visual em navegador nesta etapa.
- Versão móvel publicada: https://zuz-preview-mobile.flowydream33.chatgpt.site
- As correções do backend original, da interface e os testes acompanham este relatório no repositório principal. A publicação na Vercel deve ser confirmada pelo estado do deployment, separadamente do commit. A versão móvel usa uma extração pública do catálogo e consultas externas; não mantém conexão direta com o PostgreSQL, login ou salvamento.
- A entrega elimina a dependência exclusiva dos itens da extração na pesquisa móvel. Ainda não garante preços para todo termo: faltam fontes comerciais com cobertura ampla e acesso autorizado.

## Documentação oficial consultada
- Open Prices: https://github.com/openfoodfacts/open-prices/blob/main/API.md
- Catálogo e preços colaborativos: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/product-prices/
- SerpApi / Google Shopping: https://serpapi.com/google-shopping-api
- Recursos de itens e buscas do Mercado Livre: https://developers.mercadolivre.com.br/pt_br/itens-e-buscas

