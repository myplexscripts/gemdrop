import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GEMS, SPECIALS } from './data/gems';
import { GemDropEngine, type GameSnapshot } from './game/engine';
import { drawGemPreview } from './game/gemArt';
import './react-app.css';

const EMPTY:GameSnapshot={
  running:false,paused:false,metaPaused:false,score:0,best:0,currentTier:0,nextTier:0,
  currentSpecial:null,nextSpecial:null,ready:false,aim:.5,autoFire:false,muted:false,danger:0,
  status:'',statusKind:'info',powers:{tumble:.44,merge:.16,upgrade:.28},
  unlockedTiers:new Set([0]),result:null
};

function money(n:number){return '$'+Math.round(n||0).toLocaleString();}
function runTime(ms:number){
  const seconds=Math.max(0,Math.floor(ms/1000));
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}

function Icon({name}:{name:string}){
  return <i data-lucide={name} aria-hidden="true" />;
}

function GemCanvas({tier,size=72,special}:{tier:number;size?:number;special?:keyof typeof SPECIALS|null}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!ref.current||!window.ReactiveGemSystem) return;
    try{drawGemPreview(ref.current,tier,special?SPECIALS[special].color:null);}catch{}
  },[tier,size,special]);
  return <canvas ref={ref} width={size} height={size} aria-hidden="true" />;
}

function CollectionGems({snapshot}:{snapshot:GameSnapshot}){
  return <>
    {GEMS.map((gem,tier)=>{
      const unlocked=snapshot.unlockedTiers.has(tier);
      const count=window.GemdropMeta?.getGemCount?.(tier) ?? 0;
      return <article
        className={'gem-card'+(unlocked?'':' locked')}
        data-gem-tier={tier}
        key={gem.name}
        aria-label={unlocked?gem.name:'Undiscovered gem'}
      >
        <div className="gem-card__art">
          <GemCanvas tier={tier} size={128}/>
          <span className="gem-card__count">×{count}</span>
        </div>
        <div className="gem-card__meta">
          <strong className="gem-card__name">{unlocked?gem.name:'Undiscovered'}</strong>
          <span className="gem-card__value">{unlocked?money(gem.score):'???'}</span>
          <p className="gem-card__description">{unlocked?gem.description:'Keep merging to discover this gem.'}</p>
        </div>
      </article>;
    })}
  </>;
}

