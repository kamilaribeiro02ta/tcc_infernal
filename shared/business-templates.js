(function (root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) module.exports = catalog;
  if (root) root.ZUZBusinessTemplates = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
    operations: {
      producao: { name: "Produção própria", costingMode: "por_lote", categories: ["Matéria-prima", "Embalagens", "Mão de obra direta", "Energia de produção", "Perdas de produção", "Frete", "Taxas de venda"] },
      revenda: { name: "Revenda", costingMode: "por_unidade", categories: ["Compra de mercadoria", "Frete de aquisição", "Impostos de aquisição", "Taxas de venda", "Garantia", "Embalagens", "Entrega"] },
      servico: { name: "Prestação de serviços", costingMode: "por_hora", categories: ["Horas trabalhadas", "Materiais utilizados", "Deslocamento", "Terceirização", "Licenças", "Equipamentos", "Taxas de venda"] },
      misto: { name: "Atividade mista", costingMode: "por_unidade", categories: ["Matéria-prima", "Mercadorias", "Mão de obra", "Materiais", "Frete", "Taxas de venda"] }
    },
    segments: {
      confeitaria: ["Ingredientes", "Gás", "Decoração", "Descartáveis", "Desperdício"],
      tecnologia: ["Peças e componentes", "Licenças de software", "Assistência técnica"],
      vestuario: ["Tecidos", "Aviamentos", "Etiquetas", "Acabamento"],
      alimentacao: ["Ingredientes", "Higiene", "Descarte", "Gás"],
      beleza: ["Produtos de atendimento", "Descartáveis", "Esterilização"],
      outros: []
    }
  };
});
