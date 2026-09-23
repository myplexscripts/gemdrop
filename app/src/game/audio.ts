import * as Tone from 'tone';

let music: Tone.Player | null = null;
let started = false;
let muted = false;
let gemVolume = .75;
let loading:Promise<void>|null=null;

export async function unlockAudio(){
  try{
    await Tone.start();
    started=true;

    if(!music){
      music=new Tone.Player({
        loop:true,
        fadeIn:.18,
        fadeOut:.18,
        volume:-10
      }).toDestination();

      loading=music.load('./assets/audio/main-loop.ogg').then(player=>{
        if(player.buffer.duration>1){
          player.loopStart=0;
          player.loopEnd=Math.max(.1,player.buffer.duration-1);
        }
      }).then(()=>{});
    }

    if(loading) await loading;
    if(music&&started&&music.state!=='started') music.start();
    applyMute();
  }catch{}
}

export function setMuted(value:boolean){
  muted=value;
  applyMute();
}

export function isMuted(){ return muted; }

function applyMute(){
  Tone.getDestination().mute=muted;
}

export function setGemVolume(value:number){
  gemVolume=Math.max(0,Math.min(1,value));
}

export function gemTone(tier:number,intensity=.7){
  if(muted) return;
  try{
    const synth=new Tone.Synth({
      oscillator:{type:'sine'},
      envelope:{attack:.002,decay:.07,sustain:0,release:.08},
      volume:-18 + (gemVolume-1)*12
    }).toDestination();
    const frequency=220*Math.pow(2,tier/12);
    synth.triggerAttackRelease(frequency,.055,undefined,Math.max(.12,Math.min(.75,intensity)));
    setTimeout(()=>synth.dispose(),220);
  }catch{}
}

export function powerTone(freq=520){
  if(muted) return;
  try{
    const synth=new Tone.Synth({
      oscillator:{type:'triangle'},
      envelope:{attack:.002,decay:.12,sustain:0,release:.12},
      volume:-15
    }).toDestination();
    synth.triggerAttackRelease(freq,.10);
    setTimeout(()=>synth.dispose(),300);
  }catch{}
}
