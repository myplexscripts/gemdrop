import Matter from 'matter-js';
import {
  AUTO_FIRE_DELAY,
  COLLIDER_SCALE,
  DROP_DELAY,
  DROP_Y,
  FLOOR,
  FRAME_FLOOR,
  FRAME_WALL,
  GEMS,
  H,
  LIMIT_Y,
  POWER_PER_MERGE,
  POWER_START,
  SPECIALS,
  WALL,
  W,
  type SpecialType
} from '../data/gems';
import { gemTone, powerTone, setMuted as setAudioMuted, unlockAudio } from './audio';
import { getGemArt, prepareGemArt } from './gemArt';

const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter;
const AIM_CONTROL_GAIN=1.25;

type PowerKey='tumble'|'merge'|'upgrade';

type GemBodyRecord={
  body:Matter.Body;
  tier:number;
  special:SpecialType|null;
  specialTriggered:boolean;
  merging:boolean;
  born:number;
};

export type RunResult={
  score:number;
  durationMs:number;
  merges:number;
  bestChain:number;
  bestTier:number;
  gemGains:number[];
  treasures:string[];
};

export type GameSnapshot={
  running:boolean;
  paused:boolean;
  metaPaused:boolean;
  score:number;
  best:number;
  currentTier:number;
  nextTier:number;
  currentSpecial:SpecialType|null;
  nextSpecial:SpecialType|null;
  ready:boolean;
  aim:number;
  autoFire:boolean;
  muted:boolean;
  danger:number;
  status:string;
  statusKind:'info'|'reward'|'danger';
  powers:Record<PowerKey,number>;
  unlockedTiers:Set<number>;
  result:RunResult|null;
};

type Listener=()=>void;

export class GemDropEngine{
  readonly canvas:HTMLCanvasElement;
  readonly engine:Matter.Engine;
  readonly world:Matter.World;
  readonly unlockedTiers:Set<number>;

  running=false;
  paused=false;
  metaPaused=false;

  private ctx:CanvasRenderingContext2D;
  private gems=new Map<number,GemBodyRecord>();
  private listeners=new Set<Listener>();
  private raf=0;
  private lastFrame=performance.now();
  private currentTier=0;
  private nextTier=0;
  private currentSpecial:SpecialType|null=null;
  private nextSpecial:SpecialType|null=null;
  private score=0;
  private best=0;
  private ready=false;
  private targetX=W/2;
  private aim=.5;
  private lastDropAt=0;
  private dropGateId:number|null=null;
  private pointerHeld=false;
  private autoFireEnabled=false;
  private muted=false;
  private dangerTime=0;
  private status='';
  private statusKind:GameSnapshot['statusKind']='info';
  private statusTimer=0;
  private powerCharge={...POWER_START};
  private spawnBag:number[]=[];
  private spawnBagShift=-1;
  private lastSpawnTier:number|null=null;
  private spawnRepeat=0;
  private specialGenerated=0;
  private specialCountdown=6;
  private bestTierReached=0;
  private pendingMerges:Array<[number,number]>=[];
  private mergeWindow=0;
  private mergeChain=0;
  private runMerges=0;
  private runBestChain=0;
  private runGemGains=Array(GEMS.length).fill(0);
  private runTreasureClaims:string[]=[];
  private runStartedAt=0;
  private runPausedTotal=0;
  private runPauseStartedAt=0;
  private result:RunResult|null=null;
  private tumble:{started:number;duration:number;nextKick:number;kick:number}|null=null;
  private resizeObserver:ResizeObserver|null=null;
  private particles=Array.from({length:28},(_,i)=>({
    x:(i*173.7)%W,
    y:(i*109.3)%H,
    phase:(i%7)*.83,
    speed:.00028+(i%5)*.00004,
    dx:10+(i%4)*4,
    dy:8+(i%3)*5
  }));

