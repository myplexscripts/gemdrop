const GEM_CUTS = {
  round:    { label: 'Round',    gem: 'Citrine',   color: '#DFA915' },
  oval:     { label: 'Oval',     gem: 'Amethyst',  color: '#873BE8' },
  cushion:  { label: 'Cushion',  gem: 'Sapphire',  color: '#1A52D6' },
  emerald:  { label: 'Emerald',  gem: 'Aquamarine',color: '#1BC9AD' },
  pear:     { label: 'Pear',     gem: 'Morganite', color: '#EC91A2' },
  marquise: { label: 'Marquise', gem: 'Peridot',   color: '#79CC2C' }
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (v) => {
  const len = Math.hypot(v.x, v.y, v.z || 0) || 1;
  return { x: v.x / len, y: v.y / len, z: (v.z || 0) / len };
};
const rotateZ = (v, deg) => {
  const a = deg * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
};
const reflect = (v, n) => {
  const d = dot(v, n);
  return { x: v.x - 2 * d * n.x, y: v.y - 2 * d * n.y, z: v.z - 2 * d * n.z };
};

function hexToHsl(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function polygonPoints(n, rx, ry = rx, rotDeg = 0, cx = 256, cy = 256) {
  const pts = [];
  const rot = rotDeg * Math.PI / 180;
  for (let i = 0; i < n; i += 1) {
    const a = rot + Math.PI * 2 * i / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

function roundedRectPoints(w, h, radius, pointsPerCorner = 4, cx = 256, cy = 256) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - h / 2, y1 = cy + h / 2;
  const r = Math.min(radius, w / 2, h / 2);
  const corners = [
    { cx: x1 - r, cy: y0 + r, start: -90, end: 0 },
    { cx: x1 - r, cy: y1 - r, start: 0, end: 90 },
    { cx: x0 + r, cy: y1 - r, start: 90, end: 180 },
    { cx: x0 + r, cy: y0 + r, start: 180, end: 270 }
  ];
  const pts = [];
  corners.forEach((corner, cornerIndex) => {
    for (let i = 0; i < pointsPerCorner; i += 1) {
      const t = i / pointsPerCorner;
      const a = (corner.start + (corner.end - corner.start) * t) * Math.PI / 180;
      if (!(cornerIndex > 0 && i === 0)) {
        pts.push([corner.cx + Math.cos(a) * r, corner.cy + Math.sin(a) * r]);
      }
    }
  });
  return pts;
}

function pearPoints(rx = 132, ry = 178, cx = 256, cy = 256) {
  return [
    [cx, cy - ry],
    [cx + 0.30 * rx, cy - 0.83 * ry],
    [cx + 0.58 * rx, cy - 0.58 * ry],
    [cx + 0.82 * rx, cy - 0.20 * ry],
    [cx + 0.95 * rx, cy + 0.18 * ry],
    [cx + 0.78 * rx, cy + 0.52 * ry],
    [cx + 0.40 * rx, cy + 0.84 * ry],
    [cx, cy + 0.98 * ry],
    [cx - 0.40 * rx, cy + 0.84 * ry],
    [cx - 0.78 * rx, cy + 0.52 * ry],
    [cx - 0.95 * rx, cy + 0.18 * ry],
    [cx - 0.82 * rx, cy - 0.20 * ry],
    [cx - 0.58 * rx, cy - 0.58 * ry],
    [cx - 0.30 * rx, cy - 0.83 * ry]
  ];
}

function marquisePoints(rx = 176, ry = 96, cx = 256, cy = 256) {
  return [
    [cx, cy - ry],
    [cx + 0.34 * rx, cy - 0.86 * ry],
    [cx + 0.64 * rx, cy - 0.58 * ry],
    [cx + 0.88 * rx, cy - 0.22 * ry],
    [cx + rx, cy],
    [cx + 0.88 * rx, cy + 0.22 * ry],
    [cx + 0.64 * rx, cy + 0.58 * ry],
    [cx + 0.34 * rx, cy + 0.86 * ry],
    [cx, cy + ry],
    [cx - 0.34 * rx, cy + 0.86 * ry],
    [cx - 0.64 * rx, cy + 0.58 * ry],
    [cx - 0.88 * rx, cy + 0.22 * ry],
    [cx - rx, cy],
    [cx - 0.88 * rx, cy - 0.22 * ry],
    [cx - 0.64 * rx, cy - 0.58 * ry],
    [cx - 0.34 * rx, cy - 0.86 * ry]
  ];
}

function scalePoints(points, sx, sy = sx, cx = 256, cy = 256) {
  return points.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy]);
}

function centroid(points) {
  const s = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [s[0] / points.length, s[1] / points.length];
}

function averagePoint(points) {
  return centroid(points);
}

function pointsToString(points) {
  return points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
}

function radialNormal(points, xWeight, zValue, twist = 0) {
  const [mx, my] = averagePoint(points);
  const a = Math.atan2(my - 256, mx - 256) + twist;
  return norm({ x: Math.cos(a) * xWeight, y: Math.sin(a) * xWeight, z: zValue });
}

function facet(points, tone, normal, layer, opacity = 0.94) {
  return { points, tone, normal, layer, opacity };
}

function splitBandFacets(outer, inner, layer, ringWeight, zValue, twist = 0) {
  const out = [];
  for (let i = 0; i < outer.length; i += 1) {
    const a = outer[i];
    const b = outer[(i + 1) % outer.length];
    const c = inner[(i + 1) % inner.length];
    const d = inner[i];
    const m1 = [(a[0] + d[0]) / 2, (a[1] + d[1]) / 2];
    const m2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    const center = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4];
    const f1 = [a, b, m2, center, m1];
    const f2 = [m1, center, c, d];
    const f3 = [m2, c, center];
    out.push(facet(f1, i % 4, radialNormal(f1, ringWeight, zValue, twist), layer, 0.92));
    out.push(facet(f2, (i + 1) % 4, radialNormal(f2, ringWeight * 0.86, zValue + 0.06, -twist), layer, 0.94));
    out.push(facet(f3, (i + 2) % 4, radialNormal(f3, ringWeight * 0.72, zValue + 0.1, twist * 0.5), layer, 0.90));
  }
  return out;
}

