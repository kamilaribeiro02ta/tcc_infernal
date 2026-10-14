# Banco persistente da ZUZ (PostgreSQL)

A ZUZ usa SQLite em desenvolvimento local quando `DATABASE_URL` não estiver configurada. Em Vercel é obrigatório usar PostgreSQL persistente: sem `DATABASE_URL`, a API falha explicitamente em vez de salvar contas em disco temporário.

## Provisionamento (Neon)

1. No Neon, crie um projeto PostgreSQL para a ZUZ.
2. Execute o conteúdo de `db/schema.sql` no editor SQL do banco **uma única vez**, antes de abrir os cadastros no site.
3. Na Vercel, configure `DATABASE_URL` como variável de ambiente de **Production** e **Preview**, utilizando a string TLS/pooling fornecida pelo Neon. Nunca exponha a variável no frontend ou GitHub.
4. Publique novamente e consulte `/api/health`; a resposta deve indicar `"database": "postgresql"`. Teste cadastro, produto, simulação e persistência após novo deploy.
5. Configure backups, limites de conexão e retenção no provedor. Não apague o banco em futuras publicações.

## Desenvolvimento local

Sem `DATABASE_URL`, o servidor usa o SQLite em `data/zuz.db`. Para testar PostgreSQL, defina `DATABASE_URL` no `.env` local e aplique `db/schema.sql` ao banco de testes.

## Migração de contas existentes

**Dados locais do SQLite não são copiados automaticamente.** Faça backup de `data/zuz.db` antes de migrar usuários existentes. O PostgreSQL começa vazio até receber dados via migração. Nunca publique banco, hashes ou credenciais em repositório público.

## Dependências

O servidor precisa de `pg`. O lockfile anterior foi removido porque não incluía esta dependência. Execute `npm install` para gerar um `package-lock.json` atualizado e registre-o no repositório. Depois utilize `npm ci` em pipelines que exigem builds reproduzíveis.
