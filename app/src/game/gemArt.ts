import { GEMS } from '../data/gems';

const CUT_ASSETS: Record<string,string> = {
  rectangular: './gems/reactive/01_rectangular.svg',
  circular_starcut: './gems/reactive/02_circular_starcut.svg',
  emerald_stepcut: './gems/reactive/03_emerald_stepcut.svg',
  rectangular_brilliant: './gems/reactive/04_rectangular_brilliant.svg',
  heart: './gems/reactive/05_heart.svg',
  tanzanite: './gems/reactive/06_tanzanite.svg'
};

let readyPromise: Promise<void> | null = null;
const cache = new Map<string,HTMLCanvasElement>();

export function prepareGemArt(){
  if(readyPromise) return readyPromise;
  readyPromise=(async()=>{
    if(!window.ReactiveGemSystem) throw new Error('ReactiveGemSystem unavailable');
    const entries=await Promise.all(Object.entries(CUT_ASSETS).map(async([key,url])=>{
      const response=await fetch(url);
      if(!response.ok) throw new Error('Could not load '+url);
      return [key,await response.text()] as const;
    }));
    window.ReactiveGemSystem.prepare(Object.fromEntries(entries));
  })();
  return readyPromise;
}

function bucketFor(angle:number){
  const tau=Math.PI*2;
  const normalized=((angle%tau)+tau)%tau;
  return Math.round(normalized/tau*23)%24;
}

export function getGemArt(tier:number,bodyAngle=0,size=512){
  const gem=GEMS[Math.max(0,Math.min(GEMS.length-1,tier))];
  const bucket=bucketFor(bodyAngle);
  const key=tier+':'+bucket+':'+size;
  const cached=cache.get(key);
  if(cached) return cached;

  const lightAngle=-Math.PI*.32-(bucket/24)*Math.PI*2;
  const canvas=window.ReactiveGemSystem!.renderPreviewCanvas(
    gem.cut,
    gem.color,
    tier,
    size,
    gem,
    lightAngle
  );
  cache.set(key,canvas);
  return canvas;
}

export function drawGemPreview(
  canvas:HTMLCanvasElement,
  tier:number,
  specialColor?:string|null
){
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx) return;
  const source=getGemArt(tier,0,192);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const max=Math.min(canvas.width,canvas.height)*.88;
  const scale=Math.min(max/source.width,max/source.height);
  const w=source.width*scale;
  const h=source.height*scale;
  ctx.drawImage(source,(canvas.width-w)/2,(canvas.height-h)/2,w,h);

  if(specialColor){
    ctx.save();
    ctx.strokeStyle=specialColor;
    ctx.globalAlpha=.92;
    ctx.lineWidth=6;
    ctx.shadowColor=specialColor;
    ctx.shadowBlur=10;
    ctx.beginPath();
    ctx.arc(canvas.width/2,canvas.height/2,Math.min(w,h)*.47,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}
