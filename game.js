(() => {
  'use strict';

  if (!window.Phaser) return;

  const W = 640;
  const H = 864;
  const WALL = 28;
  const FLOOR = 824;
  const DROP_Y = 72;
  const LIMIT_Y = 146;
  const DROP_DELAY = 300;
  const COLLIDER_SCALE = 0.945;
  const ART_SCALE = 0.938;

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
    {name:'Quartz',     cut:'Brilliant', r:34,  score:1,  color:'#D9E8F0', accent:'#FFFFFF', dark:'#7D929F', sides:6,  physicsSides:6,  table:.38, twist:0.00},
    {name:'Citrine',    cut:'Rose',      r:42,  score:3,  color:'#F0B63D', accent:'#FFE38D', dark:'#A86B22', sides:5,  physicsSides:5,  table:.32, twist:.14},
    {name:'Peridot',    cut:'Cushion',   r:50,  score:6,  color:'#7BC45C', accent:'#CBEAA8', dark:'#4A843A', sides:7,  physicsSides:7,  table:.43, twist:.06},
    {name:'Aquamarine', cut:'Step',      r:60,  score:10, color:'#44B7C7', accent:'#BCE8ED', dark:'#287784', sides:8,  physicsSides:8,  table:.50, twist:.00},
    {name:'Amethyst',   cut:'Princess',  r:72,  score:15, color:'#986CD8', accent:'#D9C2F1', dark:'#684897', sides:4,  physicsSides:4,  table:.36, twist:.18},
    {name:'Topaz',      cut:'Radiant',   r:84,  score:21, color:'#EF7F49', accent:'#F8C39B', dark:'#AA4E31', sides:6,  physicsSides:6,  table:.44, twist:.08},
    {name:'Sapphire',   cut:'Star',      r:98,  score:28, color:'#5379E4', accent:'#BCCCF7', dark:'#324F9F', sides:7,  physicsSides:7,  table:.34, twist:.15},
    {name:'Emerald',    cut:'Asscher',   r:112, score:36, color:'#3BB186', accent:'#A9DEC7', dark:'#247257', sides:8,  physicsSides:8,  table:.52, twist:.00},
    {name:'Ruby',       cut:'Royal',     r:130, score:45, color:'#DF506D', accent:'#F4ADBA', dark:'#A33249', sides:9,  physicsSides:9,  table:.38, twist:.11},
    {name:'Starstone',  cut:'Celestial', r:150, score:55, color:'#8264D0', accent:'#C9B6EE', dark:'#553E90', sides:10, physicsSides:10, table:.32, twist:.20},
    {name:'Crownstone', cut:'Crown',     r:170, score:66, color:'#E8A43A', accent:'#F9D986', dark:'#A16623', sides:12, physicsSides:12, table:.46, twist:.08}
  ];

  let audioCtx = null;

  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
  }

  function tone(freq, duration=.055, volume=.022, type='sine') {
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
    const a=Phaser.Display.Color.HexStringToColor(aHex);
    const b=Phaser.Display.Color.HexStringToColor(bHex);
    const u=clamp(t,0,1);
    return Phaser.Display.Color.GetColor(
      Math.round(a.red+(b.red-a.red)*u),
      Math.round(a.green+(b.green-a.green)*u),
      Math.round(a.blue+(b.blue-a.blue)*u)
    );
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
      this.gems = [];
      this.pendingMerges = [];
      this.score = 0;
      this.best = 0;
      this.currentTier = 0;
      this.nextTier = 0;
      this.bestTierReached = 0;
      this.ready = false;
      this.running = false;
      this.paused = false;
      this.pointerHeld = false;
      this.targetX = W/2;
      this.preview = null;
      this.lastDropAt = 0;
      this.dangerTime = 0;
      this.mergeWindow = 0;
      this.mergeChain = 0;
      this.discoveredCuts = new Set([0]);
      this.limitLine = null;
      this.dropper = null;
      this.limitJewels = [];
      this.cutToastTimer = null;
      this.uiBound = false;
    }

    create() {
      this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

      // Phaser's own fixed 60 Hz Matter stepping. No manual body movement or
      // per-frame position correction anywhere in the game.
      this.matter.set60Hz();

      const engine=this.matter.world.engine;
      engine.positionIterations=8;
      engine.velocityIterations=6;
      engine.constraintIterations=2;

      this.makeTextures();
      this.drawVaultBackdrop();
      this.createWorldWalls();

      this.matter.world.on('collisionstart',event=>this.onCollisionStart(event));

      this.limitLine=this.add.graphics().setDepth(6);
      this.dropper=this.add.graphics().setDepth(30);
      this.limitJewels=[
        this.add.rectangle(WALL+17,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7),
        this.add.rectangle(W-WALL-17,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7)
      ];

      // A dedicated swipe deck sits below the jewel basin. Keeping aiming
      // outside the board means the player's hand never covers the pile.
      this.aimStrip=$('aimStrip');
      this.aimHandle=$('aimHandle');

      this.best=this.loadBest();
      bestEl.textContent=fmt(this.best);
      this.bindUI();
      this.updateNextPreview();
    }

    createWorldWalls() {
      const wallOptions={
        isStatic:true,
        label:'vault-wall',
        friction:.08,
        frictionStatic:.24,
        restitution:.02
      };

      // Every wall extends away from the playfield. The visible interior faces
      // are exactly x=WALL, x=W-WALL and y=FLOOR.
      this.floorBody=this.matter.add.rectangle(
        W/2,
        FLOOR+64,
        W+180,
        128,
        wallOptions
      );
      this.leftWallBody=this.matter.add.rectangle(
        WALL-48,
        H/2,
        96,
        H*2,
        wallOptions
      );
      this.rightWallBody=this.matter.add.rectangle(
        W-WALL+48,
        H/2,
        96,
        H*2,
        wallOptions
      );
    }

    bindUI() {
      if (this.uiBound) return;
      this.uiBound=true;

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
        if(document.hidden&&this.running&&!this.paused) this.setPaused(true);
      });

      window.addEventListener('keydown',e=>{
        if(e.code==='Space'){
          e.preventDefault();
          this.dropCurrent();
        }
        if(e.key==='Escape') this.setPaused(!this.paused);
      });

      const aimFromEvent=e=>{
        const rect=this.aimStrip.getBoundingClientRect();
        const u=clamp((e.clientX-rect.left)/rect.width,0,1);
        const t=tiers[this.currentTier];
        this.targetX=Phaser.Math.Linear(WALL+t.r*COLLIDER_SCALE,W-WALL-t.r*COLLIDER_SCALE,u);
        this.updateAimHandle();
      };

      this.aimStrip.addEventListener('pointerdown',e=>{
        if(!this.running||this.paused||!this.ready) return;
        unlockAudio();
        e.preventDefault();
        this.pointerHeld=true;
        aimFromEvent(e);
        try{this.aimStrip.setPointerCapture(e.pointerId)}catch{}
      });

      this.aimStrip.addEventListener('pointermove',e=>{
        if(!this.pointerHeld||!this.running||this.paused||!this.ready) return;
        e.preventDefault();
        aimFromEvent(e);
      });

      const finishAim=e=>{
        if(!this.pointerHeld||!this.running||this.paused||!this.ready) return;
        e.preventDefault();
        aimFromEvent(e);
        this.pointerHeld=false;
        this.dropCurrent();
        try{this.aimStrip.releasePointerCapture(e.pointerId)}catch{}
      };

      this.aimStrip.addEventListener('pointerup',finishAim);
      this.aimStrip.addEventListener('pointercancel',()=>{this.pointerHeld=false;});
    }

    loadBest() {
      try {
        return Number(localStorage.getItem('gemDropBest')||0);
      } catch {
        return 0;
      }
    }

    saveBest() {
      try { localStorage.setItem('gemDropBest',String(this.best)); } catch {}
    }

    makeTextures() {
      for(let i=0;i<tiers.length;i++) this.makeGemTexture(i);
    }

    makeGemTexture(index) {
      const t=tiers[index];
      const r=t.r;
      const size=Math.ceil(r*2.12);
      const cx=size/2;
      const cy=size/2;
      const R=r*ART_SCALE;
      const outer=[];
      const inner=[];
      const n=t.sides;

      for(let i=0;i<n;i++){
        const a=-Math.PI/2+(i/n)*Math.PI*2;
        const wobble=1-(i%3===1?.018:0);
        outer.push(new Phaser.Geom.Point(
          cx+Math.cos(a)*R*wobble,
          cy+Math.sin(a)*R*wobble
        ));

        const ia=a+t.twist;
        inner.push(new Phaser.Geom.Point(
          cx+Math.cos(ia)*R*t.table,
          cy+Math.sin(ia)*R*t.table
        ));
      }

      const g=this.make.graphics({x:0,y:0,add:false});
      const dark=hexToInt(t.dark);
      const color=hexToInt(t.color);
      const accent=hexToInt(t.accent);

      // Soft shadow is baked into the art only. It never affects physics.
      const shadow=outer.map(p=>new Phaser.Geom.Point(p.x+2.5,p.y+4));
      g.fillStyle(0x07030a,.35);
      g.fillPoints(shadow,true);

      // Each outer wedge receives lighting based on a fixed upper-left light.
      for(let i=0;i<n;i++){
        const j=(i+1)%n;
        const angle=-Math.PI/2+((i+.5)/n)*Math.PI*2;
        const light=Math.max(0,Math.cos(angle+2.35));
        const face=light>.05
          ? mixHex(t.color,t.accent,.12+light*.50)
          : mixHex(t.color,t.dark,.16+Math.abs(Math.cos(angle-.8))*.18);

        g.fillStyle(face,1);
        g.fillPoints([outer[i],outer[j],inner[j],inner[i]],true);
      }

      // Pavilion / centre facets.
      const centre=new Phaser.Geom.Point(cx,cy+r*.03);
      for(let i=0;i<n;i++){
        const j=(i+1)%n;
        const light=(i%2===0)?.18:.05;
        g.fillStyle(mixHex(t.dark,t.color,.38+light),.96);
        g.fillPoints([inner[i],inner[j],centre],true);
      }

      // Table.
      g.fillStyle(mixHex(t.color,t.accent,.48),.86);
      g.fillPoints(inner,true);

      // Cut-specific detail. These are visual only so physics stays simple.
      g.lineStyle(Math.max(1.2,r*.018),0xffffff,.16);
      if(index%3===0){
        for(let i=0;i<n;i+=2){
          g.beginPath();
          g.moveTo(inner[i].x,inner[i].y);
          g.lineTo(outer[(i+2)%n].x,outer[(i+2)%n].y);
          g.strokePath();
        }
      }else if(index%3===1){
        const ring=inner.map(p=>new Phaser.Geom.Point(
          cx+(p.x-cx)*.62,
          cy+(p.y-cy)*.62
        ));
        g.strokePoints(ring,true);
      }else{
        for(let i=0;i<n;i+=3){
          g.beginPath();
          g.moveTo(cx,cy);
          g.lineTo(outer[i].x,outer[i].y);
          g.strokePath();
        }
      }

      g.lineStyle(Math.max(1.4,r*.020),0xffffff,.44);
      g.strokePoints(outer,true);

      // Restrained highlight streak.
      g.lineStyle(Math.max(1,r*.013),accent,.38);
      g.beginPath();
      g.moveTo(cx-r*.28,cy-r*.48);
      g.lineTo(cx+r*.18,cy-r*.32);
      g.strokePath();

      g.generateTexture('gem-'+index,size,size);
      g.destroy();
    }

    drawVaultBackdrop() {
      const bg=this.add.graphics().setDepth(0);
      bg.fillStyle(0x190722,.62);
      bg.fillRect(0,0,W,H);

      bg.fillStyle(0x6a1b78,.055);
      bg.fillEllipse(W*.5,H*.72,W*.82,H*.40);

      // Rails are outside the collision faces.
      const rails=this.add.graphics().setDepth(18);
      rails.fillGradientStyle(0xffdd7a,0xf2a433,0xb13f61,0x6f2253,1);
      rails.fillRect(WALL-8,18,8,FLOOR-18);
      rails.fillRect(W-WALL,18,8,FLOOR-18);
      rails.fillGradientStyle(0xffed9e,0xffbd3f,0xb13f61,0x6a1f52,1);
      rails.fillRect(WALL,FLOOR+2,W-WALL*2,10);
      rails.lineStyle(2,0xffd666,.34);
      rails.strokeRect(WALL,19,W-WALL*2,FLOOR-19);

      const sparkleColors=[0xffc65b,0xf36ac8,0xa46cff];
      for(let i=0;i<28;i++){
        const x=(i*173.7)%W;
        const y=(i*109.3)%H;
        const s=this.add.circle(x,y,.75+(i%3)*.24,sparkleColors[i%3],.18).setDepth(1);
        this.tweens.add({
          targets:s,
          alpha:{from:.06,to:.28},
          y:y-4-(i%4),
          duration:1500+(i%5)*220,
          yoyo:true,
          repeat:-1,
          ease:'Sine.inOut',
          delay:(i%7)*170
        });
      }
    }

    randomSpawnTier() {
      const r=Math.random();
      return r<.32?0:r<.59?1:r<.80?2:r<.94?3:4;
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
      this.lastDropAt=0;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.discoveredCuts=new Set([0]);

      scoreEl.textContent='0';
      dangerHud.hidden=true;
      cutToast.classList.remove('show');
      gestureHint.classList.remove('hidden');

      this.matter.world.resume();
      this.updateNextPreview();
      this.updateAimHandle();
      this.createDropPreview(true);
    }

    clearRun() {
      for(const gem of [...this.gems]) this.removeGem(gem);
      this.gems.length=0;
      this.pendingMerges.length=0;

      if(this.preview){
        this.preview.destroy();
        this.preview=null;
      }

      this.time.removeAllEvents();
    }

    createDropPreview(animate=false) {
      if(!this.running||this.paused||!this.ready) return;
      if(this.preview) this.preview.destroy();

      const t=tiers[this.currentTier];
      const x=clamp(this.targetX,WALL+t.r*COLLIDER_SCALE,W-WALL-t.r*COLLIDER_SCALE);
      this.preview=this.add.image(x,DROP_Y,'gem-'+this.currentTier).setDepth(32);

      if(animate){
        this.preview.setAlpha(0);
        this.tweens.add({
          targets:this.preview,
          alpha:1,
          duration:130,
          ease:'Quad.Out'
        });
      }
    }

    createGem(x,y,tier) {
      const t=tiers[tier];
      const gem=this.matter.add.image(x,y,'gem-'+tier,null,{
        label:'gem',
        restitution:.05,
        friction:.008,
        frictionStatic:.10,
        frictionAir:.001,
        density:.00115,
        sleepThreshold:60
      });

      // Real geometric pieces. Phaser Matter supports polygon bodies directly.
      // A small chamfer softens razor-sharp corners enough for stable stacking,
      // while preserving flats and vertices so the pieces genuinely tumble,
      // wedge and fit together differently by tier.
      gem.setPolygon(
        t.r*COLLIDER_SCALE,
        t.physicsSides,
        {
          chamfer:{radius:Math.max(2,Math.min(8,t.r*.055)),quality:2},
          restitution:.045,
          friction:.035,
          frictionStatic:.28,
          frictionAir:.002,
          density:.00115,
          sleepThreshold:70,
          slop:.05
        }
      );
      gem.setBounce(.045);
      gem.setFriction(.035,.002,.28);
      gem.setDensity(.00115);
      gem.setSleepThreshold(70);
      gem.setAngle(Phaser.Math.FloatBetween(-6,6));
      gem.setAngularVelocity(Phaser.Math.FloatBetween(-.006,.006));

      gem.isGem=true;
      gem.tier=tier;
      gem.merging=false;
      gem.born=this.time.now;
      gem.setDepth(10+tier*.01);

      this.gems.push(gem);
      return gem;
    }

    removeGem(gem) {
      if(!gem||!gem.active) return;
      const i=this.gems.indexOf(gem);
      if(i>=0) this.gems.splice(i,1);

      if(gem.body) this.matter.world.remove(gem.body);
      gem.destroy();
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
      return clamp(pointer.x,WALL+t.r*COLLIDER_SCALE,W-WALL-t.r*COLLIDER_SCALE);
    }

    updateAimHandle() {
      if(!this.aimHandle) return;
      const t=tiers[this.currentTier];
      const min=WALL+t.r;
      const max=W-WALL-t.r;
      const u=clamp((this.targetX-min)/Math.max(1,max-min),0,1);
      this.aimHandle.style.left=(u*100)+'%';
    }

    dropCurrent() {
      if(!this.running||this.paused||!this.ready) return;
      if(this.time.now-this.lastDropAt<DROP_DELAY) return;

      const t=tiers[this.currentTier];
      const x=clamp(this.preview?.x??this.targetX,WALL+t.r*COLLIDER_SCALE,W-WALL-t.r*COLLIDER_SCALE);

      if(this.preview){
        this.preview.destroy();
        this.preview=null;
      }

      const gem=this.createGem(x,DROP_Y,this.currentTier);
      gem.setVelocity(0,.15);

      this.lastDropAt=this.time.now;
      this.ready=false;

      tone(180,.04,.015,'triangle');
      haptic(5);

      this.currentTier=this.nextTier;
      this.nextTier=this.randomSpawnTier();
      this.updateNextPreview();
      this.updateAimHandle();
      gestureHint.classList.add('hidden');

      this.time.delayedCall(DROP_DELAY,()=>{
        if(!this.running) return;
        this.ready=true;
        this.createDropPreview(true);
      });
    }

    onCollisionStart(event) {
      for(const pair of event.pairs){
        const a=pair.bodyA?.gameObject;
        const b=pair.bodyB?.gameObject;

        if(!a?.isGem||!b?.isGem||!a.active||!b.active) continue;

        const av=a.body.velocity;
        const bv=b.body.velocity;
        const speed=Math.hypot(bv.x-av.x,bv.y-av.y);

        if(speed>2.0){
          this.contactSpark(
            (a.x+b.x)/2,
            (a.y+b.y)/2,
            tiers[Math.max(a.tier,b.tier)].accent,
            speed
          );
        }

        if(a.tier!==b.tier||a.merging||b.merging) continue;

        a.merging=true;
        b.merging=true;
        this.pendingMerges.push([a,b]);
      }
    }

    processMerges() {
      if(!this.pendingMerges.length) return;
      const queue=this.pendingMerges.splice(0);

      for(const [a,b] of queue){
        if(!a?.active||!b?.active||a.tier!==b.tier) continue;

        const tier=a.tier;
        const next=tier+1;
        const x=(a.x+b.x)/2;
        const y=(a.y+b.y)/2;
        const vx=(a.body.velocity.x+b.body.velocity.x)*.32;
        const vy=(a.body.velocity.y+b.body.velocity.y)*.18;
        const av=(a.body.angularVelocity+b.body.angularVelocity)*.22;

        this.removeGem(a);
        this.removeGem(b);

        this.mergeChain=this.mergeWindow>0?this.mergeChain+1:1;
        this.mergeWindow=.70;

        if(next>=tiers.length){
          this.addScore(100);
          this.mergeBurst(x,y,tiers[tier],true);
          this.floatText(x,y-8,'MASTER CUT +100','#ffe0a0',21);
          this.cameras.main.shake(90,.0035);
          tone(760,.15,.042,'sine');
          haptic([14,17,22]);
          continue;
        }

        const gem=this.createGem(x,y,next);
        gem.setVelocity(vx,vy);
        gem.setAngularVelocity(clamp(av,-.025,.025));

        this.bestTierReached=Math.max(this.bestTierReached,next);
        this.addScore(tiers[next].score);
        this.mergeBurst(x,y,tiers[next],next>=6);

        const label=this.mergeChain>=2
          ? this.mergeChain+'× CHAIN  +'+tiers[next].score
          : '+'+tiers[next].score;
        this.floatText(x,y-8,label,'#ffe7c5',this.mergeChain>=2?20:17);

        this.cameras.main.shake(70,next>=7?.0028:.0015);
        tone(270+next*43,.07+next*.004,.022+Math.min(.017,next*.0018),'sine');
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
        const dist=Phaser.Math.Between(big?45:28,big?96:68);
        const shard=this.add.triangle(
          x,y,
          0,-3,
          2.7,2.5,
          -2.7,2.5,
          i%3===0?0xffffff:color,
          .90
        ).setDepth(40).setRotation(angle);

        this.tweens.add({
          targets:shard,
          x:x+Math.cos(angle)*dist,
          y:y+Math.sin(angle)*dist,
          alpha:0,
          scale:.35,
          rotation:angle+Phaser.Math.FloatBetween(-1.4,1.4),
          duration:Phaser.Math.Between(250,410),
          ease:'Cubic.Out',
          onComplete:()=>shard.destroy()
        });
      }

      const ring=this.add.circle(x,y,14,color,.08).setStrokeStyle(2,color,.68).setDepth(39);
      this.tweens.add({
        targets:ring,
        scale:big?4.4:3.1,
        alpha:0,
        duration:big?400:300,
        ease:'Quad.Out',
        onComplete:()=>ring.destroy()
      });
    }

    contactSpark(x,y,colorHex,speed) {
      const count=Math.min(4,1+Math.floor(speed/2));
      const color=hexToInt(colorHex);

      for(let i=0;i<count;i++){
        const p=this.add.circle(x,y,Phaser.Math.FloatBetween(1.1,2.0),i===0?0xffffff:color,.80).setDepth(38);
        const a=Phaser.Math.FloatBetween(-2.8,-.35);
        const d=Phaser.Math.Between(15,32);
        this.tweens.add({
          targets:p,
          x:x+Math.cos(a)*d,
          y:y+Math.sin(a)*d,
          alpha:0,
          scale:.35,
          duration:160,
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
      }).setOrigin(.5).setDepth(45);

      this.tweens.add({
        targets:label,
        y:y-32,
        alpha:0,
        duration:600,
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
      const maxW=50;
      const maxH=44;
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
          const target=clamp(this.targetX,WALL+t.r*COLLIDER_SCALE,W-WALL-t.r*COLLIDER_SCALE);
          this.preview.x=Phaser.Math.Linear(this.preview.x,target,this.pointerHeld?.48:.30);
        }

        let high=false;

        for(const gem of this.gems){
          if(!gem?.active||!gem.body) continue;

          const body=gem.body;
          if(
            time-gem.born>800 &&
            body.speed<.70 &&
            body.bounds.min.y<LIMIT_Y
          ){
            high=true;
          }
        }

        if(high) this.dangerTime+=dt;
        else this.dangerTime=Math.max(0,this.dangerTime-dt*3.8);

        dangerHud.hidden=this.dangerTime<.18;
        if(this.dangerTime>=1.75) this.endGame();
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

  const config={
    type:Phaser.CANVAS,
    parent:'game',
    width:W,
    height:H,
    transparent:true,
    antialias:true,
    roundPixels:false,
    banner:false,
    fps:{
      target:60,
      smoothStep:true
    },
    physics:{
      default:'matter',
      matter:{
        gravity:{x:0,y:1},
        enableSleeping:true,
        runner:{
          fps:60,
          maxUpdates:5,
          maxFrameTime:33.333
        },
        debug:false
      }
    },
    render:{
      antialias:true,
      pixelArt:false,
      roundPixels:false
    },
    scene:GameScene
  };

  new Phaser.Game(config);
})();
