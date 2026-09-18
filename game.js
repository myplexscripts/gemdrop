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
  const DROP_Y = 70;
  const JAM_Y = 142;
  const STEP_MS = 1000 / 60;
  const DROP_DELAY = 300;
  const LIGHT_ANGLE = -2.12;
  const CAT_GEM = 0x0001;
  const CAT_WORLD = 0x0002;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const bestEl = $('best');
  const nextPreview = $('nextPreview');
  const dangerHud = $('dangerHud');
  const gestureHint = $('gestureHint');
  const cutToast = $('cutToast');
  const startOverlay = $('startOverlay');
  const pauseOverlay = $('pauseOverlay');
  const gameOverOverlay = $('gameOverOverlay');
  const finalScoreEl = $('finalScore');
  const bestMergeEl = $('bestMerge');

  const tiers = [
    {name:'Quartz',     cut:'Brilliant',    r:30,  score:1,  color:'#D8E4EB', accent:'#FFFFFF', dark:'#83929C', profile:[.35,.34,.72,.94,.72,.00], facet:'brilliant'},
    {name:'Citrine',    cut:'Rose',         r:38,  score:3,  color:'#E9B13D', accent:'#FFE29A', dark:'#A96A1E', profile:[.22,.26,.66,.92,.52,.16], facet:'rose'},
    {name:'Peridot',    cut:'Cushion',      r:48,  score:6,  color:'#79BD5B', accent:'#C9E99E', dark:'#4A823B', profile:[.42,.32,.76,.94,.68,.06], facet:'mixed'},
    {name:'Aquamarine', cut:'Emerald Step', r:58,  score:10, color:'#42AFC1', accent:'#B7E4EA', dark:'#27727F', profile:[.56,.24,.80,.96,.58,.18], facet:'step'},
    {name:'Amethyst',   cut:'Princess',     r:70,  score:15, color:'#9569D3', accent:'#D4BCEC', dark:'#654493', profile:[.34,.42,.73,.93,.80,.00], facet:'kite'},
    {name:'Topaz',      cut:'Marquise',     r:82,  score:21, color:'#E87945', accent:'#F5BC94', dark:'#A94D31', profile:[.44,.28,.84,.98,.56,.03], facet:'long'},
    {name:'Sapphire',   cut:'Radiant',      r:96,  score:28, color:'#5276DD', accent:'#B6C7F2', dark:'#324E9C', profile:[.43,.34,.80,.96,.72,.08], facet:'radiant'},
    {name:'Emerald',    cut:'Asscher',      r:112, score:36, color:'#3CAA7F', accent:'#A4DCC3', dark:'#236F54', profile:[.58,.28,.82,.96,.64,.20], facet:'step'},
    {name:'Ruby',       cut:'Pear',         r:132, score:45, color:'#DA4B67', accent:'#F1A6B4', dark:'#9B3046', profile:[.30,.46,.76,.95,.82,.00], facet:'pear'},
    {name:'Starstone',  cut:'Old Mine',     r:154, score:55, color:'#8062C8', accent:'#C1AFE9', dark:'#523B8C', profile:[.30,.50,.76,.94,.86,.04], facet:'oldmine'},
    {name:'Crownstone', cut:'Royal',        r:180, score:66, color:'#E6A03A', accent:'#F7D884', dark:'#9E6122', profile:[.48,.38,.84,.98,.74,.10], facet:'royal'}
  ];

  const engine = Engine.create({ enableSleeping:true });
  engine.gravity.x = 0;
  engine.gravity.y = 1;
  engine.gravity.scale = .00108;
  engine.positionIterations = 12;
  engine.velocityIterations = 10;
  engine.constraintIterations = 4;

  const physics = {
    friction:.085,
    frictionStatic:.16,
    frictionAir:.0025,
    restitution:.065,
    density:.001
  };

  let gems = [];
  let walls = [];
  let particles = [];
  let floaters = [];
  let flashes = [];
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
  let cutToastTimer = null;
  let audioCtx = null;
  let cameraKick = 0;
  let mergeWindow = 0;
  let mergeChain = 0;
  let discoveredCuts = new Set([0]);
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  bestEl.textContent = fmt(best);
  buildWorld();
  drawPreview();

  function buildWorld() {
    Composite.clear(engine.world,false,true);
    gems = [];
    walls = [
      Bodies.rectangle(W/2,FLOOR+120,W+160,240,{
        ...physics,
        isStatic:true,
        friction:.14,
        frictionStatic:.24,
        restitution:.02,
        collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}
      }),
      Bodies.rectangle(-28,H/2,96,H*2,{
        ...physics,
        isStatic:true,
        friction:.11,
        frictionStatic:.20,
        restitution:.03,
        collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}
      }),
      Bodies.rectangle(W+28,H/2,96,H*2,{
        ...physics,
        isStatic:true,
        friction:.11,
        frictionStatic:.20,
        restitution:.03,
        collisionFilter:{category:CAT_WORLD,mask:CAT_GEM}
      })
    ];
    World.add(engine.world,walls);
  }

  function loadBest(){
    try{
      const current=localStorage.getItem('gemDropBest');
      if(current!=null)return Number(current||0);
      return Number(localStorage.getItem('gemTideBest')||0);
    }catch{return 0}
  }

  function saveBest(){
    try{localStorage.setItem('gemDropBest',String(best))}catch{}
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
    osc.type=type;
    osc.frequency.value=freq;
    gain.gain.setValueAtTime(volume,audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime+duration);
  }

  function haptic(ms=7){
    try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}
  }

  function randomSpawnTier(){
    const r=Math.random();
    return r<.30?0:r<.56?1:r<.78?2:r<.93?3:4;
  }

  function resetGame(){
    clearTimeout(readyTimer);
    clearTimeout(cutToastTimer);
    buildWorld();
    particles=[];floaters=[];flashes=[];
    score=0;
    currentTier=randomSpawnTier();
    nextTier=randomSpawnTier();
    bestTierReached=0;
    aimX=W/2;
    ready=true;running=true;paused=false;pointerActive=false;
    drops=0;dangerTime=0;cameraKick=0;mergeWindow=0;mergeChain=0;
    discoveredCuts=new Set([0]);
    dangerHud.hidden=true;
    cutToast.classList.remove('show');
    gestureHint.classList.remove('hidden');
    scoreEl.textContent='0';
    drawPreview();
  }

  function polygonCentroid(points){
    let area=0,cx=0,cy=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const cross=a.x*b.y-b.x*a.y;
      area+=cross;
      cx+=(a.x+b.x)*cross;
      cy+=(a.y+b.y)*cross;
    }
    area*=.5;
    if(Math.abs(area)<.00001)return{x:0,y:0};
    return{x:cx/(6*area),y:cy/(6*area)};
  }

  function sideGeometry(index,r){
    const p=tiers[index].profile;
    const table=r*p[0];
    const crown=r*p[1];
    const shoulder=r*p[2];
    const girdle=r*p[3];
    const pavilion=r*p[4];
    const culet=r*p[5];

    let raw;
    if(tiers[index].facet==='rose'){
      raw=[
        {x:0,y:-crown*1.18},
        {x:girdle*.48,y:-crown*.62},
        {x:girdle,y:-r*.02},
        {x:girdle*.90,y:r*.10},
        {x:culet,y:pavilion*.92},
        {x:-culet,y:pavilion*.92},
        {x:-girdle*.90,y:r*.10},
        {x:-girdle,y:-r*.02},
        {x:-girdle*.48,y:-crown*.62}
      ];
    }else{
      raw=[
        {x:-table,y:-crown},{x:table,y:-crown},
        {x:shoulder,y:-r*.17},{x:girdle,y:-r*.04},
        {x:girdle,y:r*.04},{x:r*.34,y:pavilion*.66},
        {x:culet,y:pavilion},{x:-culet,y:pavilion},
        {x:-r*.34,y:pavilion*.66},{x:-girdle,y:r*.04},
        {x:-girdle,y:-r*.04},{x:-shoulder,y:-r*.17}
      ];
    }

    const center=polygonCentroid(raw);
    return{
      outer:raw.map(v=>({x:v.x-center.x,y:v.y-center.y})),
      center,
      table,crown,shoulder,girdle,pavilion,culet
    };
  }

  function createGem(x,y,tier,merged=false){
    const t=tiers[tier];
    const visualR=t.r*.985;
    const geo=sideGeometry(tier,visualR);
    const verts=geo.outer.map(v=>({x:v.x,y:v.y}));
    const body=Bodies.fromVertices(x,y,[verts],{
      ...physics,
      slop:.02,
      collisionFilter:{category:CAT_GEM,mask:CAT_WORLD|CAT_GEM}
    },true,.005,2,.005);

    Body.setAngle(body,(Math.random()-.5)*.06);
    Body.setAngularVelocity(body,(Math.random()-.5)*.001);
    Body.setInertia(body,body.inertia*2.35);

    body.gem={
      tier,alive:true,merging:false,born:performance.now(),
      renderAngle:body.angle,hit:0,popAt:merged?performance.now():0,
      lastImpact:0
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
    tone(176,.04,.015,'triangle');
    haptic(5);

    currentTier=nextTier;
    nextTier=randomSpawnTier();
    drops++;
    if(drops>=2)gestureHint.classList.add('hidden');
    setReadyAfterDrop();
    drawPreview();
  }

  function showCutToast(text){
    cutToast.textContent=text;
    cutToast.classList.add('show');
    clearTimeout(cutToastTimer);
    cutToastTimer=setTimeout(()=>cutToast.classList.remove('show'),1150);
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

    mergeChain=mergeWindow>0?mergeChain+1:1;
    mergeWindow=.70;

    if(next>=tiers.length){
      addScore(100);
      burst(x,y,tiers[tier].accent,28,185,true);
      flashes.push({x,y,r:18,life:.42,max:.42,color:tiers[tier].accent});
      floaters.push({x,y,text:'MASTER CUT +100',life:.85,color:'#F3C698'});
      cameraKick=.90;
      tone(760,.16,.045,'sine');
      haptic([14,17,22]);
      return;
    }

    const n=createGem(x,y,next,true);
    n.gem.born=performance.now()-260;
    bestTierReached=Math.max(bestTierReached,next);

    addScore(tiers[next].score);
    burst(x,y,tiers[next].accent,14+Math.min(12,next),126+next*6,true);
    flashes.push({x,y,r:12,life:.36,max:.36,color:tiers[next].accent});
    const label=mergeChain>=2?mergeChain+'× CHAIN +'+tiers[next].score:'+'+tiers[next].score;
    floaters.push({x,y,text:label,life:.62,color:'#F0D8CA'});
    cameraKick=Math.max(cameraKick,next>=7?.82:.42);
    tone(270+next*42,.07+next*.004,.023+Math.min(.02,next*.002),'sine');
    haptic(next>=8?15:8);

    if(!discoveredCuts.has(next)){
      discoveredCuts.add(next);
      showCutToast('✨ '+tiers[next].name+' '+tiers[next].cut+' unlocked');
    }
  }

  Events.on(engine,'collisionStart',event=>{
    const now=performance.now();
    for(const pair of event.pairs){
      const a=pair.bodyA,b=pair.bodyB;

      if(!a.gem||!b.gem){
        const g=a.gem?a:b.gem?b:null;
        if(g?.gem?.alive){
          g.gem.hit=Math.max(g.gem.hit,Math.min(.55,g.speed*.045));
          if(now-g.gem.lastImpact>150&&g.speed>2.1){
            g.gem.lastImpact=now;
            landingDust(g.position.x,g.bounds.max.y,tiers[g.gem.tier].accent,g.speed);
            if(g.speed>3.2)haptic(3);
          }
        }
        continue;
      }

      if(!a.gem.alive||!b.gem.alive)continue;
      const rel=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);
      a.gem.hit=Math.max(a.gem.hit,Math.min(.7,rel*.06));
      b.gem.hit=Math.max(b.gem.hit,Math.min(.7,rel*.06));

      if(rel>2.5){
        const mx=(a.position.x+b.position.x)/2;
        const my=(a.position.y+b.position.y)/2;
        contactSpark(mx,my,tiers[Math.max(a.gem.tier,b.gem.tier)].accent,rel);
      }

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

  function burst(x,y,color,count=12,speed=105,shards=false){
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2;
      const s=speed*(.30+Math.random()*.68);
      particles.push({
        x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
        life:.24+Math.random()*.28,max:.52,color,
        size:1.3+Math.random()*(shards?3.2:2.2),
        shard:shards&&Math.random()>.45,
        rot:Math.random()*Math.PI
      });
    }
  }

  function landingDust(x,y,color,speed){
    const count=Math.min(8,3+Math.floor(speed));
    for(let i=0;i<count;i++){
      particles.push({
        x:x+(Math.random()-.5)*12,y:y-2,
        vx:(Math.random()-.5)*38,vy:-18-Math.random()*28,
        life:.18+Math.random()*.14,max:.32,color,
        size:1.2+Math.random()*1.4,shard:false,rot:0
      });
    }
  }

  function contactSpark(x,y,color,speed){
    const count=Math.min(5,2+Math.floor(speed/2));
    for(let i=0;i<count;i++){
      const a=-Math.PI*.9+Math.random()*Math.PI*.8;
      particles.push({
        x,y,vx:Math.cos(a)*55,vy:Math.sin(a)*55,
        life:.12+Math.random()*.08,max:.20,color:'#FFFFFF',
        size:1.1+Math.random()*1.3,shard:false,rot:0
      });
    }
  }

  function updateEffects(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=dt*4;
      p.vx*=Math.pow(.94,dt*60);
      p.vy=p.vy*Math.pow(.94,dt*60)+80*dt;
      if(p.life<=0)particles.splice(i,1);
    }

    for(let i=floaters.length-1;i>=0;i--){
      const f=floaters[i];
      f.life-=dt;f.y-=24*dt;
      if(f.life<=0)floaters.splice(i,1);
    }

    for(let i=flashes.length-1;i>=0;i--){
      const f=flashes[i];
      f.life-=dt;f.r+=dt*150;
      if(f.life<=0)flashes.splice(i,1);
    }

    cameraKick=Math.max(0,cameraKick-dt*6.5);
    mergeWindow=Math.max(0,mergeWindow-dt);
    if(mergeWindow<=0)mergeChain=0;
  }

  function step(dtMs){
    if(!running||paused)return;
    Engine.update(engine,dtMs);
    const dt=dtMs/1000;
    const now=performance.now();

    for(const b of gems){
      if(!b.gem?.alive)continue;
      b.gem.hit=Math.max(0,b.gem.hit-dt*3.7);

      const maxAV=.012;
      if(Math.abs(b.angularVelocity)>maxAV){
        Body.setAngularVelocity(b,Math.sign(b.angularVelocity)*maxAV);
      }

      // Matter.js uses discrete timesteps. Dense piles can briefly squeeze a
      // sharp gem deeply into the floor, so cap extreme fall speed and keep
      // the entire collision body above the basin floor.
      if(b.velocity.y>11){
        Body.setVelocity(b,{x:b.velocity.x,y:11});
      }
      if(b.bounds.max.y>FLOOR+1){
        const correction=(FLOOR-1)-b.bounds.max.y;
        Body.translate(b,{x:0,y:correction});
        if(b.velocity.y>0){
          Body.setVelocity(b,{x:b.velocity.x*.92,y:-Math.min(.35,b.velocity.y*.06)});
        }
      }

      if(b.bounds.min.x<WALL-1){
        Body.translate(b,{x:(WALL+1)-b.bounds.min.x,y:0});
        if(b.velocity.x<0)Body.setVelocity(b,{x:Math.abs(b.velocity.x)*.05,y:b.velocity.y});
      }else if(b.bounds.max.x>W-WALL+1){
        Body.translate(b,{x:(W-WALL-1)-b.bounds.max.x,y:0});
        if(b.velocity.x>0)Body.setVelocity(b,{x:-Math.abs(b.velocity.x)*.05,y:b.velocity.y});
      }

      b.gem.renderAngle=b.angle;
    }

    updateEffects(dt);
    checkDanger(dt,now);
  }

  function checkDanger(dt,now){
    const high=gems.some(b=>{
      if(!b.gem?.alive)return false;
      const oldEnough=now-b.gem.born>780;
      const resting=b.isSleeping||b.speed<.36;
      return oldEnough&&resting&&b.bounds.min.y<JAM_Y;
    });

    if(high)dangerTime+=dt;
    else dangerTime=Math.max(0,dangerTime-dt*4.8);

    dangerHud.hidden=dangerTime<.14;
    if(dangerTime>=1.65)endGame();
  }

  function endGame(){
    running=false;ready=false;pointerActive=false;
    dangerHud.hidden=true;
    finalScoreEl.textContent=fmt(score);
    const finest=tiers[bestTierReached];
    bestMergeEl.textContent=finest.name+' '+finest.cut;
    gameOverOverlay.classList.add('visible');
    haptic([36,26,36]);
  }

  function setPause(value){
    if(!running)return;
    paused=value;
    pauseOverlay.classList.toggle('visible',value);
  }

  function draw(){
    ctx.save();
    if(cameraKick>0&&!reducedMotion){
      const n=1.8*cameraKick;
      ctx.translate((Math.random()-.5)*n,(Math.random()-.5)*n);
    }

    drawBackground();
    drawChamber();
    drawJamLine();
    drawDropper();

    const sorted=[...gems].filter(g=>g.gem?.alive).sort((a,b)=>a.position.y-b.position.y);
    for(const b of sorted){
      const pop=mergeScale(b.gem.popAt);
      drawGem(ctx,b.position.x,b.position.y,b.gem.tier,tiers[b.gem.tier].r,b.gem.renderAngle,b.gem.hit,1,pop);
    }

    drawFlashes();
    drawParticles();
    drawFloaters();
    ctx.restore();
  }

  function mergeScale(popAt){
    if(!popAt)return 1;
    const t=clamp((performance.now()-popAt)/180,0,1);
    return .76+.24*(1-Math.pow(1-t,3));
  }

  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#2b0c3a');
    g.addColorStop(.46,'#1b0828');
    g.addColorStop(1,'#120719');
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);

    const bloom=ctx.createRadialGradient(W*.5,H*.80,20,W*.5,H*.80,H*.72);
    bloom.addColorStop(0,'rgba(221,62,170,.11)');
    bloom.addColorStop(.42,'rgba(123,58,215,.07)');
    bloom.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bloom;
    ctx.fillRect(0,0,W,H);

    const now=performance.now()*.00035;
    ctx.save();
    for(let i=0;i<34;i++){
      const x=(i*173.7)%W;
      const baseY=(i*109.3)%H;
      const y=(baseY + Math.sin(now+i*.9)*4 + H)%H;
      const twinkle=.28+.22*Math.sin(now*2+i*1.7);
      ctx.globalAlpha=Math.max(.05,twinkle);
      ctx.fillStyle=i%4===0?'#ffc65b':i%3===0?'#f66ac5':'#b783ff';
      ctx.beginPath();
      ctx.arc(x,y,.65+(i%3)*.28,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawChamber(){
    ctx.save();

    const gold=ctx.createLinearGradient(0,0,W,0);
    gold.addColorStop(0,'#7c2a4a');
    gold.addColorStop(.08,'#f3a22d');
    gold.addColorStop(.22,'#ffd878');
    gold.addColorStop(.50,'#f7b633');
    gold.addColorStop(.78,'#ffd878');
    gold.addColorStop(.92,'#f3a22d');
    gold.addColorStop(1,'#7c2a4a');

    ctx.fillStyle=gold;
    ctx.fillRect(WALL,18,W-WALL*2,7);
    ctx.fillRect(WALL,H-27,W-WALL*2,10);

    const side=ctx.createLinearGradient(0,0,0,H);
    side.addColorStop(0,'#f7b13a');
    side.addColorStop(.16,'#ffd76d');
    side.addColorStop(.60,'#b84465');
    side.addColorStop(1,'#f2a631');
    ctx.fillStyle=side;
    ctx.fillRect(WALL-2,18,6,H-45);
    ctx.fillRect(W-WALL-4,18,6,H-45);

    ctx.globalAlpha=.55;
    ctx.fillStyle='#fff1bd';
    ctx.fillRect(WALL,18,W-WALL*2,1);
    ctx.fillRect(WALL,H-27,W-WALL*2,1);

    // Soft jewel glow in the lower basin.
    const floorGlow=ctx.createLinearGradient(0,H-120,0,H);
    floorGlow.addColorStop(0,'rgba(255,78,178,0)');
    floorGlow.addColorStop(1,'rgba(255,94,194,.12)');
    ctx.fillStyle=floorGlow;
    ctx.fillRect(WALL,H-120,W-WALL*2,100);

    ctx.restore();
  }

  function drawJamLine(){
    const active=dangerTime>.08;
    const pulse=.55+.25*Math.sin(performance.now()*.008);
    ctx.save();

    const glow=ctx.createLinearGradient(WALL+10,0,W-WALL-10,0);
    glow.addColorStop(0,'rgba(255,184,58,0)');
    glow.addColorStop(.08,active?'rgba(255,93,128,.88)':'rgba(255,188,62,.48)');
    glow.addColorStop(.50,active?'rgba(255,108,138,.98)':'rgba(255,216,111,.76)');
    glow.addColorStop(.92,active?'rgba(255,93,128,.88)':'rgba(255,188,62,.48)');
    glow.addColorStop(1,'rgba(255,184,58,0)');

    ctx.globalAlpha=active?pulse:1;
    ctx.strokeStyle=glow;
    ctx.lineWidth=active?2.6:1.7;
    ctx.shadowColor=active?'#ff577f':'#ffc34c';
    ctx.shadowBlur=active?13:7;
    ctx.beginPath();
    ctx.moveTo(WALL+16,JAM_Y);
    ctx.lineTo(W-WALL-16,JAM_Y);
    ctx.stroke();

    for(const x of [WALL+18,W-WALL-18]){
      ctx.save();
      ctx.translate(x,JAM_Y);
      ctx.rotate(Math.PI/4);
      ctx.fillStyle=active?'#ff8ca6':'#ffd66c';
      ctx.shadowColor=ctx.fillStyle;
      ctx.shadowBlur=9;
      ctx.fillRect(-4,-4,8,8);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawDropper(){
    if(!running||paused||!ready)return;
    const t=tiers[currentTier];
    const x=clamp(aimX,WALL+t.r,W-WALL-t.r);
    const time=performance.now()*.001;

    ctx.save();

    const crown=ctx.createLinearGradient(x-30,0,x+30,0);
    crown.addColorStop(0,'#8a3159');
    crown.addColorStop(.18,'#f6a72e');
    crown.addColorStop(.50,'#ffe07c');
    crown.addColorStop(.82,'#f6a72e');
    crown.addColorStop(1,'#8a3159');

    ctx.fillStyle=crown;
    ctx.shadowColor='#ffbb42';
    ctx.shadowBlur=10;
    ctx.beginPath();
    ctx.moveTo(x-31,20);
    ctx.lineTo(x-22,42);
    ctx.lineTo(x-14,34);
    ctx.lineTo(x-7,45);
    ctx.lineTo(x,31);
    ctx.lineTo(x+7,45);
    ctx.lineTo(x+14,34);
    ctx.lineTo(x+22,42);
    ctx.lineTo(x+31,20);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.fillStyle='#2b0c35';
    ctx.beginPath();
    ctx.ellipse(x,45,16,7,0,0,Math.PI*2);
    ctx.fill();

    for(let i=0;i<5;i++){
      const yy=52+i*8+Math.sin(time*3+i)*1.5;
      ctx.globalAlpha=.75-i*.10;
      ctx.fillStyle=i%2?'#ffca5e':'#f47ad2';
      ctx.shadowColor=ctx.fillStyle;
      ctx.shadowBlur=6;
      ctx.beginPath();
      ctx.arc(x,yy,1.6-i*.13,0,Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
    drawGem(ctx,x,DROP_Y,currentTier,t.r,0,0,1,1);
  }

  function path(c,pts){
    c.beginPath();
    pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.closePath();
  }

  function hexRgb(hex){
    const s=hex.replace('#','');
    const n=parseInt(s.length===3?s.split('').map(v=>v+v).join(''):s,16);
    return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  }

  function mix(aHex,bHex,t,alpha=1){
    const a=hexRgb(aHex),b=hexRgb(bHex),u=clamp(t,0,1);
    const rr=Math.round(a.r+(b.r-a.r)*u);
    const gg=Math.round(a.g+(b.g-a.g)*u);
    const bb=Math.round(a.b+(b.b-a.b)*u);
    return'rgba('+rr+','+gg+','+bb+','+alpha+')';
  }

  function lit(t,angle,normal,base=.16,range=.42){
    const incidence=Math.max(0,Math.cos((normal+angle)-LIGHT_ANGLE));
    return mix(t.dark,t.accent,base+incidence*range,.98);
  }

  function facet(c,pts,fill){
    path(c,pts);c.fillStyle=fill;c.fill();
  }

  function shiftedPoint(p,center){return{x:p.x-center.x,y:p.y-center.y}}

  function drawGem(c,x,y,index,r,angle=0,hit=0,alpha=1,scale=1){
    const t=tiers[index];
    const rr=r*.93;
    const geo=sideGeometry(index,rr);
    const g=geo;
    const center=g.center;
    const P=(px,py)=>({x:px-center.x,y:py-center.y});

    c.save();
    c.translate(x,y);
    c.rotate(angle);

    const squash=1-Math.min(.032,hit*.024);
    c.scale(scale*(1+(1-squash)*.52),scale*squash);
    c.globalAlpha=alpha;

    c.save();
    path(c,g.outer);
    c.shadowColor='rgba(8,4,7,.50)';
    c.shadowBlur=10+r*.032;
    c.shadowOffsetY=4;
    c.fillStyle=t.dark;
    c.fill();
    c.restore();

    c.save();
    path(c,g.outer);
    c.clip();

    const tableL=P(-g.table,-g.crown);
    const tableR=P(g.table,-g.crown);
    const shoulderL=P(-g.shoulder,-rr*.17);
    const shoulderR=P(g.shoulder,-rr*.17);
    const girdleLT=P(-g.girdle,-rr*.04);
    const girdleRT=P(g.girdle,-rr*.04);
    const girdleLB=P(-g.girdle,rr*.04);
    const girdleRB=P(g.girdle,rr*.04);
    const lowerL=P(-rr*.34,g.pavilion*.66);
    const lowerR=P(rr*.34,g.pavilion*.66);
    const culetL=P(-g.culet,g.pavilion);
    const culetR=P(g.culet,g.pavilion);
    const coreTop=P(0,-rr*.09);
    const coreMid=P(0,rr*.16);

    if(t.facet==='rose'){
      const apex=P(0,-g.crown*1.18);
      const leftMid=P(-g.girdle*.48,-g.crown*.62);
      const rightMid=P(g.girdle*.48,-g.crown*.62);
      facet(c,[apex,rightMid,coreMid],lit(t,angle,-1.0,.18,.48));
      facet(c,[apex,coreMid,leftMid],lit(t,angle,-2.15,.14,.48));
      facet(c,[leftMid,coreMid,girdleLB],lit(t,angle,-2.75,.12,.42));
      facet(c,[rightMid,girdleRB,coreMid],lit(t,angle,-.38,.12,.42));
      facet(c,[girdleLB,girdleRB,culetR,culetL],mix(t.color,t.dark,.22,.96));
      c.beginPath();c.moveTo(leftMid.x,leftMid.y);c.lineTo(girdleRB.x,girdleRB.y);
      c.strokeStyle='rgba(255,255,255,.17)';c.lineWidth=Math.max(1,rr*.01);c.stroke();
    }else if(t.facet==='step'){
      facet(c,[tableL,tableR,P(g.shoulder*.72,-rr*.15),P(-g.shoulder*.72,-rr*.15)],lit(t,angle,-Math.PI/2,.27,.34));
      facet(c,[P(-g.shoulder*.72,-rr*.15),P(g.shoulder*.72,-rr*.15),girdleRT,girdleLT],mix(t.color,t.accent,.20,.96));
      facet(c,[girdleLB,girdleRB,P(rr*.56,g.pavilion*.45),P(-rr*.56,g.pavilion*.45)],lit(t,angle,1.2,.12,.38));
      facet(c,[P(-rr*.56,g.pavilion*.45),P(rr*.56,g.pavilion*.45),culetR,culetL],mix(t.dark,t.color,.35,.96));
      const lines=[-.02,.16,.34];
      for(const k of lines){
        const yy=P(0,rr*k).y;
        c.beginPath();
        c.moveTo(-g.girdle*.72,yy);
        c.lineTo(g.girdle*.72,yy);
        c.strokeStyle='rgba(255,255,255,.11)';
        c.lineWidth=Math.max(1,rr*.008);
        c.stroke();
      }
    }else{
      facet(c,[tableL,tableR,P(rr*.34,-rr*.16),P(-rr*.34,-rr*.16)],lit(t,angle,-Math.PI/2,.28,.37));
      facet(c,[tableL,P(-rr*.34,-rr*.16),shoulderL],lit(t,angle,-2.55,.13,.50));
      facet(c,[tableR,shoulderR,P(rr*.34,-rr*.16)],lit(t,angle,-.60,.13,.50));
      facet(c,[shoulderL,P(-rr*.34,-rr*.16),coreTop,girdleLT],lit(t,angle,-2.85,.12,.46));
      facet(c,[shoulderR,girdleRT,coreTop,P(rr*.34,-rr*.16)],lit(t,angle,-.28,.12,.46));
      facet(c,[girdleLT,girdleRT,girdleRB,girdleLB],mix(t.color,'#FFFFFF',.12,.96));
      facet(c,[girdleLB,coreMid,lowerL],lit(t,angle,2.75,.10,.47));
      facet(c,[girdleRB,lowerR,coreMid],lit(t,angle,.39,.10,.47));
      facet(c,[lowerL,coreMid,culetL],lit(t,angle,2.10,.11,.43));
      facet(c,[coreMid,lowerR,culetR],lit(t,angle,1.03,.11,.43));
      facet(c,[culetL,coreMid,culetR],mix(t.dark,t.color,.36,.94));

      if(t.facet==='radiant'||t.facet==='royal'||t.facet==='oldmine'){
        c.beginPath();
        c.moveTo(tableL.x,tableL.y);
        c.lineTo(lowerR.x,lowerR.y);
        c.moveTo(tableR.x,tableR.y);
        c.lineTo(lowerL.x,lowerL.y);
        c.strokeStyle='rgba(255,255,255,.12)';
        c.lineWidth=Math.max(1,rr*.008);
        c.stroke();
      }

      if(t.facet==='kite'||t.facet==='pear'||t.facet==='long'){
        c.beginPath();
        c.moveTo(coreTop.x,coreTop.y);
        c.lineTo(culetL.x,culetL.y);
        c.moveTo(coreTop.x,coreTop.y);
        c.lineTo(culetR.x,culetR.y);
        c.strokeStyle='rgba(255,255,255,.14)';
        c.lineWidth=Math.max(1,rr*.008);
        c.stroke();
      }
    }

    const sheen=c.createLinearGradient(-rr*.45,-rr*.42,rr*.28,rr*.42);
    sheen.addColorStop(0,'rgba(255,255,255,.18)');
    sheen.addColorStop(.28,'rgba(255,255,255,.04)');
    sheen.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=sheen;
    c.fillRect(-rr,-rr,rr*2,rr*2);

    c.restore();

    path(c,g.outer);
    c.lineWidth=Math.max(1.1,rr*.0105);
    c.strokeStyle='rgba(255,255,255,.48)';
    c.stroke();

    const glint=Math.max(0,Math.cos((angle-.50)-LIGHT_ANGLE));
    if(alpha>.7&&glint>.97&&r>=38){
      const s=(2+rr*.026)*clamp((glint-.97)/.03,0,1);
      c.save();
      c.translate(P(g.table*.45,-g.crown*.82).x,P(g.table*.45,-g.crown*.82).y);
      c.rotate(-angle);
      c.globalAlpha=.16+clamp((glint-.97)/.03,0,1)*.27;
      c.strokeStyle='#FFFFFF';
      c.lineWidth=1;
      c.beginPath();
      c.moveTo(-s,0);c.lineTo(s,0);
      c.moveTo(0,-s*.65);c.lineTo(0,s*.65);
      c.stroke();
      c.restore();
    }

    c.restore();
  }

  function drawFlashes(){
    for(const f of flashes){
      const a=Math.max(0,f.life/f.max);
      const glow=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);
      glow.addColorStop(0,mix('#FFFFFF',f.color,.22,.18*a));
      glow.addColorStop(.5,mix(f.color,'#FFFFFF',.15,.10*a));
      glow.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=glow;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();

      ctx.save();
      ctx.globalAlpha=.22*a;
      ctx.strokeStyle=f.color;
      ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r*.72,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles(){
    for(const p of particles){
      ctx.save();
      ctx.globalAlpha=Math.max(0,p.life/p.max);
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot||0);
      ctx.fillStyle=p.color;
      if(p.shard){
        ctx.beginPath();
        ctx.moveTo(0,-p.size);
        ctx.lineTo(p.size*.65,p.size*.65);
        ctx.lineTo(-p.size*.65,p.size*.65);
        ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloaters(){
    ctx.save();ctx.textAlign='center';
    for(const f of floaters){
      ctx.globalAlpha=Math.min(1,f.life*2);
      ctx.fillStyle=f.color;
      ctx.font='800 16px Manrope, sans-serif';
      ctx.shadowColor='rgba(0,0,0,.28)';
      ctx.shadowBlur=4;
      ctx.fillText(f.text,f.x,f.y);
    }
    ctx.restore();
  }

  function drawPreview(){
    const c=nextPreview.getContext('2d');
    c.clearRect(0,0,nextPreview.width,nextPreview.height);
    const rr=Math.min(28,tiers[nextTier].r*.50);
    drawGem(c,44,32,nextTier,rr,-.06,0,1,1);
  }

  function pointerPos(e){
    const rect=canvas.getBoundingClientRect();
    return{x:(e.clientX-rect.left)*(W/rect.width),y:(e.clientY-rect.top)*(H/rect.height)};
  }

  canvas.addEventListener('pointerdown',e=>{
    if(!running||paused||!ready)return;
    e.preventDefault();unlockAudio();
    const p=pointerPos(e);
    pointerActive=true;
    aimX=p.x;
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
