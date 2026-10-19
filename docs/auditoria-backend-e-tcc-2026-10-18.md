# ZUZ — Auditoria geral do backend e plano para completar o TCC
Data: 18/10/2026, horário de Brasília. Referência do código: main, commit b61b67945b80b918390f8dd909a472c88ea1b66b, repositório kamilaribeiro02ta/tcc_infernal.

## 1. O que é a ZUZ
A própria página “Sobre o Trabalho” define a ZUZ como um TCC para apoiar pequenos negócios na organização de custos e definição de preços com clareza. A proposta reúne software, experiência de usuário, visualização financeira e assistência por IA; a apresentação também menciona um protótipo físico e robótica.

O núcleo recomendado para a entrega é: entender os custos do negócio → cadastrar produto ou serviço → calcular preço e explicar as premissas → consultar referências de mercado quando disponíveis → comparar cenários → salvar a decisão. A pesquisa de mercado deve aceitar termos livres, sem lista fixa de exemplos. Ela complementa os custos próprios e não deve obrigar cadastro.

A pesquisa pública pelo nome não trouxe uma descrição externa inequívoca desta ZUZ; não usei empresas homônimas como evidência. A identidade do projeto foi fundamentada no seu repositório e na página de apresentação.

## 2. Resumo do diagnóstico
Existe uma base relevante de implementação; o backend não precisa ser substituído. O principal déficit está na ligação entre módulos, cobertura comercial, verificação operacional e documentação reproduzível.

80 testes automatizados passaram na última execução. Isso comprova os comportamentos cobertos, não o fluxo completo da aplicação implantada. Cadastro, persistência, isolamento entre contas e falhas de rede ainda precisam de uma suíte integrada demonstrável.

A extração do banco consultada nesta sessão continha 5.898 registros e somente três referências de catálogo com preços armazenados. As 150 observações são compras públicas. Essa amostra não comprova uma ferramenta com ampla cobertura de preços de varejo.

## 3. Arquitetura e finalidade de cada parte
| Arquivo ou módulo | Para que serve | Situação e limite |
|---|---|---|
| local-server.js | Executa Express e arquivos estáticos no desenvolvimento | Bloqueia /data, /server e /db. Não é o servidor de produção da Vercel. |
| api/index.js | Entrada da API na Vercel | Carrega o backend; se a inicialização falhar, responde 503 controlado. Deployment atual não revalidado nesta auditoria. |
| server/api.js | Autenticação, empresa, produtos, custos, vendas, histórico e registro das demais rotas | Centraliza muitas responsabilidades; recomenda-se extrair módulos gradualmente, preservando contratos. |
| server/database.js | Escolhe PostgreSQL com DATABASE_URL ou SQLite local | Pool PostgreSQL de até cinco conexões. Vercel exige banco persistente; corretamente não usa SQLite temporário como produção. |
| server/sqlite-database.js | Adapta consultas e transações para SQLite | Traduz apenas parte do SQL e interpreta alguns campos JSON. Não garante paridade com PostgreSQL. |
| shared/pricing-core.js | Fonte comum dos cálculos financeiros | Reutilizado no cliente e servidor, evitando fórmulas divergentes. É o núcleo essencial. |
| shared/simulation-core.js | Calcula cenários e metas | Volumes são hipóteses, não demanda prevista. |
| server/simulations-routes.js | Salva simulações, verifica empresa e recalcula resultados | Inclui assistência opcional e validação de referências persistidas. Precisa de testes HTTP de isolamento entre contas. |
| shared/price-prediction.js | Regressão exploratória com vendas mensais reais | Exige oito meses, quatro preços distintos, variação, relação negativa e R² mínimo. Não equivale a previsão validada cientificamente. |
| server/market.js | Catálogo, preços públicos, consulta e sincronização | Mistura várias tarefas; reaproveitar adaptadores antes de criar outros fluxos. |
| server/market-reference-search.js | Reúne referências e preços para a pesquisa integrada | Já conectado à descoberta externa no último commit. Mantém dados locais quando uma fonte falha. |
| server/market-discovery.js | Procura identificação em quatro fontes Open Facts e importa correspondências | Não cria preços. Tem limites, ranking e cache. Precisa expor saúde por fonte e respeitar limites globais entre instâncias. |
| server/market-catalog-bootstrap.js | Importação periódica de categorias | Ajuda a popular o banco. Não garante diversidade completa nem cotações brasileiras. |
| server/market-quality.js | Valida e classifica preços, datas, GTIN e comparabilidade | Necessário para separar anúncio, compra pública, observação antiga e referência equivalente. |
| server/market-intelligence.js | Anúncios por SerpApi e histórico de preços | Fonte comercial depende de chave. Não pressupor configuração só porque o arquivo existe. |
| server/market-extended-providers.js | Keepa, IPCA, classificação e referências setoriais | Complementos específicos; não substituem um catálogo comercial geral. |
| server/tax-context.js | Contextualiza dados fiscais e integrações opcionais | Não comprova imposto interno de outra empresa e não deve ser apresentado como apuração fiscal completa. |
| server/rtc-offline.js | Ponte para calculadora fiscal externa | Só funciona com serviço configurado e compatível. Não há prova de motor operacional nesta auditoria. |
| server/costs-assistant.js e simulations-help.js | Explicações contextualizadas e resposta generativa opcional | Têm fallback e timeout. Falta avaliação sistemática das respostas e controle de uso/custo. |
| scripts/ | Importação e atualização de dados | Exigir execução documentada, idempotência e registros de resultado. |
| db/schema.sql e db/migrations/ | Estrutura PostgreSQL e evolução de tabelas | Sem executor versionado identificado; dois arquivos têm prefixo 003. Documentar a ordem completa e rastrear aplicação. |
| db/sqlite.sql | Estrutura local | Tem menos campos e recursos de mercado que o PostgreSQL. Delimitar suporte ou manter paridade testada. |
| vercel.json | Encaminhamento da API e cron diário | Agendamento declarado não comprova execução bem-sucedida. |
| tests/ | Testes de cálculo, mercado, interface simulada e normalização | 80 aprovados; não há workflow de CI na árvore auditada. |