function splitInnerBand(inner, table, layer, ringWeight, zValue) {
  const out = [];
  for (let i = 0; i < inner.length; i += 1) {
    const a = inner[i];
    const b = inner[(i + 1) % inner.length];
    const c = table[(i + 1) % table.length];
    const d = table[i];
    const center = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4];
    const f1 = [a, b, center];
    const f2 = [a, center, d];
    const f3 = [center, c, d];
    out.push(facet(f1, i % 4, radialNormal(f1, ringWeight, zValue), layer, 0.94));
    out.push(facet(f2, (i + 1) % 4, radialNormal(f2, ringWeight * 0.66, zValue + 0.08), layer, 0.96));
    out.push(facet(f3, (i + 2) % 4, radialNormal(f3, ringWeight * 0.56, zValue + 0.1), layer, 0.96));
  }
  return out;
}

function splitTableFacets(table, layer) {
  const center = centroid(table);
  const out = [];
  for (let i = 0; i < table.length; i += 1) {
    const a = table[i];
    const b = table[(i + 1) % table.length];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const f1 = [a, mid, center];
    const f2 = [mid, b, center];
    out.push(facet(f1, i % 4, radialNormal(f1, 0.18, 0.98), layer, 0.98));
    out.push(facet(f2, (i + 1) % 4, radialNormal(f2, 0.12, 0.99), layer, 0.98));
  }
  return out;
}

function buildBrilliant(outer, opts = {}) {
  const r1 = scalePoints(outer, opts.r1 ?? 0.90, opts.r1y ?? opts.r1 ?? 0.90);
  const r2 = scalePoints(outer, opts.r2 ?? 0.72, opts.r2y ?? opts.r2 ?? 0.72);
  const r3 = scalePoints(outer, opts.r3 ?? 0.50, opts.r3y ?? opts.r3 ?? 0.50);
  const table = scalePoints(outer, opts.table ?? 0.28, opts.tableY ?? opts.table ?? 0.28);
  const facets = [
    ...splitBandFacets(outer, r1, 0, 0.92, 0.24, 0.05),
    ...splitBandFacets(r1, r2, 1, 0.72, 0.46, -0.04),
    ...splitBandFacets(r2, r3, 2, 0.48, 0.68, 0.03),
    ...splitInnerBand(r3, table, 3, 0.24, 0.88),
    ...splitTableFacets(table, 4)
  ];
  return { outer, facets, rings: [outer, r1, r2, r3, table], cabochon: false, stepCut: false };
}