  constructor(canvas:HTMLCanvasElement){
    this.canvas=canvas;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx=ctx;

    this.best=this.readNumber('gemDropBest');
    this.unlockedTiers=this.readUnlocked();
    this.autoFireEnabled=this.readFlag('gemdrop-autofire');
    this.muted=this.readFlag('gemdrop-muted');
    setAudioMuted(this.muted);

    this.engine=Engine.create({
      positionIterations:10,
      velocityIterations:8,
      constraintIterations:2,
      gravity:{x:0,y:1.32,scale:.001}
    });
    this.world=this.engine.world;

    this.createWalls();
    Events.on(this.engine,'collisionStart',(event:any)=>this.onCollisionStart(event));

    this.resizeCanvas();
    if('ResizeObserver' in window&&this.canvas.parentElement){
      this.resizeObserver=new ResizeObserver(()=>this.resizeCanvas());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    window.addEventListener('resize',this.resizeCanvas,{passive:true});
    window.visualViewport?.addEventListener('resize',this.resizeCanvas,{passive:true});
  }

  async init(){
    await prepareGemArt();
    this.emit();
    this.lastFrame=performance.now();
    this.raf=requestAnimationFrame(this.loop);
  }

  destroy(){
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize',this.resizeCanvas);
    window.visualViewport?.removeEventListener('resize',this.resizeCanvas);
    this.resizeObserver?.disconnect();
    this.resizeObserver=null;
    Events.off(this.engine,'collisionStart');
    Composite.clear(this.world,false,true);
    Engine.clear(this.engine);
  }

  subscribe=(listener:Listener)=>{
    this.listeners.add(listener);
    return()=>this.listeners.delete(listener);
  };

  getSnapshot=():GameSnapshot=>({
    running:this.running,
    paused:this.paused,
    metaPaused:this.metaPaused,
    score:this.score,
    best:this.best,
    currentTier:this.currentTier,
    nextTier:this.nextTier,
    currentSpecial:this.currentSpecial,
    nextSpecial:this.nextSpecial,
    ready:this.ready,
    aim:this.aim,
    autoFire:this.autoFireEnabled,
    muted:this.muted,
    danger:this.dangerTime,
    status:this.status,
    statusKind:this.statusKind,
    powers:{...this.powerCharge},
    unlockedTiers:new Set(this.unlockedTiers),
    result:this.result
  });

  private emit(){
    this.listeners.forEach(listener=>listener());
  }

  private readNumber(key:string){
    try{return Number(localStorage.getItem(key)||0)||0;}catch{return 0;}
  }

  private readFlag(key:string){
    try{return localStorage.getItem(key)==='1';}catch{return false;}
  }

  private readUnlocked(){
    try{
      const raw=JSON.parse(localStorage.getItem('gemDropUnlocked')||'[0]');
      if(Array.isArray(raw)) return new Set<number>(raw.filter(Number.isInteger));
    }catch{}
    return new Set<number>([0]);
  }

  private saveUnlocked(){
    try{
      localStorage.setItem('gemDropUnlocked',JSON.stringify([...this.unlockedTiers].sort((a,b)=>a-b)));
    }catch{}
  }

  private resizeCanvas=()=>{
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    this.canvas.width=Math.round(W*dpr);
    this.canvas.height=Math.round(H*dpr);
    this.canvas.style.aspectRatio=W+'/'+H;

    const parent=this.canvas.parentElement;
    if(parent){
      const rect=parent.getBoundingClientRect();
      if(rect.width>0&&rect.height>0){
        const scale=Math.min(rect.width/W,rect.height/H);
        this.canvas.style.width=Math.max(1,Math.floor(W*scale))+'px';
        this.canvas.style.height=Math.max(1,Math.floor(H*scale))+'px';
      }
    }
  };

  private createWalls(){
    const options={isStatic:true,label:'wall',friction:.04,restitution:.005};
    Composite.add(this.world,[
      Bodies.rectangle(W/2,FLOOR+72,W,144,options),
      Bodies.rectangle(WALL-54,H/2,108,H*2,options),
      Bodies.rectangle(W-WALL+54,H/2,108,H*2,options)
    ]);
  }

  private clearBodies(){
    for(const gem of this.gems.values()) Composite.remove(this.world,gem.body);
    this.gems.clear();
    this.pendingMerges.length=0;
    this.dropGateId=null;
    this.engine.gravity.x=0;
    this.engine.gravity.y=1.32;
    this.tumble=null;
  }

  startRun=async()=>{
    await unlockAudio();
    this.clearBodies();
    this.result=null;
    this.running=true;
    this.paused=false;
    this.metaPaused=false;
    this.score=0;
    this.bestTierReached=0;
    this.spawnBag=[];
    this.spawnBagShift=-1;
    this.lastSpawnTier=null;
    this.spawnRepeat=0;
    this.specialGenerated=0;
    this.specialCountdown=this.randomInt(5,8);
    this.currentSpecial=null;
    this.nextSpecial=null;
    this.currentTier=this.randomSpawnTier();
    this.currentSpecial=this.rollSpecialDrop();
    this.nextTier=this.randomSpawnTier();
    this.nextSpecial=this.rollSpecialDrop();
    this.unlockTier(this.currentTier);
    this.unlockTier(this.nextTier);
    this.ready=true;
    this.targetX=W/2;
    this.aim=.5;
    this.lastDropAt=0;
    this.dangerTime=0;
    this.mergeWindow=0;
    this.mergeChain=0;
    this.runMerges=0;
    this.runBestChain=0;
    this.runGemGains=Array(GEMS.length).fill(0);
    this.runTreasureClaims=[];
    this.runStartedAt=performance.now();
    this.runPausedTotal=0;
    this.runPauseStartedAt=0;
    this.powerCharge={...POWER_START};
    this.status='';
    this.emit();
  };

  returnToMenu=()=>{
    this.running=false;
    this.paused=false;
    this.metaPaused=false;
    this.pointerHeld=false;
    this.result=null;
    this.clearBodies();
    this.status='';
    this.emit();
  };

  setPaused=(value:boolean)=>{
    if(!this.running) return;
    this.paused=value;
    this.syncRunClockPause();
    if(value&&this.tumble){
      this.tumble=null;
      this.engine.gravity.x=0;
      this.engine.gravity.y=1.32;
    }
    this.emit();
  };

  setMetaPaused=(value:boolean)=>{
    if(!this.running) return;
    this.metaPaused=!!value;
    this.syncRunClockPause();
    this.emit();
  };

  noteTreasureClaim=(id:string)=>{
    if(id) this.runTreasureClaims.push(id);
  };

  setMuted=(value:boolean)=>{
    this.muted=value;
    try{localStorage.setItem('gemdrop-muted',value?'1':'0');}catch{}
    setAudioMuted(value);
    this.emit();
  };

  toggleAutoFire=()=>{
    this.autoFireEnabled=!this.autoFireEnabled;
    try{localStorage.setItem('gemdrop-autofire',this.autoFireEnabled?'1':'0');}catch{}
    this.emit();
  };

  beginAim=(raw:number)=>{
    if(!this.running||this.paused||this.metaPaused) return;
    void unlockAudio();
    this.pointerHeld=true;
    this.setAim(raw);
    if(this.autoFireEnabled) this.dropCurrent();
  };

  moveAim=(raw:number)=>{
    if(!this.pointerHeld||!this.running||this.paused||this.metaPaused) return;
    this.setAim(raw);
  };

  endAim=(raw:number)=>{
    if(!this.pointerHeld) return;
    if(this.running&&!this.paused&&!this.metaPaused){
      this.setAim(raw);
      if(!this.autoFireEnabled) this.dropCurrent();
    }
    this.pointerHeld=false;
  };

  private setAim(raw:number){
    const u=Math.max(0,Math.min(1,.5+(Math.max(0,Math.min(1,raw))-.5)*AIM_CONTROL_GAIN));
    this.aim=u;
    const gem=GEMS[this.currentTier];
    const min=WALL+gem.radius*COLLIDER_SCALE;
    const max=W-WALL-gem.radius*COLLIDER_SCALE;
    this.targetX=min+(max-min)*u;
    this.emit();
  }

  dropCurrent=()=>{
    const now=performance.now();
    if(!this.running||this.paused||this.metaPaused||!this.ready) return;
    if(now-this.lastDropAt<DROP_DELAY) return;

    const tier=this.currentTier;
    const t=GEMS[tier];
    const min=WALL+t.radius*COLLIDER_SCALE;
    const max=W-WALL-t.radius*COLLIDER_SCALE;
    const x=Math.max(min,Math.min(max,this.targetX));
    const gem=this.createGem(x,DROP_Y,tier,this.currentSpecial);
    Body.setVelocity(gem.body,{x:0,y:.15});

    this.lastDropAt=now;
    this.ready=false;
    this.dropGateId=gem.body.id;

    this.currentTier=this.nextTier;
    this.currentSpecial=this.nextSpecial;
    this.nextTier=this.randomSpawnTier();
    this.nextSpecial=this.rollSpecialDrop();
    this.unlockTier(this.currentTier);
    this.unlockTier(this.nextTier);

    this.showStatus(this.currentSpecial ? SPECIALS[this.currentSpecial].label.toUpperCase()+' GEM' : '', 'reward',this.currentSpecial?900:0);
    this.emit();
    navigator.vibrate?.(5);
  };

  useTumble=()=>{
    if(!this.running||this.paused||this.metaPaused||this.tumble||this.powerCharge.tumble<.999||!this.gems.size) return;
    this.powerCharge.tumble=0;
    const now=performance.now();
    this.tumble={started:now,duration:1950,nextKick:now,kick:0};
    for(const gem of this.gems.values()){
      Sleeping.set(gem.body,false);
      Body.setVelocity(gem.body,{
        x:this.clamp(gem.body.velocity.x+this.random(-4.2,4.2),-9.5,9.5),
        y:this.clamp(gem.body.velocity.y+this.random(-3.4,1),-7.4,7.2)
      });
      Body.setAngularVelocity(gem.body,this.clamp(gem.body.angularVelocity+this.random(-.14,.14),-.21,.21));
    }
    this.showStatus('TUMBLE!','reward',1100);
    powerTone(210);
    navigator.vibrate?.([10,18,10,18,12]);
    this.emit();
  };

  useMerge=()=>{
    if(!this.running||this.paused||this.metaPaused||this.powerCharge.merge<.999) return;
    const pairs=this.matchingPairs();
    if(!pairs.length){
      this.showStatus('NO MATCHES TO MERGE','info',900);
      return;
    }
    this.powerCharge.merge=0;
    this.pendingMerges.push(...pairs);
    this.showStatus('MERGE ×'+pairs.length,'reward',1050);
    powerTone(520);
    navigator.vibrate?.([8,20,8]);
    this.emit();
  };

  useUpgrade=()=>{
    if(!this.running||this.paused||this.metaPaused||this.powerCharge.upgrade<.999||!this.ready||this.currentSpecial||this.currentTier>=GEMS.length-1) return;
    this.powerCharge.upgrade=0;
    this.currentTier=Math.min(this.currentTier+1,GEMS.length-1);
    this.unlockTier(this.currentTier);
    this.showStatus('UPGRADE!','reward',1100);
    powerTone(680);
    navigator.vibrate?.([7,13,7]);
    this.emit();
  };

  private createGem(x:number,y:number,tier:number,special:SpecialType|null=null){
    const t=GEMS[tier];
    const options:Matter.IBodyDefinition={
      label:'gem',
      restitution:.006,
      friction:.032,
      frictionStatic:.022,
      frictionAir:.0028,
      density:.0012,
      sleepThreshold:0
    };

    const shape=window.ReactiveGemSystem?.collisionShape(t.cut,t.radius*COLLIDER_SCALE);
    let body:Matter.Body;
    if(shape?.type==='circle'){
      body=Bodies.circle(x,y,shape.radius,options);
    }else if(shape&&'vertices' in shape&&shape.vertices.length>=3){
      body=Bodies.fromVertices(x,y,[shape.vertices],options,true) as Matter.Body;
    }else{
      body=Bodies.circle(x,y,t.radius*COLLIDER_SCALE,options);
    }

    let angle=this.random(-.131,.131);
    if(Math.abs(angle)<.028) angle=angle<0?-.028:.028;
    Body.setAngle(body,angle);
    Body.setAngularVelocity(body,this.random(-.006,.006));
    Composite.add(this.world,body);

    const record:GemBodyRecord={
      body,tier,special,specialTriggered:false,merging:false,born:performance.now()
    };
    this.gems.set(body.id,record);
    return record;
  }

  private removeGem(gem:GemBodyRecord){
    this.gems.delete(gem.body.id);
    Composite.remove(this.world,gem.body);
    if(this.dropGateId===gem.body.id) this.dropGateId=null;
  }

  private onCollisionStart(event:any){
    for(const pair of event.pairs||[]){
      const a=this.gems.get(pair.bodyA?.id);
      const b=this.gems.get(pair.bodyB?.id);
      if(!a&&!b) continue;

      if(a&&b){
        if(a.special||b.special){
          if(a.special) this.activateSpecial(a,b);
          if(b.special) this.activateSpecial(b,a);
          continue;
        }

        const dvx=b.body.velocity.x-a.body.velocity.x;
        const dvy=b.body.velocity.y-a.body.velocity.y;
        const speed=Math.hypot(dvx,dvy);
        if(speed>.55) gemTone(Math.max(a.tier,b.tier),Math.min(1,speed/5));
        if(a.tier===b.tier&&!a.merging&&!b.merging){
          a.merging=b.merging=true;
          this.pendingMerges.push([a.body.id,b.body.id]);
        }
      }
    }
  }

  private activateSpecial(gem:GemBodyRecord,target:GemBodyRecord|null){
    if(!gem.special||gem.specialTriggered) return;
    if(gem.special==='fusion'&&(!target||target.special)) return;
    gem.specialTriggered=true;

    const type=gem.special;
    const x=gem.body.position.x;
    const y=gem.body.position.y;

    if(type==='scatter'){
      this.removeGem(gem);
      for(const other of this.gems.values()){
        Sleeping.set(other.body,false);
        const dx=other.body.position.x-x;
        const dy=other.body.position.y-y;
        const distance=Math.max(42,Math.hypot(dx,dy));
        const nx=dx/distance;
        const ny=dy/distance;
        const falloff=1-this.clamp(distance/760,0,.72);
        const force=2.3+falloff*2.4;
        Body.setVelocity(other.body,{
          x:this.clamp(other.body.velocity.x+nx*force+this.random(-1.65,1.65),-10.5,10.5),
          y:this.clamp(other.body.velocity.y+ny*force+this.random(-1.4,1.15),-8.2,8.2)
        });
        Body.setAngularVelocity(other.body,this.clamp(other.body.angularVelocity+this.random(-.13,.13),-.23,.23));
      }
      this.showStatus('SCATTER GEM!','reward',1100);
      powerTone(230);
      navigator.vibrate?.([12,18,12,24]);
      return;
    }

    if(type==='charge'){
      this.removeGem(gem);
      this.powerCharge.tumble=this.clamp(this.powerCharge.tumble+.28,0,1);
      this.powerCharge.merge=this.clamp(this.powerCharge.merge+.28,0,1);
      this.powerCharge.upgrade=this.clamp(this.powerCharge.upgrade+.28,0,1);
      this.showStatus('CHARGE GEM +28%','reward',1150);
      powerTone(640);
      navigator.vibrate?.([8,12,8]);
      this.emit();
      return;
    }

    if(type==='fusion'&&target){
      const tier=target.tier;
      const next=Math.min(tier+1,GEMS.length-1);
      const position={...target.body.position};
      const velocity={x:target.body.velocity.x*.45,y:target.body.velocity.y*.3};
      this.removeGem(gem);
      if(next===tier){
        this.addScore(Math.max(1,Math.round(GEMS[tier].score*.5)));
      }else{
        this.removeGem(target);
        const upgraded=this.createGem(position.x,position.y,next);
        Body.setVelocity(upgraded.body,velocity);
        this.bestTierReached=Math.max(this.bestTierReached,next);
        this.addScore(Math.max(1,Math.round(GEMS[next].score*.75)));
        this.unlockTier(next);
      }
      this.showStatus('FUSION GEM · '+GEMS[next].name.toUpperCase(),'reward',1250);
      powerTone(720);
      navigator.vibrate?.([9,16,9]);
    }
  }

  private processMerges(){
    if(!this.pendingMerges.length) return;
    const queue=this.pendingMerges.splice(0);
    const used=new Set<number>();

    for(const [idA,idB] of queue){
      if(used.has(idA)||used.has(idB)) continue;
      const a=this.gems.get(idA);
      const b=this.gems.get(idB);
      if(!a||!b||a.tier!==b.tier||a.special||b.special){
        if(a) a.merging=false;
        if(b) b.merging=false;
        continue;
      }

      used.add(idA); used.add(idB);
      const tier=a.tier;
      const next=tier+1;
      const gate=this.dropGateId===idA||this.dropGateId===idB;
      const x=(a.body.position.x+b.body.position.x)/2;
      const y=(a.body.position.y+b.body.position.y)/2;
      const vx=(a.body.velocity.x+b.body.velocity.x)*.32;
      const vy=(a.body.velocity.y+b.body.velocity.y)*.18;
      const av=(a.body.angularVelocity+b.body.angularVelocity)*.22;

      this.removeGem(a);
      this.removeGem(b);
      this.rechargePowers(tier);
      this.mergeChain=this.mergeWindow>0?this.mergeChain+1:1;
      this.mergeWindow=.70;
      this.runMerges++;
      this.runBestChain=Math.max(this.runBestChain,this.mergeChain);
      if(tier>=0&&tier<this.runGemGains.length) this.runGemGains[tier]++;

      if(next>=GEMS.length){
        this.addScore(GEMS[tier].score*2);
        window.GemdropMeta?.onMerge(tier,this.mergeChain,{master:true,resultTier:tier});
        if(gate) this.dropGateId=null;
        continue;
      }

      const merged=this.createGem(x,y,next);
      if(gate) this.dropGateId=merged.body.id;
      Body.setVelocity(merged.body,{x:vx,y:vy});
      Body.setAngularVelocity(merged.body,this.clamp(av,-.025,.025));

      this.bestTierReached=Math.max(this.bestTierReached,next);
      this.addScore(GEMS[next].score);
      window.GemdropMeta?.onMerge(tier,this.mergeChain,{resultTier:next});
      this.unlockTier(next);

      if(next===GEMS.length-1){
        this.showStatus('CROWNSTONE FORGED','reward',2400);
        navigator.vibrate?.([18,35,18,55]);
      }else if(this.mergeChain>=2){
        this.showStatus(this.mergeChain+'× CHAIN  +$'+GEMS[next].score,'reward',850);
      }

      gemTone(next,.72);
    }
    this.emit();
  }

  private rechargePowers(tier:number){
    const tierBonus=1+Math.min(.4,tier*.025);
    this.powerCharge.tumble=this.clamp(this.powerCharge.tumble+POWER_PER_MERGE.tumble*tierBonus,0,1);
    this.powerCharge.merge=this.clamp(this.powerCharge.merge+POWER_PER_MERGE.merge*tierBonus,0,1);
    this.powerCharge.upgrade=this.clamp(this.powerCharge.upgrade+POWER_PER_MERGE.upgrade*tierBonus,0,1);
  }

  private matchingPairs(){
    const records=[...this.gems.values()].filter(g=>!g.special&&!g.merging);
    const used=new Set<number>();
    const pairs:Array<[number,number]>=[];
    for(let i=0;i<records.length;i++){
      const a=records[i];
      if(used.has(a.body.id)) continue;
      for(let j=i+1;j<records.length;j++){
        const b=records[j];
        if(a.tier!==b.tier||used.has(b.body.id)) continue;
        const dx=a.body.position.x-b.body.position.x;
        const dy=a.body.position.y-b.body.position.y;
        const touch=(GEMS[a.tier].radius+GEMS[b.tier].radius)*COLLIDER_SCALE*1.12;
        if(dx*dx+dy*dy<=touch*touch){
          used.add(a.body.id);used.add(b.body.id);
          a.merging=b.merging=true;
          pairs.push([a.body.id,b.body.id]);
          break;
        }
      }
    }
    return pairs;
  }

  private updateTumble(now:number){
    if(!this.tumble) return;
    const state=this.tumble;
    const p=this.clamp((now-state.started)/state.duration,0,1);
    const envelope=Math.sin(Math.PI*p);
    const wave=Math.sin(p*Math.PI*18);
    this.engine.gravity.x=wave*2.15*envelope;
    this.engine.gravity.y=1.32-Math.max(0,Math.sin(p*Math.PI*12))*2.15*envelope;

    if(now>=state.nextKick){
      state.nextKick=now+70;
      state.kick++;
      const direction=state.kick%2?1:-1;
      for(const gem of this.gems.values()){
        Sleeping.set(gem.body,false);
        const horizontal=direction*this.random(1.2,2.55)*envelope+this.random(-1.05,1.05);
        const vertical=this.random(-1.75,.65)*envelope;
        Body.setVelocity(gem.body,{
          x:this.clamp(gem.body.velocity.x+horizontal,-10,10),
          y:this.clamp(gem.body.velocity.y+vertical,-7.8,7.8)
        });
        Body.setAngularVelocity(gem.body,this.clamp(gem.body.angularVelocity+this.random(-.075,.075),-.22,.22));
      }
    }

    if(p>=1){
      this.engine.gravity.x=0;
      this.engine.gravity.y=1.32;
      this.tumble=null;
    }
  }

  private updateDropGate(now:number){
    if(!this.running||this.paused||this.metaPaused||this.ready) return;
    if(this.dropGateId===null&&now-this.lastDropAt>=DROP_DELAY){
      this.ready=true;
      this.emit();
      return;
    }
    if(this.dropGateId!==null){
      const gate=this.gems.get(this.dropGateId);
      if(!gate){
        this.dropGateId=null;
        this.ready=true;
        this.emit();
      }else if(now-this.lastDropAt>=90&&gate.body.bounds.min.y>LIMIT_Y+2){
        this.dropGateId=null;
        this.ready=true;
        this.emit();
      }
    }
  }

  private updateDanger(dt:number){
    if(!this.running||this.paused||this.metaPaused) return;
    const high=[...this.gems.values()].some(g=>{
      if(performance.now()-g.born<420) return false;
      return g.body.bounds.min.y<LIMIT_Y+5&&Math.abs(g.body.velocity.y)<1.8;
    });
    if(high) this.dangerTime+=dt;
    else this.dangerTime=Math.max(0,this.dangerTime-dt*3.8);

    if(this.dangerTime>=.18&&this.statusKind!=='danger') this.showStatus('TOO HIGH','danger',0);
    else if(this.dangerTime<.12&&this.statusKind==='danger') this.clearStatus();

    if(this.dangerTime>=1.75) this.endGame();
  }

  private addScore(points:number){
    this.score+=points;
    if(this.score>this.best){
      this.best=this.score;
      try{localStorage.setItem('gemDropBest',String(this.best));}catch{}
    }
    this.emit();
  }

  private unlockTier(tier:number){
    if(tier<0||tier>=GEMS.length||this.unlockedTiers.has(tier)) return;
    this.unlockedTiers.add(tier);
    this.saveUnlocked();
    this.emit();
  }

  private spawnTierShift(){
    if(this.bestTierReached>=16) return 4;
    if(this.bestTierReached>=13) return 3;
    if(this.bestTierReached>=10) return 2;
    if(this.bestTierReached>=7) return 1;
    return 0;
  }

  private refillSpawnBag(shift=this.spawnTierShift()){
    const counts=[5,4,3,2,1];
    this.spawnBag=[];
    counts.forEach((count,index)=>{
      const tier=Math.min(GEMS.length-1,shift+index);
      for(let i=0;i<count;i++) this.spawnBag.push(tier);
    });
    for(let i=this.spawnBag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [this.spawnBag[i],this.spawnBag[j]]=[this.spawnBag[j],this.spawnBag[i]];
    }
    this.spawnBagShift=shift;
  }

  private randomSpawnTier(){
    const shift=this.spawnTierShift();
    if(!this.spawnBag.length||this.spawnBagShift!==shift) this.refillSpawnBag(shift);
    let index=this.spawnBag.length-1;
    let tier=this.spawnBag[index];
    if(tier===this.lastSpawnTier&&this.spawnRepeat>=2){
      const alt=this.spawnBag.findIndex(value=>value!==tier);
      if(alt>=0) [this.spawnBag[alt],this.spawnBag[index]]=[this.spawnBag[index],this.spawnBag[alt]];
    }
    tier=this.spawnBag.pop() ?? shift;
    if(tier===this.lastSpawnTier) this.spawnRepeat++;
    else{this.lastSpawnTier=tier;this.spawnRepeat=1;}
    return tier;
  }

  private rollSpecialDrop():SpecialType|null{
    this.specialGenerated++;
    if(this.specialGenerated<=8) return null;
    this.specialCountdown=Math.max(0,this.specialCountdown-1);
    if(this.specialCountdown>0) return null;
    this.specialCountdown=this.randomInt(14,22);
    const r=Math.random();
    if(r<.52) return 'scatter';
    if(r<.82) return 'fusion';
    return 'charge';
  }

  private showStatus(text:string,kind:GameSnapshot['statusKind']='info',duration=1300){
    if(this.statusTimer) window.clearTimeout(this.statusTimer);
    this.status=text;
    this.statusKind=kind;
    this.emit();
    if(duration>0&&text){
      this.statusTimer=window.setTimeout(()=>this.clearStatus(),duration);
    }
  }

  private clearStatus(){
    if(this.statusTimer) window.clearTimeout(this.statusTimer);
    this.statusTimer=0;
    this.status='';
    this.statusKind='info';
    this.emit();
  }

  private syncRunClockPause(){
    if(!this.runStartedAt) return;
    const shouldPause=this.running&&(this.paused||this.metaPaused);
    if(shouldPause&&!this.runPauseStartedAt) this.runPauseStartedAt=performance.now();
    else if(!shouldPause&&this.runPauseStartedAt){
      this.runPausedTotal+=performance.now()-this.runPauseStartedAt;
      this.runPauseStartedAt=0;
    }
  }

  private runElapsedMs(){
    if(!this.runStartedAt) return 0;
    const now=performance.now();
    const currentPause=this.runPauseStartedAt?now-this.runPauseStartedAt:0;
    return Math.max(0,now-this.runStartedAt-this.runPausedTotal-currentPause);
  }

  private endGame(){
    if(!this.running) return;
    const durationMs=this.runElapsedMs();
    this.running=false;
    this.ready=false;
    this.pointerHeld=false;
    this.paused=false;
    this.metaPaused=false;
    this.engine.gravity.x=0;
    this.engine.gravity.y=1.32;
    this.tumble=null;
    window.GemdropMeta?.recordRun({
      score:this.score,
      merges:this.runMerges,
      bestChain:this.runBestChain,
      bestTier:this.bestTierReached
    });
    this.result={
      score:this.score,
      durationMs,
      merges:this.runMerges,
      bestChain:this.runBestChain,
      bestTier:this.bestTierReached,
      gemGains:[...this.runGemGains],
      treasures:[...this.runTreasureClaims]
    };
    this.emit();
  }

  private loop=(now:number)=>{
    const delta=Math.min(34,Math.max(0,now-this.lastFrame));
    this.lastFrame=now;

    if(this.running&&!this.paused&&!this.metaPaused){
      this.updateTumble(now);
      Engine.update(this.engine,delta);
      this.processMerges();
      this.updateDropGate(now);
      if(this.mergeWindow>0){
        this.mergeWindow=Math.max(0,this.mergeWindow-delta/1000);
        if(this.mergeWindow===0) this.mergeChain=0;
      }
      if(this.autoFireEnabled&&this.pointerHeld&&this.ready&&now-this.lastDropAt>=AUTO_FIRE_DELAY){
        this.dropCurrent();
      }
      this.updateDanger(delta/1000);
    }

    this.draw(now);
    this.raf=requestAnimationFrame(this.loop);
  };

  private draw(now:number){
    const dpr=this.canvas.width/W;
    const ctx=this.ctx;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);

    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#250b3d');
    bg.addColorStop(.45,'#1d092f');
    bg.addColorStop(1,'#100517');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,W,H);