## 4. Bibliotecas: o que são e por que existem
- **Express:** recebe requisições HTTP e organiza rotas. Não contém produtos ou preços.
- **pg:** conecta o Node ao PostgreSQL. A persistência depende do banco e das migrações.
- **ml-regression:** ajusta regressão linear; é usado pelo módulo experimental de previsão. Não é mecanismo de busca.
- **node:sqlite, crypto e demais módulos Node:** banco local, hashing, sessões e utilitários. Não são serviços comerciais.
- **OR-Tools:** requirements-optimization.txt aparece no repositório como dependência opcional. Não identifiquei implementação Python nem ponte executável no backend auditado. Não apresentar otimização com OR-Tools como entregue.

Não identifiquei uma dessas três dependências npm principais declarada sem uso. Não há package-lock.json rastreado na árvore do commit auditado: adicionar um lockfile revisado para instalação reproduzível, sem publicar node_modules.

## 5. Banco de dados: para que serve cada conjunto
| Tabela | Finalidade |
|---|---|
| zuz_users | Identidade, e-mail e hash de senha |
| zuz_sessions | Hash do token de sessão e validade |
| zuz_companies | Empresa do usuário, operação e configurações |
| zuz_cost_categories | Categorias de custos da empresa |
| zuz_products | Produtos/serviços próprios, custos, preço e atributos |
| zuz_pricing_history | Retrato das recomendações e justificativas calculadas |
| zuz_sales_observations | Vendas reais mensais para análise exploratória |
| zuz_simulations | Cenários salvos, premissas e resultados |
| zuz_market_catalog | Identificação de referências externas; não é oferta por si só |
| zuz_market_prices | Observações de preço com fonte, vendedor e data |
| zuz_market_cache | Respostas temporárias para reduzir consultas externas |
| zuz_market_sources | Cadastro e capacidades declaradas de fontes |
| zuz_market_price_history | Histórico de observações de preço |
| zuz_sector_public_prices | Referências setoriais importadas, como BPS e SINAPI |

Há chaves estrangeiras, restrições de valores e índices em diferentes tabelas. O backend filtra os dados empresariais pela conta/empresa em fluxos inspecionados. Isso deve ser demonstrado com testes de duas contas; não foi realizada certificação completa de autorização.

Produtos têm campos financeiros relacionais e um payload JSON. Essa duplicidade exige um contrato explícito para impedir divergência entre o que a tela mostra e o que o servidor calcula. A rota PUT de produtos substitui a coleção enviada e remove itens ausentes: é importante proteger contra sobrescrita por uma aba desatualizada com controle de versão.