function buildEmeraldStep(outer) {
  const r1 = scalePoints(outer, 0.90, 0.90);
  const r2 = scalePoints(outer, 0.74, 0.74);
  const r3 = scalePoints(outer, 0.58, 0.58);
  const table = scalePoints(outer, 0.40, 0.40);
  const facets = [];
  const rings = [outer, r1, r2, r3, table];
  const weights = [0.94, 0.74, 0.54, 0.30];
  const zValues = [0.22, 0.42, 0.62, 0.84];
  for (let band = 0; band < rings.length - 1; band += 1) {
    const a = rings[band], b = rings[band + 1];
    for (let i = 0; i < a.length; i += 1) {
      const p1 = a[i], p2 = a[(i + 1) % a.length], p3 = b[(i + 1) % b.length], p4 = b[i];
      const poly = [p1, p2, p3, p4];
      const normal = radialNormal(poly, weights[band], zValues[band]);
      facets.push(facet(poly, (i + band) % 4, normal, band, 0.95));
      if (band < 3) {
        const midA = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
        const midB = [(p4[0] + p3[0]) / 2, (p4[1] + p3[1]) / 2];
        const poly2 = [midA, p2, p3, midB];
        facets.push(facet(poly2, (i + band + 1) % 4, radialNormal(poly2, weights[band] * 0.82, zValues[band] + 0.08), band, 0.92));
      }
    }
  }
  facets.push(...splitTableFacets(table, 4));
  return { outer, facets, rings, cabochon: false, stepCut: true };
}

function buildGeometry(type) {
  switch (type) {
    case 'round':
      return buildBrilliant(polygonPoints(16, 170, 170, -78), { r1: 0.90, r2: 0.72, r3: 0.50, table: 0.26 });
    case 'oval':
      return buildBrilliant(polygonPoints(16, 148, 184, -78), { r1: 0.90, r1y: 0.88, r2: 0.72, r2y: 0.70, r3: 0.52, r3y: 0.50, table: 0.28, tableY: 0.26 });
    case 'cushion':
      return buildBrilliant(roundedRectPoints(320, 300, 54, 4), { r1: 0.90, r2: 0.72, r3: 0.52, table: 0.30 });
    case 'emerald':
      return buildEmeraldStep(roundedRectPoints(250, 352, 28, 2));
    case 'pear':
      return buildBrilliant(pearPoints(), { r1: 0.90, r1y: 0.90, r2: 0.74, r2y: 0.72, r3: 0.54, r3y: 0.50, table: 0.30, tableY: 0.22 });
    case 'marquise':
      return buildBrilliant(marquisePoints(), { r1: 0.90, r2: 0.72, r3: 0.50, table: 0.26, tableY: 0.20 });
    default:
      return buildBrilliant(polygonPoints(16, 170, 170, -78), { r1: 0.90, r2: 0.72, r3: 0.50, table: 0.26 });
  }
}

let gemCounter = 0;

class IntricateReactiveGem {
  constructor(options = {}) {
    this.type = options.type || 'round';
    this.size = options.size || 460;
    this.angle = options.angle || 0;
    this.autoSpin = false;
    this.lastTime = 0;
    this.id = `intricateGem${++gemCounter}`;
    this.light = norm(options.light || { x: -0.58, y: -0.46, z: 0.67 });
    this.view = { x: 0, y: 0, z: 1 };
    this.target = null;
    this.rebuild(this.type);
  }

  hsl(h, s, l) {
    return `hsl(${h} ${s}% ${l}%)`;
  }

  rebuild(type) {
    this.type = type;
    this.data = GEM_CUTS[type];
    this.base = hexToHsl(this.data.color);
    this.geometry = buildGeometry(type);
    this.facetEls = [];
    this.lineEls = [];
    this.createSvg();
  }

  createSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const outer = pointsToString(this.geometry.outer);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 512 512');
    svg.setAttribute('width', this.size);
    svg.setAttribute('height', this.size);
    svg.setAttribute('aria-label', `${this.data.gem} ${this.data.label} reactive gemstone`);

    const rim = this.hsl(this.base.h, clamp(this.base.s * 0.86, 0, 100), clamp(this.base.l + 18, 56, 82));
    const rim2 = this.hsl(this.base.h + 1, clamp(this.base.s * 0.94, 0, 100), clamp(this.base.l + 10, 48, 72));

    svg.innerHTML = `
      <defs>
        <clipPath id="${this.id}-clip"><polygon points="${outer}"></polygon></clipPath>
      </defs>
      <g data-role="rotate">
        <g clip-path="url(#${this.id}-clip)">
          <polygon data-role="base" points="${outer}"></polygon>
          <g data-role="facets"></g>
          <g data-role="dynamic-highlights"></g>
        </g>
        <g data-role="lines"></g>
        <polygon data-role="rim" points="${outer}" fill="none" stroke="${rim}" stroke-width="4.4" stroke-linejoin="round"></polygon>
        <polygon data-role="rim-inner" points="${outer}" fill="none" stroke="${rim2}" stroke-opacity="0.35" stroke-width="1.6" stroke-linejoin="round"></polygon>
      </g>
    `;

    const facetsGroup = svg.querySelector('[data-role="facets"]');
    const linesGroup = svg.querySelector('[data-role="lines"]');
    this.geometry.facets.forEach((f) => {
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', pointsToString(f.points));
      facetsGroup.appendChild(poly);
      this.facetEls.push(poly);

      const line = document.createElementNS(ns, 'polygon');
      line.setAttribute('points', pointsToString(f.points));
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke-width', this.geometry.stepCut ? '1.1' : '1.0');
      linesGroup.appendChild(line);
      this.lineEls.push(line);
    });

