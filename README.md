# ZUZ | Precificação inteligente para pequenos negócios

## Executar localmente (SQLite, sem Supabase)

Requer Node.js 24 e npm. O arquivo de banco é criado automaticamente em `data/zuz.db` no primeiro acesso.

```bash
npm install
npm start
```

Abra **http://localhost:3000/Login/login.html** para criar a conta.
Não use Live Server (porta 5500): ele não executa a API de cadastro, login e persistência.

Após se cadastrar, conclua o onboarding da empresa para usar Produtos, Simulações e Análises.

### Persistência e privacidade

- Usuários, sessões, empresas, categorias e produtos são persistidos no SQLite local.
- Senhas são protegidas com scrypt; sessão usa cookie HttpOnly.
- Os dados empresariais são consultados pelo backend usando o usuário autenticado.
- `data/` e arquivos `.db` são ignorados pelo Git e bloqueados pelo servidor HTTP.
- **Faça backup de `data/zuz.db`** se quiser preservar os dados ao trocar de computador.
- SQLite neste modo é destinado ao desenvolvimento local e não permite compartilhamento automático entre computadores.

### Testar

```bash
npm run test:core
```

Com o lockfile presente, use `npm ci` para instalar as versões registradas. Decimal.js é usado no cálculo monetário; Zod valida entradas da API; Supertest é uma dependência de desenvolvimento para os testes HTTP. Os testes da API usam SQLite temporário e não acessam o banco de produção.

A cópia de Decimal.js servida ao navegador fica em `shared/vendor/`, com a licença original. Ao atualizar a dependência, execute `npm run vendor:sync`; os testes verificam se ela corresponde à versão instalada.

Para verificar a API local, acesse `http://localhost:3000/api/health`. A resposta deve indicar `"database": "sqlite"`.

**Checklist manual antes de publicar:**

- [x] Cadastro de conta no ambiente local com SQLite (confirmado no VS Code)
- [ ] Sair da conta e entrar novamente
- [ ] Concluir a configuração da empresa
- [ ] Cadastrar e reabrir um produto na página Produtos
- [ ] Selecionar o produto em Simulações
- [ ] Confirmar os dados na página Análises
- [ ] Reiniciar o servidor e conferir se os dados continuam disponíveis

O cadastro deve ser testado pela porta `3000`, nunca pelo Live Server (porta `5500`).

Para alterar a porta, use o arquivo opcional `.env` com `PORT=3000`.
Nenhum `DATABASE_URL` ou SQL Editor é necessário.

### Observações

Agenda, tarefas e alguns recursos do Perfil ainda possuem dados locais no navegador. As páginas de Produtos, Simulações e Análises utilizam o backend associado à conta autenticada.

## Referências públicas de mercado

A busca opcional aparece em **Produtos**, **Custos** e **Simulações**. As fontes de catálogo habilitadas são Open Food Facts, Open Beauty Facts, CATMAT e Compras.gov.br. A atualização de preços usa Compras.gov.br; valores de compras públicas não representam anúncios de lojas. O cálculo manual permanece disponível.

Para bancos PostgreSQL novos, aplicar `db/schema.sql`, seguido de todos os arquivos de `db/migrations/` em ordem alfabética (incluindo as duas migrações 003). Em bancos existentes desta versão, a migração aditiva nova é `007-market-research.sql`.

A curadoria preserva referências com preço ou uso salvo e mantém até três registros por grupo, distinguindo espécies explicitamente informadas. Excedentes ficam fora da busca, com cópia integral em `zuz_market_catalog_archive`. Os importadores desta versão ativam a proteção na própria transação para não reinserir registros retirados nem ultrapassar a capacidade do grupo. Clientes antigos continuam compatíveis durante a implantação. Catálogos sem preço continuam disponíveis para precificação com custos próprios.

