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

A busca opcional de catálogo e cotações públicas aparece nas páginas **Produtos**, **Custos** e **Simulações**. O cálculo manual permanece disponível; cotações externas nunca substituem os custos de cada empresa. Para bancos PostgreSQL novos, aplicar também `db/migrations/001-market-postgresql.sql` após `db/schema.sql`. Consulte [fontes, limitações e testes](docs/market-integration.md).
