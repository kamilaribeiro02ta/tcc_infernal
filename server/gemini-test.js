"use strict";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const instructions = "Você é o assistente de teste da ZUZ, sistema brasileiro de precificação para pequenos negócios. Responda em português do Brasil de modo claro e objetivo. Ajude com custos, despesas, margem e preços, explicando hipóteses e cálculos. Solicite os dados que faltarem. Nunca invente cotações de mercado ou alíquotas tributárias. Não alegue acesso ou capacidade de alterar cadastros, produtos e simulações.";

function candidatesFromList(models) {
  const eligible = models.filter(model =>
    typeof model?.name === "string" &&
    /^models\/gemini-[\w.-]+$/.test(model.name) &&
    Array.isArray(model.supportedGenerationMethods) &&
    model.supportedGenerationMethods.includes("generateContent") &&
    !/embedding|imagen|veo|tts|audio|image|robotics|computer-use|live|native-audio/i.test(model.name)
  );
  const rank = name => {
    if (/gemini-2\.5-flash-lite(?:$|-)/.test(name)) return 0;
    if (/gemini-2\.5-flash(?:$|-)/.test(name)) return 1;
    if (/gemini-3.*flash/.test(name)) return 2;
    if (/flash/i.test(name)) return 3;
    if (/pro/i.test(name)) return 8;
    return 5;
  };
  return eligible.sort((a,b)=>rank(a.name)-rank(b.name)).map(m=>m.name.slice(7));
}

async function request(url, key, options, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response = await fetch(url,{
      ...options,
      headers:{"x-goog-api-key":key,...options?.headers},
      signal:controller.signal
    });
    const body=await response.json().catch(()=>({}));
    return { status:response.status,ok:response.ok,body };
  } finally {clearTimeout(timer);}
}

async function availableModels(key) {
  let pageToken="";
  const list=[];
  for(let i=0;i<3;i++){
    const url=ENDPOINT+"/models?pageSize=100"+(pageToken?"&pageToken="+encodeURIComponent(pageToken):"");
    const result=await request(url,key,{method:"GET"},12000);
    if(!result.ok)return {error:result,models:[]};
    list.push(...(Array.isArray(result.body.models)?result.body.models:[]));
    pageToken=String(result.body.nextPageToken||"");
    if(!pageToken)break;
  }
  return {models:candidatesFromList(list)};
}

function errorMessage(result, exhaustedModels=false) {
  const detail=String(result?.body?.error?.message||"");
  if(result?.status===429 || /quota|rate limit|resource.exhausted/i.test(detail))
    return "A cota do Gemini foi atingida ou o plano gratuito não permite esta requisição. Consulte seus limites no Google AI Studio.";
  if(/API_KEY_INVALID|API key not valid|invalid API key/i.test(detail))
    return "A chave GEMINI_API_KEY não foi aceita pelo Google. Atualize a chave nas variáveis da Vercel.";
  if(result?.status===403)
    return "O Google bloqueou o acesso da chave (403). Confira restrições e permissões no Google AI Studio.";
  if(exhaustedModels)
    return "O Google retornou 'modelo não encontrado' para os modelos disponíveis nesta chave. Verifique o acesso aos modelos e à API no Google AI Studio.";
  if(result?.status===404)
    return "O modelo solicitado não está disponível nesta conta do Gemini (404).";
  if(result?.status===400)
    return "O Gemini rejeitou a requisição (400). Verifique a configuração do projeto no Google AI Studio.";
  return "A API Gemini retornou HTTP "+(result?.status||"desconhecido")+". Verifique o acesso à API.";
}

function registerGeminiTestRoute(router, asyncRoute, getUser) {
  router.post("/ai/test",asyncRoute(async (req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await getUser(req);
    if(!user)return res.status(401).json({error:"Faça login na ZUZ para usar o Teste IA."});
    const key=String(process.env.GEMINI_API_KEY||"").trim();
    if(!key)return res.status(503).json({error:"Configure GEMINI_API_KEY no ambiente Production da Vercel."});
    const message=String(req.body?.message||"").trim();
    if(!message||message.length>3000)return res.status(400).json({error:"Envie uma mensagem de até 3000 caracteres."});

    const history=Array.isArray(req.body?.history)?req.body.history.slice(-12):[];
    const contents=history.filter(m=>["user","model"].includes(m?.role)&&typeof m.text==="string")
      .map(m=>({role:m.role,parts:[{text:m.text.slice(0,3000)}]}));
    contents.push({role:"user",parts:[{text:message}]});

    let discovery;
    try{discovery=await availableModels(key);}
    catch(error){
      console.error("Gemini model discovery network error",error?.name);
      return res.status(502).json({error:"Não foi possível consultar os modelos da API Gemini. Tente novamente."});
    }
    if(discovery.error)return res.status(502).json({error:errorMessage(discovery.error),providerStatus:discovery.error.status});
    if(!discovery.models.length)return res.status(502).json({error:"Nenhum modelo de chat compatível com generateContent foi liberado para esta chave."});

    const preferred=String(process.env.GEMINI_MODEL||"").trim();
    const names=[...new Set([preferred,...discovery.models].filter(x=>x && discovery.models.includes(x)))].slice(0,6);
    let last;
    for(const model of names){
      try{
        const result=await request(ENDPOINT+"/models/"+encodeURIComponent(model)+":generateContent",key,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            systemInstruction:{parts:[{text:instructions}]},
            contents,
            generationConfig:{maxOutputTokens:1400,temperature:0.4}
          })
        },23000);
        if(result.ok){
          const reply=(result.body.candidates?.[0]?.content?.parts||[]).map(p=>p.text||"").join("").trim();
          if(reply)return res.json({reply,model});
          return res.status(502).json({error:"O Gemini não retornou texto. Reformule a pergunta e tente novamente."});
        }
        last=result;
        if(result.status===404)continue; // um modelo anunciado pode retornar NOT_FOUND
        console.error("Gemini test request rejected",{status:result.status,code:result.body?.error?.status,model});
        return res.status(502).json({error:errorMessage(result),providerStatus:result.status});
      }catch(error){
        console.error("Gemini generation network error",error?.name);
        return res.status(502).json({error:"A conexão com o Gemini falhou ou excedeu o tempo limite."});
      }
    }
    return res.status(502).json({error:errorMessage(last,true),providerStatus:last?.status});
  }));
}
module.exports={registerGeminiTestRoute};
