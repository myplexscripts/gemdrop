# Gem Drop

A mobile-first physics merge game set in a magical jewel vault.

Drop matching gems into the basin. Each pair becomes a larger, rarer cut, building toward the Crownstone while the pile climbs toward the glowing limit.

## Controls

- Tap a horizontal position to drop.
- Drag across the basin to aim, then release.
- Match two identical gems to create the next tier.
- Keep the settled pile below the glowing limit.

## Runtime

Gem Drop uses Phaser 3 with Matter Physics. Each gem uses a centred convex body that closely matches its visible side-cut silhouette, giving the pile real rotation, friction and angular collisions while keeping the artwork aligned with the physical shape.

Open `index.html` in a modern browser or install it as a portrait PWA.
