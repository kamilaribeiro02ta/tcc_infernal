# Simulações ZUZ — implementação

A página \`simulacoes/simulacoes.html\` usa o design compartilhado da ZUZ e contém sete recursos:

1. Gráfico SVG dinâmico: receita, custos e ponto de equilíbrio por volume.
2. Três cenários editáveis, independentes e hipotéticos.
3. Variação percentual de custos diretos ou fixos por cenário.
4. Metas de faturamento e resultado calculadas em unidades.
5. Comparação com referências de preços informadas pelo negócio.
6. Histórico SQLite vinculado à empresa autenticada, com dados e resultados do momento do salvamento.
7. Assistente da ZUZ com análise calculada e opção de resposta generativa por API externa.

## Executar localmente

- Usar Node.js 24, \`npm install\` e \`npm run dev\`.
- Acessar o servidor pela porta definida em \`PORT\` (padrão 3000); não abrir o HTML como arquivo local.
- Criar conta, concluir o perfil econômico, cadastrar um produto e acessar **Simulações**.
- A tabela \`zuz_simulations\` é criada automaticamente pela inicialização do SQLite a partir de \`db/sqlite.sql\`.
- Executar \`npm run test:core\` para validar cálculos existentes e testes adicionais em \`tests/simulation.test.js\`.

## IA externa (opcional)

Sem configuração externa, o chat usa análise determinística dos cálculos validados no backend e identifica o resultado como "Análise calculada pela ZUZ". Para habilitar geração de explicações por um modelo, configurar no ambiente do servidor:

\`\`\`env
OPENAI_API_KEY=configure_sua_chave_no_servidor
OPENAI_MODEL=gpt-4.1-mini
\`\`\`

Nunca colocar a chave no HTML, no repositório ou no frontend. A aplicação utiliza o endpoint Responses da API e, se ele estiver indisponível, volta à análise calculada.

## Regras de segurança e dados

- Os produtos originais são lidos, mas não são gravados pelo simulador.
- O botão "Aplicar sugestão" modifica somente o cenário.
- Propostas de ajustes feitas pelo assistente exigem confirmação explícita antes de aplicar aos campos.
- O histórico pertence à empresa logada: GET, POST e DELETE fazem verificação de posse.
- Ao salvar, a API valida os três cenários, recalcula seus resultados no servidor e preserva um retrato das premissas e dos resultados.
- "Ver" mostra os resultados armazenados. "Recalcular" utiliza o produto e as configurações atuais (sem modificar o cadastro).
- Referências adicionadas no simulador são temporárias; podem ser armazenadas como parte de uma simulação salva, mas não atualizam o módulo Custos.

## Premissas importantes

- Volumes de vendas dos cenários são hipóteses do usuário, **não previsões de demanda**.
- Na simulação de um único produto, o resultado periódico considera todos os custos fixos mensais configurados. Em negócios com vários produtos, é uma análise conservadora do produto isolado, não o lucro total da empresa.
- A margem unitária exibida usa o rateio configurado por volume mensal padrão. O resultado do período usa o custo fixo integral uma única vez.
- A posição de mercado é baseada nos preços fornecidos pelo empreendedor, que devem ser comparáveis em produto, volume, região e período. Não existe um preço máximo universal.
- A faixa de análise e o preço sugerido são cálculos orientativos, não garantia de vendas.

## Verificações manuais antes de publicar

1. Editar as três simulações e confirmar que o preço cadastrado em **Produtos** não muda.
2. Mudar preço, quantidade, custo variável e custo fixo e conferir o gráfico.
3. Comparar cenários e verificar mensagens em valores inválidos.
4. Criar meta, incluir/remover uma referência e verificar as atualizações.
5. Salvar, atualizar a página, usar **Ver** e **Recalcular**, depois excluir um registro.
6. Conversar com a ZUZ, aplicar uma proposta e confirmar que apenas o cenário muda.
7. Testar modo claro/escuro, largura móvel e navegação por teclado.
