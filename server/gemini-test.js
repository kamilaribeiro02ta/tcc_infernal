"use strict";

const actions = require("./zuni-actions");
const { randomUUID } = require("node:crypto");
const { query, provider } = require("./database");
let schemaReady = null;
function ensureHistorySchema() {
  if (!schemaReady) schemaReady = (async () => {
    if (provider === "postgresql") {
      await query(`CREATE TABLE IF NOT EXISTS zuz_ai_conversations (
        id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES zuz_users(id) ON DELETE CASCADE,
        title VARCHAR(120) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await query(`CREATE TABLE IF NOT EXISTS zuz_ai_messages (
        id UUID PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES zuz_ai_conversations(id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user','model')),
        content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await query("CREATE INDEX IF NOT EXISTS idx_zuz_ai_conversations_user ON zuz_ai_conversations(user_id,updated_at DESC)");
      await query("CREATE INDEX IF NOT EXISTS idx_zuz_ai_messages_conversation ON zuz_ai_messages(conversation_id,created_at,id)");
      await query("ALTER TABLE zuz_ai_conversations ENABLE ROW LEVEL SECURITY");
      await query("ALTER TABLE zuz_ai_messages ENABLE ROW LEVEL SECURITY");
    } else {
      await query(`CREATE TABLE IF NOT EXISTS zuz_ai_conversations (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES zuz_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      await query(`CREATE TABLE IF NOT EXISTS zuz_ai_messages (
        id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES zuz_ai_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user','model')),
        content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      await query("CREATE INDEX IF NOT EXISTS idx_zuz_ai_conversations_user ON zuz_ai_conversations(user_id,updated_at DESC)");
      await query("CREATE INDEX IF NOT EXISTS idx_zuz_ai_messages_conversation ON zuz_ai_messages(conversation_id,created_at,id)");
    }
  })().catch(error => {schemaReady=null;throw error;});
  return schemaReady;
}
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const modelCache = {models:[],expires:0};
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const instructions = "Você é Zuni, a mascote e assistente virtual da ZUZ, sistema brasileiro de precificação para pequenos negócios. Apresente-se somente na primeira resposta de uma conversa nova, em uma frase breve. Nas respostas seguintes, inclusive após usar ferramentas, não cumprimente nem repita seu nome; responda diretamente. Seja acessível e profissional. Responda em português do Brasil de modo claro e objetivo. Ajude com custos, despesas, margem e preços, explicando hipóteses e cálculos. Atue como consultora de precificação, não como formulário: nunca exija que o empreendedor saiba o preço de venda ou a margem que veio descobrir. Primeiro aproveite dados já informados e dados reais da conta; calcule o custo unitário quando houver custo total e quantidade, e ofereça cenários de preço e margem com contas explícitas. Diferencie margem sobre preço de venda de acréscimo sobre custo. Se faltarem custos, embalagem, taxas ou volume, pergunte apenas o indispensável, uma pergunta por vez; ofereça valores provisórios ilustrativos quando ajudarem, com hipótese, unidade, origem da estimativa e aviso claro de que NÃO são preços reais nem cotações verificadas. Nunca apresente custo estimado como custo confirmado e nunca invente cotações de mercado, fornecedores, tributos ou alíquotas. Para uma sugestão preliminar, não exija todos os campos de cadastro: dê faixas e cenários condicionais, identifique dados pendentes e convide o usuário a refiná-los. Você pode consultar produtos, calcular preços e preparar cadastros e alterações usando EXCLUSIVAMENTE as ferramentas disponíveis. Ao receber pedido para cadastrar ou alterar, reconheça o nome e sugira categoria automaticamente. Aceite UM custo unitário agregado confirmado, inclusive calculado a partir do custo total de um lote dividido pela quantidade; não exija discriminação artificial de ingredientes. Sugira imediatamente cenários de preço e margem sem exigir preço ou margem prévios. Para concluir o cadastro, obtenha nome, categoria, um ou mais custos unitários confirmados, preço de venda, margem desejada e volume mensal; ofereça uma proposta curta com valores calculados ou estimados, solicitando aprovação explícita dos valores ainda não confirmados ANTES de chamar a ferramenta de escrita. Se faltar volume, sugira uma hipótese de volume e peça aprovação, sem bloquear a sugestão de preço. Nunca repita um questionário completo nem pergunte dados já informados. Para salvar, nunca use suposições não aprovadas, dados ou IDs inventados, nem zero para preencher dados ausentes. Consulte produtos para obter IDs e dados antes de alterar. Não afirme que salvou: as ferramentas de escrita só preparam propostas e o usuário precisa confirmar no card. Quando faltarem dados, pergunte de forma curta e guiada. Você também pode consultar estoque, consultar calendário e preparar novos compromissos, encomendas, lembretes, ajustes de estoque total e registro de vendas. Use as ferramentas para obter os IDs reais dos produtos; não invente IDs. Para agendas, exija dia exato, tipo e título e obtenha a hora caso o usuário tenha especificado um horário. Para estoque, esclareça que a quantidade informada é o TOTAL disponível, não uma soma. Para vendas, obtenha produto real, quantidade, preço unitário e data; informe que a confirmação diminui o estoque e que não é possível vender sem quantidade disponível. Antes de propor gravação, apresente detalhes e jamais realize alterações sem a confirmação explícita pelo card. Consulte calendário e estoque reais ao responder; não confunda produtos cadastrados com estoque físico disponível. Não execute ações fora das ferramentas, não exclua produtos, não altere configurações da empresa e não diga que pode salvar simulações por enquanto.";

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
  if(modelCache.expires > Date.now() && modelCache.models.length) return {models:modelCache.models};
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
  const models = candidatesFromList(list);
  if(models.length){modelCache.models = models;modelCache.expires=Date.now()+10*60*1000;}
  return {models};
}

function errorMessage(result, exhaustedModels=false) {
  const detail=String(result?.body?.error?.message||"");
  if(result?.status===503 || result?.status===502 || result?.status===504)
    return "O serviço Gemini está temporariamente indisponível (HTTP "+result.status+"). Tente novamente em alguns instantes.";
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

function registerGeminiTestRoute(router, asyncRoute, getUser, services = {}) {
  const auth = async (req,res) => {
    const user=await getUser(req);
    if (!user) {res.status(401).json({error:"Faça login na ZUZ."});return null;}
    return user;
  };
  router.get("/ai/conversations",asyncRoute(async(req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await auth(req,res);if(!user)return;
    await ensureHistorySchema();
    const result=await query("SELECT id,title,created_at,updated_at FROM zuz_ai_conversations WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 150",[user.id]);
    res.json({conversations:result.rows});
  }));
  router.get("/ai/conversations/:id",asyncRoute(async(req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await auth(req,res);if(!user)return;
    if(!/^[0-9a-f-]{36}$/i.test(req.params.id))return res.status(400).json({error:"Conversa inválida."});
    await ensureHistorySchema();
    const row=await query("SELECT id,title,created_at,updated_at FROM zuz_ai_conversations WHERE id=$1 AND user_id=$2",[req.params.id,user.id]);
    if(!row.rows[0])return res.status(404).json({error:"Conversa não encontrada."});
    const messages=await query("SELECT role,content AS text,created_at FROM zuz_ai_messages WHERE conversation_id=$1 ORDER BY created_at,id LIMIT 500",[req.params.id]);
    res.json({conversation:row.rows[0],messages:messages.rows,actions:await actions.listActions(user.id,req.params.id)});
  }));
  router.delete("/ai/conversations/:id",asyncRoute(async(req,res)=>{
    const user=await auth(req,res);if(!user)return;
    if(!/^[0-9a-f-]{36}$/i.test(req.params.id))return res.status(400).json({error:"Conversa inválida."});
    await ensureHistorySchema();
    await query("DELETE FROM zuz_ai_conversations WHERE id=$1 AND user_id=$2",[req.params.id,user.id]);
    res.json({ok:true});
  }));
  router.post("/ai/actions/:id",asyncRoute(async(req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await auth(req,res);if(!user)return;
    const result=await actions.resolveAction(user.id,req.params.id,req.body?.decision,services.appendRecommendation);
    res.json(result);
  }));
  router.post("/ai/test",asyncRoute(async (req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await getUser(req);
    if(!user)return res.status(401).json({error:"Faça login na ZUZ para usar o Teste IA."});
    const key=String(process.env.GEMINI_API_KEY||"").trim();
    if(!key)return res.status(503).json({error:"Configure GEMINI_API_KEY no ambiente Production da Vercel."});
    const message=String(req.body?.message||"").trim();
    if(!message||message.length>3000)return res.status(400).json({error:"Envie uma mensagem de até 3000 caracteres."});

    await ensureHistorySchema();
    const requestedId=String(req.body?.conversationId||"");
    if(requestedId && !/^[0-9a-f-]{36}$/i.test(requestedId))return res.status(400).json({error:"Conversa inválida."});
    let history=[];
    if(requestedId){
      const owned=await query("SELECT id FROM zuz_ai_conversations WHERE id=$1 AND user_id=$2",[requestedId,user.id]);
      if(!owned.rows.length)return res.status(404).json({error:"Conversa não encontrada."});
      const previous=await query("SELECT role,content AS text FROM zuz_ai_messages WHERE conversation_id=$1 ORDER BY created_at DESC,id DESC LIMIT 12",[requestedId]);
      history=previous.rows.reverse();
    }
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

    const preferred=String(process.env.GEMINI_MODEL||"").trim().replace(/^models\//,"");
    const names=[...new Set([preferred,...discovery.models].filter(x=>x && discovery.models.includes(x)))];
    // Keep the whole backend request inside a bounded execution window on serverless.
    const deadline=Date.now()+21500;
    let last;
    let attempts=0;
    for(const model of names){
      if(attempts>=5 || deadline-Date.now()<1800) break;
      attempts++;
      try{
        const remaining=Math.min(9500,Math.max(1500,deadline-Date.now()-350));
        const result=await request(ENDPOINT+"/models/"+encodeURIComponent(model)+":generateContent",key,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            systemInstruction:{parts:[{text:instructions+(requestedId?" Esta é a continuação de uma conversa: NÃO se apresente, não cumprimente e não recomece o atendimento.":" Esta é uma nova conversa: cumprimente brevemente uma única vez.")}]},
            contents,
            tools:[{functionDeclarations:actions.declarations}],
            generationConfig:{maxOutputTokens:700,temperature:0.4}
          })
        },remaining);
        if(result.ok){
          const parts=result.body.candidates?.[0]?.content?.parts||[];
          let reply=parts.map(p=>p.text||"").join("").trim();
          const calls=parts.filter(p=>p.functionCall).map(p=>p.functionCall);
          const proposals=[];
          if(reply||calls.length){
            const id=requestedId||randomUUID();
            if(!requestedId){
              await query("INSERT INTO zuz_ai_conversations(id,user_id,title) VALUES($1,$2,$3)",[id,user.id,message.slice(0,116)]);
            }
            if(calls.length){
              let activeParts=parts;
              const toolContents=[...contents];
              for(let round=0;round<3;round++){
                const activeCalls=activeParts.filter(p=>p.functionCall).map(p=>p.functionCall);
                if(!activeCalls.length)break;
                const outcomes=[],responses=[];
                for(const call of activeCalls.slice(0,4)){
                  let outcome;
                  try{outcome=await actions.executeTool(call,user.id,id);}
                  catch(error){outcome={reply:error.name==="ZodError"?"Faltam dados válidos para esta ação. Informe nome, categoria, pelo menos um custo unitário confirmado, preço de venda, margem e volume mensal aprovados. Nenhuma alteração foi salva.":error.status?error.message:"Não foi possível preparar esta ação. Nenhuma alteração foi confirmada."};}
                  outcomes.push(outcome.reply);
                  if(outcome.action)proposals.push(outcome.action);
                  responses.push({functionResponse:{name:call.name,...(call.id?{id:call.id}:{}),response:outcome}});
                }
                reply=outcomes.join("\n\n");
                // Uma consulta pode fornecer o ID para a próxima ferramenta na mesma mensagem.
                // Propostas de escrita são apresentadas imediatamente para confirmação.
                if(proposals.length||activeCalls.length>4||round===2||deadline-Date.now()<2200)break;
                toolContents.push({role:"model",parts:activeParts},{role:"user",parts:responses});
                try{
                  const followup=await request(ENDPOINT+"/models/"+encodeURIComponent(model)+":generateContent",key,{
                    method:"POST",headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({systemInstruction:{parts:[{text:instructions+(requestedId?" Esta é a continuação de uma conversa: NÃO se apresente, não cumprimente e não recomece o atendimento.":" Esta é uma nova conversa: cumprimente brevemente uma única vez.")}]},contents:toolContents,
                      tools:[{functionDeclarations:actions.declarations}],generationConfig:{maxOutputTokens:700,temperature:0.4}})
                  },Math.min(9500,deadline-Date.now()-350));
                  if(!followup.ok)break;
                  activeParts=followup.body.candidates?.[0]?.content?.parts||[];
                  if(!activeParts.some(p=>p.functionCall)){
                    reply=activeParts.map(p=>p.text||"").join("").trim()||reply;break;
                  }
                }catch{break;}
              }
            }
            await query("INSERT INTO zuz_ai_messages(id,conversation_id,role,content) VALUES($1,$2,$3,$4)",[randomUUID(),id,"user",message]);
            await query("INSERT INTO zuz_ai_messages(id,conversation_id,role,content) VALUES($1,$2,$3,$4)",[randomUUID(),id,"model",reply]);
            await query("UPDATE zuz_ai_conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2",[id,user.id]);
            return res.json({reply,model,conversationId:id,actions:proposals});
          }
          last={status:502,body:{error:{message:"empty model response"}}};
          continue;
        }
        last=result;
        console.warn("Gemini model attempt failed",{model,status:result.status,providerCode:result.body?.error?.status});
        if([404,500,502,503,504].includes(result.status)){
          if([502,503,504].includes(result.status) && deadline-Date.now()>3000) await sleep(400);
          continue;
        }
        // 429 is a per-model rate or quota response; another model may have a different limit.
        if(result.status===429 && deadline-Date.now()>1800)continue;
        return res.status(502).json({error:errorMessage(result),providerStatus:result.status});
      }catch(error){
        console.warn("Gemini model attempt timed out",{model,error:error?.name});
        last={status:503,body:{}};
      }
    }
    return res.status(502).json({
      error: last?.status===503
        ? "O Gemini está sobrecarregado no momento. Não foi possível obter uma resposta dos modelos disponíveis; tente novamente."
        :errorMessage(last,last?.status===404),
      providerStatus:last?.status,
      retryable:[429,500,502,503,504].includes(last?.status)
    });
  }));
}
module.exports={registerGeminiTestRoute};
