(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const WALL = 24;
  const FLOOR = H - 26;
  const DROP_Y = 106;
  const DANGER_Y = 255;
  const FIXED_DT = 1 / 120;
  const DANGER_LIMIT = 8;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const bestEl = $('best');
  const dangerHud = $('dangerHud');
  const dangerTimeEl = $('dangerTime');
  const comboBadge = $('comboBadge');
  const toast = $('toast');
  const startOverlay = $('startOverlay');
  const pauseOverlay = $('pauseOverlay');
  const gameOverOverlay = $('gameOverOverlay');
  const finalScoreEl = $('finalScore');
  const bestMergeEl = $('bestMerge');
  const bestChainEl = $('bestChain');
  const holdPreview = $('holdPreview');
  const nextPreview = $('nextPreview');

  const powerEls = {
    hammer: { button: $('hammerButton'), fill: $('hammerCharge') },
    vortex: { button: $('vortexButton'), fill: $('vortexCharge') },
    prism: { button: $('prismButton'), fill: $('prismCharge') }
  };

  const tiers = [
    { name: 'Quartz',     r: 24, score: 20,   color: '#d9ecff', accent: '#ffffff', dark: '#7991b6', sides: 6 },
    { name: 'Citrine',    r: 29, score: 45,   color: '#ffd56f', accent: '#fff1b4', dark: '#aa6a20', sides: 7 },
    { name: 'Peridot',    r: 35, score: 85,   color: '#92e67d', accent: '#d9ffc8', dark: '#38734d', sides: 6 },
    { name: 'Aquamarine', r: 43, score: 145,  color: '#67dce9', accent: '#c5faff', dark: '#25778f', sides: 8 },
    { name: 'Amethyst',   r: 52, score: 240,  color: '#b187ff', accent: '#e3d1ff', dark: '#59339a', sides: 7 },
    { name: 'Topaz',      r: 63, score: 380,  color: '#ff9d65', accent: '#ffd3b6', dark: '#9e482c', sides: 8 },
    { name: 'Sapphire',   r: 75, score: 590,  color: '#5f8fff', accent: '#bfd1ff', dark: '#294eab', sides: 8 },
    { name: 'Emerald',    r: 89, score: 900,  color: '#43d6a0', accent: '#b1f6da', dark: '#15795a', sides: 7 },
    { name: 'Ruby',       r: 104,score: 1400, color: '#ff607c', accent: '#ffbcc7', dark: '#9e2941', sides: 8 },
    { name: 'Crownstone', r: 122,score: 2300, color: '#f0ca69', accent: '#fff0ae', dark: '#9d6f1c', sides: 10 }
  ];

  let bodies = [];
  let particles = [];
  let floaters = [];
  let shockwaves = [];
  let score = 0;
  let best = loadBest();
  let currentTier = 0;
  let nextTier = 1;
  let heldTier = null;
  let currentSpecial = null;
  let heldSpecial = null;
  let canHold = true;
  let aimX = W / 2;
  let running = false;
  let paused = false;
  let pointerActive = false;
  let shotCooldown = 0;
  let dangerTimer = 0;
  let bestTierReached = 0;
  let bestCombo = 0;
  let comboWindow = 0;
  let comboCount = 0;
  let comboTimer = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  let idSeq = 1;
  let toastTimer = 0;
  let comboBadgeTimer = 0;
  let screenShake = 0;
  let firstDrop = true;
  let powerUiTimer = 0;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charge = { hammer: 0, vortex: 0, prism: 0 };

  bestEl.textContent = fmt(best);

  function loadBest() {
    try { return Number(localStorage.getItem('gemTideBest') || 0); }
    catch { return 0; }
  }

  function saveBest() {
    try { localStorage.setItem('gemTideBest', String(best)); } catch {}
  }

  function haptic(ms = 12) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
  }

  function randomTier() {
    const r = Math.random();
    if (score < 2500) return r < .48 ? 0 : r < .8 ? 1 : 2;
    if (score < 9000) return r < .38 ? 0 : r < .66 ? 1 : r < .86 ? 2 : 3;
    return r < .32 ? 0 : r < .56 ? 1 : r < .75 ? 2 : r < .9 ? 3 : 4;
  }

  function maybeSpecial() {
    if (score < 1800) return null;
    const r = Math.random();
    if (r < .026) return 'bomb';
    if (r < .052) return 'prism';
    if (r < .07) return 'phase';
    return null;
  }

  function resetGame() {
    bodies = [];
    particles = [];
    floaters = [];
    shockwaves = [];
    score = 0;
    currentTier = randomTier();
    nextTier = randomTier();
    heldTier = null;
    currentSpecial = null;
    heldSpecial = null;
    canHold = true;
    aimX = W / 2;
    running = true;
    paused = false;
    shotCooldown = 0;
    dangerTimer = 0;
    bestTierReached = 0;
    bestCombo = 0;
    comboWindow = 0;
    comboCount = 0;
    comboTimer = 0;
    screenShake = 0;
    firstDrop = true;
    powerUiTimer = 0;
    charge.hammer = charge.vortex = charge.prism = 0;
    updateUI();
    drawPreviews();
  }

  function createBody(x, y, tier, vx = 0, vy = 0, special = null) {
    const r = tiers[tier].r;
    return {
      id: idSeq++, x, y, vx, vy, r, tier, special,
      angle: (Math.random() - .5) * .45,
      spin: (Math.random() - .5) * 1.1,
      age: 0,
      mergeLock: .16,
      hit: 0,
      phase: special === 'phase' ? .75 : 0,
      floorTime: 0,
      settled: 0,
      lastContact: false
    };
  }

  function dropCurrent() {
    if (!running || paused || shotCooldown > 0) return;
    const t = tiers[currentTier];
    const x = clamp(aimX, WALL + t.r, W - WALL - t.r);
    bodies.push(createBody(x, DROP_Y, currentTier, 0, 35, currentSpecial));
    currentTier = nextTier;
    currentSpecial = maybeSpecial();
    nextTier = randomTier();
    canHold = true;
    shotCooldown = .32;
    firstDrop = false;
    drawPreviews();
    haptic(8);
  }

  function holdCurrent() {
    if (!running || paused || !canHold || shotCooldown > 0) return;
    if (heldTier == null) {
      heldTier = currentTier;
      heldSpecial = currentSpecial;
      currentTier = nextTier;
      currentSpecial = maybeSpecial();
      nextTier = randomTier();
    } else {
      [heldTier, currentTier] = [currentTier, heldTier];
      [heldSpecial, currentSpecial] = [currentSpecial, heldSpecial];
    }
    canHold = false;
    shotCooldown = .12;
    drawPreviews();
    showToast('Gem held');
    haptic(8);
  }

  function physicsStep(dt) {
    if (!running || paused) return;
    shotCooldown = Math.max(0, shotCooldown - dt);
    powerUiTimer += dt;
    comboWindow = Math.max(0, comboWindow - dt);
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboWindow <= 0) comboCount = 0;
    screenShake = Math.max(0, screenShake - dt * 3.2);

    for (const b of bodies) {
      b.age += dt;
      b.mergeLock = Math.max(0, b.mergeLock - dt);
      b.hit = Math.max(0, b.hit - dt * 4.3);
      b.phase = Math.max(0, b.phase - dt);
      b.lastContact = false;

      const gravity = b.special === 'phase' && b.phase > 0 ? 880 : 1180;
      b.vy += gravity * dt;
      const drag = Math.pow(.996, dt * 120);
      b.vx *= drag;
      b.vy *= drag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.spin * dt;

      if (b.x - b.r < WALL) {
        b.x = WALL + b.r;
        b.vx = Math.abs(b.vx) * .38;
        b.spin *= .75;
        b.hit = .6;
      }
      if (b.x + b.r > W - WALL) {
        b.x = W - WALL - b.r;
        b.vx = -Math.abs(b.vx) * .38;
        b.spin *= .75;
        b.hit = .6;
      }
      if (b.y + b.r > FLOOR) {
        b.y = FLOOR - b.r;
        if (Math.abs(b.vy) > 48) {
          b.vy = -Math.abs(b.vy) * .18;
          b.vx *= .86;
          b.hit = Math.min(1.2, Math.abs(b.vy) / 220 + .35);
        } else {
          b.vy = 0;
          b.vx *= .84;
        }
        b.floorTime += dt;
        b.lastContact = true;
      } else b.floorTime = 0;
    }

    const mergePairs = [];
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (a.phase > 0 || b.phase > 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minD = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD * minD || d2 < .0001) continue;

        const dist = Math.sqrt(d2);
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minD - dist;
        const massA = a.r * a.r;
        const massB = b.r * b.r;
        const invA = 1 / massA;
        const invB = 1 / massB;
        const invSum = invA + invB;
        a.x -= nx * overlap * (invA / invSum) * .55;
        a.y -= ny * overlap * (invA / invSum) * .55;
        b.x += nx * overlap * (invB / invSum) * .55;
        b.y += ny * overlap * (invB / invSum) * .55;
        a.lastContact = b.lastContact = true;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const along = rvx * nx + rvy * ny;
        if (along < 0) {
          const restitution = .13;
          const impulse = -(1 + restitution) * along / invSum;
          a.vx -= impulse * nx * invA;
          a.vy -= impulse * ny * invA;
          b.vx += impulse * nx * invB;
          b.vy += impulse * ny * invB;
          const tang = rvx * -ny + rvy * nx;
          a.spin -= tang * .0008;
          b.spin += tang * .0008;
          a.hit = b.hit = Math.min(1.15, Math.abs(along) / 170);
        }

        const prismMatch = a.special === 'prism' || b.special === 'prism';
        const bombContact = a.special === 'bomb' || b.special === 'bomb';
        const sameTier = a.tier === b.tier;
        if (!bombContact && a.mergeLock <= 0 && b.mergeLock <= 0 && (sameTier || prismMatch)) {
          const baseTier = prismMatch ? Math.max(a.tier, b.tier) : a.tier;
          mergePairs.push([a.id, b.id, baseTier + 1]);
        }
      }
    }

    const bombs = bodies.filter(b => b.special === 'bomb' && b.age > .3 && b.lastContact);
    for (const bomb of bombs) detonateBomb(bomb);

    for (const b of bodies) {
      const speed = Math.hypot(b.vx, b.vy);
      if ((b.lastContact || b.floorTime > 0) && speed < 35) b.settled += dt;
      else b.settled = Math.max(0, b.settled - dt * 2);
    }

    if (mergePairs.length) processMerges(mergePairs);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .97;
      p.vy = p.vy * .97 + 110 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 38 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      shockwaves[i].life -= dt;
      shockwaves[i].r += 330 * dt;
      if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
    }

    checkDanger(dt);
    if (powerUiTimer >= .05) { updatePowerUI(); powerUiTimer = 0; }
  }

  function processMerges(pairs) {
    const consumed = new Set();
    let merges = 0;
    for (const [idA, idB, newTier] of pairs) {
      if (consumed.has(idA) || consumed.has(idB)) continue;
      const a = bodies.find(x => x.id === idA);
      const b = bodies.find(x => x.id === idB);
      if (!a || !b) continue;
      consumed.add(idA); consumed.add(idB);
      merges++;

      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const vx = (a.vx + b.vx) * .33;
      const vy = Math.min(-40, (a.vy + b.vy) * .18 - 95);

      if (newTier >= tiers.length) {
        const gain = 5000;
        addScore(gain);
        crownBurst(x, y);
        burst(x, y, '#ffe8a1', 58, 330);
        shockwaves.push({ x, y, r: 20, life: .65, color: '#ffe6a0' });
        floaters.push({ x, y, text: `CROWN BURST +${gain}`, life: 1.25, color: '#ffe8a1', scale: 1.2 });
        showToast('Crownstone burst');
        screenShake = 1;
        haptic([24, 30, 34]);
      } else {
        const gain = tiers[newTier].score;
        addScore(gain);
        bestTierReached = Math.max(bestTierReached, newTier);
        const n = createBody(x, y, newTier, vx, vy, null);
        n.mergeLock = .18;
        n.settled = 0;
        bodies.push(n);
        burst(x, y, tiers[newTier].color, 12 + newTier * 2, 150 + newTier * 10);
        shockwaves.push({ x, y, r: 8, life: .28, color: tiers[newTier].accent });
        floaters.push({ x, y, text: `+${gain}`, life: .72, color: tiers[newTier].accent, scale: 1 });
        haptic(newTier >= 6 ? 24 : 11);
      }
    }

    if (consumed.size) bodies = bodies.filter(b => !consumed.has(b.id));

    if (merges > 0) {
      if (comboWindow > 0) comboCount += merges;
      else comboCount = merges;
      comboWindow = .85;
      bestCombo = Math.max(bestCombo, comboCount);
      if (comboCount >= 2) showCombo(comboCount);
      charge.hammer = Math.min(1, charge.hammer + merges * .10);
      charge.vortex = Math.min(1, charge.vortex + merges * .075);
      charge.prism = Math.min(1, charge.prism + merges * .12);
    }
  }


  function detonateBomb(bomb) {
    if (!bodies.some(b => b.id === bomb.id)) return;
    const x = bomb.x, y = bomb.y;
    const removed = new Set([bomb.id]);
    let cleared = 0;
    for (const b of bodies) {
      if (b.id === bomb.id) continue;
      const dx = b.x - x, dy = b.y - y;
      const d = Math.hypot(dx,dy) || 1;
      if (d < 150 && b.tier <= 4) { removed.add(b.id); cleared++; }
      else if (d < 250) {
        const force = (250 - d) * 3;
        b.vx += dx / d * force;
        b.vy += dy / d * force - 120;
      }
    }
    bodies = bodies.filter(b => !removed.has(b.id));
    if (cleared) addScore(cleared * 70);
    burst(x,y,'#ff9c68',42,300);
    shockwaves.push({x,y,r:18,life:.62,color:'#ffb875'});
    floaters.push({x,y,text:`BLAST +${cleared*70}`,life:.85,color:'#ffd09a',scale:1});
    screenShake = Math.max(screenShake,.65);
    haptic([20,18,26]);
  }

  function crownBurst(x, y) {
    const remove = new Set();
    for (const b of bodies) {
      const dx = b.x - x, dy = b.y - y;
      const d = Math.hypot(dx, dy) || 1;
      const force = Math.max(0, 420 - d) * 2.4;
      b.vx += dx / d * force;
      b.vy += dy / d * force - 170;
      if (b.tier <= 2 && d < 330) remove.add(b.id);
    }
    bodies = bodies.filter(b => !remove.has(b.id));
  }

  function addScore(points) {
    const mult = comboCount >= 4 ? 1.35 : comboCount >= 2 ? 1.15 : 1;
    score += Math.round(points * mult);
    if (score > best) { best = score; saveBest(); }
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(best);
  }

  function usePower(kind) {
    if (!running || paused || charge[kind] < 1) return;
    if (kind === 'hammer') {
      const candidates = bodies.filter(b => !b.special).sort((a,b) => a.tier - b.tier || a.y - b.y);
      const targets = candidates.slice(0, Math.min(5, candidates.length));
      const ids = new Set(targets.map(b => b.id));
      for (const b of targets) burst(b.x,b.y,tiers[b.tier].color,10,190);
      bodies = bodies.filter(b => !ids.has(b.id));
      addScore(targets.length * 80);
      showToast('Shatter cleared the smallest gems');
    }
    if (kind === 'vortex') {
      const cx = W / 2, cy = H * .62;
      for (const b of bodies) {
        const dx = cx - b.x, dy = cy - b.y, d = Math.hypot(dx,dy) || 1;
        b.vx += dx / d * (160 + Math.max(0, 320 - d));
        b.vy += dy / d * 160 - 190;
        b.spin += (Math.random() - .5) * 3;
      }
      shockwaves.push({x:cx,y:cy,r:20,life:.9,color:'#9b86ff'});
      burst(cx,cy,'#9f8aff',45,300);
      screenShake = .55;
      showToast('Cascade stirred the vault');
    }
    if (kind === 'prism') {
      currentSpecial = 'prism';
      drawPreviews();
      showToast('Loaded gem became a Prism');
    }
    charge[kind] = 0;
    updatePowerUI();
    haptic(30);
  }

  function checkDanger(dt) {
    const overloaded = bodies.some(b => b.age > 1.1 && b.settled > .45 && b.y - b.r < DANGER_Y);
    if (overloaded) dangerTimer += dt;
    else dangerTimer = Math.max(0, dangerTimer - dt * 2.4);

    if (dangerTimer > .05) {
      dangerHud.hidden = false;
      dangerTimeEl.textContent = Math.max(0, DANGER_LIMIT - dangerTimer).toFixed(1);
    } else dangerHud.hidden = true;

    if (dangerTimer >= DANGER_LIMIT) endGame();
  }

  function endGame() {
    running = false;
    pointerActive = false;
    finalScoreEl.textContent = fmt(score);
    bestMergeEl.textContent = tiers[bestTierReached].name;
    bestChainEl.textContent = `${bestCombo}×`;
    gameOverOverlay.classList.add('visible');
    haptic([50,40,50]);
  }

  function setPause(value) {
    if (!running) return;
    paused = value;
    pauseOverlay.classList.toggle('visible', value);
  }

  function burst(x, y, color, count = 16, speed = 160) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (.35 + Math.random() * .75);
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.45,max:.8,color,size:1.5+Math.random()*3.5,diamond:Math.random()>.45});
    }
  }

  function showCombo(count) {
    comboBadge.textContent = `${count}× COMBO`;
    comboBadge.classList.add('show');
    clearTimeout(comboBadgeTimer);
    comboBadgeTimer = setTimeout(() => comboBadge.classList.remove('show'), 650);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1250);
  }

  function draw() {
    ctx.save();
    if (screenShake > 0 && !reducedMotion) {
      const m = 5 * screenShake;
      ctx.translate((Math.random()-.5)*m,(Math.random()-.5)*m);
    }
    drawBackground();
    drawDanger();
    drawAim();
    for (const b of [...bodies].sort((a,b)=>a.r-b.r)) drawGem(ctx,b.x,b.y,b.tier,b.r,b.angle,b.special,b.hit,b.phase,1);
    drawShockwaves();
    drawParticles();
    drawFloaters();
    ctx.restore();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#141130');
    g.addColorStop(.38,'#0d1028');
    g.addColorStop(1,'#080916');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const glow = ctx.createRadialGradient(W*.5,H*.7,40,W*.5,H*.7,H*.72);
    glow.addColorStop(0,'rgba(66,77,155,.20)');
    glow.addColorStop(.55,'rgba(39,29,83,.09)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,W,H);

    const now = performance.now() * .00012;
    ctx.save();
    for (let i=0;i<34;i++) {
      const x = (i*173.3)%W;
      const y = ((i*101.7)+(now*40*(1+i%3)))%H;
      const a = .12 + (i%4)*.045;
      ctx.globalAlpha = a;
      ctx.fillStyle = i%5===0 ? '#d5c0ff' : '#a8cfff';
      ctx.beginPath(); ctx.arc(x,y,1+(i%3)*.45,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = .11;
    ctx.strokeStyle = '#d3b9ff';
    ctx.lineWidth = 1;
    for (let y=420;y<H;y+=94) {
      ctx.beginPath();
      for (let x=0;x<=W;x+=20) {
        const yy = y + Math.sin(x*.025 + y*.01) * 4;
        if (x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle='rgba(255,255,255,.035)';
    ctx.fillRect(WALL-2,0,2,H);
    ctx.fillRect(W-WALL,0,2,H);
  }

  function drawDanger() {
    const active = dangerTimer > 0;
    ctx.save();
    ctx.setLineDash([11,12]);
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.strokeStyle = active ? 'rgba(255,102,137,.92)' : 'rgba(255,255,255,.18)';
    ctx.shadowColor = active ? '#ff557e' : 'transparent';
    ctx.shadowBlur = active ? 15 : 0;
    ctx.beginPath();
    ctx.moveTo(WALL+8,DANGER_Y);
    ctx.lineTo(W-WALL-8,DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign='center';
    ctx.font='800 11px Inter, sans-serif';
    ctx.fillStyle=active?'rgba(255,160,181,.95)':'rgba(255,255,255,.31)';
    ctx.fillText('PRESSURE LINE',W/2,DANGER_Y-12);
    ctx.restore();
  }

  function drawAim() {
    if (!running || paused) return;
    const t = tiers[currentTier];
    const x = clamp(aimX,WALL+t.r,W-WALL-t.r);
    ctx.save();
    const grad=ctx.createLinearGradient(x,DROP_Y+22,x,DANGER_Y-12);
    grad.addColorStop(0,'rgba(164,206,255,.62)');
    grad.addColorStop(1,'rgba(164,206,255,0)');
    ctx.strokeStyle=grad;
    ctx.lineWidth=2;
    ctx.setLineDash([3,10]);
    ctx.beginPath(); ctx.moveTo(x,DROP_Y+t.r+10); ctx.lineTo(x,DANGER_Y-10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=.18;
    ctx.beginPath(); ctx.arc(x,DANGER_Y+42,t.r,0,Math.PI*2); ctx.strokeStyle=t.accent; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
    drawGem(ctx,x,DROP_Y,currentTier,t.r,0,currentSpecial,0,0,1);
  }

  function gemPath(c,sides,r) {
    c.beginPath();
    for (let i=0;i<sides;i++) {
      const a=-Math.PI/2+i*Math.PI*2/sides;
      const rr=r*(i%2===0?1:.92);
      const x=Math.cos(a)*rr, y=Math.sin(a)*rr;
      if(i===0)c.moveTo(x,y); else c.lineTo(x,y);
    }
    c.closePath();
  }

  function drawGem(c,x,y,tierIndex,r,angle=0,special=null,hit=0,phase=0,alpha=1) {
    const t=tiers[tierIndex];
    c.save();
    c.translate(x,y);
    c.rotate(angle*.35);
    const squash=1-Math.min(.09,hit*.07);
    c.scale(1+(1-squash)*.72,squash);
    c.globalAlpha=alpha*(phase>0?.42:1);

    c.shadowColor=special==='prism'?'#ffffff':t.color;
    c.shadowBlur=12+r*.13;
    const grad=c.createRadialGradient(-r*.35,-r*.42,r*.05,0,0,r*1.14);
    if(special==='bomb') { grad.addColorStop(0,'#fff7dc');grad.addColorStop(.18,'#ffcb71');grad.addColorStop(.5,'#ff6a55');grad.addColorStop(1,'#4e1631'); }
    else if(special==='prism') { grad.addColorStop(0,'#fff');grad.addColorStop(.18,'#92ebff');grad.addColorStop(.43,'#bc8cff');grad.addColorStop(.68,'#ffd48a');grad.addColorStop(1,'#66d6ac'); }
    else if(special==='phase') { grad.addColorStop(0,'#fff');grad.addColorStop(.25,t.accent);grad.addColorStop(.62,'#8f84ff');grad.addColorStop(1,'#29325b'); }
    else { grad.addColorStop(0,'#fff');grad.addColorStop(.12,t.accent);grad.addColorStop(.46,t.color);grad.addColorStop(1,t.dark); }
    gemPath(c,t.sides,r);
    c.fillStyle=grad; c.fill();
    c.lineWidth=Math.max(1.3,r*.026); c.strokeStyle='rgba(255,255,255,.62)'; c.stroke();

    c.shadowBlur=0;
    c.globalAlpha*=.75;
    c.lineWidth=Math.max(1,r*.015);
    c.strokeStyle='rgba(255,255,255,.52)';
    c.beginPath();
    c.moveTo(-r*.55,-r*.18);c.lineTo(0,-r*.62);c.lineTo(r*.55,-r*.18);c.lineTo(0,r*.7);c.closePath();c.stroke();
    c.beginPath();c.moveTo(-r*.55,-r*.18);c.lineTo(r*.55,-r*.18);c.moveTo(0,-r*.62);c.lineTo(0,r*.7);c.stroke();
    c.globalAlpha*=.52;
    c.fillStyle='rgba(255,255,255,.58)';
    c.beginPath();c.moveTo(-r*.18,-r*.47);c.lineTo(r*.05,-r*.55);c.lineTo(-r*.05,-r*.18);c.closePath();c.fill();

    if (special) {
      c.globalAlpha=1;
      c.fillStyle='rgba(7,6,17,.72)';
      c.beginPath(); c.arc(0,0,Math.max(9,r*.2),0,Math.PI*2); c.fill();
      c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1; c.stroke();
      c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font=`900 ${Math.max(10,r*.18)}px Inter, sans-serif`;
      c.fillText(special==='bomb'?'✦':special==='prism'?'◆':'◌',0,.5);
    }
    c.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha=Math.max(0,p.life/p.max);
      ctx.translate(p.x,p.y);
      ctx.fillStyle=p.color;
      if(p.diamond){ctx.rotate(Math.PI/4);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);} else {ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }

  function drawShockwaves() {
    for(const s of shockwaves){
      ctx.save();ctx.globalAlpha=Math.max(0,s.life);ctx.strokeStyle=s.color;ctx.lineWidth=3;ctx.shadowColor=s.color;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }

  function drawFloaters() {
    ctx.save();ctx.textAlign='center';
    for(const f of floaters){
      ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.color;ctx.font=`900 ${16*(f.scale||1)}px Inter, sans-serif`;ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=6;ctx.fillText(f.text,f.x,f.y);
    }
    ctx.restore();
  }

  function drawPreview(el,tier,special,empty=false) {
    const c=el.getContext('2d');
    c.clearRect(0,0,el.width,el.height);
    if(empty){
      c.save();c.globalAlpha=.3;c.setLineDash([4,5]);c.strokeStyle='#d9d0e7';c.lineWidth=1.5;c.beginPath();c.arc(el.width/2,el.height/2,17,0,Math.PI*2);c.stroke();c.restore();return;
    }
    drawGem(c,el.width/2,el.height/2,tier,Math.min(el.width,el.height)*.31,0,special,0,0,1);
  }

  function drawPreviews() {
    drawPreview(nextPreview,nextTier,null,false);
    drawPreview(holdPreview,heldTier??0,heldSpecial,heldTier==null);
  }

  function updateUI() {
    scoreEl.textContent=fmt(score);
    bestEl.textContent=fmt(best);
    updatePowerUI();
  }

  function updatePowerUI() {
    for(const key of Object.keys(powerEls)){
      const pct=Math.round(charge[key]*100);
      powerEls[key].fill.style.height=`${pct}%`;
      powerEls[key].button.disabled=charge[key]<1 || !running || paused;
      powerEls[key].button.setAttribute('aria-label',`${key} ability ${pct}% charged`);
    }
  }

  function pointerPos(e){
    const rect=canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left)*(W/rect.width),y:(e.clientY-rect.top)*(H/rect.height)};
  }

  canvas.addEventListener('pointerdown',e=>{
    if(!running||paused)return;
    e.preventDefault();
    pointerActive=true;
    const p=pointerPos(e);aimX=p.x;
    try{canvas.setPointerCapture(e.pointerId);}catch{}
  });
  canvas.addEventListener('pointermove',e=>{
    if(!running||paused)return;
    if(pointerActive || e.pointerType==='mouse'){const p=pointerPos(e);aimX=p.x;}
  });
  canvas.addEventListener('pointerup',e=>{
    if(!running||paused)return;
    e.preventDefault();
    const p=pointerPos(e);aimX=p.x;
    if(pointerActive)dropCurrent();
    pointerActive=false;
    try{canvas.releasePointerCapture(e.pointerId);}catch{}
  });
  canvas.addEventListener('pointercancel',()=>pointerActive=false);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  $('holdButton').addEventListener('click',holdCurrent);
  powerEls.hammer.button.addEventListener('click',()=>usePower('hammer'));
  powerEls.vortex.button.addEventListener('click',()=>usePower('vortex'));
  powerEls.prism.button.addEventListener('click',()=>usePower('prism'));
  $('pauseButton').addEventListener('click',()=>setPause(true));
  $('resumeButton').addEventListener('click',()=>setPause(false));
  $('restartFromPause').addEventListener('click',()=>{pauseOverlay.classList.remove('visible');resetGame();});
  $('startButton').addEventListener('click',()=>{startOverlay.classList.remove('visible');resetGame();});
  $('restartButton').addEventListener('click',()=>{gameOverOverlay.classList.remove('visible');resetGame();});

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden && running && !paused)setPause(true);
  });

  window.addEventListener('keydown',e=>{
    if(e.code==='Space'){e.preventDefault();dropCurrent();}
    if(e.key.toLowerCase()==='c')holdCurrent();
    if(e.key==='Escape')setPause(!paused);
  });

  function frame(now){
    const delta=Math.min(.04,(now-lastTime)/1000);lastTime=now;accumulator+=delta;
    while(accumulator>=FIXED_DT){physicsStep(FIXED_DT);accumulator-=FIXED_DT;}
    draw();
    requestAnimationFrame(frame);
  }

  function fmt(n){return Math.max(0,Math.floor(n)).toLocaleString('en-CA');}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

  drawPreviews();
  updateUI();
  requestAnimationFrame(frame);
})();
