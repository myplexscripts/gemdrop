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
      this.dropper = null;
      this.limitLine = null;
      this.lastDropAt = 0;
      this.uiBound = false;
    }

    create() {
      this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
      this.physics.world.setBounds(WALL, 15, W-WALL*2, FLOOR-15, true, true, false, true);

      this.makeTextures();
      this.drawVaultBackdrop();

      this.gems = this.physics.add.group({
        collideWorldBounds:true,
        allowGravity:true
      });

      this.physics.add.collider(this.gems,this.gems,(a,b)=>this.onGemContact(a,b),undefined,this);

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
      const pt = (p)=>new Phaser.Geom.Point(cx+p.x,cy+p.y);
      const pts = geo.outer.map(pt);
      const g = this.make.graphics({x:0,y:0,add:false});

      const dark = hexToInt(t.dark);
      const color = hexToInt(t.color);
      const accent = hexToInt(t.accent);
      const midLight = mixHex(t.color,t.accent,.34);
      const deep = mixHex(t.dark,'#14081b',.25);

      g.fillStyle(0x08040b,.34);
      g.fillPoints(geo.outer.map(p=>new Phaser.Geom.Point(cx+p.x+3,cy+p.y+5)),true);

      g.fillStyle(dark,1);
      g.fillPoints(pts,true);

      const P=(x,y)=>new Phaser.Geom.Point(cx+x,cy+y);
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
      const g = this.add.graphics().setDepth(0);
      g.fillStyle(0x1a0825,.55);
      g.fillRect(0,0,W,H);

      g.fillStyle(0xffc44a,.10);
      g.fillRect(WALL,19,W-WALL*2,6);
      g.fillRect(WALL,FLOOR-8,W-WALL*2,9);

      g.lineStyle(2,0xffca54,.26);
      g.strokeRect(WALL,19,W-WALL*2,FLOOR-19);

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
      this.physics.world.resume();
    }

    clearRun() {
      if (!this.gems) return;
      this.gems.clear(true,true);
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
      const gem=this.physics.add.image(x,y,'gem-'+tier);
      gem.tier=tier;
      gem.merging=false;
      gem.born=this.time.now;
      gem.spin=Phaser.Math.FloatBetween(-5,5);
      gem.lastX=x;
      gem.setDepth(10+tier*.01);
      gem.setBounce(.055);
      gem.setDrag(36,0);
      gem.setMaxVelocity(260,620);
      gem.setCollideWorldBounds(true,.05,.03);

      const radius=t.r*.945;
      const frame=gem.frame;
      const ox=(frame.realWidth/2)-radius;
      const oy=(frame.realHeight/2)-radius;
      gem.body.setCircle(radius,ox,oy);

      if(merged){
        gem.setAlpha(.70);
        this.tweens.add({targets:gem,alpha:1,duration:120,ease:'Quad.Out'});
      }

      this.gems.add(gem);

      const glint=this.add.image(x,y,'glint').setDepth(13).setAlpha(0);
      glint.setScale(clamp(t.r/58,.65,2.2));
      this.glints.set(gem,glint);

      return gem;
    }

    removeGem(gem) {
      const glint=this.glints.get(gem);
      if(glint){glint.destroy();this.glints.delete(gem);}
      if(gem?.active) gem.destroy();
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
      gem.body.setVelocity(0,10);
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

    onGemContact(a,b) {
      if(!a?.active||!b?.active) return;

      const relX=b.body.velocity.x-a.body.velocity.x;
      const relY=b.body.velocity.y-a.body.velocity.y;
      const speed=Math.hypot(relX,relY);

      a.spin=clamp(a.spin-relX*.055,-42,42);
      b.spin=clamp(b.spin+relX*.055,-42,42);

      if(speed>95){
        this.contactSpark((a.x+b.x)/2,(a.y+b.y)/2,tiers[Math.max(a.tier,b.tier)].accent,speed);
      }

      if(a.tier===b.tier&&!a.merging&&!b.merging&&this.time.now-a.born>90&&this.time.now-b.born>90){
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
        const x=(a.x+b.x)/2;
        const y=(a.y+b.y)/2;
        const vx=(a.body.velocity.x+b.body.velocity.x)*.16;
        const vy=Math.min(-24,(a.body.velocity.y+b.body.velocity.y)*.08-16);

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
        gem.body.setVelocity(vx,vy);
        gem.spin=clamp((a.spin+b.spin)*.16,-10,10);

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
        this.physics.world.pause();
        this.tweens.pauseAll();
      }else{
        this.physics.world.resume();
        this.tweens.resumeAll();
      }
    }

    endGame() {
      if(!this.running) return;
      this.running=false;
      this.ready=false;
      this.pointerHeld=false;
      dangerHud.hidden=true;
      this.physics.world.pause();

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

        for(const gem of this.gems.getChildren()){
          if(!gem.active) continue;

          const body=gem.body;
          if(Math.abs(body.velocity.x)<1.0) body.velocity.x=0;
          if(body.blocked.down&&Math.abs(body.velocity.y)<8) body.velocity.y=0;

          const rolling=(body.velocity.x/Math.max(28,tiers[gem.tier].r))*36;
          gem.spin=Phaser.Math.Linear(gem.spin,rolling,.045);
          gem.angle+=gem.spin*dt;
          gem.spin*=Math.pow(.985,delta/16.67);

          const glint=this.glints.get(gem);
          if(glint){
            glint.x=gem.x-tiers[gem.tier].r*.22;
            glint.y=gem.y-tiers[gem.tier].r*.28;
            const phase=Math.cos(Phaser.Math.DegToRad(gem.angle)+.65);
            glint.alpha=clamp((phase-.90)/.10,0,.58);
          }

          const speed=Math.hypot(body.velocity.x,body.velocity.y);
          const radius=tiers[gem.tier].r*.945;
          if(time-gem.born>700 && speed<28 && gem.y-radius<LIMIT_Y) high=true;
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
      default: 'arcade',
      arcade: {
        gravity: { y: 930 },
        fps: 60,
        fixedStep: true,
        overlapBias: 8,
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