## 6. Rotas e fluxos
- /api/health: testa conexão com o banco; não verifica todas as migrações nem fontes.
- /api/auth/signup, login e logout: conta e sessão.
- /api/me: identidade autenticada.
- /api/company e settings: dados e premissas da empresa.
- /api/company/products: produtos próprios; há criação individual e substituição em lote.
- /api/pricing/calculate, history, sales e prediction: cálculo, rastreabilidade, vendas e modelo exploratório.
- /api/simulations e rotas de assistência: cenários e explicações.
- /api/market/references e lookup: fluxo integrado de pesquisa e consulta de preço.
- /api/market/catalog, quotes e v2/search/item: fluxos paralelos de mercado ainda existentes. Precisam de inventário de consumidores e um contrato comum antes de descontinuar rotas.
- /api/market/offers, history e coverage: anúncios, histórico e diagnóstico.
- /api/market/cron: rotina administrativa protegida por segredo, fora do login normal.

## 7. Fontes comerciais: estado comprovado
CATMAT tem 5.875 itens históricos. Open Food Facts tem 12 e Open Beauty Facts tem um. Compras.gov tem dez serviços próprios. Open Products Facts e Open Pet Food Facts não tinham itens importados na extração, mas suas APIs responderam nos testes desta sessão.

Compras.gov é a única origem dos 150 preços armazenados. Open Prices respondeu, mas não havia observações persistidas. BPS e SINAPI não estavam abastecidos. SerpApi e Keepa têm adaptadores, porém configuração e sucesso em produção não confirmados. Mercado Livre, PNCP e ANP não têm operação comprovada no fluxo inspecionado.

O teste recente retornou identificações para shampoo e smartphone nas fontes externas; isso demonstra descoberta além da amostra local, não cobertura ampla de preços.

Prioridade proposta: feeds autorizados de fornecedores brasileiros e uma fonte comercial com busca textual, somados ao uso de GTIN para comparar equivalentes. Não recomendo adicionar muitas fontes apenas para aumentar a contagem de integrações.

## 8. Problemas e correções prioritárias
| Prioridade | Problema identificado ou lacuna | Próxima entrega verificável |
|---|---|---|
| P0 | Cobertura de preço incompatível com promessa de pesquisa ampla | Fonte autorizada com ofertas reais em categorias distintas; medir taxa de pesquisas com preço |
| P0 | Falta de evidência ponta a ponta no ambiente publicado | Cadastro → empresa → produto → custos → simulação → reabertura em outra sessão |
| P0 | Instalação sem lockfile e migrações sem trilha automatizada | npm ci reproduzível, executor com versões/checksums e teste em banco isolado |
| P1 | Fluxos paralelos de mercado | Um serviço comum de busca com adaptadores, contrato consistente e paginação |
| P1 | Fontes “ativas” sem último sucesso comprovado | Registrar tentativa, sucesso, erro, quantidade importada e preços válidos |
| P1 | Login sem limite de tentativas identificado; chamadas de IA/ofertas sem limite comum | Limites por conta/IP, orçamento e resposta 429; considerar armazenamento compartilhado em produção |
| P1 | Recuperação de senha e verificação de e-mail não identificadas | Fluxo de recuperação com token expirá­vel ou delimitação explícita do protótipo |
| P1 | /auth/login não aplica o teto de senha de 256 caracteres usado no cadastro | Validar tamanho antes de executar scrypt e testar entradas extremas |
| P1 | PUT em lote sem versão da coleção | Bloquear atualização obsoleta e confirmar conflito sem perder dados |
| P1 | Banco local e PostgreSQL com diferenças | Matriz de suporte e testes de contrato nos dois ambientes |
| P1 | Sem testes HTTP automatizados e CI identificados | Suíte integrada em banco descartável, incluindo duas contas e rollback |
| P2 | Backup e restauração sem demonstração registrada | Restaurar cópia em ambiente isolado e documentar evidência |
| P2 | Recursos locais no navegador | Mapear agenda/tarefas/perfil e delimitar quais precisam sincronizar |
| P2 | Documentação contraditória | README único com deploy, migrações completas e funcionalidades efetivamente entregues |

Não acrescentei funcionalidades nem alterei dados de produção nesta auditoria. Itens acima são achados e propostas; não devem ser confundidos com correções já implementadas. A lista não é uma auditoria de segurança exaustiva.

## 9. O que falta para um TCC consistente
**Problema e objetivos:** formular uma pergunta mensurável, como “o sistema ajuda pequenos empreendedores a formar e justificar preços com menos esforço?”. O objetivo não deve prometer preço ideal universal nem lucro garantido.

