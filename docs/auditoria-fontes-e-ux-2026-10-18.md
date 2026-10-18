# Auditoria da pesquisa de mercado — ZUZ

Consulta de leitura realizada em 18/10/2026, projeto Neon `zuz-production`.
Código auditado: `kamilaribeiro02ta/tcc_infernal`, main a partir de `2ea6d116359d40803c37eff22af63c6ea40df3d3`.
Não foram alteradas tabelas, credenciais ou dados da produção.

## Resultado principal

O problema não é só visual. A base contém 5.898 registros de catálogo, mas apenas
3 produtos possuem observações de preço. As 150 observações são de compras
públicas, vinculadas a três registros de vassoura. Não existe preço de varejo
armazenado. Portanto, os registros de catálogo não podem ser apresentados como
milhares de ofertas disponíveis.

Dos 150 preços, 8 estão nos últimos 180 dias, considerando o relógio do banco no
momento da auditoria; 142 são anteriores. A observação mais antiga é de 19/05/2022,
e a mais recente de 16/10/2026. Cinco observações estão sem unidade preenchida.
O cadastro `zuz_market_sources` descreve capacidades de fontes e possui flags de
atividade; seus campos `has_observed_prices` e `is_active` não provam que houve
importação nem que a API esteja respondendo agora. Os registros de fontes
consultados não possuem `last_successful_sync` preenchido.

## Fontes e integrações, separadas por evidência

| Fonte | O que existe de fato no banco | Implementação e uso | Diagnóstico |
|---|---|---|---|
| CATMAT | 5.875 itens; 3 com preços associados de Compras.gov.br | Importação histórica e consulta | Acervo grande de identificação; não contém custo, lucro ou imposto do fornecedor |
| Compras.gov.br | 10 itens próprios de catálogo; 150 preços ligados aos três itens CATMAT | Conector de catálogo/preços e atualização | Única origem com preços armazenados; são compras públicas, não ofertas de loja |
| Open Food Facts | 12 itens; zero preços | Conector e importador de catálogo | Importação pequena; catálogo não fornece preço por si só |
| Open Beauty Facts | 1 item; zero preços | Conector e importador | Importação mínima; não oferece preço por si só |
| Open Products Facts | Zero itens e preços | Conector e importador no código; fonte marcada ativa | Estrutura existe, sem extração armazenada |
| Open Pet Food Facts | Zero itens e preços | Conector e importador no código; fonte marcada ativa | Estrutura existe, sem extração armazenada |
| Open Prices | Zero observações | Consulta por GTIN; fonte marcada ativa | Integração escrita, sem preços importados; não comprova cobertura brasileira |
| BPS | Zero registros setoriais | Importador de CSV e rota setorial | Não foi abastecida; preços de aquisição em saúde, não varejo geral |
| SINAPI | Zero registros setoriais | Importador de CSV e rota setorial | Não foi abastecida; custos de construção, não varejo geral |
| Mercado Livre | Zero registros | Cadastro de fonte inativa, sem fluxo de busca habilitado identificado | Referência planejada, sem integração operacional comprovada |
| PNCP | Zero registros | Fonte cadastrada como inativa; sem adaptador ativo identificado | Planejada, não integrada ao fluxo de pesquisa |
| ANP | Zero registros | Fonte cadastrada como inativa; sem adaptador ativo identificado | Planejada; só faria sentido para combustíveis |
| Google Shopping via SerpApi | Sem persistência, por projeto | Conector transitório usado na busca, depende de SERPAPI_API_KEY | Existência do código confirmada; configuração e resposta de produção não confirmadas |
| Keepa / Amazon Brasil | Sem persistência, por projeto | Rota por GTIN/ASIN, depende de KEEPA_API_KEY; não alimenta a lista principal atual | Conector existente; não é pesquisa livre de produtos; ativação de produção não confirmada |
| IPCA / BCB | Não é catálogo de produtos | Rota de série e correção monetária hipotética | Não oferece preço real de mercadoria e não preenche custos de terceiros |
| Classif / NCM e BrasilAPI | Não são bases de preço | Rotas de consulta de classificação | Não determinam custo, lucro ou imposto devido apenas pelo nome |
| IBPT | Sem dados financeiros comerciais importados | Consulta opcional depende de token e dados fiscais | Carga aproximada informada não equivale ao imposto efetivamente pago por um fornecedor |
| RTC offline | Sem motor fiscal disponibilizado nesta auditoria | Ponte opcional depende de serviço externo configurado | Código de integração não comprova motor instalado ou funcionamento em produção |

Os zeros acima foram conferidos nas tabelas de catálogo, preços e preços setoriais.
Para conectores transitórios e fiscais, a ausência de registros não indica por si
só que estão desabilitados. Não foram presumidos estados de credenciais.

## Exemplo real: vassoura

Na base consultada:

- CATMAT 405683: vassoura com cerdas de aço carbono SAE 1070 e cabo de madeira.
  Registro de R$ 18,00, unidade UN, fornecedor ONE BOSS DISTRIBUIDORA DE ALIMENTOS LTDA,
  preço observado em 16/10/2026, fonte Compras.gov.br.
- CATMAT 412574: vassoura com cerdas de aço SAE 1010/1020 e cabo de madeira torneado.
  Registro de R$ 23,05, fornecedor LICITARE PRODUTOS, MATERIAIS E SERVICOS LTDA,
  preço observado em 18/09/2026. A unidade está ausente nessa observação.

Esses registros não são equivalentes só por conterem "vassoura". A segunda
observação requer confirmação de unidade. Não há base pública nesses registros
para afirmar quanto o fornecedor gastou, pagou de imposto ou lucrou.

