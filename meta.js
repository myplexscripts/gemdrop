(() => {
  'use strict';

  const STORAGE_KEY='gemdrop-meta-v1';
  const CHEST_TARGET=120;

  const GEMS=[
    {name:'Quartz',description:'A pale crystal that catches even the faintest light.',score:1,color:'#D7EBF2',accent:'#EDF6F9',dark:'#859296',cut:'rectangular'},
    {name:'Citrine',description:'A warm golden gem with the glow of bottled sunlight.',score:3,color:'#E9B11E',accent:'#F5DC9A',dark:'#906E13',cut:'circular_starcut'},
    {name:'Sunstone',description:'A fiery stone that seems to hold a spark of dawn.',score:6,color:'#E67A45',accent:'#F4C3AB',dark:'#8F4C2B',cut:'emerald_stepcut'},
    {name:'Amethyst',description:'Deep violet crystal with a calm, royal glow.',score:10,color:'#A968E5',accent:'#D8BBF3',dark:'#69408E',cut:'rectangular_brilliant'},
    {name:'Peridot',description:'Fresh green brilliance made for bold beginnings.',score:15,color:'#99D64D',accent:'#D1EDAF',dark:'#5F8530',cut:'heart'},
    {name:'Garnet',description:'A dark red jewel with the warmth of banked embers.',score:22,color:'#B33149',accent:'#DDA2AD',dark:'#6F1E2D',cut:'tanzanite'},
    {name:'Topaz',description:'Honey-gold facets that flash with quiet richness.',score:30,color:'#D7902F',accent:'#EDCDA1',dark:'#85591D',cut:'rectangular'},
    {name:'Moonstone',description:'Milky light drifts across it like a moonlit tide.',score:40,color:'#B9C9F2',accent:'#E0E7F9',dark:'#737D96',cut:'circular_starcut'},
    {name:'Zircon',description:'Clear blue fire with a sharp, electric sparkle.',score:52,color:'#42C7E8',accent:'#AAE6F5',dark:'#297B90',cut:'emerald_stepcut'},
    {name:'Morganite',description:'A blush-pink jewel with a soft romantic glow.',score:66,color:'#F5B3C8',accent:'#FADDE6',dark:'#986F7C',cut:'rectangular_brilliant'},
    {name:'Aquamarine',description:'Sea-green clarity that feels cool even in the hand.',score:82,color:'#63E3C4',accent:'#B9F2E4',dark:'#3D8D7A',cut:'heart'},
    {name:'Tourmaline',description:'Vivid violet colour with a restless inner shimmer.',score:100,color:'#C447B6',accent:'#E4ACDE',dark:'#7A2C71',cut:'tanzanite'},
    {name:'Tanzanite',description:'Rare blue-violet fire drawn from the edge of night.',score:122,color:'#4F54D9',accent:'#B0B2EE',dark:'#313487',cut:'rectangular'},
    {name:'Spinel',description:'A brilliant pink-red jewel with a lively inner spark.',score:148,color:'#FF4F87',accent:'#FFB0C9',dark:'#9E3154',cut:'circular_starcut'},
    {name:'Sapphire',description:'Royal blue depth with a crisp, unwavering shine.',score:178,color:'#2D63D6',accent:'#A0B9ED',dark:'#1C3D85',cut:'emerald_stepcut'},
    {name:'Emerald',description:'Lush green brilliance worthy of the finest vault.',score:212,color:'#18B56A',accent:'#97DEBC',dark:'#0F7042',cut:'rectangular_brilliant'},
    {name:'Ruby',description:'A fierce red jewel that burns like captured flame.',score:250,color:'#E12F4F',accent:'#F2A1B0',dark:'#8C1D31',cut:'heart'},
    {name:'Alexandrite',description:'A mysterious gem whose colour never seems quite still.',score:292,color:'#47B38E',accent:'#ACDDCC',dark:'#2C6F58',cut:'tanzanite'},
    {name:'Starstone',description:'An uncanny violet jewel lit by a star-like glow.',score:340,color:'#9B6BFF',accent:'#D2BCFF',dark:'#60429E',cut:'rectangular'},
    {name:'Crownstone',description:'The vault’s legendary prize, blazing with golden light.',score:400,color:'#FFD24A',accent:'#FFEBAE',dark:'#9E822E',cut:'circular_starcut'}
  ];

  const TREASURES=[
    {id:'silver-ring',name:'Silver Ring',description:'An engraved silver ring waiting for its first jewel.',type:'ring',rarity:'Common',base:90,weight:28,minTier:0,minMerges:0,sockets:[
      {x:160,y:61,cut:'circular_starcut',width:51,height:53.5}
    ]},
    {id:'sun-brooch',name:'Sunburst Brooch',description:'A radiant brooch made to wear its gems like rays of light.',type:'brooch',rarity:'Common',base:125,weight:24,minTier:1,minMerges:8,sockets:[
      {x:126,y:128,cut:'heart',width:48.5,height:48.5},
      {x:193.5,y:125.5,cut:'circular_starcut',width:43,height:43}
    ]},
    {id:'heart-pendant',name:'Heart Pendant',description:'An ornate keepsake made for a pair of treasured stones.',type:'pendant',rarity:'Common',base:145,weight:20,minTier:2,minMerges:14,sockets:[
      {x:161.5,y:113,cut:'rectangular_brilliant',width:44.5,height:44.5},
      {x:161.5,y:171.5,cut:'heart',width:50.5,height:50.5}
    ]},
    {id:'signet-ring',name:'Royal Signet',description:'A noble signet built to carry a small constellation of gems.',type:'signet',rarity:'Uncommon',base:210,weight:15,minTier:4,minMerges:24,sockets:[
      {x:120.5,y:85,cut:'tanzanite',width:25.5,height:39},
      {x:159,y:62,cut:'rectangular',width:41.5,height:41.5},
      {x:198.5,y:85,cut:'tanzanite',width:25.5,height:39}
    ]},
    {id:'moon-necklace',name:'Moon Necklace',description:'A celestial necklace of moonlit silver and balanced stones.',type:'necklace',rarity:'Uncommon',base:285,weight:13,minTier:5,minMerges:36,sockets:[
      {x:85.5,y:114.5,cut:'circular_starcut',width:38,height:38},
      {x:137.5,y:144,cut:'heart',width:38,height:38},
      {x:184.5,y:144.5,cut:'heart',width:38,height:38},
      {x:233.5,y:114.5,cut:'circular_starcut',width:38,height:38}
    ]},
    {id:'ceremonial-goblet',name:'Ceremonial Goblet',description:'A stately cup reserved for jewels worthy of a royal toast.',type:'goblet',rarity:'Uncommon',base:340,weight:11,minTier:6,minMerges:50,sockets:[
      {x:119,y:77.5,cut:'emerald_stepcut',width:40,height:40},
      {x:160.5,y:104.5,cut:'rectangular_brilliant',width:32.5,height:32.5},
      {x:203,y:77,cut:'emerald_stepcut',width:40,height:40}
    ]},
    {id:'ornate-chalice',name:'Ornate Chalice',description:'A lavish chalice that turns every gem into ceremony.',type:'chalice',rarity:'Rare',base:475,weight:7,minTier:8,minMerges:70,sockets:[
      {x:101.5,y:74.5,cut:'tanzanite',width:29.5,height:38},
      {x:136.5,y:107.5,cut:'circular_starcut',width:38,height:38},
      {x:181.5,y:108,cut:'circular_starcut',width:38,height:38},
      {x:218.5,y:74.5,cut:'tanzanite',width:29.5,height:38}
    ]},
    {id:'moon-tiara',name:'Moon Tiara',description:'A delicate silver tiara made to shimmer like the night sky.',type:'tiara',rarity:'Rare',base:610,weight:5,minTier:10,minMerges:95,sockets:[
      {x:65.5,y:138.5,cut:'heart',width:36.5,height:36.5},
      {x:117.5,y:113,cut:'rectangular_brilliant',width:36,height:36},
      {x:160,y:82,cut:'circular_starcut',width:39,height:39},
      {x:204.5,y:111.5,cut:'rectangular_brilliant',width:36,height:36},
      {x:254.5,y:138,cut:'heart',width:35.5,height:35.5}
    ]},
    {id:'crown-reliquary',name:'Crown Reliquary',description:'A sacred royal ornament built to guard a precious arrangement.',type:'reliquary',rarity:'Rare',base:760,weight:4,minTier:12,minMerges:125,sockets:[
      {x:102.5,y:103,cut:'emerald_stepcut',width:37,height:37},
      {x:160,y:78.5,cut:'rectangular',width:40,height:40},
      {x:217.5,y:103.5,cut:'emerald_stepcut',width:37,height:37},
      {x:127.5,y:154.5,cut:'heart',width:40.5,height:40.5},
      {x:192,y:155,cut:'heart',width:38,height:38}
    ]},
    {id:'sovereign-crown',name:'Sovereign Crown',description:'A commanding crown with room for the vault’s finest jewels.',type:'crown',rarity:'Exceptional',base:1100,weight:2,minTier:14,minMerges:170,sockets:[
      {x:58,y:143.5,cut:'tanzanite',width:38,height:38},
      {x:108,y:100,cut:'heart',width:36.5,height:36.5},
      {x:159.5,y:70,cut:'rectangular',width:39,height:39},
      {x:212,y:100,cut:'heart',width:37,height:37},
      {x:262.5,y:143.5,cut:'tanzanite',width:38,height:38},
      {x:159.5,y:156.5,cut:'circular_starcut',width:50.5,height:50.5}
    ]},
    {id:'star-sceptre',name:'Star Sceptre',description:'A ceremonial sceptre designed to blaze with a trail of gems.',type:'sceptre',rarity:'Exceptional',base:1280,weight:1.5,minTier:16,minMerges:220,sockets:[
      {x:160,y:61,cut:'circular_starcut',width:40,height:40},
      {x:124.5,y:96,cut:'tanzanite',width:21.5,height:21.5},
      {x:195,y:96,cut:'tanzanite',width:21.5,height:21.5},
      {x:160.5,y:140.5,cut:'rectangular',width:23.5,height:23.5},
      {x:160,y:189,cut:'emerald_stepcut',width:25,height:25}
    ]}
  ];

  const THEMES=[
    {id:'velvet',name:'Royal Velvet',cost:0},
    {id:'midnight',name:'Midnight Vault',cost:650},
    {id:'aurora',name:'Aurora Glass',cost:1600},
    {id:'goldsmith',name:'Goldsmith',cost:3200}
  ];

  const FAMILY=[
    'pale','gold','warm','violet','green','red','gold','pale','blue','red',
    'green','violet','violet','red','blue','green','red','green','violet','gold'
  ];

  const CUT_LABELS={
    rectangular:'Rectangular',
    circular_starcut:'Round',
    emerald_stepcut:'Emerald',
    rectangular_brilliant:'Brilliant',
    heart:'Heart',
    tanzanite:'Tanzanite'
  };

  const $=id=>document.getElementById(id);
  const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);

  function blankState(){
    return {
      version:1,
      gemCounts:Array(GEMS.length).fill(0),
      chest:0,
      totalMerges:0,
      highestTier:0,
      discoveredTreasures:[],
      treasures:[],
      comboDiscoveries:[],
      treasureRecords:{},
      gold:0,
      lifetimeTreasureSales:0,
      runsCompleted:0,
      bestChain:0,
      bestRunMerges:0,
      crownstonesCreated:0,
      ownedThemes:['velvet'],
      activeTheme:'velvet'
    };
  }

  function load(){
    const base=blankState();
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(saved&&typeof saved==='object') Object.assign(base,saved);
    }catch{}
    if(!Array.isArray(base.gemCounts)) base.gemCounts=Array(GEMS.length).fill(0);
    base.gemCounts=GEMS.map((_,i)=>Math.max(0,Math.floor(Number(base.gemCounts[i])||0)));
    if(!Array.isArray(base.discoveredTreasures)) base.discoveredTreasures=[];
    if(!Array.isArray(base.treasures)) base.treasures=[];
    if(!Array.isArray(base.comboDiscoveries)) base.comboDiscoveries=[];
    if(!base.treasureRecords||typeof base.treasureRecords!=='object') base.treasureRecords={};
    base.runsCompleted=Math.max(0,Math.floor(Number(base.runsCompleted)||0));
    base.bestChain=Math.max(0,Math.floor(Number(base.bestChain)||0));
    base.bestRunMerges=Math.max(0,Math.floor(Number(base.bestRunMerges)||0));
    base.crownstonesCreated=Math.max(0,Math.floor(Number(base.crownstonesCreated)||0));
    if(!Array.isArray(base.ownedThemes)) base.ownedThemes=['velvet'];
    if(!base.ownedThemes.includes('velvet')) base.ownedThemes.unshift('velvet');
    try{
      const unlocked=JSON.parse(localStorage.getItem('gemDropUnlocked')||'[0]');
      if(Array.isArray(unlocked)&&unlocked.length){
        base.highestTier=Math.max(base.highestTier||0,...unlocked.filter(Number.isInteger));
      }
    }catch{}
    base.chest=clamp(Number(base.chest)||0,0,CHEST_TARGET);

    // Old builds allowed any gem in any socket. Empty incompatible draft
    // inlays so every setting now has one fixed, readable gem silhouette.
    for(const copy of base.treasures){
      const treasure=TREASURES.find(t=>t.id===copy.typeId);
      if(!treasure||!Array.isArray(copy.inlays)) continue;
      copy.inlays=treasure.sockets.map((socket,index)=>{
        const tier=copy.inlays[index];
        if(!Number.isInteger(tier)||!GEMS[tier]) return null;
        return GEMS[tier].cut===socket.cut?tier:null;
      });
      copy.completed=false;
      copy.finalValue=null;
      copy.comboId=null;
    }

    return base;
  }

  let state=load();
  let currentTreasureId=null;
  let currentCopyIndex=0;
  let currentSocketIndex=-1;
  let rewardCopyUid=null;
  let metaPauseHeld=false;

  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
  }

  function applyTheme(){
    document.body.dataset.vaultTheme=state.activeTheme||'velvet';
  }

  function treasureById(id){
    return TREASURES.find(t=>t.id===id)||null;
  }

  function copiesFor(id){
    return state.treasures.filter(t=>t.typeId===id);
  }

  function gemContribution(tier){
    const gem=GEMS[tier];
    return gem?Math.round(12+gem.score*2.5):0;
  }

  function reservedCounts(){
    const out=Array(GEMS.length).fill(0);
    for(const copy of state.treasures){
      for(const tier of copy.inlays||[]){
        if(Number.isInteger(tier)&&tier>=0&&tier<GEMS.length) out[tier]++;
      }
    }
    return out;
  }

  function availableGemCount(tier,currentSocketTier=null){
    const reserved=reservedCounts();
    let value=(state.gemCounts[tier]||0)-(reserved[tier]||0);
    if(currentSocketTier===tier) value++;
    return Math.max(0,value);
  }

  function comboFor(inlays){
    if(!Array.isArray(inlays)||!inlays.length||inlays.some(v=>!Number.isInteger(v))){
      return {name:'No bonus',multiplier:1,hidden:false,id:'none'};
    }

    const sorted=[...inlays].sort((a,b)=>a-b);
    const celestial=[0,7,18,19];
    if(celestial.every(v=>inlays.includes(v))){
      return {name:'Celestial Setting',multiplier:2.75,hidden:true,id:'celestial'};
    }

    if(inlays.length===3&&[14,15,16].every(v=>inlays.includes(v))){
      return {name:'Royal Trinity',multiplier:2.4,hidden:false,id:'royal-trinity'};
    }

    if(inlays.every(v=>v===inlays[0])&&inlays.length>1){
      return {name:'Perfect Match',multiplier:2.0,hidden:false,id:'perfect-match'};
    }

    if(inlays.length>=4&&inlays.every(v=>v<=4)){
      return {name:'Pavé Setting',multiplier:1.55,hidden:false,id:'pave'};
    }

    const families=inlays.map(v=>FAMILY[v]);
    if(families.every(v=>v===families[0])&&inlays.length>1){
      return {name:'Colour Harmony',multiplier:1.65,hidden:false,id:'harmony'};
    }

    if(new Set(inlays).size===inlays.length&&new Set(families).size===families.length&&inlays.length>=3){
      return {name:'Spectrum',multiplier:1.6,hidden:false,id:'spectrum'};
    }

    let ascending=true;
    for(let i=1;i<inlays.length;i++) if(inlays[i]<=inlays[i-1]) ascending=false;
    if(ascending&&inlays.length>=3){
      return {name:'Ascending Cut',multiplier:1.45,hidden:false,id:'ascending'};
    }

    return {name:'Mixed Setting',multiplier:1,hidden:false,id:'mixed'};
  }

  function calculateValue(treasure,copy){
    const inlays=copy&&Array.isArray(copy.inlays)?copy.inlays:[];
    const gemValue=inlays.reduce((sum,tier)=>sum+(Number.isInteger(tier)?gemContribution(tier):0),0);
    const full=inlays.length===treasure.sockets.length&&inlays.every(Number.isInteger);
    const combo=full?comboFor(inlays):{name:'No bonus',multiplier:1,hidden:false,id:'none'};
    const total=Math.round((treasure.base+gemValue)*combo.multiplier);
    return {gemValue,combo,total,full};
  }

  function rarityClass(rarity){
    return String(rarity||'Common').toLowerCase();
  }

  function metalColours(rarity){
    if(rarity==='Exceptional') return ['#fff0a3','#d68dff','#7c3bb7'];
    if(rarity==='Rare') return ['#ffe4a0','#d69855','#84572f'];
    if(rarity==='Uncommon') return ['#fff0b4','#d8ad58','#806126'];
    return ['#f8f4ff','#a8a4b6','#5f5b70'];
  }

  function treasureBody(type,fill,stroke){
    const common='fill="'+fill+'" stroke="'+stroke+'" stroke-width="4" stroke-linejoin="round"';
    if(type==='ring') return '<circle cx="160" cy="148" r="66" fill="none" stroke="'+fill+'" stroke-width="28"/><path d="M119 105 L137 69 L183 69 L201 105 L184 126 L136 126 Z" '+common+'/>';
    if(type==='signet') return '<ellipse cx="160" cy="160" rx="70" ry="52" fill="none" stroke="'+fill+'" stroke-width="25"/><path d="M108 112 L125 58 L195 58 L212 112 L190 137 L130 137 Z" '+common+'/>';
    if(type==='brooch') return '<path d="M160 54 L205 78 L238 121 L217 168 L160 202 L103 168 L82 121 L115 78 Z" '+common+'/><path d="M160 70 L196 91 L220 124 L202 157 L160 183 L118 157 L100 124 L124 91 Z" fill="none" stroke="'+stroke+'" stroke-width="5"/>';
    if(type==='pendant') return '<path d="M160 62 C126 28 72 62 82 114 C92 163 145 190 160 214 C175 190 228 163 238 114 C248 62 194 28 160 62 Z" '+common+'/><circle cx="160" cy="40" r="16" fill="none" stroke="'+fill+'" stroke-width="9"/>';
    if(type==='necklace') return '<path d="M72 74 C93 178 227 178 248 74" fill="none" stroke="'+fill+'" stroke-width="16" stroke-linecap="round"/><path d="M92 95 C110 155 210 155 228 95" fill="none" stroke="'+stroke+'" stroke-width="5"/><path d="M139 150 L160 204 L181 150 Z" '+common+'/>';
    if(type==='goblet') return '<path d="M94 54 H226 L207 139 C201 166 181 177 169 181 V211 H213 V229 H107 V211 H151 V181 C139 177 119 166 113 139 Z" '+common+'/><path d="M111 72 H209" stroke="'+stroke+'" stroke-width="6"/>';
    if(type==='chalice') return '<path d="M78 59 H242 L224 139 C216 173 187 185 171 188 V216 H222 V234 H98 V216 H149 V188 C133 185 104 173 96 139 Z" '+common+'/><path d="M96 83 C117 104 203 104 224 83" fill="none" stroke="'+stroke+'" stroke-width="6"/><path d="M72 76 C48 97 59 143 105 145 M248 76 C272 97 261 143 215 145" fill="none" stroke="'+fill+'" stroke-width="11"/>';
    if(type==='tiara') return '<path d="M58 176 L84 96 L126 138 L160 54 L194 138 L236 96 L262 176 Q160 214 58 176 Z" '+common+'/><path d="M72 174 Q160 198 248 174" fill="none" stroke="'+stroke+'" stroke-width="5"/>';
    if(type==='reliquary') return '<path d="M90 88 L126 52 H194 L230 88 V212 H90 Z" '+common+'/><path d="M111 112 H209 V190 H111 Z" fill="none" stroke="'+stroke+'" stroke-width="6"/><path d="M126 52 L160 28 L194 52" fill="none" stroke="'+fill+'" stroke-width="13"/>';
    if(type==='crown') return '<path d="M54 86 L103 136 L126 54 L160 126 L194 54 L217 136 L266 86 L244 213 H76 Z" '+common+'/><path d="M82 174 H238" stroke="'+stroke+'" stroke-width="7"/>';
    if(type==='sceptre') return '<path d="M149 87 H171 V226 H149 Z" '+common+'/><circle cx="160" cy="61" r="38" '+common+'/><path d="M160 14 L172 42 L202 45 L180 66 L186 96 L160 81 L134 96 L140 66 L118 45 L148 42 Z" '+common+'/>';
    return '<circle cx="160" cy="130" r="74" '+common+'/>';
  }

  const TREASURE_ART_FILES={
    'silver-ring':'assets/treasures/silver-ring.png',
    'sun-brooch':'assets/treasures/sun-brooch.png',
    'heart-pendant':'assets/treasures/heart-pendant.png',
    'signet-ring':'assets/treasures/signet-ring.png',
    'moon-necklace':'assets/treasures/moon-necklace.png',
    'ceremonial-goblet':'assets/treasures/ceremonial-goblet.png',
    'ornate-chalice':'assets/treasures/ornate-chalice.png',
    'moon-tiara':'assets/treasures/moon-tiara.png',
    'crown-reliquary':'assets/treasures/crown-reliquary.png',
    'sovereign-crown':'assets/treasures/sovereign-crown.png',
    'star-sceptre':'assets/treasures/star-sceptre.png'
  };

  function treasureSolidFillFile(treasure){
    const artFile=TREASURE_ART_FILES[treasure.id];
    if(!artFile) return null;
    return artFile.replace('assets/treasures/','assets/treasures/solid-fill/');
  }

  function treasureFillSVG(treasure){
    const fillFile=treasureSolidFillFile(treasure);
    if(!fillFile) return '';
    return '<svg viewBox="0 0 320 260" class="treasure-fill-art" style="overflow:hidden" aria-hidden="true">'+
      '<image href="'+fillFile+'?v=20260922-solidfill1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>'+
    '</svg>';
  }

  function treasureSVG(treasure,silhouette=false,includeFill=true){
    const artFile=TREASURE_ART_FILES[treasure.id];
    if(artFile){
      const fillFile=includeFill?treasureSolidFillFile(treasure):null;
      return '<svg viewBox="0 0 320 260" class="treasure-art'+(silhouette?' is-silhouette':'')+'" style="overflow:hidden" role="img" aria-label="'+treasure.name+'">'+
        (fillFile?'<image href="'+fillFile+'?v=20260922-solidfill1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>':'')+
        '<image href="'+artFile+'?v=20260922-transparentart1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>'+
      '</svg>';
    }

    const colours=metalColours(treasure.rarity);
    const gid='m-'+treasure.id.replace(/[^a-z0-9]/g,'');
    const fill=silhouette?'#23182a':'url(#'+gid+')';
    const stroke=silhouette?'#3a2b40':colours[2];
    return '<svg viewBox="0 0 320 260" role="img" aria-label="'+treasure.name+'">'+
      '<defs><linearGradient id="'+gid+'" x1="70" y1="40" x2="240" y2="220" gradientUnits="userSpaceOnUse"><stop stop-color="'+colours[0]+'"/><stop offset=".48" stop-color="'+colours[1]+'"/><stop offset="1" stop-color="'+colours[2]+'"/></linearGradient></defs>'+
      '<g opacity="'+(silhouette?'.78':'1')+'">'+treasureBody(treasure.type,fill,stroke)+'</g></svg>';
  }

  function pauseForMeta(value){
    const scene=window.GemdropGameScene;
    if(!scene||!scene.running) return;
    if(value){
      if(!metaPauseHeld){
        metaPauseHeld=true;
        if(typeof scene.setMetaPaused==='function') scene.setMetaPaused(true);
      }
    }else if(metaPauseHeld){
      metaPauseHeld=false;
      if(typeof scene.setMetaPaused==='function') scene.setMetaPaused(false);
    }
  }

  function updateMeter(){
    const meter=$('treasureMeter');
    const fill=$('treasureMeterFill');
    if(!meter||!fill) return;
    const p=clamp(state.chest/CHEST_TARGET,0,1);
    fill.style.width=(p*100).toFixed(1)+'%';
    const ready=p>=.999;
    meter.classList.toggle('ready',ready);
    meter.disabled=!ready;
    meter.setAttribute('aria-disabled',ready?'false':'true');
    meter.setAttribute('aria-label',ready?'Treasure chest ready. Tap to claim.':'Treasure chest '+Math.round(p*100)+' percent full');
  }

  function updateGemBadges(){
    document.querySelectorAll('[data-gem-tier]').forEach(card=>{
      const tier=Number(card.dataset.gemTier);
      const count=card.querySelector('.gem-card__count');
      if(count) count.textContent='×'+(state.gemCounts[tier]||0);
    });
  }

  function onMerge(tier,chain=1,options={}){
    state.totalMerges++;
    const resultTier=Number.isInteger(options.resultTier)?options.resultTier:tier;
    if(Number.isInteger(tier)&&tier>=0&&tier<GEMS.length){
      if(options.collect!==false) state.gemCounts[tier]=(state.gemCounts[tier]||0)+1;
    }
    if(Number.isInteger(resultTier)&&resultTier>=0&&resultTier<GEMS.length){
      state.highestTier=Math.max(state.highestTier,resultTier);
      if(resultTier===GEMS.length-1&&!options.master) state.crownstonesCreated++;
    }
    const level=Number.isInteger(resultTier)?resultTier:0;
    const gain=2.15+Math.min(level,12)*.30+Math.min(Math.max(0,chain-1),4)*.65+(options.master?5:0);
    const chestBefore=state.chest;
    state.chest=clamp(state.chest+gain,0,CHEST_TARGET);
    const chestGain=Math.max(0,state.chest-chestBefore);
    save();
    updateMeter();
    updateGemBadges();
    return {chestGain,resultTier};
  }

  function getProgressSnapshot(){
    return {
      gemCounts:[...state.gemCounts],
      chest:state.chest,
      chestTarget:CHEST_TARGET,
      totalMerges:state.totalMerges,
      highestTier:state.highestTier,
      discoveredTreasures:[...state.discoveredTreasures],
      runsCompleted:state.runsCompleted,
      bestChain:state.bestChain,
      bestRunMerges:state.bestRunMerges,
      crownstonesCreated:state.crownstonesCreated
    };
  }

  function recordRun(summary={}){
    const chain=Math.max(0,Math.floor(Number(summary.bestChain)||0));
    const merges=Math.max(0,Math.floor(Number(summary.merges)||0));
    const oldBestChain=state.bestChain;
    const oldBestRunMerges=state.bestRunMerges;

    state.runsCompleted++;
    state.bestChain=Math.max(state.bestChain,chain);
    state.bestRunMerges=Math.max(state.bestRunMerges,merges);
    save();

    return {
      runsCompleted:state.runsCompleted,
      newBestChain:chain>oldBestChain,
      newBestMerges:merges>oldBestRunMerges,
      bestChain:state.bestChain,
      bestRunMerges:state.bestRunMerges,
      crownstonesCreated:state.crownstonesCreated
    };
  }

  function eligibleTreasures(){
    const eligible=TREASURES.filter(t=>state.highestTier>=t.minTier&&state.totalMerges>=t.minMerges);
    return eligible.length?eligible:[TREASURES[0]];
  }

  function randomTreasure(){
    const pool=eligibleTreasures();
    const total=pool.reduce((sum,t)=>sum+t.weight,0);
    let roll=Math.random()*total;
    for(const t of pool){
      roll-=t.weight;
      if(roll<=0) return t;
    }
    return pool[pool.length-1];
  }

  function addTreasure(treasure){
    const copy={
      uid:uid(),
      typeId:treasure.id,
      inlays:Array(treasure.sockets.length).fill(null),
      completed:false,
      finalValue:null,
      comboId:null,
      acquiredAt:Date.now()
    };
    state.treasures.push(copy);
    if(!state.discoveredTreasures.includes(treasure.id)) state.discoveredTreasures.push(treasure.id);
    save();
    return copy;
  }

  let rewardTimers=[];

  function clearRewardTimers(){
    rewardTimers.forEach(id=>window.clearTimeout(id));
    rewardTimers=[];
  }

  function claimTreasure(){
    if(state.chest<CHEST_TARGET) return;
    const treasure=randomTreasure();
    const copy=addTreasure(treasure);
    state.chest=0;
    rewardCopyUid=copy.uid;
    const scene=window.GemdropGameScene;
    if(scene&&scene.running&&typeof scene.noteTreasureClaim==='function'){
      scene.noteTreasureClaim(treasure.id);
    }
    save();
    updateMeter();
    renderTreasureCollection();

    const overlay=$('treasureRewardOverlay');
    const art=$('treasureRewardArt');
    $('treasureRewardRarity').textContent=treasure.rarity.toUpperCase()+' TREASURE';
    $('treasureRewardTitle').textContent=treasure.name;
    $('treasureRewardCopy').textContent=treasure.description;
    art.innerHTML=treasureSVG(treasure,false);

    clearRewardTimers();
    overlay.classList.remove('opening','burst','open-burst','revealed');
    void overlay.offsetWidth;
    overlay.classList.add('visible','opening');
    pauseForMeta(true);

    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closedBurstAt=reduced?70:790;
    const openBurstAt=reduced?115:1050;
    const revealAt=reduced?165:1270;

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.add('burst');
      if(navigator.vibrate) navigator.vibrate([18,28,42]);
    },closedBurstAt));

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.add('open-burst');
    },openBurstAt));

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.remove('opening','burst','open-burst');
      overlay.classList.add('revealed');
      rewardTimers=[];
    },revealAt));

    refreshIcons();
  }

  function closeReward(resume=true){
    clearRewardTimers();
    const overlay=$('treasureRewardOverlay');
    overlay.classList.remove('visible','opening','burst','open-burst','revealed');
    if(resume) pauseForMeta(false);
  }

  function showCollection(tab='gems'){
    const overlay=$('collectionOverlay');
    if(overlay) overlay.classList.add('visible');
    selectCollectionTab(tab);
  }

  function selectCollectionTab(tab){
    const gems=tab!=='treasures';
    $('collectionTabGems').classList.toggle('active',gems);
    $('collectionTabTreasures').classList.toggle('active',!gems);
    $('collectionTabGems').setAttribute('aria-selected',gems?'true':'false');
    $('collectionTabTreasures').setAttribute('aria-selected',gems?'false':'true');
    $('gemCollection').hidden=!gems;
    $('treasureCollection').hidden=gems;
    $('collectionTitle').textContent=gems?'Gem Showcase':'Treasure Vault';
    if(gems){
      $('collectionProgress').textContent=(window.GemdropGameScene?window.GemdropGameScene.unlockedTiers.size:1)+' / '+GEMS.length;
      updateGemBadges();
    }else{
      renderTreasureCollection();
    }
  }

  function treasureCollectionCard(treasure){
    const discovered=state.discoveredTreasures.includes(treasure.id);
    const copies=copiesFor(treasure.id);
    const completed=copies.filter(c=>calculateValue(treasure,c).full).length;
    const button=document.createElement('button');
    button.type='button';
    button.className='treasure-card rarity-'+rarityClass(treasure.rarity)+(discovered?'':' locked');
    button.dataset.treasureId=treasure.id;
    button.disabled=!copies.length;
    button.setAttribute('aria-label',discovered?treasure.name+', '+copies.length+' owned':'Undiscovered treasure');
    button.innerHTML=
      '<div class="treasure-card__art">'+treasureSVG(treasure,!discovered)+'</div>'+
      '<div class="treasure-card__meta">'+
        '<strong>'+(discovered?treasure.name:'Undiscovered')+'</strong>'+
        '<span class="treasure-card__rarity">'+(discovered?treasure.rarity:'???')+'</span>'+
        '<span class="treasure-card__count">'+(discovered?'×'+copies.length:'')+'</span>'+
        (completed?'<span class="treasure-card__complete"><span>'+completed+' finished</span>'+(state.treasureRecords[treasure.id]?'<span>Best '+money(state.treasureRecords[treasure.id])+'</span>':'')+'</span>':'')+
      '</div>';
    if(copies.length) button.addEventListener('click',()=>openTreasureDetail(treasure.id));
    return button;
  }

  function themeMarkup(){
    let out='<section class="vault-meta-panel"><div class="vault-bank"><span>VAULT FUND</span><strong>'+money(state.gold)+'</strong></div>'+
      '<div class="vault-theme-title">Vault finish</div><div class="vault-themes">';
    THEMES.forEach(theme=>{
      const owned=state.ownedThemes.includes(theme.id);
      const active=state.activeTheme===theme.id;
      out+='<button class="vault-theme '+(active?'active ':'')+(owned?'owned':'')+'" data-theme-id="'+theme.id+'" type="button">'+
        '<span>'+theme.name+'</span><strong>'+(active?'ACTIVE':owned?'OWNED':money(theme.cost))+'</strong></button>';
    });
    out+='</div></section>';
    return out;
  }

  function renderTreasureCollection(){
    const root=$('treasureCollection');
    if(!root) return;
    root.innerHTML=themeMarkup();
    const grid=document.createElement('div');
    grid.className='treasure-grid';
    TREASURES.forEach(t=>grid.appendChild(treasureCollectionCard(t)));
    root.appendChild(grid);
    $('collectionProgress').textContent=state.discoveredTreasures.length+' / '+TREASURES.length;
    root.querySelectorAll('.vault-theme').forEach(button=>{
      button.addEventListener('click',()=>handleTheme(button.dataset.themeId));
    });
    refreshIcons();
  }

  function handleTheme(id){
    const theme=THEMES.find(t=>t.id===id);
    if(!theme) return;
    if(!state.ownedThemes.includes(id)){
      if(state.gold<theme.cost){
        const b=document.querySelector('[data-theme-id="'+id+'"]');
        if(b){
          b.classList.remove('shake');
          void b.offsetWidth;
          b.classList.add('shake');
        }
        return;
      }
      state.gold-=theme.cost;
      state.ownedThemes.push(id);
    }
    state.activeTheme=id;
    save();
    applyTheme();
    renderTreasureCollection();
  }

  function getCurrentCopy(){
    if(!currentTreasureId) return null;
    const copies=copiesFor(currentTreasureId);
    if(!copies.length) return null;
    currentCopyIndex=clamp(currentCopyIndex,0,copies.length-1);
    return copies[currentCopyIndex];
  }

  function drawMiniGem(container,tier,size=72){
    container.innerHTML='';
    const gem=GEMS[tier];
    if(!gem) return;
    if(window.ReactiveGemSystem&&typeof window.ReactiveGemSystem.renderPreviewCanvas==='function'){
      try{
        const source=window.ReactiveGemSystem.renderPreviewCanvas(gem.cut,gem.color,0,160,gem);
        const canvas=document.createElement('canvas');
        canvas.width=size;
        canvas.height=size;
        const ctx=canvas.getContext('2d');
        const scale=Math.min(size*.88/source.width,size*.88/source.height);
        const w=source.width*scale;
        const h=source.height*scale;
        ctx.drawImage(source,(size-w)/2,(size-h)/2,w,h);
        container.appendChild(canvas);
        return;
      }catch{}
    }
    const dot=document.createElement('span');
    dot.className='socket-fallback-gem';
    dot.style.background=gem.color;
    container.appendChild(dot);
  }

  function renderSocketArt(container,socket,tier=null){
    container.innerHTML='';

    // Always keep the inlay fill under the socket. Filled gems sit above it,
    // so any transparent facet/edge still has the intended inlay backing.
    const backing=document.createElement('img');
    backing.className='socket-no-inlay';
    backing.src='assets/treasures/no-inlay.png?v=20260922-noinlay2';
    backing.alt='';
    backing.setAttribute('aria-hidden','true');
    backing.addEventListener('error',()=>{ backing.style.display='none'; },{once:true});
    container.appendChild(backing);

    if(!Number.isInteger(tier)) return;

    const gem=GEMS[tier];
    const logicalW=Math.max(12,Number(socket.width)||Number(socket.size)||40);
    const logicalH=Math.max(12,Number(socket.height)||Number(socket.size)||40);
    const dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    const renderW=Math.round(Math.max(192,Math.min(768,logicalW*5*dpr)));
    const renderH=Math.round(Math.max(192,Math.min(768,logicalH*5*dpr)));

    const canvas=document.createElement('canvas');
    canvas.className='socket-gem';
    canvas.setAttribute('aria-hidden','true');

    try{
      const source=window.ReactiveGemSystem.renderPreviewCanvasSized
        ? window.ReactiveGemSystem.renderPreviewCanvasSized(
            socket.cut,
            gem.color,
            renderW,
            renderH,
            gem
          )
        : window.ReactiveGemSystem.renderPreviewCanvas(
            socket.cut,
            gem.color,
            0,
            Math.max(renderW,renderH),
            gem
          );

      canvas.width=source.width;
      canvas.height=source.height;
      const ctx=canvas.getContext('2d',{alpha:true});
      ctx.drawImage(source,0,0);
    }catch{
      canvas.width=renderW;
      canvas.height=renderH;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle=gem.color;
      ctx.beginPath();
      ctx.ellipse(renderW/2,renderH/2,renderW*.38,renderH*.38,0,0,Math.PI*2);
      ctx.fill();
    }

    container.appendChild(canvas);
  }

  function updateTreasureRecord(treasure,copy){
    const calc=calculateValue(treasure,copy);
    if(!calc.full) return calc;
    state.treasureRecords[treasure.id]=Math.max(state.treasureRecords[treasure.id]||0,calc.total);
    if(calc.combo.id!=='none'&&!state.comboDiscoveries.includes(calc.combo.id)){
      state.comboDiscoveries.push(calc.combo.id);
    }
    save();
    return calc;
  }

  function renderTreasureDetail(){
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!treasure||!copy) return;

    const copies=copiesFor(treasure.id);
    const calc=calculateValue(treasure,copy);
    $('treasureDetailRarity').textContent=treasure.rarity.toUpperCase();
    $('treasureDetailTitle').textContent=treasure.name;
    $('treasureDetailDescription').textContent=treasure.description;
    $('treasureCopyCount').textContent=(currentCopyIndex+1)+' / '+copies.length;
    $('treasureDetailFill').innerHTML=treasureFillSVG(treasure);
    $('treasureDetailArt').innerHTML=treasureSVG(treasure,false,false);
    $('treasureBaseValue').textContent=money(treasure.base);
    $('treasureGemValue').textContent=money(calc.gemValue);

    const known=!calc.combo.hidden||state.comboDiscoveries.includes(calc.combo.id);
    $('treasureBonusLabel').textContent=known?calc.combo.name:'Mystery setting';
    $('treasureMultiplier').textContent='×'+calc.combo.multiplier.toFixed(2);
    $('treasureTotalValue').textContent=money(calc.total);
    $('treasureCopyStatus').textContent=calc.full?'Complete · keep it or sell it':'Tap a setting to choose a gem';

    const copyNav=document.querySelector('.treasure-copy-nav');
    if(copyNav) copyNav.hidden=copies.length<2;
    $('treasurePrevCopy').disabled=copies.length<2;
    $('treasureNextCopy').disabled=copies.length<2;

    const socketRoot=$('treasureSockets');
    socketRoot.innerHTML='';
    treasure.sockets.forEach((socket,index)=>{
      const tier=copy.inlays[index];
      const button=document.createElement('button');
      button.type='button';
      button.className='treasure-socket'+(Number.isInteger(tier)?' filled':'');
      const socketWidth=Number(socket.width)||Number(socket.size)||40;
      const socketHeight=Number(socket.height)||Number(socket.size)||40;
      const socketRotation=Number(socket.rotation)||0;

      // Filled gems and no-inlay.png use this exact same authored frame.
      // There is no separate empty-state sizing or positioning.
      button.style.left=(socket.x/3.2)+'%';
      button.style.top=(socket.y/2.6)+'%';
      button.style.width=(socketWidth/3.2)+'%';
      button.style.height=(socketHeight/2.6)+'%';
      button.style.setProperty('--socket-rotation',socketRotation+'deg');
      button.dataset.socketX=String(socket.x);
      button.dataset.socketY=String(socket.y);
      button.dataset.socketWidth=String(socketWidth);
      button.dataset.socketHeight=String(socketHeight);
      button.dataset.cut=socket.cut;
      button.setAttribute('aria-label',Number.isInteger(tier)
        ? 'Change '+GEMS[tier].name+' '+CUT_LABELS[socket.cut]+' inlay'
        : 'Choose a '+CUT_LABELS[socket.cut]+' gem');
      renderSocketArt(button,socket,tier);
      button.addEventListener('click',()=>openGemPicker(index));
      socketRoot.appendChild(button);
    });

    const sell=$('sellTreasureButton');
    sell.hidden=!calc.full;
    if(calc.full) sell.querySelector('span').textContent='SELL FOR '+money(calc.total);
    refreshIcons();
  }

  function openTreasureDetail(id,copyUid=null){
    const treasure=treasureById(id);
    if(!treasure) return;
    const copies=copiesFor(id);
    if(!copies.length) return;
    currentTreasureId=id;
    currentCopyIndex=copyUid?Math.max(0,copies.findIndex(c=>c.uid===copyUid)):Math.max(0,copies.findIndex(c=>!c.completed));
    if(currentCopyIndex<0) currentCopyIndex=0;
    $('treasureDetailOverlay').classList.add('visible');
    pauseForMeta(true);
    renderTreasureDetail();
  }

  function closeTreasureDetail(){
    $('treasureDetailOverlay').classList.remove('visible');
    closeGemPicker();
    renderTreasureCollection();
  }

  function cycleCopy(direction){
    const copies=copiesFor(currentTreasureId);
    if(copies.length<2) return;
    currentCopyIndex=(currentCopyIndex+direction+copies.length)%copies.length;
    renderTreasureDetail();
  }

  function openGemPicker(index){
    const copy=getCurrentCopy();
    if(!copy) return;
    currentSocketIndex=index;
    renderGemPicker();
    $('gemPickerOverlay').classList.add('visible');
  }

  function closeGemPicker(){
    $('gemPickerOverlay').classList.remove('visible');
    currentSocketIndex=-1;
  }

  function renderGemPicker(){
    const root=$('gemPickerList');
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!root||!copy||!treasure) return;

    const socket=treasure.sockets[currentSocketIndex];
    const currentTier=copy.inlays[currentSocketIndex];
    $('gemPickerTitle').textContent='Choose a '+CUT_LABELS[socket.cut]+' gem';
    root.innerHTML='';

    let choices=0;
    GEMS.forEach((gem,tier)=>{
      if(gem.cut!==socket.cut) return;
      const available=availableGemCount(tier,currentTier);
      if(available<=0&&currentTier!==tier) return;
      choices++;

      const button=document.createElement('button');
      button.type='button';
      button.className='gem-picker-item'+(currentTier===tier?' selected':'');
      button.disabled=available<=0&&currentTier!==tier;

      const art=document.createElement('span');
      art.className='gem-picker-item__art';
      drawMiniGem(art,tier,64);

      const copyText=document.createElement('span');
      copyText.className='gem-picker-item__copy';
      copyText.innerHTML='<strong>'+gem.name+'</strong><small>+'+money(gemContribution(tier))+' value</small>';

      const count=document.createElement('span');
      count.className='gem-picker-item__count';
      count.textContent='×'+available;

      button.append(art,copyText,count);
      button.addEventListener('click',()=>chooseGem(tier));
      root.appendChild(button);
    });

    if(!choices){
      const empty=document.createElement('div');
      empty.className='gem-picker-empty';
      empty.textContent='No '+CUT_LABELS[socket.cut].toLowerCase()+' gems in your collection yet.';
      root.appendChild(empty);
    }

    $('removeInlayButton').hidden=!Number.isInteger(currentTier);
  }

  function chooseGem(tier){
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!treasure||!copy||currentSocketIndex<0) return;
    const socket=treasure.sockets[currentSocketIndex];
    if(!GEMS[tier]||GEMS[tier].cut!==socket.cut) return;

    const currentTier=copy.inlays[currentSocketIndex];
    if(availableGemCount(tier,currentTier)<=0&&currentTier!==tier) return;

    copy.inlays[currentSocketIndex]=tier;
    updateTreasureRecord(treasure,copy);
    closeGemPicker();
    renderTreasureDetail();
    renderTreasureCollection();
  }

  function removeInlay(){
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!copy||currentSocketIndex<0) return;
    copy.inlays[currentSocketIndex]=null;
    save();
    closeGemPicker();
    renderTreasureDetail();
    renderTreasureCollection();
  }

  function sellCurrentTreasure(){
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!treasure||!copy) return;

    const calc=calculateValue(treasure,copy);
    if(!calc.full) return;

    const needed=Array(GEMS.length).fill(0);
    copy.inlays.forEach(tier=>needed[tier]++);
    for(let tier=0;tier<needed.length;tier++){
      if(needed[tier]>(state.gemCounts[tier]||0)) return;
    }

    for(let tier=0;tier<needed.length;tier++){
      state.gemCounts[tier]-=needed[tier];
    }

    state.gold+=calc.total;
    state.lifetimeTreasureSales+=calc.total;
    state.treasureRecords[treasure.id]=Math.max(state.treasureRecords[treasure.id]||0,calc.total);

    const index=state.treasures.findIndex(t=>t.uid===copy.uid);
    if(index>=0) state.treasures.splice(index,1);

    save();
    updateGemBadges();

    const remaining=copiesFor(currentTreasureId);
    if(!remaining.length){
      $('treasureDetailOverlay').classList.remove('visible');
      renderTreasureCollection();
    }else{
      currentCopyIndex=clamp(currentCopyIndex,0,remaining.length-1);
      renderTreasureDetail();
      renderTreasureCollection();
    }
  }

  function refreshIcons(){
    if(window.lucide) window.lucide.createIcons({attrs:{'stroke-width':1.9}});
  }

  function bind(){
    const meter=$('treasureMeter');
    if(meter) meter.addEventListener('click',claimTreasure);

    $('collectionTabGems').addEventListener('click',()=>selectCollectionTab('gems'));
    $('collectionTabTreasures').addEventListener('click',()=>selectCollectionTab('treasures'));

    $('treasureRewardClose').addEventListener('click',()=>closeReward(true));
    $('treasureRewardView').addEventListener('click',()=>closeReward(true));

    $('treasureDetailBack').addEventListener('click',closeTreasureDetail);
    $('treasurePrevCopy').addEventListener('click',()=>cycleCopy(-1));
    $('treasureNextCopy').addEventListener('click',()=>cycleCopy(1));
    $('sellTreasureButton').addEventListener('click',sellCurrentTreasure);

    $('gemPickerClose').addEventListener('click',closeGemPicker);
    $('gemPickerBackdrop').addEventListener('click',closeGemPicker);
    $('removeInlayButton').addEventListener('click',removeInlay);

    const collectionBack=$('collectionBack');
    collectionBack.addEventListener('click',()=>{
      if(metaPauseHeld) pauseForMeta(false);
    });
  }

  function init(){
    applyTheme();
    bind();
    updateMeter();
    renderTreasureCollection();
    refreshIcons();
  }

  window.GemdropMeta={
    init,
    onMerge,
    recordRun,
    getProgressSnapshot,
    getChestTarget:()=>CHEST_TARGET,
    getGemCount:tier=>state.gemCounts[tier]||0,
    updateGemBadges,
    showCollection,
    selectCollectionTab,
    renderTreasureCollection,
    openTreasureDetail,
    getTreasureInfo:id=>{
      const treasure=treasureById(id);
      if(!treasure) return null;
      const file=TREASURE_ART_FILES[treasure.id];
      return {
        id:treasure.id,
        name:treasure.name,
        rarity:treasure.rarity,
        art:file||null
      };
    },
    getState:()=>state
  };

  init();
})();