**Escopo:** documentar núcleo entregue, integrações opcionais e trabalhos futuros. IA generativa, previsão estatística, consulta comercial e robótica são quatro capacidades diferentes e devem ter evidências separadas.

**Requisitos e rastreabilidade:** associar cada requisito a tela, rota, tabela, teste e critério de aceite. Exemplos: pesquisa livre; dados financeiros da empresa isolados; cálculo manual disponível sem cotação; informação indisponível não vira zero.

**Modelagem:** diagrama de arquitetura, modelo entidade-relacionamento, casos de uso e contrato de API. Um OpenAPI com exemplos e erros permite explicar o backend sem depender da leitura de código.

**Fundamentação:** justificar custos fixos/variáveis, margem de contribuição, ponto de equilíbrio e comparação de mercado. Explicar a diferença entre margem sobre venda e acréscimo sobre custo. Percentis e limites do modelo são decisões do sistema, não verdades econômicas universais.

**Experimento de UX:** testar tarefas concretas com pequenos empreendedores, registrar tempo, conclusão, erros e compreensão das informações. Fazer avaliação das dez heurísticas de Nielsen e acessibilidade; ainda não há neste relatório resultados de usuários que possam ser apresentados como evidência.

**Avaliação da busca:** montar conjunto de consultas representativo de categorias, marcas, variantes e serviços, sem restringir o produto a esses exemplos. Medir relevância, cobertura de preços, diversidade de vendedores, atualização e latência. Registrar também falhas e ausência de resultados.

**Avaliação financeira:** validar cálculos com casos independentes revisados pelo orientador ou especialista, incluindo contribuição negativa, ausência de vendas, produto e serviço. Não usar somente testes que repetem a mesma fórmula do código.

**Avaliação da IA:** comparar respostas com os cálculos fornecidos, verificar números inventados e funcionamento sem chave ou com timeout. O cálculo continua determinístico no servidor.

**Robótica:** a apresentação menciona hardware, mas a árvore auditada não contém firmware .ino ou implementação Python. Isso não prova que não exista em outro repositório. Para declarar como entregue, anexar arquitetura, componentes, protocolo, código ou endereço do repositório e demonstração real. Se for proposta futura, rotular assim.

**Dados e privacidade:** mapear o que é coletado, onde é salvo, retenção, recuperação/exclusão e envio a terceiros. Usar as orientações da ANPD como apoio e não afirmar conformidade integral apenas por utilizar senha protegida.

**Resultados e limitações:** mostrar o que os testes demonstram, o que não demonstram e as dependências de acesso a fontes. Separar conclusão acadêmica de funcionalidade apenas planejada.

## 10. Ordem recomendada
1. Tornar instalação e banco reproduzíveis; testar fluxo e isolamento.
2. Consolidar pesquisa e medir cobertura real.
3. Contratar/conectar somente fontes autorizadas que resolvam lacunas comprovadas.
4. Tratar limites, recuperação de conta, concorrência de edições e observabilidade.
5. Executar validação com usuários e cálculos independentes.
6. Finalizar documentação e demonstração, com escopo honesto de IA e hardware.

Critério para chamar o núcleo de pronto: uma conta nova consegue configurar a empresa, cadastrar produto/serviço, calcular sem mercado, consultar referência quando houver, salvar simulação e reabrir os dados; outra conta não consegue acessá-los; erros externos terminam com orientação útil.

## 11. Fontes e limites da auditoria
Fontes primárias do projeto: README.md, introducao/intro.html, server/, shared/, db/, docs/, tests/, package.json e vercel.json no commit citado. Inventário remoto da árvore não truncado; não contém CI ou package-lock rastreados.

Referências externas consultadas:
- Sebrae, formação do preço e margem de contribuição: https://meuatendimento.sebrae.com.br/sites/PortalSebrae/ufs/ba/videos/v%C3%ADdeos/como-calcular-o-preco-de-venda-do-produto-e-servico-rapido-e-facil-aprenda-com-o-sebrae%2Cd9b08ece9269f810VgnVCM1000001b00320aRCRD
- OWASP API4:2023, consumo de recursos: https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/
- ANPD, guia de segurança para agentes de pequeno porte: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte

Não houve pentest, teste de carga, avaliação de usuários, revisão do texto acadêmico completo ou teste da robótica. Não foram lidas senhas ou informações empresariais privadas para compor este relatório.
