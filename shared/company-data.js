(function(){
  "use strict";
  async function load(){
    const data=await window.ZUZAPI.request("GET","/company");
    if(data.company){
      const settings={...(data.company.settings||{}),segment:data.company.segment,operationType:data.company.operation_type};
      localStorage.setItem("zuz-business-settings-v1",JSON.stringify(settings));
    }
    return data;
  }
  let pending=Promise.resolve();
  function saveProducts(products){
    const snapshot=structuredClone(products);
    pending=pending.catch(()=>{}).then(()=>window.ZUZAPI.request("PUT","/company/products",{products:snapshot}));
    return pending;
  }
  window.ZUZCompanyData={load,saveProducts};
})();