function LegacyMetaOverlays({snapshot}:{snapshot:GameSnapshot}){
  return <>
    <section id="collectionOverlay" className="collection-overlay" aria-modal="true" role="dialog" aria-labelledby="collectionTitle">
      <div className="collection-screen">
        <header className="collection-header">
          <button id="collectionBack" className="collection-back" type="button" aria-label="Back to home">
            <Icon name="chevron-left"/>
          </button>
          <div><p className="eyebrow">YOUR COLLECTION</p><h2 id="collectionTitle">Gem Showcase</h2></div>
          <div id="collectionProgress" className="collection-progress">{snapshot.unlockedTiers.size} / {GEMS.length}</div>
        </header>
        <nav className="collection-tabs" aria-label="Collection category">
          <button id="collectionTabGems" className="collection-tab active" type="button" aria-selected="true"><Icon name="gem"/><span>Gems</span></button>
          <button id="collectionTabTreasures" className="collection-tab" type="button" aria-selected="false"><Icon name="crown"/><span>Treasures</span></button>
        </nav>
        <div id="gemCollection" className="gem-collection" aria-label="Gem showcase"><CollectionGems snapshot={snapshot}/></div>
        <div id="treasureCollection" className="treasure-collection" aria-label="Treasure collection" hidden />
      </div>
    </section>

    <section id="treasureRewardOverlay" className="treasure-modal" aria-modal="true" role="dialog" aria-labelledby="treasureRewardTitle">
      <div className="treasure-reward-card">
        <button id="treasureRewardClose" className="treasure-close" type="button" aria-label="Close treasure reward"><Icon name="x"/></button>
        <div className="treasure-reward-kicker" aria-hidden="true">TREASURE FOUND</div>
        <div id="treasureChestReveal" className="treasure-chest-reveal" aria-hidden="true">
          <div className="treasure-chest-aura"/>
          <div className="treasure-chest-rays"/>
          <div className="treasure-chest-shockwave"/>
          <img className="treasure-chest-image treasure-chest-closed" src="./assets/treasures/chest-closed.png" alt=""/>
          <img className="treasure-chest-image treasure-chest-open" src="./assets/treasures/chest-open.png" alt=""/>
          <div id="treasureRewardArt" className="treasure-reward-art"/>
          <div className="treasure-reward-sparkles">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>
        </div>
        <div className="treasure-reward-result">
          <p id="treasureRewardRarity" className="eyebrow">TREASURE FOUND</p>
          <h2 id="treasureRewardTitle">Treasure</h2>
          <p id="treasureRewardCopy" className="treasure-reward-copy">Added to your Treasure Vault.</p>
          <button id="treasureRewardView" className="primary-button treasure-reward-view" type="button"><Icon name="check"/><span>GOT IT</span></button>
        </div>
      </div>
    </section>

    <section id="treasureDetailOverlay" className="treasure-detail-overlay" aria-modal="true" role="dialog" aria-labelledby="treasureDetailTitle">
      <div className="treasure-detail-screen">
        <header className="treasure-detail-header">
          <button id="treasureDetailBack" className="collection-back" type="button" aria-label="Back to treasures"><Icon name="chevron-left"/></button>
          <div><p id="treasureDetailRarity" className="eyebrow">TREASURE</p><h2 id="treasureDetailTitle">Treasure</h2></div>
          <div id="treasureCopyCount" className="collection-progress">1 / 1</div>
        </header>
        <div className="treasure-detail-body">
          <div className="treasure-display">
            <div id="treasureDetailFill" className="treasure-detail-fill" aria-hidden="true"/>
            <div id="treasureSockets" className="treasure-sockets" aria-label="Gem inlay sockets"/>
            <div id="treasureDetailArt" className="treasure-detail-art"/>
          </div>
          <p id="treasureDetailDescription" className="treasure-detail-description"/>
          <div className="treasure-copy-nav">
            <button id="treasurePrevCopy" type="button" aria-label="Previous copy"><Icon name="chevron-left"/></button>
            <span id="treasureCopyStatus">Unfinished</span>
            <button id="treasureNextCopy" type="button" aria-label="Next copy"><Icon name="chevron-right"/></button>
          </div>
          <section className="treasure-value-panel">
            <div><span>Base value</span><strong id="treasureBaseValue">$0</strong></div>
            <div><span>Gem value</span><strong id="treasureGemValue">$0</strong></div>
            <div><span id="treasureBonusLabel">Setting bonus</span><strong id="treasureMultiplier">×1.00</strong></div>
            <div className="treasure-value-total"><span>Total value</span><strong id="treasureTotalValue">$0</strong></div>
          </section>
          <button id="sellTreasureButton" className="primary-button treasure-sell" type="button" hidden><Icon name="coins"/><span>SELL TREASURE</span></button>
        </div>
      </div>
    </section>

    <section id="gemPickerOverlay" className="gem-picker-overlay" aria-modal="true" role="dialog" aria-labelledby="gemPickerTitle">
      <button id="gemPickerBackdrop" className="gem-picker-backdrop" type="button" aria-label="Close gem picker"/>
      <div className="gem-picker-sheet">
        <div className="gem-picker-handle" aria-hidden="true"/>
        <div className="gem-picker-heading">
          <div><p className="eyebrow">CHOOSE AN INLAY</p><h2 id="gemPickerTitle">Select a gem</h2></div>
          <button id="gemPickerClose" className="treasure-close" type="button" aria-label="Close gem picker"><Icon name="x"/></button>
        </div>
        <div id="gemPickerList" className="gem-picker-list"/>
        <button id="removeInlayButton" className="secondary-button remove-inlay" type="button" hidden><Icon name="undo-2"/><span>REMOVE GEM</span></button>
      </div>
    </section>
  </>;
}

