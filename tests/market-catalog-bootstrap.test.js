"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {SOURCES,product,buildURL,nextTopics}=require("../server/market-catalog-bootstrap");
test("somente bases com itens importados estão disponíveis sem preços inventados",()=>{
 assert.deepEqual(Object.keys(SOURCES).sort(),["openbeautyfacts","openfoodfacts"].sort());
 assert.ok(SOURCES.openfoodfacts.topics.length>=30);
 const x=product({code:"3017620422003",product_name:"Creme de avelã",brands:"Marca identificada",quantity:"350 g",
  categories:"cremes",ingredients_text_pt:"Ingredientes da fonte"},"openfoodfacts");
 assert.equal(x.name,"Creme de avelã");
 assert.equal(x.externalId,"3017620422003");
 assert.equal(x.attributes.price_notice.includes("não inclui preço"),true);
 assert.equal(x.price,undefined);
 assert.equal(product({code:"",product_name:"Vassoura"},"openfoodfacts"),null);
});
test("usa busca estruturada por categoria para alimentos e legacy com filtro para outros",()=>{
 const food=buildURL("openfoodfacts","arroz",1,50);
 assert.equal(food.pathname,"/api/v2/search");
 assert.equal(food.searchParams.get("categories_tags_en"),"rice");
 const beauty=buildURL("openbeautyfacts","shampoo",1,50);
 assert.equal(beauty.pathname,"/cgi/search.pl");
 assert.equal(beauty.searchParams.get("search_terms"),"shampoo");
 assert.throws(()=>buildURL("openpetfoodfacts","racao",1,50));
 assert.throws(()=>buildURL("openfoodfacts","categoria-inexistente",1,50));
});
test("agendamento prioriza importação real das fontes com zero resultados",()=>{
 const arr=nextTopics(25000,["openfoodfacts","openbeautyfacts"]);
 assert.equal(arr.length,2);
 assert.equal(arr[0].topic,"arroz");
 assert.equal(arr[1].topic,"shampoo");
});
