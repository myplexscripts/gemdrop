class FacetedGem {
  constructor(options = {}) {
    this.size = options.size || 512;
    this.hue = options.hue ?? 272;
    this.saturation = options.saturation ?? 86;
    this.light = this.normalize(options.light || { x: -0.58, y: -0.52, z: 0.63 });
    this.view = { x: 0, y: 0, z: 1 };
    this.angle = 0;
    this.autoSpin = false;
    this.lastTime = 0;

    this.facets = [
      { id: "f1",  points: "256,42 167,90 109,194 256,164",               n: { x: -0.62, y: -0.38, z: 0.69 }, hue: -2, sat: 2 },
      { id: "f2",  points: "256,42 345,90 403,194 256,164",               n: { x: 0.44, y: -0.52, z: 0.73 }, hue: 2,  sat: 4 },
      { id: "f3",  points: "167,90 209,147 256,164 109,194",              n: { x: -0.88, y: -0.06, z: 0.47 }, hue: -4, sat: 5 },
      { id: "f4",  points: "345,90 303,147 256,164 403,194",              n: { x: 0.86, y: -0.05, z: 0.50 }, hue: 2,  sat: 2 },
      { id: "f5",  points: "209,147 256,164 213,247 161,231",             n: { x: -0.42, y: -0.18, z: 0.89 }, hue: 1,  sat: -2 },
      { id: "f6",  points: "303,147 256,164 299,247 351,231",             n: { x: 0.40, y: -0.16, z: 0.90 }, hue: -1, sat: 0 },
      { id: "f7",  points: "109,194 161,231 131,329",                     n: { x: -0.96, y: 0.02, z: 0.29 }, hue: -5, sat: 4 },
      { id: "f8",  points: "403,194 351,231 381,329",                     n: { x: 0.96, y: 0.03, z: 0.28 }, hue: -8, sat: 5 },
      { id: "f9",  points: "161,231 213,247 201,333 131,329",             n: { x: -0.58, y: 0.34, z: 0.74 }, hue: 1,  sat: -3 },
      { id: "f10", points: "351,231 299,247 311,333 381,329",             n: { x: 0.57, y: 0.34, z: 0.75 }, hue: -2, sat: 1 },
      { id: "f11", points: "213,247 256,164 299,247 256,282",             n: { x: 0.00, y: 0.03, z: 1.00 }, hue: 3,  sat: -6 },
      { id: "f12", points: "213,247 256,282 201,333",                     n: { x: -0.18, y: 0.46, z: 0.87 }, hue: 5,  sat: -8 },
      { id: "f13", points: "299,247 256,282 311,333",                     n: { x: 0.17, y: 0.45, z: 0.88 }, hue: -4, sat: -1 },
      { id: "f14", points: "131,329 201,333 256,468",                     n: { x: -0.40, y: 0.75, z: 0.52 }, hue: 0,  sat: 0 },
      { id: "f15", points: "381,329 311,333 256,468",                     n: { x: 0.40, y: 0.75, z: 0.52 }, hue: -6, sat: 4 },
      { id: "f16", points: "201,333 256,282 311,333 256,468",             n: { x: 0.00, y: 0.85, z: 0.52 }, hue: -1, sat: -2 }
    ];

    this.facets = this.facets.map((facet) => ({
      ...facet,
      n: this.normalize(facet.n),
      pts: this.parsePoints(facet.points),
    }));

    this.el = this.build();
    this.rotateGroup = this.el.querySelector("[data-role='rotate']");
    this.worldGlow = this.el.querySelector("[data-role='world-glow']");
    this.highlightLayer = this.el.querySelector("[data-role='facet-highlights']");
    this.facetEls = [...this.el.querySelectorAll("[data-role='facet']")];
    this.strokeEls = [...this.el.querySelectorAll("[data-role='facet-stroke']")];

    this.update(0);
  }

  parsePoints(points) {
    return points.split(/\s+/).map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
  }

  normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  reflect(v, n) {
    const d = this.dot(v, n);
    return {
      x: v.x - 2 * d * n.x,
      y: v.y - 2 * d * n.y,
      z: v.z - 2 * d * n.z,
    };
  }

  rotateZ(v, angleDeg) {
    const a = angleDeg * Math.PI / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  hsl(h, s, l) {
    return `hsl(${h} ${s}% ${l}%)`;
  }

  build() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 512 512");
    svg.setAttribute("width", this.size);
    svg.setAttribute("height", this.size);
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("aria-label", "Dynamic gemstone");

    svg.innerHTML = `
      <defs>
        <clipPath id="gem-clip">
          <path d="M256 42L345 90L403 194L381 329L256 468L131 329L109 194L167 90L256 42Z"></path>
        </clipPath>

        <linearGradient id="rim-stroke" x1="122" y1="78" x2="392" y2="446" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#F7DBFF" stop-opacity="0.76"></stop>
          <stop offset="0.5" stop-color="#D896FF" stop-opacity="0.28"></stop>
          <stop offset="1" stop-color="#AF73FF" stop-opacity="0.56"></stop>
        </linearGradient>

        <radialGradient id="world-glow-fill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(186 136) rotate(22) scale(122 86)">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"></stop>
          <stop offset="0.28" stop-color="#FFFFFF" stop-opacity="0.12"></stop>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"></stop>
        </radialGradient>

        <linearGradient id="world-band-fill" x1="116" y1="330" x2="364" y2="154" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"></stop>
          <stop offset="0.44" stop-color="#FFFFFF" stop-opacity="0.02"></stop>
          <stop offset="0.52" stop-color="#FFFFFF" stop-opacity="0.18"></stop>
          <stop offset="0.62" stop-color="#FFFFFF" stop-opacity="0.04"></stop>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"></stop>
        </linearGradient>

        <filter id="outer-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur"></feGaussianBlur>
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 .24 0"></feColorMatrix>
          <feBlend in="SourceGraphic" mode="screen"></feBlend>
        </filter>
      </defs>

      <g data-role="rotate" filter="url(#outer-glow)">
        <g clip-path="url(#gem-clip)">
          <g data-role="facets"></g>
          <g data-role="facet-highlights"></g>

          <g data-role="world-glow" style="mix-blend-mode:screen">
            <ellipse cx="186" cy="136" rx="122" ry="86" transform="rotate(22 186 136)" fill="url(#world-glow-fill)"></ellipse>
            <path d="M116 330L364 154L390 190L146 366Z" fill="url(#world-band-fill)"></path>
          </g>
        </g>

        <g data-role="facet-lines" opacity="0.24"></g>
        <path d="M256 42L345 90L403 194L381 329L256 468L131 329L109 194L167 90L256 42Z"
          fill="none" stroke="url(#rim-stroke)" stroke-width="5.5" stroke-linejoin="round"></path>
      </g>
    `;

    const facetsGroup = svg.querySelector("[data-role='facets']");
    const linesGroup = svg.querySelector("[data-role='facet-lines']");

    this.facets.forEach((facet) => {
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", facet.points);
      poly.dataset.role = "facet";
      poly.dataset.id = facet.id;
      facetsGroup.appendChild(poly);

      const line = document.createElementNS(ns, "polygon");
      line.setAttribute("points", facet.points);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#F1D3FF");
      line.setAttribute("stroke-width", "1.75");
      line.dataset.role = "facet-stroke";
      linesGroup.appendChild(line);
    });

    return svg;
  }

  mount(target) {
    target.appendChild(this.el);
    return this;
  }

  setRotation(angle) {
    this.angle = angle;
    this.update(angle);
  }

  update(angle = this.angle) {
    this.angle = angle;
    this.rotateGroup.setAttribute("transform", `rotate(${angle} 256 256)`);
    this.worldGlow.setAttribute("transform", `rotate(${-angle} 256 256)`);

    this.highlightLayer.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";

    this.facets.forEach((facet, index) => {
      const n = this.rotateZ(facet.n, angle);

      const diffuse = Math.max(0, this.dot(n, this.light));
      const facing = this.clamp(n.z, 0, 1);
      const back = Math.max(0, this.dot(n, { x: -this.light.x, y: -this.light.y, z: 0.22 }));

      const ambient = 0.16;
      const energy = ambient + diffuse * 0.60 + facing * 0.12 + back * 0.05;
      const lightness = this.clamp(24 + energy * 30, 22, 73);
      const saturation = this.clamp(this.saturation + facet.sat + diffuse * 8 + facing * 3, 74, 98);
      const hue = this.hue + facet.hue + diffuse * 3 - back * 2;

      this.facetEls[index].setAttribute("fill", this.hsl(hue, saturation, lightness));

      const toLight = { x: -this.light.x, y: -this.light.y, z: -this.light.z };
      const refl = this.reflect(toLight, n);
      const spec = Math.pow(Math.max(0, this.dot(refl, this.view)), 22);

      const gloss = this.clamp(spec * 0.95 + diffuse * 0.08, 0, 0.36);
      if (gloss > 0.02) {
        const highlight = document.createElementNS(ns, "polygon");
        highlight.setAttribute("points", facet.points);
        highlight.setAttribute("fill", "#FFFFFF");
        highlight.setAttribute("fill-opacity", gloss.toFixed(3));
        highlight.style.mixBlendMode = "screen";
        this.highlightLayer.appendChild(highlight);
      }

      const edgeOpacity = this.clamp(0.10 + diffuse * 0.20 + facing * 0.08, 0.08, 0.36);
      this.strokeEls[index].setAttribute("stroke-opacity", edgeOpacity.toFixed(3));
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

window.FacetedGem = FacetedGem;
