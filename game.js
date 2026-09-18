(() => {
  'use strict';

  const Matter = window.Matter;
  if (!Matter) {
    document.body.innerHTML = '<div style="padding:24px;color:white;font:600 16px system-ui;background:#080A13;min-height:100vh">Gem Tide could not load its physics engine. Please reload the game.</div>';
    return;
  }

  const { Engine, World, Bodies, Body, Composite, Events, Sleeping } = Matter;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const WALL = 24;
  const FLOOR = H - 24;
  const DROP_Y = 108;
  const DANGER_Y = 252;
  const STEP_MS = 1000 / 60;
  const DANGER_LIMIT = 8;
  const CAT_GEM = 0x0001;
  const CAT_WORLD = 0x0002;
  const LIGHT_ANGLE = -2.22;

  const $ = id => document.getElementById(id);
  const scoreEl = $('score');
  const bestEl = $('best');
  const dangerHud = $('dangerHud');
  const dangerTimeEl = $('dangerTime');
  const comboBadge = $('comboBadge');
  const toast = $('toast');
  const gestureHint = $('gestureHint');
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
    { name: 'Quartz',     r: 24, score: 20,   color: '#D7E4EE', accent: '#F4FAFE', dark: '#65798D', sides: 6 },
    { name: 'Citrine',    r: 29, score: 45,   color: '#DDAE56', accent: '#F7DE98', dark: '#76501E', sides: 7 },
    { name: 'Peridot',    r: 35, score: 85,   color: '#83B979', accent: '#C4DEA9', dark: '#3D653F', sides: 6 },
    { name: 'Aquamarine', r: 43, score: 145,  color: '#61B7C7', accent: '#BFE5EA', dark: '#2D6874', sides: 8 },
    { name: 'Amethyst',   r: 52, score: 240,  color: '#8D6CBA', accent: '#CEB9E8', dark: '#4A376B', sides: 7 },
    { name: 'Topaz',      r: 63, score: 380,  color: '#CE7E52', accent: '#EDB690', dark: '#713D2B', sides: 8 },
    { name: 'Sapphire',   r: 75, score: 590,  color: '#4E70BF', accent: '#A8BEEA', dark: '#293F7A', sides: 8 },
    { name: 'Emerald',    r: 89, score: 900,  color: '#399675', accent: '#9AD2BA', dark: '#205A48', sides: 7 },
    { name: 'Ruby',       r: 104,score: 1400, color: '#BB465F', accent: '#E49BAB', dark: '#722B3B', sides: 8 },
    { name: 'Crownstone', r: 122,score: 2300, color: '#C69E4C', accent: '#EED58D', dark: '#71551D', sides: 10 }
  ];

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.x = 0;
  engine.gravity.y = 1;
  engine.gravity.scale = 0.00138;

  let bodies = [];
  let walls = [];
  let particles = [];
  let floaters = [];
  let shockwaves = [];
  let mergeQueue = [];
  let bombQueue = new Set();

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
  let pointerMoved = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let shotCooldown = 0;
  let dangerTimer = 0;
  let bestTierReached = 0;
  let bestCombo = 0;
  let comboWindow = 0;
  let comboCount = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  let toastTimer = 0;
  let comboBadgeTimer = 0;
  let screenShake = 0;
  let dropCount = 0;
  let powerUiTimer = 0;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charge = { hammer: 0, vortex: 0, prism: 0 };

  bestEl.textContent = fmt(best);
  buildWorld();

  function buildWorld() {
    Composite.clear(engine.world, false, true);
    bodies = [];
    walls = [
      Bodies.rectangle(W / 2, FLOOR + 28, W, 56, {
        isStatic: true,
        friction: .55,
        restitution: .03,
        collisionFilter: { category: CAT_WORLD, mask: CAT_GEM }
      }),
      Bodies.rectangle(WALL / 2, H / 2, WALL, H * 2, {
        isStatic: true,
        friction: .32,
        restitution: .08,
        collisionFilter: { category: CAT_WORLD, mask: CAT_GEM }
      }),
      Bodies.rectangle(W - WALL / 2, H / 2, WALL, H * 2, {
        isStatic: true,
        friction: .32,
        restitution: .08,
        collisionFilter: { category: CAT_WORLD, mask: CAT_GEM }
      })
    ];
    World.add(engine.world, walls);
  }

  function loadBest() {
    try { return Number(localStorage.getItem('gemTideBest') || 0); }
    catch { return 0; }
  }

  function saveBest() {
    try { localStorage.setItem('gemTideBest', String(best)); } catch {}
  }

  function haptic(ms = 10) {
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
    buildWorld();
    particles = [];
    floaters = [];
    shockwaves = [];
    mergeQueue = [];
    bombQueue = new Set();
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
    pointerActive = false;
    pointerMoved = false;
    shotCooldown = 0;
    dangerTimer = 0;
    bestTierReached = 0;
    bestCombo = 0;
    comboWindow = 0;
    comboCount = 0;
    screenShake = 0;
    dropCount = 0;
    powerUiTimer = 0;
    charge.hammer = charge.vortex = charge.prism = 0;
    gestureHint.classList.remove('hidden');
    updateUI();
    drawPreviews();
  }

  function createGemBody(x, y, tier, special = null, velocity = null, angle = null) {
    const t = tiers[tier];
    const collisionRadius = t.r * .94;
    const body = Bodies.polygon(x, y, t.sides, collisionRadius, {
      restitution: tier <= 2 ? .16 : .10,
      friction: .34,
      frictionStatic: .62,
      frictionAir: .006,
      density: .00145,
      slop: .03,
      chamfer: { radius: Math.max(2.5, t.r * .075) },
      collisionFilter: {
        category: CAT_GEM,
        mask: special === 'phase' ? CAT_WORLD : (CAT_WORLD | CAT_GEM)
      }
    });

    Body.setAngle(body, angle ?? (Math.random() - .5) * .18);
    Body.setAngularVelocity(body, (Math.random() - .5) * .018);
    if (velocity) Body.setVelocity(body, velocity);

    body.gem = {
      tier,
      special,
      alive: true,
      born: performance.now(),
      mergeLockUntil: performance.now() + 180,
      phaseActive: special === 'phase',
      hit: 0,
      gleam: Math.random()
    };

    World.add(engine.world, body);
    bodies.push(body);
    return body;
  }

  function removeGem(body) {
    if (!body || !body.gem || !body.gem.alive) return;
    body.gem.alive = false;
    World.remove(engine.world, body);
    const i = bodies.indexOf(body);
    if (i >= 0) bodies.splice(i, 1);
  }

  function dropCurrent() {
    if (!running || paused || shotCooldown > 0) return;
    const t = tiers[currentTier];
    const x = clamp(aimX, WALL + t.r, W - WALL - t.r);
    createGemBody(x, DROP_Y, currentTier, currentSpecial, { x: 0, y: .25 }, 0);
    currentTier = nextTier;
    currentSpecial = maybeSpecial();
    nextTier = randomTier();
    canHold = true;
    shotCooldown = .19;
    dropCount++;
    if (dropCount >= 2) gestureHint.classList.add('hidden');
    drawPreviews();
    haptic(6);
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
    shotCooldown = .10;
    drawPreviews();
    showToast('Gem held');
    haptic(7);
  }

  Events.on(engine, 'collisionStart', event => {
    const now = performance.now();
    for (const pair of event.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const ag = a.gem;
      const bg = b.gem;

      if (ag && bg && ag.alive && bg.alive) {
        const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        ag.hit = Math.max(ag.hit, Math.min(1, rel * .085));
        bg.hit = Math.max(bg.hit, Math.min(1, rel * .085));

        if (ag.special === 'bomb' && now - ag.born > 260) bombQueue.add(a);
        if (bg.special === 'bomb' && now - bg.born > 260) bombQueue.add(b);

        const prismMatch = ag.special === 'prism' || bg.special === 'prism';
        const bombContact = ag.special === 'bomb' || bg.special === 'bomb';
        const sameTier = ag.tier === bg.tier;
        if (!bombContact && now >= ag.mergeLockUntil && now >= bg.mergeLockUntil && (sameTier || prismMatch)) {
          mergeQueue.push([a, b]);
        }
      } else {
        const gemBody = ag ? a : bg ? b : null;
        if (gemBody && gemBody.gem.alive) {
          gemBody.gem.hit = Math.max(gemBody.gem.hit, Math.min(.7, gemBody.speed * .05));
          if (gemBody.gem.special === 'bomb' && now - gemBody.gem.born > 260) bombQueue.add(gemBody);
        }
      }
    }
  });

  function stepPhysics(dtMs) {
    if (!running || paused) return;

    shotCooldown = Math.max(0, shotCooldown - dtMs / 1000);
    powerUiTimer += dtMs / 1000;
    comboWindow = Math.max(0, comboWindow - dtMs / 1000);
    if (comboWindow <= 0) comboCount = 0;
    screenShake = Math.max(0, screenShake - dtMs / 1000 * 3.4);

    const now = performance.now();
    for (const b of bodies) {
      if (!b.gem?.alive) continue;
      b.gem.hit = Math.max(0, b.gem.hit - dtMs / 1000 * 3.2);
      if (b.gem.phaseActive && now - b.gem.born > 680) {
        b.gem.phaseActive = false;
        b.collisionFilter.mask = CAT_WORLD | CAT_GEM;
      }
    }

    Engine.update(engine, dtMs);
    processQueuedInteractions();
    updateEffects(dtMs / 1000);
    checkDanger(dtMs / 1000);

    if (powerUiTimer >= .06) {
      updatePowerUI();
      powerUiTimer = 0;
    }
  }

  function processQueuedInteractions() {
    if (bombQueue.size) {
      const bombs = [...bombQueue];
      bombQueue.clear();
      for (const bomb of bombs) detonateBomb(bomb);
    }

    if (!mergeQueue.length) return;
    const queue = mergeQueue;
    mergeQueue = [];
    const consumed = new Set();
    let merges = 0;

    for (const [a, b] of queue) {
      if (!a.gem?.alive || !b.gem?.alive || consumed.has(a.id) || consumed.has(b.id)) continue;
      const ag = a.gem;
      const bg = b.gem;
      const now = performance.now();
      if (now < ag.mergeLockUntil || now < bg.mergeLockUntil) continue;

      const prismMatch = ag.special === 'prism' || bg.special === 'prism';
      if (!prismMatch && ag.tier !== bg.tier) continue;

      const baseTier = prismMatch ? Math.max(ag.tier, bg.tier) : ag.tier;
      const newTier = baseTier + 1;
      const x = (a.position.x + b.position.x) / 2;
      const y = (a.position.y + b.position.y) / 2;
      const velocity = {
        x: (a.velocity.x + b.velocity.x) * .22,
        y: Math.min(-1.35, (a.velocity.y + b.velocity.y) * .10 - 1.0)
      };
      const angle = (a.angle + b.angle) / 2;

      consumed.add(a.id);
      consumed.add(b.id);
      removeGem(a);
      removeGem(b);
      merges++;

      if (newTier >= tiers.length) {
        const gain = 5000;
        addScore(gain);
        crownBurst(x, y);
        burst(x, y, '#F0D998', 44, 235);
        shockwaves.push({ x, y, r: 18, life: .58, color: '#EED58D' });
        floaters.push({ x, y, text: 'CROWN BURST +' + gain, life: 1.15, color: '#F0D998', scale: 1.15 });
        showToast('Crownstone burst');
        screenShake = .7;
        haptic([20, 25, 30]);
      } else {
        const gain = tiers[newTier].score;
        addScore(gain);
        bestTierReached = Math.max(bestTierReached, newTier);
        const n = createGemBody(x, y, newTier, null, velocity, angle);
        n.gem.mergeLockUntil = performance.now() + 230;
        Body.setAngularVelocity(n, (a.angularVelocity + b.angularVelocity) * .24);
        burst(x, y, tiers[newTier].accent, 9 + newTier, 115 + newTier * 6);
        shockwaves.push({ x, y, r: 7, life: .22, color: tiers[newTier].accent });
        floaters.push({ x, y, text: '+' + gain, life: .62, color: tiers[newTier].accent, scale: 1 });
        haptic(newTier >= 6 ? 18 : 8);
      }
    }

    if (merges > 0) {
      if (comboWindow > 0) comboCount += merges;
      else comboCount = merges;
      comboWindow = .72;
      bestCombo = Math.max(bestCombo, comboCount);
      if (comboCount >= 2) showCombo(comboCount);
      charge.hammer = Math.min(1, charge.hammer + merges * .10);
      charge.vortex = Math.min(1, charge.vortex + merges * .075);
      charge.prism = Math.min(1, charge.prism + merges * .12);
    }
  }

  function detonateBomb(bomb) {
    if (!bomb?.gem?.alive) return;
    const x = bomb.position.x;
    const y = bomb.position.y;
    removeGem(bomb);
    let cleared = 0;

    for (const b of [...bodies]) {
      if (!b.gem?.alive) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 145 && b.gem.tier <= 4) {
        removeGem(b);
        cleared++;
      } else if (d < 260) {
        const strength = (1 - d / 260) * .022 * b.mass;
        Body.applyForce(b, b.position, {
          x: dx / d * strength,
          y: dy / d * strength - .004 * b.mass
        });
        Sleeping.set(b, false);
      }
    }

    if (cleared) addScore(cleared * 70);
    burst(x, y, '#E7A26A', 34, 225);
    shockwaves.push({ x, y, r: 16, life: .48, color: '#E9B27B' });
    floaters.push({ x, y, text: 'BLAST +' + (cleared * 70), life: .76, color: '#E9C08F', scale: 1 });
    screenShake = Math.max(screenShake, .48);
    haptic([16, 14, 20]);
  }

  function crownBurst(x, y) {
    for (const b of [...bodies]) {
      if (!b.gem?.alive) continue;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (b.gem.tier <= 2 && d < 320) {
        removeGem(b);
        continue;
      }
      if (d < 430) {
        const strength = (1 - d / 430) * .026 * b.mass;
        Body.applyForce(b, b.position, {
          x: dx / d * strength,
          y: dy / d * strength - .006 * b.mass
        });
        Sleeping.set(b, false);
      }
    }
  }

  function addScore(points) {
    const mult = comboCount >= 4 ? 1.35 : comboCount >= 2 ? 1.15 : 1;
    score += Math.round(points * mult);
    if (score > best) {
      best = score;
      saveBest();
    }
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(best);
  }

  function usePower(kind) {
    if (!running || paused || charge[kind] < 1) return;

    if (kind === 'hammer') {
      const targets = [...bodies]
        .filter(b => b.gem?.alive && !b.gem.special)
        .sort((a, b) => a.gem.tier - b.gem.tier || a.position.y - b.position.y)
        .slice(0, Math.min(5, bodies.length));

      for (const b of targets) {
        burst(b.position.x, b.position.y, tiers[b.gem.tier].accent, 8, 135);
        removeGem(b);
      }
      addScore(targets.length * 80);
      showToast('Shatter cleared the smallest gems');
    }

    if (kind === 'vortex') {
      const cx = W / 2;
      const cy = H * .62;
      for (const b of bodies) {
        if (!b.gem?.alive) continue;
        const dx = cx - b.position.x;
        const dy = cy - b.position.y;
        const d = Math.hypot(dx, dy) || 1;
        const radial = .009 * b.mass;
        const tangent = .0065 * b.mass;
        Body.applyForce(b, b.position, {
          x: dx / d * radial + (-dy / d) * tangent,
          y: dy / d * radial + (dx / d) * tangent - .0045 * b.mass
        });
        Body.setAngularVelocity(b, b.angularVelocity + (Math.random() - .5) * .035);
        Sleeping.set(b, false);
      }
      shockwaves.push({ x: cx, y: cy, r: 18, life: .72, color: '#9B8BC8' });
      burst(cx, cy, '#9B8BC8', 30, 210);
      screenShake = .35;
      showToast('Cascade stirred the vault');
    }

    if (kind === 'prism') {
      currentSpecial = 'prism';
      drawPreviews();
      showToast('Loaded gem became a Prism');
    }

    charge[kind] = 0;
    updatePowerUI();
    haptic(20);
  }

  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(.96, dt * 60);
      p.vy = p.vy * Math.pow(.96, dt * 60) + 92 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 31 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.life -= dt;
      s.r += 265 * dt;
      if (s.life <= 0) shockwaves.splice(i, 1);
    }
  }

  function checkDanger(dt) {
    const overloaded = bodies.some(b => {
      if (!b.gem?.alive) return false;
      const age = performance.now() - b.gem.born;
      const settled = b.isSleeping || b.speed < .42;
      return age > 850 && settled && b.bounds.min.y < DANGER_Y;
    });

    if (overloaded) dangerTimer += dt;
    else dangerTimer = Math.max(0, dangerTimer - dt * 2.6);

    if (dangerTimer > .05) {
      dangerHud.hidden = false;
      dangerTimeEl.textContent = Math.max(0, DANGER_LIMIT - dangerTimer).toFixed(1);
    } else {
      dangerHud.hidden = true;
    }

    if (dangerTimer >= DANGER_LIMIT) endGame();
  }

  function endGame() {
    running = false;
    pointerActive = false;
    finalScoreEl.textContent = fmt(score);
    bestMergeEl.textContent = tiers[bestTierReached].name;
    bestChainEl.textContent = bestCombo + '×';
    gameOverOverlay.classList.add('visible');
    haptic([45, 35, 45]);
  }

  function setPause(value) {
    if (!running) return;
    paused = value;
    pauseOverlay.classList.toggle('visible', value);
  }

  function burst(x, y, color, count = 14, speed = 140) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (.35 + Math.random() * .72);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: .30 + Math.random() * .34,
        max: .64,
        color,
        size: 1.4 + Math.random() * 2.6,
        diamond: Math.random() > .55
      });
    }
  }

  function showCombo(count) {
    comboBadge.textContent = count + '× COMBO';
    comboBadge.classList.add('show');
    clearTimeout(comboBadgeTimer);
    comboBadgeTimer = setTimeout(() => comboBadge.classList.remove('show'), 600);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
  }

  function projectedLandingY(x, tierIndex) {
    const r = tiers[tierIndex].r * .94;
    let landing = FLOOR - r;
    for (const b of bodies) {
      if (!b.gem?.alive) continue;
      const br = tiers[b.gem.tier].r * .94;
      const dx = Math.abs(b.position.x - x);
      const reach = r + br;
      if (dx >= reach) continue;
      const vertical = Math.sqrt(Math.max(0, reach * reach - dx * dx));
      const candidate = b.position.y - vertical;
      if (candidate > DROP_Y + r * .1 && candidate < landing) landing = candidate;
    }
    return clamp(landing, DROP_Y + r, FLOOR - r);
  }

  function draw() {
    ctx.save();
    if (screenShake > 0 && !reducedMotion) {
      const m = 4 * screenShake;
      ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m);
    }

    drawBackground();
    drawDanger();
    drawDropper();

    const sorted = [...bodies].filter(b => b.gem?.alive).sort((a, b) => a.position.y - b.position.y);
    for (const b of sorted) {
      drawGem(
        ctx,
        b.position.x,
        b.position.y,
        b.gem.tier,
        tiers[b.gem.tier].r,
        b.angle,
        b.gem.special,
        b.gem.hit,
        b.gem.phaseActive ? 1 : 0,
        1,
        b.gem.gleam
      );
    }

    drawShockwaves();
    drawParticles();
    drawFloaters();
    ctx.restore();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#101426');
    g.addColorStop(.42, '#0A0F20');
    g.addColorStop(1, '#070914');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * .50, H * .73, 40, W * .50, H * .73, H * .68);
    glow.addColorStop(0, 'rgba(72,97,143,.11)');
    glow.addColorStop(.55, 'rgba(54,43,88,.045)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const now = performance.now() * .00005;
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const x = (i * 197.7) % W;
      const y = ((i * 113.4) + now * 28 * (1 + i % 3)) % H;
      ctx.globalAlpha = .06 + (i % 4) * .018;
      ctx.fillStyle = i % 6 === 0 ? '#C9BCE7' : '#A9BDD9';
      ctx.beginPath();
      ctx.arc(x, y, .8 + (i % 3) * .3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = .038;
    ctx.strokeStyle = '#A8A1C2';
    ctx.lineWidth = 1;
    for (let y = 430; y < H; y += 112) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yy = y + Math.sin(x * .023 + y * .009) * 3.3;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,.026)';
    ctx.fillRect(WALL - 2, 0, 2, H);
    ctx.fillRect(W - WALL, 0, 2, H);
  }

  function drawDanger() {
    const active = dangerTimer > 0;
    ctx.save();
    ctx.setLineDash([10, 12]);
    ctx.lineWidth = active ? 2.2 : 1.25;
    ctx.strokeStyle = active ? 'rgba(255,105,132,.88)' : 'rgba(255,255,255,.12)';
    ctx.shadowColor = active ? '#FF5C7A' : 'transparent';
    ctx.shadowBlur = active ? 10 : 0;
    ctx.beginPath();
    ctx.moveTo(WALL + 8, DANGER_Y);
    ctx.lineTo(W - WALL - 8, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.font = '800 14px Manrope, sans-serif';
    ctx.fillStyle = active ? 'rgba(255,176,190,.95)' : 'rgba(255,255,255,.27)';
    ctx.fillText('PRESSURE LINE', W / 2, DANGER_Y - 12);
    ctx.restore();
  }

  function drawDropper() {
    if (!running || paused) return;

    const t = tiers[currentTier];
    const x = clamp(aimX, WALL + t.r, W - WALL - t.r);
    const landingY = projectedLandingY(x, currentTier);

    ctx.save();

    ctx.strokeStyle = 'rgba(222,205,165,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WALL + 90, 53);
    ctx.lineTo(W - WALL - 90, 53);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(234,215,174,.66)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 18, 55);
    ctx.lineTo(x - 8, 72);
    ctx.moveTo(x + 18, 55);
    ctx.lineTo(x + 8, 72);
    ctx.stroke();

    if (pointerActive) {
      const lane = ctx.createLinearGradient(x, DROP_Y + t.r, x, landingY);
      lane.addColorStop(0, 'rgba(183,208,232,.48)');
      lane.addColorStop(.70, 'rgba(143,170,207,.12)');
      lane.addColorStop(1, 'rgba(143,170,207,0)');
      ctx.strokeStyle = lane;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(x, DROP_Y + t.r + 8);
      ctx.lineTo(x, Math.max(DROP_Y + t.r + 10, landingY - t.r - 7));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = .16;
      drawGem(ctx, x, landingY, currentTier, t.r, 0, currentSpecial, 0, 0, 1, .3);
      ctx.globalAlpha = .55;
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, landingY, Math.max(10, t.r * .24), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    drawGem(ctx, x, DROP_Y, currentTier, t.r, 0, currentSpecial, 0, 0, 1, .16);
  }

  function polygonPoints(sides, r, ring = 1) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / sides;
      const rr = r * ring * (i % 2 === 0 ? 1 : .965);
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, a });
    }
    return pts;
  }

  function pathPoints(c, pts) {
    c.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    });
    c.closePath();
  }

  function hexRgb(hex) {
    const s = hex.replace('#', '');
    const n = parseInt(s.length === 3 ? s.split('').map(v => v + v).join('') : s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixColor(aHex, bHex, t, alpha = 1) {
    const a = hexRgb(aHex);
    const b = hexRgb(bHex);
    const u = clamp(t, 0, 1);
    const r = Math.round(a.r + (b.r - a.r) * u);
    const g = Math.round(a.g + (b.g - a.g) * u);
    const bl = Math.round(a.b + (b.b - a.b) * u);
    return 'rgba(' + r + ',' + g + ',' + bl + ',' + alpha + ')';
  }

  function drawFacet(c, points, fill) {
    pathPoints(c, points);
    c.fillStyle = fill;
    c.fill();
  }

  function drawGem(c, x, y, tierIndex, r, angle = 0, special = null, hit = 0, phase = 0, alpha = 1, gleamPhase = 0) {
    const t = tiers[tierIndex];
    const outer = polygonPoints(t.sides, r, 1);
    const inner = polygonPoints(t.sides, r, .48);
    const originalAlpha = alpha * (phase > 0 ? .46 : 1);

    c.save();
    c.translate(x, y);
    c.rotate(angle);

    const squash = 1 - Math.min(.05, hit * .035);
    c.scale(1 + (1 - squash) * .60, squash);
    c.globalAlpha = originalAlpha;

    c.save();
    c.shadowColor = 'rgba(0,0,0,.38)';
    c.shadowBlur = 12 + r * .035;
    c.shadowOffsetY = 5;
    pathPoints(c, outer);
    c.fillStyle = mixColor(t.dark, '#060811', .34);
    c.fill();
    c.restore();

    pathPoints(c, outer);
    const baseGrad = c.createLinearGradient(-r * .65, -r, r * .42, r);
    if (special === 'prism') {
      baseGrad.addColorStop(0, '#EEF8FC');
      baseGrad.addColorStop(.25, '#79B7C9');
      baseGrad.addColorStop(.48, '#8C77B6');
      baseGrad.addColorStop(.70, '#C7A56E');
      baseGrad.addColorStop(1, '#4B8873');
    } else if (special === 'bomb') {
      baseGrad.addColorStop(0, '#EECF9A');
      baseGrad.addColorStop(.30, '#C27648');
      baseGrad.addColorStop(.72, '#853D43');
      baseGrad.addColorStop(1, '#382333');
    } else if (special === 'phase') {
      baseGrad.addColorStop(0, '#E5F1F7');
      baseGrad.addColorStop(.30, t.accent);
      baseGrad.addColorStop(.68, '#666D9D');
      baseGrad.addColorStop(1, '#262E49');
    } else {
      baseGrad.addColorStop(0, t.accent);
      baseGrad.addColorStop(.28, t.color);
      baseGrad.addColorStop(.76, t.color);
      baseGrad.addColorStop(1, t.dark);
    }
    c.fillStyle = baseGrad;
    c.fill();

    c.save();
    pathPoints(c, outer);
    c.clip();

    let bestIncidence = 0;
    let bestFacet = 0;

    for (let i = 0; i < t.sides; i++) {
      const j = (i + 1) % t.sides;
      const a1 = outer[i].a;
      const a2 = outer[j].a + (j === 0 ? Math.PI * 2 : 0);
      const mid = (a1 + a2) / 2;
      const incidence = Math.max(0, Math.cos((mid + angle) - LIGHT_ANGLE));
      const back = Math.max(0, -Math.cos((mid + angle) - LIGHT_ANGLE));
      if (incidence > bestIncidence) {
        bestIncidence = incidence;
        bestFacet = i;
      }

      const ringFill = mixColor(
        t.color,
        incidence > .28 ? '#FFFFFF' : t.dark,
        incidence > .28 ? .05 + incidence * .26 : .10 + back * .22,
        .98
      );

      drawFacet(c, [outer[i], outer[j], inner[j], inner[i]], ringFill);

      const innerIncidence = Math.max(0, Math.cos((mid + angle + .55) - LIGHT_ANGLE));
      const innerFill = mixColor(
        t.dark,
        t.accent,
        .22 + innerIncidence * .34,
        .72
      );
      drawFacet(c, [{ x: 0, y: -r * .055 }, inner[i], inner[j]], innerFill);
    }

    const table = polygonPoints(t.sides, r, .30);
    pathPoints(c, table);
    const tableGrad = c.createLinearGradient(-r * .2, -r * .3, r * .25, r * .25);
    tableGrad.addColorStop(0, 'rgba(255,255,255,.24)');
    tableGrad.addColorStop(.45, mixColor(t.accent, '#FFFFFF', .10, .18));
    tableGrad.addColorStop(1, 'rgba(5,8,20,.22)');
    c.fillStyle = tableGrad;
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)';
    c.lineWidth = Math.max(1, r * .010);
    c.stroke();

    for (let i = 0; i < t.sides; i++) {
      const j = (i + 1) % t.sides;
      const a1 = outer[i].a;
      const a2 = outer[j].a + (j === 0 ? Math.PI * 2 : 0);
      const mid = (a1 + a2) / 2;
      const incidence = Math.max(0, Math.cos((mid + angle) - LIGHT_ANGLE));
      if (incidence < .72) continue;
      c.beginPath();
      c.moveTo(outer[i].x, outer[i].y);
      c.lineTo(outer[j].x, outer[j].y);
      c.strokeStyle = 'rgba(255,255,255,' + ((incidence - .72) * 1.2).toFixed(3) + ')';
      c.lineWidth = Math.max(1.1, r * .016);
      c.stroke();
    }

    const specX = -r * .24;
    const specY = -r * .32;
    const spec = c.createRadialGradient(specX, specY, 0, specX, specY, r * .34);
    spec.addColorStop(0, 'rgba(255,255,255,.26)');
    spec.addColorStop(.32, 'rgba(255,255,255,.08)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = spec;
    c.fillRect(-r, -r, r * 2, r * 2);

    c.restore();

    pathPoints(c, outer);
    c.lineWidth = Math.max(1.1, r * .014);
    c.strokeStyle = 'rgba(255,255,255,.31)';
    c.stroke();

    if (alpha > .65 && phase <= 0 && r >= 29) {
      const j = (bestFacet + 1) % t.sides;
      const px = (outer[bestFacet].x + outer[j].x) * .34;
      const py = (outer[bestFacet].y + outer[j].y) * .34;
      const glint = clamp((bestIncidence - .93) / .07, 0, 1);
      if (glint > .02) {
        const size = (2.5 + r * .055) * glint;
        c.save();
        c.translate(px, py);
        c.rotate(-angle * .28);
        c.globalAlpha = .18 + glint * .34;
        c.strokeStyle = '#FFFFFF';
        c.lineWidth = Math.max(1, r * .008);
        c.beginPath();
        c.moveTo(-size, 0);
        c.lineTo(size, 0);
        c.moveTo(0, -size * .70);
        c.lineTo(0, size * .70);
        c.stroke();
        c.restore();
      }
    }

    if (special) {
      const s = Math.max(14, r * .22);
      c.save();
      c.globalAlpha = Math.min(1, originalAlpha + .12);
      c.fillStyle = 'rgba(5,7,15,.48)';
      c.strokeStyle = 'rgba(255,255,255,.34)';
      c.lineWidth = Math.max(1.2, r * .011);
      c.beginPath();
      c.arc(0, 0, s * .68, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.strokeStyle = '#F7F5EF';
      c.lineWidth = Math.max(1.4, r * .013);
      c.lineCap = 'round';
      c.lineJoin = 'round';

      if (special === 'bomb') {
        c.beginPath();
        c.arc(0, 2, s * .28, 0, Math.PI * 2);
        c.moveTo(s * .16, -s * .20);
        c.quadraticCurveTo(s * .34, -s * .48, s * .48, -s * .34);
        c.stroke();
      } else if (special === 'prism') {
        c.beginPath();
        c.moveTo(0, -s * .42);
        c.lineTo(s * .36, 0);
        c.lineTo(0, s * .44);
        c.lineTo(-s * .36, 0);
        c.closePath();
        c.stroke();
      } else {
        c.beginPath();
        c.arc(-s * .08, 0, s * .30, -Math.PI * .62, Math.PI * .62);
        c.stroke();
      }
      c.restore();
    }

    c.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      if (p.diamond) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawShockwaves() {
    for (const s of shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.font = '800 ' + Math.max(16, 16 * (f.scale || 1)) + 'px Manrope, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.shadowBlur = 5;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawPreview(el, tier, special, empty = false) {
    const c = el.getContext('2d');
    c.clearRect(0, 0, el.width, el.height);
    if (empty) {
      c.save();
      c.globalAlpha = .28;
      c.setLineDash([4, 5]);
      c.strokeStyle = '#D9D0E7';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(el.width / 2, el.height / 2, 17, 0, Math.PI * 2);
      c.stroke();
      c.restore();
      return;
    }
    drawGem(c, el.width / 2, el.height / 2, tier, Math.min(el.width, el.height) * .31, -.10, special, 0, 0, 1, .4);
  }

  function drawPreviews() {
    drawPreview(nextPreview, nextTier, null, false);
    drawPreview(holdPreview, heldTier ?? 0, heldSpecial, heldTier == null);
  }

  function updateUI() {
    scoreEl.textContent = fmt(score);
    bestEl.textContent = fmt(best);
    updatePowerUI();
  }

  function updatePowerUI() {
    for (const key of Object.keys(powerEls)) {
      const pct = Math.round(charge[key] * 100);
      powerEls[key].fill.style.height = pct + '%';
      powerEls[key].button.disabled = charge[key] < 1 || !running || paused;
      powerEls[key].button.setAttribute('aria-label', key + ' ability ' + pct + '% charged');
    }
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener('pointerdown', e => {
    if (!running || paused || shotCooldown > 0) return;
    e.preventDefault();
    const p = pointerPos(e);
    pointerActive = true;
    pointerMoved = false;
    pointerStartX = p.x;
    pointerStartY = p.y;
    aimX = p.x;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener('pointermove', e => {
    if (!running || paused || !pointerActive) return;
    const p = pointerPos(e);
    if (Math.hypot(p.x - pointerStartX, p.y - pointerStartY) > 10) pointerMoved = true;
    aimX = p.x;
  });

  canvas.addEventListener('pointerup', e => {
    if (!running || paused || !pointerActive) return;
    e.preventDefault();
    const p = pointerPos(e);
    aimX = p.x;
    dropCurrent();
    pointerActive = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener('pointercancel', e => {
    pointerActive = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  $('holdButton').addEventListener('click', holdCurrent);
  powerEls.hammer.button.addEventListener('click', () => usePower('hammer'));
  powerEls.vortex.button.addEventListener('click', () => usePower('vortex'));
  powerEls.prism.button.addEventListener('click', () => usePower('prism'));
  $('pauseButton').addEventListener('click', () => setPause(true));
  $('resumeButton').addEventListener('click', () => setPause(false));
  $('restartFromPause').addEventListener('click', () => {
    pauseOverlay.classList.remove('visible');
    resetGame();
  });
  $('startButton').addEventListener('click', () => {
    startOverlay.classList.remove('visible');
    resetGame();
  });
  $('restartButton').addEventListener('click', () => {
    gameOverOverlay.classList.remove('visible');
    resetGame();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running && !paused) setPause(true);
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      dropCurrent();
    }
    if (e.key.toLowerCase() === 'c') holdCurrent();
    if (e.key === 'Escape') setPause(!paused);
  });

  function frame(now) {
    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    accumulator += delta;

    while (accumulator >= STEP_MS) {
      stepPhysics(STEP_MS);
      accumulator -= STEP_MS;
    }

    draw();
    requestAnimationFrame(frame);
  }

  function fmt(n) {
    return Math.max(0, Math.floor(n)).toLocaleString('en-CA');
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  drawPreviews();
  updateUI();
  requestAnimationFrame(frame);
})();
