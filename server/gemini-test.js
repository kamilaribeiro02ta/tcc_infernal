"use strict";
function registerGeminiTestRoute(router, asyncRoute, getUser) {
  router.post("/ai/test", asyncRoute(async (req,res)=>{
    res.setHeader("Cache-Control","no-store");
    const user=await getUser(req);
    if(!user)return res.status(401).json({error:"Faça login na ZUZ para usar o Teste IA."});
    const key=process.env.GEMINI_API_KEY;
    if(!key)return res.status(503).json({error:"Gemini não configurado. Defina GEMINI_API_KEY nas variáveis de ambiente do backend."});
    const message=String(req.body?.message||"").trim();
    if(!message||message.length>3000)return res.status(400).json({error:"Envie uma mensagem de até 3000 caracteres."});
    const history=Array.isArray(req.body?.history)?req.body.history.slice(-20):[];
    const contents=history.filter(m=>["user","model"].includes(m?.role)&&typeof m.text==="string").map(m=>({role:m.role,parts:[{text:m.text.slice(0,3000)}]}));
    contents.push({role:"user",parts:[{text:message}]});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    let upstream;
    try{upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},signal:controller.signal,body:JSON.stringify({systemInstruction:{parts:[{text:"Você é o assistente de teste da ZUZ, um sistema brasileiro de precificação para pequenos negócios. Responda em português brasileiro, com linguagem simples e objetiva. Ajude a identificar custos, despesas, margem e preço sugerido, explicando hipóteses e cálculos. Peça dados ausentes antes de calcular. Não invente preços reais de mercado, dados do usuário ou alíquotas tributárias. Você NÃO está conectado aos produtos, nem tem permissão para modificar qualquer registro."}]},contents,generationConfig:{maxOutputTokens:900,temperature:0.4}})});}catch(e){return res.status(502).json({error:"Não foi possível conectar ao Gemini. Tente novamente."});}finally{clearTimeout(timer);}
    const json=await upstream.json().catch(()=>({}));
    if(!upstream.ok){
      const providerCode=String(json?.error?.status||"").slice(0,60);
      const providerMessage=String(json?.error?.message||"");
      const invalidKey=/API_KEY_INVALID|API key not valid|invalid API key/i.test(providerMessage);
      const quota=/quota|resource.exhausted|rate limit/i.test(providerMessage) || upstream.status===429;
      const geography=/location|region|country|not supported in your/i.test(providerMessage);
      const model=/model|not found|not supported for generateContent/i.test(providerMessage) && upstream.status===404;
      console.error("Gemini test request rejected:",{status:upstream.status,code:providerCode,invalidKey,quota,geography,model});
      const error=invalidKey?"A chave GEMINI_API_KEY é inválida. Gere uma nova chave no Google AI Studio e atualize a variável na Vercel.":
        quota?"O Gemini recusou a consulta por limite de uso ou cota. Confira o plano e os limites da API no Google AI Studio.":
        model?"O modelo gemini-2.5-flash não está disponível para esta chave. Verifique os modelos liberados no Google AI Studio.":
        geography?"O Gemini não está disponível para a região associada à requisição ou à chave.":
        upstream.status===403?"O Google recusou o acesso à API Gemini (403). Verifique as permissões e restrições da chave no Google AI Studio.":
        upstream.status===400?"O Google rejeitou a requisição Gemini (400). Verifique a validade da chave e a configuração do modelo.":
        upstream.status===401?"A autenticação com o Gemini falhou (401). Verifique a chave no Google AI Studio.":
        `O Gemini retornou HTTP ${upstream.status}. Verifique a configuração e tente novamente.`;
      return res.status(502).json({error,providerStatus:upstream.status,providerCode});
    }
    const reply=(json.candidates?.[0]?.content?.parts||[]).map(p=>p.text||"").join("").trim();
    if(!reply)return res.status(502).json({error:"O Gemini não retornou uma resposta de texto."});
    res.json({reply});
  }));
}
module.exports={registerGeminiTestRoute};
