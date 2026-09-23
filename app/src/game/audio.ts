import * as Tone from 'tone';

let music: Tone.Player | null = null;
let started = false;
let muted = false;
let gemVolume = .75;

export async function unlockAudio(){
  try{
    await Tone.start();
    if(!music){
      music = new Tone.Player({
        url: './assets/audio/main-loop.ogg',
        loop: true,
        autostart: false,
        fadeIn: .18,
        fadeOut: .18,
        volume: -10
      }).toDestination();

      music.onload = () => {
        if(music && music.buffer.duration > 1){
          music.loopStart = 0;
          music.loopEnd = Math.max(.1,music.buffer.duration - 1);
        }
        if(started && music && !music.state.includes('started')) music.start();
      };
    }
    started = true;
    if(music && music.loaded && music.state !== 'started') music.start();
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
    const note=Tone.Frequency(220*Math.pow(2,tier/12));
    synth.triggerAttackRelease(note,.055,undefined,Math.max(.12,Math.min(.75,intensity)));
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
