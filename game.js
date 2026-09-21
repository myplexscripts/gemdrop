(() => {
  'use strict';

  if (!window.Phaser) return;

  const W = 640;
  const H = 936;
  const FRAME_WALL = 24;
  const FRAME_FLOOR = 900;
  const WALL = 16;
  const FLOOR = 880;
  const DROP_Y = 72;
  const LIMIT_Y = 146;
  const LIMIT_OPTICAL_X = 6;
  const DROP_DELAY = 300;
  const COLLIDER_SCALE = 0.97;
  const ART_SCALE = 0.97;
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

  // 20 progression tiers. Only these six authored cuts are reused;
  // progression beyond six is colour + size, never new gem geometry.
  const tiers = [
    {name:'Quartz', cut:'Rectangular', cutKey:'rose', reactiveCut:'rectangular', r:54, score:1, color:'#D7EBF2', accent:'#EDF6F9', dark:'#859296'},
    {name:'Citrine', cut:'Circular Starcut', cutKey:'trillion', reactiveCut:'circular_starcut', r:59, score:3, color:'#E9B11E', accent:'#F5DC9A', dark:'#906E13'},
    {name:'Sunstone', cut:'Emerald Stepcut', cutKey:'cushion', reactiveCut:'emerald_stepcut', r:64, score:6, color:'#E67A45', accent:'#F4C3AB', dark:'#8F4C2B'},
    {name:'Amethyst', cut:'Rectangular Brilliant', cutKey:'emerald', reactiveCut:'rectangular_brilliant', r:70, score:10, color:'#A968E5', accent:'#D8BBF3', dark:'#69408E'},
    {name:'Peridot', cut:'Heart', cutKey:'princess', reactiveCut:'heart', r:76, score:15, color:'#99D64D', accent:'#D1EDAF', dark:'#5F8530'},
    {name:'Garnet', cut:'Tanzanite', cutKey:'radiant', reactiveCut:'tanzanite', r:83, score:22, color:'#B33149', accent:'#DDA2AD', dark:'#6F1E2D'},
    {name:'Topaz', cut:'Rectangular', cutKey:'square', reactiveCut:'rectangular', r:90, score:30, color:'#D7902F', accent:'#EDCDA1', dark:'#85591D'},
    {name:'Moonstone', cut:'Circular Starcut', cutKey:'french', reactiveCut:'circular_starcut', r:98, score:40, color:'#B9C9F2', accent:'#E0E7F9', dark:'#737D96'},
    {name:'Zircon', cut:'Emerald Stepcut', cutKey:'oval', reactiveCut:'emerald_stepcut', r:106, score:52, color:'#42C7E8', accent:'#AAE6F5', dark:'#297B90'},
    {name:'Morganite', cut:'Rectangular Brilliant', cutKey:'asscher', reactiveCut:'rectangular_brilliant', r:115, score:66, color:'#F5B3C8', accent:'#FADDE6', dark:'#986F7C'},
    {name:'Aquamarine', cut:'Heart', cutKey:'pear', reactiveCut:'heart', r:124, score:82, color:'#63E3C4', accent:'#B9F2E4', dark:'#3D8D7A'},
    {name:'Tourmaline', cut:'Tanzanite', cutKey:'octagon', reactiveCut:'tanzanite', r:134, score:100, color:'#C447B6', accent:'#E4ACDE', dark:'#7A2C71'},
    {name:'Tanzanite', cut:'Rectangular', cutKey:'octagon', reactiveCut:'rectangular', r:144, score:122, color:'#4F54D9', accent:'#B0B2EE', dark:'#313487'},
    {name:'Spinel', cut:'Circular Starcut', cutKey:'rectangle', reactiveCut:'circular_starcut', r:155, score:148, color:'#FF4F87', accent:'#FFB0C9', dark:'#9E3154'},
    {name:'Sapphire', cut:'Emerald Stepcut', cutKey:'step', reactiveCut:'emerald_stepcut', r:166, score:178, color:'#2D63D6', accent:'#A0B9ED', dark:'#1C3D85'},
    {name:'Emerald', cut:'Rectangular Brilliant', cutKey:'scissor', reactiveCut:'rectangular_brilliant', r:178, score:212, color:'#18B56A', accent:'#97DEBC', dark:'#0F7042'},
    {name:'Ruby', cut:'Heart', cutKey:'pendeloque', reactiveCut:'heart', r:190, score:250, color:'#E12F4F', accent:'#F2A1B0', dark:'#8C1D31'},
    {name:'Alexandrite', cut:'Tanzanite', cutKey:'trapeze', reactiveCut:'tanzanite', r:203, score:292, color:'#47B38E', accent:'#ACDDCC', dark:'#2C6F58'},
    {name:'Starstone', cut:'Rectangular', cutKey:'navette', reactiveCut:'rectangular', r:217, score:340, color:'#9B6BFF', accent:'#D2BCFF', dark:'#60429E'},
    {name:'Crownstone', cut:'Circular Starcut', cutKey:'brilliant', reactiveCut:'circular_starcut', r:232, score:400, color:'#FFD24A', accent:'#FFEBAE', dark:'#9E822E'}
  ];;;;

  function gemTextureKey(tier) {
    const t=tiers[tier];
    return 'reactive-gem-'+(t?t.reactiveCut:'rectangular');
  }

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

  let gameMuted=false;
  try{
    gameMuted=localStorage.getItem('gemdrop-muted')==='1';
  }catch{}

  function syncMuteButton() {
    const button=$('muteButton');
    if(!button) return;

    button.setAttribute('aria-pressed',gameMuted?'true':'false');
    button.setAttribute('aria-label',gameMuted?'Unmute game':'Mute game');
    button.title=gameMuted?'Unmute game':'Mute game';
  }

  function setGameMuted(value) {
    gameMuted=!!value;

    try{
      localStorage.setItem('gemdrop-muted',gameMuted?'1':'0');
    }catch{}

    if(gemAudioMaster&&audioCtx){
      gemAudioMaster.gain.cancelScheduledValues(audioCtx.currentTime);
      gemAudioMaster.gain.setTargetAtTime(
        gameMuted?0:1.08,
        audioCtx.currentTime,
        .018
      );
    }

    syncMuteButton();
  }

  let audioCtx = null;
  let dingBuffer = null;
  let dingLoadPromise = null;

  let gemAudioMaster = null;
  let gemAudioDry = null;
  let gemAudioWet = null;
  let gemAudioConvolver = null;
  let gemAudioToneBus = null;
  let gemAudioCompressor = null;

  let dingWindowStartedAt = 0;
  let dingVoicesInWindow = 0;
  let crystalNoiseBuffer = null;

  // ding.ogg is recorded at E6. These are exact natural-note offsets from E6.
  const GEM_NOTE_SET = [
    { name:'A5', semitones:-7 },
    { name:'B5', semitones:-5 },
    { name:'C6', semitones:-4 },
    { name:'D6', semitones:-2 },
    { name:'E6', semitones:0 },
    { name:'F6', semitones:1 },
    { name:'G6', semitones:3 }
  ];

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

  function makeGemImpulse(seconds=1.45,decay=3.4) {
    if(!audioCtx) return null;

    const length=Math.max(1,Math.floor(audioCtx.sampleRate*seconds));
    const buffer=audioCtx.createBuffer(2,length,audioCtx.sampleRate);

    for(let channel=0;channel<2;channel++){
      const data=buffer.getChannelData(channel);
      for(let i=0;i<length;i++){
        data[i]=(Math.random()*2-1)*Math.pow(1-i/length,decay);
      }
    }

    return buffer;
  }

  function setupGemAudioBus() {
    if(!audioCtx||gemAudioMaster) return;

    gemAudioDry=audioCtx.createGain();
    gemAudioWet=audioCtx.createGain();
    gemAudioConvolver=audioCtx.createConvolver();
    gemAudioToneBus=audioCtx.createBiquadFilter();
    gemAudioCompressor=audioCtx.createDynamicsCompressor();
    gemAudioMaster=audioCtx.createGain();

    gemAudioConvolver.buffer=makeGemImpulse();

    gemAudioToneBus.type='lowpass';
    gemAudioToneBus.frequency.value=11250;
    gemAudioToneBus.Q.value=.2;

    gemAudioCompressor.threshold.value=-22;
    gemAudioCompressor.knee.value=18;
    gemAudioCompressor.ratio.value=3.2;
    gemAudioCompressor.attack.value=.004;
    gemAudioCompressor.release.value=.16;

    gemAudioDry.gain.value=.918;
    gemAudioWet.gain.value=.164;
    gemAudioMaster.gain.value=gameMuted?0:1.08;

    gemAudioDry.connect(gemAudioToneBus);
    gemAudioWet.connect(gemAudioConvolver);
    gemAudioConvolver.connect(gemAudioToneBus);
    gemAudioToneBus.connect(gemAudioCompressor);
    gemAudioCompressor.connect(gemAudioMaster);
    gemAudioMaster.connect(audioCtx.destination);
  }

  function gemNoteForTier(tier) {
    return GEM_NOTE_SET[Math.abs(tier)%GEM_NOTE_SET.length];
  }

  function playbackRateForSemitones(semitones) {
    return Math.pow(2,semitones/12);
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
      setupGemAudioBus();
    }
  }

  function getCrystalNoiseBuffer() {
    if(crystalNoiseBuffer) return crystalNoiseBuffer;

    const length=Math.max(1,Math.floor(audioCtx.sampleRate*.05));
    const buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate);
    const data=buffer.getChannelData(0);
    let smooth=0;

    for(let i=0;i<length;i++){
      const white=Math.random()*2-1;
      smooth=smooth*.14+white*.86;
      data[i]=smooth*Math.pow(1-i/length,5.1);
    }

    crystalNoiseBuffer=buffer;
    return buffer;
  }

  function playGemDing(tier,impact=1,x=W/2) {
    if(!audioCtx||!gemAudioMaster||audioCtx.state!=='running') return;

    const now=performance.now();

    if(now-dingWindowStartedAt>48){
      dingWindowStartedAt=now;
      dingVoicesInWindow=0;
    }

    if(dingVoicesInWindow>=3) return;
    dingVoicesInWindow++;

    const note=gemNoteForTier(tier);
    const noteHz=1318.510*Math.pow(2,note.semitones/12);
    const strength=clamp((impact-.45)/4.6,0,1);
    const t=audioCtx.currentTime;
    const ring=.34+strength*.34;

    const voice=audioCtx.createGain();
    const pan=typeof audioCtx.createStereoPanner==='function'
      ? audioCtx.createStereoPanner()
      : null;
    const dryGain=audioCtx.createGain();
    const wetGain=audioCtx.createGain();

    voice.gain.setValueAtTime(.0001,t);
    voice.gain.exponentialRampToValueAtTime(.34+strength*.32,t+.0018);
    voice.gain.exponentialRampToValueAtTime(.0001,t+ring);

    dryGain.gain.value=1;
    wetGain.gain.value=.22+strength*.10;

    if(pan){
      pan.pan.value=clamp((x/W)*2-1,-.82,.82);
      voice.connect(pan);
      pan.connect(dryGain);
      pan.connect(wetGain);
    }else{
      voice.connect(dryGain);
      voice.connect(wetGain);
    }

    dryGain.connect(gemAudioDry);
    wetGain.connect(gemAudioWet);

    const strike=audioCtx.createBufferSource();
    const strikeHP=audioCtx.createBiquadFilter();
    const strikeBP=audioCtx.createBiquadFilter();
    const strikeGain=audioCtx.createGain();

    strike.buffer=getCrystalNoiseBuffer();
    strikeHP.type='highpass';
    strikeHP.frequency.value=2400;
    strikeBP.type='bandpass';
    strikeBP.frequency.value=5100+strength*2100;
    strikeBP.Q.value=1.3;

    strikeGain.gain.setValueAtTime(.20+strength*.28,t);
    strikeGain.gain.exponentialRampToValueAtTime(.0001,t+.016+strength*.012);

    strike.connect(strikeHP);
    strikeHP.connect(strikeBP);
    strikeBP.connect(strikeGain);
    strikeGain.connect(voice);
    strike.start(t);
    strike.stop(t+.05);

    const modes=[
      {ratio:1.000,level:.54,life:1.00},
      {ratio:2.318,level:.205,life:.62},
      {ratio:3.887,level:.102,life:.43},
      {ratio:5.421,level:.050,life:.30},
      {ratio:7.146,level:.024,life:.21}
    ];

    for(let i=0;i<modes.length;i++){
      const mode=modes[i];
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const resonator=audioCtx.createBiquadFilter();

      const imperfect=i===0?1:1+(Math.random()-.5)*.0065;
      const startHz=noteHz*mode.ratio*imperfect;
      const endHz=startHz*(i===0?1:.997-Math.random()*.0015);
      const life=ring*mode.life*(.90+Math.random()*.14);

      osc.type='sine';
      osc.frequency.setValueAtTime(startHz,t);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(80,endHz),
        t+.026+i*.004
      );

      resonator.type='bandpass';
      resonator.frequency.value=Math.min(15000,startHz);
      resonator.Q.value=2.7+i*.9;

      gain.gain.setValueAtTime(.0001,t);
      gain.gain.exponentialRampToValueAtTime(
        mode.level*(.76+strength*.42),
        t+.0012+i*.0003
      );
      gain.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.035,life));

      osc.connect(resonator);
      resonator.connect(gain);
      gain.connect(voice);

      osc.start(t);
      osc.stop(t+Math.max(.05,life)+.025);
    }

    const ice=audioCtx.createOscillator();
    const iceGain=audioCtx.createGain();
    const iceDelay=audioCtx.createDelay(.08);
    const iceHP=audioCtx.createBiquadFilter();

    ice.type='sine';
    ice.frequency.value=Math.min(14500,noteHz*8.08);
    iceHP.type='highpass';
    iceHP.frequency.value=6500;
    iceDelay.delayTime.value=.020+Math.random()*.014;

    iceGain.gain.setValueAtTime(.0001,t);
    iceGain.gain.exponentialRampToValueAtTime(.014+strength*.016,t+.014);
    iceGain.gain.exponentialRampToValueAtTime(.0001,t+.34+strength*.12);

    ice.connect(iceHP);
    iceHP.connect(iceDelay);
    iceDelay.connect(iceGain);
    iceGain.connect(gemAudioWet);

    ice.start(t);
    ice.stop(t+.50);
  }

  function tone(freq,duration=.055,volume=.022,type='sine') {
    if (!audioCtx||gameMuted) return;
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
    '#define SHADER_NAME GEM_REACTIVE_FACET_FS',
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uMainSampler;',
    'uniform vec3 uGemColor;',
    'uniform vec3 uDeepColor;',
    'uniform vec3 uAccentColor;',
    'uniform float uLightAngle;',
    'uniform float uTime;',
    'uniform float uStepCut;',
    'varying vec2 outTexCoord;',
    'varying vec4 outTint;',
    'void main(){',
    '  vec4 src=texture2D(uMainSampler,outTexCoord);',
    '  if(src.a<.015) discard;',
    '  vec2 xy=src.rg*2.0-1.0;',
    '  float zz=sqrt(max(.001,1.0-dot(xy,xy)));',
    '  vec3 normal=normalize(vec3(xy,zz));',
    '  vec3 lightDir=normalize(vec3(cos(uLightAngle)*.67,sin(uLightAngle)*.67,.74));',
    '  vec3 tintLight=normalize(vec3(-cos(uLightAngle)*.16,-sin(uLightAngle)*.16,.97));',
    '  float diffuse=max(dot(normal,lightDir),0.0);',
    '  float facing=clamp(normal.z,0.0,1.0);',
    '  float transmission=max(dot(normal,tintLight),0.0);',
    '  float rim=pow(1.0-facing,1.15);',
    '  float style=src.b;',
    '  float energy=.22+(style-.52)*.78+diffuse*.34+transmission*.28+rim*.16+facing*.12;',
    '  float low=smoothstep(.18,.56,energy);',
    '  float high=smoothstep(.55,.88,energy);',
    '  vec3 material=mix(uDeepColor,uGemColor,low);',
    '  material=mix(material,uAccentColor,high*.72);',
    '  vec3 viewDir=vec3(0.0,0.0,1.0);',
    '  vec3 reflected=reflect(-lightDir,normal);',
    '  float spec=pow(max(dot(reflected,viewDir),0.0),mix(18.0,16.0,uStepCut));',
    '  float caustic=pow(transmission,mix(3.0,2.8,uStepCut))*.18;',
    '  float flash=clamp(spec*1.15+caustic+diffuse*.03,0.0,mix(.34,.28,uStepCut));',
    '  vec3 color=material;',
    '  color=mix(color,uAccentColor,flash*.72);',
    '  color+=uAccentColor*flash*.34;',
    '  color*=.92+style*.16;',
    '  gl_FragColor=vec4(color,src.a);',
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

      this.set3f('uGemColor',d.gemColor[0],d.gemColor[1],d.gemColor[2]);
      this.set3f('uDeepColor',d.deepColor[0],d.deepColor[1],d.deepColor[2]);
      this.set3f('uAccentColor',d.accentColor[0],d.accentColor[1],d.accentColor[2]);
      this.set1f('uLightAngle',GEM_WORLD_LIGHT_ANGLE-(gameObject.rotation||0));
      this.set1f('uTime',this.game.loop.time*.001);
      this.set1f('uStepCut',d.stepCut?1:0);
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
      this.dropGateGem=null;
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
      this.powerCharge={tumble:1,cascade:1,prism:1};
      this.gemMaskShape=null;
      this.gemMask=null;
      this.webglLighting=false;
      this.keyLight=null;
      this.fillLight=null;
      this.rimLight=null;
      this.uiBound=false;
      this.gemVisualBounds=[];
      this.gemPipeline=null;
      this.activeGemGlints=0;
      this.tumbleState=null;
      this.baseGravityY=1.32;
    }

    preload() {
      if(!window.ReactiveGemSystem) throw new Error('ReactiveGemSystem is not available');
      for(const [cutKey,cut] of Object.entries(window.ReactiveGemSystem.cuts)){
        this.load.text('reactive-src-'+cutKey,cut.asset);
      }
    }

    create() {
      this.cameras.main
        .setOrigin(0,0)
        .setZoom(RENDER_SCALE)
        .setScroll(0,0)
        .setBackgroundColor('rgba(0,0,0,0)');
      this.matter.set60Hz();

      const engine=this.matter.world.engine;
      engine.positionIterations=14;
      engine.velocityIterations=10;
      engine.constraintIterations=3;
      engine.gravity.x=0;
      engine.gravity.y=this.baseGravityY;
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
        this.add.rectangle(WALL+17+LIMIT_OPTICAL_X,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7),
        this.add.rectangle(W-WALL-17+LIMIT_OPTICAL_X,LIMIT_Y,8,8,0xffcf65,1).setAngle(45).setDepth(7)
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
      this.gemMaskShape.fillRect(WALL,16,W-WALL*2,FRAME_FLOOR+20);
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

      $('homeButton').addEventListener('click',()=>this.returnToMenu());
      $('pauseButton').addEventListener('click',()=>this.setPaused(true));
      $('muteButton').addEventListener('click',()=>{
        unlockAudio();
        setGameMuted(!gameMuted);
      });
      syncMuteButton();
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
      const w=canvas.width;
      const h=canvas.height;
      const cx=w/2;
      const cy=h/2;

      ctx.clearRect(0,0,w,h);

      const firstR=tiers[0].r;
      const lastR=tiers[tiers.length-1].r;
      const sizeT=clamp((t.r-firstR)/(lastR-firstR),0,1);
      const cavityRadius=58+sizeT*10;
      const exact=window.ReactiveGemSystem
        ? window.ReactiveGemSystem.collisionShape(t.reactiveCut,cavityRadius)
        : null;

      const shapePath=()=>{
        if(exact&&exact.type==='circle'){
          ctx.beginPath();
          ctx.arc(cx,cy,exact.radius,0,Math.PI*2);
          ctx.closePath();
          return;
        }

        const vertices=exact&&exact.vertices&&exact.vertices.length>=3
          ? exact.vertices.map(v=>({x:cx+v.x,y:cy+v.y}))
          : this.cutPoints(t.cutKey,cavityRadius,cx,cy);

        polygonPath(ctx,vertices);
      };

      // The recess follows the actual SVG silhouette. It is simply a darker
      // version of the tray surface with a soft inner shadow, rather than a
      // decorative frame that uses a different cut.
      shapePath();
      ctx.fillStyle='rgba(13,5,18,.78)';
      ctx.fill();

      ctx.save();
      shapePath();
      ctx.clip();

      // Inner shadow: the wide stroked edge is clipped to the cavity so its
      // shadow falls inward, exactly like a pressed jewellery inlay.
      ctx.shadowColor='rgba(0,0,0,.88)';
      ctx.shadowBlur=14;
      ctx.shadowOffsetX=0;
      ctx.shadowOffsetY=4;
      ctx.lineWidth=12;
      ctx.strokeStyle='rgba(0,0,0,.58)';
      shapePath();
      ctx.stroke();

      const shade=ctx.createLinearGradient(0,cy-cavityRadius,0,cy+cavityRadius);
      shade.addColorStop(0,'rgba(255,255,255,.025)');
      shade.addColorStop(.42,'rgba(0,0,0,.02)');
      shade.addColorStop(1,'rgba(0,0,0,.17)');
      ctx.fillStyle=shade;
      ctx.fillRect(0,0,w,h);
      ctx.restore();

      ctx.lineWidth=1.35;
      ctx.strokeStyle='rgba(255,220,231,.075)';
      shapePath();
      ctx.stroke();

      if(locked) return;

      if(window.ReactiveGemSystem){
        const source=window.ReactiveGemSystem.renderPreviewCanvas(
          t.reactiveCut,
          t.color,
          0,
          256
        );
        const max=cavityRadius*1.78;
        const scale=Math.min(max/source.width,max/source.height);
        const gw=source.width*scale;
        const gh=source.height*scale;

        ctx.save();
        ctx.shadowColor='rgba(0,0,0,.48)';
        ctx.shadowBlur=7;
        ctx.shadowOffsetY=4;
        ctx.drawImage(source,cx-gw/2,cy-gh/2,gw,gh);
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
            ? t.name+', value $'+fmt(t.score)
            : 'Undiscovered gem'
        );

        const art=document.createElement('div');
        art.className='gem-card__art';

        const canvas=document.createElement('canvas');
        canvas.width=256;
        canvas.height=256;
        canvas.setAttribute('aria-hidden','true');
        art.appendChild(canvas);

        const meta=document.createElement('div');
        meta.className='gem-card__meta';

        if(unlocked){
          const name=document.createElement('strong');
          name.textContent=t.name;

          const value=document.createElement('div');
          value.className='gem-card__value';
          value.textContent='$'+fmt(t.score);

          meta.append(name,value);
        }else{
          const unknown=document.createElement('span');
          unknown.className='gem-card__unknown';
          unknown.textContent='UNDISCOVERED';
          meta.append(unknown);
        }

        card.append(art,meta);
        gemCollection.appendChild(card);
        try{
          this.drawCollectionGem(canvas,tier,!unlocked);
        }catch(error){
          console.error('Collection gem render failed for tier',tier,error);
        }
      });

      collectionProgress.textContent=this.unlockedTiers.size+' / '+tiers.length;
    }

    makeTextures() {
      this.makeSparkleTexture();

      const sources={};
      for(const cutKey of Object.keys(window.ReactiveGemSystem.cuts)){
        sources[cutKey]=this.cache.text.get('reactive-src-'+cutKey);
      }
      window.ReactiveGemSystem.prepare(sources);

      for(const cutKey of Object.keys(window.ReactiveGemSystem.cuts)){
        const key='reactive-gem-'+cutKey;
        if(this.textures.exists(key)) this.textures.remove(key);
        const canvas=window.ReactiveGemSystem.createDataCanvas(cutKey,GEM_TEXTURE_SIZE);
        const texture=this.textures.addCanvas(key,canvas);
        if(texture) texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }

      for(let i=0;i<tiers.length;i++) this.gemVisualBounds[i]=GEM_TEXTURE_SIZE;
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
      const t=tiers[tier];
      const visualScale=window.ReactiveGemSystem&&window.ReactiveGemSystem.visualScale
        ? window.ReactiveGemSystem.visualScale(t.reactiveCut)
        : 1;
      return ((t.r*2*ART_SCALE)/GEM_TEXTURE_SIZE)*visualScale;
    }

    sizeGemSprite(gameObject,tier) {
      const scale=this.gemSpriteScale(tier);
      gameObject.setScale(scale);
      return scale;
    }

    measureGemBounds(index) {
      this.gemVisualBounds[index]=GEM_TEXTURE_SIZE;
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
      const texture=this.textures.get(gemTextureKey(tier));
      const source=texture&&texture.getSourceImage
        ? texture.getSourceImage()
        : null;
      const w=source&&source.width?source.width:GEM_TEXTURE_SIZE;
      const h=source&&source.height?source.height:GEM_TEXTURE_SIZE;

      gameObject.pipelineData={
        gemColor:hexToUnitRgb(t.color),
        deepColor:hexToUnitRgb(t.dark),
        accentColor:hexToUnitRgb(t.accent),
        stepCut:window.ReactiveGemSystem.isStepCut(t.reactiveCut),
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
      const shadow=this.add.image(gem.x,gem.y,gemTextureKey(gem.tier))
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
      if(!gem) return;

      gem.sheen=null;

      const glint=this.add.image(gem.x,gem.y,'gem-sparkle')
        .setDepth(22+gem.tier*.01)
        .setAlpha(0)
        .setScale(.12)
        .setBlendMode(Phaser.BlendModes.ADD);

      if(this.gemMask) glint.setMask(this.gemMask);

      gem.glint=glint;
      gem.glintActive=false;
      gem.glintStartedAt=0;
      gem.glintDuration=0;
      gem.glintOffsetX=0;
      gem.glintOffsetY=0;
      gem.glintBaseScale=.12;
      gem.nextGlintAt=this.time.now+Phaser.Math.Between(900,4200);
    }

    syncGemOptics(gem,time) {
      if(!gem||!gem.active||!gem.glint||!gem.glint.active) return;

      const glint=gem.glint;

      if(!gem.glintActive&&time>=gem.nextGlintAt){
        if(this.activeGemGlints>=2){
          gem.nextGlintAt=time+Phaser.Math.Between(350,1000);
          return;
        }

        const t=tiers[gem.tier];
        const angle=Phaser.Math.FloatBetween(0,Math.PI*2);
        const radius=t.r*Phaser.Math.FloatBetween(.08,.28);

        gem.glintOffsetX=Math.cos(angle)*radius;
        gem.glintOffsetY=Math.sin(angle)*radius;
        gem.glintDuration=Phaser.Math.Between(280,440);
        gem.glintStartedAt=time;
        gem.glintBaseScale=Phaser.Math.FloatBetween(.105,.155)*
          (1+Math.min(.30,gem.tier*.012));
        gem.glintActive=true;
        this.activeGemGlints++;
      }

      if(!gem.glintActive){
        glint.setAlpha(0);
        return;
      }

      const p=clamp(
        (time-gem.glintStartedAt)/Math.max(1,gem.glintDuration),
        0,
        1
      );

      if(p>=1){
        gem.glintActive=false;
        glint.setAlpha(0);
        this.activeGemGlints=Math.max(0,this.activeGemGlints-1);
        gem.nextGlintAt=time+Phaser.Math.Between(1800,6200);
        return;
      }

      const cos=Math.cos(gem.rotation);
      const sin=Math.sin(gem.rotation);
      const x=gem.glintOffsetX*cos-gem.glintOffsetY*sin;
      const y=gem.glintOffsetX*sin+gem.glintOffsetY*cos;
      const pulse=Math.sin(Math.PI*p);

      glint.x=gem.x+x;
      glint.y=gem.y+y;
      glint.rotation=-gem.rotation*.18;
      glint.setScale(gem.glintBaseScale*(.72+pulse*.48));
      glint.setAlpha(pulse*.34);
    }

    drawVaultBackdrop() {
      const bg=this.add.graphics().setDepth(0);
      const rails=this.add.graphics().setDepth(18);

      rails.fillGradientStyle(0xffed9e,0xffbd3f,0xb13f61,0x6a1f52,.24);
      rails.fillRect(FRAME_WALL,FRAME_FLOOR,W-FRAME_WALL*2,8);

      const sparkleColors=[0xffc65b,0xf36ac8,0xa46cff,0xffffff];

      for(let i=0;i<28;i++){
        const x=(i*173.7)%W;
        const y=(i*109.3)%H;
        const s=this.add.circle(
          x,
          y,
          .75+(i%3)*.24,
          sparkleColors[i%sparkleColors.length],
          .16
        ).setDepth(1);

        const driftX=Phaser.Math.Between(-18,18);
        const driftY=Phaser.Math.Between(-18,18);

        this.tweens.add({
          targets:s,
          x:x+driftX,
          y:y+driftY,
          alpha:{from:.05,to:.24},
          duration:1800+(i%5)*260,
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
      this.dropGateGem=null;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.discoveredCuts=new Set(this.unlockedTiers);
      this.powerCharge={tumble:1,cascade:1,prism:1};

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
      this.activeGemGlints=0;
      this.dropGateGem=null;
      this.tumbleState=null;
      if(this.matter&&this.matter.world&&this.matter.world.engine){
        this.matter.world.engine.gravity.x=0;
        this.matter.world.engine.gravity.y=this.baseGravityY;
      }

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

      this.preview=this.add.image(x,DROP_Y,gemTextureKey(this.currentTier)).setDepth(32);
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

      const gem=this.matter.add.image(x,y,gemTextureKey(tier),null,{
        label:'gem',
        restitution:.012,
        friction:.018,
        frictionStatic:.075,
        frictionAir:.004,
        density:.00115,
        sleepThreshold:0
      });

      this.sizeGemSprite(gem,tier);

      const exactShape=window.ReactiveGemSystem.collisionShape(
        t.reactiveCut,
        t.r*COLLIDER_SCALE
      );

      const tierWeight=tier/(tiers.length-1);
      const gemDensity=.00112+tierWeight*.00078;
      const gemAir=.0036+tierWeight*.0017;
      const bodyOptions={
        restitution:.004,
        friction:.026,
        frictionStatic:.018,
        frictionAir:gemAir,
        density:gemDensity,
        sleepThreshold:52,
        slop:.014
      };

      if(exactShape&&exactShape.type==='circle'){
        gem.setCircle(exactShape.radius,bodyOptions);
      }else if(exactShape&&exactShape.vertices&&exactShape.vertices.length>=3){
        gem.setBody(
          {
            type:'fromVertices',
            verts:exactShape.vertices
          },
          bodyOptions
        );
      }else{
        const cutVerts=this.cutPoints(t.cutKey,t.r*COLLIDER_SCALE);
        gem.setBody({type:'fromVertices',verts:cutVerts},bodyOptions);
      }

      gem.setBounce(.004);
      gem.setFriction(.026,gemAir,.018);
      gem.setDensity(gemDensity);
      gem.setSleepThreshold(52);

      // Real gems are never released with mathematically perfect balance.
      let releaseAngle=Phaser.Math.FloatBetween(-7.5,7.5);
      if(Math.abs(releaseAngle)<1.6) releaseAngle=releaseAngle<0?-1.6:1.6;
      gem.setAngle(releaseAngle);
      gem.setAngularVelocity(Phaser.Math.FloatBetween(-.006,.006));

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

      if(gem.glintActive){
        this.activeGemGlints=Math.max(0,this.activeGemGlints-1);
        gem.glintActive=false;
      }

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
      this.dropGateGem=gem;

      tone(180,.04,.015,'triangle');
      haptic(5);

      this.currentTier=this.nextTier;
      this.nextTier=this.randomSpawnTier();
      this.unlockTier(this.currentTier,false);
      this.unlockTier(this.nextTier,false);

      this.updateNextPreview();
      this.updateAimHandle();
      this.updatePowerButtons();
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
            now-(a.lastDingAt||0)>64 &&
            now-(b.lastDingAt||0)>64
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

        if(speed>.55&&now-(gem.lastDingAt||0)>64){
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

          if(gapX>4||gapY>4) continue;

          const distance=Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y);
          const maxDistance=(tiers[a.tier].r*COLLIDER_SCALE)*2.17;

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
        const gateInMerge=this.dropGateGem===a||this.dropGateGem===b;
        const x=(a.x+b.x)/2;
        const y=(a.y+b.y)/2;
        const vx=(a.body.velocity.x+b.body.velocity.x)*.32;
        const vy=(a.body.velocity.y+b.body.velocity.y)*.18;
        const av=(a.body.angularVelocity+b.body.angularVelocity)*.22;

        this.removeGem(a);
        this.removeGem(b);

        this.rechargePowers(1);

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
          if(gateInMerge) this.dropGateGem=null;
          continue;
        }

        const gem=this.createGem(x,y,next);
        if(gateInMerge) this.dropGateGem=gem;
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

      if(icon==='gem'&&Number.isInteger(tier)&&window.ReactiveGemSystem){
        const canvas=document.createElement('canvas');
        canvas.width=40;
        canvas.height=40;
        const ctx=canvas.getContext('2d');
        const t=tiers[tier];
        const source=window.ReactiveGemSystem.renderPreviewCanvas(t.reactiveCut,t.color,0,128,t);
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

    rechargePowers(amount=1) {
      const gains={
        tumble:.18,
        prism:.125,
        cascade:.09
      };

      for(const key of Object.keys(gains)){
        this.powerCharge[key]=clamp(
          (this.powerCharge[key]??1)+gains[key]*amount,
          0,
          1
        );
      }
      this.updatePowerButtons();
    }

    updatePowerButtons() {
      const active=this.running&&!this.paused;
      const canCascade=this.matchingPairs().length>0;
      const buttons={
        tumble:$('powerTumble'),
        cascade:$('powerCascade'),
        prism:$('powerPrism')
      };

      for(const [key,button] of Object.entries(buttons)){
        const charge=clamp(this.powerCharge[key]??1,0,1);
        button.style.setProperty('--charge',charge.toFixed(3));
        button.dataset.charge=Math.round(charge*100);
        button.setAttribute('aria-label',button.textContent.trim()+' '+Math.round(charge*100)+'% charged');
        button.classList.toggle('charged',charge>=.999);
      }

      buttons.tumble.disabled=!active||(this.powerCharge.tumble??0)<.999||this.gems.length===0;
      buttons.cascade.disabled=!active||(this.powerCharge.cascade??0)<.999||!canCascade;
      buttons.prism.disabled=!active||(this.powerCharge.prism??0)<.999||!this.ready||this.currentTier>=tiers.length-1;
    }

    useTumble() {
      if(
        !this.running||
        this.paused||
        this.tumbleState||
        (this.powerCharge.tumble??0)<.999||
        !this.gems.length
      ) return;

      this.powerCharge.tumble=0;
      this.tumbleState={
        started:this.time.now,
        duration:980,
        nextKick:this.time.now
      };

      const shell=document.querySelector('.play-shell');
      if(shell){
        shell.classList.remove('tumbling');
        void shell.offsetWidth;
        shell.classList.add('tumbling');
        window.setTimeout(()=>shell.classList.remove('tumbling'),1080);
      }

      const M=Phaser.Physics.Matter.Matter;
      for(const gem of this.gems){
        if(!gem||!gem.active||!gem.body) continue;
        M.Body.setVelocity(gem.body,{
          x:clamp(gem.body.velocity.x+Phaser.Math.FloatBetween(-1.15,1.15),-4.5,4.5),
          y:clamp(gem.body.velocity.y+Phaser.Math.FloatBetween(-.75,.15),-3.6,5.0)
        });
        M.Body.setAngularVelocity(
          gem.body,
          clamp(gem.body.angularVelocity+Phaser.Math.FloatBetween(-.035,.035),-.085,.085)
        );
      }

      this.cameras.main.shake(820,.0055);
      this.showStatus('TUMBLE!','reward',1050,'rotate-cw');
      tone(210,.12,.028,'triangle');
      haptic([10,18,10,18,12]);
      this.updatePowerButtons();
    }

    updateTumble(time) {
      if(!this.tumbleState) return;

      const state=this.tumbleState;
      const engine=this.matter.world.engine;
      const elapsed=time-state.started;
      const p=clamp(elapsed/state.duration,0,1);
      const envelope=Math.sin(Math.PI*p);
      const wave=Math.sin(p*Math.PI*9);

      engine.gravity.x=wave*.64*envelope;
      engine.gravity.y=this.baseGravityY-
        Math.max(0,Math.sin(p*Math.PI*5))*.28*envelope;

      if(time>=state.nextKick){
        state.nextKick=time+150;
        const M=Phaser.Physics.Matter.Matter;
        const direction=wave>=0?1:-1;

        for(const gem of this.gems){
          if(!gem||!gem.active||!gem.body) continue;
          M.Body.setVelocity(gem.body,{
            x:clamp(
              gem.body.velocity.x+
              direction*Phaser.Math.FloatBetween(.28,.72)*envelope,
              -4.8,
              4.8
            ),
            y:clamp(
              gem.body.velocity.y-
              Phaser.Math.FloatBetween(.08,.34)*envelope,
              -3.8,
              5.2
            )
          });
          M.Body.setAngularVelocity(
            gem.body,
            clamp(
              gem.body.angularVelocity+
              direction*Phaser.Math.FloatBetween(.008,.022),
              -.09,
              .09
            )
          );
        }
      }

      if(p>=1){
        engine.gravity.x=0;
        engine.gravity.y=this.baseGravityY;
        this.tumbleState=null;
      }
    }

    useCascade() {
      if(!this.running||this.paused||(this.powerCharge.cascade??0)<.999) return;

      const pairs=this.matchingPairs();
      if(!pairs.length){
        this.showStatus('NO MATCHES TO CASCADE','info',900,'circle-slash-2');
        this.updatePowerButtons();
        return;
      }

      this.powerCharge.cascade=0;

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
        (this.powerCharge.prism??0)<.999||
        !this.ready||
        this.currentTier>=tiers.length-1
      ) return;

      this.powerCharge.prism=0;
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

    returnToMenu() {
      this.running=false;
      this.ready=false;
      this.paused=false;
      this.pointerHeld=false;
      this.clearRun();
      this.clearStatus();
      this.matter.world.pause();
      pauseOverlay.classList.remove('visible');
      gameOverOverlay.classList.remove('visible');
      collectionOverlay.classList.remove('visible');
      startOverlay.classList.add('visible');
      this.updatePowerButtons();
    }

    setPaused(value) {
      if(!this.running) return;

      this.paused=value;
      pauseOverlay.classList.toggle('visible',value);
      this.updatePowerButtons();

      if(value){
        if(this.tumbleState){
          this.tumbleState=null;
          this.matter.world.engine.gravity.x=0;
          this.matter.world.engine.gravity.y=this.baseGravityY;
        }
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
      this.tumbleState=null;
      this.matter.world.engine.gravity.x=0;
      this.matter.world.engine.gravity.y=this.baseGravityY;
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
      if(!window.ReactiveGemSystem) return;

      const t=tiers[this.nextTier];
      const source=window.ReactiveGemSystem.renderPreviewCanvas(t.reactiveCut,t.color,0,256,t);
      const maxW=nextPreview.width*.82;
      const maxH=nextPreview.height*.82;
      const scale=Math.min(maxW/source.width,maxH/source.height);
      const w=source.width*scale;
      const h=source.height*scale;

      c.drawImage(source,(nextPreview.width-w)/2,(nextPreview.height-h)/2,w,h);
    }

    update(time,delta) {
      const dt=Math.min(delta,34)/1000;
      this.animateGemLights(time);
      this.updateTumble(time);

      if(this.running&&!this.paused&&!this.ready&&!this.dropGateGem&&time-this.lastDropAt>=DROP_DELAY){
        this.ready=true;
        this.createDropPreview(true);
      }

      if(this.running&&!this.paused&&!this.ready&&this.dropGateGem){
        const gate=this.dropGateGem;
        if(!gate.active||!gate.body){
          this.dropGateGem=null;
          this.ready=true;
          this.createDropPreview(true);
        }else if(
          time-this.lastDropAt>=90 &&
          gate.body.bounds.min.y>LIMIT_Y+2
        ){
          this.dropGateGem=null;
          this.ready=true;
          this.createDropPreview(true);
        }
      }

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
      this.limitLine.moveTo(WALL+18+LIMIT_OPTICAL_X,LIMIT_Y);
      this.limitLine.lineTo(W-WALL-18+LIMIT_OPTICAL_X,LIMIT_Y);
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
      roundPixels:false,
      maxLights:3,
      mipmapFilter:'LINEAR'
    },
    scene:GameScene
  };

  new Phaser.Game(config);
})();