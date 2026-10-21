(function(){
"use strict";
const section=document.getElementById("companyPlannerSection"),grid=document.getElementById("plannerCalendarGrid");
if(!section||!grid||!window.ZUZAPI)return;
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const api=(method,path,body)=>window.ZUZAPI.request(method,path,body);
let events=[],sales=[],month="",loading=false,editing="";
const panel=document.createElement("section");panel.className="zuz-calendar-extra";panel.innerHTML='<div class="zuz-calendar-extra-head"><div><h3>Vendas e anotações</h3><p>Selecione um dia para consultar vendas ou organizar o negócio.</p></div><button type="button" id="zuzCalNew">+ Nova anotação</button></div><p id="zuzCalStatus" role="status" aria-live="polite"></p><div id="zuzCalDetails"></div><form id="zuzCalForm" hidden><h4 id="zuzCalFormTitle">Nova anotação</h4><div class="zuz-cal-fields"><label>Título<input name="title" required maxlength="160"></label><label>Tipo<select name="type"><option value="compromisso">Compromisso</option><option value="encomenda">Encomenda</option><option value="lembrete">Lembrete</option><option value="observacao">Observação</option></select></label><label>Data<input name="date" type="date" required></label><label>Horário (opcional)<input name="time" type="time"></label><label class="zuz-cal-wide">Detalhes<textarea name="notes" rows="3" maxlength="3000"></textarea></label></div><div class="zuz-cal-actions"><button type="submit">Salvar</button><button type="button" id="zuzCalCancel">Cancelar</button></div></form>';
grid.parentElement.after(panel);
const status=panel.querySelector("#zuzCalStatus"),details=panel.querySelector("#zuzCalDetails"),form=panel.querySelector("form");
let selected=new Date().toLocaleDateString("en-CA");
function dayValue(value){return String(value||"").slice(0,10);}
function currentMonth(){const first=grid.querySelector("[data-planner-date]");return first?.dataset.plannerDate.slice(0,7)||"";}
function draw(){
 const list=events.filter(e=>dayValue(e.event_date)===selected),sold=sales.filter(s=>dayValue(s.sold_at)===selected);
 const qty=sold.reduce((a,s)=>a+Number(s.quantity),0),revenue=sold.reduce((a,s)=>a+Number(s.quantity)*Number(s.unit_price),0);
 details.innerHTML='<h4>'+escape(selected.split("-").reverse().join("/"))+'</h4><p><strong>'+qty+' unidade(s) vendida(s)</strong> · '+money(revenue)+' de faturamento</p>'+
 (sold.length?'<ul>'+sold.map(s=>'<li>'+escape(s.product_name)+' — '+escape(s.quantity)+' un. · '+money(Number(s.quantity)*Number(s.unit_price))+'</li>').join("")+'</ul>':'<p>Nenhuma venda registrada neste dia.</p>')+
 '<h4>Anotações</h4>'+(list.length?'<ul>'+list.map(e=>'<li><strong>'+escape(e.title)+'</strong> · '+escape(e.type)+(e.event_time?' · '+escape(e.event_time):'')+(e.notes?'<p>'+escape(e.notes)+'</p>':'')+' <button type="button" data-cal-edit="'+escape(e.id)+'">Editar</button> <button type="button" data-cal-delete="'+escape(e.id)+'">Excluir</button></li>').join("")+'</ul>':'<p>Nenhuma anotação neste dia.</p>');
 for(const node of grid.querySelectorAll("[data-planner-date]")){
  const date=node.dataset.plannerDate;node.querySelector(".zuz-cal-day-badge")?.remove();
  const count=events.filter(e=>dayValue(e.event_date)===date).length,daySales=sales.filter(s=>dayValue(s.sold_at)===date);
  if(!count&&!daySales.length)continue;
  const badge=document.createElement("span");badge.className="zuz-cal-day-badge";badge.textContent=(daySales.length?"Vendas: "+daySales.reduce((n,s)=>n+Number(s.quantity),0):"")+(count?(daySales.length?" · ":"")+count+" anotação(ões)":"");
  node.append(badge);
 }
}
async function load(){
 const m=currentMonth();if(!m||loading)return;
 month=m;loading=true;status.textContent="Consultando vendas e agenda…";
 try{
  const end=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();
  const data=await api("GET","/company/calendar?start="+m+"-01&end="+m+"-"+String(end).padStart(2,"0"));
  events=data.events||[];sales=data.sales||[];status.textContent="";draw();
 }catch(e){status.textContent=e.message||"Não foi possível consultar o calendário.";details.textContent="Os registros não foram alterados.";}
 finally{loading=false;}
}
function openForm(e){
 editing=e?.id||"";form.hidden=false;form.elements.title.value=e?.title||"";form.elements.type.value=e?.type||"lembrete";form.elements.date.value=dayValue(e?.event_date||selected);form.elements.time.value=e?.event_time||"";form.elements.notes.value=e?.notes||"";panel.querySelector("#zuzCalFormTitle").textContent=editing?"Editar anotação":"Nova anotação";form.elements.title.focus();
}
panel.querySelector("#zuzCalNew").addEventListener("click",()=>openForm());
panel.querySelector("#zuzCalCancel").addEventListener("click",()=>{form.hidden=true;editing="";});
form.addEventListener("submit",async ev=>{
 ev.preventDefault();const body={title:form.elements.title.value,type:form.elements.type.value,date:form.elements.date.value,time:form.elements.time.value,notes:form.elements.notes.value};
 const btn=form.querySelector('[type="submit"]');btn.disabled=true;status.textContent="Salvando…";
 try{await api(editing?"PUT":"POST","/company/calendar"+(editing?"/"+encodeURIComponent(editing):""),body);selected=body.date;form.hidden=true;editing="";status.textContent="Anotação salva.";await load();}
 catch(e){status.textContent=e.message||"Falha ao salvar.";}finally{btn.disabled=false;}
});
details.addEventListener("click",async ev=>{
 const edit=ev.target.closest("[data-cal-edit]"),del=ev.target.closest("[data-cal-delete]");
 if(edit){const e=events.find(x=>String(x.id)===edit.dataset.calEdit);if(e)openForm(e);return;}
 if(del&&confirm("Excluir esta anotação?")){try{await api("DELETE","/company/calendar/"+encodeURIComponent(del.dataset.calDelete));status.textContent="Anotação excluída.";await load();}catch(e){status.textContent=e.message||"Não foi possível excluir.";}}
});
grid.addEventListener("click",ev=>{const day=ev.target.closest("[data-planner-date]");if(day){selected=day.dataset.plannerDate;draw();}});
let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;const m=currentMonth();if(m&&m!==month)load();});});
observer.observe(grid,{childList:true});
window.addEventListener("zuz:sales:updated",()=>load());
window.addEventListener("zuz:calendar:refresh",()=>load());
load();
})();