Use `npm run market:curate` para uma prévia e acrescente `-- --apply` para aplicar. A saída informa o lote de recuperação. `npm run market:curate -- --restore-batch=UUID` mostra quantos registros serão restaurados; acrescente `--apply` para confirmar. Testar migrações e limpeza em um banco isolado antes de aplicar à produção.

### Dados históricos UCI

Fonte: [Chen, D. (2015). Online Retail. UCI Machine Learning Repository](https://doi.org/10.24432/C5BW33), licença CC BY 4.0. Baixe o XLSX na página oficial. Requer Python 3 (biblioteca padrão) apenas na máquina de importação, não na função da Vercel.

```bash
npm run market:uci-import -- /caminho/Online-Retail.xlsx
npm run market:uci-import -- /caminho/Online-Retail.xlsx --apply
```

Prévia por padrão. O importador mantém a observação positiva mais recente por SKU, exclui cancelamentos e não importa clientes/pedidos. Valores em GBP de 2010–2011 ficam exclusivamente em `zuz_market_research_prices`; não entram na pesquisa de mercado, médias, simulações ou recomendações brasileiras. `original_name`, `price`, moeda, data e hash registram a origem; `display_name` permite organizar o nome local sem sobrescrever o original. A reimportação preserva esse campo. Consulta autenticada: `GET /api/market/research?q=termo`.

### BigDataCorp opcional

O adaptador consulta `extra_info_data,current_pricing_data` no endpoint oficial de Produtos. Acesso depende de CNPJ, contrato e credenciais. Não há cadastro de fonte ativa vazia, consulta automática paga nem armazenamento de respostas comerciais. Configure tokens somente no servidor. A ativação exige `ZUZ_BDC_ENABLED=true`, `ZUZ_BDC_TERMS_ACCEPTED=true`, `BDC_ACCESS_TOKEN`, `BDC_TOKEN_ID` e os caminhos reais de nome (`BDC_PRODUCT_NAME_PATH`, relativo ao produto) e URL (`BDC_SOURCE_URL_PATH`, relativo à fonte/vendedor) confirmados em uma resposta autorizada. Os caminhos são notação ponto; não usamos o texto pesquisado como nome presumido do produto.

Sem nome, preço positivo, BRL, vendedor, data e URL HTTPS, o registro é recusado. Estatísticas agregadas não viram preços de lojas. Timeout de seis segundos, limite de resposta e `Limit=1` por busca restringem consumo; o fornecedor pode cobrar por entidade e dataset. Observações comerciais são informativas, sem presunção de GTIN/unidade/região compatíveis e sem custos, impostos ou margens inventados. Validar contrato, mapeamento e cobertura real antes de habilitar. Configuração não significa teste real aprovado.

### Pipeline e diagnóstico

O workflow **Backend ZUZ** executa em push para main e em PR: `npm ci`, sintaxe, testes de núcleo/API e PostgreSQL 16 descartável com todas as migrações, cadastro/login, produtos, cálculo, simulações e persistência. Não recebe credenciais de produção ou do fornecedor. `npm run test:postgres` exige `ZUZ_TEST_DATABASE_URL` em banco local `zuz_test`. O resumo aparece no GitHub Actions.

O workflow **Verificar backend publicado** acompanha implantações de produção da main e testa `/api/health`, PostgreSQL, esquema e SHA publicado. A integração Git da Vercel continua responsável pelo deploy; esses testes não constituem um bloqueio de publicação na Vercel. Deployment Checks/regras de proteção precisam ser configurados na plataforma caso se queira impedir uma publicação com CI reprovado.

`GET /api/health` responde 200 somente com banco e esquema esperados; retorna a revisão publicada quando fornecida pela Vercel. `GET /api/backend/status` exige login e retorna contagens agregadas de catálogo/cotações/base histórica e configuração das fontes, sem dados privados nem tokens. Dados históricos importados não contam como produtos com cotação brasileira. As fontes externas podem ficar indisponíveis mesmo quando o backend está saudável.
