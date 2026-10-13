(function(){
  "use strict";
  async function request(method,path,body){
    const response=await fetch("/api"+path,{
      method,credentials:"same-origin",
      headers:body===undefined?{}:{"Content-Type":"application/json"},
      body:body===undefined?undefined:JSON.stringify(body)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(data.error||"Não foi possível concluir a operação."),{status:response.status});
    return data;
  }
  window.ZUZAPI={request};
})();
