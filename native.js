// Native platform bridge for Gem Drop.
//
// Runs in three environments:
//   1. Inside a Capacitor shell (iOS / Android store builds): real taptic
//      impacts, native status bar and splash screen handling.
//   2. Android browsers / installed PWA: navigator.vibrate.
//   3. iOS Safari 18+: navigator.vibrate does not exist there, but toggling an
//      <input type="checkbox" switch> produces a system haptic tick while the
//      page is handling a user gesture. Used as a best-effort fallback.
(() => {
  'use strict';

  const STORAGE_KEY='gemdrop-haptics';
  const cap=window.Capacitor;
  const isNative=!!(cap&&typeof cap.isNativePlatform==='function'&&cap.isNativePlatform());
  const plugins=(cap&&cap.Plugins)||{};
  const NativeHaptics=isNative?plugins.Haptics:null;
  const canVibrate=typeof navigator.vibrate==='function';

  let enabled=true;
  try{ enabled=localStorage.getItem(STORAGE_KEY)!=='0'; }catch{}

  // iOS Safari switch-toggle fallback.
  let iosSwitchLabel=null;
  function iosSwitch(){
    if(iosSwitchLabel!==null) return iosSwitchLabel;
    iosSwitchLabel=false;
    const ua=navigator.userAgent||'';
    const isIOS=/iP(hone|ad|od)/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
    if(!isIOS||canVibrate||!document.body) return iosSwitchLabel;

    const input=document.createElement('input');
    input.type='checkbox';
    input.setAttribute('switch','');
    input.id='gemdropHapticSwitch';
    input.tabIndex=-1;
    input.setAttribute('aria-hidden','true');
    const label=document.createElement('label');
    label.htmlFor=input.id;
    label.setAttribute('aria-hidden','true');
    const holder=document.createElement('div');
    holder.style.cssText='position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    holder.append(input,label);
    document.body.appendChild(holder);
    iosSwitchLabel=label;
    return iosSwitchLabel;
  }

  let lastTickAt=0;
  function iosTick(){
    const label=iosSwitch();
    if(!label) return;
    const now=performance.now();
    if(now-lastTickAt<45) return;
    lastTickAt=now;
    try{ label.click(); }catch{}
  }

  const STYLE_MS={selection:4,light:8,medium:14,heavy:24};

  function styleForMs(ms){
    if(ms<=6) return 'light';
    if(ms<=14) return 'medium';
    return 'heavy';
  }

  function nativeImpact(style){
    if(!NativeHaptics) return false;
    try{
      if(style==='selection'){
        if(NativeHaptics.selectionStart) NativeHaptics.selectionStart();
        if(NativeHaptics.selectionChanged) NativeHaptics.selectionChanged();
      }else{
        NativeHaptics.impact({style:style.toUpperCase()});
      }
      return true;
    }catch{
      return false;
    }
  }

  function impact(style='light'){
    if(!enabled) return;
    if(nativeImpact(style)) return;
    if(canVibrate){
      try{ navigator.vibrate(STYLE_MS[style]||8); }catch{}
      return;
    }
    iosTick();
  }

  // Accepts the legacy vibrate() forms used around the game: a duration in ms
  // or an on/off pattern array. Each "on" segment becomes a native impact.
  function haptic(value=7){
    if(!enabled) return;
    if(typeof value==='string'){
      impact(value);
      return;
    }

    const pattern=Array.isArray(value)?value:[value];
    if(!NativeHaptics&&canVibrate){
      try{ navigator.vibrate(pattern); }catch{}
      return;
    }

    let at=0;
    pattern.forEach((ms,i)=>{
      const duration=Math.max(0,Number(ms)||0);
      if(i%2===0&&duration>0){
        const style=styleForMs(duration);
        if(at===0) impact(style);
        else window.setTimeout(()=>impact(style),at);
      }
      at+=duration;
    });
  }

  function notify(type='success'){
    if(!enabled) return;
    if(NativeHaptics&&NativeHaptics.notification){
      try{ NativeHaptics.notification({type:type.toUpperCase()}); return; }catch{}
    }
    haptic(type==='error'?[30,40,30,40,50]:type==='warning'?[18,30,24]:[12,40,22]);
  }

  function setEnabled(value){
    enabled=!!value;
    try{ localStorage.setItem(STORAGE_KEY,enabled?'1':'0'); }catch{}
    if(enabled) impact('medium');
  }

  // Native shell polish: dark status bar over the game, hide the native
  // splash once the web splash has taken over, keep the screen awake.
  function setupNativeShell(){
    if(!isNative) return;
    const {StatusBar,SplashScreen,KeepAwake}=plugins;
    try{
      if(StatusBar){
        StatusBar.setStyle({style:'DARK'});
        if(StatusBar.setOverlaysWebView) StatusBar.setOverlaysWebView({overlay:true});
      }
    }catch{}
    try{ if(SplashScreen) SplashScreen.hide({fadeOutDuration:200}); }catch{}
    try{ if(KeepAwake) KeepAwake.keepAwake(); }catch{}
    document.documentElement.classList.add('gemdrop-native');
  }

  window.GemdropNative={
    isNative,
    haptic,
    impact,
    notify,
    selection:()=>impact('selection'),
    isHapticsEnabled:()=>enabled,
    setHapticsEnabled:setEnabled,
    hasHaptics:()=>!!(NativeHaptics||canVibrate||iosSwitch())
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',setupNativeShell,{once:true});
  }else{
    setupNativeShell();
  }
})();
