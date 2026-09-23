import { chromium } from '@playwright/test';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const failures=[];

page.on('pageerror',error=>failures.push('pageerror: '+error.message));
page.on('console',message=>{
  if(message.type()==='error') failures.push('console: '+message.text());
});

try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.waitForSelector('#startButton',{state:'visible'});
  await page.waitForFunction(()=>Boolean(window.GemdropGameScene&&window.GemdropMeta));

  const version=(await page.locator('.start-version').textContent())?.trim();
  if(version!=='v0.9.0') failures.push('wrong version: '+version);

  await page.click('#collectionButton');
  await page.waitForSelector('#collectionOverlay.visible',{state:'visible'});
  await page.click('#collectionBack');
  await page.waitForFunction(()=>!document.getElementById('collectionOverlay')?.classList.contains('visible'));

  await page.click('#startButton');
  await page.waitForFunction(()=>window.GemdropGameScene?.running===true);
  await page.waitForSelector('#game canvas',{state:'visible'});

  const fit=await page.evaluate(()=>{
    const canvas=document.querySelector('#game canvas');
    const host=document.querySelector('#game');
    if(!(canvas instanceof HTMLElement)||!(host instanceof HTMLElement)) return null;
    const c=canvas.getBoundingClientRect();
    const h=host.getBoundingClientRect();
    return {
      canvas:{left:c.left,top:c.top,right:c.right,bottom:c.bottom,width:c.width,height:c.height},
      host:{left:h.left,top:h.top,right:h.right,bottom:h.bottom,width:h.width,height:h.height},
      pageWidth:document.documentElement.scrollWidth,
      viewportWidth:window.innerWidth
    };
  });
  if(!fit) failures.push('missing canvas geometry');
  else{
    if(fit.canvas.left<fit.host.left-1||fit.canvas.right>fit.host.right+1||fit.canvas.top<fit.host.top-1||fit.canvas.bottom>fit.host.bottom+1){
      failures.push('canvas overflows playfield');
    }
    const ratio=fit.canvas.width/Math.max(1,fit.canvas.height);
    const expected=640/936;
    if(Math.abs(ratio-expected)>.015) failures.push('canvas aspect ratio drift: '+ratio);
    if(fit.pageWidth>fit.viewportWidth+1) failures.push('horizontal overflow');
  }

  const track=page.locator('.aim-track');
  const box=await track.boundingBox();
  if(!box) failures.push('missing aim track');
  else{
    await page.mouse.move(box.x+box.width*.25,box.y+box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width*.75,box.y+box.height/2,{steps:5});
    await page.mouse.up();
    await page.waitForTimeout(550);
  }

  await page.locator('#autoFireToggle').check();
  if(!(await page.locator('#autoFireToggle').isChecked())) failures.push('auto fire toggle failed');

  const box2=await track.boundingBox();
  if(box2){
    await page.mouse.move(box2.x+box2.width*.45,box2.y+box2.height/2);
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.move(box2.x+box2.width*.6,box2.y+box2.height/2,{steps:4});
    await page.waitForTimeout(500);
    await page.mouse.up();
  }

  await page.setViewportSize({width:430,height:932});
  await page.waitForTimeout(250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  if(overflow) failures.push('horizontal overflow after resize');

  const snapshot=await page.evaluate(()=>window.GemdropGameScene?.getSnapshot?.());
  if(!snapshot?.running) failures.push('game stopped during smoke test');
}catch(error){
  failures.push(error instanceof Error?error.stack||error.message:String(error));
}finally{
  await browser.close();
}

if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Gem Drop React/Matter smoke test passed.');
