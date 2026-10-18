"use strict";
// Ponte para Calculadora RTC OFFLINE auto-hospedada; nunca chamar API pública de cálculo
// online da Receita (não existe integração online pública garantida).
const DOCUMENTATION="https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora/calculadora-offline/calculadora-offline-instrucoes";
const SWAGGER="https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/api/swagger-ui/index.html";
const validUf=new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
function endpoint(){
 const configured=String(process.env.RTC_OFFLINE_API_BASE_URL||"").trim();
 if(!configured)return null;
 try{
  const url=new URL(configured);
  // Um endpoint remoto só pode ser definido pelo administrador do servidor.
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||url.pathname.replace(/\/+$/,"")!=="/api")return null;
  return url.origin+"/api";
 }catch{return null;}
}
function validateRTC(payload){
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return "Dados da operação inválidos.";
 const date=String(payload.dataHoraEmissao||"");
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(date)||!Number.isFinite(Date.parse(date)))return "Data e hora de emissão inválidas.";
 if(!validUf.has(String(payload.uf||"")))return "Informe a UF da operação.";
 if(!Number.isSafeInteger(Number(payload.municipio))||String(payload.municipio).length!==7)return "Informe código IBGE de município válido.";
 const list=payload.itens;
 if(!Array.isArray(list)||list.length<1||list.length>20)return "Informe entre 1 e 20 itens.";
 for(const item of list){
  if(!item||typeof item!=="object"||Array.isArray(item))return "Item fiscal inválido.";
  const klass=String(item.cClassTrib||""),cst=String(item.cst||"");
  const price=Number(item.baseCalculo),qty=Number(item.quantidade);
  if(!/^\d{6}$/.test(klass)||!/^\d{3}$/.test(cst))return "CST e cClassTrib devem ser informados e validados.";
  if(!Number.isFinite(price)||price<=0||price>1e9||!Number.isFinite(qty)||qty<=0||qty>1e8)return "Base de cálculo e quantidade inválidas.";
  if(!/^\d{8}$/.test(String(item.ncm||""))&&!/^\d{9}$/.test(String(item.nbs||"")))return "Informe NCM de 8 dígitos ou NBS de 9 dígitos.";
 }
 return null;
}
async function offlineCalculate(payload){
 const base=endpoint();
 if(!base)return {available:false,warning:"Motor RTC offline não configurado. Utilize o simulador oficial em ambiente próprio."};
 const error=validateRTC(payload);if(error)return {available:false,validationError:error};
 const req=await fetch(base+"/calculadora/regime-geral",{
  method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json",...(process.env.RTC_OFFLINE_API_TOKEN?{"Authorization":"Bearer "+process.env.RTC_OFFLINE_API_TOKEN}:{})},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
 if(!req.ok)return {available:false,warning:"Motor RTC respondeu com erro; confira versão, CST, cClassTrib e operação."};
 const response=await req.text();if(response.length>300000)return {available:false,warning:"Resposta excede o limite."};
 const data=JSON.parse(response);
 const root=data.total?.tribCalc||data.total||{};
 const ibs=Number(root.IBSCBSTot?.gIBS?.vIBS),cbs=Number(root.IBSCBSTot?.gCBS?.vCBS),is=Number(root.ISTot?.vIS);
 const numbers=[ibs,cbs,is].map(n=>Number.isFinite(n)&&n>=0&&n<1e12?n:null);
 if(numbers.some(n=>n===null))return {available:false,warning:"A resposta da versão instalada não pôde ser interpretada sem risco de atribuir tributos errados."};
 return {available:true,source:"Motor oficial RTC offline auto-hospedado",ibs:numbers[0],cbs:numbers[1],impostoSeletivo:numbers[2],
  note:"Valores simulados para a operação informada (CBS/IBS/IS), não imposto total efetivamente devido pela empresa ou DAS. Verifique créditos, regime, data, CST e cClassTrib."};
}
function registerRTCRoutes(router,{asyncRoute}){
 router.get("/market/rtc/status",(_req,res)=>res.json({enabled:!!endpoint(),docs:DOCUMENTATION,swagger:SWAGGER,
  requirements:"Hospedar o pacote oficial RTC (Docker/Java 21) e configurar RTC_OFFLINE_API_BASE_URL=https://.../api; preencher classificação, UF, município e operação; validar versão instalada.",
  notice:"A ZUZ não atribui alíquota tributária com base apenas no nome do produto."}));
 router.post("/market/rtc/calculate",asyncRoute(async(req,res)=>{
  if(!endpoint())return res.status(503).json({error:"Motor RTC offline não habilitado. Consulte a Calculadora RTC oficial."});
  let result;try{result=await offlineCalculate(req.body);}
  catch{result={available:false,warning:"Falha de comunicação com o motor RTC offline; sem resultado presumido."};}
  res.setHeader("Cache-Control","no-store");
  if(result.validationError)return res.status(422).json({error:result.validationError});
  res.json(result);
 }));
}
module.exports={registerRTCRoutes,validateRTC,endpoint,offlineCalculate};
