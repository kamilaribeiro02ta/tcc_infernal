(function(){
  "use strict";
  async function request(method,path,body){
    let response;
    try {
      response=await fetch("/api"+path,{
        method,
        credentials:"same-origin",
        headers:body===undefined?{}:{"Content-Type":"application/json"},
        body:body===undefined?undefined:JSON.stringify(body)
      });
    } catch {
      throw new Error("Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.");
    }
    const type=response.headers.get("content-type")||"";
    const data=type.includes("application/json")?await response.json().catch(()=>({})):{};
    if(!response.ok){
      let message=data.error;
      if(!message){
        if(response.status===404)message="Serviço indisponível. Verifique a publicação da API.";
        else if(response.status===503)message="O banco de dados não está configurado ou está indisponível.";
        else if(response.status>=500)message="Erro no servidor. Tente novamente ou verifique os logs.";
        else message="Não foi possível concluir a operação (HTTP "+response.status+").";
      }
      throw Object.assign(new Error(message),{status:response.status});
    }
    if(!type.includes("application/json")){
      throw new Error("O servidor não retornou uma resposta válida da API.");
    }
    return data;
  }
  window.ZUZAPI={request};
})();
