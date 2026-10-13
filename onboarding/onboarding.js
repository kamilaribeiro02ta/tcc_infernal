document.addEventListener("DOMContentLoaded",async()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const templates=window.ZUZBusinessTemplates;
  const fieldIds=["companyName","segment","otherSegment","operation","costingMode"];
  let user,step=1,selected=new Set(),lastTemplate="";
  const draftKey=()=> "zuz-onboard-draft:"+user.id;
  function saveDraft(){
    if(!user)return;
    const draft={step,categories:[...selected]};
    fieldIds.forEach(id=>draft[id]=$(id).value);
    localStorage.setItem(draftKey(),JSON.stringify(draft));
  }
  function suggestions(){
    const op=$("operation").value,seg=$("segment").value;
    return [...new Set([...(templates.operations[op]?.categories||[]),...(templates.segments[seg]||[])])];
  }
  function buildCategories(){
    const templateKey=$("operation").value+"|"+$("segment").value;
    if(lastTemplate!==templateKey&&!selected.size)selected=new Set(suggestions());
    lastTemplate=templateKey;
    const root=$("categoryList");root.replaceChildren();
    for(const name of [...new Set([...suggestions(),...selected])]){
      const label=document.createElement("label");
      const check=document.createElement("input");check.type="checkbox";check.checked=selected.has(name);
      check.addEventListener("change",()=>{check.checked?selected.add(name):selected.delete(name);saveDraft();});
      const text=document.createElement("span");text.textContent=name;
      label.append(check,text);root.append(label);
    }
  }
  function render(){
    for(let i=1;i<=3;i++)$("step"+i).hidden=i!==step;
    $("stepLabel").textContent="Etapa "+step+" de 3";
    $("progress").setAttribute("aria-valuenow",String(step));
    $("progressFill").style.width=step*100/3+"%";
    $("previous").hidden=step===1;$("next").hidden=step===3;$("save").hidden=step!==3;
    $("title").textContent=["","Vamos conhecer sua empresa","Como sua empresa trabalha?","Personalize os custos"][step];
    $("description").textContent=step===3?"Você poderá alterar essas categorias no futuro.":"A ZUZ se adapta ao modo como você trabalha.";
    $("otherSegmentWrap").hidden=$("segment").value!=="outros";
    if(step===3)buildCategories();
    saveDraft();
  }
  try{
    const me=await ZUZAPI.request("GET","/me");user=me.user;
    if(me.company){
      $("companyName").value=me.company.name;
      $("segment").value=Object.hasOwn(templates.segments,me.company.segment)?me.company.segment:"outros";
      $("otherSegment").value=$("segment").value==="outros"?me.company.segment:"";
      $("operation").value=me.company.operation_type;
      $("costingMode").value=me.company.costing_mode;
      const detail=await ZUZAPI.request("GET","/company");
      selected=new Set(detail.categories.map(item=>item.label));
    }else{
      let draft={};
      try{draft=JSON.parse(localStorage.getItem(draftKey())||"{}");}catch{}
      fieldIds.forEach(id=>{if(draft[id]!==undefined)$(id).value=draft[id];});
      selected=new Set(draft.categories||[]);
      step=Math.max(1,Math.min(3,Number(draft.step)||1));
    }
    if(!selected.size)selected=new Set(suggestions());
    render();
  }catch{window.location.replace("../Login/login.html");return;}
  $("segment").addEventListener("change",()=>{selected=new Set(suggestions());render();});
  $("operation").addEventListener("change",()=>{
    $("costingMode").value=templates.operations[$("operation").value].costingMode;
    selected=new Set(suggestions());render();
  });
  fieldIds.forEach(id=>$(id).addEventListener("input",saveDraft));
  $("addCategory").addEventListener("click",()=>{
    const name=$("customCategory").value.trim();
    if(name){selected.add(name);$("customCategory").value="";buildCategories();saveDraft();}
  });
  $("previous").addEventListener("click",()=>{step=Math.max(1,step-1);render();});
  $("next").addEventListener("click",()=>{
    if(step===1&&!$("companyName").value.trim()){$("error").textContent="Informe o nome da empresa.";return;}
    if(step===1&&$("segment").value==="outros"&&!$("otherSegment").value.trim()){$("error").textContent="Informe o segmento.";return;}
    $("error").textContent="";step=Math.min(3,step+1);render();
  });
  $("form").addEventListener("submit",async event=>{
    event.preventDefault();$("error").textContent="";
    const name=$("companyName").value.trim(),segment=$("segment").value==="outros"?$("otherSegment").value.trim():$("segment").value;
    if(!name||!segment){$("error").textContent="Preencha nome e segmento.";return;}
    $("save").disabled=true;
    try{
      await ZUZAPI.request("PUT","/company",{name,segment,operationType:$("operation").value,costingMode:$("costingMode").value,categories:[...selected]});
      localStorage.removeItem(draftKey());
      window.location.replace("../custos/custos.html");
    }catch(e){$("error").textContent=e.message;$("save").disabled=false;}
  });
});