    for(let i=0;i<this.particles.length;i++){
      const p=this.particles[i];
      const x=p.x+Math.sin(now*p.speed+p.phase)*p.dx;
      const y=p.y+Math.cos(now*p.speed*.83+p.phase)*p.dy;
      ctx.fillStyle=['#ffc65b','#f36ac8','#a46cff','#ffffff'][i%4]+'35';
      ctx.beginPath();
      ctx.arc(x,y,.8+(i%3)*.25,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle='rgba(255,210,92,.16)';
    ctx.fillRect(FRAME_WALL,FRAME_FLOOR,W-FRAME_WALL*2,8);

    const lineActive=this.dangerTime>.08;
    ctx.strokeStyle=lineActive?'rgba(255,93,134,.86)':'rgba(255,202,88,.72)';
    ctx.lineWidth=lineActive?3:2;
    ctx.beginPath();
    ctx.moveTo(WALL+24,LIMIT_Y);
    ctx.lineTo(W-WALL-12,LIMIT_Y);
    ctx.stroke();

    for(const gem of this.gems.values()) this.drawGem(gem);

    if(this.running&&!this.paused&&this.ready){
      this.drawPreview();
    }
    if(this.running&&!this.paused) this.drawDropper(now);

    ctx.setTransform(1,0,0,1,0,0);
  }

  private drawGem(record:GemBodyRecord){
    const {body,tier,special}=record;
    const t=GEMS[tier];
    const art=getGemArt(tier,body.angle,512);
    const visualScale=window.ReactiveGemSystem?.visualScale?.(t.cut) ?? 1;
    const diameter=t.radius*2*.97*visualScale;

    this.ctx.save();
    this.ctx.translate(body.position.x+3,body.position.y+7);
    this.ctx.rotate(body.angle);
    this.ctx.globalAlpha=.28;
    this.ctx.filter='brightness(0)';
    this.ctx.drawImage(art,-diameter/2,-diameter/2,diameter,diameter);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(body.position.x,body.position.y);
    this.ctx.rotate(body.angle);
    this.ctx.filter='none';
    this.ctx.globalAlpha=1;
    this.ctx.drawImage(art,-diameter/2,-diameter/2,diameter,diameter);
    if(special){
      this.ctx.strokeStyle=SPECIALS[special].color;
      this.ctx.lineWidth=4;
      this.ctx.globalAlpha=.72+.14*Math.sin(performance.now()*.005);
      this.ctx.beginPath();
      this.ctx.arc(0,0,t.radius*1.05,0,Math.PI*2);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawPreview(){
    const t=GEMS[this.currentTier];
    const art=getGemArt(this.currentTier,0,512);
    const visualScale=window.ReactiveGemSystem?.visualScale?.(t.cut) ?? 1;
    const diameter=t.radius*2*.97*visualScale;
    const min=WALL+t.radius*COLLIDER_SCALE;
    const max=W-WALL-t.radius*COLLIDER_SCALE;
    const x=this.clamp(this.targetX,min,max);
    this.ctx.save();
    this.ctx.globalAlpha=.98;
    this.ctx.drawImage(art,x-diameter/2,DROP_Y-diameter/2,diameter,diameter);
    if(this.currentSpecial){
      this.ctx.strokeStyle=SPECIALS[this.currentSpecial].color;
      this.ctx.lineWidth=4;
      this.ctx.globalAlpha=.85;
      this.ctx.beginPath();
      this.ctx.arc(x,DROP_Y,t.radius*1.06,0,Math.PI*2);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawDropper(now:number){
    const t=GEMS[this.currentTier];
    const min=WALL+t.radius*COLLIDER_SCALE;
    const max=W-WALL-t.radius*COLLIDER_SCALE;
    const x=this.clamp(this.targetX,min,max);
    const pulse=.82+.10*Math.sin(now*.006);
    const ctx=this.ctx;
    ctx.save();
    ctx.fillStyle='rgba(255,198,78,'+pulse+')';
    ctx.strokeStyle='rgba(255,237,163,.62)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x-31,20);
    ctx.lineTo(x-22,42);
    ctx.lineTo(x-14,34);
    ctx.lineTo(x-7,45);
    ctx.lineTo(x,31);
    ctx.lineTo(x+7,45);
    ctx.lineTo(x+14,34);
    ctx.lineTo(x+22,42);
    ctx.lineTo(x+31,20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle='#21082c';
    ctx.beginPath();
    ctx.ellipse(x,44,15,6,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  private random(a:number,b:number){return a+Math.random()*(b-a);}
  private randomInt(a:number,b:number){return Math.floor(this.random(a,b+1));}
  private clamp(n:number,a:number,b:number){return Math.max(a,Math.min(b,n));}
}
