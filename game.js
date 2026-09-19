(() => {
  'use strict';

  if (!window.Phaser) return;

  const W = 640;
  const H = 864;
  const FRAME_WALL = 24;
  const FRAME_FLOOR = 828;
  const WALL = 42;
  const FLOOR = 808;
  const DROP_Y = 72;
  const LIMIT_Y = 146;
  const DROP_DELAY = 300;
  const COLLIDER_SCALE = 0.94;
  const ART_SCALE = 0.925;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const homeBestEl = $('homeBest');
  const nextPreview = $('nextPreview');
  const statusHud = $('statusHud');
  const statusIcon = $('statusIcon');
  const statusText = $('statusText');
  const collectionOverlay = $('collectionOverlay');
  const gemCollection = $('gemCollection');
  const collectionProgress = $('collectionProgress');
  const startOverlay = $('startOverlay');
  const pauseOverlay = $('pauseOverlay');
  const gameOverOverlay = $('gameOverOverlay');
  const finalScoreEl = $('finalScore');
  const bestMergeEl = $('bestMerge');

  const CUTS = {
    rose: {
      label:'Rose',
      verts:[[-.58,-.82],[0,-1],[.58,-.82],[.92,-.28],[.86,.36],[.48,.82],[0,.98],[-.48,.82],[-.86,.36],[-.92,-.28]],
      rings:[.43],
      pattern:'rose'
    },
    trillion: {
      label:'Trillion',
      verts:[[0,-1],[.92,.67],[.56,.94],[-.56,.94],[-.92,.67]],
      rings:[.47],
      pattern:'tri'
    },
    cushion: {
      label:'Cushion',
      verts:[[-.58,-.88],[.58,-.88],[.88,-.58],[.92,.48],[.62,.84],[-.62,.84],[-.92,.48],[-.88,-.58]],
      rings:[.48],
      pattern:'cushion'
    },
    emerald: {
      label:'Emerald',
      verts:[[-.54,-.94],[.54,-.94],[.82,-.66],[.82,.66],[.54,.94],[-.54,.94],[-.82,.66],[-.82,-.66]],
      rings:[.72,.48],
      pattern:'step'
    },
    princess: {
      label:'Princess',
      verts:[[-.88,-.88],[.88,-.88],[.88,.88],[-.88,.88]],
      rings:[.66,.39],
      pattern:'princess'
    },
    radiant: {
      label:'Radiant',
      verts:[[-.58,-.92],[.58,-.92],[.88,-.62],[.88,.62],[.58,.92],[-.58,.92],[-.88,.62],[-.88,-.62]],
      rings:[.68,.42],
      pattern:'radiant'
    },
    oval: {
      label:'Oval',
      verts:[[0,-1],[.42,-.92],[.74,-.70],[.92,-.34],[.98,0],[.92,.34],[.74,.70],[.42,.92],[0,1],[-.42,.92],[-.74,.70],[-.92,.34],[-.98,0],[-.92,-.34],[-.74,-.70],[-.42,-.92]],
      rings:[.46],
      pattern:'brilliant'
    },
    asscher: {
      label:'Asscher',
      verts:[[-.54,-.92],[.54,-.92],[.86,-.60],[.86,.60],[.54,.92],[-.54,.92],[-.86,.60],[-.86,-.60]],
      rings:[.74,.56,.36],
      pattern:'step'
    },
    pear: {
      label:'Pear',
      verts:[[0,-1],[.30,-.72],[.58,-.34],[.76,.12],[.70,.52],[.46,.82],[0,.98],[-.46,.82],[-.70,.52],[-.76,.12],[-.58,-.34],[-.30,-.72]],
      rings:[.45],
      pattern:'pear'
    },
    navette: {
      label:'Navette',
      verts:[[0,-1],[.34,-.64],[.56,-.18],[.56,.18],[.34,.64],[0,1],[-.34,.64],[-.56,.18],[-.56,-.18],[-.34,-.64]],
      rings:[.46],
      pattern:'navette'
    },
    brilliant: {
      label:'Brilliant',
      verts:[[0,-1],[.38,-.92],[.70,-.70],[.92,-.38],[1,0],[.92,.38],[.70,.70],[.38,.92],[0,1],[-.38,.92],[-.70,.70],[-.92,.38],[-1,0],[-.92,-.38],[-.70,-.70],[-.38,-.92]],
      rings:[.48],
      pattern:'brilliant'
    }
  };

  const tiers = [
    {name:'Quartz',     cut:'Rose',      cutKey:'rose',      r:34,  score:1,  color:'#E7F0F4', accent:'#FFFFFF', dark:'#A7B4BC'},
    {name:'Citrine',    cut:'Trillion',  cutKey:'trillion',  r:42,  score:3,  color:'#F2BC32', accent:'#FFF0A1', dark:'#B97718'},
    {name:'Peridot',    cut:'Cushion',   cutKey:'cushion',   r:50,  score:6,  color:'#99D64D', accent:'#DFF5A0', dark:'#619A31'},
    {name:'Aquamarine', cut:'Emerald',   cutKey:'emerald',   r:60,  score:10, color:'#6BD5E2', accent:'#D8FAFF', dark:'#3094A5'},
    {name:'Amethyst',   cut:'Princess',  cutKey:'princess',  r:72,  score:15, color:'#A968E5', accent:'#EFD7FF', dark:'#7141A3'},
    {name:'Topaz',      cut:'Radiant',   cutKey:'radiant',   r:84,  score:21, color:'#F07945', accent:'#FFD1A6', dark:'#B4492F'},
    {name:'Sapphire',   cut:'Oval',      cutKey:'oval',      r:98,  score:28, color:'#3A6FE0', accent:'#C0D6FF', dark:'#2549A1'},
    {name:'Emerald',    cut:'Asscher',   cutKey:'asscher',   r:112, score:36, color:'#22BC82', accent:'#AAF0D1', dark:'#137956'},
    {name:'Ruby',       cut:'Pear',      cutKey:'pear',      r:130, score:45, color:'#E94063', accent:'#FFC1CF', dark:'#9B2944'},
    {name:'Starstone',  cut:'Navette',   cutKey:'navette',   r:150, score:55, color:'#756CF0', accent:'#DED8FF', dark:'#493BA3'},
    {name:'Crownstone', cut:'Brilliant', cutKey:'brilliant', r:170, score:66, color:'#F3AF37', accent:'#FFF1A8', dark:'#AA6C16'}
  ];

  let audioCtx = null;

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

  function rgba(hex,alpha=1) {
    const c=Phaser.Display.Color.HexStringToColor(hex);
    return 'rgba('+c.red+','+c.green+','+c.blue+','+alpha+')';
  }

  function mixCss(aHex,bHex,t,alpha=1) {
    const a=Phaser.Display.Color.HexStringToColor(aHex);
    const b=Phaser.Display.Color.HexStringToColor(bHex);
    const u=clamp(t,0,1);
    const r=Math.round(a.red+(b.red-a.red)*u);
    const g=Math.round(a.green+(b.green-a.green)*u);
    const bl=Math.round(a.blue+(b.blue-a.blue)*u);
    return 'rgba('+r+','+g+','+bl+','+alpha+')';
  }

  function normalCss(nx,ny,nz) {
    const len=Math.hypot(nx,ny,nz)||1;
    nx/=len;
    ny/=len;
    nz/=len;
    const r=Math.round((nx*.5+.5)*255);
    const g=Math.round((ny*.5+.5)*255);
    const b=Math.round((nz*.5+.5)*255);
    return 'rgb('+r+','+g+','+b+')';
  }

  function polygonPath(ctx,points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y);
    ctx.closePath();
  }

  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function tone(freq,duration=.055,volume=.022,type='sine') {
    if (!audioCtx) return;
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

  function haptic(value=7) {
    try { if (navigator.vibrate) navigator.vibrate(value); } catch {}
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');

      this.gems=[];
      this.pendingMerges=[];
      this.score=0;
      this.best=0;
      this.currentTier=0;
      this.nextTier=0;
      this.bestTierReached=0;
      this.ready=false;
      this.running=false;
      this.paused=false;
      this.pointerHeld=false;
      this.targetX=W/2;
      this.preview=null;
      this.lastDropAt=0;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.discoveredCuts=new Set([0]);
      this.unlockedTiers=new Set([0]);
      this.limitLine=null;
      this.dropper=null;
      this.limitJewels=[];
      this.statusTimer=null;
      this.statusKind='';
      this.powerUsed={tumble:false,cascade:false,prism:false};
      this.gemMaskShape=null;
      this.gemMask=null;
      this.webglLighting=false;
      this.keyLight=null;
      this.fillLight=null;
      this.rimLight=null;
      this.uiBound=false;
    }

    create() {
      this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
      this.matter.set60Hz();

      const engine=this.matter.world.engine;
      engine.positionIterations=10;
      engine.velocityIterations=8;
      engine.constraintIterations=2;
      engine.gravity.y=1.14;
      engine.gravity.scale=.001;

      this.makeTextures();
      this.setupGemLighting();
      this.drawVaultBackdrop();
      this.createWorldWalls();
      this.createGemMask();

      this.matter.world.on('collisionstart',event=>this.onCollisionStart(event));

      this.limitLine=this.add.graphics().setDepth(6);
      this.dropper=this.add.graphics().setDepth(30);
      this.limitJewels=[
        this.add.rectangle(WALL+17,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7),
        this.add.rectangle(W-WALL-17,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7)
      ];

      this.aimStrip=$('aimStrip');
      this.aimHandle=$('aimHandle');

      this.best=this.loadBest();
      homeBestEl.textContent='$'+fmt(this.best);
      this.unlockedTiers=this.loadUnlocked();
      this.discoveredCuts=new Set(this.unlockedTiers);

      this.bindUI();
      this.renderCollection();
      this.updateNextPreview();
      this.updatePowerButtons();
    }

    createWorldWalls() {
      const wallOptions={
        isStatic:true,
        label:'vault-wall',
        friction:.08,
        frictionStatic:.24,
        restitution:.02
      };

      this.floorBody=this.matter.add.rectangle(
        W/2,
        FLOOR+72,
        W+220,
        144,
        wallOptions
      );

      this.leftWallBody=this.matter.add.rectangle(
        WALL-54,
        H/2,
        108,
        H*2,
        wallOptions
      );

      this.rightWallBody=this.matter.add.rectangle(
        W-WALL+54,
        H/2,
        108,
        H*2,
        wallOptions
      );
    }

    createGemMask() {
      this.gemMaskShape=this.make.graphics({x:0,y:0,add:false});
      this.gemMaskShape.fillStyle(0xffffff,1);
      this.gemMaskShape.fillRect(WALL,20,W-WALL*2,FLOOR-20);
      this.gemMask=this.gemMaskShape.createGeometryMask();
    }

    bindUI() {
      if (this.uiBound) return;
      this.uiBound=true;

      $('startButton').addEventListener('click',()=>{
        unlockAudio();
        startOverlay.classList.remove('visible');
        this.startRun();
      });

      $('collectionButton').addEventListener('click',()=>{
        this.renderCollection();
        collectionOverlay.classList.add('visible');
      });

      $('collectionBack').addEventListener('click',()=>{
        collectionOverlay.classList.remove('visible');
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

      $('powerTumble').addEventListener('click',()=>this.useTumble());
      $('powerCascade').addEventListener('click',()=>this.useCascade());
      $('powerPrism').addEventListener('click',()=>this.usePrism());

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
        const min=WALL+t.r*COLLIDER_SCALE;
        const max=W-WALL-t.r*COLLIDER_SCALE;
        this.targetX=Phaser.Math.Linear(min,max,u);
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

    loadUnlocked() {
      try {
        const raw=JSON.parse(localStorage.getItem('gemDropUnlocked')||'[0]');
        const valid=Array.isArray(raw)
          ? raw.filter(n=>Number.isInteger(n)&&n>=0&&n<tiers.length)
          : [0];
        valid.push(0);
        return new Set(valid);
      } catch {
        return new Set([0]);
      }
    }

    saveUnlocked() {
      try {
        localStorage.setItem(
          'gemDropUnlocked',
          JSON.stringify([...this.unlockedTiers].sort((a,b)=>a-b))
        );
      } catch {}
    }

    unlockTier(tier,notify=false) {
      if(tier<0||tier>=tiers.length||this.unlockedTiers.has(tier)) return false;

      this.unlockedTiers.add(tier);
      this.discoveredCuts.add(tier);
      this.saveUnlocked();
      this.renderCollection();

      if(notify){
        const t=tiers[tier];
        this.showStatus(t.name+' '+t.cut+' unlocked','reward',1500,'gem',tier);
      }

      return true;
    }

    drawCollectionGem(canvas,tier,locked) {
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);

      if(this.textures.exists('gem-'+tier)){
        const source=this.textures.get('gem-'+tier).getSourceImage();
        const max=locked?72:88;
        const scale=Math.min(max/source.width,max/source.height);
        const w=source.width*scale;
        const h=source.height*scale;

        ctx.save();
        if(locked){
          ctx.globalAlpha=.78;
          ctx.filter='grayscale(1) brightness(.34)';
        }
        ctx.drawImage(source,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
        ctx.restore();
      }
    }

    renderCollection() {
      if(!gemCollection) return;

      gemCollection.innerHTML='';

      tiers.forEach((t,tier)=>{
        const unlocked=this.unlockedTiers.has(tier);
        const card=document.createElement('article');
        card.className='gem-card'+(unlocked?'':' locked');

        const art=document.createElement('div');
        art.className='gem-card__art';

        const canvas=document.createElement('canvas');
        canvas.width=112;
        canvas.height=112;
        canvas.setAttribute('aria-hidden','true');
        art.appendChild(canvas);

        const name=document.createElement('strong');
        name.textContent=unlocked?t.name:'???';

        const cut=document.createElement('small');
        cut.textContent=unlocked?t.cut+' cut':'Locked';

        const value=document.createElement('div');
        value.className='gem-card__value';
        value.textContent=unlocked?'$'+fmt(t.score):'';

        card.append(art,name,cut,value);
        gemCollection.appendChild(card);
        this.drawCollectionGem(canvas,tier,!unlocked);
      });

      collectionProgress.textContent=this.unlockedTiers.size+' / '+tiers.length;
    }

    makeTextures() {
      this.makeSparkleTexture();
      for(let i=0;i<tiers.length;i++) this.makeGemTexture(i);
    }

    makeSparkleTexture() {
      const canvas=document.createElement('canvas');
      canvas.width=64;
      canvas.height=64;
      const ctx=canvas.getContext('2d');
      const cx=32;
      const cy=32;

      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,18);
      glow.addColorStop(0,'rgba(255,255,255,.98)');
      glow.addColorStop(.18,'rgba(255,246,214,.86)');
      glow.addColorStop(.48,'rgba(255,223,160,.26)');
      glow.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=glow;
      ctx.fillRect(0,0,64,64);

      ctx.strokeStyle='rgba(255,255,255,.92)';
      ctx.lineCap='round';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(32,6);
      ctx.lineTo(32,58);
      ctx.moveTo(6,32);
      ctx.lineTo(58,32);
      ctx.stroke();

      ctx.strokeStyle='rgba(255,239,194,.56)';
      ctx.lineWidth=1.4;
      ctx.beginPath();
      ctx.moveTo(15,15);
      ctx.lineTo(49,49);
      ctx.moveTo(49,15);
      ctx.lineTo(15,49);
      ctx.stroke();

      this.textures.addCanvas('gem-sparkle',canvas);
    }

    cutPoints(cutKey,scale,cx=0,cy=0) {
      const cut=CUTS[cutKey]||CUTS.brilliant;
      return cut.verts.map(v=>({x:cx+v[0]*scale,y:cy+v[1]*scale}));
    }

    insetPoints(points,cx,cy,scale) {
      return points.map(p=>({
        x:cx+(p.x-cx)*scale,
        y:cy+(p.y-cy)*scale
      }));
    }

    makeGemTexture(index) {
      const t=tiers[index];
      const cut=CUTS[t.cutKey];
      const r=t.r;
      const size=Math.ceil(r*2.26);
      const cx=size/2;
      const cy=size/2;
      const R=r*ART_SCALE;
      const outer=this.cutPoints(t.cutKey,R,cx,cy);
      const rings=cut.rings.map(scale=>this.insetPoints(outer,cx,cy,scale));
      const inner=rings[rings.length-1];
      const n=outer.length;

      const canvas=document.createElement('canvas');
      canvas.width=size;
      canvas.height=size;
      const ctx=canvas.getContext('2d');

      ctx.save();
      polygonPath(ctx,outer);
      ctx.clip();

      const body=ctx.createRadialGradient(cx-R*.12,cy-R*.15,R*.03,cx,cy,R*1.08);
      body.addColorStop(0,rgba(t.accent,.98));
      body.addColorStop(.24,rgba(t.color,.98));
      body.addColorStop(.72,rgba(t.color,.97));
      body.addColorStop(1,mixCss(t.dark,t.color,.46,.96));
      ctx.fillStyle=body;
      ctx.fillRect(0,0,size,size);

      // Clear gemstone transmission, kept bright enough to read on a dark board.
      ctx.globalCompositeOperation='screen';
      const transmission=ctx.createRadialGradient(cx-R*.18,cy-R*.22,0,cx,cy,R*.76);
      transmission.addColorStop(0,'rgba(255,255,255,.32)');
      transmission.addColorStop(.25,rgba(t.accent,.30));
      transmission.addColorStop(.68,rgba(t.color,.10));
      transmission.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=transmission;
      ctx.fillRect(0,0,size,size);
      ctx.globalCompositeOperation='source-over';

      const drawRingFacets=(a,b,alphaBase=.18)=>{
        const count=Math.min(a.length,b.length);
        for(let i=0;i<count;i++){
          const j=(i+1)%count;
          const target=i%3===0?t.accent:(i%3===1?t.dark:t.color);
          ctx.fillStyle=mixCss(t.color,target,.24+(i%2)*.10,alphaBase+(i%3)*.025);
          ctx.beginPath();
          ctx.moveTo(a[i].x,a[i].y);
          ctx.lineTo(a[j].x,a[j].y);
          ctx.lineTo(b[j].x,b[j].y);
          ctx.lineTo(b[i].x,b[i].y);
          ctx.closePath();
          ctx.fill();
        }
      };

      let previous=outer;
      for(let ri=0;ri<rings.length;ri++){
        drawRingFacets(previous,rings[ri],.16+ri*.025);
        previous=rings[ri];
      }

      // Cut-specific internal facet geometry.
      if(cut.pattern==='step'){
        ctx.globalCompositeOperation='screen';
        ctx.strokeStyle='rgba(255,255,255,.17)';
        ctx.lineWidth=Math.max(1,r*.014);
        for(const ring of rings){
          polygonPath(ctx,ring);
          ctx.stroke();
        }
        ctx.globalCompositeOperation='source-over';
        ctx.fillStyle=mixCss(t.color,t.accent,.38,.22);
        polygonPath(ctx,inner);
        ctx.fill();
      }else if(cut.pattern==='princess'){
        for(let i=0;i<n;i++){
          const j=(i+1)%n;
          ctx.fillStyle=i%2===0?mixCss(t.color,t.accent,.42,.24):mixCss(t.dark,t.color,.68,.16);
          ctx.beginPath();
          ctx.moveTo(inner[i].x,inner[i].y);
          ctx.lineTo(inner[j].x,inner[j].y);
          ctx.lineTo(cx,cy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle='rgba(255,255,255,.18)';
        ctx.lineWidth=Math.max(1,r*.014);
        ctx.beginPath();
        ctx.moveTo(inner[0].x,inner[0].y);
        ctx.lineTo(inner[2].x,inner[2].y);
        ctx.moveTo(inner[1].x,inner[1].y);
        ctx.lineTo(inner[3].x,inner[3].y);
        ctx.stroke();
      }else{
        for(let i=0;i<n;i++){
          const j=(i+1)%n;
          const target=(i%2===0)?t.accent:t.dark;
          ctx.fillStyle=mixCss(t.color,target,i%2===0?.35:.24,i%2===0?.20:.14);
          ctx.beginPath();
          ctx.moveTo(inner[i].x,inner[i].y);
          ctx.lineTo(inner[j].x,inner[j].y);
          ctx.lineTo(cx,cy);
          ctx.closePath();
          ctx.fill();
        }

        if(cut.pattern==='rose'||cut.pattern==='brilliant'||cut.pattern==='tri'){
          ctx.globalCompositeOperation='screen';
          ctx.strokeStyle='rgba(255,255,255,.19)';
          ctx.lineWidth=Math.max(1,r*.013);
          const skip=cut.pattern==='brilliant'?2:1;
          for(let i=0;i<n;i+=skip){
            const target=outer[(i+Math.max(2,Math.floor(n/4)))%n];
            ctx.beginPath();
            ctx.moveTo(inner[i].x,inner[i].y);
            ctx.lineTo(target.x,target.y);
            ctx.stroke();
          }
          ctx.globalCompositeOperation='source-over';
        }
      }

      const tableScale=cut.pattern==='step'?1:.82;
      const table=this.insetPoints(inner,cx,cy,tableScale);
      const tableGrad=ctx.createRadialGradient(cx-R*.12,cy-R*.12,0,cx,cy,R*.48);
      tableGrad.addColorStop(0,rgba(t.accent,.72));
      tableGrad.addColorStop(.50,rgba(t.color,.40));
      tableGrad.addColorStop(1,mixCss(t.dark,t.color,.62,.16));
      ctx.fillStyle=tableGrad;
      polygonPath(ctx,table);
      ctx.fill();

      // Subtle internal refraction wedges.
      ctx.globalCompositeOperation='multiply';
      for(let i=1;i<n;i+=3){
        const j=(i+Math.max(2,Math.floor(n/5)))%n;
        ctx.fillStyle=mixCss(t.dark,t.color,.65,.045);
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.lineTo(inner[i].x,inner[i].y);
        ctx.lineTo(outer[j].x,outer[j].y);
        ctx.closePath();
        ctx.fill();
      }

      ctx.globalCompositeOperation='screen';
      ctx.strokeStyle='rgba(255,255,255,.20)';
      ctx.lineWidth=Math.max(1,r*.014);
      for(let i=0;i<n;i++){
        ctx.beginPath();
        ctx.moveTo(outer[i].x,outer[i].y);
        ctx.lineTo(inner[i].x,inner[i].y);
        ctx.stroke();
      }

      ctx.restore();

      polygonPath(ctx,outer);
      ctx.strokeStyle=rgba(t.accent,.54);
      ctx.lineWidth=Math.max(1.4,r*.022);
      ctx.stroke();

      // Matching normal map. Each actual facet gets its own surface direction.
      const normal=document.createElement('canvas');
      normal.width=size;
      normal.height=size;
      const nctx=normal.getContext('2d');

      polygonPath(nctx,outer);
      nctx.fillStyle='rgb(128,128,255)';
      nctx.fill();

      const paintNormalRing=(a,b,tilt,z)=>{
        const count=Math.min(a.length,b.length);
        for(let i=0;i<count;i++){
          const j=(i+1)%count;
          const mx=(a[i].x+a[j].x+b[i].x+b[j].x)/4-cx;
          const my=(a[i].y+a[j].y+b[i].y+b[j].y)/4-cy;
          const len=Math.hypot(mx,my)||1;
          const nx=(mx/len)*tilt;
          const ny=-(my/len)*tilt;

          nctx.fillStyle=normalCss(nx,ny,z);
          nctx.beginPath();
          nctx.moveTo(a[i].x,a[i].y);
          nctx.lineTo(a[j].x,a[j].y);
          nctx.lineTo(b[j].x,b[j].y);
          nctx.lineTo(b[i].x,b[i].y);
          nctx.closePath();
          nctx.fill();
        }
      };

      previous=outer;
      for(let ri=0;ri<rings.length;ri++){
        paintNormalRing(previous,rings[ri],.62-ri*.09,.73+ri*.07);
        previous=rings[ri];
      }

      for(let i=0;i<n;i++){
        const j=(i+1)%n;
        const mx=(inner[i].x+inner[j].x)/2-cx;
        const my=(inner[i].y+inner[j].y)/2-cy;
        const len=Math.hypot(mx,my)||1;

        nctx.fillStyle=normalCss((mx/len)*.38,-(my/len)*.38,.90);
        nctx.beginPath();
        nctx.moveTo(inner[i].x,inner[i].y);
        nctx.lineTo(inner[j].x,inner[j].y);
        nctx.lineTo(cx,cy);
        nctx.closePath();
        nctx.fill();
      }

      polygonPath(nctx,table);
      nctx.fillStyle=normalCss(0,0,1);
      nctx.fill();

      const texture=this.textures.addCanvas('gem-'+index,canvas);
      if(texture){
        texture.setDataSource(normal);
        texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }

    setupGemLighting() {
      this.webglLighting=(this.game.renderer.type===Phaser.WEBGL);

      if(!this.webglLighting) return;

      this.lights.enable();
      // Keep every stone readable even when no facet directly faces a lamp.
      // Gemstone shadows should stay richly coloured, not collapse to black.
      this.lights.setAmbientColor(0x927f99);

      // Large-radius lights create a jewellery-display feel across the whole
      // basin. Direction still matters to the normal maps, but brightness no
      // longer falls off dramatically just because a gem reaches the floor.
      this.keyLight=this.lights.addLight(70,-30,1460,0xffefd0,1.72);
      this.fillLight=this.lights.addLight(650,280,1260,0xb19aff,.62);
      this.rimLight=this.lights.addLight(320,910,920,0xff77b6,.34);
    }

    applyGemLighting(gameObject) {
      if(this.webglLighting&&gameObject&&gameObject.setPipeline){
        gameObject.setPipeline('Light2D');
      }
    }

    createGemGlint(gem) {
      if(!gem||!this.textures.exists('gem-sparkle')) return;

      const glint=this.add.image(gem.x,gem.y,'gem-sparkle')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(34+gem.tier*.01)
        .setAlpha(0);

      if(this.gemMask) glint.setMask(this.gemMask);

      gem.glint=glint;
      gem.opticSeed=Math.random()*Math.PI*2;
    }

    syncGemOptics(gem,time) {
      if(!gem||!gem.active||!gem.body||!gem.glint||!gem.glint.active) return;

      const t=tiers[gem.tier];
      const lx=this.keyLight?this.keyLight.x:70;
      const ly=this.keyLight?this.keyLight.y:30;
      const lightAngle=Math.atan2(ly-gem.y,lx-gem.x);

      // Sharp angle-dependent flashes. The highlight is world-oriented, so it
      // does not look painted onto the rotating sprite.
      const cut=CUTS[t.cutKey]||CUTS.brilliant;
      const facetCount=cut.verts.length;
      const phase=(gem.rotation-lightAngle)*facetCount*2+gem.opticSeed;
      const flash=Math.pow(Math.max(0,Math.cos(phase)),18);
      const motion=clamp(Math.abs(gem.body.angularVelocity)*65+gem.body.speed*.08,.18,1);

      const localLight=Phaser.Math.Angle.Wrap(lightAngle-gem.rotation);
      const facetStep=(Math.PI*2)/facetCount;
      const facetIndex=Math.round((localLight+Math.PI/2)/facetStep);
      const localFacet=-Math.PI/2+facetIndex*facetStep;
      const worldFacet=localFacet+gem.rotation;

      gem.glint.x=gem.x+Math.cos(worldFacet)*t.r*.42;
      gem.glint.y=gem.y+Math.sin(worldFacet)*t.r*.42;
      gem.glint.rotation=0;
      gem.glint.setScale(clamp(t.r/72,.55,2.15)*(.38+flash*.62));
      gem.glint.setAlpha(clamp(.018+flash*(.48+.32*motion),0,.88));

      const tintMix=.55+.20*Math.sin(time*.0014+gem.opticSeed);
      gem.glint.setTint(mixHex(t.accent,'#ffffff',tintMix));
    }

    drawVaultBackdrop() {
      const bg=this.add.graphics().setDepth(0);
      bg.fillStyle(0x15091c,.76);
      bg.fillRect(0,0,W,H);

      bg.fillStyle(0x552063,.045);
      bg.fillEllipse(W*.5,H*.72,W*.82,H*.40);

      const rails=this.add.graphics().setDepth(18);

      rails.fillGradientStyle(0xffdd7a,0xf2a433,0xb13f61,0x6f2253,1);
      rails.fillRect(FRAME_WALL-8,18,8,FRAME_FLOOR-18);
      rails.fillRect(W-FRAME_WALL,18,8,FRAME_FLOOR-18);

      rails.fillGradientStyle(0xffed9e,0xffbd3f,0xb13f61,0x6a1f52,1);
      rails.fillRect(FRAME_WALL,FRAME_FLOOR,W-FRAME_WALL*2,10);

      rails.lineStyle(2,0xffd666,.34);
      rails.strokeRect(FRAME_WALL,19,W-FRAME_WALL*2,FRAME_FLOOR-19);

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
      this.unlockTier(this.currentTier,false);
      this.unlockTier(this.nextTier,false);
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
      this.discoveredCuts=new Set(this.unlockedTiers);
      this.powerUsed={tumble:false,cascade:false,prism:false};

      scoreEl.textContent='$0';
      this.clearStatus();

      this.matter.world.resume();
      this.updateNextPreview();
      this.updateAimHandle();
      this.createDropPreview(true);
      this.updatePowerButtons();
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
      const min=WALL+t.r*COLLIDER_SCALE;
      const max=W-WALL-t.r*COLLIDER_SCALE;
      const x=clamp(this.targetX,min,max);

      this.preview=this.add.image(x,DROP_Y,'gem-'+this.currentTier).setDepth(32);
      this.applyGemLighting(this.preview);
      this.preview.setAlpha(.97);
      if(this.gemMask) this.preview.setMask(this.gemMask);

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
        restitution:.012,
        friction:.018,
        frictionStatic:.075,
        frictionAir:.004,
        density:.00115,
        sleepThreshold:0
      });

      const cutVerts=this.cutPoints(t.cutKey,t.r*COLLIDER_SCALE);

      gem.setBody(
        {
          type:'fromVertices',
          verts:cutVerts
        },
        {
          restitution:.012,
          friction:.018,
          frictionStatic:.075,
          frictionAir:.004,
          density:.00115,
          sleepThreshold:0,
          slop:.035
        }
      );

      gem.setBounce(.012);
      gem.setFriction(.018,.004,.075);
      gem.setDensity(.00115);
      gem.setSleepThreshold(0);
      gem.setAngle(Phaser.Math.FloatBetween(-5,5));
      gem.setAngularVelocity(Phaser.Math.FloatBetween(-.0035,.0035));

      gem.isGem=true;
      gem.tier=tier;
      gem.merging=false;
      gem.born=this.time.now;
      gem.setDepth(10+tier*.01);
      gem.setAlpha(.97);
      this.applyGemLighting(gem);

      if(this.gemMask) gem.setMask(this.gemMask);

      this.gems.push(gem);
      this.createGemGlint(gem);
      return gem;
    }

    removeGem(gem) {
      if(!gem||!gem.active) return;

      const i=this.gems.indexOf(gem);
      if(i>=0) this.gems.splice(i,1);

      if(gem.glint&&gem.glint.active) gem.glint.destroy();
      gem.glint=null;

      if(gem.body) this.matter.world.remove(gem.body);
      gem.destroy();

      this.updatePowerButtons();
    }

    updateAimHandle() {
      if(!this.aimHandle) return;

      const t=tiers[this.currentTier];
      const min=WALL+t.r*COLLIDER_SCALE;
      const max=W-WALL-t.r*COLLIDER_SCALE;
      const u=clamp((this.targetX-min)/Math.max(1,max-min),0,1);

      this.aimHandle.style.left=(u*100)+'%';
    }

    dropCurrent() {
      if(!this.running||this.paused||!this.ready) return;
      if(this.time.now-this.lastDropAt<DROP_DELAY) return;

      const t=tiers[this.currentTier];
      const min=WALL+t.r*COLLIDER_SCALE;
      const max=W-WALL-t.r*COLLIDER_SCALE;
      const x=clamp(this.preview?this.preview.x:this.targetX,min,max);

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
      this.unlockTier(this.currentTier,false);
      this.unlockTier(this.nextTier,false);

      this.updateNextPreview();
      this.updateAimHandle();
      this.updatePowerButtons();

      this.time.delayedCall(DROP_DELAY,()=>{
        if(!this.running) return;
        this.ready=true;
        this.createDropPreview(true);
      });
    }

    onCollisionStart(event) {
      for(const pair of event.pairs){
        const a=pair.bodyA&&pair.bodyA.gameObject;
        const b=pair.bodyB&&pair.bodyB.gameObject;

        if(!a||!b||!a.isGem||!b.isGem||!a.active||!b.active) continue;

        const av=a.body.velocity;
        const bv=b.body.velocity;
        const speed=Math.hypot(bv.x-av.x,bv.y-av.y);

        if(speed>2){
          this.contactSpark(
            (a.x+b.x)/2,
            (a.y+b.y)/2,
            tiers[Math.max(a.tier,b.tier)].accent,
            speed
          );
        }

        this.queueMerge(a,b);
      }
    }

    queueMerge(a,b) {
      if(!a||!b||!a.active||!b.active) return;
      if(a.tier!==b.tier||a.merging||b.merging) return;

      a.merging=true;
      b.merging=true;
      this.pendingMerges.push([a,b]);
    }

    scanForRestingMatches() {
      for(let i=0;i<this.gems.length;i++){
        const a=this.gems[i];
        if(!a||!a.active||a.merging||!a.body) continue;

        for(let j=i+1;j<this.gems.length;j++){
          const b=this.gems[j];
          if(!b||!b.active||b.merging||!b.body||a.tier!==b.tier) continue;

          const A=a.body.bounds;
          const B=b.body.bounds;
          const gapX=Math.max(0,Math.max(A.min.x-B.max.x,B.min.x-A.max.x));
          const gapY=Math.max(0,Math.max(A.min.y-B.max.y,B.min.y-A.max.y));

          if(gapX>2.5||gapY>2.5) continue;

          const distance=Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y);
          const maxDistance=(tiers[a.tier].r*COLLIDER_SCALE)*2.08;

          if(distance<=maxDistance){
            this.queueMerge(a,b);
            break;
          }
        }
      }
    }

    processMerges() {
      if(!this.pendingMerges.length) return;

      const queue=this.pendingMerges.splice(0);

      for(const pair of queue){
        const a=pair[0];
        const b=pair[1];

        if(!a||!b||!a.active||!b.active||a.tier!==b.tier) continue;

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
          this.floatText(x,y-8,'MASTER CUT +$100','#ffe0a0',21);
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
          ? this.mergeChain+'× CHAIN  +$'+tiers[next].score
          : '+$'+tiers[next].score;

        this.floatText(x,y-8,label,'#ffe7c5',this.mergeChain>=2?20:17);

        this.cameras.main.shake(70,next>=7?.0028:.0015);
        tone(270+next*43,.07+next*.004,.022+Math.min(.017,next*.0018),'sine');
        haptic(next>=8?15:8);

        if(!this.unlockedTiers.has(next)){
          this.unlockTier(next,true);
        }
      }

      this.updatePowerButtons();
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
        const p=this.add.circle(
          x,
          y,
          Phaser.Math.FloatBetween(1.1,2.0),
          i===0?0xffffff:color,
          .80
        ).setDepth(38);

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
        color:color,
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

    renderStatusIcon(icon='sparkles',tier=null) {
      statusIcon.innerHTML='';

      if(icon==='gem'&&Number.isInteger(tier)&&this.textures.exists('gem-'+tier)){
        const canvas=document.createElement('canvas');
        canvas.width=40;
        canvas.height=40;
        const ctx=canvas.getContext('2d');
        const source=this.textures.get('gem-'+tier).getSourceImage();
        const scale=Math.min(34/source.width,34/source.height);
        const w=source.width*scale;
        const h=source.height*scale;
        ctx.drawImage(source,(40-w)/2,(40-h)/2,w,h);
        statusIcon.appendChild(canvas);
        return;
      }

      const i=document.createElement('i');
      i.setAttribute('data-lucide',icon);
      i.setAttribute('aria-hidden','true');
      statusIcon.appendChild(i);

      if(window.lucide){
        window.lucide.createIcons({attrs:{'stroke-width':1.9}});
      }
    }

    showStatus(text,kind='info',duration=1300,icon=null,tier=null) {
      window.clearTimeout(this.statusTimer);
      this.statusKind=kind;

      let resolvedIcon=icon;
      if(!resolvedIcon){
        if(kind==='danger') resolvedIcon='triangle-alert';
        else if(text.startsWith('TUMBLE')) resolvedIcon='rotate-cw';
        else if(text.startsWith('CASCADE')) resolvedIcon='sparkles';
        else if(text.startsWith('PRISM')) resolvedIcon='gem';
        else if(text.startsWith('NO MATCH')) resolvedIcon='circle-slash-2';
        else resolvedIcon='sparkles';
      }

      this.renderStatusIcon(resolvedIcon,tier);
      statusText.textContent=text;
      statusHud.className='status-hud show'+(kind==='danger'?' danger':'');

      if(duration>0){
        this.statusTimer=window.setTimeout(()=>{
          if(this.statusKind===kind) this.clearStatus();
        },duration);
      }
    }

    clearStatus() {
      window.clearTimeout(this.statusTimer);
      this.statusKind='';
      statusText.textContent='';
      statusIcon.innerHTML='';
      statusHud.className='status-hud';
    }

    matchingPairs() {
      const pairs=[];
      const used=new Set();

      for(let tier=0;tier<tiers.length;tier++){
        const same=this.gems
          .filter(g=>g&&g.active&&!g.merging&&g.tier===tier)
          .sort((a,b)=>b.y-a.y);

        for(let i=0;i+1<same.length;i+=2){
          const a=same[i];
          const b=same[i+1];
          if(used.has(a)||used.has(b)) continue;
          pairs.push([a,b]);
          used.add(a);
          used.add(b);
        }
      }

      return pairs;
    }

    updatePowerButtons() {
      const active=this.running&&!this.paused;
      const canCascade=this.matchingPairs().length>0;

      $('powerTumble').disabled=!active||this.powerUsed.tumble||this.gems.length===0;
      $('powerCascade').disabled=!active||this.powerUsed.cascade||!canCascade;
      $('powerPrism').disabled=!active||this.powerUsed.prism||!this.ready||this.currentTier>=tiers.length-1;
    }

    useTumble() {
      if(!this.running||this.paused||this.powerUsed.tumble||!this.gems.length) return;

      this.powerUsed.tumble=true;
      const M=Phaser.Physics.Matter.Matter;
      const centreX=W/2;

      for(const gem of this.gems){
        if(!gem||!gem.active||!gem.body) continue;

        const side=gem.x<centreX?1:-1;
        const horizontal=side*(.00012+.00008*Math.random())*gem.body.mass;
        const lift=-(.000055+.000035*Math.random())*gem.body.mass;

        M.Body.applyForce(gem.body,gem.body.position,{x:horizontal,y:lift});
        M.Body.setAngularVelocity(
          gem.body,
          clamp(gem.body.angularVelocity+side*Phaser.Math.FloatBetween(.006,.014),-.035,.035)
        );
      }

      this.cameras.main.shake(180,.0025);
      this.showStatus('TUMBLE!','reward',950,'rotate-cw');
      tone(230,.10,.028,'triangle');
      haptic([7,18,7]);
      this.updatePowerButtons();
    }

    useCascade() {
      if(!this.running||this.paused||this.powerUsed.cascade) return;

      const pairs=this.matchingPairs();
      if(!pairs.length){
        this.showStatus('NO MATCHES TO CASCADE','info',900,'circle-slash-2');
        this.updatePowerButtons();
        return;
      }

      this.powerUsed.cascade=true;

      for(const pair of pairs){
        this.queueMerge(pair[0],pair[1]);
      }

      this.showStatus('CASCADE ×'+pairs.length,'reward',1050,'sparkles');
      this.cameras.main.shake(75,.002);
      tone(520,.11,.03,'sine');
      haptic([8,20,8]);
      this.updatePowerButtons();
    }

    usePrism() {
      if(
        !this.running||
        this.paused||
        this.powerUsed.prism||
        !this.ready||
        this.currentTier>=tiers.length-1
      ) return;

      this.powerUsed.prism=true;
      this.currentTier=Math.min(this.currentTier+1,tiers.length-1);
      this.unlockTier(this.currentTier,true);

      if(this.preview){
        const x=this.preview.x;
        this.preview.destroy();
        this.preview=null;
        this.createDropPreview(false);
        if(this.preview) this.preview.x=x;
      }

      this.updateAimHandle();
      this.showStatus('PRISM UPGRADE','reward',1100,'gem',this.currentTier);
      tone(680,.11,.03,'sine');
      haptic([7,13,7]);
      this.updatePowerButtons();
    }

    addScore(points) {
      this.score+=points;

      if(this.score>this.best){
        this.best=this.score;
        this.saveBest();
      }

      scoreEl.textContent='$'+fmt(this.score);
      homeBestEl.textContent='$'+fmt(this.best);

      scoreEl.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('bump');
    }

    setPaused(value) {
      if(!this.running) return;

      this.paused=value;
      pauseOverlay.classList.toggle('visible',value);
      this.updatePowerButtons();

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
      this.updatePowerButtons();
      this.matter.world.pause();

      finalScoreEl.textContent='$'+fmt(this.score);

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
      const maxW=58;
      const maxH=58;
      const scale=Math.min(maxW/source.width,maxH/source.height);
      const w=source.width*scale;
      const h=source.height*scale;

      c.drawImage(
        source,
        (nextPreview.width-w)/2,
        (nextPreview.height-h)/2,
        w,
        h
      );
    }

    update(time,delta) {
      const dt=Math.min(delta,34)/1000;

      if(this.running&&!this.paused){
        this.scanForRestingMatches();
        this.processMerges();

        this.mergeWindow=Math.max(0,this.mergeWindow-dt);
        if(this.mergeWindow<=0) this.mergeChain=0;

        if(this.preview){
          const t=tiers[this.currentTier];
          const min=WALL+t.r*COLLIDER_SCALE;
          const max=W-WALL-t.r*COLLIDER_SCALE;
          const target=clamp(this.targetX,min,max);

          this.preview.x=Phaser.Math.Linear(
            this.preview.x,
            target,
            this.pointerHeld?.48:.30
          );
        }

        let high=false;

        for(const gem of this.gems){
          if(!gem||!gem.active||!gem.body) continue;

          this.syncGemOptics(gem,time);

          if(gem.body.isSleeping){
            Phaser.Physics.Matter.Matter.Sleeping.set(gem.body,false);
          }

          if(
            time-gem.born>800 &&
            gem.body.speed<.70 &&
            gem.body.bounds.min.y<LIMIT_Y
          ){
            high=true;
          }
        }

        if(high) this.dangerTime+=dt;
        else this.dangerTime=Math.max(0,this.dangerTime-dt*3.8);

        if(this.dangerTime>=.18){
          if(this.statusKind!=='danger') this.showStatus('TOO HIGH','danger',0,'triangle-alert');
        }else if(this.statusKind==='danger'){
          this.clearStatus();
        }

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
    type:Phaser.AUTO,
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
        enableSleeping:false,
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
      roundPixels:false,
      maxLights:3
    },
    scene:GameScene
  };

  new Phaser.Game(config);
})();