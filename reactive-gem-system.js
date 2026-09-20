(() => {
  'use strict';

  const CUTS = {
    rectangular: {
      label: 'Rectangular',
      asset: 'gems/reactive/01_rectangular.svg',
      collision: 'rectangle',
      stepCut: true
    },
    circular_starcut: {
      label: 'Circular Starcut',
      asset: 'gems/reactive/02_circular_starcut.svg',
      collision: 'brilliant',
      stepCut: false
    },
    emerald_stepcut: {
      label: 'Emerald Stepcut',
      asset: 'gems/reactive/03_emerald_stepcut.svg',
      collision: 'emerald',
      stepCut: true
    },
    rectangular_brilliant: {
      label: 'Rectangular Brilliant',
      asset: 'gems/reactive/04_rectangular_brilliant.svg',
      collision: 'rectangle',
      stepCut: false
    },
    heart: {
      label: 'Heart',
      asset: 'gems/reactive/05_heart.svg',
      collision: 'heart',
      stepCut: false
    },
    tanzanite: {
      label: 'Tanzanite',
      asset: 'gems/reactive/06_tanzanite.svg',
      collision: 'octagon',
      stepCut: false
    }
  };

  const models = new Map();
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

  function parseHex(hex) {
    const value = String(hex || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(value)) return null;
    return {
      r: parseInt(value.slice(1,3),16)/255,
      g: parseInt(value.slice(3,5),16)/255,
      b: parseInt(value.slice(5,7),16)/255
    };
  }

  function rgbToHsl(rgb) {
    const r=rgb.r,g=rgb.g,b=rgb.b;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0;
    const l=(max+min)/2;
    if(max!==min){
      const d=max-min;
      s=l>.5?d/(2-max-min):d/(max+min);
      if(max===r) h=((g-b)/d+(g<b?6:0));
      else if(max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h*=60;
    }
    return {h,s:s*100,l:l*100};
  }

  function hexToHsl(hex) {
    const rgb=parseHex(hex);
    return rgb?rgbToHsl(rgb):{h:220,s:80,l:52};
  }

  function pointsFromString(value) {
    const nums=String(value||'').trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
    const out=[];
    for(let i=0;i+1<nums.length;i+=2) out.push([nums[i],nums[i+1]]);
    return out;
  }

  function centroid(points) {
    if(!points.length) return [256,256];
    let x=0,y=0;
    for(const p of points){x+=p[0];y+=p[1];}
    return [x/points.length,y/points.length];
  }

  function circularMean(values) {
    if(!values.length) return 220;
    let x=0,y=0;
    for(const v of values){
      const a=v*Math.PI/180;
      x+=Math.cos(a); y+=Math.sin(a);
    }
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
  }

  function solveDirectional(facets) {
    // Fit lightness to c + A*cos(angle) + B*sin(angle), then remove only
    // that directional component. This removes the baked left/right light side
    // while retaining the authored facet-to-facet variation.
    const M=[
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];
    for(const f of facets){
      const a=f.angle*Math.PI/180;
      const row=[1,Math.cos(a),Math.sin(a)];
      for(let i=0;i<3;i++){
        for(let j=0;j<3;j++) M[i][j]+=row[i]*row[j];
        M[i][3]+=row[i]*f.lightness;
      }
    }
    for(let i=0;i<3;i++){
      let pivot=i;
      for(let r=i+1;r<3;r++) if(Math.abs(M[r][i])>Math.abs(M[pivot][i])) pivot=r;
      const tmp=M[i]; M[i]=M[pivot]; M[pivot]=tmp;
      const div=Math.abs(M[i][i])<1e-8?1:M[i][i];
      for(let c=i;c<4;c++) M[i][c]/=div;
      for(let r=0;r<3;r++){
        if(r===i) continue;
        const factor=M[r][i];
        for(let c=i;c<4;c++) M[r][c]-=factor*M[i][c];
      }
    }
    return {c:M[0][3],a:M[1][3],b:M[2][3]};
  }

  function quantile(sorted, q) {
    if(!sorted.length) return 0;
    const pos=(sorted.length-1)*q;
    const lo=Math.floor(pos), hi=Math.ceil(pos);
    if(lo===hi) return sorted[lo];
    return sorted[lo]*(hi-pos)+sorted[hi]*(pos-lo);
  }

  function parseOuter(doc) {
    const node=doc.querySelector('clipPath > *');
    if(!node) return {type:'circle',cx:256,cy:256,r:190};
    const tag=node.tagName.toLowerCase();
    if(tag==='circle'){
      return {type:'circle',cx:+node.getAttribute('cx'),cy:+node.getAttribute('cy'),r:+node.getAttribute('r')};
    }
    if(tag==='polygon'){
      return {type:'polygon',points:pointsFromString(node.getAttribute('points'))};
    }
    return {type:'path',d:node.getAttribute('d')||''};
  }

  function outerPath(ctx, outer, scale=1) {
    ctx.beginPath();
    if(outer.type==='circle'){
      ctx.arc(outer.cx*scale,outer.cy*scale,outer.r*scale,0,Math.PI*2);
      return;
    }
    if(outer.type==='polygon'){
      const pts=outer.points;
      if(!pts.length) return;
      ctx.moveTo(pts[0][0]*scale,pts[0][1]*scale);
      for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0]*scale,pts[i][1]*scale);
      ctx.closePath();
      return;
    }
    // Canvas Path2D accepts the exact SVG path syntax used by the six authored gems.
    const p=new Path2D(outer.d);
    const m=new DOMMatrix().scale(scale);
    const scaled=new Path2D();
    scaled.addPath(p,m);
    return scaled;
  }

  function polygonPath(ctx, points, scale=1) {
    if(!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0]*scale,points[0][1]*scale);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i][0]*scale,points[i][1]*scale);
    ctx.closePath();
  }

  function fillOuter(ctx,outer,scale,fillStyle){
    ctx.fillStyle=fillStyle;
    if(outer.type==='path'){
      const p=outerPath(ctx,outer,scale);
      ctx.fill(p);
    }else{
      outerPath(ctx,outer,scale);
      ctx.fill();
    }
  }


  function pathToPhysicsPoints(d, curveSteps=18) {
    const tokens=String(d||'').match(/[A-Za-z]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];
    const points=[];
    let i=0;
    let command='';
    let x=0,y=0,startX=0,startY=0;

    const number=()=>Number(tokens[i++]);
    const push=(px,py)=>{
      const last=points[points.length-1];
      if(!last||Math.hypot(last[0]-px,last[1]-py)>.01) points.push([px,py]);
    };
    const cubic=(p0,p1,p2,p3,t)=>{
      const u=1-t;
      return [
        u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],
        u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]
      ];
    };

    while(i<tokens.length){
      if(/[A-Za-z]/.test(tokens[i])) command=tokens[i++].toUpperCase();
      if(!command) break;

      if(command==='M'){
        x=number(); y=number(); startX=x; startY=y; push(x,y);
        command='L';
      }else if(command==='L'){
        x=number(); y=number(); push(x,y);
      }else if(command==='H'){
        x=number(); push(x,y);
      }else if(command==='V'){
        y=number(); push(x,y);
      }else if(command==='C'){
        const p0=[x,y];
        const p1=[number(),number()];
        const p2=[number(),number()];
        const p3=[number(),number()];
        for(let step=1;step<=curveSteps;step++){
          const p=cubic(p0,p1,p2,p3,step/curveSteps);
          push(p[0],p[1]);
        }
        x=p3[0]; y=p3[1];
      }else if(command==='Z'){
        push(startX,startY);
        command='';
      }else{
        throw new Error('Unsupported SVG path command for gem collision: '+command);
      }
    }

    if(points.length>2){
      const first=points[0],last=points[points.length-1];
      if(Math.hypot(first[0]-last[0],first[1]-last[1])<.01) points.pop();
    }
    return points;
  }

  function outerPhysicsPoints(outer) {
    if(outer.type==='circle') return null;
    if(outer.type==='polygon') return outer.points.map(p=>[p[0],p[1]]);
    return pathToPhysicsPoints(outer.d,20);
  }

  function outerMetrics(outer) {
    if(outer.type==='circle'){
      return {
        minX:outer.cx-outer.r,
        maxX:outer.cx+outer.r,
        minY:outer.cy-outer.r,
        maxY:outer.cy+outer.r,
        extent:outer.r*2
      };
    }
    const pts=outerPhysicsPoints(outer);
    const xs=pts.map(p=>p[0]);
    const ys=pts.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs);
    const minY=Math.min(...ys),maxY=Math.max(...ys);
    return {minX,maxX,minY,maxY,extent:Math.max(maxX-minX,maxY-minY)};
  }

  function parseModel(name, text) {
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');
    const outer=parseOuter(doc);
    const clipped=[...doc.querySelectorAll('[clip-path]')][0] || doc.documentElement;

    const raw=[];
    for(const el of clipped.querySelectorAll('polygon')){
      const fill=String(el.getAttribute('fill')||'').trim();
      const rgb=parseHex(fill);
      if(!rgb) continue;
      // Pure white polygons in the originals are reflection overlays.
      // They are deliberately not baked into the data map because the
      // reactive shader recreates those highlights from the fixed world light.
      if(rgb.r>.985 && rgb.g>.985 && rgb.b>.985) continue;

      const points=pointsFromString(el.getAttribute('points'));
      if(points.length<3) continue;

      const hsl=rgbToHsl(rgb);
      const [mx,my]=centroid(points);
      const angle=Math.atan2(my-256,mx-256)*180/Math.PI;
      const opacity=clamp(parseFloat(el.getAttribute('fill-opacity')||el.getAttribute('opacity')||'1')||1,0,1);
      raw.push({
        points,
        angle,
        lightness:hsl.l,
        saturation:hsl.s,
        hue:hsl.h,
        opacity,
        radius:clamp(Math.hypot(mx-256,my-256)/220,0,1)
      });
    }

    if(!raw.length) throw new Error('No facets found for '+name);

    const metrics=outerMetrics(outer);
    metrics.width=metrics.maxX-metrics.minX;
    metrics.height=metrics.maxY-metrics.minY;
    const visualExtent=clamp(metrics.extent,220,512);
    const collisionPoints=outerPhysicsPoints(outer);

    const fit=solveDirectional(raw);
    const residuals=raw.map(f=>{
      const a=f.angle*Math.PI/180;
      return f.lightness-(fit.a*Math.cos(a)+fit.b*Math.sin(a));
    });
    const sorted=[...residuals].sort((a,b)=>a-b);
    const median=quantile(sorted,.5);
    const spread=Math.max(7,quantile(sorted,.75)-quantile(sorted,.25));
    const baseHue=circularMean(raw.map(f=>f.hue));

    const facets=raw.map((f,index)=>{
      const residual=residuals[index];
      const style=clamp(.5+(residual-median)/(spread*2.55),.06,.94);
      const hueOffset=((((f.hue-baseHue)+180)%360)+360)%360-180;
      const z=clamp(.96-f.radius*.46+(style-.5)*.08,.42,.98);
      const tilt=Math.sqrt(Math.max(0,1-z*z));
      const a=f.angle*Math.PI/180;
      return {
        points:f.points,
        nx:Math.cos(a)*tilt,
        ny:Math.sin(a)*tilt,
        nz:z,
        style,
        saturation:clamp(f.saturation/100,.58,1),
        hueOffset:clamp(hueOffset,-26,26),
        opacity:f.opacity
      };
    });

    return {
      name,
      outer,
      facets,
      baseHue,
      visualExtent,
      metrics,
      collisionPoints,
      stepCut:!!CUTS[name].stepCut
    };
  }

  function prepare(sources) {
    models.clear();
    for(const name of Object.keys(CUTS)){
      const text=sources[name];
      if(!text) throw new Error('Missing exact gem SVG: '+name);
      models.set(name,parseModel(name,text));
    }
  }

  function createDataCanvas(name,size=768){
    const model=models.get(name);
    if(!model) throw new Error('Gem model not prepared: '+name);
    const canvas=document.createElement('canvas');
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d',{alpha:true});
    const scale=size/512;
    ctx.clearRect(0,0,size,size);

    // Neutral base only plugs microscopic antialiasing seams.
    fillOuter(ctx,model.outer,scale,'rgba(128,128,126,1)');

    for(const facet of model.facets){
      const r=Math.round(clamp(facet.nx*.5+.5,0,1)*255);
      const g=Math.round(clamp(facet.ny*.5+.5,0,1)*255);
      // B is the authored non-directional facet style. Lighting direction never
      // lives in this texture, so rotating a gem cannot rotate a baked bright side.
      const b=Math.round(clamp(facet.style,0,1)*255);
      polygonPath(ctx,facet.points,scale);
      ctx.fillStyle='rgba('+r+','+g+','+b+','+facet.opacity+')';
      ctx.fill();
    }
    return canvas;
  }

  function hslString(h,s,l){
    h=((h%360)+360)%360;
    return 'hsl('+h.toFixed(2)+' '+clamp(s,0,100).toFixed(2)+'% '+clamp(l,0,100).toFixed(2)+'%)';
  }

  function norm3(x,y,z){
    const d=Math.hypot(x,y,z)||1;
    return [x/d,y/d,z/d];
  }

  function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

  function smoothstep(edge0,edge1,x){
    const t=clamp((x-edge0)/(edge1-edge0),0,1);
    return t*t*(3-2*t);
  }

  function mixRgb(a,b,t){
    return {
      r:a.r+(b.r-a.r)*t,
      g:a.g+(b.g-a.g)*t,
      b:a.b+(b.b-a.b)*t
    };
  }

  function rgbCss(c){
    return 'rgb('+
      Math.round(clamp(c.r,0,1)*255)+' '+
      Math.round(clamp(c.g,0,1)*255)+' '+
      Math.round(clamp(c.b,0,1)*255)+')';
  }

  function renderPreviewCanvas(name,color,angle=0,size=256,palette=null){
    const model=models.get(name);
    if(!model) throw new Error('Gem model not prepared: '+name);

    const metrics=model.metrics;
    const pad=model.visualExtent*.055;
    const maxSpan=model.visualExtent+pad*2;
    const drawScale=size/maxSpan;

    // Crop the canvas to the authored silhouette's real proportions.
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round((metrics.width+pad*2)*drawScale));
    canvas.height=Math.max(1,Math.round((metrics.height+pad*2)*drawScale));
    const ctx=canvas.getContext('2d',{alpha:true});

    // Use the exact same three material colours used by the gameplay shader.
    const gemColor=parseHex((palette&&palette.color)||color)||parseHex(color);
    const deepColor=parseHex((palette&&palette.dark)||color)||gemColor;
    const accentColor=parseHex((palette&&palette.accent)||color)||gemColor;

    const lightAngle=-Math.PI*.32;
    const light=norm3(Math.cos(lightAngle)*.67,Math.sin(lightAngle)*.67,.74);
    const tintLight=norm3(-Math.cos(lightAngle)*.16,-Math.sin(lightAngle)*.16,.97);
    const view=[0,0,1];

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.scale(drawScale,drawScale);
    ctx.translate(pad-metrics.minX,pad-metrics.minY);

    if(angle){
      ctx.translate(256,256);
      ctx.rotate(angle*Math.PI/180);
      ctx.translate(-256,-256);
    }

    fillOuter(ctx,model.outer,1,rgbCss(deepColor));

    const rad=angle*Math.PI/180;
    const cos=Math.cos(rad),sin=Math.sin(rad);

    for(const facet of model.facets){
      const nx=facet.nx*cos-facet.ny*sin;
      const ny=facet.nx*sin+facet.ny*cos;
      const normal=norm3(nx,ny,facet.nz);
      const diffuse=Math.max(0,dot3(normal,light));
      const facing=clamp(normal[2],0,1);
      const transmission=Math.max(0,dot3(normal,tintLight));
      const rim=Math.pow(1-facing,1.15);
      const style=facet.style;

      const energy=.22+(style-.52)*.78+diffuse*.34+transmission*.28+rim*.16+facing*.12;
      const low=smoothstep(.18,.56,energy);
      const high=smoothstep(.55,.88,energy);

      let material=mixRgb(deepColor,gemColor,low);
      material=mixRgb(material,accentColor,high*.72);

      const incoming=[-light[0],-light[1],-light[2]];
      const ndot=dot3(incoming,normal);
      const reflected=[
        incoming[0]-2*ndot*normal[0],
        incoming[1]-2*ndot*normal[1],
        incoming[2]-2*ndot*normal[2]
      ];

      const spec=Math.pow(Math.max(dot3(reflected,view),0),model.stepCut?16:18);
      const caustic=Math.pow(transmission,model.stepCut?2.8:3.0)*.18;
      const flash=clamp(spec*1.15+caustic+diffuse*.03,0,model.stepCut?.28:.34);

      let final=mixRgb(material,accentColor,flash*.72);
      final={
        r:(final.r+accentColor.r*flash*.34)*(.92+style*.16),
        g:(final.g+accentColor.g*flash*.34)*(.92+style*.16),
        b:(final.b+accentColor.b*flash*.34)*(.92+style*.16)
      };

      polygonPath(ctx,facet.points,1);
      ctx.globalAlpha=facet.opacity;
      ctx.fillStyle=rgbCss(final);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha=1;
    return canvas;
  }

  window.ReactiveGemSystem={
    cuts:CUTS,
    prepare,
    createDataCanvas,
    renderPreviewCanvas,
    aspectRatio:name=>{
      const model=models.get(name);
      return model&&model.metrics&&model.metrics.height
        ? model.metrics.width/model.metrics.height
        : 1;
    },
    visualScale:name=>{
      const model=models.get(name);
      return model&&model.visualExtent?512/model.visualExtent:1;
    },
    collisionShape:(name,radius)=>{
      const model=models.get(name);
      if(!model) return null;
      if(model.outer.type==='circle'){
        return {type:'circle',radius};
      }
      const scale=(radius*2)/model.visualExtent;
      return {
        type:'vertices',
        vertices:model.collisionPoints.map(p=>({
          x:(p[0]-256)*scale,
          y:(p[1]-256)*scale
        }))
      };
    },
    isStepCut:name=>!!CUTS[name]?.stepCut,
    collisionFor:name=>CUTS[name]?.collision||'brilliant'
  };
})();