# ZUZ — pesquisa e comparação na própria página

Implementação preparada a partir de kamilaribeiro02ta/tcc_infernal, main,
commit de referência 4a3ac7f4e04f0cf0c83b5d88a6e5a84be883d605.
Aplicação direta na main autorizada pelo usuário. Publicação na Vercel não verificada.

## O que foi corrigido

- Pesquisa compacta em Produtos, Custos e Simulações; sem overlay ou página de produto selecionado.
- Em Produtos, a consulta aparece na página antes do catálogo privado, fora do formulário de cadastro.
- Resultados com preço, nome, fornecedor, origem e datas. Seleção abre detalhes expansíveis no próprio resultado.
- Comparação opcional de até três referências, mantendo os resultados e a consulta.
- Consultas paralelas à base de referências e aos anúncios autorizados. Um catálogo sem preço não impede a consulta de lojas.
- Tratamento de falhas parciais, ausência de resultados, cancelamento e limite de espera de 20 segundos por fonte.
- Itens sem preço aparecem numa seção recolhida e são explicitamente identificados como catálogo, não ofertas.
- Compras públicas, preços antigos, cotações por GTIN e anúncios semelhantes recebem classificações distintas. Nenhuma média é inferida entre eles.
- Custos, margens, descontos, frete e impostos não fornecidos pelas integrações aparecem como indisponíveis.
- Só a ação explícita de utilização pode preencher o cadastro existente ou pedir validação de uma cotação para a simulação. Selecionar uma oferta não abre outra página.
- Fonte original continua acessível por link externo explícito.
- Poppins, roxo e modos claro/escuro preservados; CSS da consulta substituído sem modificar estilos globais.

## Backend e fontes

Nova rota autenticada GET /api/market/references?q=...:
procura até 12 itens na base existente, recupera até 20 observações por item e,
no PostgreSQL, tenta atualizar as primeiras quatro referências pelas integrações já existentes.
A busca usa parâmetros SQL e exige de 3 a 80 caracteres.
Não cadastra ofertas fictícias, não mistura dados privados de empresas e não exige migração de banco.
Os primeiros itens são priorizados pela existência de observações de preço.
Os avisos de limite orientam a refinar marca/modelo.

O SQLite consulta apenas os registros locais. O PostgreSQL também pode atualizar
preços via Open Prices e Compras.gov.br conforme as regras existentes.
Os anúncios comerciais continuam dependentes da configuração existente de SERPAPI_API_KEY.
Não foram criadas credenciais, novas integrações ou dados de produção.
Os catálogos Open Facts não fornecem preços por si só.

Sem preços existentes ou provedores habilitados, a interface mostra a ausência de
referências e oferece a precificação manual. A alteração não promete cobertura
comercial de todos os produtos.

## Validação

- npm run test:core: 69 testes passaram.
- Testes novos: normalização e segurança de referências, falhas parciais,
  limite de atualizações, busca parametrizada, cancelamento, timeout,
  manutenção de resultados e validação antes de usar cotação.
- API real local com SQLite: autenticação 401, cadastro de conta exclusiva de teste 201,
  busca vazia 200, entrada inválida 400 e provedor comercial desabilitado 200.
- Navegador: Custos com respostas controladas de teste, larguras de 320, 390, 768 e
  1280 px e temas claro/escuro; pesquisa, detalhes e comparação sem overflow ou erros JS.
- Os dados controlados usados na verificação visual não fazem parte dos arquivos entregues.
- Não foi possível testar a base PostgreSQL de produção nem consultar anúncios reais
  do ambiente publicado: as credenciais desse ambiente não foram fornecidas.

## Aplicação

Este pacote contém apenas os arquivos alterados, mantendo os caminhos relativos
à raiz do projeto, mais ALTERACOES.diff para revisão.
Após revisar, substitua os arquivos correspondentes na cópia local do projeto e execute:

    npm install
    npm run test:core
    npm run dev

Não substitua o projeto inteiro pelo conteúdo deste pacote: os demais arquivos,
imagens, banco e configurações existentes devem continuar no projeto.
As mudanças deste documento estão limitadas à pesquisa e consulta de referências de mercado.