    this.svg = svg;
    this.rotateGroup = svg.querySelector('[data-role="rotate"]');
    this.baseEl = svg.querySelector('[data-role="base"]');
    this.highlightLayer = svg.querySelector('[data-role="dynamic-highlights"]');
    this.update(this.angle);
  }

  mount(target) {
    this.target = target;
    if (target) {
      target.innerHTML = '';
      target.appendChild(this.svg);
    }
    return this;
  }

  setType(type) {
    this.rebuild(type);
    if (this.target) this.mount(this.target);
  }

  setRotation(angle) {
    this.angle = angle;
    this.update(angle);
  }

  update(angle = this.angle) {
    this.angle = angle;
    this.rotateGroup.setAttribute('transform', `rotate(${angle} 256 256)`);
    const baseHue = this.base.h;
    const baseSat = Math.max(84, this.base.s);
    this.baseEl.setAttribute('fill', this.hsl(baseHue, clamp(baseSat + 4, 0, 100), clamp(this.base.l - 8, 24, 42)));

    [...this.highlightLayer.querySelectorAll('[data-dyn="1"]')].forEach((el) => el.remove());
    const tintLight = norm({ x: -this.light.x * 0.24, y: -this.light.y * 0.24, z: 1 });
    const strokeColor = this.hsl(baseHue + 1, clamp(baseSat * 0.86, 0, 100), clamp(this.base.l + 18, 48, 78));

    this.geometry.facets.forEach((facetData, index) => {
      const n = rotateZ(facetData.normal, angle);
      const diffuse = Math.max(0, dot(n, this.light));
      const facing = clamp(n.z, 0, 1);
      const transmission = Math.max(0, dot(n, tintLight));
      const rim = Math.pow(1 - facing, 1.15);
      const layerBoost = [0.00, 0.02, 0.04, 0.06, 0.10][facetData.layer] || 0;
      const toneOffset = [0.18, 0.08, -0.02, -0.10][facetData.tone % 4];
      const energy = 0.22 + layerBoost + diffuse * 0.34 + transmission * 0.28 + rim * 0.16 + facing * 0.12;
      const lightness = clamp(36 + (energy + toneOffset) * (this.geometry.stepCut ? 20 : 22), 32, this.geometry.stepCut ? 70 : 74);
      const saturation = clamp(baseSat + 8 + diffuse * 4 + transmission * 6 + rim * 3 + (facetData.layer >= 3 ? 2 : 0), 84, 100);
      const hue = baseHue + (facetData.tone === 0 ? 2 : facetData.tone === 1 ? -1 : facetData.tone === 2 ? 1 : -2) + transmission * 1.4 - rim * 1.2;
      this.facetEls[index].setAttribute('fill', this.hsl(hue, saturation, lightness));
      this.facetEls[index].setAttribute('fill-opacity', facetData.opacity.toFixed(2));

      const toLight = { x: -this.light.x, y: -this.light.y, z: -this.light.z };
      const reflected = reflect(toLight, n);
      const spec = Math.pow(Math.max(0, dot(reflected, this.view)), this.geometry.stepCut ? 16 : 18);
      const caustic = Math.pow(Math.max(0, dot(n, tintLight)), this.geometry.stepCut ? 2.8 : 3.0) * 0.18;
      const highlightStrength = clamp(spec * 1.15 + caustic + diffuse * 0.03, 0, this.geometry.stepCut ? 0.28 : 0.34);
      if (highlightStrength > 0.02) {
        const hl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hl.setAttribute('points', pointsToString(facetData.points));
        hl.setAttribute('fill', this.hsl(baseHue + 2, clamp(baseSat * 0.72, 0, 100), clamp(this.base.l + 26, 62, 84)));
        hl.setAttribute('fill-opacity', (highlightStrength * 0.9).toFixed(3));
        hl.style.mixBlendMode = 'screen';
        hl.dataset.dyn = '1';
        this.highlightLayer.appendChild(hl);
      }

      this.lineEls[index].setAttribute('stroke', strokeColor);
      this.lineEls[index].setAttribute('stroke-opacity', clamp(0.10 + diffuse * 0.14 + transmission * 0.06, 0.08, 0.26).toFixed(3));
    });
  }

  start() {
    if (this.autoSpin) return;
    this.autoSpin = true;
    const tick = (time) => {
      if (!this.autoSpin) return;
      if (!this.lastTime) this.lastTime = time;
      const dt = time - this.lastTime;
      this.lastTime = time;
      this.angle = (this.angle + dt * 0.018) % 360;
      this.update(this.angle);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stop() {
    this.autoSpin = false;
    this.lastTime = 0;
  }
}

window.GEM_CUTS = GEM_CUTS;
window.IntricateReactiveGem = IntricateReactiveGem;


const REACTIVE_GEM_CUTS = {
  round:    { label: 'Round',    collision: 'brilliant', stepCut: false },
  oval:     { label: 'Oval',     collision: 'oval',      stepCut: false },
  cushion:  { label: 'Cushion',  collision: 'cushion',   stepCut: false },
  emerald:  { label: 'Emerald',  collision: 'emerald',   stepCut: true  },
  pear:     { label: 'Pear',     collision: 'pear',      stepCut: false },
  marquise: { label: 'Marquise', collision: 'navette',   stepCut: false }
};

function reactivePolygonPath(ctx, points, scale = 1) {
  if (!points || !points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
  ctx.closePath();
}

function reactiveFacetStyleValue(facetData) {
  const layerBoost = [0.00, 0.02, 0.04, 0.06, 0.10][facetData.layer] || 0;
  const toneOffset = [0.18, 0.08, -0.02, -0.10][facetData.tone % 4];
  return clamp(0.52 + layerBoost + toneOffset * 0.72, 0.18, 0.88);
}

function createReactiveGemDataCanvas(type, size = 512) {
  const geometry = buildGeometry(type);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: true });
  const scale = size / 512;
  ctx.clearRect(0, 0, size, size);

  reactivePolygonPath(ctx, geometry.outer, scale);
  ctx.fillStyle = 'rgba(128,128,132,1)';
  ctx.fill();

  geometry.facets.forEach((facetData) => {
    const n = facetData.normal;
    const r = Math.round(clamp(n.x * 0.5 + 0.5, 0, 1) * 255);
    const g = Math.round(clamp(n.y * 0.5 + 0.5, 0, 1) * 255);
    const b = Math.round(reactiveFacetStyleValue(facetData) * 255);
    reactivePolygonPath(ctx, facetData.points, scale);
    ctx.fillStyle = `rgba(${r},${g},${b},${clamp(facetData.opacity, 0, 1)})`;
    ctx.fill();
  });

  return canvas;
}

