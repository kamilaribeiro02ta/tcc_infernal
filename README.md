# ZUZ — Precificação inteligente para pequenos negócios

Projeto de TCC: aplicação web de apoio à formação de preços, organização de custos e análise financeira de pequenos negócios.

## Executar localmente

Requisitos: **Node.js 24.x** e npm.

```bash
npm install
npm start
```

Acesse **http://localhost:3000**. Para desenvolvimento, use `npm run dev`.

## Organização do repositório

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Página inicial |
| `landing/` | Estilos da apresentação e animação de revelação |
| `introducao/` | Página "Sobre" e sua interação de pastas |
| `login/` | Telas e lógica de entrada/cadastro **local e demonstrativo** |
| `perfil/` | Perfil, calendário, tarefas e equipe |
| `produtos/` | Cadastro, edição, exclusão, categorias e precificação de produtos |
| `custos/` | Perfil econômico, custos fixos, taxas e concorrentes |
| `simulacoes/` | Simulação de preços, margens e quantidades |
| `grafico/` | Dashboard, gráficos e agenda |
| `shared/` | Componentes visuais, tema, navegação e motor financeiro reutilizado |
| `imagens/` | Identidade visual e recursos gráficos |
| `api/health.js` | Endpoint de verificação da API na Vercel |
| `local-server.js` | Servidor Express e arquivos estáticos |
| `package.json` | Dependências e comandos de execução |

## Como o sistema funciona hoje

- `shared/pricing-engine.js`: regras de cálculo e armazenamento local do perfil econômico.
- Produtos e dashboard utilizam `localStorage` com a chave `zuz-pricing-products-v2`.
- O perfil econômico utiliza a chave `zuz-business-settings-v1`.
- `shared/site.js` cuida de elementos comuns, sessão visual e tema.
- Cada página mantém seus próprios arquivos HTML, CSS e JavaScript.

## Funcionalidades implementadas

Cadastro e filtros de produtos; custos adicionais e fixos; referências de concorrentes; mark-up, margem de contribuição, ponto de equilíbrio e sugestão de preço; simulações; análises; calendário; modo claro e escuro; servidor Node/Express.

## Limitações atuais

**Login e armazenamento ainda não são adequados para produção.** O login e os dados do negócio dependem do navegador, sem autenticação real, autorização no servidor ou banco de dados multiusuário. O agente conversacional, sua execução de tarefas e a integração com o mascote físico são etapas futuras, não funcionalidades prontas.

## Convenções de manutenção

- Nomes de diretórios em letras minúsculas, sem espaços e descritivos.
- Cada módulo de página agrupa `.html`, `.css` e `.js` correspondentes.
- Alterações em caminhos exigem atualização de links HTML, imports e recursos CSS.
- Os arquivos de `shared/` são reutilizados; confira as outras páginas antes de alterar regras globais.
- Antes de qualquer correção de comportamento, documente o problema e teste cadastro, navegação, tema e cálculos.

## Próximas etapas

Banco de dados com PostgreSQL/Supabase, autenticação real, API de negócio, testes automatizados, integração de IA ao backend e, posteriormente, ao mascote com ESP32. Essas são propostas, não funcionalidades já entregues.
