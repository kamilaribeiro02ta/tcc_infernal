# ZUZ — Motor de precificação inteligente

## Fonte de verdade
O cálculo financeiro pertence a `shared/pricing-core.js`. Produtos, Gráficos e Simulações devem usar `ZUZPricing.calculate`; o backend usa o mesmo núcleo em `/api/pricing/calculate`.

### Fórmulas
- Custo variável unitário direto: soma dos custos do produto e custos adicionais.
- Rateio fixo unitário para análise do produto: custos fixos mensais / volume mensal de referência (`monthlyUnits`).
- Tributos e comissões: preço de venda × (`taxesPct + sellingFeesPct`) / 100.
- **Preço mínimo técnico com margem desejada:** (custo direto + rateio fixo) / (1 - (tributos + taxas + margem desejada) / 100).
- Margem de contribuição unitária: preço de venda - custo direto - tributos e taxas variáveis.
- Resultado do mês simulado: contribuição unitária × unidades do cenário - custos fixos mensais **uma única vez**.
- Ponto de equilíbrio: teto(custos fixos / margem de contribuição) se a contribuição for positiva; caso contrário, indisponível.

A margem unitária usa o rateio por volume de referência; o resultado mensal usa os custos fixos reais do período, sem multiplicá-los pelo número de produtos. A divergência entre margem unitária e margem do cenário pode ser legítima quando o volume simulado difere do volume de referência.

### Referências de mercado
Referências precisam ter `category` e/ou `productName`/`productId` comparáveis ao produto analisado. Sem pelo menos **três** referências identificadas, a ZUZ não afirma um teto. Quando existem três ou mais comparáveis, o percentil 75 serve de referência superior **condicionada à amostra**, não como preço máximo garantido. Se esse percentil estiver abaixo do mínimo técnico, o sistema alerta para a inviabilidade comercial aparente.

`positioning` altera o preço de referência: `preco` usa percentil 25, `mercado` usa mediana, `diferenciacao` usa percentil 75. A sugestão nunca é inferior ao preço mínimo técnico calculado. Esses percentis são regras de decisão explícitas do software, **não** uma lei econômica universal.

### Persistência
`ZUZPricing.saveSettings(settings)` agora retorna uma Promise e só atualiza o cache local após a confirmação do servidor. Chamadas devem usar `await` e tratar erros. A rota autenticada `PUT /api/company/settings` valida e persiste configurações no SQLite.

Cada cadastro/edição de produto e alteração de configurações relevantes registra o cálculo e a justificativa em `zuz_pricing_history`. Alterações sem diferença no cálculo e configurações não criam duplicatas consecutivas. Consulte `GET /api/pricing/history?productId=<id>&limit=30` com sessão autenticada. Os registros continuam no histórico mesmo quando um produto é excluído.

### Modelo preditivo (opt-in, não automático)
- `PUT /api/pricing/sales`: envia `{ "productId": "...", "period": "2026-09", "averagePrice": 39.9, "soldUnits": 25 }` para registrar **vendas reais do mês**.
- `GET /api/pricing/prediction?productId=<id>`: retorna `ready:false` enquanto não houver evidência suficiente.
- Condições iniciais: pelo menos oito meses distintos, quatro preços diferentes, variação de vendas, inclinação negativa e `R² ≥ 0.5`. Resultado é exploratório e não prova causalidade.
- O modelo `ml-regression` trabalha apenas dentro da faixa de preços efetivamente observados e respeita o preço mínimo técnico.
- **Não** alimenta o modelo com quantidades projetadas, histórico de sugestões ou dados artificiais.

A interface de cadastro mensal de vendas, a visualização do histórico e a incorporação da previsão nas recomendações podem ser incrementadas posteriormente. Até lá, a previsão é uma API opcional; sem dados reais, não há sugestão estatística.

### Google OR-Tools
O pacote Python permanece opcional (`requirements-optimization.txt`). Não é executado automaticamente pelo servidor Node: a ZUZ precisará de uma ponte controlada entre processos e restrições formalizadas (limites, capacidade, quantidades, orçamento) antes de usá-lo para otimização.

### Verificação
```powershell
git pull origin feature/precificacao-inteligente
npm.cmd install
npm.cmd run test:core
npm.cmd start
```

Testar autenticação, criação e edição de produtos, salvamento de configurações e consulta do histórico antes de mesclar à branch principal.