function renderReactiveGemPreview(type, color, angle = 0, size = 256) {
  const geometry = buildGeometry(type);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: true });
  const scale = size / 512;
  const base = hexToHsl(color);
  const baseSat = Math.max(84, base.s);
  const light = norm({ x: -0.58, y: -0.46, z: 0.67 });
  const tintLight = norm({ x: -light.x * 0.24, y: -light.y * 0.24, z: 1 });
  const view = { x: 0, y: 0, z: 1 };

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-size / 2, -size / 2);

  reactivePolygonPath(ctx, geometry.outer, scale);
  ctx.fillStyle = `hsl(${base.h} ${clamp(baseSat + 4, 0, 100)}% ${clamp(base.l - 8, 24, 42)}%)`;
  ctx.fill();

  const strokeColor = `hsl(${base.h + 1} ${clamp(baseSat * 0.86, 0, 100)}% ${clamp(base.l + 18, 48, 78)}%)`;

  geometry.facets.forEach((facetData) => {
    const n = rotateZ(facetData.normal, angle);
    const diffuse = Math.max(0, dot(n, light));
    const facing = clamp(n.z, 0, 1);
    const transmission = Math.max(0, dot(n, tintLight));
    const rim = Math.pow(1 - facing, 1.15);
    const layerBoost = [0.00, 0.02, 0.04, 0.06, 0.10][facetData.layer] || 0;
    const toneOffset = [0.18, 0.08, -0.02, -0.10][facetData.tone % 4];
    const energy = 0.22 + layerBoost + diffuse * 0.34 + transmission * 0.28 + rim * 0.16 + facing * 0.12;
    const lightness = clamp(36 + (energy + toneOffset) * (geometry.stepCut ? 20 : 22), 32, geometry.stepCut ? 70 : 74);
    const saturation = clamp(baseSat + 8 + diffuse * 4 + transmission * 6 + rim * 3 + (facetData.layer >= 3 ? 2 : 0), 84, 100);
    const hue = base.h + (facetData.tone === 0 ? 2 : facetData.tone === 1 ? -1 : facetData.tone === 2 ? 1 : -2) + transmission * 1.4 - rim * 1.2;

    reactivePolygonPath(ctx, facetData.points, scale);
    ctx.globalAlpha = facetData.opacity;
    ctx.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`;
    ctx.fill();

    const toLight = { x: -light.x, y: -light.y, z: -light.z };
    const reflected = reflect(toLight, n);
    const spec = Math.pow(Math.max(0, dot(reflected, view)), geometry.stepCut ? 16 : 18);
    const caustic = Math.pow(Math.max(0, dot(n, tintLight)), geometry.stepCut ? 2.8 : 3.0) * 0.18;
    const highlightStrength = clamp(spec * 1.15 + caustic + diffuse * 0.03, 0, geometry.stepCut ? 0.28 : 0.34);

    if (highlightStrength > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = highlightStrength * 0.9;
      ctx.fillStyle = `hsl(${base.h + 2} ${clamp(baseSat * 0.72, 0, 100)}% ${clamp(base.l + 26, 62, 84)}%)`;
      reactivePolygonPath(ctx, facetData.points, scale);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = clamp(0.10 + diffuse * 0.14 + transmission * 0.06, 0.08, 0.26);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = (geometry.stepCut ? 1.1 : 1.0) * scale;
    reactivePolygonPath(ctx, facetData.points, scale);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  ctx.strokeStyle = `hsl(${base.h} ${clamp(base.s * 0.86, 0, 100)}% ${clamp(base.l + 18, 56, 82)}%)`;
  ctx.lineWidth = 4.4 * scale;
  ctx.lineJoin = 'round';
  reactivePolygonPath(ctx, geometry.outer, scale);
  ctx.stroke();
  ctx.restore();
  return canvas;
}

window.ReactiveGemSystem = {
  cuts: REACTIVE_GEM_CUTS,
  buildGeometry,
  createDataCanvas: createReactiveGemDataCanvas,
  renderPreviewCanvas: renderReactiveGemPreview
};