## Dados disponíveis na fonte que não eram preservados

A consulta pública de Compras.gov.br com os parâmetros do conector retornou HTTP
200 e 50 registros. A resposta contém marca, descrição detalhada, quantidade da
compra e metadados de atualização. No banco, as 150 observações estavam sem marca
e sem `price_metadata`, embora as colunas já existissem.

O conector foi corrigido para preservar esses campos nas próximas atualizações,
sem migração de banco. A quantidade comprada não é tratada como pedido mínimo,
e o percentual de desconto de uma licitação não é apresentado como imposto.
Não foi feito um preenchimento retroativo de produção nesta auditoria.

Testes diretos adicionais: Open Food Facts respondeu HTTP 200 para um GTIN
existente no catálogo; Open Prices respondeu HTTP 200 e zero observações para o
mesmo GTIN. Isso comprova comunicação para essas consultas específicas, não
cobertura geral ou funcionamento contínuo de todas as fontes.

## Bibliotecas de software não são fontes de preço

| Biblioteca | Função no projeto | Limite |
|---|---|---|
| Express | Servidor e rotas de API | Não fornece produtos ou preços |
| pg | Comunicação com PostgreSQL | Consulta o que foi armazenado, não cria cobertura comercial |
| ml-regression | Regressão estatística, carregada sob demanda | Não busca preços; precisa de histórico real suficiente |
| Chart.js | Gráficos no frontend | Só apresenta os dados fornecidos pelo sistema |
| Poppins / ícones | Identidade visual e navegação | Não têm conteúdo comercial |

## Auditoria das dez heurísticas

| Heurística | Problema observado no fluxo anterior | Tratamento aplicado |
|---|---|---|
| Visibilidade do estado | Espera sem término claro | Carregamento, encerramento em até 20 segundos por consulta, falhas parciais e mensagem final |
| Correspondência com o mundo real | Catálogo técnico parecia oferta de loja | Produto, fornecedor, unidade, origem e tipo de referência explícitos |
| Controle e liberdade | Seleção escondia pesquisa e impunha retorno | Detalhes expansíveis na mesma lista; cancelamento e pesquisa preservada |
| Consistência | Molduras, telas e campos conflitantes | Componentes da consulta com Poppins, roxo e os temas existentes |
| Prevenção de erros | Valores ausentes poderiam ser confundidos com zero | Financeiro indisponível sinalizado; cálculo exige valores explícitos, inclusive zero |
| Reconhecimento | Informações importantes escondidas em outra tela | Preço, fornecedor e datas na lista; detalhes progressivos |
| Flexibilidade e eficiência | Lista longa e repetitiva | Oito referências por etapa, carregamento das demais sob ação do usuário e comparação de até três |
| Estética e minimalismo | Card gigante, campos sobrepostos e detalhes longos | Cabeçalho proporcional, um campo, preço e procedência primeiro; identificação técnica recolhida |
| Recuperação de erros | Falha de uma fonte bloqueava a tarefa | Outras fontes permanecem consultáveis; nova tentativa e precificação manual |
| Ajuda e documentação | Usuário não distinguia dados e estimativas | Orientação curta junto à busca e simulação opcional claramente identificada |

Esta é uma avaliação heurística e verificação técnica; não equivale a um teste de
usabilidade com empreendedores nem a uma garantia de satisfação.

## Refinamento adicional da interface

- Título direto: "Descubra os preços de mercado".
- Preço, unidade, fornecedor, fonte e datas aparecem antes dos dados técnicos.
- ID, código de barras, marca e condições continuam acessíveis na própria referência.
- Impostos, líquido, custo e ganho do fornecedor ficam explicitamente indisponíveis
  quando a fonte não os fornece, em uma área compacta.
- Cálculo opcional "Calcular para o meu negócio": usa preço consultado, custo por
  unidade, imposto estimado e outras taxas informados pelo usuário. Resultado
  rotulado como simulação ZUZ; não altera o preço consultado nem atribui lucro a terceiros.
- Se a unidade não estiver informada, a simulação fica indisponível até que o
  usuário confirme a quantidade por outro meio; não é assumido preço unitário.
- O preço da referência pode ser uma compra governamental antiga. A classificação
  permanece visível e não se transforma em média de varejo ou preço sugerido automático.

## Verificações e limites de acesso

- Consultas de contagem e amostras no Neon executadas somente para leitura.
- A consulta SQL de busca de vassoura foi executada contra o PostgreSQL real.
- 74 testes automatizados passaram após o refinamento.
- Verificação de navegador com respostas controladas, em 320, 390, 768 e 1280 px,
  nos temas claro/escuro; cálculo opcional e navegação também verificados.
- O GitHub registra sucesso da publicação anterior `2ea6d11` nos três projetos
  Vercel relacionados. Isso confirma o evento de deployment, não o resultado
  da consulta autenticada feita por um usuário.
- A consulta administrativa dos deployments e credenciais Vercel retornou 403
  por falta de acesso ao escopo da equipe; não foram acessados segredos nem
  assumida a ativação de Keepa, SerpApi, IBPT ou RTC.
- As imagens anexadas apresentam o fluxo anterior ao commit `2ea6d11`.
  A mudança visual mais recente deve ser conferida na URL efetivamente utilizada.

## Pendência estrutural

Aumentar a cobertura exige importar observações autorizadas de preço, conferir
unidade, variante, data e procedência e testar consultas reais representativas.
Registrar uma fonte ou importar descrições não resolve essa falta de preços.
Uma nova fonte paga ou que exija autorização não foi habilitada sem credenciais
ou assinatura fornecidas pelo responsável.
