# ZUZ | Precificação inteligente para pequenos negócios

Sistema de apoio à precificação para pequenos negócios.

## Implementado

* Produtos, categorias, filtros e projeções
* Perfil econômico individual da empresa
* Custos fixos mensais e rateio por volume
* Tributos, taxas e comissões
* Referências de concorrentes
* Motor de precificação determinístico em `shared/pricing-engine.js`
* Mark-up, preço técnico, sugestão ZUZ, margem de contribuição e ponto de equilíbrio
* Simulador de preço, margem e quantidade
* Dashboard de análises
* Tema claro e escuro
* Node/Express para execução local

## Executar

```bash
npm install
npm start
```

Abra `http://localhost:3000`.

## Próxima fase

Migrar a persistência de `localStorage` para Supabase/PostgreSQL, criar autenticação real e integrar o agente de IA ao backend. O agente deve interpretar a conversa e chamar o motor financeiro, não inventar os cálculos.

---

## Nova base de onboarding e dados empresariais (PR em revisão)

## Como executar localmente

1. Crie um projeto PostgreSQL (por exemplo, no Supabase).
2. Execute `db/schema.sql` no SQL Editor do banco. As tabelas têm RLS ativada sem políticas de acesso público.
3. Copie `.env.example` para `.env` e preencha `DATABASE_URL` com a **conexão privada do PostgreSQL**. Nunca use credenciais no frontend nem faça commit desse arquivo.
4. Execute `npm install` e `npm start`.
5. Abra `http://localhost:3000/Login/login.html` e crie uma nova conta.
6. Complete `onboarding/onboarding.html`: segmento, operação e categorias sugeridas.

## Componentes adicionados

- `server/api.js`: login, cadastro, sessões HttpOnly e rotas associadas ao dono da empresa.
- `db/schema.sql`: usuários, sessões, empresas, categorias de custos e produtos no PostgreSQL.
- `shared/business-templates.js`: sugestões de categorias para produção, revenda, serviços e misto.
- `shared/pricing-core.js`: motor de cálculo determinístico compartilhável entre Node.js e navegador.
- `onboarding/`: primeira configuração empresarial integrada com a API.
- `tests/pricing.test.js`: testes iniciais de cálculo.

## Limitações e próximos passos obrigatórios

**Ainda não está pronto para uso real com dados empresariais.**

- Produtos e Simulações já consultam registros empresariais pela API. Agenda, tarefas e partes do Perfil ainda utilizam dados locais e precisam de migração por empresa antes do uso em produção.
- O onboarding salva as categorias no banco, mas o formulário detalhado de tipos, unidades, quantidades e rateios de custo ainda precisa ser conectado aos produtos.
- A foto dos produtos e os dados locais antigos precisam de migração explícita e consentida, sem associar dados de um usuário à conta de outro.
- A aplicação não funciona com contas reais até a variável `DATABASE_URL` estar configurada e o SQL aplicado.
- Não há sincronização de equipe nem agente de IA/ESP32 nesta entrega; requerem API e permissões apropriadas.
- Testes de integração com PostgreSQL e navegação real devem ocorrer antes de mesclar este PR.

**Não importe os cadastros locais para uma conta nova automaticamente.** Os dados legados são isolados em cópias identificadas para uma migração supervisionada.

## Verificação da lógica financeira

`npm run test:core`