function AimStrip({engine,snapshot}:{engine:GemDropEngine|null;snapshot:GameSnapshot}){
  const track=useRef<HTMLDivElement>(null);
  const raw=(event:React.PointerEvent)=>{
    const rect=track.current?.getBoundingClientRect();
    if(!rect) return .5;
    return Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(1,rect.width)));
  };
  return <section id="aimStrip" className="aim-strip" aria-label="Gem drop control">
    <Icon name="chevron-left"/>
    <div
      ref={track}
      className="aim-track"
      onPointerDown={e=>{
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        engine?.beginAim(raw(e));
      }}
      onPointerMove={e=>{if(e.buttons||e.pointerType==='touch') engine?.moveAim(raw(e));}}
      onPointerUp={e=>{e.preventDefault();engine?.endAim(raw(e));}}
      onPointerCancel={e=>engine?.endAim(raw(e))}
    >
      <span id="aimHandle" className="aim-handle" style={{left:(snapshot.aim*100)+'%'}}>
        <GemCanvas tier={snapshot.nextTier} size={192} special={snapshot.nextSpecial}/>
      </span>
    </div>
    <Icon name="chevron-right"/>
  </section>;
}

function PowerButton({id,label,icon,charge,disabled,onClick}:{id:string;label:string;icon:string;charge:number;disabled:boolean;onClick:()=>void}){
  return <button
    id={id}
    className={'power-button'+(charge>=.999?' charged':'')}
    type="button"
    disabled={disabled}
    onClick={onClick}
    style={{'--charge':charge.toFixed(3)} as React.CSSProperties}
    aria-label={label+' '+Math.round(charge*100)+'% charged'}
  >
    <Icon name={icon}/><span>{label}</span>
  </button>;
}

function ResultScreen({engine,snapshot}:{engine:GemDropEngine|null;snapshot:GameSnapshot}){
  const result=snapshot.result;
  if(!result) return null;
  const total=result.gemGains.reduce((a,b)=>a+b,0);
  return <motion.section
    id="gameOverOverlay"
    className="overlay visible"
    aria-modal="true"
    role="dialog"
    aria-labelledby="gameOverTitle"
    initial={{opacity:0}}
    animate={{opacity:1}}
  >
    <motion.div className="sheet-card result-card" initial={{scale:.94,y:18}} animate={{scale:1,y:0}}>
      <h2 id="gameOverTitle" className="sr-only">Run complete</h2>
      <header className="result-card__header">
        <div className="sheet-icon"><Icon name="gem"/></div>
        <div className="result-card__headline">
          <p className="eyebrow">RUN COMPLETE</p>
          <div className="result-hero-value"><strong>{money(result.score)}</strong><span>VAULT VALUE</span></div>
        </div>
      </header>
      <div className="run-stat-grid" aria-label="Run statistics">
        <div><span>RUN TIME</span><strong>{runTime(result.durationMs)}</strong></div>
        <div><span>MERGES</span><strong>{result.merges}</strong></div>
        <div><span>BEST CHAIN</span><strong>{Math.max(1,result.bestChain)}×</strong></div>
        <div><span>RUN PEAK</span><strong>{GEMS[result.bestTier]?.name||'Quartz'}</strong></div>
      </div>
      <section className="run-haul">
        <div className="run-section-heading"><span>GEMS EARNED</span><strong>{total}</strong></div>
        <div className="run-gem-haul">
          {result.gemGains.map((count,tier)=>count>0?<div className="run-gem-chip" key={tier}>
            <GemCanvas tier={tier} size={72}/>
            <div><strong>{GEMS[tier].name}</strong><span>+{count}</span></div>
          </div>:null)}
          {!total&&<span className="run-gem-haul__empty">No gems earned this run</span>}
        </div>
      </section>
      <section className="run-treasures">
        <div className="run-section-heading"><span>TREASURES EARNED</span><strong>{result.treasures.length}</strong></div>
        <div className="run-treasure-haul">
          {result.treasures.map((id,index)=>{
            const info=window.GemdropMeta?.getTreasureInfo?.(id);
            return <div className="run-treasure-chip" key={id+index}>
              {info?.art&&<img src={info.art} alt=""/>}
              <div><strong>{info?.name||id.replaceAll('-',' ')}</strong></div>
            </div>;
          })}
          {!result.treasures.length&&<span className="run-treasure-haul__empty">No treasures earned this run</span>}
        </div>
      </section>
      <div className="result-actions result-actions--single">
        <button className="primary-button" type="button" onClick={()=>engine?.returnToMenu()}><Icon name="house"/><span>MAIN MENU</span></button>
      </div>
    </motion.div>
  </motion.section>;
}

