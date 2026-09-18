# Gem Drop

Gem Drop is a mobile-first Suika-style physics merge game built with Phaser 3.

The gameplay uses Phaser Matter Physics with a fixed 60 Hz timestep, simple circular rigid bodies, low restitution, density-based mass, sleeping, and a very small visual-to-collider offset. The visible gems remain faceted, but the physics is intentionally simple and stable so gems roll, settle, pack tightly, and create reliable chain merges.

## Controls

- Tap a horizontal position to drop.
- Drag across the basin to aim, then release.
- Match two identical gems to create the next tier.
- Keep the settled pile below the glowing limit.

## Runtime

- Phaser 3.90.0
- Matter Physics
- Fixed 60 Hz simulation
- Circle colliders for merge pieces
- Static walls outside the visible playfield
