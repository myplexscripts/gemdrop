(() => {
  'use strict';

  const Matter = window.Matter;
  if (!Matter) return;

  const { Engine, World, Bodies, Body, Composite, Events, Sleeping } = Matter;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const WALL = 20;
  const FLOOR = H - 20;
  const DROP_Y = 52;
  const LOSE_Y = 106;
  const STEP_MS = 1000 / 60;
  const DROP_DELAY = 360;
  const LIGHT_ANGLE = -2.20;
  const CAT_GEM = 0x0001;
  const CAT_WORLD = 0x0002;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const bestEl = $('best');
  const nextPreview = $('nextPreview');
  const dangerHud = $('dangerHud');
  const gestureHint = $('gestureHint');
  const toast = $('toast');
  const mergePath = $('mergePath');
  const startOverlay = $('startOverlay');
  const pauseOverlay = $('pauseOverlay');
  const gameOverOverlay = $('gameOverOverlay');
  const finalScoreEl = $('finalScore');
  const bestMergeEl = $('bestMerge');

  const tiers = [
    {name:'Quartz',     r:24,  score:1,   color:'#D7E3EC', accent:'#F4FAFD', dark:'#657789', sides:6},
    {name:'Citrine',    r:32,  score:3,   color:'#D9A94E', accent:'#F2D989', dark:'#76501B', sides:7},
    {name:'Peridot',    r:40,  score:6,   color:'#7DB36F', accent:'#BDDAA3', dark:'#3E633B', sides:6},
    {name:'Aquamarine', r:56,  score:10,  color:'#58AEBF', accent:'#B6DFE5', dark:'#2D6470', sides:8},
    {name:'Amethyst',   r:64,  score:15,  color:'#8968B2', accent:'#C8B4E1', dark:'#493465', sides:7},
    {name:'Topaz',      r:72,  score:21,  color:'#C9784D', accent:'#E8AE88', dark:'#703D2A', sides:8},
    {name:'Sapphire',   r:84,  score:28,  color:'#496AB8', accent:'#9FB6E3', dark:'#293E73', sides:8},
    {name:'Emerald',    r:96,  score:36,  color:'#348E6E', accent:'#91CBB2', dark:'#1E5745', sides:8},
    {name:'Ruby',       r:128, score:45,  color:'#B63F57', accent:'#DE91A1', dark:'#702838', sides:9},
    {name:'Starstone',  r:160, score:55,  color:'#7A61B4', accent:'#C0AFE4', dark:'#47366E', sides:10},
    {name:'Crownstone', r:192, score:66,  color:'#BC9340', accent:'#E8CF82', dark:'#6A501B', sides:11}
  ];

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.x = 0;
  engine.gravity.y = 1;
  engine.gravity.scale = .001;

  const physics = {
    friction: .006,
    frictionStatic: .006,
    frictionAir: 0,
    restitution: .10,
    density: .001
  };

  let gems = [];
  let walls = [];
  let particles = [];
  let floaters = [];
  let score = 0;
  let best = loadBest();
  let currentTier = 0;
  let nextTier = 0;
  let bestTierReached = 0;
  let aimX = W / 2;
  let ready = false;
  let running = false;
  let paused = false;
  let pointerActive = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let drops = 0;
  let dangerTime = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  let readyTimer = null;
  let toastTimer = null;
  let audioCtx = null;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  bestEl.textContent = fmt(best);
  buildWorld();
  buildMergePath();
  drawPreview();

  function buildWorld() {
    Composite.clear(engine.world, false, true);
    gems = [];
    walls = [
      Bodies.rectangle(W / 2, FLOOR + 32, W, 64, { ...physics, isStatic:true, collisionFilter:{category:CAT_WORLD,mask:CAT_GEM} }),
      Bodies.rectangle(-12, H / 2, 64, H * 2, { ...physics, isStatic:true, collisionFilter:{category:CAT_WORLD,mask:CAT_GEM} }),
      Bodies.rectangle(W + 12, H / 2, 64, H * 2, { ...physics, isStatic:true, collisionFilter:{category:CAT_WORLD,mask:CAT_GEM} })
    ];
    World.add(engine.world, walls);
  }

  function loadBest() {
    try { return Number(localStorage.getItem('gemTideBest') || 0); }
    catch { return 0; }
  }
  function saveBest() {
    try { localStorage.setItem('gemTideBest', String(best)); } catch {}
  }

  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
  }

  function tone(freq, duration=.055, volume=.025, type='sine') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function haptic(ms=7) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
  }

  function randomSpawnTier() {
    return Math.floor(Math.random() * 5);
  }

  function resetGame() {
    clearTimeout(readyTimer);
    buildWorld();
    particles = [];
    floaters = [];
    score = 0;
    currentTier = randomSpawnTier();
    nextTier = randomSpawnTier();
    bestTierReached = 0;
    aimX = W / 2;
    ready = true;
    running = true;
    paused = false;
    pointerActive = false;
    drops = 0;
    dangerTime = 0;
    dangerHud.hidden = true;
    gestureHint.classList.remove('hidden');
    scoreEl.textContent = '0';
    drawPreview();
  }

  function createGem(x, y, tier) {
    const t = tiers[tier];
    const body = Bodies.circle(x, y, t.r * .965, {
      ...physics,
      collisionFilter:{category:CAT_GEM,mask:CAT_WORLD|CAT_GEM}
    });

    Body.setAngle(body, (Math.random() - .5) * .08);
    Body.setAngularVelocity(body, (Math.random() - .5) * .0015);

    body.gem = {
      tier,
      alive:true,
      born:performance.now(),
      merging:false,
      renderAngle:body.angle,
      renderSpin:0,
      hit:0,
      seed:Math.random()
    };

    World.add(engine.world, body);
    gems.push(body);
    return body;
  }

  function removeGem(body) {
    if (!body?.gem?.alive) return;
    body.gem.alive = false;
    World.remove(engine.world, body);
    const i = gems.indexOf(body);
    if (i >= 0) gems.splice(i, 1);
  }

  function setReadyAfterDrop() {
    ready = false;
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => {
      if (!running) return;
      ready = true;
      drawPreview();
    }, DROP_DELAY);
  }

  function dropCurrent() {
    if (!running || paused || !ready) return;
    const t = tiers[currentTier];
    const x = clamp(aimX, WALL + t.r, W - WALL - t.r);

    createGem(x, DROP_Y, currentTier);
    tone(185, .045, .018, 'triangle');
    haptic(5);

    currentTier = nextTier;
    nextTier = randomSpawnTier();
    drops++;
    if (drops >= 2) gestureHint.classList.add('hidden');
    setReadyAfterDrop();
    drawPreview();
  }

  function mergePair(a, b) {
    if (!a?.gem?.alive || !b?.gem?.alive || a.gem.merging || b.gem.merging) return;
    if (a.gem.tier !== b.gem.tier) return;

    a.gem.merging = true;
    b.gem.merging = true;

    const tier = a.gem.tier;
    const next = tier + 1;
    const x = (a.position.x + b.position.x) / 2;
    const y = (a.position.y + b.position.y) / 2;

    removeGem(a);
    removeGem(b);

    if (next >= tiers.length) {
      addScore(100);
      burst(x, y, tiers[tier].accent, 26, 170);
      floaters.push({x,y,text:'+100',life:.75,color:'#F0D998'});
      tone(740, .16, .045, 'sine');
      haptic([14,18,22]);
      return;
    }

    const n = createGem(x, y, next);
    n.gem.born = performance.now() - 300;
    n.gem.renderAngle = (a.gem.renderAngle + b.gem.renderAngle) / 2;
    bestTierReached = Math.max(bestTierReached, next);

    addScore(tiers[next].score);
    burst(x, y, tiers[next].accent, 8 + Math.min(8,next), 100 + next * 4);
    floaters.push({x,y,text:'+' + tiers[next].score,life:.54,color:tiers[next].accent});
    tone(270 + next * 42, .075 + next * .004, .024 + Math.min(.018,next*.0018), 'sine');
    haptic(next >= 8 ? 15 : 7);
  }

  Events.on(engine, 'collisionStart', event => {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (!a.gem || !b.gem) {
        const g = a.gem ? a : b.gem ? b : null;
        if (g?.gem?.alive) g.gem.hit = Math.max(g.gem.hit, Math.min(.55, g.speed * .045));
        continue;
      }
      if (!a.gem.alive || !b.gem.alive) continue;

      const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      a.gem.hit = Math.max(a.gem.hit, Math.min(.7, rel * .06));
      b.gem.hit = Math.max(b.gem.hit, Math.min(.7, rel * .06));

      if (a.gem.tier === b.gem.tier) mergePair(a, b);
    }
  });

  Events.on(engine, 'collisionActive', event => {
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (a.gem?.alive && b.gem?.alive && a.gem.tier === b.gem.tier) mergePair(a, b);
    }
  });

  function addScore(points) {
    score += points;
    if (score > best) {
      best = score;
      saveBest();
    }
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(best);
  }

  function burst(x,y,color,count=12,speed=105) {
    for (let i=0;i<count;i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (.30 + Math.random() * .65);
      particles.push({
        x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
        life:.25+Math.random()*.24,max:.49,color,size:1.2+Math.random()*2
      });
    }
  }

  function updateEffects(dt) {
    for (let i=particles.length-1;i>=0;i--) {
      const p=particles[i];
      p.life-=dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      p.vx*=Math.pow(.94,dt*60);
      p.vy=p.vy*Math.pow(.94,dt*60)+75*dt;
      if(p.life<=0) particles.splice(i,1);
    }
    for (let i=floaters.length-1;i>=0;i--) {
      const f=floaters[i];
      f.life-=dt;f.y-=24*dt;
      if(f.life<=0) floaters.splice(i,1);
    }
  }

  function step(dtMs) {
    if (!running || paused) return;

    Engine.update(engine, dtMs);

    const dt = dtMs / 1000;
    const now = performance.now();

    for (const b of gems) {
      if (!b.gem?.alive) continue;
      const t = tiers[b.gem.tier];

      b.gem.hit = Math.max(0, b.gem.hit - dt * 3.6);

      const maxAV = .0035 + 24 / t.r * .0028;
      if (Math.abs(b.angularVelocity) > maxAV) {
        Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * maxAV);
      }

      const rolling = clamp((b.velocity.x / Math.max(24,t.r)) * .020, -.0045, .0045);
      b.gem.renderSpin += (rolling - b.gem.renderSpin) * .09;
      b.gem.renderSpin *= .988;
      b.gem.renderAngle += b.gem.renderSpin * (dtMs / 16.6667);

      if (Math.abs(b.gem.renderSpin) < .00008 && Math.abs(b.angularVelocity) > .0001) {
        b.gem.renderAngle += clamp(b.angularVelocity, -.0018, .0018) * .30;
      }
    }

    updateEffects(dt);
    checkDanger(dt, now);
  }

  function checkDanger(dt, now) {
    const high = gems.some(b => {
      if (!b.gem?.alive) return false;
      const oldEnough = now - b.gem.born > 850;
      const resting = b.isSleeping || b.speed < .30;
      return oldEnough && resting && b.bounds.min.y < LOSE_Y;
    });

    if (high) dangerTime += dt;
    else dangerTime = Math.max(0, dangerTime - dt * 2.8);

    dangerHud.hidden = dangerTime < .12;

    if (dangerTime >= 1.15) endGame();
  }

  function endGame() {
    running = false;
    ready = false;
    pointerActive = false;
    finalScoreEl.textContent = fmt(score);
    bestMergeEl.textContent = tiers[bestTierReached].name;
    gameOverOverlay.classList.add('visible');
    haptic([38,28,38]);
  }

  function setPause(value) {
    if (!running) return;
    paused = value;
    pauseOverlay.classList.toggle('visible',value);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove('show'),1000);
  }

  function draw() {
    drawBackground();
    drawLoseLine();
    drawDropper();

    const sorted = [...gems].filter(g=>g.gem?.alive).sort((a,b)=>a.position.y-b.position.y);
    for (const b of sorted) {
      drawGem(ctx,b.position.x,b.position.y,b.gem.tier,tiers[b.gem.tier].r,b.gem.renderAngle,b.gem.hit,1,b.gem.seed);
    }

    drawParticles();
    drawFloaters();
  }

  function drawBackground() {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#101426');g.addColorStop(.44,'#0B1020');g.addColorStop(1,'#080A14');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    const glow=ctx.createRadialGradient(W*.52,H*.74,30,W*.52,H*.74,H*.64);
    glow.addColorStop(0,'rgba(70,94,137,.105)');
    glow.addColorStop(.60,'rgba(49,42,78,.038)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

    ctx.save();
    for(let i=0;i<22;i++){
      ctx.globalAlpha=.045+(i%4)*.014;
      ctx.fillStyle=i%6===0?'#C9BCE4':'#A8BBD4';
      const x=(i*191.7)%W,y=(i*103.4)%H;
      ctx.beginPath();ctx.arc(x,y,.7+(i%3)*.25,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle='rgba(255,255,255,.025)';
    ctx.fillRect(WALL-2,0,2,H);ctx.fillRect(W-WALL,0,2,H);
  }

  function drawLoseLine() {
    ctx.save();
    ctx.setLineDash([10,12]);
    ctx.lineWidth=dangerTime>.1?2:1.2;
    ctx.strokeStyle=dangerTime>.1?'rgba(255,100,126,.86)':'rgba(255,255,255,.12)';
    ctx.beginPath();ctx.moveTo(WALL+6,LOSE_Y);ctx.lineTo(W-WALL-6,LOSE_Y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign='center';ctx.font='800 14px Manrope, sans-serif';
    ctx.fillStyle=dangerTime>.1?'rgba(255,176,190,.94)':'rgba(255,255,255,.27)';
    ctx.fillText('LIMIT',W/2,LOSE_Y-10);
    ctx.restore();
  }

  function drawDropper() {
    if (!running || paused || !ready) return;
    const t=tiers[currentTier];
    const x=clamp(aimX,WALL+t.r,W-WALL-t.r);

    ctx.save();
    ctx.strokeStyle='rgba(229,203,149,.18)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(WALL+78,34);ctx.lineTo(W-WALL-78,34);ctx.stroke();

    ctx.strokeStyle='rgba(240,218,169,.66)';
    ctx.lineWidth=2.4;ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x-15,36);ctx.lineTo(x-7,48);
    ctx.moveTo(x+15,36);ctx.lineTo(x+7,48);
    ctx.stroke();
    ctx.restore();

    drawGem(ctx,x,DROP_Y,currentTier,t.r,0,0,1,.18);
  }

  function gemPoints(sides,r,scale=1){
    const pts=[];
    for(let i=0;i<sides;i++){
      const a=-Math.PI/2+i*Math.PI*2/sides;
      const rr=r*scale*(i%2===0?1:.965);
      pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr,a});
    }
    return pts;
  }

  function path(c,pts){
    c.beginPath();
    pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.closePath();
  }

  function hexRgb(hex){
    const s=hex.replace('#','');
    const n=parseInt(s.length===3?s.split('').map(v=>v+v).join(''):s,16);
    return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  }

  function mix(aHex,bHex,t,alpha=1){
    const a=hexRgb(aHex),b=hexRgb(bHex),u=clamp(t,0,1);
    const r=Math.round(a.r+(b.r-a.r)*u),g=Math.round(a.g+(b.g-a.g)*u),bl=Math.round(a.b+(b.b-a.b)*u);
    return 'rgba('+r+','+g+','+bl+','+alpha+')';
  }

  function drawPoly(c,pts,fill){
    path(c,pts);c.fillStyle=fill;c.fill();
  }

  function drawGem(c,x,y,index,r,angle=0,hit=0,alpha=1,seed=0){
    const t=tiers[index];
    const outer=gemPoints(t.sides,r*.96,1);
    const girdle=gemPoints(t.sides,r*.96,.72);
    const table=gemPoints(t.sides,r*.96,.30);

    c.save();
    c.translate(x,y);
    c.rotate(angle);

    const squash=1-Math.min(.032,hit*.024);
    c.scale(1+(1-squash)*.52,squash);
    c.globalAlpha=alpha;

    path(c,outer);
    c.shadowColor='rgba(0,0,0,.42)';
    c.shadowBlur=9+r*.025;
    c.shadowOffsetY=4;
    c.fillStyle=t.dark;
    c.fill();
    c.shadowBlur=0;c.shadowOffsetY=0;

    c.save();
    path(c,outer);c.clip();

    for(let i=0;i<t.sides;i++){
      const j=(i+1)%t.sides;
      const mid=(outer[i].a+(outer[j].a+(j===0?Math.PI*2:0)))/2;
      const incidence=Math.max(0,Math.cos(mid+angle-LIGHT_ANGLE));
      const back=Math.max(0,-Math.cos(mid+angle-LIGHT_ANGLE));

      const ring=mix(t.color,incidence>.12?'#FFFFFF':t.dark,incidence>.12?.05+incidence*.30:.08+back*.24,.98);
      drawPoly(c,[outer[i],outer[j],girdle[j],girdle[i]],ring);

      const innerLight=Math.max(0,Math.cos(mid+angle+.48-LIGHT_ANGLE));
      const inner=mix(t.dark,t.accent,.18+innerLight*.36,.94);
      drawPoly(c,[girdle[i],girdle[j],table[j],table[i]],inner);

      const pavilionLight=Math.max(0,Math.cos(mid+angle-.38-LIGHT_ANGLE));
      const pavilion=mix(t.dark,t.color,.20+pavilionLight*.26,.92);
      drawPoly(c,[{x:0,y:r*.07},table[i],table[j]],pavilion);
    }

    path(c,table);
    const tg=c.createLinearGradient(-r*.18,-r*.24,r*.25,r*.25);
    tg.addColorStop(0,'rgba(255,255,255,.25)');
    tg.addColorStop(.45,mix(t.accent,'#FFFFFF',.12,.18));
    tg.addColorStop(1,'rgba(7,10,22,.22)');
    c.fillStyle=tg;c.fill();

    const specX=-r*.24,specY=-r*.30;
    const spec=c.createRadialGradient(specX,specY,0,specX,specY,r*.32);
    spec.addColorStop(0,'rgba(255,255,255,.32)');
    spec.addColorStop(.30,'rgba(255,255,255,.10)');
    spec.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=spec;c.fillRect(-r,-r,r*2,r*2);

    c.restore();

    path(c,outer);
    c.lineWidth=Math.max(1.1,r*.011);
    c.strokeStyle='rgba(255,255,255,.31)';
    c.stroke();

    let bestI=0,bestV=0;
    for(let i=0;i<t.sides;i++){
      const j=(i+1)%t.sides;
      const mid=(outer[i].a+(outer[j].a+(j===0?Math.PI*2:0)))/2;
      const v=Math.max(0,Math.cos(mid+angle-LIGHT_ANGLE));
      if(v>bestV){bestV=v;bestI=i}
    }

    if(alpha>.7 && bestV>.965 && r>=32){
      const j=(bestI+1)%t.sides;
      const px=(outer[bestI].x+outer[j].x)*.32;
      const py=(outer[bestI].y+outer[j].y)*.32;
      const strength=clamp((bestV-.965)/.035,0,1);
      const s=(2.2+r*.035)*strength;
      c.save();c.translate(px,py);c.rotate(-angle);
      c.globalAlpha=.14+strength*.26;
      c.strokeStyle='#FFFFFF';c.lineWidth=1;
      c.beginPath();
      c.moveTo(-s,0);c.lineTo(s,0);
      c.moveTo(0,-s*.64);c.lineTo(0,s*.64);
      c.stroke();c.restore();
    }

    c.restore();
  }

  function drawParticles(){
    for(const p of particles){
      ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size/2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }

  function drawFloaters(){
    ctx.save();ctx.textAlign='center';
    for(const f of floaters){
      ctx.globalAlpha=Math.min(1,f.life*2);
      ctx.fillStyle=f.color;ctx.font='800 16px Manrope, sans-serif';
      ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=5;
      ctx.fillText(f.text,f.x,f.y);
    }
    ctx.restore();
  }

  function drawPreview(){
    const c=nextPreview.getContext('2d');
    c.clearRect(0,0,nextPreview.width,nextPreview.height);
    drawGem(c,48,48,nextTier,Math.min(30,tiers[nextTier].r*.58),-.05,0,1,.5);
  }

  function buildMergePath(){
    mergePath.innerHTML='';
    const colors=tiers.map(t=>t.color);
    tiers.forEach((t,i)=>{
      const span=document.createElement('span');
      span.className='path-gem';
      const size=clamp(18+i*1.4,18,31);
      span.style.width=size+'px';span.style.height=size+'px';
      span.style.background='linear-gradient(145deg,'+t.accent+','+colors[i]+' 45%,'+t.dark+')';
      mergePath.appendChild(span);
    });
  }

  function pointerPos(e){
    const rect=canvas.getBoundingClientRect();
    return {
      x:(e.clientX-rect.left)*(W/rect.width),
      y:(e.clientY-rect.top)*(H/rect.height)
    };
  }

  canvas.addEventListener('pointerdown',e=>{
    if(!running||paused||!ready)return;
    e.preventDefault();
    unlockAudio();
    const p=pointerPos(e);
    pointerActive=true;
    pointerStartX=p.x;pointerStartY=p.y;
    aimX=p.x;
    try{canvas.setPointerCapture(e.pointerId)}catch{}
  });

  canvas.addEventListener('pointermove',e=>{
    if(!running||paused||!pointerActive||!ready)return;
    const p=pointerPos(e);
    aimX=p.x;
  });

  canvas.addEventListener('pointerup',e=>{
    if(!running||paused||!pointerActive||!ready)return;
    e.preventDefault();
    const p=pointerPos(e);
    aimX=p.x;
    pointerActive=false;
    dropCurrent();
    try{canvas.releasePointerCapture(e.pointerId)}catch{}
  });

  canvas.addEventListener('pointercancel',e=>{
    pointerActive=false;
    try{canvas.releasePointerCapture(e.pointerId)}catch{}
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  $('pauseButton').addEventListener('click',()=>setPause(true));
  $('resumeButton').addEventListener('click',()=>setPause(false));
  $('restartFromPause').addEventListener('click',()=>{
    pauseOverlay.classList.remove('visible');resetGame();
  });
  $('startButton').addEventListener('click',()=>{
    unlockAudio();startOverlay.classList.remove('visible');resetGame();
  });
  $('restartButton').addEventListener('click',()=>{
    gameOverOverlay.classList.remove('visible');resetGame();
  });

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&running&&!paused)setPause(true);
  });

  window.addEventListener('keydown',e=>{
    if(e.code==='Space'){e.preventDefault();dropCurrent()}
    if(e.key==='Escape')setPause(!paused);
  });

  function frame(now){
    const delta=Math.min(50,now-lastTime);
    lastTime=now;accumulator+=delta;
    while(accumulator>=STEP_MS){step(STEP_MS);accumulator-=STEP_MS}
    draw();
    requestAnimationFrame(frame);
  }

  function fmt(n){return Math.max(0,Math.floor(n)).toLocaleString('en-CA')}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

  requestAnimationFrame(frame);
})();
