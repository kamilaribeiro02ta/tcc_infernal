"use strict";
const crypto=require("crypto");
const {query}=require("./database");
const types=new Set(["compromisso","encomenda","lembrete","observacao"]);
function registerCalendarRoutes(router,{asyncRoute,getCompany}){
 const companyFor=async req=>{const c=await getCompany(req.user.id);if(!c){const e=new Error("Configure sua empresa.");e.status=404;throw e;}return c;};
 const validate=body=>{
  const title=String(body.title||"").trim(),type=String(body.type||"lembrete"),date=String(body.date||""),time=String(body.time||"");
  if(!title||title.length>160||!types.has(type)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||new Date(date+"T12:00:00").toISOString().slice(0,10)!==date||time&&!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)){
   const e=new Error("Revise título, tipo, data e horário.");e.status=400;throw e;
  }
  const notes=String(body.notes||"").trim();if(notes.length>3000){const e=new Error("Observação muito longa.");e.status=400;throw e;}
  return {title,type,date,time,notes};
 };
 router.get("/company/calendar",asyncRoute(async(req,res)=>{
  const c=await companyFor(req);
  const start=String(req.query.start||""),end=String(req.query.end||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end){return res.status(400).json({error:"Informe um período válido."});}
  const [events,sales]=await Promise.all([
   query("SELECT id,title,type,event_date,event_time,notes,created_at FROM zuz_calendar_events WHERE company_id=$1 AND event_date >= $2 AND event_date <= $3 ORDER BY event_date,event_time",[c.id,start,end]),
   query("SELECT s.id,s.sold_at,s.product_id,s.quantity,s.unit_price,p.name AS product_name FROM zuz_sales s JOIN zuz_products p ON p.id=s.product_id AND p.company_id=s.company_id WHERE s.company_id=$1 AND s.sold_at >= $2 AND s.sold_at <= $3 ORDER BY s.sold_at DESC",[c.id,start,end])
  ]);
  res.setHeader("Cache-Control","private, no-store");res.json({events:events.rows,sales:sales.rows});
 }));
 router.post("/company/calendar",asyncRoute(async(req,res)=>{
  const c=await companyFor(req),v=validate(req.body||{}),id=crypto.randomUUID();
  await query("INSERT INTO zuz_calendar_events(id,company_id,title,type,event_date,event_time,notes) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,c.id,v.title,v.type,v.date,v.time||null,v.notes]);
  res.status(201).json({ok:true,id});
 }));
 router.put("/company/calendar/:id",asyncRoute(async(req,res)=>{
  const c=await companyFor(req),v=validate(req.body||{});
  const r=await query("UPDATE zuz_calendar_events SET title=$3,type=$4,event_date=$5,event_time=$6,notes=$7,updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND company_id=$2 RETURNING id",[String(req.params.id),c.id,v.title,v.type,v.date,v.time||null,v.notes]);
  if(!r.rows.length)return res.status(404).json({error:"Evento não encontrado."});res.json({ok:true});
 }));
 router.delete("/company/calendar/:id",asyncRoute(async(req,res)=>{
  const c=await companyFor(req);
  const r=await query("DELETE FROM zuz_calendar_events WHERE id=$1 AND company_id=$2 RETURNING id",[String(req.params.id),c.id]);
  if(!r.rows.length)return res.status(404).json({error:"Evento não encontrado."});res.json({ok:true});
 }));
}
module.exports={registerCalendarRoutes};
