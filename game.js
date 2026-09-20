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
  const RENDER_SCALE = 2;
  const GEM_TEXTURE_SIZE = 768;

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
    square: {
      label:'Square',
      verts:[[-.86,-.86],[.86,-.86],[.86,.86],[-.86,.86]],
      rings:[.62,.36],
      pattern:'princess'
    },
    french: {
      label:'French',
      verts:[[-.64,-.90],[.64,-.90],[.90,-.64],[.90,.64],[.64,.90],[-.64,.90],[-.90,.64],[-.90,-.64]],
      rings:[.58,.34],
      pattern:'brilliant'
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
    octagon: {
      label:'Octagon',
      verts:[[0,-1],[.70,-.70],[1,0],[.70,.70],[0,1],[-.70,.70],[-1,0],[-.70,-.70]],
      rings:[.64,.39],
      pattern:'brilliant'
    },
    hexagon: {
      label:'Hexagon',
      verts:[[0,-1],[.86,-.50],[.86,.50],[0,1],[-.86,.50],[-.86,-.50]],
      rings:[.55,.31],
      pattern:'brilliant'
    },
    rectangle: {
      label:'Rectangular',
      verts:[[-.62,-.95],[.62,-.95],[.84,-.73],[.84,.73],[.62,.95],[-.62,.95],[-.84,.73],[-.84,-.73]],
      rings:[.70,.44],
      pattern:'step'
    },
    step: {
      label:'Step',
      verts:[[-.48,-.98],[.48,-.98],[.76,-.72],[.76,.72],[.48,.98],[-.48,.98],[-.76,.72],[-.76,-.72]],
      rings:[.76,.58,.40],
      pattern:'step'
    },
    scissor: {
      label:'Scissor',
      verts:[[-.42,-1],[.42,-1],[.72,-.66],[.72,.66],[.42,1],[-.42,1],[-.72,.66],[-.72,-.66]],
      rings:[.66,.38],
      pattern:'radiant'
    },
    pendeloque: {
      label:'Pendeloque',
      verts:[[0,-1],[.24,-.78],[.48,-.40],[.62,.08],[.58,.52],[.38,.82],[0,1],[-.38,.82],[-.58,.52],[-.62,.08],[-.48,-.40],[-.24,-.78]],
      rings:[.50,.30],
      pattern:'pear'
    },
    trapeze: {
      label:'Trapeze',
      verts:[[-.46,-.88],[.46,-.88],[.88,.82],[-.88,.82]],
      rings:[.58,.34],
      pattern:'radiant'
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
    {name:'Quartz',      cut:'Rose',          cutKey:'rose',       asset:'gems/20_rose.svg',          r:36,  score:1,   color:'#D7EBF2', accent:'#EDF6F9', dark:'#859296'},
    {name:'Citrine',     cut:'Trillion',      cutKey:'trillion',   asset:'gems/14_trillion.svg',      r:40,  score:3,   color:'#E9B11E', accent:'#F5DC9A', dark:'#906E13'},
    {name:'Sunstone',    cut:'Cushion',       cutKey:'cushion',    asset:'gems/07_cushion.svg',       r:44,  score:6,   color:'#E67A45', accent:'#F4C3AB', dark:'#8F4C2B'},
    {name:'Amethyst',    cut:'Emerald',       cutKey:'emerald',    asset:'gems/09_emerald.svg',       r:48,  score:10,  color:'#A968E5', accent:'#D8BBF3', dark:'#69408E'},
    {name:'Peridot',     cut:'Princess',      cutKey:'princess',   asset:'gems/02_princess.svg',      r:52,  score:15,  color:'#99D64D', accent:'#D1EDAF', dark:'#5F8530'},
    {name:'Garnet',      cut:'Radiant',       cutKey:'radiant',    asset:'gems/05_radiant.svg',       r:57,  score:22,  color:'#B33149', accent:'#DDA2AD', dark:'#6F1E2D'},
    {name:'Topaz',       cut:'Square',        cutKey:'square',     asset:'gems/08_square.svg',        r:62,  score:30,  color:'#D7902F', accent:'#EDCDA1', dark:'#85591D'},
    {name:'Moonstone',   cut:'French',        cutKey:'french',     asset:'gems/29_french.svg',        r:67,  score:40,  color:'#B9C9F2', accent:'#E0E7F9', dark:'#737D96'},
    {name:'Zircon',      cut:'Oval',          cutKey:'oval',       asset:'gems/22_oval.svg',          r:72,  score:52,  color:'#42C7E8', accent:'#AAE6F5', dark:'#297B90'},
    {name:'Morganite',   cut:'Asscher',       cutKey:'asscher',    asset:'gems/23_asscher.svg',       r:78,  score:66,  color:'#F5B3C8', accent:'#FADDE6', dark:'#986F7C'},
    {name:'Aquamarine',  cut:'Pear',          cutKey:'pear',       asset:'gems/04_pear.svg',          r:84,  score:82,  color:'#63E3C4', accent:'#B9F2E4', dark:'#3D8D7A'},
    {name:'Tourmaline',  cut:'Octagon',       cutKey:'octagon',    asset:'gems/24_octagon.svg',       r:91,  score:100, color:'#C447B6', accent:'#E4ACDE', dark:'#7A2C71'},
    {name:'Tanzanite',   cut:'Eight Corners', cutKey:'octagon',    asset:'gems/15_eight_corners.svg', r:98,  score:122, color:'#4F54D9', accent:'#B0B2EE', dark:'#313487'},
    {name:'Spinel',      cut:'Rectangular',   cutKey:'rectangle',  asset:'gems/13_rectangular.svg',   r:106, score:148, color:'#FF4F87', accent:'#FFB0C9', dark:'#9E3154'},
    {name:'Sapphire',    cut:'Step',          cutKey:'step',       asset:'gems/27_step.svg',          r:114, score:178, color:'#2D63D6', accent:'#A0B9ED', dark:'#1C3D85'},
    {name:'Emerald',     cut:'Scissor',       cutKey:'scissor',    asset:'gems/26_scissor.svg',       r:123, score:212, color:'#18B56A', accent:'#97DEBC', dark:'#0F7042'},
    {name:'Ruby',        cut:'Pendeloque',    cutKey:'pendeloque', asset:'gems/25_pendeloque.svg',    r:132, score:250, color:'#E12F4F', accent:'#F2A1B0', dark:'#8C1D31'},
    {name:'Alexandrite', cut:'Trapeze',       cutKey:'trapeze',    asset:'gems/17_trapeze.svg',       r:142, score:292, color:'#47B38E', accent:'#ACDDCC', dark:'#2C6F58'},
    {name:'Starstone',   cut:'Navette',       cutKey:'navette',    asset:'gems/21_navette.svg',       r:153, score:340, color:'#9B6BFF', accent:'#D2BCFF', dark:'#60429E'},
    {name:'Crownstone',  cut:'Brilliant',     cutKey:'brilliant',  asset:'gems/06_brilliant.svg',     r:165, score:400, color:'#FFD24A', accent:'#FFEBAE', dark:'#9E822E'}
  ];;;;

  function hueFromHex(hex) {
    const value=parseInt(hex.slice(1),16);
    const r=((value>>16)&255)/255;
    const g=((value>>8)&255)/255;
    const b=(value&255)/255;
    const max=Math.max(r,g,b);
    const min=Math.min(r,g,b);
    const d=max-min;
    if(d===0) return 0;

    let h;
    if(max===r) h=((g-b)/d)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;

    h*=60;
    if(h<0) h+=360;
    return Math.round(h);
  }

  let audioCtx = null;
  let dingBuffer = null;
  let dingLoadPromise = null;
  let lastDingAt = 0;

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

  function loadDing() {
    if(!audioCtx||dingBuffer) return Promise.resolve(dingBuffer);
    if(dingLoadPromise) return dingLoadPromise;

    dingLoadPromise=fetch('ding.ogg')
      .then(response=>{
        if(!response.ok) throw new Error('Could not load ding.ogg');
        return response.arrayBuffer();
      })
      .then(data=>audioCtx.decodeAudioData(data.slice(0)))
      .then(buffer=>{
        dingBuffer=buffer;
        return buffer;
      })
      .catch(()=>{
        dingLoadPromise=null;
        return null;
      });

    return dingLoadPromise;
  }

  function unlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }

    if(audioCtx){
      if(audioCtx.state==='suspended') audioCtx.resume();
      loadDing();
    }
  }

  function playGemDing(tier,impact=1,x=W/2) {
    if(!audioCtx||!dingBuffer||audioCtx.state!=='running') return;

    const now=performance.now();
    if(now-lastDingAt<30) return;
    lastDingAt=now;

    const tierT=clamp(tier/Math.max(1,tiers.length-1),0,1);
    const sizePitch=1.13-(tierT*.31);
    const variation=(Math.random()-.5)*.07;
    const playbackRate=clamp(sizePitch+variation,.78,1.17);

    const strength=clamp((impact-.45)/4.8,0,1);
    const volume=.018+strength*.092;

    const source=audioCtx.createBufferSource();
    const gain=audioCtx.createGain();
    source.buffer=dingBuffer;
    source.playbackRate.value=playbackRate;
    gain.gain.value=volume;

    if(typeof audioCtx.createStereoPanner==='function'){
      const pan=audioCtx.createStereoPanner();
      pan.pan.value=clamp((x/W)*2-1,-.72,.72);
      source.connect(gain).connect(pan).connect(audioCtx.destination);
    }else{
      source.connect(gain).connect(audioCtx.destination);
    }

    source.start();
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

  const GEM_WORLD_LIGHT_ANGLE=-Math.PI*.32;

  function hexToUnitRgb(hex) {
    const value=parseInt(hex.slice(1),16);
    return [
      ((value>>16)&255)/255,
      ((value>>8)&255)/255,
      (value&255)/255
    ];
  }

  const GEM_FACET_FRAG_SHADER=[
    '#define SHADER_NAME GEM_FACET_FS',
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uMainSampler;',
    'uniform vec2 uTexel;',
    'uniform vec3 uGemColor;',
    'uniform vec3 uDeepColor;',
    'uniform vec3 uAccentColor;',
    'uniform float uLightAngle;',
    'uniform float uTime;',
    'varying vec2 outTexCoord;',
    'varying vec4 outTint;',
    'float lum(vec4 c){ return dot(c.rgb,vec3(.2126,.7152,.0722)); }',
    'float safeHeight(vec2 uv,float fallback){',
    '  vec4 s=texture2D(uMainSampler,uv);',
    '  return mix(fallback,lum(s),step(.02,s.a));',
    '}',
    'void main(){',
    '  vec4 src=texture2D(uMainSampler,outTexCoord);',
    '  if(src.a<.015) discard;',
    '  float h=lum(src);',
    '  float hl=safeHeight(outTexCoord-vec2(uTexel.x*1.35,0.0),h);',
    '  float hr=safeHeight(outTexCoord+vec2(uTexel.x*1.35,0.0),h);',
    '  float hu=safeHeight(outTexCoord-vec2(0.0,uTexel.y*1.35),h);',
    '  float hd=safeHeight(outTexCoord+vec2(0.0,uTexel.y*1.35),h);',
    '  float avg=(hl+hr+hu+hd)*.25;',
    '  float localDetail=clamp(.5+(h-avg)*2.6,0.0,1.0);',
    '  float gx=(hr-hl)*5.4;',
    '  float gy=(hd-hu)*5.4;',
    '  vec3 normal=normalize(vec3(-gx,gy,.58));',
    '  vec3 lightDir=normalize(vec3(cos(uLightAngle)*.72,sin(uLightAngle)*.72,.70));',
    '  float ndl=dot(normal,lightDir);',
    '  float diffuse=.72+.46*clamp(ndl*.5+.5,0.0,1.0);',
    '  vec3 material=mix(uDeepColor,uGemColor,.68+.22*localDetail);',
    '  material=mix(material,uAccentColor,smoothstep(.72,1.0,localDetail)*.24);',
    '  float grad=clamp(abs(hr-hl)+abs(hd-hu),0.0,1.0);',
    '  vec3 viewDir=vec3(0.0,0.0,1.0);',
    '  vec3 halfDir=normalize(lightDir+viewDir);',
    '  float spec=pow(max(dot(normal,halfDir),0.0),22.0);',
    '  float crisp=pow(max(dot(normal,halfDir),0.0),70.0);',
    '  float edgeSpark=pow(grad,1.25)*(.08+.06*sin(uTime*1.8+outTexCoord.x*31.0+outTexCoord.y*23.0));',
    '  float radius=distance(outTexCoord,vec2(.5));',
    '  float innerGlow=1.0-smoothstep(.10,.52,radius);',
    '  vec3 color=material*diffuse;',
    '  color+=uAccentColor*(spec*.54+crisp*.54);',
    '  color+=uAccentColor*max(edgeSpark,0.0);',
    '  color+=uGemColor*innerGlow*.075;',
    '  color=mix(color,uAccentColor,grad*.055);',
    '  gl_FragColor=vec4(color,src.a*.94);',
    '}'
  ].join('\n');

  class GemFacetPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
      super({game,fragShader:GEM_FACET_FRAG_SHADER});
    }

    onBind(gameObject) {
      this.flush();
      super.onBind(gameObject);

      const d=gameObject&&gameObject.pipelineData?gameObject.pipelineData:null;
      if(!d) return;

      this.set2f('uTexel',d.texelX||1/768,d.texelY||1/768);
      this.set3f('uGemColor',d.gemColor[0],d.gemColor[1],d.gemColor[2]);
      this.set3f('uDeepColor',d.deepColor[0],d.deepColor[1],d.deepColor[2]);
      this.set3f('uAccentColor',d.accentColor[0],d.accentColor[1],d.accentColor[2]);
      this.set1f('uLightAngle',GEM_WORLD_LIGHT_ANGLE-(gameObject.rotation||0));
      this.set1f('uTime',this.game.loop.time*.001);
    }

    onBatch(gameObject) {
      if(gameObject) this.flush();
    }
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
      this.gemVisualBounds=[];
      this.gemPipeline=null;
    }

    preload() {
      tiers.forEach((tier,index)=>{
        this.load.svg(
          'gem-'+index,
          tier.asset,
          {width:GEM_TEXTURE_SIZE,height:GEM_TEXTURE_SIZE}
        );
        this.load.text('gem-svg-'+index,tier.asset);
      });
    }

    create() {
      this.cameras.main
        .setOrigin(0,0)
        .setZoom(RENDER_SCALE)
        .setScroll(0,0)
        .setBackgroundColor('rgba(0,0,0,0)');
      this.matter.set60Hz();

      const engine=this.matter.world.engine;
      engine.positionIterations=10;
      engine.velocityIterations=8;
      engine.constraintIterations=2;
      engine.gravity.y=1.14;
      engine.gravity.scale=.001;

      if(this.game.renderer.type===Phaser.WEBGL){
        this.gemPipeline=this.renderer.pipelines.add(
          'GemFacet',
          new GemFacetPipeline(this.game)
        );
      }

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
      const t=tiers[tier];
      const cut=CUTS[t.cutKey];
      const w=canvas.width;
      const h=canvas.height;
      const cx=w/2;
      const cy=h/2;

      ctx.clearRect(0,0,w,h);

      const firstR=tiers[0].r;
      const lastR=tiers[tiers.length-1].r;
      const sizeT=clamp((t.r-firstR)/(lastR-firstR),0,1);
      const cavityScale=31+sizeT*14;

      const cavity=cut.verts.map(v=>({
        x:cx+v[0]*cavityScale,
        y:cy+v[1]*cavityScale
      }));
      const inner=cut.verts.map(v=>({
        x:cx+v[0]*cavityScale*.90,
        y:cy+v[1]*cavityScale*.90
      }));

      // Raised velvet lip around the made-to-measure recess.
      ctx.save();
      ctx.shadowColor='rgba(0,0,0,.62)';
      ctx.shadowBlur=11;
      ctx.shadowOffsetY=6;
      polygonPath(ctx,cavity);
      const lip=ctx.createLinearGradient(0,cy-cavityScale,0,cy+cavityScale);
      lip.addColorStop(0,'rgba(91,51,96,.72)');
      lip.addColorStop(.48,'rgba(39,20,44,.92)');
      lip.addColorStop(1,'rgba(17,9,21,.98)');
      ctx.fillStyle=lip;
      ctx.fill();
      ctx.restore();

      // Inner depression. The top edge catches light while the lower edge falls
      // away, making it read like a fitted jewellery presentation box.
      polygonPath(ctx,inner);
      const well=ctx.createLinearGradient(0,cy-cavityScale,0,cy+cavityScale);
      well.addColorStop(0,'rgba(17,9,20,.90)');
      well.addColorStop(.42,'rgba(25,13,29,.98)');
      well.addColorStop(1,'rgba(7,4,10,1)');
      ctx.fillStyle=well;
      ctx.fill();

      ctx.lineWidth=2.2;
      ctx.strokeStyle='rgba(255,231,187,.12)';
      polygonPath(ctx,cavity);
      ctx.stroke();

      ctx.lineWidth=1.5;
      ctx.strokeStyle='rgba(0,0,0,.74)';
      polygonPath(ctx,inner);
      ctx.stroke();

      // A locked entry is literally just the empty impression of that gem.
      if(locked){
        ctx.save();
        polygonPath(ctx,inner);
        ctx.clip();
        const impression=ctx.createRadialGradient(
          cx-cavityScale*.18,
          cy-cavityScale*.22,
          1,
          cx,
          cy,
          cavityScale
        );
        impression.addColorStop(0,'rgba(88,72,91,.14)');
        impression.addColorStop(.55,'rgba(42,34,46,.08)');
        impression.addColorStop(1,'rgba(0,0,0,.18)');
        ctx.fillStyle=impression;
        ctx.fillRect(0,0,w,h);
        ctx.restore();
        return;
      }

      if(this.textures.exists('gem-'+tier)){
        const source=this.textures.get('gem-'+tier).getSourceImage();
        const max=cavityScale*1.74;
        const scale=Math.min(max/source.width,max/source.height);
        const gw=source.width*scale;
        const gh=source.height*scale;

        ctx.save();
        ctx.shadowColor='rgba(0,0,0,.62)';
        ctx.shadowBlur=9;
        ctx.shadowOffsetY=5;
        ctx.drawImage(source,cx-gw/2,cy-gh/2-1,gw,gh);
        ctx.restore();

        // Tiny velvet reflection around a seated gem.
        ctx.save();
        ctx.globalCompositeOperation='screen';
        ctx.globalAlpha=.22;
        ctx.strokeStyle=rgba(t.accent,.44);
        ctx.lineWidth=1.3;
        polygonPath(ctx,inner);
        ctx.stroke();
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
        card.setAttribute(
          'aria-label',
          unlocked
            ? t.name+', '+t.cut+' cut, value $'+fmt(t.score)
            : 'Undiscovered gem'
        );

        const art=document.createElement('div');
        art.className='gem-card__art';

        const canvas=document.createElement('canvas');
        canvas.width=128;
        canvas.height=128;
        canvas.setAttribute('aria-hidden','true');
        art.appendChild(canvas);

        const meta=document.createElement('div');
        meta.className='gem-card__meta';

        if(unlocked){
          const name=document.createElement('strong');
          name.textContent=t.name;

          const cut=document.createElement('small');
          cut.textContent=t.cut+' cut';

          const value=document.createElement('div');
          value.className='gem-card__value';
          value.textContent='$'+fmt(t.score);

          meta.append(name,cut,value);
        }

        card.append(art,meta);
        gemCollection.appendChild(card);
        this.drawCollectionGem(canvas,tier,!unlocked);
      });

      collectionProgress.textContent=this.unlockedTiers.size+' / '+tiers.length;
    }

    makeTextures() {
      this.makeSparkleTexture();

      for(let i=0;i<tiers.length;i++){
        this.measureGemBounds(i);
      }
    }

    makeSparkleTexture() {
      const canvas=document.createElement('canvas');
      canvas.width=128;
      canvas.height=128;
      const ctx=canvas.getContext('2d');
      const cx=64;
      const cy=64;

      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,36);
      glow.addColorStop(0,'rgba(255,255,255,.98)');
      glow.addColorStop(.16,'rgba(255,248,222,.80)');
      glow.addColorStop(.44,'rgba(255,229,178,.22)');
      glow.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=glow;
      ctx.fillRect(0,0,128,128);

      ctx.strokeStyle='rgba(255,255,255,.96)';
      ctx.lineCap='round';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(64,14);
      ctx.lineTo(64,114);
      ctx.moveTo(14,64);
      ctx.lineTo(114,64);
      ctx.stroke();

      ctx.strokeStyle='rgba(255,240,204,.58)';
      ctx.lineWidth=1.4;
      ctx.beginPath();
      ctx.moveTo(31,31);
      ctx.lineTo(97,97);
      ctx.moveTo(97,31);
      ctx.lineTo(31,97);
      ctx.stroke();

      const texture=this.textures.addCanvas('gem-sparkle',canvas);
      if(texture) texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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

    gemSpriteScale(tier) {
      const texture=this.textures.get('gem-'+tier);
      const source=texture&&texture.getSourceImage
        ? texture.getSourceImage()
        : null;

      const fallback=source
        ? Math.max(source.width||GEM_TEXTURE_SIZE,source.height||GEM_TEXTURE_SIZE)
        : GEM_TEXTURE_SIZE;

      const visible=this.gemVisualBounds[tier]||fallback;
      return (tiers[tier].r*2*ART_SCALE)/Math.max(1,visible);
    }

    sizeGemSprite(gameObject,tier) {
      const scale=this.gemSpriteScale(tier);
      gameObject.setScale(scale);
      return scale;
    }

    measureGemBounds(index) {
      const texture=this.textures.get('gem-'+index);
      const source=texture&&texture.getSourceImage
        ? texture.getSourceImage()
        : null;
      const svgText=this.cache.text.get('gem-svg-'+index);

      if(!source){
        this.gemVisualBounds[index]=GEM_TEXTURE_SIZE;
        return;
      }

      if(!svgText){
        this.gemVisualBounds[index]=Math.max(source.width,source.height);
        return;
      }

      try {
        const doc=new DOMParser().parseFromString(svgText,'image/svg+xml');
        const svg=doc.documentElement;
        const vb=(svg.getAttribute('viewBox')||'0 0 512 512')
          .trim()
          .split(/[\s,]+/)
          .map(Number);

        const viewX=vb.length===4&&Number.isFinite(vb[0])?vb[0]:0;
        const viewY=vb.length===4&&Number.isFinite(vb[1])?vb[1]:0;
        const viewW=vb.length===4&&Number.isFinite(vb[2])&&vb[2]>0?vb[2]:512;
        const viewH=vb.length===4&&Number.isFinite(vb[3])&&vb[3]>0?vb[3]:512;

        let minX=Infinity;
        let minY=Infinity;
        let maxX=-Infinity;
        let maxY=-Infinity;

        for(const node of doc.querySelectorAll('polygon')){
          if(node.closest('defs')) continue;

          const values=(node.getAttribute('points')||'')
            .trim()
            .split(/[\s,]+/)
            .map(Number)
            .filter(Number.isFinite);

          for(let i=0;i+1<values.length;i+=2){
            minX=Math.min(minX,values[i]);
            maxX=Math.max(maxX,values[i]);
            minY=Math.min(minY,values[i+1]);
            maxY=Math.max(maxY,values[i+1]);
          }
        }

        if(Number.isFinite(minX)&&Number.isFinite(maxX)){
          const pxW=((maxX-minX)/viewW)*source.width;
          const pxH=((maxY-minY)/viewH)*source.height;
          this.gemVisualBounds[index]=Math.max(pxW,pxH);
        }else{
          this.gemVisualBounds[index]=Math.max(source.width,source.height);
        }
      } catch {
        this.gemVisualBounds[index]=Math.max(source.width,source.height);
      }
    }

    setupGemLighting() {
      this.webglLighting=!!this.gemPipeline;
    }

    applyGemLighting(gameObject,tier=gameObject&&gameObject.tier) {
      if(!gameObject) return;

      if(!this.gemPipeline||tier===undefined||tier===null){
        if(gameObject.resetPipeline) gameObject.resetPipeline();
        return;
      }

      const t=tiers[tier];
      const texture=this.textures.get('gem-'+tier);
      const source=texture&&texture.getSourceImage
        ? texture.getSourceImage()
        : null;
      const w=source&&source.width?source.width:GEM_TEXTURE_SIZE;
      const h=source&&source.height?source.height:GEM_TEXTURE_SIZE;

      gameObject.pipelineData={
        gemColor:hexToUnitRgb(t.color),
        deepColor:hexToUnitRgb(t.dark),
        accentColor:hexToUnitRgb(t.accent),
        texelX:1/w,
        texelY:1/h
      };

      gameObject.setPipeline(this.gemPipeline);
    }

    animateGemLights(time) {
    }

    createGemShadow(gem) {
      if(!gem||!gem.active) return;

      const scale=this.gemSpriteScale(gem.tier);
      const shadow=this.add.image(gem.x,gem.y,'gem-'+gem.tier)
        .setTint(0x000000)
        .setAlpha(.16)
        .setDepth(7+gem.tier*.01)
        .setScale(scale*1.035,scale*.97);

      if(this.gemMask) shadow.setMask(this.gemMask);
      gem.shadow=shadow;
      this.syncGemShadow(gem);
    }

    syncGemShadow(gem) {
      if(!gem||!gem.active||!gem.shadow||!gem.shadow.active) return;

      const angle=.72*Math.PI;
      const speed=gem.body?Math.abs(gem.body.angularVelocity):0;
      const offset=clamp(gem.tier*.20+3+speed*20,3,10);

      gem.shadow.x=gem.x+Math.cos(angle)*offset;
      gem.shadow.y=gem.y+Math.sin(angle)*offset+2;
      gem.shadow.rotation=gem.rotation;
      gem.shadow.setAlpha(.11+clamp(speed*2,0,.035));
    }

    createGemGlint(gem) {
      if(!gem||!this.textures.exists('gem-sparkle')) return;

      const glint=this.add.image(gem.x,gem.y,'gem-sparkle')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(34+gem.tier*.01)
        .setAlpha(0);

      if(this.gemMask) glint.setMask(this.gemMask);

      gem.sheen=null;
      gem.glint=glint;
      gem.opticSeed=Math.random()*Math.PI*2;
    }

    syncGemOptics(gem,time) {
      if(!gem||!gem.active||!gem.body||!gem.glint||!gem.glint.active) return;

      const t=tiers[gem.tier];
      const cut=CUTS[t.cutKey]||CUTS.brilliant;
      const facetCount=cut.verts.length;
      const lightAngle=GEM_WORLD_LIGHT_ANGLE;

      const phase=(gem.rotation-lightAngle)*facetCount*2+gem.opticSeed;
      const flash=Math.pow(Math.max(0,Math.cos(phase)),18);
      const motion=clamp(
        Math.abs(gem.body.angularVelocity)*52+gem.body.speed*.07,
        .16,
        1
      );

      const localLight=Phaser.Math.Angle.Wrap(lightAngle-gem.rotation);
      const facetStep=(Math.PI*2)/facetCount;
      const facetIndex=Math.round((localLight+Math.PI/2)/facetStep);
      const localFacet=-Math.PI/2+facetIndex*facetStep;
      const worldFacet=localFacet+gem.rotation;

      gem.glint.x=gem.x+Math.cos(worldFacet)*t.r*.44;
      gem.glint.y=gem.y+Math.sin(worldFacet)*t.r*.44;
      gem.glint.rotation=0;
      gem.glint.setScale(clamp(t.r/98,.30,1.08)*(.22+flash*.52));
      gem.glint.setAlpha(clamp(.01+flash*(.50+.22*motion),0,.78));
      gem.glint.setTint(mixHex(t.accent,'#ffffff',.84));
    }

    drawVaultBackdrop() {
      const bg=this.add.graphics().setDepth(0);
      bg.fillStyle(0x15091c,.20);
      bg.fillRect(0,0,W,H);

      bg.fillStyle(0x552063,.045);
      bg.fillEllipse(W*.5,H*.72,W*.82,H*.40);

      const rails=this.add.graphics().setDepth(18);

      rails.fillGradientStyle(0xffdd7a,0xf2a433,0xb13f61,0x6f2253,.28);
      rails.fillRect(FRAME_WALL-8,18,8,FRAME_FLOOR-18);
      rails.fillRect(W-FRAME_WALL,18,8,FRAME_FLOOR-18);

      rails.fillGradientStyle(0xffed9e,0xffbd3f,0xb13f61,0x6a1f52,.28);
      rails.fillRect(FRAME_WALL,FRAME_FLOOR,W-FRAME_WALL*2,10);

      rails.lineStyle(2,0xffd666,.14);
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
      this.preview.tier=this.currentTier;
      this.sizeGemSprite(this.preview,this.currentTier);
      this.applyGemLighting(this.preview,this.currentTier);
      this.preview.setAlpha(1);
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

      this.sizeGemSprite(gem,tier);

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
      gem.lastDingAt=0;
      gem.setDepth(10+tier*.01);
      gem.setAlpha(1);
      this.applyGemLighting(gem,tier);

      if(this.gemMask) gem.setMask(this.gemMask);

      this.gems.push(gem);
      this.createGemShadow(gem);
      this.createGemGlint(gem);
      return gem;
    }

    removeGem(gem) {
      if(!gem||!gem.active) return;

      const i=this.gems.indexOf(gem);
      if(i>=0) this.gems.splice(i,1);

      if(gem.glint&&gem.glint.active) gem.glint.destroy();
      gem.glint=null;

      if(gem.sheen&&gem.sheen.active) gem.sheen.destroy();
      gem.sheen=null;

      if(gem.shadow&&gem.shadow.active) gem.shadow.destroy();
      gem.shadow=null;

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
      const now=this.time.now;

      for(const pair of event.pairs){
        const bodyA=pair.bodyA;
        const bodyB=pair.bodyB;
        const a=bodyA&&bodyA.gameObject;
        const b=bodyB&&bodyB.gameObject;
        const aGem=!!(a&&a.isGem&&a.active&&a.body);
        const bGem=!!(b&&b.isGem&&b.active&&b.body);

        if(!aGem&&!bGem) continue;

        // Gem against gem.
        if(aGem&&bGem){
          const av=a.body.velocity;
          const bv=b.body.velocity;
          const speed=Math.hypot(bv.x-av.x,bv.y-av.y);

          if(
            speed>.55 &&
            now-(a.lastDingAt||0)>72 &&
            now-(b.lastDingAt||0)>72
          ){
            a.lastDingAt=now;
            b.lastDingAt=now;
            playGemDing(
              Math.max(a.tier,b.tier),
              speed,
              (a.x+b.x)/2
            );
          }

          if(speed>2){
            this.contactSpark(
              (a.x+b.x)/2,
              (a.y+b.y)/2,
              tiers[Math.max(a.tier,b.tier)].accent,
              speed
            );
          }

          this.queueMerge(a,b);
          continue;
        }

        // Gem against the basin floor or side walls.
        const gem=aGem?a:b;
        const otherBody=aGem?bodyB:bodyA;

        if(!otherBody||otherBody.label!=='vault-wall') continue;

        const v=gem.body.velocity;
        const speed=Math.hypot(v.x,v.y);

        if(speed>.55&&now-(gem.lastDingAt||0)>72){
          gem.lastDingAt=now;
          playGemDing(gem.tier,speed,gem.x);
        }
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
          const masterValue=tiers[tier].score*2;
          this.addScore(masterValue);
          this.mergeBurst(x,y,tiers[tier],true);
          this.floatText(x,y-8,'MASTER CUT +$'+masterValue,'#ffe0a0',21);
          this.showStatus('MASTER CUT +$'+masterValue,'reward',1450,'gem',tier);
          this.cameras.main.shake(100,.0038);
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
      const shell=document.querySelector('.play-shell');
      const pulses=14;
      const spacing=58;

      if(shell){
        shell.classList.remove('tumbling');
        void shell.offsetWidth;
        shell.classList.add('tumbling');
        window.setTimeout(()=>shell.classList.remove('tumbling'),pulses*spacing+140);
      }

      // Alternate the effective direction of the whole basin. Repeated impulses
      // make buried pieces actually trade places rather than merely wobble.
      for(let p=0;p<pulses;p++){
        this.time.delayedCall(p*spacing,()=>{
          if(!this.running||this.paused) return;

          const direction=p%2===0?1:-1;
          const phase=Math.sin((p/(pulses-1))*Math.PI);
          const strength=.00030+phase*.00018;

          for(const gem of this.gems){
            if(!gem||!gem.active||!gem.body) continue;

            const mass=gem.body.mass;
            const randomX=Phaser.Math.FloatBetween(.82,1.18);
            const randomY=Phaser.Math.FloatBetween(.65,1.15);
            const lift=(p%3===0?-.00020:-.000035)*randomY;

            M.Body.applyForce(
              gem.body,
              gem.body.position,
              {
                x:direction*strength*randomX*mass,
                y:lift*mass
              }
            );

            M.Body.setAngularVelocity(
              gem.body,
              clamp(
                gem.body.angularVelocity+
                direction*Phaser.Math.FloatBetween(.010,.024),
                -.060,
                .060
              )
            );
          }
        });
      }

      this.cameras.main.shake(pulses*spacing,.0062);
      this.showStatus('TUMBLE!','reward',1200,'rotate-cw');
      tone(210,.14,.032,'triangle');
      haptic([10,24,10,24,14]);
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
      const maxW=nextPreview.width*.82;
      const maxH=nextPreview.height*.82;
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
      this.animateGemLights(time);

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
          this.syncGemShadow(gem);

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
    type:Phaser.WEBGL,
    parent:'game',
    width:W*RENDER_SCALE,
    height:H*RENDER_SCALE,
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
      maxLights:3,
      mipmapFilter:'LINEAR'
    },
    scene:GameScene
  };

  new Phaser.Game(config);
})();