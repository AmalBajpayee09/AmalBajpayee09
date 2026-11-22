/* AMALVERSE — The Engineer's Quest (original canvas platformer)
   Six hand-authored stages, collision/physics, combat, checkpoints, persistence,
   touch controls, free recruiter dossiers. No external game framework required. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const W = 1100, H = 620, G = 1810, JUMP = -735, RUN = 330;
  const SAVE = 'amalverse-quest-v3';
  const WORLDS = [
    {name:'NEURAL FRONTIER',tone:'#b09cff',sky:['#10132d','#32416d','#695d98'],soil:'#3c4563',trim:'#9a89e9',hill:'#272858',accent:'#c6aaff'},
    {name:'DATA WILDS',tone:'#70f1c0',sky:['#063c42','#167968','#4baa9a'],soil:'#2c584c',trim:'#81d7ab',hill:'#13545c',accent:'#9cffde'},
    {name:'SYSTEMS SKYLINE',tone:'#ffc184',sky:['#1a284d','#6e3c52','#e28a65'],soil:'#524256',trim:'#e7a76e',hill:'#4f3657',accent:'#ffd79c'},
  ];
  const LEVELS = [
    {name:'SIGNAL GROVE',world:0,tag:'Where software learns to listen',project:'BharatVoice AI',title:'A VOICE THAT UNDERSTANDS.',description:'A multilingual voice AI platform for Hindi, English and Hinglish across browser and phone calls, combining Deepgram speech recognition, Groq LLMs, Piper text-to-speech, WebSockets and RAG-based knowledge retrieval.',stack:'Python · FastAPI · WebSockets · Deepgram · Groq · Piper · ChromaDB',trait:'REAL-TIME VOICE AI',sub:'The first key unlocks the voice pipeline.'},
    {name:'AGENT CITADEL',world:0,tag:'Make knowledge actionable',project:'AI Hiring Copilot',title:'AGENTS THAT REASON.',description:'An LLM- and RAG-powered recruitment platform for resume parsing, candidate/job matching, skill-gap analysis and interview question generation, using LangGraph workflows and FAISS semantic retrieval.',stack:'Python · LangGraph · RAG · FAISS · FastAPI · PostgreSQL · Redis',trait:'AGENTIC AI SYSTEMS',sub:'Follow retrieval signals through the citadel.'},
    {name:'MODEL MEADOW',world:1,tag:'Discover patterns in chaos',project:'ProspectIQ',title:'DECISIONS, EXPLAINED.',description:'Predictive prospect scoring with XGBoost, Random Forest and Logistic Regression, feature engineering, probability calibration, model evaluation and SHAP explainability alongside AI-assisted retrieval workflows.',stack:'Scikit-learn · XGBoost · SHAP · Python · MLflow · LangGraph',trait:'APPLIED MACHINE LEARNING',sub:'Collect experiments, then reach the model vault.'},
    {name:'DATA FOUNDRY',world:1,tag:'Transform raw data into decisions',project:'LedgerFlow',title:'DATA THAT HOLDS UP.',description:'A full-stack enterprise finance operations platform with FastAPI and React, RBAC, audit trails and SharePoint workflows; Databricks/PySpark pipelines handle financial data validation and reconciliation.',stack:'Python · FastAPI · React · SQL · Databricks · PySpark · SharePoint',trait:'DATA & ENTERPRISE ENGINEERING',sub:'Navigate the foundry of trustworthy data.'},
    {name:'TRANSACTION TOWER',world:2,tag:'Design for failure, not just success',project:'TransactX',title:'RELIABILITY BY DESIGN.',description:'Event-driven Java/Spring Boot services for financial transaction workflows, exploring Kafka messaging, transactional outbox, idempotency, distributed locking, circuit breakers and observability.',stack:'Java · Spring Boot · Kafka · PostgreSQL · Redis · Docker · Grafana',trait:'DISTRIBUTED SYSTEMS',sub:'Every signal needs a safe delivery path.'},
    {name:'INCIDENT SKYLINE',world:2,tag:'Restore systems under pressure',project:'CloudOps AI',title:'INTELLIGENCE UNDER PRESSURE.',description:'A real-time incident management platform built with React and Node.js, JWT/RBAC, Redis, Socket.IO, service dashboards and an LLM investigation assistant that proposes remediation subject to human approval.',stack:'React · Node.js · Express · Redis · Socket.IO · Docker · LLM APIs',trait:'FULL-STACK & INCIDENT AI',sub:'The final sentinel guards your last dossier.'},
  ];
  const worldAt = (n) => WORLDS[LEVELS[n].world];
  let saved;
  try { saved = JSON.parse(localStorage.getItem(SAVE) || '{}'); } catch { saved = {}; }
  const progress = {unlocked: Math.max(0,Math.min(5,Number(saved.unlocked)||0)),completed: new Set(Array.isArray(saved.completed)?saved.completed:[]),best: Math.max(0,Number(saved.best)||0)};
  const persist = () => {try{localStorage.setItem(SAVE,JSON.stringify({unlocked:progress.unlocked,completed:[...progress.completed],best:progress.best}));}catch{}};
  const cvs = $('gameCanvas'), ctx = cvs.getContext('2d');
  const press = {left:false,right:false};
  let game = null, lastTime = 0, toastUntil = 0, toastMessage = '', sound = false, audio = null;
  const rnd = (a,b) => a + Math.random()*(b-a);
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rectHit = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  function beep(freq=600,duration=.08,type='sine') {
    if(!sound)return;
    try {audio=audio||new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+duration);v.gain.setValueAtTime(.11,audio.currentTime);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
  }
  function announce(msg,seconds=2.1){toastMessage=msg;toastUntil=performance.now()+seconds*1000;$('gameToast').textContent=msg;$('gameToast').classList.add('show');}
  function makeStage(n){
    // Every stage has its own ground-gap rhythm, rather than a reskinned map.
    const terrain=[
      [[-200,930],[815,570],[1505,565],[2180,960]],
      [[-200,845],[760,490],[1360,650],[2130,1010]],
      [[-200,760],[675,470],[1270,630],[2030,1110]],
      [[-200,910],[825,565],[1515,585],[2215,925]],
      [[-200,800],[700,560],[1395,590],[2110,1030]],
      [[-200,895],[825,595],[1550,630],[2285,855]],
    ][n];
    const ground=terrain.map(([x,w])=>({x,w,y:510,ground:true}));
    const decks=[{x:320,w:165,y:390},{x:965,w:170,y:370},{x:1240,w:158,y:383},{x:1730,w:145,y:386},{x:2042,w:135,y:397},{x:2430,w:148,y:395}].map((p,i)=>({...p,x:p.x+(n%3-1)*(i===0||i===2?10:24),y:p.y-((n+i)%3)*5,ground:false,move:n>0&&(i===1||i===3),base:p.y-((n+i)%3)*5}));
    const platforms=[...ground,...decks];
    const monsters=ground.map((g,i)=>{const x=g.x+Math.min(g.w-105,Math.max(165,g.w*(.65+.08*(i%2))));return{x,min:g.x+100,max:g.x+g.w-62,y:467,w:38,h:43,start:x,dir:i%2?-1:1,speed:60+n*12,dead:false,hp:1};}).slice(0,Math.min(4,2+Math.floor(n/2)));
    if(n===5)monsters.push({x:2780,start:2780,min:2720,max:2910,y:425,w:74,h:85,dir:-1,speed:54,dead:false,hp:3,boss:true});
    return {
      id:n,player:{x:73,y:450,w:33,h:51,vx:0,vy:0,grounded:false,inv:0,face:1,run:0,coyote:0,jumpBuffer:0},
      platforms,monsters,bullets:[],particles:[],spikes:ground.map((g,i)=>({x:g.x+g.w-(i===0?140:190),y:487,w:54,h:23})).slice(0,2+Math.floor(n/2)),
      gems:[{x:355,y:330},{x:1305,y:335},{x:2325,y:435}],found:new Set(),stars:0,hearts:3,score:0,checkpoint:75,checkpointReached:false,exit:{x:2980,y:418,w:58,h:92},camera:0,
      enemiesDefeated:0,shots:0,t:0,mode:'playing',shotsAt:0,tutorial:n===0,hitFlash:0,finishRequested:false,
    };
  }
  function setScreen(playing){$('landing').hidden=playing;$('gameSection').hidden=!playing;if(playing)$('gameSection').scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'});}
  function begin(n=0){n=clamp(n,0,5);if(n>progress.unlocked){announce('LEVEL LOCKED');return;}closeModal();game=makeStage(n);updateHUD();setScreen(true);cvs.focus({preventScroll:true});announce(`${String(n+1).padStart(2,'0')} / ${LEVELS[n].name} — FIND THREE CRYSTALS`,3);beep(620,.16);}
  function updateHUD(){if(!game)return;const i=game.id;$('hudWorld').textContent=`WORLD ${String(LEVELS[i].world+1).padStart(2,'0')} · ${worldAt(i).name}`;$('hudLevel').textContent=`${String(i+1).padStart(2,'0')} / ${LEVELS[i].name}`;$('hudGems').textContent=`${game.found.size}/3`;$('hudLives').textContent='♥ '.repeat(game.hearts);$('hudScore').textContent=String(game.score).padStart(4,'0');$('checkpointStatus').textContent=game.checkpointReached?'CHECKPOINT: ACTIVATED':'CHECKPOINT: START';}
  function jump(){if(!game||game.mode!=='playing')return;const p=game.player;if(p.grounded||p.coyote>0){p.vy=JUMP;p.grounded=false;p.coyote=0;p.jumpBuffer=0;beep(420,.11,'triangle');}else p.jumpBuffer=.12;}
  function shoot(){if(!game||game.mode!=='playing')return;const p=game.player;if(game.t<game.shotsAt)return;game.shotsAt=game.t+.34;game.bullets.push({x:p.x+p.w/2+p.face*20,y:p.y+23,v:p.face*710,w:19,h:10,ttl:.8});game.shots++;beep(850,.075,'sawtooth');}
  function hurt(){if(!game||game.mode!=='playing'||game.player.inv>0)return;game.hearts--;game.player.inv=1.3;game.hitFlash=.4;beep(180,.2,'square');if(game.hearts<=0){game.hearts=3;game.player.x=game.checkpoint;game.player.y=400;game.player.vy=0;game.player.vx=0;announce('RESPAWNED AT CHECKPOINT — KEEP GOING',2.6);}else{game.player.vy=-360;game.player.x=Math.max(5,game.player.x-30*game.player.face);announce('HIT! KEEP MOVING',1.2);}updateHUD();}
  function interact(){if(!game||game.mode!=='playing')return;const near=Math.abs(game.player.x-game.exit.x)<90;if(!near){announce('REACH THE GLOWING EXIT GATE',1.4);return;}if(game.found.size!==3){announce(`COLLECT ${3-game.found.size} MORE CRYSTAL${3-game.found.size===1?'':'S'} TO OPEN THE GATE`,2);return;}if(game.id===5&&game.monsters.some(m=>m.boss&&!m.dead)){announce('DEFEAT THE FINAL SENTINEL FIRST',2);return;}win();}
  function win(){if(game.finishRequested)return;game.finishRequested=true;const index=game.id,stage=LEVELS[index];game.mode='completed';progress.completed.add(index);progress.unlocked=Math.max(progress.unlocked,Math.min(5,index+1));progress.best=Math.max(progress.best,index+1);persist();paintCards();updateHUD();beep(880,.2);setTimeout(()=>beep(1170,.22),150);
    const more=index<5?`<button class="action" data-action="next" data-level="${index+1}">▶ NEXT LEVEL ${String(index+2).padStart(2,'0')}</button>`:`<button class="action" data-action="ending">★ VIEW FINAL ENDING</button>`;
    showModal(`<span class="small">DOSSIER ${String(index+1).padStart(2,'0')} / 06 · UNLOCKED</span><h2>${stage.title}</h2><div class="small">${stage.project} · ${stage.trait}</div><p>${stage.description}</p><p class="modal-stack">${stage.stack}</p><div class="modal-progress"><span>✦ 3/3 CRYSTALS</span><span>★ ${game.score} POINTS</span><span>✓ PROJECT REVEALED</span></div><div class="modal-actions">${more}<button class="action secondary" data-action="replay">↺ REPLAY LEVEL</button><button class="action secondary" data-action="archive">PROJECT ARCHIVE ↗</button></div>`);
  }
  function showModal(html){$('modalContent').innerHTML=html;$('modalRoot').hidden=false;$('modalClose').focus();}
  function closeModal(){ $('modalRoot').hidden=true;}
  function showPause(){if(!game)return;if(game.mode==='paused'){game.mode='playing';closeModal();return;}if(game.mode!=='playing')return;game.mode='paused';showModal(`<span class="small">ADVENTURE PAUSED</span><h2>TAKE A BREATHER.</h2><p>Your checkpoint and project unlocks are safe. Keep exploring when you're ready.</p><div class="modal-actions"><button class="action" data-action="resume">▶ RESUME</button><button class="action secondary" data-action="restart">↺ RESTART</button><button class="action secondary" data-action="map">LEVEL SELECT</button></div>`);}
  function showMap(){if(game&&game.mode==='playing')game.mode='paused';showModal(`<span class="small">SIX STAGES · THREE WORLDS</span><h2>CHOOSE YOUR PATH.</h2><p>Complete levels in sequence to unlock new worlds and reveal project dossiers.</p><div class="modal-progress">${LEVELS.map((l,i)=>`<span>${i<=progress.unlocked?progress.completed.has(i)?'✓':'▶':'🔒'} ${String(i+1).padStart(2,'0')} ${l.name}</span>`).join('')}</div><div class="modal-actions"><button class="action" data-action="resume">CLOSE MAP</button><button class="action secondary" data-action="archive">PROJECT ARCHIVE</button></div>`);}
  function showDossier(i){const l=LEVELS[i];showModal(`<span class="small">PROJECT BRIEFING / ${String(i+1).padStart(2,'0')} · ${l.trait}</span><h2>${l.project}</h2><p>${l.description}</p><p class="modal-stack">${l.stack}</p><div class="modal-progress"><span>${progress.completed.has(i)?'✓ DISCOVERED IN GAME':'AVAILABLE TO RECRUITERS'}</span><span>WORLD ${l.world+1}</span></div><div class="modal-actions"><button class="action" data-action="start" data-level="${Math.min(i,progress.unlocked)}">▶ ${i<=progress.unlocked?'PLAY THIS LEVEL':'PLAY CURRENT LEVEL'}</button><button class="action secondary" data-action="close">CLOSE</button></div>`);}
  function ending(){showModal(`<span class="small">QUEST COMPLETE · ALL SIX DOSSIERS FOUND</span><h2>THE REAL QUEST IS JUST BEGINNING.</h2><p>Beyond these projects, I contributed to the TIIC-funded NirmalGwalior Smart City initiative, worked on computer vision and data analytics, and continue learning across software systems and intelligent engineering.</p><p>I'm <strong>Amal Bajpayee</strong> — an Integrated B.Tech. + M.Tech. IT student at ABV-IIITM Gwalior. Let's build something useful.</p><div class="modal-actions"><a class="action primary-btn" href="https://github.com/AmalBajpayee09" target="_blank" rel="noopener">VIEW CODE ↗</a><a class="action primary-btn" href="https://www.linkedin.com/in/abajpai09/" target="_blank" rel="noopener">CONNECT ↗</a><button class="action secondary" data-action="map">REPLAY WORLDS</button></div>`);}
  function paintCards(){
    $('levelGrid').innerHTML=LEVELS.map((l,i)=>`<button class="level-card" data-world="${l.world+1}" data-level="${i}" ${i>progress.unlocked?'disabled':''} aria-label="${l.name}, ${i>progress.unlocked?'locked':'playable'}"><span class="level-num">WORLD ${String(l.world+1).padStart(2,'0')} / LEVEL ${String(i+1).padStart(2,'0')}</span><div><h3>${l.name}</h3><p>${l.tag}</p></div><span class="level-state">${progress.completed.has(i)?'✓ COMPLETE — REPLAY ↗':i<=progress.unlocked?'▶ PLAY LEVEL ↗':'◼ LOCKED — COMPLETE PREVIOUS LEVEL'}</span></button>`).join('');
    $('archiveGrid').innerHTML=LEVELS.map((l,i)=>`<article class="archive-card"><div class="archive-card-top">${String(i+1).padStart(2,'0')} / ${l.trait} · ${progress.completed.has(i)?'DISCOVERED':'PROJECT DOSSIER'}</div><h3>${l.project}</h3><p>${l.description}</p><p class="stack">${l.stack}</p><div class="lock-note">${progress.completed.has(i)?'✓ REVEALED THROUGH GAMEPLAY':'● PLAY THE LEVEL TO EARN THIS REVEAL'}</div></article>`).join('');
  }
  function addParticles(x,y,color,count=8){for(let i=0;i<count;i++)game.particles.push({x,y,vx:rnd(-135,135),vy:rnd(-230,-70),ttl:rnd(.4,.85),max:.85,color,size:rnd(2,6)});}
  function update(dt){if(!game||game.mode!=='playing')return;const s=game,p=s.player;s.t+=dt;p.inv=Math.max(0,p.inv-dt);s.hitFlash=Math.max(0,s.hitFlash-dt);
    const move=Number(press.right)-Number(press.left);p.vx=move*RUN;if(move)p.face=move;p.x=clamp(p.x+p.vx*dt,1,3030-p.w);p.run+=Math.abs(move)*dt*13;
    p.coyote=p.grounded?.09:Math.max(0,p.coyote-dt);p.grounded=false;p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    const oldBottom=p.y+p.h;p.vy=Math.min(1100,p.vy+G*dt);p.y+=p.vy*dt;
    for(const plat of s.platforms){if(plat.move)plat.y=plat.base+Math.sin(s.t*1.8)*13;
      if(p.vy>=0 && oldBottom<=plat.y+13 && p.y+p.h>=plat.y && p.x+p.w>plat.x+10 && p.x<plat.x+plat.w-7){p.y=plat.y-p.h;p.vy=0;p.grounded=true;}
    }
    if(p.grounded&&p.jumpBuffer>0){p.jumpBuffer=0;p.grounded=false;p.vy=JUMP;beep(430,.08,'triangle');}
    if(p.y>H+160){hurt();p.x=s.checkpoint;p.y=390;p.vy=0;p.inv=1.5;}
    if(p.x>1580&&!s.checkpointReached){s.checkpointReached=true;s.checkpoint=1595;announce('CHECKPOINT UNLOCKED ✓',2);beep(1020,.11);}
    for(let i=0;i<3;i++){const gem=s.gems[i];if(s.found.has(i))continue;const dx=p.x+p.w/2-gem.x,dy=p.y+p.h/2-(gem.y+Math.sin(s.t*3+i)*8);if(Math.hypot(dx,dy)<37){s.found.add(i);s.score+=150;addParticles(gem.x,gem.y,'#ffe69a',15);beep(910+i*120,.12);announce(s.found.size===3?'ALL CRYSTALS COLLECTED — REACH THE EXIT GATE':`CRYSTAL FOUND ${s.found.size}/3`,1.55);updateHUD();}}
    for(const hazard of s.spikes)if(rectHit(p,{x:hazard.x+5,y:hazard.y+8,w:hazard.w-10,h:hazard.h-8}))hurt();
    for(const m of s.monsters){if(m.dead)continue;m.x+=m.dir*m.speed*dt;if(m.x<m.min||m.x>m.max){m.x=clamp(m.x,m.min,m.max);m.dir*=-1;}
      if(rectHit(p,m)){
        if(p.vy>140 && oldBottom<=m.y+18){m.hp--;p.vy=-475;addParticles(m.x+m.w/2,m.y,'#ff9b94',7);beep(510,.12);if(m.hp<=0){m.dead=true;s.score+=100;s.enemiesDefeated++;updateHUD();}}else hurt();
      }
    }
    for(const b of s.bullets){b.x+=b.v*dt;b.ttl-=dt;for(const m of s.monsters){if(!m.dead&&rectHit(b,m)){b.ttl=0;m.hp--;addParticles(b.x,b.y,'#ffbd81',7);if(m.hp<=0){m.dead=true;s.enemiesDefeated++;s.score+=100;updateHUD();}beep(m.boss?165:230,.09,'square');break;}}}
    s.bullets=s.bullets.filter(b=>b.ttl>0&&b.x>0&&b.x<3060);
    for(const q of s.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=520*dt;q.ttl-=dt;}s.particles=s.particles.filter(q=>q.ttl>0);
    const desired=clamp(p.x-325,0,2000);s.camera+=(desired-s.camera)*Math.min(1,dt*5);
    if(p.x>2890&&s.found.size===3&&!s.finishRequested&&s.t%3<dt)announce('GATE ACTIVE — PRESS E TO ENTER',2);
    if(performance.now()>toastUntil)$('gameToast').classList.remove('show');
  }
  const hexToRGBA=(hex,a)=>{const h=hex.replace('#','');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;};
  function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function drawBackdrop(s){const theme=worldAt(s.id);const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,theme.sky[0]);grd.addColorStop(.65,theme.sky[1]);grd.addColorStop(1,theme.sky[2]);ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    const xscroll=s.camera*.15;
    for(let i=0;i<36;i++){const x=((i*167+39-xscroll*.32)%1320+1320)%1320-70,y=47+(i*83%280);ctx.fillStyle=`rgba(255,249,223,${.1+(i%4)*.09})`;ctx.beginPath();ctx.arc(x,y,1+(i%3),0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=hexToRGBA(theme.accent,.32);ctx.beginPath();ctx.arc(940-s.camera*.04,137,68,0,Math.PI*2);ctx.fill();ctx.fillStyle=hexToRGBA('#ffffff',.14);ctx.beginPath();ctx.arc(945-s.camera*.04,130,42,0,Math.PI*2);ctx.fill();
    for(let layer=0;layer<3;layer++){const speed=.10+layer*.13;const oy=355+layer*65;const gap=205-layer*27;ctx.fillStyle=hexToRGBA(theme.hill,.55+layer*.13);ctx.beginPath();ctx.moveTo(0,H);for(let x=-120;x<=W+190;x+=gap){const tx=x-((s.camera*speed)%gap);ctx.lineTo(tx,oy+Math.sin((x+layer*91)*.014)*40+Math.sin(x*.027)*12);}ctx.lineTo(W+200,H);ctx.fill();}
    if(s.id<2){for(let i=0;i<18;i++){const x=i*160-s.camera*.23%160-70,y=348+(i%3)*25;ctx.fillStyle=hexToRGBA('#d4b8ff',.23);ctx.beginPath();ctx.arc(x,y,20+(i%3)*8,0,Math.PI*2);ctx.fill();ctx.fillStyle=hexToRGBA('#ffe9be',.4);ctx.fillRect(x-3,y-46,6,25);}}
    if(s.id>=4){for(let i=0;i<24;i++){const x=i*115-s.camera*.31%115-30,h=80+(i*43)%140;ctx.fillStyle=hexToRGBA('#10192d',.45);ctx.fillRect(x,410-h,55,h);ctx.fillStyle=hexToRGBA('#fff1a7',.65);for(let y=420-h;y<390;y+=16)ctx.fillRect(x+12,y,5,5);}}
  }
  function drawFloor(s){const theme=worldAt(s.id);ctx.save();ctx.translate(-s.camera,0);
    for(const plat of s.platforms){const depth=plat.ground?H-plat.y+100:25;ctx.fillStyle=theme.soil;ctx.fillRect(plat.x,plat.y,plat.w,depth);const lip=ctx.createLinearGradient(0,plat.y,0,plat.y+25);lip.addColorStop(0,theme.trim);lip.addColorStop(.33,theme.soil);lip.addColorStop(1,theme.soil);ctx.fillStyle=lip;ctx.fillRect(plat.x,plat.y,plat.w,Math.min(depth,25));ctx.fillStyle=hexToRGBA('#06131c',.22);if(plat.ground){for(let x=plat.x+18;x<plat.x+plat.w;x+=54){ctx.fillRect(x,plat.y+35,5,5);ctx.fillRect(x+18,plat.y+77,3,3);}}else{ctx.fillStyle=hexToRGBA(theme.accent,.32);ctx.fillRect(plat.x+12,plat.y+20,plat.w-24,3);}ctx.strokeStyle=hexToRGBA(theme.accent,.8);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(plat.x,plat.y+3);ctx.lineTo(plat.x+plat.w,plat.y+3);ctx.stroke();}
    for(const h of s.spikes){ctx.fillStyle='#633a53';ctx.fillRect(h.x,h.y+17,h.w,7);for(let i=0;i<Math.floor(h.w/15);i++){ctx.beginPath();ctx.moveTo(h.x+i*15,h.y+21);ctx.lineTo(h.x+i*15+7.5,h.y-2);ctx.lineTo(h.x+i*15+15,h.y+21);ctx.closePath();ctx.fillStyle='#ffd5d1';ctx.fill();ctx.strokeStyle='#d85873';ctx.lineWidth=2;ctx.stroke();}}
    for(let i=0;i<3;i++){if(s.found.has(i))continue;const gem=s.gems[i],yy=gem.y+Math.sin(s.t*3+i)*8;ctx.save();ctx.translate(gem.x,yy);ctx.rotate(s.t*.85+i);ctx.shadowColor='#fff0a0';ctx.shadowBlur=22;ctx.fillStyle='#ffe18c';ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(14,0);ctx.lineTo(0,17);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffffcc';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(9,0);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();}
    if(!s.checkpointReached){ctx.fillStyle='#111f30';ctx.fillRect(1575,418,9,92);ctx.fillStyle='#ffbd83';ctx.beginPath();ctx.moveTo(1584,417);ctx.lineTo(1640,432);ctx.lineTo(1584,450);ctx.fill();}else{ctx.fillStyle='#91f7e2';ctx.fillRect(1575,418,9,92);ctx.fillStyle='#b1ffdc';ctx.beginPath();ctx.moveTo(1584,417);ctx.lineTo(1640,432);ctx.lineTo(1584,450);ctx.fill();}
    for(const m of s.monsters){if(m.dead)continue;ctx.save();ctx.translate(m.x,m.y);ctx.fillStyle=m.boss?'#5b304c':'#9b344c';roundRect(1,5,m.w-2,m.h-10,8,m.boss?'#733f67':'#bd4e61','#ffb0ac');ctx.fillStyle='#fdf2c9';ctx.fillRect(7,17,m.boss?20:9,8);ctx.fillRect(m.boss?42:24,17,9,8);ctx.fillStyle='#34213b';ctx.fillRect(4,m.h-9,8,12);ctx.fillRect(m.w-16,m.h-9,8,12);ctx.strokeStyle='#ffb1bd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.w/2,5);ctx.lineTo(m.w/2,-9);ctx.stroke();ctx.fillStyle='#ffa7ad';ctx.beginPath();ctx.arc(m.w/2,-11,5,0,Math.PI*2);ctx.fill();if(m.boss){ctx.fillStyle='#fbe1e8';ctx.font='700 12px Space Mono,monospace';ctx.fillText(`HP ${m.hp}`,10,-23);}ctx.restore();}
    const door=s.exit,ready=s.found.size===3&&!(s.id===5&&s.monsters.some(m=>m.boss&&!m.dead));ctx.save();ctx.translate(door.x,door.y);ctx.shadowColor=ready?'#8efbf0':'#ffb18b';ctx.shadowBlur=ready?24:8;roundRect(0,0,door.w,door.h,14,ready?'#1c716b':'#3d5360',ready?'#b0ffe9':'#ffc297');ctx.fillStyle=ready?'#abfff0':'#aebec5';ctx.fillRect(13,9,31,74);ctx.fillStyle=ready?'#256e79':'#385268';ctx.fillRect(18,17,21,60);ctx.strokeStyle=ready?'#cafff0':'#ffcb9d';ctx.lineWidth=3;ctx.strokeRect(13,9,31,74);ctx.fillStyle=ready?'#eafff3':'#ffdec0';ctx.font='700 12px Space Mono,monospace';ctx.fillText(ready?'OPEN':'LOCKED',-8,-10);ctx.restore();
    for(const b of s.bullets){ctx.shadowColor='#89fff2';ctx.shadowBlur=13;roundRect(b.x,b.y,b.w,b.h,4,'#6df8e3','#d9fff8');ctx.shadowBlur=0;}
    for(const p of s.particles){ctx.globalAlpha=clamp(p.ttl/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    drawRunner(s.player,s.t);
    ctx.restore();
  }
  function drawRunner(p,t){ctx.save();ctx.translate(p.x+p.w/2,p.y);if(p.inv>0&&Math.floor(t*18)%2===0)ctx.globalAlpha=.42;ctx.scale(p.face,1);
    const step=Math.sin(p.run)*Math.min(1,Math.abs(p.vx)/330)*8;
    ctx.fillStyle='#143544';ctx.fillRect(-14,39+Math.max(0,step),12,13);ctx.fillRect(3,39+Math.max(0,-step),12,13);
    ctx.shadowColor='#65f4e9';ctx.shadowBlur=12;roundRect(-16,15,32,28,8,'#19bcb9','#a5fff5');ctx.shadowBlur=0;
    ctx.fillStyle='#f89f68';ctx.beginPath();ctx.moveTo(-11,23);ctx.lineTo(-34,20+Math.sin(t*14)*5);ctx.lineTo(-14,30);ctx.fill();
    ctx.fillStyle='#ffe0b4';ctx.beginPath();ctx.arc(0,13,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#103b50';roundRect(-17,2,34,16,7,'#164b5e','#9ce6e6');ctx.fillStyle='#c4ffed';ctx.fillRect(2,8,10,4);
    ctx.fillStyle='#122936';ctx.fillRect(-20,26,7,13);ctx.fillRect(13,26,7,13);
    ctx.fillStyle='#ffe6aa';ctx.fillRect(11,27,7,5);ctx.restore();}
  function render(){if(!game)return;ctx.clearRect(0,0,W,H);drawBackdrop(game);drawFloor(game);if(game.hitFlash>0){ctx.fillStyle=`rgba(255,84,98,${game.hitFlash*.2})`;ctx.fillRect(0,0,W,H);}if(game.mode==='paused'){ctx.fillStyle='#06111b66';ctx.fillRect(0,0,W,H);}const near=Math.abs(game.player.x-game.exit.x)<120;if(near){ctx.fillStyle='#e9fff5';ctx.font='700 12px Space Mono,monospace';ctx.textAlign='center';ctx.fillText(game.found.size===3?'PRESS E TO OPEN THE GATE':'FIND ALL 3 CRYSTALS',W/2,135);ctx.textAlign='start';}}
  function frame(time){const dt=Math.min(.034,(time-lastTime)/1000||.016);lastTime=time;if(game){update(dt);render();}requestAnimationFrame(frame);}
  document.addEventListener('keydown',e=>{if($('modalRoot').hidden===false){if(e.code==='Escape'){if(game?.mode==='paused')game.mode='playing';closeModal();}return;}if(!game||game.mode!=='playing')return;if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyX','KeyK','KeyE'].includes(e.code))e.preventDefault();if(e.code==='KeyA'||e.code==='ArrowLeft')press.left=true;if(e.code==='KeyD'||e.code==='ArrowRight')press.right=true;if(['Space','KeyW','ArrowUp'].includes(e.code)&&!e.repeat)jump();if(['KeyX','KeyK'].includes(e.code)&&!e.repeat)shoot();if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape')showPause();});
  document.addEventListener('keyup',e=>{if(['KeyA','ArrowLeft'].includes(e.code))press.left=false;if(['KeyD','ArrowRight'].includes(e.code))press.right=false;});
  window.addEventListener('blur',()=>{press.left=false;press.right=false;});
  for(const b of document.querySelectorAll('[data-hold]')){const k=b.dataset.hold;const start=e=>{e.preventDefault();press[k]=true;b.classList.add('pressed');try{b.setPointerCapture(e.pointerId);}catch{}};const stop=e=>{e.preventDefault();press[k]=false;b.classList.remove('pressed');};b.addEventListener('pointerdown',start);b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);}
  $('touchJump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});$('touchFire').addEventListener('pointerdown',e=>{e.preventDefault();shoot();});$('touchEnter').addEventListener('click',interact);
  $('playBtn').onclick=()=>begin(progress.unlocked);$('exploreBtn').onclick=()=>{$('archive').scrollIntoView({behavior:'smooth'});};$('navLevels').onclick=()=>{$('levels').scrollIntoView({behavior:'smooth'});};$('navDossiers').onclick=()=>{$('archive').scrollIntoView({behavior:'smooth'});};$('backToLobby').onclick=()=>{closeModal();game=null;press.left=press.right=false;setScreen(false);};$('homeLink').onclick=()=>{closeModal();game=null;setScreen(false);};$('restartLevel').onclick=()=>{if(game)begin(game.id);};$('pauseGame').onclick=showPause;$('openMap').onclick=showMap;$('soundToggle').onclick=()=>{sound=!sound;$('soundToggle').textContent=sound?'♫ AUDIO ON':'♫ AUDIO OFF';$('soundToggle').setAttribute('aria-pressed',String(sound));beep(610,.07);};
  $('levelGrid').onclick=e=>{const b=e.target.closest('[data-level]');if(b&&!b.disabled)begin(Number(b.dataset.level));};
  $('modalClose').onclick=()=>{if(game?.mode==='paused')game.mode='playing';closeModal();};$('modalScrim').onclick=()=>{if(game?.mode==='paused')game.mode='playing';closeModal();};
  $('modalContent').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;if(a==='next'||a==='start')begin(Number(b.dataset.level)||0);else if(a==='resume'){if(game?.mode==='paused')game.mode='playing';closeModal();}else if(a==='replay'||a==='restart')begin(game?.id||0);else if(a==='ending')ending();else if(a==='map')showMap();else if(a==='archive'){closeModal();$('archive').scrollIntoView({behavior:'smooth'});}else closeModal();};
  if(new URLSearchParams(location.search).get('mode')==='recruiter')setTimeout(()=>$('archive').scrollIntoView(),100);
  paintCards();requestAnimationFrame(frame);
  // Read-only build metadata for repeatable smoke tests and debugging.
  window.AmalverseInfo = Object.freeze({version:'3.0',levels:LEVELS.length,worlds:WORLDS.length,get stage(){return game?.id??null;},get mode(){return game?.mode??'lobby';},get crystals(){return game?.found.size??0;},get x(){return game?.player.x??0;},get unlocked(){return progress.unlocked;}});
})();