export default function App(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [engine,setEngine]=useState<GemDropEngine|null>(null);
  const [snapshot,setSnapshot]=useState<GameSnapshot>(EMPTY);
  const metaLoaded=useRef(false);

  useEffect(()=>{
    if(!canvasRef.current) return;
    const instance=new GemDropEngine(canvasRef.current);
    setEngine(instance);
    window.GemdropGameScene=instance;
    const unsubscribe=instance.subscribe(()=>setSnapshot(instance.getSnapshot()));
    setSnapshot(instance.getSnapshot());

    void instance.init().then(()=>{
      setSnapshot(instance.getSnapshot());
      if(!metaLoaded.current&&!window.GemdropMeta){
        metaLoaded.current=true;
        void import('../../meta.js').then(()=>{
          window.lucide?.createIcons({attrs:{'stroke-width':1.9}});
          setSnapshot(instance.getSnapshot());
        });
      }
    });

    const visibility=()=>{
      if(document.hidden&&instance.running) instance.setPaused(true);
    };
    document.addEventListener('visibilitychange',visibility);

    return()=>{
      document.removeEventListener('visibilitychange',visibility);
      unsubscribe();
      instance.destroy();
      if(window.GemdropGameScene===instance) delete window.GemdropGameScene;
    };
  },[]);

  useEffect(()=>{window.lucide?.createIcons({attrs:{'stroke-width':1.9}});},[snapshot.running,snapshot.paused,snapshot.result,snapshot.status]);

  const startVisible=!snapshot.running&&!snapshot.result;

  const openCollection=()=>{
    window.GemdropMeta?.showCollection('gems');
    window.lucide?.createIcons({attrs:{'stroke-width':1.9}});
  };

  return <>
    <main className="game-app" id="gameApp">
      <header className="hud">
        <div className="hud-controls">
          <button className="hud-button" id="homeButton" type="button" aria-label="Return to main menu" onClick={()=>engine?.returnToMenu()}><Icon name="house"/></button>
          <button className="hud-button hud-button--mute" id="muteButton" type="button" aria-label={snapshot.muted?'Unmute game':'Mute game'} aria-pressed={snapshot.muted} onClick={()=>engine?.setMuted(!snapshot.muted)}>
            <i className="mute-icon mute-icon--sound" data-lucide="volume-2" aria-hidden="true"/>
            <i className="mute-icon mute-icon--muted" data-lucide="volume-x" aria-hidden="true"/>
          </button>
        </div>
        <div id="statusHud" className={'status-hud '+(snapshot.status?'visible ':'')+(snapshot.statusKind||'')} aria-live="polite">
          <span id="statusIcon" className="status-icon" aria-hidden="true"/>
          <span id="statusText" className="status-text">{snapshot.status}</span>
        </div>
        <div className="score"><span>VALUE</span><strong id="score">{money(snapshot.score)}</strong></div>
        <button id="treasureMeter" className="treasure-meter" type="button" aria-label="Treasure chest progress" aria-disabled="true">
          <span className="treasure-meter__track" aria-hidden="true"><span id="treasureMeterFill" className="treasure-meter__fill"/></span>
          <span className="treasure-meter__chest" aria-hidden="true"><img src="./assets/treasures/chest-closed.png" alt=""/></span>
        </button>
      </header>

      <section className={'play-shell'+(snapshot.powers.tumble<.02?' tumbling':'')}>
        <span className="frame-jewel frame-jewel--tl" aria-hidden="true"/>
        <span className="frame-jewel frame-jewel--tr" aria-hidden="true"/>
        <span className="frame-jewel frame-jewel--bl" aria-hidden="true"/>
        <span className="frame-jewel frame-jewel--br" aria-hidden="true"/>
        <div id="game" role="application" aria-label="Gem Drop jewel vault"><canvas ref={canvasRef}/></div>
      </section>

      <AimStrip engine={engine} snapshot={snapshot}/>

      <section className="power-dock" aria-label="Power ups">
        <PowerButton id="powerTumble" label="TUMBLE" icon="rotate-cw" charge={snapshot.powers.tumble} disabled={!snapshot.running||snapshot.paused||snapshot.metaPaused||snapshot.powers.tumble<.999} onClick={()=>engine?.useTumble()}/>
        <PowerButton id="powerCascade" label="MERGE" icon="sparkles" charge={snapshot.powers.merge} disabled={!snapshot.running||snapshot.paused||snapshot.metaPaused||snapshot.powers.merge<.999} onClick={()=>engine?.useMerge()}/>
        <PowerButton id="powerPrism" label="UPGRADE" icon="gem" charge={snapshot.powers.upgrade} disabled={!snapshot.running||snapshot.paused||snapshot.metaPaused||snapshot.powers.upgrade<.999||!snapshot.ready||!!snapshot.currentSpecial||snapshot.currentTier>=GEMS.length-1} onClick={()=>engine?.useUpgrade()}/>
      </section>

      <label className="auto-fire-row" htmlFor="autoFireToggle">
        <span className="auto-fire-label">AUTO FIRE</span>
        <input id="autoFireToggle" className="auto-fire-input" type="checkbox" role="switch" aria-label="Auto fire" checked={snapshot.autoFire} onChange={()=>engine?.toggleAutoFire()}/>
        <span className="auto-fire-switch" aria-hidden="true"><span/></span>
      </label>
    </main>

    <AnimatePresence>
      {startVisible&&<motion.section
        id="startOverlay"
        className="overlay visible start-overlay"
        aria-modal="true"
        role="dialog"
        aria-labelledby="startTitle"
        initial={{opacity:0}}
        animate={{opacity:1}}
        exit={{opacity:0}}
      >
        <div className="start-world" aria-hidden="true">
          <div className="start-aurora start-aurora--one"/><div className="start-aurora start-aurora--two"/>
          <div className="start-stars"/><div className="start-vault-ring start-vault-ring--one"/><div className="start-vault-ring start-vault-ring--two"/>
          <div className="start-gem-field">{Array.from({length:12},(_,i)=><span key={i}/>)}</div>
        </div>
        <motion.div className="start-card" initial={{scale:.97,y:12}} animate={{scale:1,y:0}}>
          <div className="start-brand">
            <div className="hero-crown" aria-hidden="true"><Icon name="crown"/><span/></div>
            <h1 id="startTitle"><span>GEM</span><span>DROP</span></h1>
          </div>
          <div className="start-menu">
            <div className="home-best"><span>BEST VALUE</span><strong id="homeBest">{money(snapshot.best)}</strong></div>
            <div className="start-actions">
              <button id="startButton" className="primary-button" type="button" onClick={()=>engine?.startRun()}><Icon name="play"/><span>PLAY</span></button>
              <button id="collectionButton" className="secondary-button" type="button" onClick={openCollection}><Icon name="gem"/><span>COLLECTION</span></button>
            </div>
          </div>
          <div className="start-version" aria-label="Game version">v0.9.0</div>
        </motion.div>
      </motion.section>}
    </AnimatePresence>

    <LegacyMetaOverlays snapshot={snapshot}/>

    <AnimatePresence>
      {snapshot.running&&snapshot.paused&&<motion.section id="pauseOverlay" className="overlay visible" aria-modal="true" role="dialog" aria-labelledby="pauseTitle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <motion.div className="sheet-card" initial={{scale:.96}} animate={{scale:1}}>
          <div className="sheet-icon"><Icon name="pause"/></div>
          <p className="eyebrow">VAULT PAUSED</p>
          <h2 id="pauseTitle">The jewels are waiting</h2>
          <button id="resumeButton" className="primary-button" type="button" onClick={()=>engine?.setPaused(false)}><Icon name="play"/><span>RESUME</span></button>
          <button id="restartFromPause" className="secondary-button" type="button" onClick={()=>engine?.startRun()}><Icon name="rotate-ccw"/><span>Restart run</span></button>
        </motion.div>
      </motion.section>}
    </AnimatePresence>

    <ResultScreen engine={engine} snapshot={snapshot}/>
  </>;
}
