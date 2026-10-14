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

Para alterar a porta, use o arquivo opcional `.env` com `PORT=3000`.
Nenhum `DATABASE_URL` ou SQL Editor é necessário.

### Observações

Agenda, tarefas e alguns recursos do Perfil ainda possuem dados locais no navegador. As páginas de Produtos, Simulações e Análises utilizam o backend associado à conta autenticada.
