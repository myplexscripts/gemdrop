(() => {
  'use strict';

  const Matter = window.Matter;
  if (!Matter) return;

  const { Engine, World, Bodies, Body, Composite, Events } = Matter;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const WALL = 20;
  const FLOOR = H - 20;
  const DROP_Y = 58;
  const LOSE_Y = 118;
  const STEP_MS = 1000 / 60;
  const DROP_DELAY = 330;
  const LIGHT_ANGLE = -2.18;
  const CAT_GEM = 0x0001;
  const CAT_WORLD = 0x0002;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const bestEl = $('best');
  const nextPreview = $('nextPreview');
  const dangerHud = $('dangerHud');
  const gestureHint = $('gestureHint');
  const toast = $('toast');
  const startOverlay = $('startOverlay');
  const pauseOverlay = $('pauseOverlay');
  const gameOverOverlay = $('gameOverOverlay');
  const finalScoreEl = $('finalScore');
  const bestMergeEl = $('bestMerge');

  const tiers = [
    {name:'Quartz',     r:24,  score:1,  color:'#D9E6EE', accent:'#FFFFFF', dark:'#8293A0', profile:[.36,.39,.70,.90,.72]},
    {name:'Citrine',    r:32,  score:3,  color:'#F1B83F', accent:'#FFE69A', dark:'#B06E20', profile:[.32,.42,.73,.91,.76]},
    {name:'Peridot',    r:40,  score:6,  color:'#82C95A', accent:'#CCEDA6', dark:'#4E8B3D', profile:[.40,.36,.74,.92,.70]},
    {name:'Aquamarine', r:56,  score:10, color:'#43B9C7', accent:'#BFEAF0', dark:'#247888', profile:[.38,.40,.75,.93,.78]},
    {name:'Amethyst',   r:64,  score:15, color:'#996DDA', accent:'#D7C0F3', dark:'#69499A', profile:[.34,.43,.74,.93,.76]},
    {name:'Topaz',      r:72,  score:21, color:'#F07E49', accent:'#F8C59A', dark:'#B64F31', profile:[.42,.35,.76,.94,.68]},
    {name:'Sapphire',   r:84,  score:28, color:'#4F78E8', accent:'#B8C9FA', dark:'#3150A3', profile:[.36,.42,.76,.94,.79]},
    {name:'Emerald',    r:96,  score:36, color:'#3CB68A', accent:'#A9E2CB', dark:'#217759', profile:[.45,.32,.76,.94,.66]},
    {name:'Ruby',       r:128, score:45, color:'#E75170', accent:'#F6ADBC', dark:'#A92F49', profile:[.34,.44,.77,.95,.80]},
    {name:'Starstone',  r:160, score:55, color:'#8267D9', accent:'#C8B7F1', dark:'#5542A0', profile:[.39,.38,.78,.95,.73]},
    {name:'Crownstone', r:192, score:66, color:'#F2AA39', accent:'#FFE09A', dark:'#B66C21', profile:[.32,.45,.79,.96,.82]}
  ];

  const engine = Engine.create({ enableSleeping:true });
  engine.gravity.x = 0;
  engine.gravity.y = 1;
  engine.gravity.scale = .00105;

  const physics = {
    friction:.018,
    frictionStatic:.035,
    frictionAir:0,
    restitution:.08,
    density:.001
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
  let drops = 0;
  let dangerTime = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  let readyTimer = null;
  let toastTimer = null;
  let audioCtx = null;
  let cameraKick = 0;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  bestEl.textContent = fmt(best);
  buildWorld();
  drawPreview();

  function buildWorld() {
    Composite.clear(engine.world,false,true);
    gems = [];
    walls = [
      Bodies.rectangle(W/2,FLOOR+32,W,64,{...physics,isStatic:true,collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}}),
      Bodies.rectangle(-12,H/2,64,H*2,{...physics,isStatic:true,collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}}),
      Bodies.rectangle(W+12,H/2,64,H*2,{...physics,isStatic:true,collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}})
    ];
    World.add(engine.world,walls);
  }

  function loadBest(){
    try{return Number(localStorage.getItem('gemTideBest')||0)}
    catch{return 0}
  }

  function saveBest(){
    try{localStorage.setItem('gemTideBest',String(best))}catch{}
  }

  function unlockAudio(){
    if(!audioCtx){
      try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch{}
    }
    if(audioCtx?.state==='suspended')audioCtx.resume();
  }

  function tone(freq,duration=.055,volume=.025,type='sine'){
    if(!audioCtx)return;
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.type=type;osc.frequency.value=freq;
    gain.gain.setValueAtTime(volume,audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();osc.stop(audioCtx.currentTime+duration);
  }

  function haptic(ms=7){
    try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}
  }

  function randomSpawnTier(){
    return Math.floor(Math.random()*5);
  }

  function resetGame(){
    clearTimeout(readyTimer);
    buildWorld();
    particles=[];floaters=[];
    score=0;
    currentTier=randomSpawnTier();
    nextTier=randomSpawnTier();
    bestTierReached=0;
    aimX=W/2;
    ready=true;running=true;paused=false;pointerActive=false;
    drops=0;dangerTime=0;cameraKick=0;
    dangerHud.hidden=true;
    gestureHint.classList.remove('hidden');
    scoreEl.textContent='0';
    drawPreview();
  }

  function createGem(x,y,tier,merged=false){
    const t=tiers[tier];
    const body=Bodies.circle(x,y,t.r*.965,{
      ...physics,
      collisionFilter:{category:CAT_GEM,mask:CAT_WORLD|CAT_GEM}
    });

    Body.setAngle(body,(Math.random()-.5)*.06);
    Body.setAngularVelocity(body,(Math.random()-.5)*.002);

    body.gem={
      tier,alive:true,merging:false,born:performance.now(),
      renderAngle:body.angle,lastX:x,lastY:y,hit:0,seed:Math.random(),
      popAt:merged?performance.now():0
    };

    World.add(engine.world,body);
    gems.push(body);
    return body;
  }

  function removeGem(body){
    if(!body?.gem?.alive)return;
    body.gem.alive=false;
    World.remove(engine.world,body);
    const i=gems.indexOf(body);
    if(i>=0)gems.splice(i,1);
  }

  function setReadyAfterDrop(){
    ready=false;
    clearTimeout(readyTimer);
    readyTimer=setTimeout(()=>{
      if(!running)return;
      ready=true;
      drawPreview();
    },DROP_DELAY);
  }

  function dropCurrent(){
    if(!running||paused||!ready)return;
    const t=tiers[currentTier];
    const x=clamp(aimX,WALL+t.r,W-WALL-t.r);
    createGem(x,DROP_Y,currentTier,false);
    tone(180,.04,.016,'triangle');
    haptic(5);

    currentTier=nextTier;
    nextTier=randomSpawnTier();
    drops++;
    if(drops>=2)gestureHint.classList.add('hidden');
    setReadyAfterDrop();
    drawPreview();
  }

  function mergePair(a,b){
    if(!a?.gem?.alive||!b?.gem?.alive||a.gem.merging||b.gem.merging)return;
    if(a.gem.tier!==b.gem.tier)return;

    a.gem.merging=true;b.gem.merging=true;
    const tier=a.gem.tier;
    const next=tier+1;
    const x=(a.position.x+b.position.x)/2;
    const y=(a.position.y+b.position.y)/2;

    removeGem(a);removeGem(b);

    if(next>=tiers.length){
      addScore(100);
      burst(x,y,tiers[tier].accent,26,175);
      floaters.push({x,y,text:'+100',life:.72,color:'#A15F81'});
      cameraKick=.9;
      tone(720,.14,.04,'sine');
      haptic([14,17,22]);
      return;
    }

    const n=createGem(x,y,next,true);
    n.gem.born=performance.now()-280;
    bestTierReached=Math.max(bestTierReached,next);

    addScore(tiers[next].score);
    burst(x,y,tiers[next].accent,9+Math.min(8,next),105+next*4);
    floaters.push({x,y,text:'+'+tiers[next].score,life:.54,color:'#6A4D70'});
    cameraKick=Math.max(cameraKick,next>=7?.65:.32);
    tone(265+next*43,.07+next*.004,.022+Math.min(.018,next*.0018),'sine');
    haptic(next>=8?14:7);
  }

  Events.on(engine,'collisionStart',event=>{
    for(const pair of event.pairs){
      const a=pair.bodyA,b=pair.bodyB;
      if(!a.gem||!b.gem){
        const g=a.gem?a:b.gem?b:null;
        if(g?.gem?.alive)g.gem.hit=Math.max(g.gem.hit,Math.min(.52,g.speed*.04));
        continue;
      }
      if(!a.gem.alive||!b.gem.alive)continue;
      const rel=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);
      a.gem.hit=Math.max(a.gem.hit,Math.min(.65,rel*.055));
      b.gem.hit=Math.max(b.gem.hit,Math.min(.65,rel*.055));
      if(a.gem.tier===b.gem.tier)mergePair(a,b);
    }
  });

  Events.on(engine,'collisionActive',event=>{
    for(const pair of event.pairs){
      const a=pair.bodyA,b=pair.bodyB;
      if(a.gem?.alive&&b.gem?.alive&&a.gem.tier===b.gem.tier)mergePair(a,b);
    }
  });

  function bumpScore(){
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('bump');
  }

  function addScore(points){
    score+=points;
    if(score>best){best=score;saveBest()}
    scoreEl.textContent=fmt(score);
    bestEl.textContent=fmt(best);
    bumpScore();
  }

  function burst(x,y,color,count=12,speed=105){
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2;
      const s=speed*(.30+Math.random()*.65);
      particles.push({
        x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
        life:.24+Math.random()*.23,max:.47,color,size:1.3+Math.random()*2.2
      });
    }
  }

  function updateEffects(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      p.vx*=Math.pow(.94,dt*60);
      p.vy=p.vy*Math.pow(.94,dt*60)+76*dt;
      if(p.life<=0)particles.splice(i,1);
    }
    for(let i=floaters.length-1;i>=0;i--){
      const f=floaters[i];
      f.life-=dt;f.y-=24*dt;
      if(f.life<=0)floaters.splice(i,1);
    }
    cameraKick=Math.max(0,cameraKick-dt*6.5);
  }

  function step(dtMs){
    if(!running||paused)return;

    Engine.update(engine,dtMs);
    const dt=dtMs/1000;
    const now=performance.now();

    for(const b of gems){
      if(!b.gem?.alive)continue;
      const t=tiers[b.gem.tier];
      b.gem.hit=Math.max(0,b.gem.hit-dt*3.7);

      const maxAV=.024;
      if(Math.abs(b.angularVelocity)>maxAV){
        Body.setAngularVelocity(b,Math.sign(b.angularVelocity)*maxAV);
      }

      const dx=b.position.x-b.gem.lastX;
      const roll=clamp(dx/Math.max(20,t.r*.965),-.055,.055);
      const bodyTurn=clamp(b.angularVelocity*.24,-.006,.006);
      b.gem.renderAngle+=roll*.78+bodyTurn;

      b.gem.lastX=b.position.x;
      b.gem.lastY=b.position.y;
    }

    updateEffects(dt);
    checkDanger(dt,now);
  }

  function checkDanger(dt,now){
    const high=gems.some(b=>{
      if(!b.gem?.alive)return false;
      const oldEnough=now-b.gem.born>800;
      const resting=b.isSleeping||b.speed<.34;
      return oldEnough&&resting&&b.bounds.min.y<LOSE_Y;
    });

    if(high)dangerTime+=dt;
    else dangerTime=Math.max(0,dangerTime-dt*4.5);

    dangerHud.hidden=dangerTime<.14;

    if(dangerTime>=1.55)endGame();
  }

  function endGame(){
    running=false;ready=false;pointerActive=false;
    dangerHud.hidden=true;
    finalScoreEl.textContent=fmt(score);
    bestMergeEl.textContent=tiers[bestTierReached].name;
    gameOverOverlay.classList.add('visible');
    haptic([36,26,36]);
  }

  function setPause(value){
    if(!running)return;
    paused=value;
    pauseOverlay.classList.toggle('visible',value);
  }

  function showToast(message){
    toast.textContent=message;toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('show'),1000);
  }

  function draw(){
    ctx.save();
    if(cameraKick>0&&!reducedMotion){
      const n=1.8*cameraKick;
      ctx.translate((Math.random()-.5)*n,(Math.random()-.5)*n);
    }

    drawBackground();
    drawLoseLine();
    drawDropper();

    const sorted=[...gems].filter(g=>g.gem?.alive).sort((a,b)=>a.position.y-b.position.y);
    for(const b of sorted){
      const pop=mergeScale(b.gem.popAt);
      drawGem(ctx,b.position.x,b.position.y,b.gem.tier,tiers[b.gem.tier].r,b.gem.renderAngle,b.gem.hit,1,pop);
    }

    drawParticles();
    drawFloaters();
    ctx.restore();
  }

  function mergeScale(popAt){
    if(!popAt)return 1;
    const t=clamp((performance.now()-popAt)/210,0,1);
    const base=.72+.28*(1-Math.pow(1-t,3));
    const overshoot=Math.sin(t*Math.PI)*.10;
    return base+overshoot;
  }

  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#FFF9F4');
    g.addColorStop(.55,'#F8EEF0');
    g.addColorStop(1,'#F2E7E9');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    const glow=ctx.createRadialGradient(W*.45,H*.72,20,W*.45,H*.72,H*.62);
    glow.addColorStop(0,'rgba(105,201,175,.105)');
    glow.addColorStop(.52,'rgba(168,148,223,.055)');
    glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

    ctx.save();
    for(let i=0;i<18;i++){
      ctx.globalAlpha=.055+(i%3)*.018;
      ctx.fillStyle=i%4===0?'#E7A5A0':'#9BCFC1';
      const x=(i*187.3)%W,y=(i*121.7)%H;
      ctx.beginPath();ctx.arc(x,y,.75+(i%2)*.3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle='rgba(86,62,91,.055)';
    ctx.fillRect(WALL-2,0,2,H);ctx.fillRect(W-WALL,0,2,H);
  }

  function drawLoseLine(){
    ctx.save();
    ctx.setLineDash([10,12]);
    ctx.lineWidth=dangerTime>.1?2:1.2;
    ctx.strokeStyle=dangerTime>.1?'rgba(211,79,99,.72)':'rgba(91,63,95,.12)';
    ctx.beginPath();ctx.moveTo(WALL+6,LOSE_Y);ctx.lineTo(W-WALL-6,LOSE_Y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign='center';ctx.font='800 14px Manrope, sans-serif';
    ctx.fillStyle=dangerTime>.1?'rgba(185,59,79,.80)':'rgba(91,63,95,.32)';
    ctx.fillText('LIMIT',W/2,LOSE_Y-10);
    ctx.restore();
  }

  function drawDropper(){
    if(!running||paused||!ready)return;
    const t=tiers[currentTier];
    const x=clamp(aimX,WALL+t.r,W-WALL-t.r);

    ctx.save();
    ctx.strokeStyle='rgba(90,61,97,.10)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(WALL+84,36);ctx.lineTo(W-WALL-84,36);ctx.stroke();

    ctx.strokeStyle='rgba(244,125,107,.78)';
    ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x-15,38);ctx.lineTo(x-7,50);
    ctx.moveTo(x+15,38);ctx.lineTo(x+7,50);
    ctx.stroke();
    ctx.restore();

    drawGem(ctx,x,DROP_Y,currentTier,t.r,0,0,1,1);
  }

  function sideGeometry(index,r){
    const p=tiers[index].profile;
    const table=r*p[0];
    const crown=r*p[1];
    const shoulder=r*p[2];
    const girdle=r*p[3];
    const pavilion=r*p[4];

    return {
      table,crown,shoulder,girdle,pavilion,
      outer:[
        {x:-table,y:-crown},{x:table,y:-crown},
        {x:shoulder,y:-r*.15},{x:girdle,y:-r*.035},
        {x:girdle,y:r*.035},{x:r*.32,y:pavilion*.67},
        {x:0,y:pavilion},
        {x:-r*.32,y:pavilion*.67},{x:-girdle,y:r*.035},
        {x:-girdle,y:-r*.035},{x:-shoulder,y:-r*.15}
      ]
    };
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
    const rr=Math.round(a.r+(b.r-a.r)*u);
    const gg=Math.round(a.g+(b.g-a.g)*u);
    const bb=Math.round(a.b+(b.b-a.b)*u);
    return 'rgba('+rr+','+gg+','+bb+','+alpha+')';
  }

  function lit(t,angle,normal,base=.16,range=.42){
    const incidence=Math.max(0,Math.cos((normal+angle)-LIGHT_ANGLE));
    return mix(t.dark,t.accent,base+incidence*range,.98);
  }

  function drawFacet(c,pts,fill){
    path(c,pts);c.fillStyle=fill;c.fill();
  }

  function drawGem(c,x,y,index,r,angle=0,hit=0,alpha=1,scale=1){
    const t=tiers[index];
    const g=sideGeometry(index,r*.92);

    c.save();
    c.translate(x,y);
    c.rotate(angle);

    const squash=1-Math.min(.035,hit*.026);
    c.scale(scale*(1+(1-squash)*.56),scale*squash);
    c.globalAlpha=alpha;

    c.save();
    path(c,g.outer);
    c.shadowColor='rgba(72,48,76,.23)';
    c.shadowBlur=8+r*.02;c.shadowOffsetY=4;
    c.fillStyle=t.dark;c.fill();
    c.restore();

    c.save();
    path(c,g.outer);c.clip();

    const leftTable={x:-g.table,y:-g.crown};
    const rightTable={x:g.table,y:-g.crown};
    const leftShoulder={x:-g.shoulder,y:-r*.15};
    const rightShoulder={x:g.shoulder,y:-r*.15};
    const leftGirdleTop={x:-g.girdle,y:-r*.035};
    const rightGirdleTop={x:g.girdle,y:-r*.035};
    const leftGirdleBottom={x:-g.girdle,y:r*.035};
    const rightGirdleBottom={x:g.girdle,y:r*.035};
    const leftPavilion={x:-r*.32,y:g.pavilion*.67};
    const rightPavilion={x:r*.32,y:g.pavilion*.67};
    const tip={x:0,y:g.pavilion};

    drawFacet(c,[leftTable,rightTable,{x:r*.34,y:-r*.16},{x:-r*.34,y:-r*.16}],lit(t,angle,-Math.PI/2,.28,.38));
    drawFacet(c,[leftTable,{x:-r*.34,y:-r*.16},leftShoulder],lit(t,angle,-2.55,.13,.50));
    drawFacet(c,[rightTable,rightShoulder,{x:r*.34,y:-r*.16}],lit(t,angle,-.60,.13,.50));
    drawFacet(c,[leftShoulder,{x:-r*.34,y:-r*.16},{x:0,y:-r*.10},leftGirdleTop],lit(t,angle,-2.85,.12,.46));
    drawFacet(c,[rightShoulder,rightGirdleTop,{x:0,y:-r*.10},{x:r*.34,y:-r*.16}],lit(t,angle,-.28,.12,.46));
    drawFacet(c,[leftGirdleTop,rightGirdleTop,rightGirdleBottom,leftGirdleBottom],mix(t.color,'#FFFFFF',.14,.96));

    drawFacet(c,[leftGirdleBottom,{x:0,y:r*.15},leftPavilion],lit(t,angle,2.75,.10,.47));
    drawFacet(c,[rightGirdleBottom,rightPavilion,{x:0,y:r*.15}],lit(t,angle,.39,.10,.47));
    drawFacet(c,[leftPavilion,{x:0,y:r*.15},tip],lit(t,angle,2.10,.11,.43));
    drawFacet(c,[{x:0,y:r*.15},rightPavilion,tip],lit(t,angle,1.03,.11,.43));
    drawFacet(c,[leftGirdleBottom,rightGirdleBottom,{x:0,y:r*.15}],mix(t.color,t.accent,.28,.90));

    const shine=c.createLinearGradient(-r*.42,-r*.45,r*.25,r*.45);
    shine.addColorStop(0,'rgba(255,255,255,.20)');
    shine.addColorStop(.32,'rgba(255,255,255,.045)');
    shine.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=shine;c.fillRect(-r,-r,r*2,r*2);

    c.restore();

    path(c,g.outer);
    c.lineWidth=Math.max(1.15,r*.011);
    c.strokeStyle='rgba(255,255,255,.42)';
    c.stroke();

    c.beginPath();
    c.moveTo(-g.girdle,r*.035);
    c.lineTo(g.girdle,r*.035);
    c.strokeStyle='rgba(67,46,71,.15)';
    c.lineWidth=Math.max(1,r*.008);
    c.stroke();

    const glint=Math.max(0,Math.cos((angle-.50)-LIGHT_ANGLE));
    if(alpha>.7&&glint>.97&&r>=32){
      const s=(2+r*.03)*clamp((glint-.97)/.03,0,1);
      c.save();c.translate(g.table*.45,-g.crown*.82);c.rotate(-angle);
      c.globalAlpha=.18+clamp((glint-.97)/.03,0,1)*.30;
      c.strokeStyle='#FFFFFF';c.lineWidth=1;
      c.beginPath();
      c.moveTo(-s,0);c.lineTo(s,0);
      c.moveTo(0,-s*.65);c.lineTo(0,s*.65);
      c.stroke();c.restore();
    }

    c.restore();
  }

  function drawParticles(){
    for(const p of particles){
      ctx.save();
      ctx.globalAlpha=Math.max(0,p.life/p.max);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size/2,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }

  function drawFloaters(){
    ctx.save();ctx.textAlign='center';
    for(const f of floaters){
      ctx.globalAlpha=Math.min(1,f.life*2);
      ctx.fillStyle=f.color;ctx.font='800 16px Manrope, sans-serif';
      ctx.fillText(f.text,f.x,f.y);
    }
    ctx.restore();
  }

  function drawPreview(){
    const c=nextPreview.getContext('2d');
    c.clearRect(0,0,nextPreview.width,nextPreview.height);
    const rr=Math.min(26,tiers[nextTier].r*.50);
    drawGem(c,44,32,nextTier,rr,-.08,0,1,1);
  }

  function pointerPos(e){
    const rect=canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left)*(W/rect.width),y:(e.clientY-rect.top)*(H/rect.height)};
  }

  canvas.addEventListener('pointerdown',e=>{
    if(!running||paused||!ready)return;
    e.preventDefault();unlockAudio();
    const p=pointerPos(e);
    pointerActive=true;aimX=p.x;
    try{canvas.setPointerCapture(e.pointerId)}catch{}
  });

  canvas.addEventListener('pointermove',e=>{
    if(!running||paused||!pointerActive||!ready)return;
    aimX=pointerPos(e).x;
  });

  canvas.addEventListener('pointerup',e=>{
    if(!running||paused||!pointerActive||!ready)return;
    e.preventDefault();
    aimX=pointerPos(e).x;
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
  $('restartFromPause').addEventListener('click',()=>{pauseOverlay.classList.remove('visible');resetGame()});
  $('startButton').addEventListener('click',()=>{unlockAudio();startOverlay.classList.remove('visible');resetGame()});
  $('restartButton').addEventListener('click',()=>{gameOverOverlay.classList.remove('visible');resetGame()});

  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)setPause(true)});
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
