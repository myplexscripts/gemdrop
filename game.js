(() => {
  'use strict';

  if (!window.Phaser) return;

  const W = 640;
  const H = 864;
  const WALL = 27;
  const FLOOR = 833;
  const DROP_Y = 74;
  const LIMIT_Y = 146;
  const DROP_DELAY = 280;

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
    {name:'Quartz',     cut:'Brilliant',    r:34,  score:1,  color:'#D8E4EB', accent:'#FFFFFF', dark:'#83929C', profile:[.34,.58,.70,.86,.80,.00], facet:'brilliant'},
    {name:'Citrine',    cut:'Rose',         r:42,  score:3,  color:'#E9B13D', accent:'#FFE29A', dark:'#A96A1E', profile:[.22,.54,.65,.86,.58,.12], facet:'rose'},
    {name:'Peridot',    cut:'Cushion',      r:50,  score:6,  color:'#79BD5B', accent:'#C9E99E', dark:'#4A823B', profile:[.40,.57,.72,.87,.76,.05], facet:'mixed'},
    {name:'Aquamarine', cut:'Emerald Step', r:60,  score:10, color:'#42AFC1', accent:'#B7E4EA', dark:'#27727F', profile:[.52,.48,.76,.88,.68,.14], facet:'step'},
    {name:'Amethyst',   cut:'Princess',     r:72,  score:15, color:'#9569D3', accent:'#D4BCEC', dark:'#654493', profile:[.32,.60,.69,.86,.84,.00], facet:'kite'},
    {name:'Topaz',      cut:'Marquise',     r:84,  score:21, color:'#E87945', accent:'#F5BC94', dark:'#A94D31', profile:[.45,.47,.80,.89,.65,.03], facet:'long'},
    {name:'Sapphire',   cut:'Radiant',      r:98,  score:28, color:'#5276DD', accent:'#B6C7F2', dark:'#324E9C', profile:[.42,.54,.76,.88,.78,.07], facet:'radiant'},
    {name:'Emerald',    cut:'Asscher',      r:112, score:36, color:'#3CAA7F', accent:'#A4DCC3', dark:'#236F54', profile:[.54,.48,.78,.88,.70,.14], facet:'step'},
    {name:'Ruby',       cut:'Pear',         r:130, score:45, color:'#DA4B67', accent:'#F1A6B4', dark:'#9B3046', profile:[.30,.62,.72,.87,.86,.00], facet:'pear'},
    {name:'Starstone',  cut:'Old Mine',     r:150, score:55, color:'#8062C8', accent:'#C1AFE9', dark:'#523B8C', profile:[.30,.65,.72,.86,.88,.04], facet:'oldmine'},
    {name:'Crownstone', cut:'Royal',        r:172, score:66, color:'#E6A03A', accent:'#F7D884', dark:'#9E6122', profile:[.45,.56,.80,.90,.80,.09], facet:'royal'}
  ];

  let audioCtx = null;

  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
  }

  function tone(freq, duration=.055, volume=.023, type='sine') {
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

  function haptic(value=7) {
    try { if (navigator.vibrate) navigator.vibrate(value); } catch {}
  }

  function clamp(v,min,max) {
    return Math.max(min,Math.min(max,v));
  }

  function fmt(n) {
    return Math.max(0,Math.floor(n)).toLocaleString('en-CA');
  }

  function hexToInt(hex) {
    return parseInt(hex.slice(1),16);
  }

  function mixHex(aHex,bHex,t) {
    const a = Phaser.Display.Color.HexStringToColor(aHex);
    const b = Phaser.Display.Color.HexStringToColor(bHex);
    const u = clamp(t,0,1);
    return Phaser.Display.Color.GetColor(
      Math.round(a.red + (b.red-a.red)*u),
      Math.round(a.green + (b.green-a.green)*u),
      Math.round(a.blue + (b.blue-a.blue)*u)
    );
  }

  function geometryForTier(index,r) {
    const t = tiers[index];
    const p = t.profile;
    const table = r*p[0];
    const crown = r*p[1];
    const shoulder = r*p[2];
    const girdle = r*p[3];
    const pavilion = r*p[4];
    const culet = r*p[5];

    if (t.facet === 'rose') {
      return {
        table,crown,shoulder,girdle,pavilion,culet,
        outer:[
          {x:0,y:-crown},
          {x:girdle*.44,y:-crown*.55},
          {x:girdle,y:-r*.02},
          {x:girdle*.91,y:r*.10},
          {x:culet,y:pavilion},
          {x:-culet,y:pavilion},
          {x:-girdle*.91,y:r*.10},
          {x:-girdle,y:-r*.02},
          {x:-girdle*.44,y:-crown*.55}
        ]
      };
    }

    return {
      table,crown,shoulder,girdle,pavilion,culet,
      outer:[
        {x:-table,y:-crown},
        {x:table,y:-crown},
        {x:shoulder,y:-r*.18},
        {x:girdle,y:-r*.04},
        {x:girdle,y:r*.05},
        {x:r*.36,y:pavilion*.62},
        {x:culet,y:pavilion},
        {x:-culet,y:pavilion},
        {x:-r*.36,y:pavilion*.62},
        {x:-girdle,y:r*.05},
        {x:-girdle,y:-r*.04},
        {x:-shoulder,y:-r*.18}
      ]
    };
  }

  function polygonCentroid(points) {
    let twiceArea=0;
    let cx=0;
    let cy=0;

    for(let i=0;i<points.length;i++){
      const a=points[i];
      const b=points[(i+1)%points.length];
      const cross=a.x*b.y-b.x*a.y;
      twiceArea+=cross;
      cx+=(a.x+b.x)*cross;
      cy+=(a.y+b.y)*cross;
    }

    if(Math.abs(twiceArea)<.00001) return {x:0,y:0};
    const factor=1/(3*twiceArea);
    return {x:cx*factor,y:cy*factor};
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
      this.gems = null;
      this.pendingMerges = [];
      this.score = 0;
      this.best = 0;
      this.currentTier = 0;
      this.nextTier = 0;
      this.bestTierReached = 0;
      this.ready = false;
      this.running = false;
      this.paused = false;
      this.targetX = W/2;
      this.pointerHeld = false;
      this.dangerTime = 0;
      this.mergeWindow = 0;
      this.mergeChain = 0;
      this.discoveredCuts = new Set([0]);
      this.preview = null;
      this.glints = new Map();
      this.bodyToGem = new Map();
      this.dropper = null;
      this.limitLine = null;
      this.lastDropAt = 0;
      this.uiBound = false;
    }

    create() {
      this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

      const engine=this.matter.world.engine;
      engine.positionIterations=14;
      engine.velocityIterations=12;
      engine.constraintIterations=4;
      engine.gravity.x=0;
      engine.gravity.y=1.28;
      engine.gravity.scale=.001;
      engine.timing.timeScale=1;

      this.makeTextures();
      this.drawVaultBackdrop();

      this.gems=[];

      const wallOptions={
        isStatic:true,
        friction:.30,
        frictionStatic:.65,
        restitution:.025,
        label:'vault-wall'
      };

      // The exposed collision faces are exactly x=WALL, x=W-WALL and y=FLOOR.
      // All wall mass extends outside the playable area, so a gem can never end
      // up visually behind the decorative rails.
      this.floorBody=this.matter.add.rectangle(W/2,FLOOR+90,W+180,180,wallOptions);
      this.leftWallBody=this.matter.add.rectangle(WALL-50,H/2,100,H*2,wallOptions);
      this.rightWallBody=this.matter.add.rectangle(W-WALL+50,H/2,100,H*2,wallOptions);

      this.matter.world.on('collisionstart',event=>this.handleMatterCollisions(event,false));
      this.matter.world.on('collisionactive',event=>this.handleMatterCollisions(event,true));

      this.limitLine = this.add.graphics().setDepth(5);
      this.dropper = this.add.graphics().setDepth(20);
      this.limitJewels = [
        this.add.rectangle(WALL+18,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(6),
        this.add.rectangle(W-WALL-18,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(6)
      ];

      this.input.on('pointerdown',p=>this.onPointerDown(p));
      this.input.on('pointermove',p=>this.onPointerMove(p));
      this.input.on('pointerup',p=>this.onPointerUp(p));
      this.input.on('pointerupoutside',p=>this.onPointerUp(p));

      this.best = this.loadBest();
      bestEl.textContent = fmt(this.best);
      this.bindUI();
      this.updateNextPreview();
    }

    bindUI() {
      if (this.uiBound) return;
      this.uiBound = true;

      $('startButton').addEventListener('click',()=>{
        unlockAudio();
        startOverlay.classList.remove('visible');
        this.startRun();
      });

      $('pauseButton').addEventListener('click',()=>this.setPaused(true));
      $('resumeButton').addEventListener('click',()=>this.setPaused(false));

      $('restartFromPause').addEventListener('click',()=>{
        pauseOverlay.classList.remove('visible');
        this.startRun();
      });

      $('restartButton').addEventListener('click',()=>{
        gameOverOverlay.classList.remove('visible');
        this.startRun();
      });

      document.addEventListener('visibilitychange',()=>{
        if (document.hidden && this.running && !this.paused) this.setPaused(true);
      });

      window.addEventListener('keydown',e=>{
        if (e.code==='Space') {
          e.preventDefault();
          this.dropCurrent();
        }
        if (e.key==='Escape') this.setPaused(!this.paused);
      });
    }

    loadBest() {
      try {
        const v = localStorage.getItem('gemDropBest');
        return Number(v || 0);
      } catch {
        return 0;
      }
    }

    saveBest() {
      try { localStorage.setItem('gemDropBest',String(this.best)); } catch {}
    }

    makeTextures() {
      for (let i=0;i<tiers.length;i++) this.makeGemTexture(i);
      this.makeGlintTexture();
    }

    makeGlintTexture() {
      if (this.textures.exists('glint')) return;
      const g = this.make.graphics({x:0,y:0,add:false});
      g.lineStyle(2,0xffffff,.95);
      g.beginPath();
      g.moveTo(0,8); g.lineTo(16,8);
      g.moveTo(8,1); g.lineTo(8,15);
      g.strokePath();
      g.lineStyle(1,0xfff0c8,.75);
      g.beginPath();
      g.moveTo(3,3); g.lineTo(13,13);
      g.moveTo(13,3); g.lineTo(3,13);
      g.strokePath();
      g.generateTexture('glint',16,16);
      g.destroy();
    }

    makeGemTexture(index) {
      const t = tiers[index];
      const r = t.r;
      const size = Math.ceil(r*2.12);
      const cx = size/2;
      const cy = size/2;
      const geo = geometryForTier(index,r*.94);
      const center = polygonCentroid(geo.outer);
      const pt = (p)=>new Phaser.Geom.Point(cx+p.x-center.x,cy+p.y-center.y);
      const pts = geo.outer.map(pt);
      const g = this.make.graphics({x:0,y:0,add:false});

      const dark = hexToInt(t.dark);
      const color = hexToInt(t.color);
      const accent = hexToInt(t.accent);
      const midLight = mixHex(t.color,t.accent,.34);
      const deep = mixHex(t.dark,'#14081b',.25);

      g.fillStyle(0x08040b,.34);
      g.fillPoints(geo.outer.map(p=>new Phaser.Geom.Point(cx+p.x-center.x+3,cy+p.y-center.y+5)),true);

      g.fillStyle(dark,1);
      g.fillPoints(pts,true);

      const P=(x,y)=>new Phaser.Geom.Point(cx+x-center.x,cy+y-center.y);
      const tableL=P(-geo.table,-geo.crown);
      const tableR=P(geo.table,-geo.crown);
      const shoulderL=P(-geo.shoulder,-r*.17);
      const shoulderR=P(geo.shoulder,-r*.17);
      const girdleLT=P(-geo.girdle,-r*.04);
      const girdleRT=P(geo.girdle,-r*.04);
      const girdleLB=P(-geo.girdle,r*.05);
      const girdleRB=P(geo.girdle,r*.05);
      const lowerL=P(-r*.36,geo.pavilion*.62);
      const lowerR=P(r*.36,geo.pavilion*.62);
      const culetL=P(-geo.culet,geo.pavilion);
      const culetR=P(geo.culet,geo.pavilion);
      const coreTop=P(0,-r*.10);
      const coreMid=P(0,r*.17);

      const fill=(arr,c,a=1)=>{ g.fillStyle(c,a); g.fillPoints(arr,true); };

      if (t.facet==='rose') {
        const apex=P(0,-geo.crown);
        const lm=P(-geo.girdle*.44,-geo.crown*.55);
        const rm=P(geo.girdle*.44,-geo.crown*.55);
        fill([apex,rm,coreMid],accent,.78);
        fill([apex,coreMid,lm],midLight,.80);
        fill([lm,coreMid,girdleLB],color,.92);
        fill([rm,girdleRB,coreMid],mixHex(t.color,t.dark,.16),.94);
        fill([girdleLB,girdleRB,culetR,culetL],deep,.96);
      } else if (t.facet==='step') {
        fill([tableL,tableR,P(geo.shoulder*.70,-r*.15),P(-geo.shoulder*.70,-r*.15)],accent,.78);
        fill([P(-geo.shoulder*.70,-r*.15),P(geo.shoulder*.70,-r*.15),girdleRT,girdleLT],midLight,.92);
        fill([girdleLB,girdleRB,P(r*.55,geo.pavilion*.45),P(-r*.55,geo.pavilion*.45)],color,.95);
        fill([P(-r*.55,geo.pavilion*.45),P(r*.55,geo.pavilion*.45),culetR,culetL],deep,.96);
        g.lineStyle(Math.max(1,r*.015),0xffffff,.18);
        for (const yy of [r*.10,r*.26,r*.40]) {
          g.beginPath();
          g.moveTo(cx-geo.girdle*.68,cy+yy);
          g.lineTo(cx+geo.girdle*.68,cy+yy);
          g.strokePath();
        }
      } else {
        fill([tableL,tableR,P(r*.34,-r*.16),P(-r*.34,-r*.16)],accent,.78);
        fill([tableL,P(-r*.34,-r*.16),shoulderL],midLight,.90);
        fill([tableR,shoulderR,P(r*.34,-r*.16)],mixHex(t.color,t.accent,.18),.92);
        fill([shoulderL,P(-r*.34,-r*.16),coreTop,girdleLT],color,.95);
        fill([shoulderR,girdleRT,coreTop,P(r*.34,-r*.16)],mixHex(t.color,t.dark,.12),.96);
        fill([girdleLT,girdleRT,girdleRB,girdleLB],mixHex(t.color,t.accent,.17),.98);
        fill([girdleLB,coreMid,lowerL],mixHex(t.color,t.dark,.10),.96);
        fill([girdleRB,lowerR,coreMid],midLight,.88);
        fill([lowerL,coreMid,culetL],dark,.96);
        fill([coreMid,lowerR,culetR],mixHex(t.dark,t.color,.34),.96);
        fill([culetL,coreMid,culetR],deep,.98);

        if (['radiant','royal','oldmine'].includes(t.facet)) {
          g.lineStyle(Math.max(1,r*.012),0xffffff,.16);
          g.beginPath();
          g.moveTo(tableL.x,tableL.y); g.lineTo(lowerR.x,lowerR.y);
          g.moveTo(tableR.x,tableR.y); g.lineTo(lowerL.x,lowerL.y);
          g.strokePath();
        }

        if (['kite','pear','long'].includes(t.facet)) {
          g.lineStyle(Math.max(1,r*.012),0xffffff,.18);
          g.beginPath();
          g.moveTo(coreTop.x,coreTop.y); g.lineTo(culetL.x,culetL.y);
          g.moveTo(coreTop.x,coreTop.y); g.lineTo(culetR.x,culetR.y);
          g.strokePath();
        }
      }

      g.lineStyle(Math.max(2,r*.025),0xffffff,.46);
      g.strokePoints(pts,true);

      g.lineStyle(Math.max(1,r*.012),accent,.32);
      g.beginPath();
      g.moveTo(cx-r*.30,cy-r*.42);
      g.lineTo(cx+r*.22,cy-r*.20);
      g.strokePath();

      g.generateTexture('gem-'+index,size,size);
      g.destroy();
    }

    drawVaultBackdrop() {
      const bg=this.add.graphics().setDepth(0);
      bg.fillStyle(0x1a0825,.56);
      bg.fillRect(0,0,W,H);

      // Interior glow.
      bg.fillStyle(0x6a1b78,.055);
      bg.fillEllipse(W*.5,H*.72,W*.78,H*.36);

      // Rails are drawn exactly outside the collision faces.
      const rails=this.add.graphics().setDepth(15);
      rails.fillStyle(0x7d2557,1);
      rails.fillRect(0,0,W,20);

      rails.fillGradientStyle(0xffdd7a,0xf2a433,0xb13f61,0x6f2253,1);
      rails.fillRect(WALL-8,18,8,FLOOR-18);
      rails.fillRect(W-WALL,18,8,FLOOR-18);
      rails.fillGradientStyle(0xffed9e,0xffbd3f,0xb13f61,0x6a1f52,1);
      rails.fillRect(WALL,FLOOR,W-WALL*2,11);

      rails.lineStyle(2,0xffd666,.34);
      rails.strokeRect(WALL,19,W-WALL*2,FLOOR-19);

      const sparkleColors=[0xffc65b,0xf36ac8,0xa46cff];
      for(let i=0;i<30;i++){
        const x=(i*173.7)%W;
        const y=(i*109.3)%H;
        const s=this.add.circle(x,y,.8+(i%3)*.25,sparkleColors[i%3],.20).setDepth(1);
        this.tweens.add({
          targets:s,
          alpha:{from:.08,to:.34},
          y:y-4-(i%4),
          duration:1400+(i%5)*220,
          yoyo:true,
          repeat:-1,
          ease:'Sine.inOut',
          delay:(i%7)*170
        });
      }
    }

    randomSpawnTier() {
      const r=Math.random();
      return r<.30?0:r<.56?1:r<.78?2:r<.93?3:4;
    }

    startRun() {
      this.clearRun();
      this.score=0;
      this.currentTier=this.randomSpawnTier();
      this.nextTier=this.randomSpawnTier();
      this.bestTierReached=0;
      this.ready=true;
      this.running=true;
      this.paused=false;
      this.pointerHeld=false;
      this.targetX=W/2;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.discoveredCuts=new Set([0]);
      this.lastDropAt=0;

      scoreEl.textContent='0';
      dangerHud.hidden=true;
      cutToast.classList.remove('show');
      gestureHint.classList.remove('hidden');

      this.updateNextPreview();
      this.createDropPreview(true);
      this.matter.world.resume();
    }

    clearRun() {
      if (!this.gems) return;

      for(const gem of [...this.gems]) this.removeGem(gem);
      this.gems.length=0;
      this.bodyToGem.clear();

      for(const glint of this.glints.values()) glint.destroy();
      this.glints.clear();

      if(this.preview){this.preview.destroy();this.preview=null;}
      this.pendingMerges.length=0;
      this.time.removeAllEvents();
    }

    createDropPreview(animate=false) {
      if(!this.running||this.paused||!this.ready) return;
      if(this.preview) this.preview.destroy();

      const t=tiers[this.currentTier];
      const x=clamp(this.targetX,WALL+t.r,W-WALL-t.r);
      this.preview=this.add.image(x,DROP_Y,'gem-'+this.currentTier).setDepth(18);
      this.preview.setAlpha(animate?0:1);

      if(animate){
        this.preview.setScale(.90);
        this.tweens.add({
          targets:this.preview,
          alpha:1,
          scale:1,
          duration:150,
          ease:'Back.Out'
        });
      }
    }

    createGem(x,y,tier,merged=false) {
      const t=tiers[tier];
      const M=Phaser.Physics.Matter.Matter;

      // Art and collider use the same centred silhouette. The collider is only
      // 0.8% larger, enough to prevent anti-aliased edges from appearing to overlap.
      const bodyGeo=geometryForTier(tier,t.r*.948);
      const bodyCenter=polygonCentroid(bodyGeo.outer);
      const verts=bodyGeo.outer.map(p=>({
        x:p.x-bodyCenter.x,
        y:p.y-bodyCenter.y
      }));

      const body=M.Bodies.fromVertices(
        x,
        y,
        [verts],
        {
          label:'gem',
          friction:.16,
          frictionStatic:.34,
          frictionAir:.004,
          restitution:.045,
          density:.00125,
          slop:.006,
          sleepThreshold:60
        },
        true,
        .01,
        3,
        .01
      );

      M.Body.setAngle(body,Phaser.Math.FloatBetween(-.025,.025));
      M.Body.setAngularVelocity(body,Phaser.Math.FloatBetween(-.0025,.0025));
      M.Body.setInertia(body,body.inertia*1.75);

      const sprite=this.add.image(x,y,'gem-'+tier).setDepth(10+tier*.01);
      if(merged){
        sprite.setAlpha(.74);
        sprite.setScale(.90);
        this.tweens.add({
          targets:sprite,
          alpha:1,
          scale:1,
          duration:135,
          ease:'Back.Out'
        });
      }

      const gem={
        tier,
        body,
        sprite,
        merging:false,
        born:this.time.now,
        active:true
      };

      body.gameObject=gem;
      this.bodyToGem.set(body.id,gem);

      if(Array.isArray(body.parts)){
        for(const part of body.parts){
          part.gameObject=gem;
          this.bodyToGem.set(part.id,gem);
        }
      }

      this.matter.world.add(body);
      this.gems.push(gem);

      const glint=this.add.image(x,y,'glint').setDepth(13).setAlpha(0);
      glint.setScale(clamp(t.r/58,.65,2.2));
      this.glints.set(gem,glint);

      return gem;
    }

    removeGem(gem) {
      if(!gem||!gem.active) return;
      gem.active=false;

      const glint=this.glints.get(gem);
      if(glint){
        glint.destroy();
        this.glints.delete(gem);
      }

      if(gem.body){
        if(Array.isArray(gem.body.parts)){
          for(const part of gem.body.parts){
            this.bodyToGem.delete(part.id);
            part.gameObject=null;
          }
        }
        this.bodyToGem.delete(gem.body.id);
        this.matter.world.remove(gem.body);
        gem.body.gameObject=null;
      }

      if(gem.sprite?.active) gem.sprite.destroy();

      const i=this.gems.indexOf(gem);
      if(i>=0) this.gems.splice(i,1);
    }

    onPointerDown(pointer) {
      if(!this.running||this.paused||!this.ready) return;
      unlockAudio();
      this.pointerHeld=true;
      this.targetX=this.pointerToWorldX(pointer);
    }

    onPointerMove(pointer) {
      if(!this.running||this.paused||!this.ready||!this.pointerHeld) return;
      this.targetX=this.pointerToWorldX(pointer);
    }

    onPointerUp(pointer) {
      if(!this.running||this.paused||!this.ready||!this.pointerHeld) return;
      this.targetX=this.pointerToWorldX(pointer);
      this.pointerHeld=false;
      this.dropCurrent();
    }

    pointerToWorldX(pointer) {
      const t=tiers[this.currentTier];
      return clamp(pointer.x,WALL+t.r,W-WALL-t.r);
    }

    dropCurrent() {
      if(!this.running||this.paused||!this.ready) return;
      if(this.time.now-this.lastDropAt<DROP_DELAY) return;

      const t=tiers[this.currentTier];
      const x=clamp(this.preview?.x ?? this.targetX,WALL+t.r,W-WALL-t.r);

      if(this.preview){this.preview.destroy();this.preview=null;}

      const gem=this.createGem(x,DROP_Y,this.currentTier,false);
      Phaser.Physics.Matter.Matter.Body.setVelocity(gem.body,{x:0,y:.10});
      this.lastDropAt=this.time.now;
      this.ready=false;

      tone(178,.045,.016,'triangle');
      haptic(5);

      this.currentTier=this.nextTier;
      this.nextTier=this.randomSpawnTier();
      this.updateNextPreview();
      gestureHint.classList.add('hidden');

      this.time.delayedCall(DROP_DELAY,()=>{
        if(!this.running) return;
        this.ready=true;
        this.createDropPreview(true);
      });
    }

    gemFromBody(body) {
      if(!body) return null;

      let gem=this.bodyToGem.get(body.id) || body.gameObject || null;
      if(gem?.active) return gem;

      const parent=body.parent;
      if(parent && parent!==body){
        gem=this.bodyToGem.get(parent.id) || parent.gameObject || null;
        if(gem?.active) return gem;
      }

      return null;
    }

    handleMatterCollisions(event,isActive) {
      for(const pair of event.pairs){
        const a=this.gemFromBody(pair.bodyA);
        const b=this.gemFromBody(pair.bodyB);

        if(!a || !b || a===b) continue;
        this.onGemContact(a,b,!isActive);
      }
    }

    onGemContact(a,b,isNewContact=true) {
      if(!a?.active||!b?.active||!a.body||!b.body) return;

      const av=a.body.velocity;
      const bv=b.body.velocity;
      const speed=Math.hypot(bv.x-av.x,bv.y-av.y);

      if(isNewContact && speed>2.0){
        this.contactSpark(
          (a.body.position.x+b.body.position.x)/2,
          (a.body.position.y+b.body.position.y)/2,
          tiers[Math.max(a.tier,b.tier)].accent,
          speed*55
        );
      }

      if(
        a.tier===b.tier &&
        !a.merging &&
        !b.merging &&
        this.time.now-a.born>70 &&
        this.time.now-b.born>70
      ){
        a.merging=true;
        b.merging=true;
        this.pendingMerges.push([a,b]);
      }
    }

    processMerges() {
      if(!this.pendingMerges.length) return;
      const queue=this.pendingMerges.splice(0);

      for(const [a,b] of queue){
        if(!a?.active||!b?.active) continue;
        if(a.tier!==b.tier) continue;

        const tier=a.tier;
        const next=tier+1;
        const x=(a.body.position.x+b.body.position.x)/2;
        const y=(a.body.position.y+b.body.position.y)/2;
        const vx=(a.body.velocity.x+b.body.velocity.x)*.22;
        const vy=Math.min(-1.15,(a.body.velocity.y+b.body.velocity.y)*.10-.55);
        const av=(a.body.angularVelocity+b.body.angularVelocity)*.16;

        this.removeGem(a);
        this.removeGem(b);

        this.mergeChain=this.mergeWindow>0?this.mergeChain+1:1;
        this.mergeWindow=.68;

        if(next>=tiers.length){
          this.addScore(100);
          this.mergeBurst(x,y,tiers[tier],true);
          this.floatText(x,y-8,'MASTER CUT +100','#ffe0a0',21);
          this.cameras.main.shake(100,.004);
          tone(770,.16,.045,'sine');
          haptic([14,17,22]);
          continue;
        }

        const gem=this.createGem(x,y,next,true);
        const M=Phaser.Physics.Matter.Matter;
        M.Body.setVelocity(gem.body,{x:vx,y:vy});
        M.Body.setAngularVelocity(gem.body,clamp(av,-.018,.018));

        this.bestTierReached=Math.max(this.bestTierReached,next);
        this.addScore(tiers[next].score);
        this.mergeBurst(x,y,tiers[next],next>=6);

        const label=this.mergeChain>=2
          ? this.mergeChain+'× CHAIN  +'+tiers[next].score
          : '+'+tiers[next].score;
        this.floatText(x,y-8,label,'#ffe7c5',this.mergeChain>=2?20:17);

        this.cameras.main.shake(75,next>=7?.0034:.0018);
        tone(270+next*43,.07+next*.004,.024+Math.min(.018,next*.002),'sine');
        haptic(next>=8?15:8);

        if(!this.discoveredCuts.has(next)){
          this.discoveredCuts.add(next);
          this.showCutToast(tiers[next].name+' '+tiers[next].cut+' unlocked');
        }
      }
    }

    mergeBurst(x,y,tier,big=false) {
      const color=hexToInt(tier.accent);
      const count=big?18:12;

      for(let i=0;i<count;i++){
        const angle=Math.random()*Math.PI*2;
        const dist=Phaser.Math.Between(big?45:28,big?100:72);
        const shard=this.add.triangle(
          x,y,
          0,-3,
          2.8,2.6,
          -2.8,2.6,
          i%3===0?0xffffff:color,
          .92
        ).setDepth(25).setRotation(angle);

        this.tweens.add({
          targets:shard,
          x:x+Math.cos(angle)*dist,
          y:y+Math.sin(angle)*dist,
          alpha:0,
          scale:.35,
          rotation:angle+Phaser.Math.FloatBetween(-1.5,1.5),
          duration:Phaser.Math.Between(260,430),
          ease:'Cubic.Out',
          onComplete:()=>shard.destroy()
        });
      }

      const ring=this.add.circle(x,y,14,color,.10).setStrokeStyle(2,color,.70).setDepth(24);
      this.tweens.add({
        targets:ring,
        scale:big?4.5:3.3,
        alpha:0,
        duration:big?420:310,
        ease:'Quad.Out',
        onComplete:()=>ring.destroy()
      });
    }

    contactSpark(x,y,colorHex,speed) {
      const count=Math.min(4,1+Math.floor(speed/80));
      const color=hexToInt(colorHex);
      for(let i=0;i<count;i++){
        const p=this.add.circle(x,y,Phaser.Math.FloatBetween(1.2,2.3),i===0?0xffffff:color,.82).setDepth(22);
        const a=Phaser.Math.FloatBetween(-2.8,-.35);
        const d=Phaser.Math.Between(18,38);
        this.tweens.add({
          targets:p,
          x:x+Math.cos(a)*d,
          y:y+Math.sin(a)*d,
          alpha:0,
          scale:.35,
          duration:170,
          ease:'Quad.Out',
          onComplete:()=>p.destroy()
        });
      }
    }

    floatText(x,y,text,color,size) {
      const label=this.add.text(x,y,text,{
        fontFamily:'Manrope, sans-serif',
        fontSize:Math.max(14,size)+'px',
        fontStyle:'800',
        color,
        stroke:'#270b33',
        strokeThickness:3
      }).setOrigin(.5).setDepth(30);

      this.tweens.add({
        targets:label,
        y:y-34,
        alpha:0,
        duration:620,
        ease:'Cubic.Out',
        onComplete:()=>label.destroy()
      });
    }

    showCutToast(text) {
      cutToast.textContent=text;
      cutToast.classList.add('show');
      window.clearTimeout(this.cutToastTimer);
      this.cutToastTimer=window.setTimeout(()=>cutToast.classList.remove('show'),1150);
    }

    addScore(points) {
      this.score+=points;
      if(this.score>this.best){
        this.best=this.score;
        this.saveBest();
      }
      scoreEl.textContent=fmt(this.score);
      bestEl.textContent=fmt(this.best);
      scoreEl.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('bump');
    }

    setPaused(value) {
      if(!this.running) return;
      this.paused=value;
      pauseOverlay.classList.toggle('visible',value);

      if(value){
        this.matter.world.pause();
        this.tweens.pauseAll();
      }else{
        this.matter.world.resume();
        this.tweens.resumeAll();
      }
    }

    endGame() {
      if(!this.running) return;
      this.running=false;
      this.ready=false;
      this.pointerHeld=false;
      dangerHud.hidden=true;
      this.matter.world.pause();

      finalScoreEl.textContent=fmt(this.score);
      const finest=tiers[this.bestTierReached];
      bestMergeEl.textContent=finest.name+' '+finest.cut;
      gameOverOverlay.classList.add('visible');
      haptic([36,26,36]);
    }

    updateNextPreview() {
      const c=nextPreview.getContext('2d');
      c.clearRect(0,0,nextPreview.width,nextPreview.height);

      if(!this.textures.exists('gem-'+this.nextTier)) return;
      const source=this.textures.get('gem-'+this.nextTier).getSourceImage();
      const maxW=52;
      const maxH=46;
      const scale=Math.min(maxW/source.width,maxH/source.height);
      const w=source.width*scale;
      const h=source.height*scale;
      c.drawImage(source,(88-w)/2,(64-h)/2,w,h);
    }

    update(time,delta) {
      const dt=Math.min(delta,34)/1000;

      if(this.running&&!this.paused){
        this.processMerges();

        this.mergeWindow=Math.max(0,this.mergeWindow-dt);
        if(this.mergeWindow<=0) this.mergeChain=0;

        if(this.preview){
          const t=tiers[this.currentTier];
          const target=clamp(this.targetX,WALL+t.r,W-WALL-t.r);
          this.preview.x=Phaser.Math.Linear(this.preview.x,target,this.pointerHeld?.46:.28);
        }

        let high=false;

        for(const gem of this.gems){
          if(!gem.active||!gem.body||!gem.sprite?.active) continue;

          const body=gem.body;
          const M=Phaser.Physics.Matter.Matter;

          // Matter has no continuous collision detection. Keeping the maximum
          // displacement comfortably below the thinnest gem dimension prevents
          // tunnelling without making the fall feel floaty.
          if(body.velocity.y>9.5){
            M.Body.setVelocity(body,{x:body.velocity.x,y:9.5});
          }
          if(Math.abs(body.velocity.x)>7.0){
            M.Body.setVelocity(body,{x:Math.sign(body.velocity.x)*7.0,y:body.velocity.y});
          }
          if(Math.abs(body.angularVelocity)>.042){
            M.Body.setAngularVelocity(body,Math.sign(body.angularVelocity)*.042);
          }

          gem.sprite.setPosition(body.position.x,body.position.y);
          gem.sprite.setRotation(body.angle);

          const glint=this.glints.get(gem);
          if(glint){
            const r=tiers[gem.tier].r;
            const ox=-r*.22;
            const oy=-r*.28;
            const ca=Math.cos(body.angle);
            const sa=Math.sin(body.angle);
            glint.x=body.position.x+ox*ca-oy*sa;
            glint.y=body.position.y+ox*sa+oy*ca;
            glint.rotation=-body.angle*.35;

            const phase=Math.cos(body.angle+.65);
            glint.alpha=clamp((phase-.91)/.09,0,.55);
          }

          if(
            time-gem.born>720 &&
            body.speed<.75 &&
            body.bounds.min.y<LIMIT_Y
          ){
            high=true;
          }
        }

        if(high) this.dangerTime+=dt;
        else this.dangerTime=Math.max(0,this.dangerTime-dt*3.8);

        dangerHud.hidden=this.dangerTime<.16;
        if(this.dangerTime>=1.7) this.endGame();
      }

      this.drawLimitLine(time);
      this.drawDropper(time);
    }

    drawLimitLine(time) {
      const active=this.dangerTime>.08;
      const pulse=.60+.20*Math.sin(time*.009);
      const color=active?0xff5d86:0xffca58;

      this.limitLine.clear();
      this.limitLine.lineStyle(active?3:2,color,active?pulse:.72);
      this.limitLine.beginPath();
      this.limitLine.moveTo(WALL+18,LIMIT_Y);
      this.limitLine.lineTo(W-WALL-18,LIMIT_Y);
      this.limitLine.strokePath();

      for(const j of this.limitJewels){
        j.setFillStyle(color,active?pulse:.90);
        j.setAlpha(active?pulse:.90);
      }
    }

    drawDropper(time) {
      this.dropper.clear();
      if(!this.running||this.paused||!this.ready||!this.preview) return;

      const x=this.preview.x;
      const pulse=.82+.10*Math.sin(time*.006);

      this.dropper.fillStyle(0xffc64e,pulse);
      this.dropper.lineStyle(2,0xffeda3,.62);
      this.dropper.beginPath();
      this.dropper.moveTo(x-31,20);
      this.dropper.lineTo(x-22,42);
      this.dropper.lineTo(x-14,34);
      this.dropper.lineTo(x-7,45);
      this.dropper.lineTo(x,31);
      this.dropper.lineTo(x+7,45);
      this.dropper.lineTo(x+14,34);
      this.dropper.lineTo(x+22,42);
      this.dropper.lineTo(x+31,20);
      this.dropper.closePath();
      this.dropper.fillPath();
      this.dropper.strokePath();

      this.dropper.fillStyle(0x21082c,1);
      this.dropper.fillEllipse(x,44,30,12);

      for(let i=0;i<4;i++){
        const yy=51+i*7+Math.sin(time*.005+i)*1.5;
        this.dropper.fillStyle(i%2?0xffca5e:0xf36ad0,.72-i*.12);
        this.dropper.fillCircle(x,yy,1.8-i*.15);
      }
    }
  }

  const config = {
    type: Phaser.CANVAS,
    parent: 'game',
    width: W,
    height: H,
    transparent: true,
    antialias: true,
    roundPixels: false,
    banner: false,
    fps: {
      target: 60,
      smoothStep: true
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1.28, scale: .001 },
        enableSleeping: true,
        debug: false
      }
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    },
    scene: GameScene
  };

  new Phaser.Game(config);
})();
