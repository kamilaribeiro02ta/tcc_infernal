(() => {
  'use strict';
  const folders = [...document.querySelectorAll('.design-folder')];
  const sheet = document.getElementById('designFolderSheet');
  const paper = document.getElementById('designFolderPaper');
  const content = document.getElementById('designFolderContent');
  const veil = document.getElementById('designFolderVeil');
  const closeBtn = document.getElementById('designFolderClose');
  const doc = document.getElementById('designFolderDoc');
  const title = document.getElementById('designFolderDocTitle');
  const eyebrow = document.getElementById('designFolderEyebrow');
  const description = document.getElementById('designFolderDocDescription');
  if (!folders.length || !sheet || !paper || !content || !veil || !closeBtn || !doc) return;

  const data = {
    '01': { title:'Custos organizados', eyebrow:'Base financeira', description:'O sistema reúne os valores que compõem o produto para criar uma base de cálculo mais clara.' },
    '02': { title:'Decisão visual', eyebrow:'Leitura de dados', description:'Gráficos e indicadores ajudam o usuário a enxergar custo, margem e resultado sem depender de planilhas complexas.' },
    '03': { title:'Agente de IA', eyebrow:'Assistente inteligente', description:'A interface conversa com o usuário, coleta informações e auxilia no processo de precificação.' }
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 220 : 950;
  const midpoint = .44;
  const easeOut = 'cubic-bezier(.33,0,.2,1)';
  const easeInOut = 'cubic-bezier(.55,0,.2,1)';
  const shadowOff = 'drop-shadow(0 0 0 rgba(28,16,80,0)) drop-shadow(0 0 0 rgba(28,16,80,0))';
  const shadowOn = 'drop-shadow(0 30px 50px rgba(28,16,80,.30)) drop-shadow(0 6px 14px rgba(28,16,80,.14))';
  let active = null, animations = [], open = false;
  function geometry(folder) {
    const vw=window.innerWidth, vh=window.innerHeight;
    const W=Math.min(640,vw-32), H=Math.min(vh-32,800);
    const fr=folder.getBoundingClientRect();
    const s=(fr.width*204/244)/W;
    const x0=fr.left+fr.width*20/244;
    const y0=fr.top+fr.height*56/245;
    const clipY=fr.top+fr.height*82/245;
    const ym=Math.max(clipY-fr.height*.58,16);
    return {W,H,s,x0,y0,ym,xf:(vw-W)/2,yf:(vh-H)/2,inset:y=>Math.max(0,H-(clipY-y)/s)};
  }
  const tf=(x,y,s)=>'translate('+x+'px, '+y+'px) scale('+s+')';
  const clip=b=>'inset(0px 0px '+b+'px 0px)';
  function build() {
    if (!active) return;
    const g=geometry(active);
    animations.forEach(a=>a.cancel());
    sheet.style.width=g.W+'px'; sheet.style.height=g.H+'px';
    const o={duration,fill:'both'};
    const a1=sheet.animate([
      {transform:tf(g.x0,g.y0,g.s),filter:shadowOff,offset:0,easing:easeOut},
      {transform:tf(g.x0,g.ym,g.s),filter:shadowOff,offset:midpoint,easing:easeInOut},
      {transform:tf(g.xf,g.yf,1),filter:shadowOn,offset:1}],o);
    const a2=paper.animate([
      {clipPath:clip(g.inset(g.y0)),offset:0,easing:easeOut},
      {clipPath:clip(g.inset(g.ym)),offset:midpoint,easing:easeInOut},
      {clipPath:clip(0),offset:1}],o);
    const a3=content.animate([{opacity:0,offset:0},{opacity:0,offset:.06},{opacity:1,offset:.56},{opacity:1,offset:1}],o);
    const a4=veil.animate([{opacity:0,offset:0},{opacity:0,offset:midpoint*.7},{opacity:1,offset:1}],o);
    animations=[a1,a2,a3,a4];
    animations.forEach(a=>{a.pause();a.currentTime=open?duration:0;});
    a1.onfinish=()=>{if(open) closeBtn.focus({preventScroll:true});else {doc.scrollTop=0;active?.focus({preventScroll:true});active=null;sheet.style.visibility='hidden';}};
    sheet.style.visibility='visible';
  }
  function setOpen(next) {
    if(next===open||!animations.length)return;
    open=next;
    if(active){active.setAttribute('aria-expanded',String(next));active.inert=next;}
    sheet.inert=!next; veil.inert=!next;
    sheet.setAttribute('aria-hidden',String(!next));
    sheet.classList.toggle('on',next);veil.classList.toggle('on',next);
    animations.forEach(a=>{a.playbackRate=next?1:-1;a.play();});
  }
  folders.forEach(folder=>folder.addEventListener('click',()=>{
    if(open)return;
    active=folder;
    const item=data[folder.dataset.folder]; if(!item)return;
    title.textContent=item.title;eyebrow.textContent=item.eyebrow;description.textContent=item.description;
    build();setOpen(true);
  }));
  closeBtn.addEventListener('click',()=>setOpen(false));
  veil.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&open)setOpen(false);
    if(event.key==='Tab'&&open){
      const focusable=[closeBtn,doc];
      const index=focusable.indexOf(document.activeElement);
      if(event.shiftKey&&index<=0){event.preventDefault();doc.focus();}
      else if(!event.shiftKey&&index===1){event.preventDefault();closeBtn.focus();}
    }
  });
  let raf=0;
  const schedule=()=>{if(!active)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(build);};
  window.addEventListener('resize',schedule);
  if('ResizeObserver'in window)folders.forEach(folder=>new ResizeObserver(schedule).observe(folder));
})();