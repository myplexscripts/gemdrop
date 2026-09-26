(() => {
  'use strict';

  const STORAGE_KEY='gemdrop-meta-v1';
  const CHEST_TARGET=320;
  const ORDER_SLOTS=1;
  const ORDER_REFRESH_COST=100;
  const TREASURE_BASE_COST=450;
  const TREASURE_COST_STEP=100;
  const TREASURE_UNLOCK_ORDERS=[0,2,4,7,10,14,18,23,29,36,44];

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
      version:5,
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
      activeTheme:'velvet',
      orders:[],
      ordersCompleted:0,
      orderSequence:0
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
    if(!Array.isArray(base.orders)) base.orders=[];
    base.ordersCompleted=Math.max(0,Math.floor(Number(base.ordersCompleted)||0));
    base.orderSequence=Math.max(0,Math.floor(Number(base.orderSequence)||0));
    try{
      const unlocked=JSON.parse(localStorage.getItem('gemDropUnlocked')||'[0]');
      if(Array.isArray(unlocked)&&unlocked.length){
        base.highestTier=Math.max(base.highestTier||0,...unlocked.filter(Number.isInteger));
      }
    }catch{}
    if((Number(base.version)||1)<2){
      const oldTarget=120;
      const oldChest=Math.max(0,Number(base.chest)||0);
      base.chest=(oldChest/oldTarget)*280;
      base.version=2;
    }
    if((Number(base.version)||1)<3){
      const oldTarget=280;
      const oldChest=Math.max(0,Number(base.chest)||0);
      base.chest=(oldChest/oldTarget)*CHEST_TARGET;
      base.version=3;
    }
    if((Number(base.version)||1)<4){
      base.version=4;
    }
    if((Number(base.version)||1)<5){
      // v5 makes the live physics board the inventory, like traditional
      // merge games. Old permanent gem stockpiles are intentionally retired.
      base.gemCounts=Array(GEMS.length).fill(0);
      base.chest=0;
      base.orders=[];
      base.version=5;
    }
    base.chest=0;

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
      '<image href="'+fillFile+'?v=20260923-opt1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>'+
    '</svg>';
  }

  function treasureSVG(treasure,silhouette=false,includeFill=true){
    const artFile=TREASURE_ART_FILES[treasure.id];
    if(artFile){
      const fillFile=includeFill?treasureSolidFillFile(treasure):null;
      return '<svg viewBox="0 0 320 260" class="treasure-art'+(silhouette?' is-silhouette':'')+'" style="overflow:hidden" role="img" aria-label="'+treasure.name+'">'+
        (fillFile?'<image href="'+fillFile+'?v=20260923-opt1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>':'')+
        '<image href="'+artFile+'?v=20260923-opt1" x="0" y="0" width="320" height="260" preserveAspectRatio="none"/>'+
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
    // The showcase is now a discovery catalogue, not a spendable warehouse.
    renderHomeOrder();
    syncOrderUI();
  }

  function onMerge(tier,chain=1,options={}){
    state.totalMerges++;
    const resultTier=Number.isInteger(options.resultTier)?options.resultTier:tier;

    if(Number.isInteger(resultTier)&&resultTier>=0&&resultTier<GEMS.length){
      state.highestTier=Math.max(state.highestTier,resultTier);
      if(resultTier===GEMS.length-1&&!options.master) state.crownstonesCreated++;
    }

    save();
    syncOrderUI();
    return {chestGain:0,resultTier};
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
    const eligible=TREASURES.filter((treasure,index)=>
      state.highestTier>=treasure.minTier &&
      state.ordersCompleted>=(TREASURE_UNLOCK_ORDERS[index]||0)
    );
    return eligible.length?eligible:[TREASURES[0]];
  }

  function undiscoveredEligibleTreasures(){
    return eligibleTreasures().filter(treasure=>!state.discoveredTreasures.includes(treasure.id));
  }

  function randomTreasure(){
    const pool=undiscoveredEligibleTreasures();
    if(!pool.length) return null;

    const total=pool.reduce((sum,treasure)=>sum+Math.max(.1,treasure.weight),0);
    let roll=Math.random()*total;
    for(const treasure of pool){
      roll-=Math.max(.1,treasure.weight);
      if(roll<=0) return treasure;
    }
    return pool[pool.length-1];
  }

  function treasureChestCost(){
    return TREASURE_BASE_COST+state.discoveredTreasures.length*TREASURE_COST_STEP;
  }

  function nextLockedTreasure(){
    return TREASURES.find(treasure=>!state.discoveredTreasures.includes(treasure.id))||null;
  }

  function addTreasure(treasure){
    if(!treasure) return null;
    const existing=copiesFor(treasure.id)[0];
    if(existing) return existing;

    const copy={
      uid:uid(),
      typeId:treasure.id,
      inlays:Array(treasure.sockets.length).fill(null),
      completed:true,
      completionAwarded:true,
      completionBonus:0,
      finalValue:null,
      comboId:null,
      acquiredAt:Date.now()
    };
    state.treasures.push(copy);
    if(!state.discoveredTreasures.includes(treasure.id)) state.discoveredTreasures.push(treasure.id);
    save();
    return copy;
  }


  function orderSpawnFloor(){
    const best=Math.max(0,state.highestTier||0);
    if(best>=16) return 4;
    if(best>=13) return 3;
    if(best>=10) return 2;
    if(best>=7) return 1;
    return 0;
  }

  function orderGemTier(){
    const floor=orderSpawnFloor();
    const max=clamp(Math.min(state.highestTier,floor+4),floor,GEMS.length-1);
    if(max<=floor) return floor;
    const span=max-floor+1;
    return floor+Math.min(span-1,Math.floor(Math.pow(Math.random(),1.85)*span));
  }

  function createGemOrder(slot=0){
    const floor=orderSpawnFloor();
    const requirementCount=state.ordersCompleted>=4&&Math.random()<.38?2:1;
    const requirements=[];
    const used=new Set();

    while(requirements.length<requirementCount){
      let tier=orderGemTier();
      let guard=0;
      while(used.has(tier)&&guard<12){
        tier=orderGemTier();
        guard++;
      }
      if(used.has(tier)) break;
      used.add(tier);

      const delta=Math.max(0,tier-floor);
      const qty=delta===0
        ? 2+Math.floor(Math.random()*3)
        : delta===1
          ? 1+Math.floor(Math.random()*2)
          : 1;
      requirements.push({tier,qty});
    }

    const effort=requirements.reduce((sum,item)=>{
      const delta=Math.max(0,item.tier-floor);
      return sum+item.qty*Math.pow(2,delta);
    },0);

    const reward=Math.round(
      55+
      effort*28+
      requirements.length*20+
      Math.min(110,state.highestTier*5)
    );

    state.orderSequence++;
    return {
      id:uid(),
      number:state.orderSequence,
      slot,
      kind:'gems',
      requirements,
      reward,
      createdAt:Date.now()
    };
  }

  function validOrder(order){
    return !!order &&
      order.kind==='gems' &&
      Number.isInteger(order.slot) &&
      order.slot===0 &&
      Array.isArray(order.requirements) &&
      order.requirements.length>0 &&
      order.requirements.every(item=>
        item &&
        Number.isInteger(item.tier) &&
        item.tier>=0 &&
        item.tier<GEMS.length &&
        Number.isInteger(item.qty) &&
        item.qty>0
      );
  }

  function ensureOrders(){
    let order=(state.orders||[]).find(validOrder)||null;
    if(!order){
      order=createGemOrder(0);
      state.orders=[order];
      save();
    }else if(state.orders.length!==1||state.orders[0]!==order){
      state.orders=[order];
      save();
    }
    return order;
  }

  function boardGemCounts(){
    const scene=window.GemdropGameScene;
    if(!scene||!scene.running||typeof scene.getDeliverableGemCounts!=='function'){
      return Array(GEMS.length).fill(0);
    }
    return scene.getDeliverableGemCounts();
  }

  function orderReady(order=ensureOrders()){
    if(!order) return false;
    const counts=boardGemCounts();
    return order.requirements.every(item=>(counts[item.tier]||0)>=item.qty);
  }

  function orderTitle(order=ensureOrders()){
    if(!order) return 'New order';
    return order.requirements
      .map(item=>item.qty+' '+GEMS[item.tier].name)
      .join(' + ');
  }

  function orderProgressLabel(order=ensureOrders()){
    if(!order) return '';
    const counts=boardGemCounts();
    return order.requirements
      .map(item=>Math.min(item.qty,counts[item.tier]||0)+'/'+item.qty)
      .join('  ·  ');
  }

  function orderRewardLabel(order=ensureOrders()){
    return order?money(order.reward):money(0);
  }

  function renderHomeOrder(){
    const fund=$('homeFund');
    if(fund) fund.textContent=money(state.gold);
  }

  function syncOrderUI(){
    const order=ensureOrders();
    renderHomeOrder();

    const hud=$('orderHud');
    if(!hud||!order) return;

    const ready=orderReady(order);
    const title=$('orderHudTitle');
    const progress=$('orderHudProgress');
    const action=$('orderHudAction');
    const scene=window.GemdropGameScene;
    const playing=!!(scene&&scene.running);

    if(title) title.textContent=orderTitle(order);
    if(progress){
      progress.textContent=playing
        ? orderProgressLabel(order)+' on board'
        : 'Play to fill · '+orderRewardLabel(order);
    }
    if(action) action.textContent=ready?'DELIVER':orderRewardLabel(order);

    hud.disabled=!ready;
    hud.classList.toggle('ready',ready);
    hud.setAttribute(
      'aria-label',
      "Jeweller order: "+orderTitle(order)+'. '+
      (ready?'Ready to deliver for '+orderRewardLabel(order):orderProgressLabel(order)+' on board')
    );
  }

  function renderOrderGemItem(item){
    const counts=boardGemCounts();
    const row=document.createElement('div');
    row.className='order-item';

    const art=document.createElement('span');
    art.className='order-item__art';
    drawMiniGem(art,item.tier,54);

    const copy=document.createElement('span');
    copy.className='order-item__copy';
    copy.innerHTML='<strong>'+GEMS[item.tier].name+'</strong><small>Keep this gem on the board</small>';

    const count=document.createElement('span');
    count.className='order-item__count';
    const have=counts[item.tier]||0;
    count.textContent=Math.min(have,item.qty)+' / '+item.qty;
    count.classList.toggle('complete',have>=item.qty);

    row.append(art,copy,count);
    return row;
  }

  function treasureUnlockMessage(){
    const next=nextLockedTreasure();
    if(!next) return 'Treasure collection complete';

    const index=TREASURES.indexOf(next);
    const ordersNeeded=Math.max(0,(TREASURE_UNLOCK_ORDERS[index]||0)-state.ordersCompleted);
    const tierNeeded=Math.max(0,next.minTier-state.highestTier);

    if(ordersNeeded<=0&&tierNeeded<=0) return 'A new treasure is ready';
    const parts=[];
    if(ordersNeeded>0) parts.push(ordersNeeded+' more order'+(ordersNeeded===1?'':'s'));
    if(tierNeeded>0) parts.push('reach '+GEMS[next.minTier].name);
    return 'Next treasure: '+parts.join(' · ');
  }

  function renderOrders(){
    const root=$('orderBoard');
    if(!root) return;

    const order=ensureOrders();
    const ready=orderReady(order);
    const scene=window.GemdropGameScene;
    const playing=!!(scene&&scene.running);
    const chestCost=treasureChestCost();
    const newTreasure=undiscoveredEligibleTreasures()[0]||null;

    root.innerHTML='';

    const merchant=document.createElement('section');
    merchant.className='order-merchant order-merchant--simple';
    merchant.innerHTML=
      '<div class="order-merchant__mark"><i data-lucide="gem" aria-hidden="true"></i></div>'+
      '<div class="order-merchant__copy"><span>THE JEWELLER</span><strong>Fill orders on the board</strong>'+
      '<p>Keep the requested gems on the play board, deliver them for coins, then spend those coins on new treasures.</p></div>'+
      '<div class="order-wallet"><span>VAULT FUND</span><strong>'+money(state.gold)+'</strong></div>';
    root.appendChild(merchant);

    const loop=document.createElement('div');
    loop.className='order-loop';
    loop.innerHTML=
      '<span><i data-lucide="play" aria-hidden="true"></i><b>PLAY</b></span>'+
      '<i data-lucide="chevron-right" aria-hidden="true"></i>'+
      '<span><i data-lucide="scroll-text" aria-hidden="true"></i><b>ORDER</b></span>'+
      '<i data-lucide="chevron-right" aria-hidden="true"></i>'+
      '<span><i data-lucide="coins" aria-hidden="true"></i><b>COINS</b></span>'+
      '<i data-lucide="chevron-right" aria-hidden="true"></i>'+
      '<span><i data-lucide="crown" aria-hidden="true"></i><b>TREASURE</b></span>';
    root.appendChild(loop);

    const current=document.createElement('article');
    current.className='order-card order-card--current'+(ready?' ready':'');
    current.innerHTML=
      '<header class="order-card__header">'+
        '<span>CURRENT ORDER</span>'+
        '<strong>'+orderTitle(order)+'</strong>'+
        '<b>'+orderRewardLabel(order)+'</b>'+
      '</header>';

    const items=document.createElement('div');
    items.className='order-items';
    order.requirements.forEach(item=>items.appendChild(renderOrderGemItem(item)));
    current.appendChild(items);

    const deliver=document.createElement('button');
    deliver.type='button';
    deliver.className='order-deliver'+(ready?' ready':'');
    deliver.disabled=!ready;
    deliver.innerHTML=ready
      ? '<i data-lucide="package-check" aria-hidden="true"></i><span>DELIVER FOR '+orderRewardLabel(order)+'</span>'
      : '<i data-lucide="circle-dashed" aria-hidden="true"></i><span>'+(playing?'KEEP MERGING':'PLAY TO FILL ORDER')+'</span>';
    if(ready) deliver.addEventListener('click',()=>fulfillOrder(order.id));
    current.appendChild(deliver);

    const reroll=document.createElement('button');
    reroll.type='button';
    reroll.className='order-reroll';
    reroll.disabled=state.gold<ORDER_REFRESH_COST;
    reroll.innerHTML='<i data-lucide="refresh-cw" aria-hidden="true"></i><span>NEW ORDER</span><b>'+money(ORDER_REFRESH_COST)+'</b>';
    reroll.addEventListener('click',refreshOrders);
    current.appendChild(reroll);
    root.appendChild(current);

    const treasure=document.createElement('section');
    treasure.className='order-treasure-goal';
    treasure.innerHTML=
      '<div class="order-treasure-goal__art"><img src="assets/treasures/chest-closed.png?v=20260923-opt1" alt=""></div>'+
      '<div class="order-treasure-goal__copy"><span>TREASURE COLLECTION</span>'+
        '<strong>'+(newTreasure?'Open a new treasure':'Keep progressing')+'</strong>'+
        '<p>'+treasureUnlockMessage()+'</p></div>'+
      '<button id="buyTreasureButton" type="button" '+((!newTreasure||state.gold<chestCost)?'disabled':'')+'>'+
        '<span>'+(newTreasure?'OPEN CHEST':'LOCKED')+'</span><b>'+money(chestCost)+'</b>'+
      '</button>';
    root.appendChild(treasure);

    const chestButton=treasure.querySelector('#buyTreasureButton');
    if(chestButton&&newTreasure) chestButton.addEventListener('click',buyTreasureDelivery);

    const stats=document.createElement('div');
    stats.className='order-stats';
    stats.innerHTML=
      '<div><span>ORDERS FILLED</span><strong>'+state.ordersCompleted+'</strong></div>'+
      '<div><span>TREASURES</span><strong>'+state.discoveredTreasures.length+' / '+TREASURES.length+'</strong></div>';
    root.appendChild(stats);

    const progress=$('collectionProgress');
    if(progress){
      progress.textContent=state.ordersCompleted+' FILLED';
      progress.classList.remove('complete');
    }

    syncOrderUI();
    refreshIcons();
  }

  function fulfillOrder(orderId){
    const order=ensureOrders();
    if(!order||order.id!==orderId||!orderReady(order)) return false;

    const scene=window.GemdropGameScene;
    if(!scene||!scene.running||typeof scene.consumeGemsForOrder!=='function') return false;
    if(!scene.consumeGemsForOrder(order.requirements)) return false;

    const payout=order.reward;
    state.gold+=payout;
    state.ordersCompleted++;
    state.orders=[];
    ensureOrders();
    save();

    syncOrderUI();
    if($('orderBoard')&&!$('orderBoard').hidden) renderOrders();

    if(typeof scene.noteOrderComplete==='function') scene.noteOrderComplete(payout);
    if(window.GemdropNative) window.GemdropNative.notify('success');
    return true;
  }

  function buyTreasureDelivery(){
    const candidate=undiscoveredEligibleTreasures()[0]||null;
    const cost=treasureChestCost();
    if(!candidate||state.gold<cost) return false;

    state.gold-=cost;
    save();
    const claimed=claimTreasure('purchase');
    if(!claimed){
      state.gold+=cost;
      save();
      return false;
    }

    syncOrderUI();
    renderOrders();
    return true;
  }

  function refreshOrders(){
    if(state.gold<ORDER_REFRESH_COST) return false;

    state.gold-=ORDER_REFRESH_COST;
    state.orders=[];
    ensureOrders();
    save();
    syncOrderUI();
    renderOrders();

    if(window.GemdropNative) window.GemdropNative.haptic([8,14,8]);
    return true;
  }

  let rewardTimers=[];
  let rewardAnimationFrame=0;

  const STOCK_TREASURE_REVEAL={
    format:'gemdrop-animation-recipe',
    formatVersion:1,
    target:'treasure-reveal',
    duration:1600,
    layers:{
      closed:{
        spin:{enabled:false,degPerSec:0},
        keyframes:[
          {t:0,x:0,y:0,scale:.34,rotation:0,opacity:0,ease:'linear'},
          {t:180,x:0,y:0,scale:.84,rotation:0,opacity:1,ease:'backOut'},
          {t:300,x:0,y:0,scale:.76,rotation:0,opacity:1,ease:'easeOut'},
          {t:380,x:-8,y:0,scale:.79,rotation:-4,opacity:1,ease:'easeOut'},
          {t:460,x:9,y:0,scale:.82,rotation:4.5,opacity:1,ease:'easeOut'},
          {t:540,x:-7,y:0,scale:.84,rotation:-3,opacity:1,ease:'easeOut'},
          {t:620,x:6,y:0,scale:.86,rotation:2,opacity:1,ease:'easeOut'},
          {t:760,x:0,y:0,scale:.88,rotation:0,opacity:1,ease:'easeOut'},
          {t:940,x:0,y:0,scale:1.12,rotation:0,opacity:0,ease:'easeOut'}
        ]
      },
      open:{
        spin:{enabled:false,degPerSec:0},
        keyframes:[
          {t:0,x:0,y:0,scale:.46,rotation:0,opacity:0,ease:'linear'},
          {t:760,x:0,y:0,scale:.46,rotation:0,opacity:0,ease:'linear'},
          {t:910,x:0,y:0,scale:.84,rotation:0,opacity:1,ease:'backOut'},
          {t:1040,x:0,y:0,scale:.78,rotation:0,opacity:1,ease:'easeOut'},
          {t:1190,x:0,y:0,scale:1.10,rotation:0,opacity:0,ease:'easeOut'}
        ]
      },
      treasure:{
        spin:{enabled:false,degPerSec:0},
        keyframes:[
          {t:0,x:0,y:0,scale:.34,rotation:0,opacity:0,ease:'linear'},
          {t:1190,x:0,y:0,scale:.34,rotation:0,opacity:0,ease:'linear'},
          {t:1380,x:0,y:0,scale:1.08,rotation:0,opacity:1,ease:'backOut'},
          {t:1500,x:0,y:0,scale:.97,rotation:0,opacity:1,ease:'easeOut'},
          {t:1600,x:0,y:0,scale:1,rotation:0,opacity:1,ease:'easeOut'}
        ]
      },
      rays:{
        spin:{enabled:true,degPerSec:36},
        keyframes:[
          {t:0,x:0,y:0,scale:.96,rotation:0,opacity:.42,ease:'linear'},
          {t:760,x:0,y:0,scale:1.04,rotation:0,opacity:.76,ease:'easeOut'},
          {t:1240,x:0,y:0,scale:1,rotation:0,opacity:.68,ease:'easeOut'},
          {t:1600,x:0,y:0,scale:1,rotation:0,opacity:.68,ease:'linear'}
        ]
      },
      aura:{
        spin:{enabled:false,degPerSec:0},
        keyframes:[
          {t:0,x:0,y:0,scale:.90,rotation:0,opacity:.36,ease:'linear'},
          {t:800,x:0,y:0,scale:1.06,rotation:0,opacity:.62,ease:'easeInOut'},
          {t:1600,x:0,y:0,scale:.94,rotation:0,opacity:.45,ease:'easeInOut'}
        ]
      },
      shock:{
        spin:{enabled:false,degPerSec:0},
        keyframes:[
          {t:0,x:0,y:0,scale:.42,rotation:0,opacity:0,ease:'linear'},
          {t:760,x:0,y:0,scale:.42,rotation:0,opacity:.82,ease:'linear'},
          {t:1120,x:0,y:0,scale:2.18,rotation:0,opacity:0,ease:'easeOut'}
        ]
      }
    }
  };

  function clearRewardTimers(){
    rewardTimers.forEach(id=>window.clearTimeout(id));
    rewardTimers=[];
  }

  function stopRewardAnimation(){
    if(rewardAnimationFrame){
      window.cancelAnimationFrame(rewardAnimationFrame);
      rewardAnimationFrame=0;
    }
  }

  function rewardEase(name,p){
    p=clamp(p,0,1);
    if(name==='easeIn') return p*p*p;
    if(name==='easeOut') return 1-Math.pow(1-p,3);
    if(name==='easeInOut') return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    if(name==='backOut'){
      const c1=1.70158;
      const c3=c1+1;
      return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);
    }
    return p;
  }

  function rewardPoseAt(layer,t){
    const keys=layer.keyframes;
    if(!keys.length) return {x:0,y:0,scale:1,rotation:0,opacity:1};

    let pose;
    if(t<=keys[0].t){
      pose={...keys[0]};
    }else if(t>=keys[keys.length-1].t){
      pose={...keys[keys.length-1]};
    }else{
      let a=keys[0];
      let b=keys[1];
      for(let i=1;i<keys.length;i++){
        if(t<=keys[i].t){
          a=keys[i-1];
          b=keys[i];
          break;
        }
      }
      const raw=(t-a.t)/Math.max(1,b.t-a.t);
      const p=rewardEase(b.ease,raw);
      pose={
        x:a.x+(b.x-a.x)*p,
        y:a.y+(b.y-a.y)*p,
        scale:a.scale+(b.scale-a.scale)*p,
        rotation:a.rotation+(b.rotation-a.rotation)*p,
        opacity:a.opacity+(b.opacity-a.opacity)*p
      };
    }

    if(layer.spin&&layer.spin.enabled){
      pose.rotation+=(Number(layer.spin.degPerSec)||0)*t/1000;
    }
    return pose;
  }

  function applyRewardPose(node,pose,stageScale){
    if(!node) return;
    const x=pose.x*stageScale;
    const y=pose.y*stageScale;
    const opacityScale=node.id==='treasureRevealRays'?.5:1;
    node.style.setProperty(
      'transform',
      'translate(-50%,-50%) translate('+x+'px,'+y+'px) scale('+pose.scale+') rotate('+pose.rotation+'deg)',
      'important'
    );
    node.style.setProperty('opacity',String(pose.opacity*opacityScale),'important');
  }

  function startRewardAnimation(){
    stopRewardAnimation();

    const overlay=$('treasureRewardOverlay');
    const stage=$('treasureChestReveal');
    if(!overlay||!stage) return;

    const nodes={
      closed:$('treasureRevealClosed'),
      open:$('treasureRevealOpen'),
      treasure:$('treasureRewardArt'),
      rays:$('treasureRevealRays'),
      aura:$('treasureRevealAura'),
      shock:$('treasureRevealShock')
    };

    const started=performance.now();

    const frame=now=>{
      if(!overlay.classList.contains('visible')){
        stopRewardAnimation();
        return;
      }

      const elapsed=Math.max(0,now-started);
      const stageWidth=stage.getBoundingClientRect().width||350;
      const stageScale=stageWidth/560;

      for(const key of Object.keys(nodes)){
        const layer=STOCK_TREASURE_REVEAL.layers[key];
        applyRewardPose(nodes[key],rewardPoseAt(layer,elapsed),stageScale);
      }

      rewardAnimationFrame=window.requestAnimationFrame(frame);
    };

    rewardAnimationFrame=window.requestAnimationFrame(frame);
  }

  function claimTreasure(source='purchase'){
    if(source!=='purchase') return null;
    const treasure=randomTreasure();
    if(!treasure) return null;
    const copy=addTreasure(treasure);
    if(!copy) return null;
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
    startRewardAnimation();

    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closedBurstAt=reduced?60:760;
    const openBurstAt=reduced?105:1040;
    const revealAt=reduced?150:1600;

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.add('burst');
      if(window.GemdropSfx) window.GemdropSfx.chest('open');
      if(window.GemdropNative) window.GemdropNative.haptic([18,28,42]);
      else if(navigator.vibrate) navigator.vibrate([18,28,42]);
    },closedBurstAt));

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.add('open-burst');
      if(window.GemdropSfx) window.GemdropSfx.chest('burst');
    },openBurstAt));

    rewardTimers.push(window.setTimeout(()=>{
      overlay.classList.remove('opening','burst','open-burst');
      overlay.classList.add('revealed');
      if(window.GemdropSfx) window.GemdropSfx.chest('reveal');
      if(window.GemdropNative) window.GemdropNative.notify('success');
      rewardTimers=[];
    },revealAt));

    refreshIcons();
    return treasure;
  }

  function closeReward(resume=true){
    clearRewardTimers();
    stopRewardAnimation();
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
    const active=tab==='treasures'||tab==='orders'?tab:'gems';
    const gems=active==='gems';
    const treasures=active==='treasures';
    const orders=active==='orders';

    const gemsTab=$('collectionTabGems');
    const treasuresTab=$('collectionTabTreasures');
    const ordersTab=$('collectionTabOrders');
    const gemsPanel=$('gemCollection');
    const treasuresPanel=$('treasureCollection');
    const ordersPanel=$('orderBoard');

    if(gemsTab){
      gemsTab.classList.toggle('active',gems);
      gemsTab.setAttribute('aria-selected',gems?'true':'false');
    }
    if(treasuresTab){
      treasuresTab.classList.toggle('active',treasures);
      treasuresTab.setAttribute('aria-selected',treasures?'true':'false');
    }
    if(ordersTab){
      ordersTab.classList.toggle('active',orders);
      ordersTab.setAttribute('aria-selected',orders?'true':'false');
    }

    if(gemsPanel) gemsPanel.hidden=!gems;
    if(treasuresPanel) treasuresPanel.hidden=!treasures;
    if(ordersPanel) ordersPanel.hidden=!orders;

    $('collectionTitle').textContent=gems
      ? 'Gem Showcase'
      : treasures
        ? 'Treasure Vault'
        : 'Jeweller';

    if(gems){
      const unlocked=window.GemdropGameScene?window.GemdropGameScene.unlockedTiers.size:1;
      const complete=unlocked>=GEMS.length;
      $('collectionProgress').textContent=complete
        ? GEMS.length+' / '+GEMS.length+' · COMPLETE'
        : unlocked+' / '+GEMS.length;
      $('collectionProgress').classList.toggle('complete',complete);
      updateGemBadges();
    }else if(treasures){
      renderTreasureCollection();
    }else{
      renderOrders();
    }
  }

  function treasureCollectionCard(treasure){
    const discovered=state.discoveredTreasures.includes(treasure.id);
    const copies=copiesFor(treasure.id);
    const button=document.createElement('button');
    button.type='button';
    button.className='treasure-card rarity-'+rarityClass(treasure.rarity)+(discovered?'':' locked');
    button.dataset.treasureId=treasure.id;
    button.disabled=!discovered||!copies.length;
    button.setAttribute('aria-label',discovered?treasure.name+', collected':'Undiscovered treasure');
    button.innerHTML=
      '<div class="treasure-card__art">'+treasureSVG(treasure,!discovered)+'</div>'+
      '<div class="treasure-card__meta">'+
        '<strong>'+(discovered?treasure.name:'Undiscovered')+'</strong>'+
        '<span class="treasure-card__rarity">'+(discovered?treasure.rarity:'???')+'</span>'+
        (discovered?'<span class="treasure-card__collected">COLLECTED</span>':'')+
      '</div>';
    if(discovered&&copies.length) button.addEventListener('click',()=>openTreasureDetail(treasure.id));
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
    root.innerHTML='';

    const intro=document.createElement('div');
    intro.className='treasure-collection-intro';
    intro.innerHTML='<strong>Treasure Collection</strong><span>Fill Jeweller orders, earn coins, and use those coins to open new treasure chests.</span>';
    root.appendChild(intro);

    const grid=document.createElement('div');
    grid.className='treasure-grid';
    TREASURES.forEach(t=>grid.appendChild(treasureCollectionCard(t)));
    root.appendChild(grid);

    const complete=state.discoveredTreasures.length>=TREASURES.length;
    $('collectionProgress').textContent=complete
      ? TREASURES.length+' / '+TREASURES.length+' · COMPLETE'
      : state.discoveredTreasures.length+' / '+TREASURES.length;
    $('collectionProgress').classList.toggle('complete',complete);
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
    backing.src='assets/treasures/no-inlay.png?v=20260923-opt1';
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
      // Inlaid gems keep their normal colour and brightness. The treasure
      // setting should frame the gem, not shade or darken it.
      const inlayPalette={
        ...gem,
        dark:gem.color
      };

      const source=window.ReactiveGemSystem.renderPreviewCanvasSized
        ? window.ReactiveGemSystem.renderPreviewCanvasSized(
            socket.cut,
            gem.color,
            renderW,
            renderH,
            inlayPalette
          )
        : window.ReactiveGemSystem.renderPreviewCanvas(
            socket.cut,
            gem.color,
            0,
            Math.max(renderW,renderH),
            inlayPalette
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

    if(!calc.full){
      copy.completed=false;
      copy.finalValue=null;
      copy.comboId=null;
      save();
      return calc;
    }

    copy.completed=true;
    copy.finalValue=calc.total;
    copy.comboId=calc.combo.id;
    state.treasureRecords[treasure.id]=Math.max(state.treasureRecords[treasure.id]||0,calc.total);

    if(calc.combo.id!=='none'&&!state.comboDiscoveries.includes(calc.combo.id)){
      state.comboDiscoveries.push(calc.combo.id);
    }

    if(!copy.completionAwarded){
      const bonus=Math.max(15,Math.round(calc.total*.15));
      copy.completionAwarded=true;
      copy.completionBonus=bonus;
      state.gold+=bonus;
    }

    save();
    return calc;
  }

  function renderTreasureDetail(){
    const treasure=treasureById(currentTreasureId);
    const copy=getCurrentCopy();
    if(!treasure||!copy) return;

    $('treasureDetailRarity').textContent=treasure.rarity.toUpperCase();
    $('treasureDetailTitle').textContent=treasure.name;
    $('treasureDetailDescription').textContent=treasure.description;
    $('treasureCopyCount').textContent='COLLECTED';
    $('treasureDetailFill').innerHTML=treasureFillSVG(treasure);
    $('treasureDetailArt').innerHTML=treasureSVG(treasure,false,false);
    $('treasureSockets').innerHTML='';
    $('treasureCopyStatus').textContent='Collected treasure';
    $('sellTreasureButton').hidden=true;

    const copyNav=document.querySelector('.treasure-copy-nav');
    if(copyNav) copyNav.hidden=true;
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
    const copies=copiesFor(treasure.id);
    const duplicate=copies.length>1;

    if(!calc.full){
      if(!duplicate) return;
      const salvage=Math.max(10,Math.round(treasure.base*.55));
      state.gold+=salvage;
      state.lifetimeTreasureSales+=salvage;
    }else{
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
    }

    const index=state.treasures.findIndex(t=>t.uid===copy.uid);
    if(index>=0) state.treasures.splice(index,1);

    save();
    ensureOrders();
    updateGemBadges();
    renderHomeOrder();

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
    const orderHud=$('orderHud');
    if(orderHud) orderHud.addEventListener('click',()=>{
      const order=ensureOrders();
      if(orderReady(order)) fulfillOrder(order.id);
    });

    $('collectionTabGems').addEventListener('click',()=>selectCollectionTab('gems'));
    $('collectionTabTreasures').addEventListener('click',()=>selectCollectionTab('treasures'));
    $('collectionTabOrders').addEventListener('click',()=>selectCollectionTab('orders'));

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
    ensureOrders();
    bind();
    renderTreasureCollection();
    renderOrders();
    renderHomeOrder();
    syncOrderUI();
    refreshIcons();
  }

  window.GemdropMeta={
    init,
    onMerge,
    recordRun,
    getProgressSnapshot,
    getChestTarget:()=>CHEST_TARGET,
    getTreasureCount:()=>TREASURES.length,
    getGemCount:tier=>state.gemCounts[tier]||0,
    updateGemBadges,
    syncOrderUI,
    showCollection,
    selectCollectionTab,
    renderTreasureCollection,
    renderOrders,
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