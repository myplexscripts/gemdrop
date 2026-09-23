import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

function ensureStylesheet(){
  if(document.querySelector('link[data-gemdrop-legacy]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./styles.css?v=react09';
  link.dataset.gemdropLegacy='true';
  document.head.appendChild(link);
}

function loadScript(src:string){
  return new Promise<void>((resolve,reject)=>{
    const existing=[...document.scripts].find(script=>script.src.endsWith(src.replace(/^\.\//,'')));
    if(existing){resolve();return;}
    const script=document.createElement('script');
    script.src=src;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error('Failed to load '+src));
    document.head.appendChild(script);
  });
}

async function boot(){
  ensureStylesheet();
  await loadScript('./reactive-gem-system.js?v=react09');
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App/></React.StrictMode>
  );
}

void boot();
