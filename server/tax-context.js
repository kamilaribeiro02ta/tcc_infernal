"use strict";
// IBPT mostra carga aproximada incorporada no preço para consumidor (Lei 12.741/2012).
// Não equivale ao DAS, ICMS, ISS, IPI ou IBS/CBS efetivamente devidos pelo vendedor.
const SOURCES=[
 {label:"Receita Federal — TIPI / IPI",url:"https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados"},
 {label:"Portal NF-e — NCM, IBS e CBS",url:"https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=%2FNJarYc9nus%3D"},
 {label:"IBGE — classificação CNAE",url:"https://cnae.ibge.gov.br/"},
 {label:"IBPT — De Olho no Imposto",url:"https://deolhonoimposto.ibpt.org.br/Site/API"}
];
const clean=(x,n=120)=>String(x||"").trim().slice(0,n);
const finite=x=>x!==""&&x!==undefined&&x!==null&&Number.isFinite(Number(x))?Number(x):null;
const validUf=new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
function taxContext(body={}){
 const price=finite(body.salePrice),rate=finite(body.estimatedBusinessRate);
 const uf=clean(body.uf,2).toUpperCase(),ncm=clean(body.ncm,8),code=clean(body.serviceCode,14);
 const activity=["revenda","producao","servico","misto"].includes(body.activity)?body.activity:"nao_informada";
 const regime=["mei","simples","presumido","real","outro"].includes(body.regime)?body.regime:"nao_informado";
 const warnings=[];
 if(price!==null&&(price<=0||price>1e8))throw new RangeError("O preço deve ser positivo.");
 if(rate!==null&&(rate<0||rate>90))throw new RangeError("A taxa informada deve estar entre 0% e 90%.");
 if(uf&&!validUf.has(uf))throw new RangeError("UF inválida.");
 if(ncm&&!/^\d{8}$/.test(ncm))throw new RangeError("NCM deve ter 8 dígitos.");
 if(code&&!/^[\d.]{3,14}$/.test(code))throw new RangeError("Código do serviço inválido.");
 if(!ncm&&activity!=="servico")warnings.push("Informe o NCM validado do produto para pesquisar classificação fiscal; GTIN ou nome não determinam NCM.");
 if(activity==="servico"&&!code)warnings.push("Para serviços, informe o código de serviço validado (NBS ou LC 116).");
 if(!uf)warnings.push("UF não informada: regras estaduais podem variar.");
 if(regime==="nao_informado")warnings.push("Informe o regime tributário para contextualizar as regras.");
 if(regime==="simples")warnings.push("No Simples Nacional, a apuração real depende de RBT12, anexo, segregação de receitas, município/UF e exceções. Uma taxa digitada não substitui PGDAS-D.");
 if(regime==="mei")warnings.push("O MEI possui recolhimento próprio e limites; não estime sua obrigação mensal multiplicando a venda por uma taxa.");
 if(regime==="presumido"||regime==="real")warnings.push("Tributos devidos dependem da operação, base de cálculo, créditos e legislação aplicável.");
 warnings.push("Em 2026 há regras de transição de IBS/CBS. Não presuma que uma tabela antiga determina o tributo atual.");
 const canSimulate=price!==null&&price>0&&rate!==null;
 return {activity,regime,uf:uf||null,ncm:ncm||null,serviceCode:code||null,salePrice:price,
  manualSimulation:canSimulate?{rate,estimatedAmount:Math.round(price*rate)/100,
  remainder:Math.round(price*(100-rate))/100,
  label:"Impacto hipotético da alíquota INFORMADA pelo usuário (não é imposto a recolher)."}:null,
  ibptAvailable:!!process.env.IBPT_TOKEN,
  warnings,sources:SOURCES,
  disclaimer:"Informação educativa e simulação, não apuração fiscal ou orientação tributária individual. Confirme classificação, benefícios, incidências e regime com contador."};
}
async function ibptEstimate(body,context){
 if(!body.useIbpt)return null;
 if(!process.env.IBPT_TOKEN)return {available:false,warning:"Integração IBPT exige token autorizado no servidor."};
 const cnpj=String(body.cnpj||"").replace(/\D/g,"").slice(0,14);
 const code=context.activity==="servico"?context.serviceCode:context.ncm;
 if(cnpj.length!==14||!context.uf||!code||!context.salePrice)
  return {available:false,warning:"Para consulta IBPT é necessário CNPJ, UF, código fiscal e preço. Nenhum dado é armazenado."};
 const service=context.activity==="servico";
 const path=service?"servicos":"produtos";
 const params=new URLSearchParams({token:process.env.IBPT_TOKEN,cnpj,codigo:code,uf:context.uf,
  descricao:clean(body.productName,100)||"Produto informado",unidade:"UN",valor:String(context.salePrice)});
 if(!service){params.set("ex","0");params.set("gtin",clean(body.gtin,14));}
 try{
  const resp=await fetch("https://apidoni.ibpt.org.br/api/v1/"+path+"?"+params.toString(),{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(7000)});
  if(!resp.ok)return {available:false,warning:"IBPT indisponível ou credenciais não autorizadas."};
  const raw=await resp.text();if(raw.length>80000)return {available:false,warning:"IBPT retornou resposta acima do limite."};
  const data=JSON.parse(raw),r=Array.isArray(data)?data[0]:data;
  if(!r||!Number.isFinite(Number(r.Nacional)))return {available:false,warning:"Não houve referência tributária válida."};
  const national=Number(r.Nacional),state=Number(r.Estadual)||0,municipal=Number(r.Municipal)||0;
  const total=national+state+municipal;
  if([national,state,municipal].some(n=>n<0||n>100)||total>100)return {available:false,warning:"Resposta tributária fora do intervalo esperado."};
  return {available:true,source:"IBPT — De Olho no Imposto",national,state,municipal,total,
   approximateAmount:Math.round(context.salePrice*total)/100,validFrom:r.VigenciaInicio||null,validTo:r.VigenciaFim||null,
   version:r.Versao||null,note:"Carga tributária aproximada embutida no preço, NÃO corresponde ao imposto que a empresa deverá recolher."};
 }catch{return {available:false,warning:"Consulta IBPT falhou. Informe sua taxa estimada manualmente, se conhecida."};}
}
const ncmCache=new Map();
async function searchNcm(term){
 const q=clean(term,75),key=q.toLowerCase();
 if(q.length<3)return {items:[],warning:"Informe pelo menos 3 caracteres."};
 const hit=ncmCache.get(key);
 if(hit&&Date.now()-hit.at<12*3600000)return hit.value;
 const url="https://brasilapi.com.br/api/ncm/v1?"+new URLSearchParams({search:q});
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(6500),headers:{"Accept":"application/json"}});
  if(!response.ok)throw Error("Erro na consulta");
  const raw=await response.text();if(raw.length>1100000)throw Error("Resposta acima do limite");
  const results=JSON.parse(raw);
  const items=(Array.isArray(results)?results:[]).filter(x=>/^\d{2}\.\d{2}\.\d{2}\.\d{2}$/.test(x.codigo||"")||/^\d{8}$/.test(x.codigo||""))
   .slice(0,12).map(x=>({code:String(x.codigo).replace(/\D/g,""),description:clean(x.descricao,180),validFrom:x.data_inicio||null,validTo:x.data_fim||null}));
  const value={items,source:"BrasilAPI (agregador de códigos NCM)",note:"Códigos candidatos, não classificação fiscal confirmada. Verifique TIPI e descrição oficial antes de aplicar."};
  if(ncmCache.size>100)ncmCache.clear();ncmCache.set(key,{at:Date.now(),value});
  return value;
 }catch{return {items:[],warning:"Consulta de códigos NCM indisponível; informe o código validado manualmente."};}
}
function registerTaxContextRoutes(router,{asyncRoute}){
 router.get("/market/ncm",asyncRoute(async(req,res)=>{
  const data=await searchNcm(req.query.q);
  res.setHeader("Cache-Control","private, no-store");res.json(data);
 }));
 router.post("/market/tax-context",asyncRoute(async(req,res)=>{
  if(!req.body||typeof req.body!=="object")return res.status(400).json({error:"Dados inválidos."});
  let context;
  try{context=taxContext(req.body);}catch(error){if(error instanceof RangeError)return res.status(400).json({error:error.message});throw error;}
  const ibpt=await ibptEstimate(req.body,context);
  res.setHeader("Cache-Control","private, no-store");
  res.json({...context,ibpt});
 }));
}
module.exports={registerTaxContextRoutes,taxContext};
