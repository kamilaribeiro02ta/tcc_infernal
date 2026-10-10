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
    '01': {
      title:'Custos organizados',
      eyebrow:'Base financeira',
      description:'O sistema reúne os valores que compõem o produto para criar uma base de cálculo mais clara.',
      details: `
        <section class="design-folder-section">
          <h3>O que é a base financeira?</h3>
          <p>A base financeira reúne e organiza as informações necessárias para determinar quanto custa produzir e comercializar um produto. Na ZUZ, ela sustenta os cálculos de custo e a análise de preços, ajudando o pequeno empreendedor a tomar decisões com dados do próprio negócio.</p>
        </section>
        <section class="design-folder-section">
          <h3>Quais gastos são considerados?</h3>
          <p>O cadastro pode contemplar matéria-prima, embalagens, mão de obra, despesas operacionais, taxas, tributos e outros gastos associados à produção e à venda. A distinção entre custos diretos, indiretos, fixos e variáveis auxilia na identificação e na atribuição correta dos valores a cada produto.</p>
        </section>
        <section class="design-folder-section">
          <h3>Custos financeiros e base financeira</h3>
          <p>Custos financeiros são gastos relacionados às operações de financiamento, como juros e encargos bancários. Já a base financeira é mais ampla: organiza os diferentes custos e despesas utilizados como referência para a precificação. Nem todo gasto financeiro deve ser atribuído diretamente a uma unidade vendida.</p>
        </section>
        <section class="design-folder-section">
          <h3>Como a ZUZ utiliza esses dados?</h3>
          <p>Ao registrar os gastos e a quantidade estimada de unidades, o usuário fornece os dados para apurar o custo por unidade e analisar cenários de preço. O sistema pode apresentar o custo calculado e apoiar uma sugestão de preço de venda, considerando as informações disponíveis e as premissas adotadas.</p>
        </section>
        <section class="design-folder-section">
          <h3>Por que essa etapa é importante?</h3>
          <p>Um preço definido apenas pela comparação com concorrentes ou pela intuição pode ignorar despesas relevantes. Organizar os custos favorece a compreensão da margem de contribuição e dos resultados, mas a definição do preço também exige considerar mercado, demanda, tributos e valor percebido.</p>
        </section>
        <p class="design-folder-source-note">Fundamentação: conceitos de formação de preços, classificação de custos e despesas discutidos nos materiais acadêmicos do TCC da ZUZ. A aplicação descrita representa a proposta funcional do projeto, não um resultado já comprovado por testes.</p>
      `
    },
    '02': { title:'Decisão visual', eyebrow:'Leitura de dados', description:'Gráficos e indicadores ajudam o usuário a enxergar custo, margem e resultado sem depender de planilhas complexas.' },
    '03': { title:'Agente de IA', eyebrow:'Assistente inteligente', description:'A interface conversa com o usuário, coleta informações e auxilia no processo de precificação.' }
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 180 : 680;
  const midpoint = .36;
  const easeOut = 'cubic-bezier(.33,0,.2,1)';
  const easeInOut = 'cubic-bezier(.55,0,.2,1)';
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
      {transform:tf(g.x0,g.y0,g.s),offset:0,easing:easeOut},
      {transform:tf(g.x0,g.ym,g.s),offset:midpoint,easing:easeInOut},
      {transform:tf(g.xf,g.yf,1),offset:1}],o);
    const a2=paper.animate([
      {clipPath:clip(g.inset(g.y0)),offset:0,easing:easeOut},
      {clipPath:clip(g.inset(g.ym)),offset:midpoint,easing:easeInOut},
      {clipPath:clip(0),offset:1}],o);
    const a3=content.animate([{opacity:0,offset:0},{opacity:0,offset:.34},{opacity:1,offset:.75},{opacity:1,offset:1}],o);
    const a4=veil.animate([{opacity:0,offset:0},{opacity:0,offset:midpoint*.7},{opacity:1,offset:1}],o);
    animations=[a1,a2,a3,a4];
    animations.forEach(a=>{a.pause();a.currentTime=open?duration:0;});
    a1.onfinish=()=>{if(open){closeBtn.focus({preventScroll:true});}else{doc.scrollTop=0;sheet.style.visibility='hidden';sheet.inert=true;veil.inert=true;sheet.setAttribute('aria-hidden','true');active?.focus({preventScroll:true});active=null;}};
    sheet.style.visibility='visible';
  }
  function setOpen(next) {
    if(next===open||!animations.length)return;
    open=next;
    if(active){active.setAttribute('aria-expanded',String(next));active.inert=next;}
    // Keep the dialog painted until the reverse animation actually reaches its start.
    if(next){sheet.inert=false;veil.inert=false;sheet.setAttribute('aria-hidden','false');}
    sheet.classList.toggle('on',next);veil.classList.toggle('on',next);
    animations.forEach(a=>{a.playbackRate=next?1:-1;a.play();});
  }
  folders.forEach(folder=>folder.addEventListener('click',()=>{
    if(open || active)return;
    active=folder;
    const item=data[folder.dataset.folder]; if(!item)return;
    title.textContent=item.title;eyebrow.textContent=item.eyebrow;description.innerHTML=item.details || '';if(!item.details) description.textContent=item.description;
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