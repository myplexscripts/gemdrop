(() => {
  'use strict';

  if (!window.Phaser) return;

  function syncGameViewport(){
    const standalone=(
      window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches
    )||window.navigator.standalone===true;

    document.body.classList.toggle('gemdrop-standalone',!!standalone);

    if(standalone){
      document.documentElement.style.removeProperty('--gemdrop-viewport-height');
      return;
    }

    const viewport=window.visualViewport;
    const visibleHeight=Math.max(
      1,
      Math.round(
        viewport&&Number.isFinite(viewport.height)
          ? viewport.height
          : window.innerHeight
      )
    );

    document.documentElement.style.setProperty(
      '--gemdrop-viewport-height',
      visibleHeight+'px'
    );
  }

  syncGameViewport();
  window.addEventListener('resize',syncGameViewport,{passive:true});
  window.addEventListener('orientationchange',syncGameViewport,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',syncGameViewport,{passive:true});
    window.visualViewport.addEventListener('scroll',syncGameViewport,{passive:true});
  }

  const W = 640;
  const H = 936;
  const FRAME_WALL = 24;
  const FRAME_FLOOR = 900;
  const WALL = 16;
  const FLOOR = 880;
  const DROP_Y = 104;
  const LIMIT_Y = 146;
  const LIMIT_OPTICAL_X = 6;
  const DROP_DELAY = 300;
  const AUTO_FIRE_DELAY = 390;
  const AIM_CONTROL_GAIN = 1.25;
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
  const homeCrownProgressText = $('homeCrownProgressText');
  const homeCrownProgressFill = $('homeCrownProgressFill');

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
    {name:'Quartz',description:'A pale crystal that catches even the faintest light.', cut:'Rectangular', cutKey:'rose', reactiveCut:'rectangular', r:48, score:1, color:'#D7EBF2', accent:'#EDF6F9', dark:'#859296'},
    {name:'Citrine',description:'A warm golden gem with the glow of bottled sunlight.', cut:'Circular Starcut', cutKey:'trillion', reactiveCut:'circular_starcut', r:53, score:3, color:'#E9B11E', accent:'#F5DC9A', dark:'#906E13'},
    {name:'Sunstone',description:'A fiery stone that seems to hold a spark of dawn.', cut:'Emerald Stepcut', cutKey:'cushion', reactiveCut:'emerald_stepcut', r:58, score:6, color:'#E67A45', accent:'#F4C3AB', dark:'#8F4C2B'},
    {name:'Amethyst',description:'Deep violet crystal with a calm, royal glow.', cut:'Rectangular Brilliant', cutKey:'emerald', reactiveCut:'rectangular_brilliant', r:63, score:10, color:'#A968E5', accent:'#D8BBF3', dark:'#69408E'},
    {name:'Peridot',description:'Fresh green brilliance made for bold beginnings.', cut:'Heart', cutKey:'princess', reactiveCut:'heart', r:69, score:15, color:'#99D64D', accent:'#D1EDAF', dark:'#5F8530'},
    {name:'Garnet',description:'A dark red jewel with the warmth of banked embers.', cut:'Tanzanite', cutKey:'radiant', reactiveCut:'tanzanite', r:75, score:22, color:'#B33149', accent:'#DDA2AD', dark:'#6F1E2D'},
    {name:'Topaz',description:'Honey-gold facets that flash with quiet richness.', cut:'Rectangular', cutKey:'square', reactiveCut:'rectangular', r:81, score:30, color:'#D7902F', accent:'#EDCDA1', dark:'#85591D'},
    {name:'Moonstone',description:'Milky light drifts across it like a moonlit tide.', cut:'Circular Starcut', cutKey:'french', reactiveCut:'circular_starcut', r:88, score:40, color:'#B9C9F2', accent:'#E0E7F9', dark:'#737D96'},
    {name:'Zircon',description:'Clear blue fire with a sharp, electric sparkle.', cut:'Emerald Stepcut', cutKey:'oval', reactiveCut:'emerald_stepcut', r:95, score:52, color:'#42C7E8', accent:'#AAE6F5', dark:'#297B90'},
    {name:'Morganite',description:'A blush-pink jewel with a soft romantic glow.', cut:'Rectangular Brilliant', cutKey:'asscher', reactiveCut:'rectangular_brilliant', r:102, score:66, color:'#F5B3C8', accent:'#FADDE6', dark:'#986F7C'},
    {name:'Aquamarine',description:'Sea-green clarity that feels cool even in the hand.', cut:'Heart', cutKey:'pear', reactiveCut:'heart', r:110, score:82, color:'#63E3C4', accent:'#B9F2E4', dark:'#3D8D7A'},
    {name:'Tourmaline',description:'Vivid violet colour with a restless inner shimmer.', cut:'Tanzanite', cutKey:'octagon', reactiveCut:'tanzanite', r:118, score:100, color:'#C447B6', accent:'#E4ACDE', dark:'#7A2C71'},
    {name:'Tanzanite',description:'Rare blue-violet fire drawn from the edge of night.', cut:'Rectangular', cutKey:'octagon', reactiveCut:'rectangular', r:127, score:122, color:'#4F54D9', accent:'#B0B2EE', dark:'#313487'},
    {name:'Spinel',description:'A brilliant pink-red jewel with a lively inner spark.', cut:'Circular Starcut', cutKey:'rectangle', reactiveCut:'circular_starcut', r:136, score:148, color:'#FF4F87', accent:'#FFB0C9', dark:'#9E3154'},
    {name:'Sapphire',description:'Royal blue depth with a crisp, unwavering shine.', cut:'Emerald Stepcut', cutKey:'step', reactiveCut:'emerald_stepcut', r:146, score:178, color:'#2D63D6', accent:'#A0B9ED', dark:'#1C3D85'},
    {name:'Emerald',description:'Lush green brilliance worthy of the finest vault.', cut:'Rectangular Brilliant', cutKey:'scissor', reactiveCut:'rectangular_brilliant', r:156, score:212, color:'#18B56A', accent:'#97DEBC', dark:'#0F7042'},
    {name:'Ruby',description:'A fierce red jewel that burns like captured flame.', cut:'Heart', cutKey:'pendeloque', reactiveCut:'heart', r:167, score:250, color:'#E12F4F', accent:'#F2A1B0', dark:'#8C1D31'},
    {name:'Alexandrite',description:'A mysterious gem whose colour never seems quite still.', cut:'Tanzanite', cutKey:'trapeze', reactiveCut:'tanzanite', r:179, score:292, color:'#47B38E', accent:'#ACDDCC', dark:'#2C6F58'},
    {name:'Starstone',description:'An uncanny violet jewel lit by a star-like glow.', cut:'Rectangular', cutKey:'navette', reactiveCut:'rectangular', r:192, score:340, color:'#9B6BFF', accent:'#D2BCFF', dark:'#60429E'},
    {name:'Crownstone',description:'The vault’s legendary prize, blazing with golden light.', cut:'Circular Starcut', cutKey:'brilliant', reactiveCut:'circular_starcut', r:206, score:400, color:'#FFD24A', accent:'#FFEBAE', dark:'#9E822E'}
  ];;;;

  const POWER_START_CHARGE={tumble:.44,cascade:.16,prism:.28};
  const POWER_CHARGE_PER_MERGE={tumble:1/9,cascade:1/18,prism:1/13};

  const SPECIAL_DROPS={
    scatter:{label:'Scatter',hint:'SHAKES THE BOARD',color:0xe06cff,css:'#E06CFF'},
    fusion:{label:'Fusion',hint:'UPGRADES FIRST GEM',color:0x5ce5ff,css:'#5CE5FF'},
    charge:{label:'Charge',hint:'REFILLS POWERS',color:0xffd45c,css:'#FFD45C'}
  };

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

  const MUSIC_VOLUME=.32;
  const MUSIC_URL='assets/audio/main-loop.ogg?v=20260922-looptrim2';
  let musicUnlocked=false;
  let musicLoadPromise=null;
  let backgroundMusicBuffer=null;
  let backgroundMusicSource=null;
  let backgroundMusicGain=null;

  function setupBackgroundMusicBus(){
    if(!audioCtx||backgroundMusicGain) return;
    backgroundMusicGain=audioCtx.createGain();
    backgroundMusicGain.gain.value=0;
    backgroundMusicGain.connect(audioCtx.destination);
  }

  function loadBackgroundMusic(){
    if(!audioCtx) return Promise.resolve(null);
    if(backgroundMusicBuffer) return Promise.resolve(backgroundMusicBuffer);
    if(musicLoadPromise) return musicLoadPromise;

    musicLoadPromise=fetch(MUSIC_URL)
      .then(response=>{
        if(!response.ok) throw new Error('Could not load main-loop.ogg');
        return response.arrayBuffer();
      })
      .then(data=>audioCtx.decodeAudioData(data.slice(0)))
      .then(buffer=>{
        backgroundMusicBuffer=buffer;
        return buffer;
      })
      .catch(()=>{
        musicLoadPromise=null;
        return null;
      });

    return musicLoadPromise;
  }

  function startBackgroundMusic(){
    if(!audioCtx||!backgroundMusicBuffer||backgroundMusicSource) return;
    setupBackgroundMusicBus();
    if(!backgroundMusicGain) return;

    const source=audioCtx.createBufferSource();
    source.buffer=backgroundMusicBuffer;
    source.loop=true;
    source.loopStart=0;

    // Skip the final second of the source on every loop. This removes the
    // awkward tail while keeping the original audio file untouched.
    source.loopEnd=Math.max(.1,backgroundMusicBuffer.duration-1);
    source.connect(backgroundMusicGain);
    source.start(0);
    backgroundMusicSource=source;
  }

  function fadeMusic(to,duration=280){
    if(!audioCtx||!backgroundMusicGain) return;
    const gain=backgroundMusicGain.gain;
    const now=audioCtx.currentTime;
    const target=clamp(to,0,1);

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value,now);

    if(duration<=0){
      gain.setValueAtTime(target,now);
    }else{
      gain.linearRampToValueAtTime(target,now+duration/1000);
    }
  }

  function syncMusic(options={}){
    if(!musicUnlocked||!audioCtx) return;
    setupBackgroundMusicBus();

    const instant=!!options.instant;
    const shouldPlay=!document.hidden&&!gameMuted;

    if(!shouldPlay){
      fadeMusic(0,instant?0:280);
      return;
    }

    loadBackgroundMusic().then(buffer=>{
      if(!buffer||!musicUnlocked||document.hidden||gameMuted) return;
      startBackgroundMusic();
      fadeMusic(MUSIC_VOLUME,instant?0:280);
    });
  }

  function unlockMusic(){
    if(musicUnlocked) return;
    musicUnlocked=true;
    syncMusic({instant:true});
  }

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
        gameMuted?0:.81,
        audioCtx.currentTime,
        .018
      );
    }

    syncMusic({instant:false});
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
    gemAudioMaster.gain.value=gameMuted?0:.81;

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

    unlockMusic();
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

    setGemUniforms(gameObject) {
      const d=gameObject&&gameObject.pipelineData?gameObject.pipelineData:null;
      if(!d) return;

      this.set3f('uGemColor',d.gemColor[0],d.gemColor[1],d.gemColor[2]);
      this.set3f('uDeepColor',d.deepColor[0],d.deepColor[1],d.deepColor[2]);
      this.set3f('uAccentColor',d.accentColor[0],d.accentColor[1],d.accentColor[2]);

      // Keep the light fixed in world space. As the Matter body rotates,
      // the light direction moves across the gem's local facet normals.
      this.set1f('uLightAngle',GEM_WORLD_LIGHT_ANGLE-(gameObject.rotation||0));
      this.set1f('uTime',this.game.loop.time*.001);
      this.set1f('uStepCut',d.stepCut?1:0);
    }

    onBind(gameObject) {
      this.flush();
      super.onBind(gameObject);
      this.setGemUniforms(gameObject);
    }

    onBatch(gameObject) {
      if(!gameObject) return;
      // Phaser can keep this custom pipeline bound across many sprites.
      // Refresh the uniforms for every batched gem so rotation is reactive
      // per-object and per-frame instead of being frozen at the first bind.
      this.flush();
      this.setGemUniforms(gameObject);
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
      this.metaPaused=false;
      this.pointerHeld=false;
      this.autoFireEnabled=false;
      try{
        this.autoFireEnabled=localStorage.getItem('gemdrop-autofire')==='1';
      }catch{}
      this.targetX=W/2;
      this.preview=null;
      this.lastDropAt=0;
      this.dropGateGem=null;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.runMerges=0;
      this.runBestChain=0;
      this.runChestGain=0;
      this.runGemGains=Array(tiers.length).fill(0);
      this.runStartUnlocked=new Set([0]);
      this.runStartBest=0;
      this.runTreasureClaims=[];
      this.runStartedAt=0;
      this.runPausedTotal=0;
      this.runPauseStartedAt=0;
      this.discoveredCuts=new Set([0]);
      this.unlockedTiers=new Set([0]);
      this.limitLine=null;
      this.dropper=null;
      this.limitJewels=[];
      this.statusTimer=null;
      this.statusKind='';
      this.powerCharge={...POWER_START_CHARGE};
      this.spawnBag=[];
      this.spawnBagShift=-1;
      this.lastSpawnTier=null;
      this.spawnRepeat=0;
      this.specialGenerated=0;
      this.specialCountdown=6;
      this.currentSpecial=null;
      this.nextSpecial=null;
      this.runDrops=0;
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
      this.collectionLightAngle=GEM_WORLD_LIGHT_ANGLE;
      this.collectionPointerLightAngle=null;
      this.collectionPointerLightUntil=0;
      this.collectionLightRAF=0;
      this.collectionLightLastFrame=0;
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
      engine.positionIterations=10;
      engine.velocityIterations=8;
      engine.constraintIterations=2;
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
      this.updateHomeProgress();

      window.GemdropGameScene=this;
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
      this.gemMaskShape.fillRect(WALL,0,W-WALL*2,FRAME_FLOOR+36);
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

      document.addEventListener('pointerdown',()=>{
        unlockAudio();
        if(!this.running) syncMusic();
      },{once:true,passive:true});

      $('collectionButton').addEventListener('click',()=>{
        unlockAudio();
        syncMusic();
        this.renderCollection();
        collectionOverlay.classList.add('visible');
        if(window.GemdropMeta) window.GemdropMeta.selectCollectionTab('gems');
        this.startCollectionLighting();
      });

      $('collectionBack').addEventListener('click',()=>{
        collectionOverlay.classList.remove('visible');
        syncMusic();
      });

      collectionOverlay.addEventListener('pointermove',event=>{
        if(gemCollection.hidden) return;
        const rect=gemCollection.getBoundingClientRect();
        const cx=rect.left+rect.width/2;
        const cy=Math.max(rect.top,0)+Math.min(rect.height,window.innerHeight)/2;
        this.collectionPointerLightAngle=Math.atan2(event.clientY-cy,event.clientX-cx);
        this.collectionPointerLightUntil=performance.now()+900;
        this.startCollectionLighting();
      },{passive:true});

      collectionOverlay.addEventListener('pointerleave',()=>{
        this.collectionPointerLightUntil=0;
      });

      $('homeButton').addEventListener('click',()=>this.returnToMenu());
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

      $('resultMenuButton').addEventListener('click',()=>this.returnToMenu());

      $('powerTumble').addEventListener('click',()=>this.useTumble());
      $('powerCascade').addEventListener('click',()=>this.useCascade());
      $('powerPrism').addEventListener('click',()=>this.usePrism());

      const autoFireToggle=$('autoFireToggle');
      if(autoFireToggle){
        autoFireToggle.checked=this.autoFireEnabled;
        autoFireToggle.addEventListener('change',()=>{
          this.autoFireEnabled=!!autoFireToggle.checked;
          try{
            localStorage.setItem('gemdrop-autofire',this.autoFireEnabled?'1':'0');
          }catch{}
        });
      }

      ['gesturestart','gesturechange','gestureend'].forEach(type=>{
        document.addEventListener(type,event=>{
          if(event.cancelable) event.preventDefault();
        },{passive:false});
      });
      document.addEventListener('touchstart',event=>{
        if(event.touches&&event.touches.length>1&&event.cancelable) event.preventDefault();
      },{passive:false});
      document.addEventListener('touchmove',event=>{
        if(event.touches&&event.touches.length>1&&event.cancelable) event.preventDefault();
      },{passive:false});
      document.addEventListener('contextmenu',event=>event.preventDefault());
      document.addEventListener('dragstart',event=>event.preventDefault());
      document.addEventListener('selectstart',event=>event.preventDefault());
      document.addEventListener('copy',event=>event.preventDefault());
      document.addEventListener('cut',event=>event.preventDefault());

      document.addEventListener('visibilitychange',()=>{
        if(document.hidden){
          syncMusic({instant:true});
          if(this.running&&!this.paused) this.setPaused(true);
        }else{
          syncMusic({instant:false});
        }
      });

      window.addEventListener('keydown',e=>{
        if(e.code==='Space'){
          e.preventDefault();
          this.dropCurrent();
        }
        if(e.key==='Escape') this.setPaused(!this.paused);
      });

      const aimFromEvent=e=>{
        const track=this.aimStrip.querySelector('.aim-track');
        const rect=(track||this.aimStrip).getBoundingClientRect();

        // The control is intentionally more sensitive than the visible slider.
        // About 80% of the slider travel covers 100% of the drop rail, so the
        // player can comfortably reach both walls without dragging to the
        // extreme edge of the screen.
        const raw=clamp((e.clientX-rect.left)/Math.max(1,rect.width),0,1);
        const u=clamp(.5+(raw-.5)*AIM_CONTROL_GAIN,0,1);

        const t=tiers[this.currentTier];
        const min=WALL+t.r*COLLIDER_SCALE;
        const max=W-WALL-t.r*COLLIDER_SCALE;
        this.targetX=Phaser.Math.Linear(min,max,u);
        this.updateAimHandle();
      };

      this.aimStrip.addEventListener('pointerdown',e=>{
        if(!this.running||this.paused||this.metaPaused) return;
        unlockAudio();
        e.preventDefault();
        this.pointerHeld=true;
        aimFromEvent(e);
        if(this.autoFireEnabled) this.dropCurrent();
        try{this.aimStrip.setPointerCapture(e.pointerId)}catch{}
      });

      this.aimStrip.addEventListener('pointermove',e=>{
        if(!this.pointerHeld||!this.running||this.paused||this.metaPaused) return;
        e.preventDefault();
        aimFromEvent(e);
      });

      const finishAim=e=>{
        if(!this.pointerHeld||!this.running||this.paused) return;
        e.preventDefault();
        aimFromEvent(e);
        this.pointerHeld=false;
        if(!this.autoFireEnabled&&this.ready) this.dropCurrent();
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
      this.updateHomeProgress();

      if(notify){
        const t=tiers[tier];
        this.showStatus(t.name+' '+t.cut+' unlocked','reward',1500,'gem',tier);
      }

      return true;
    }

    drawCollectionGem(canvas,tier,locked,lightAngle=GEM_WORLD_LIGHT_ANGLE) {
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

      if(window.ReactiveGemSystem){
        const source=window.ReactiveGemSystem.renderPreviewCanvas(
          t.reactiveCut,
          t.color,
          0,
          256,
          t,
          lightAngle
        );
        const max=cavityRadius*1.78;
        const scale=Math.min(max/source.width,max/source.height);
        const gw=source.width*scale;
        const gh=source.height*scale;

        ctx.save();
        ctx.shadowColor=locked?'rgba(0,0,0,.72)':'rgba(0,0,0,.48)';
        ctx.shadowBlur=locked?10:7;
        ctx.shadowOffsetY=4;
        if(locked){
          ctx.filter='brightness(0) saturate(0)';
          ctx.globalAlpha=.88;
        }
        ctx.drawImage(source,cx-gw/2,cy-gh/2,gw,gh);
        ctx.restore();
      }
    }

    redrawCollectionLighting(lightAngle){
      if(!gemCollection||gemCollection.hidden) return;

      const canvases=gemCollection.querySelectorAll('.gem-card:not(.locked) canvas');
      for(const canvas of canvases){
        const card=canvas.closest('.gem-card');
        if(!card) continue;

        const rect=card.getBoundingClientRect();
        if(rect.bottom<0||rect.top>window.innerHeight) continue;

        const tier=Number(card.dataset.gemTier);
        if(!Number.isInteger(tier)||tier<0||tier>=tiers.length) continue;

        this.drawCollectionGem(canvas,tier,false,lightAngle);
      }
    }

    startCollectionLighting(){
      if(this.collectionLightRAF) return;

      const shortestAngleDelta=(from,to)=>{
        let delta=(to-from)%(Math.PI*2);
        if(delta>Math.PI) delta-=Math.PI*2;
        if(delta<-Math.PI) delta+=Math.PI*2;
        return delta;
      };

      const tick=time=>{
        if(!collectionOverlay.classList.contains('visible')){
          this.collectionLightRAF=0;
          return;
        }

        if(!gemCollection.hidden&&time-this.collectionLightLastFrame>=42){
          const pointerActive=
            Number.isFinite(this.collectionPointerLightAngle)&&
            performance.now()<this.collectionPointerLightUntil;

          const target=pointerActive
            ? this.collectionPointerLightAngle
            : GEM_WORLD_LIGHT_ANGLE+Math.sin(time*.00072)*.62;

          this.collectionLightAngle+=shortestAngleDelta(this.collectionLightAngle,target)*(pointerActive ? .24 : .08);
          this.redrawCollectionLighting(this.collectionLightAngle);
          this.collectionLightLastFrame=time;
        }

        this.collectionLightRAF=requestAnimationFrame(tick);
      };

      this.collectionLightRAF=requestAnimationFrame(tick);
    }

    renderCollection() {
      if(!gemCollection) return;

      gemCollection.innerHTML='';

      tiers.forEach((t,tier)=>{
        const unlocked=this.unlockedTiers.has(tier);
        const card=document.createElement('article');
        card.className='gem-card'+(unlocked?'':' locked');
        card.dataset.gemTier=String(tier);
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

          const count=document.createElement('span');
          count.className='gem-card__count';
          count.textContent='×'+(window.GemdropMeta?window.GemdropMeta.getGemCount(tier):0);

          const description=document.createElement('p');
          description.className='gem-card__description';
          description.textContent=t.description;

          meta.append(name,value,description);
          art.appendChild(count);
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
      if(window.GemdropMeta) window.GemdropMeta.updateGemBadges();
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

    spawnTierShift() {
      const best=Math.max(0,this.bestTierReached||0);
      if(best>=16) return 4;
      if(best>=13) return 3;
      if(best>=10) return 2;
      if(best>=7) return 1;
      return 0;
    }

    refillSpawnBag(shift=this.spawnTierShift()) {
      const counts=[5,4,3,2,1];
      const bag=[];
      counts.forEach((count,index)=>{
        const tier=Math.min(tiers.length-1,shift+index);
        for(let i=0;i<count;i++) bag.push(tier);
      });
      for(let i=bag.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [bag[i],bag[j]]=[bag[j],bag[i]];
      }
      this.spawnBag=bag;
      this.spawnBagShift=shift;
    }

    randomSpawnTier() {
      const shift=this.spawnTierShift();
      if(!Array.isArray(this.spawnBag)||!this.spawnBag.length||this.spawnBagShift!==shift){
        this.refillSpawnBag(shift);
      }

      let index=this.spawnBag.length-1;
      let tier=this.spawnBag[index];
      if(tier===this.lastSpawnTier&&(this.spawnRepeat||0)>=2){
        const alt=this.spawnBag.findIndex(value=>value!==tier);
        if(alt>=0){
          [this.spawnBag[alt],this.spawnBag[index]]=[this.spawnBag[index],this.spawnBag[alt]];
          tier=this.spawnBag[index];
        }
      }

      tier=this.spawnBag.pop();
      if(tier===this.lastSpawnTier) this.spawnRepeat=(this.spawnRepeat||0)+1;
      else{
        this.lastSpawnTier=tier;
        this.spawnRepeat=1;
      }
      return tier;
    }

    rollSpecialDrop() {
      this.specialGenerated=(this.specialGenerated||0)+1;
      if(this.specialGenerated<=8) return null;

      this.specialCountdown=Math.max(0,(this.specialCountdown||0)-1);
      if(this.specialCountdown>0) return null;

      this.specialCountdown=Phaser.Math.Between(14,22);
      const r=Math.random();
      if(r<.52) return 'scatter';
      if(r<.82) return 'fusion';
      return 'charge';
    }

    announceCurrentSpecial() {
      if(!this.currentSpecial) return;
      const special=SPECIAL_DROPS[this.currentSpecial];
      if(!special) return;
      this.showStatus(
        special.label.toUpperCase()+' GEM · '+special.hint,
        'reward',
        1250,
        'sparkles'
      );
    }

    startRun() {
      unlockAudio();
      syncMusic();
      this.clearRun();

      this.runStartUnlocked=new Set(this.unlockedTiers);
      this.runStartBest=this.best;
      this.runMerges=0;
      this.runBestChain=0;
      this.runChestGain=0;
      this.runGemGains=Array(tiers.length).fill(0);
      this.runTreasureClaims=[];
      this.runStartedAt=performance.now();
      this.runPausedTotal=0;
      this.runPauseStartedAt=0;

      this.score=0;
      this.bestTierReached=0;
      this.spawnBag=[];
      this.spawnBagShift=-1;
      this.lastSpawnTier=null;
      this.spawnRepeat=0;
      this.specialGenerated=0;
      this.specialCountdown=Phaser.Math.Between(5,8);
      this.currentSpecial=null;
      this.nextSpecial=null;
      this.runDrops=0;

      this.currentTier=this.randomSpawnTier();
      this.currentSpecial=this.rollSpecialDrop();
      this.nextTier=this.randomSpawnTier();
      this.nextSpecial=this.rollSpecialDrop();
      this.unlockTier(this.currentTier,false);
      this.unlockTier(this.nextTier,false);
      this.ready=true;
      this.running=true;
      this.paused=false;
      this.metaPaused=false;
      this.pointerHeld=false;
      this.targetX=W/2;
      this.lastDropAt=0;
      this.dropGateGem=null;
      this.dangerTime=0;
      this.mergeWindow=0;
      this.mergeChain=0;
      this.discoveredCuts=new Set(this.unlockedTiers);
      this.powerCharge={...POWER_START_CHARGE};

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

      this.destroyPreview();

      this.time.removeAllEvents();
    }

    destroyPreview() {
      if(!this.preview) return;
      if(this.preview.specialHalo&&this.preview.specialHalo.active){
        this.preview.specialHalo.destroy();
      }
      this.preview.specialHalo=null;
      this.preview.destroy();
      this.preview=null;
    }

    createSpecialHalo(gameObject,specialType,tier,preview=false) {
      const special=SPECIAL_DROPS[specialType];
      const t=tiers[tier];
      if(!gameObject||!special||!t) return;

      const halo=this.add.circle(
        gameObject.x,
        gameObject.y,
        t.r*(preview?1.08:1.06),
        special.color,
        .025
      )
        .setStrokeStyle(preview?4:3,special.color,.82)
        .setDepth((gameObject.depth||10)+(preview?.12:.08))
        .setBlendMode(Phaser.BlendModes.ADD);

      if(this.gemMask) halo.setMask(this.gemMask);
      gameObject.specialHalo=halo;
      gameObject.specialPulseOffset=Math.random()*Math.PI*2;
    }

    syncSpecialHalo(gameObject,time) {
      if(!gameObject||!gameObject.active||!gameObject.specialHalo||!gameObject.specialHalo.active) return;
      const p=(time*.0055)+(gameObject.specialPulseOffset||0);
      gameObject.specialHalo.x=gameObject.x;
      gameObject.specialHalo.y=gameObject.y;
      gameObject.specialHalo.setScale(1+Math.sin(p)*.035);
      gameObject.specialHalo.setAlpha(.72+Math.sin(p)*.12);
    }

    createDropPreview(animate=false) {
      if(!this.running||this.paused||this.metaPaused||!this.ready) return;
      this.destroyPreview();

      const t=tiers[this.currentTier];
      const min=WALL+t.r*COLLIDER_SCALE;
      const max=W-WALL-t.r*COLLIDER_SCALE;
      const x=clamp(this.targetX,min,max);

      this.preview=this.add.image(x,DROP_Y,gemTextureKey(this.currentTier)).setDepth(32);
      this.preview.tier=this.currentTier;
      this.sizeGemSprite(this.preview,this.currentTier);
      this.applyGemLighting(this.preview,this.currentTier);
      this.preview.setAlpha(1);
      this.preview.specialType=this.currentSpecial||null;
      if(this.gemMask) this.preview.setMask(this.gemMask);
      if(this.preview.specialType){
        this.createSpecialHalo(this.preview,this.preview.specialType,this.currentTier,true);
      }

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

    createGem(x,y,tier,specialType=null) {
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

      const bodyOptions={
        restitution:.006,
        friction:.032,
        frictionStatic:.022,
        frictionAir:.0028,
        density:.0012,
        sleepThreshold:0,
        slop:.018
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

      gem.setBounce(.006);
      gem.setFriction(.032,.0028,.022);
      gem.setDensity(.0012);
      gem.setSleepThreshold(0);

      // Real gems are never released with mathematically perfect balance.
      let releaseAngle=Phaser.Math.FloatBetween(-7.5,7.5);
      if(Math.abs(releaseAngle)<1.6) releaseAngle=releaseAngle<0?-1.6:1.6;
      gem.setAngle(releaseAngle);
      gem.setAngularVelocity(Phaser.Math.FloatBetween(-.006,.006));

      gem.isGem=true;
      gem.tier=tier;
      gem.specialType=specialType||null;
      gem.specialTriggered=false;
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
      if(gem.specialType){
        this.createSpecialHalo(gem,gem.specialType,tier,false);
      }
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

      if(gem.specialHalo&&gem.specialHalo.active) gem.specialHalo.destroy();
      gem.specialHalo=null;

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
      if(!this.running||this.paused||this.metaPaused||!this.ready) return;
      if(this.time.now-this.lastDropAt<DROP_DELAY) return;

      const t=tiers[this.currentTier];
      const min=WALL+t.r*COLLIDER_SCALE;
      const max=W-WALL-t.r*COLLIDER_SCALE;
      const x=clamp(this.preview?this.preview.x:this.targetX,min,max);

      this.destroyPreview();

      const gem=this.createGem(x,DROP_Y,this.currentTier,this.currentSpecial);
      gem.setVelocity(0,.15);

      this.lastDropAt=this.time.now;
      this.ready=false;
      this.dropGateGem=gem;
      this.runDrops++;

      tone(180,.04,.015,'triangle');
      haptic(5);

      this.currentTier=this.nextTier;
      this.currentSpecial=this.nextSpecial;
      this.nextTier=this.randomSpawnTier();
      this.nextSpecial=this.rollSpecialDrop();
      this.unlockTier(this.currentTier,false);
      this.unlockTier(this.nextTier,false);

      this.updateNextPreview();
      this.announceCurrentSpecial();
      this.updateAimHandle();
      this.updatePowerButtons();
    }

    activateSpecialGem(gem,target=null) {
      if(!gem||!gem.active||!gem.specialType||gem.specialTriggered) return;
      if(gem.specialType==='fusion'&&(!target||!target.active||target.specialType)) return;

      gem.specialTriggered=true;
      this.time.delayedCall(0,()=>{
        if(!gem||!gem.active) return;

        const type=gem.specialType;
        const x=gem.x;
        const y=gem.y;

        if(type==='scatter'){
          if(this.dropGateGem===gem) this.dropGateGem=null;
          this.removeGem(gem);

          const M=Phaser.Physics.Matter.Matter;
          for(const other of this.gems){
            if(!other||!other.active||!other.body) continue;
            M.Sleeping.set(other.body,false);

            const dx=other.x-x;
            const dy=other.y-y;
            const distance=Math.max(42,Math.hypot(dx,dy));
            const nx=dx/distance;
            const ny=dy/distance;
            const falloff=1-clamp(distance/760,0,.72);
            const force=2.3+falloff*2.4;

            M.Body.setVelocity(other.body,{
              x:clamp(other.body.velocity.x+nx*force+Phaser.Math.FloatBetween(-1.65,1.65),-10.5,10.5),
              y:clamp(other.body.velocity.y+ny*force+Phaser.Math.FloatBetween(-1.4,1.15),-8.2,8.2)
            });
            M.Body.setAngularVelocity(
              other.body,
              clamp(other.body.angularVelocity+Phaser.Math.FloatBetween(-.13,.13),-.23,.23)
            );
          }

          this.mergeBurst(x,y,tiers[Math.min(6,tiers.length-1)],true);
          this.cameras.main.shake(420,.0105);
          this.showStatus('SCATTER GEM!','reward',1100,'sparkles');
          tone(230,.14,.03,'triangle');
          haptic([12,18,12,24]);
          return;
        }

        if(type==='charge'){
          if(this.dropGateGem===gem) this.dropGateGem=null;
          this.removeGem(gem);

          for(const key of Object.keys(this.powerCharge)){
            this.powerCharge[key]=clamp((this.powerCharge[key]||0)+.28,0,1);
          }

          this.mergeBurst(x,y,tiers[4],true);
          this.updatePowerButtons();
          this.showStatus('CHARGE GEM +28%','reward',1150,'zap');
          tone(640,.13,.03,'sine');
          haptic([8,12,8]);
          return;
        }

        if(type==='fusion'){
          if(!target||!target.active||target.specialType){
            gem.specialTriggered=false;
            return;
          }

          const tier=target.tier;
          const next=Math.min(tier+1,tiers.length-1);
          const vx=target.body?target.body.velocity.x*.45:0;
          const vy=target.body?target.body.velocity.y*.30:0;
          const tx=target.x;
          const ty=target.y;

          if(this.dropGateGem===gem) this.dropGateGem=null;
          this.removeGem(gem);

          if(next===tier){
            this.addScore(Math.max(1,Math.round(tiers[tier].score*.5)));
            this.mergeBurst(tx,ty,tiers[tier],true);
            this.showStatus('FUSION GEM!','reward',1100,'sparkles');
            return;
          }

          this.removeGem(target);
          const upgraded=this.createGem(tx,ty,next);
          upgraded.setVelocity(vx,vy);

          this.bestTierReached=Math.max(this.bestTierReached,next);
          this.addScore(Math.max(1,Math.round(tiers[next].score*.75)));
          this.mergeBurst(tx,ty,tiers[next],next>=6);

          if(!this.unlockedTiers.has(next)) this.unlockTier(next,true);

          this.showStatus('FUSION GEM · '+tiers[next].name.toUpperCase(),'reward',1250,'sparkles');
          tone(720,.14,.032,'sine');
          haptic([9,16,9]);
        }
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
          if(a.specialType||b.specialType){
            if(a.specialType) this.activateSpecialGem(a,b);
            if(b.specialType) this.activateSpecialGem(b,a);
            continue;
          }

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

        if(gem.specialType&&gem.specialType!=='fusion'){
          this.activateSpecialGem(gem,null);
          continue;
        }

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
      if(a.specialType||b.specialType) return;
      if(a.tier!==b.tier||a.merging||b.merging) return;

      a.merging=true;
      b.merging=true;
      this.pendingMerges.push([a,b]);
    }

    scanForRestingMatches() {
      for(let i=0;i<this.gems.length;i++){
        const a=this.gems[i];
        if(!a||!a.active||a.merging||a.specialType||!a.body) continue;

        for(let j=i+1;j<this.gems.length;j++){
          const b=this.gems[j];
          if(!b||!b.active||b.merging||b.specialType||!b.body||a.tier!==b.tier) continue;

          const A=a.body.bounds;
          const B=b.body.bounds;
          const gapX=Math.max(0,Math.max(A.min.x-B.max.x,B.min.x-A.max.x));
          const gapY=Math.max(0,Math.max(A.min.y-B.max.y,B.min.y-A.max.y));

          if(gapX>2.5||gapY>2.5) continue;

          const distance=Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y);
          const maxDistance=(tiers[a.tier].r*COLLIDER_SCALE)*2.12;

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

        const chargedPowerups=this.rechargePowers(tier);

        this.mergeChain=this.mergeWindow>0?this.mergeChain+1:1;
        this.mergeWindow=.70;
        this.runMerges++;
        this.runBestChain=Math.max(this.runBestChain,this.mergeChain);
        if(Number.isInteger(tier)&&tier>=0&&tier<this.runGemGains.length){
          this.runGemGains[tier]++;
        }

        if(next>=tiers.length){
          const masterValue=tiers[tier].score*2;
          this.addScore(masterValue);
          this.mergeBurst(x,y,tiers[tier],true);
          this.floatText(x,y-8,'MASTER CUT +$'+masterValue,'#ffe0a0',28,{big:true});
          this.emitMergeRewardTrails(x,y,masterValue,chargedPowerups,this.mergeChain,true);
          this.showStatus('MASTER CUT +$'+masterValue,'reward',1450,'gem',tier);
          this.cameras.main.shake(100,.0038);
          tone(760,.15,.042,'sine');
          haptic([14,17,22]);
          if(window.GemdropMeta){
            const progress=window.GemdropMeta.onMerge(tier,this.mergeChain,{master:true,resultTier:tier});
            if(progress) this.runChestGain+=Number(progress.chestGain)||0;
          }
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

        this.floatText(
          x,
          y-8,
          label,
          this.mergeChain>=2?'#ffd86f':'#ffe7c5',
          this.mergeChain>=2?25:19,
          {big:this.mergeChain>=2}
        );
        this.emitMergeRewardTrails(
          x,
          y,
          tiers[next].score,
          chargedPowerups,
          this.mergeChain,
          next>=6
        );

        if(window.GemdropMeta){
          const progress=window.GemdropMeta.onMerge(tier,this.mergeChain,{resultTier:next});
          if(progress) this.runChestGain+=Number(progress.chestGain)||0;
        }

        if(next===tiers.length-1){
          this.showStatus('CROWNSTONE FORGED','reward',2400,'gem',next);
          this.cameras.main.flash(420,255,218,96,false);
          tone(920,.16,.045,'sine');
          window.setTimeout(()=>tone(1180,.18,.035,'sine'),95);
          haptic([18,35,18,55]);
        }

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

    floatText(x,y,text,color,size,opts={}) {
      const big=!!opts.big||text.includes('× CHAIN')||text.startsWith('MASTER CUT');
      const fontSize=Math.max(big?24:18,size||18);

      const burst=this.add.circle(x,y,10,0xffffff,.16)
        .setDepth(45)
        .setScale(.25)
        .setBlendMode(Phaser.BlendModes.ADD);

      const glow=this.add.text(x,y,text,{
        fontFamily:'Manrope, sans-serif',
        fontSize:fontSize+'px',
        fontStyle:'800',
        color:color,
        stroke:color,
        strokeThickness:big?9:7
      })
        .setOrigin(.5)
        .setDepth(46)
        .setAlpha(.20)
        .setScale(.48)
        .setBlendMode(Phaser.BlendModes.ADD);

      const label=this.add.text(x,y,text,{
        fontFamily:'Manrope, sans-serif',
        fontSize:fontSize+'px',
        fontStyle:'800',
        color:color,
        stroke:'#23072f',
        strokeThickness:big?5:4,
        shadow:{
          offsetX:0,
          offsetY:5,
          color:'rgba(0,0,0,.48)',
          blur:10,
          stroke:true,
          fill:true
        }
      })
        .setOrigin(.5)
        .setDepth(48)
        .setAlpha(0)
        .setScale(.48)
        .setAngle(Phaser.Math.FloatBetween(-2.4,2.4));

      this.tweens.add({
        targets:burst,
        scale:big?5.2:4,
        alpha:0,
        duration:300,
        ease:'Quad.Out',
        onComplete:()=>burst.destroy()
      });

      this.tweens.add({
        targets:glow,
        alpha:{from:.24,to:0},
        scale:big?1.34:1.20,
        y:y-18,
        duration:390,
        ease:'Quad.Out',
        onComplete:()=>glow.destroy()
      });

      this.tweens.add({
        targets:label,
        alpha:1,
        scaleX:big?1.18:1.10,
        scaleY:big?.86:.92,
        y:y-11,
        angle:0,
        duration:135,
        ease:'Back.Out',
        onComplete:()=>{
          this.tweens.add({
            targets:label,
            scaleX:1,
            scaleY:1,
            y:y-(big?58:46),
            alpha:0,
            duration:big?820:700,
            delay:big?90:65,
            ease:'Cubic.Out',
            onComplete:()=>label.destroy()
          });
        }
      });
    }

    scenePointToViewport(x,y) {
      const canvas=this.game&&this.game.canvas;
      if(!canvas) return null;

      const rect=canvas.getBoundingClientRect();
      if(!rect.width||!rect.height) return null;

      return {
        x:rect.left+(x/W)*rect.width,
        y:rect.top+(y/H)*rect.height
      };
    }

    pulseRewardTarget(element) {
      if(!element) return;
      element.classList.remove('reward-target-hit');
      void element.offsetWidth;
      element.classList.add('reward-target-hit');
      window.setTimeout(()=>element.classList.remove('reward-target-hit'),420);
    }

    emitHudTrail(source,target,color,count=4,delay=0) {
      if(!source||!target||!document.body) return;

      const rect=target.getBoundingClientRect();
      if(!rect.width&&!rect.height) return;

      const tx=rect.left+rect.width/2;
      const ty=rect.top+rect.height/2;
      let arrivals=0;

      for(let i=0;i<count;i++){
        const particle=document.createElement('span');
        particle.className='reward-fly-particle';
        particle.style.setProperty('--reward-particle-color',color);
        particle.style.left=source.x+'px';
        particle.style.top=source.y+'px';
        document.body.appendChild(particle);

        const jitterX=Phaser.Math.FloatBetween(-15,15);
        const jitterY=Phaser.Math.FloatBetween(-10,10);
        const dx=tx-source.x;
        const dy=ty-source.y;
        const arcX=dx*.46+Phaser.Math.FloatBetween(-36,36);
        const arcY=dy*.40-Phaser.Math.FloatBetween(28,70);
        const duration=Phaser.Math.Between(440,620);
        const particleDelay=delay+i*24+Phaser.Math.Between(0,38);

        const animation=particle.animate([
          {
            transform:'translate3d('+jitterX+'px,'+jitterY+'px,0) rotate(45deg) scale(.55)',
            opacity:0
          },
          {
            transform:'translate3d('+(jitterX*.7)+'px,'+(jitterY-8)+'px,0) rotate(95deg) scale(1.15)',
            opacity:1,
            offset:.14
          },
          {
            transform:'translate3d('+arcX+'px,'+arcY+'px,0) rotate(210deg) scale(.92)',
            opacity:.95,
            offset:.58
          },
          {
            transform:'translate3d('+dx+'px,'+dy+'px,0) rotate(360deg) scale(.30)',
            opacity:.12
          }
        ],{
          duration,
          delay:particleDelay,
          easing:'cubic-bezier(.18,.72,.22,1)',
          fill:'forwards'
        });

        animation.onfinish=()=>{
          particle.remove();
          arrivals++;
          if(arrivals===Math.max(1,Math.ceil(count*.55))){
            this.pulseRewardTarget(target);
          }
        };
      }
    }

    emitMergeRewardTrails(x,y,reward,chargedPowerups=[],chain=1,big=false) {
      const source=this.scenePointToViewport(x,y);
      if(!source) return;

      const scoreCount=Math.min(10,5+(chain>=2?2:0)+(big?2:0));
      this.emitHudTrail(source,scoreEl,'#FFD86F',scoreCount,70);

      const targets={
        tumble:{el:$('powerTumble'),color:'#FFB255'},
        cascade:{el:$('powerCascade'),color:'#DB7CFF'},
        prism:{el:$('powerPrism'),color:'#72DFFF'}
      };

      chargedPowerups.forEach((key,index)=>{
        const target=targets[key];
        if(!target||!target.el) return;
        this.emitHudTrail(source,target.el,target.color,big?4:3,105+index*34);
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
      statusHud.className='status-hud';
      void statusHud.offsetWidth;
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

    rechargePowers(mergeTier=0) {
      const tierBonus=1+Math.min(.35,Math.max(0,mergeTier)*.035);
      const charged=[];

      for(const key of Object.keys(POWER_CHARGE_PER_MERGE)){
        const before=clamp(this.powerCharge[key]??0,0,1);
        const after=clamp(
          before+POWER_CHARGE_PER_MERGE[key]*tierBonus,
          0,
          1
        );

        this.powerCharge[key]=after;
        if(after>before+.0005) charged.push(key);
      }

      this.updatePowerButtons();
      return charged;
    }

    updatePowerButtons() {
      const active=this.running&&!this.paused&&!this.metaPaused;
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
      buttons.prism.disabled=!active||(this.powerCharge.prism??0)<.999||!this.ready||!!this.currentSpecial||this.currentTier>=tiers.length-1;
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
        duration:1950,
        nextKick:this.time.now,
        kick:0
      };

      const shell=document.querySelector('.play-shell');
      if(shell){
        shell.classList.remove('tumbling');
        void shell.offsetWidth;
        shell.classList.add('tumbling');
        window.setTimeout(()=>shell.classList.remove('tumbling'),2050);
      }

      const M=Phaser.Physics.Matter.Matter;
      for(const gem of this.gems){
        if(!gem||!gem.active||!gem.body) continue;
        M.Sleeping.set(gem.body,false);
        M.Body.setVelocity(gem.body,{
          x:clamp(
            gem.body.velocity.x+Phaser.Math.FloatBetween(-4.2,4.2),
            -9.5,
            9.5
          ),
          y:clamp(
            gem.body.velocity.y+Phaser.Math.FloatBetween(-3.4,1.0),
            -7.4,
            7.2
          )
        });
        M.Body.setAngularVelocity(
          gem.body,
          clamp(
            gem.body.angularVelocity+Phaser.Math.FloatBetween(-.14,.14),
            -.21,
            .21
          )
        );
      }

      this.cameras.main.shake(1850,.0135);
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
      const wave=Math.sin(p*Math.PI*18);

      engine.gravity.x=wave*2.15*envelope;
      engine.gravity.y=this.baseGravityY-
        Math.max(0,Math.sin(p*Math.PI*12))*2.15*envelope;

      if(time>=state.nextKick){
        state.nextKick=time+70;
        state.kick=(state.kick||0)+1;
        const M=Phaser.Physics.Matter.Matter;
        const direction=state.kick%2?1:-1;

        for(const gem of this.gems){
          if(!gem||!gem.active||!gem.body) continue;
          M.Sleeping.set(gem.body,false);

          const horizontal=
            direction*Phaser.Math.FloatBetween(1.2,2.55)*envelope+
            Phaser.Math.FloatBetween(-1.05,1.05);

          const vertical=
            Phaser.Math.FloatBetween(-1.75,.65)*envelope;

          M.Body.setVelocity(gem.body,{
            x:clamp(gem.body.velocity.x+horizontal,-10.0,10.0),
            y:clamp(gem.body.velocity.y+vertical,-7.8,7.8)
          });

          M.Body.setAngularVelocity(
            gem.body,
            clamp(
              gem.body.angularVelocity+
              Phaser.Math.FloatBetween(-.075,.075),
              -.22,
              .22
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
        this.showStatus('NO MATCHES TO MERGE','info',900,'circle-slash-2');
        this.updatePowerButtons();
        return;
      }

      this.powerCharge.cascade=0;

      for(const pair of pairs){
        this.queueMerge(pair[0],pair[1]);
      }

      this.showStatus('MERGE ×'+pairs.length,'reward',1050,'sparkles');
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
        !!this.currentSpecial||
        this.currentTier>=tiers.length-1
      ) return;

      this.powerCharge.prism=0;
      this.currentTier=Math.min(this.currentTier+1,tiers.length-1);
      this.unlockTier(this.currentTier,true);

      if(this.preview){
        const x=this.preview.x;
        this.destroyPreview();
        this.createDropPreview(false);
        if(this.preview) this.preview.x=x;
      }

      this.updateAimHandle();
      this.showStatus('UPGRADE!','reward',1100,'gem',this.currentTier);
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

    syncRunClockPause() {
      if(!this.runStartedAt) return;
      const shouldPause=this.running&&(this.paused||this.metaPaused);

      if(shouldPause&&!this.runPauseStartedAt){
        this.runPauseStartedAt=performance.now();
      }else if(!shouldPause&&this.runPauseStartedAt){
        this.runPausedTotal+=performance.now()-this.runPauseStartedAt;
        this.runPauseStartedAt=0;
      }
    }

    runElapsedMs() {
      if(!this.runStartedAt) return 0;
      const now=performance.now();
      const currentPause=this.runPauseStartedAt
        ? now-this.runPauseStartedAt
        : 0;
      return Math.max(0,now-this.runStartedAt-this.runPausedTotal-currentPause);
    }

    formatRunTime(ms) {
      const total=Math.max(0,Math.floor(ms/1000));
      const minutes=Math.floor(total/60);
      const seconds=total%60;
      return minutes+':'+String(seconds).padStart(2,'0');
    }

    returnToMenu() {
      this.running=false;
      this.ready=false;
      this.paused=false;
      this.metaPaused=false;
      this.pointerHeld=false;
      this.clearRun();
      this.clearStatus();
      this.matter.world.pause();
      pauseOverlay.classList.remove('visible');
      gameOverOverlay.classList.remove('visible');
      collectionOverlay.classList.remove('visible');
      startOverlay.classList.add('visible');
      syncMusic();
      this.updatePowerButtons();
    }

    setPaused(value) {
      if(!this.running) return;

      this.paused=value;
      this.syncRunClockPause();
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
      }else if(!this.metaPaused){
        this.matter.world.resume();
        this.tweens.resumeAll();
      }
    }

    setMetaPaused(value) {
      if(!this.running) return;
      this.metaPaused=!!value;
      this.syncRunClockPause();
      this.updatePowerButtons();
      if(this.metaPaused){
        this.matter.world.pause();
        this.tweens.pauseAll();
      }else if(!this.paused){
        this.matter.world.resume();
        this.tweens.resumeAll();
      }
    }

    noteTreasureClaim(treasureId){
      if(treasureId) this.runTreasureClaims.push(treasureId);
    }

    updateHomeProgress(){
      if(!homeCrownProgressText||!homeCrownProgressFill) return;
      const highest=this.unlockedTiers&&this.unlockedTiers.size
        ? Math.max(...this.unlockedTiers)
        : 0;
      const last=tiers.length-1;
      const progress=last>0?clamp(highest/last,0,1):1;
      homeCrownProgressFill.style.width=(progress*100).toFixed(1)+'%';
      homeCrownProgressText.textContent=highest>=last
        ? 'Crownstone discovered'
        : tiers[highest].name+' · '+(highest+1)+' / '+tiers.length;
    }

    renderRunSummary() {
      const mergesEl=$('runMerges');
      const chainEl=$('runBestChain');
      const timeEl=$('runTime');
      const totalEl=$('runGemTotal');
      const haul=$('runGemHaul');
      const treasureTotal=$('runTreasureTotal');
      const treasureHaul=$('runTreasureHaul');

      if(mergesEl) mergesEl.textContent=String(this.runMerges);
      if(chainEl) chainEl.textContent=Math.max(1,this.runBestChain)+'×';
      if(timeEl) timeEl.textContent=this.formatRunTime(this.runElapsedMs());

      const totalGems=this.runGemGains.reduce((sum,count)=>sum+count,0);
      const earned=this.runGemGains
        .map((count,tier)=>({count,tier}))
        .filter(item=>item.count>0)
        .sort((a,b)=>b.tier-a.tier);

      if(totalEl) totalEl.textContent=String(totalGems);

      if(haul){
        haul.innerHTML='';

        if(!earned.length){
          const empty=document.createElement('span');
          empty.className='run-gem-haul__empty';
          empty.textContent='No gems earned this run';
          haul.appendChild(empty);
        }else{
          earned.forEach(item=>{
            const t=tiers[item.tier];
            const chip=document.createElement('div');
            chip.className='run-gem-chip';

            const canvas=document.createElement('canvas');
            canvas.width=72;
            canvas.height=72;
            canvas.setAttribute('aria-hidden','true');

            if(window.ReactiveGemSystem){
              try{
                const source=window.ReactiveGemSystem.renderPreviewCanvas(
                  t.reactiveCut,t.color,0,96,t,GEM_WORLD_LIGHT_ANGLE
                );
                const ctx=canvas.getContext('2d');
                const scale=Math.min(62/source.width,62/source.height);
                const w=source.width*scale;
                const h=source.height*scale;
                ctx.drawImage(source,(72-w)/2,(72-h)/2,w,h);
              }catch{}
            }

            const copy=document.createElement('div');
            copy.innerHTML='<strong>'+t.name+'</strong><span>+'+item.count+'</span>';
            chip.append(canvas,copy);
            haul.appendChild(chip);
          });
        }
      }

      if(treasureTotal) treasureTotal.textContent=String(this.runTreasureClaims.length);

      if(treasureHaul){
        treasureHaul.innerHTML='';

        if(!this.runTreasureClaims.length){
          const empty=document.createElement('span');
          empty.className='run-treasure-haul__empty';
          empty.textContent='No treasures earned this run';
          treasureHaul.appendChild(empty);
        }else{
          this.runTreasureClaims.forEach(id=>{
            const info=window.GemdropMeta&&window.GemdropMeta.getTreasureInfo
              ? window.GemdropMeta.getTreasureInfo(id)
              : null;

            const chip=document.createElement('div');
            chip.className='run-treasure-chip';

            if(info&&info.art){
              const image=document.createElement('img');
              image.src=info.art;
              image.alt='';
              image.setAttribute('aria-hidden','true');
              chip.appendChild(image);
            }

            const copy=document.createElement('div');
            const name=info&&info.name
              ? info.name
              : String(id||'Treasure').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
            copy.innerHTML='<strong>'+name+'</strong>';
            chip.appendChild(copy);
            treasureHaul.appendChild(chip);
          });
        }
      }
    }

    endGame() {
      if(!this.running) return;

      const finalRunTime=this.runElapsedMs();
      this.running=false;
      this.ready=false;
      this.metaPaused=false;
      this.pointerHeld=false;
      this.tumbleState=null;
      this.matter.world.engine.gravity.x=0;
      this.matter.world.engine.gravity.y=this.baseGravityY;
      this.updatePowerButtons();
      this.matter.world.pause();

      finalScoreEl.textContent='$'+fmt(this.score);

      const finest=tiers[this.bestTierReached];
      bestMergeEl.textContent=finest.name;

      if(window.GemdropMeta&&window.GemdropMeta.recordRun){
        window.GemdropMeta.recordRun({
          score:this.score,
          merges:this.runMerges,
          bestChain:this.runBestChain,
          bestTier:this.bestTierReached
        });
      }

      // Freeze the run clock at the exact active-play duration.
      this.runStartedAt=performance.now()-finalRunTime;
      this.runPausedTotal=0;
      this.runPauseStartedAt=performance.now();
      this.renderRunSummary();
      this.updateHomeProgress();

      gameOverOverlay.classList.add('visible');
      syncMusic();
      if(window.lucide) window.lucide.createIcons({attrs:{'stroke-width':1.9}});
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

      if(this.nextSpecial&&SPECIAL_DROPS[this.nextSpecial]){
        const special=SPECIAL_DROPS[this.nextSpecial];
        const cx=nextPreview.width/2;
        const cy=nextPreview.height/2;
        const radius=Math.min(w,h)*.47;
        c.save();
        c.strokeStyle=special.css;
        c.lineWidth=7;
        c.globalAlpha=.92;
        c.shadowColor=special.css;
        c.shadowBlur=12;
        c.beginPath();
        c.arc(cx,cy,radius,0,Math.PI*2);
        c.stroke();
        c.restore();
      }
    }

    update(time,delta) {
      const dt=Math.min(delta,34)/1000;
      this.animateGemLights(time);
      if(!this.paused&&!this.metaPaused) this.updateTumble(time);

      if(this.running&&!this.paused&&!this.metaPaused&&!this.ready&&!this.dropGateGem&&time-this.lastDropAt>=DROP_DELAY){
        this.ready=true;
        this.createDropPreview(true);
      }

      if(this.running&&!this.paused&&!this.metaPaused&&!this.ready&&this.dropGateGem){
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

      if(
        this.autoFireEnabled&&
        this.pointerHeld&&
        this.running&&
        !this.paused&&
        !this.metaPaused&&
        this.ready&&
        time-this.lastDropAt>=AUTO_FIRE_DELAY
      ){
        this.dropCurrent();
      }

      if(this.running&&!this.paused&&!this.metaPaused){
        this.scanForRestingMatches();
        this.processMerges();

        this.mergeWindow=Math.max(0,this.mergeWindow-dt);
        if(this.mergeWindow<=0) this.mergeChain=0;

        if(this.preview){
          this.syncSpecialHalo(this.preview,time);
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
          this.syncSpecialHalo(gem,time);

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

      if(!this.running||this.paused) return;

      const x=this.preview&&this.preview.active
        ? this.preview.x
        : clamp(this.targetX,WALL+28,W-WALL-28);
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
    scale:{
      mode:Phaser.Scale.FIT,
      autoCenter:Phaser.Scale.CENTER_BOTH,
      width:W*RENDER_SCALE,
      height:H*RENDER_SCALE
    },
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
