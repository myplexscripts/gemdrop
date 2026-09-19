# Gem Drop

Gem Drop is a mobile-first physics merge game built with Phaser 3 and Matter Physics.

## Gem rendering

The gems use a lightweight 2D material system designed for mobile browsers:

- Procedurally generated gemstone albedo textures
- Matching per-facet normal maps generated once at startup
- Phaser WebGL Light2D lighting with a fixed warm key light, violet fill and pink rim light
- Normal-map rotation handled by Phaser while Matter rotates each gem
- Saturated jewel-tone transmission, internal caustic colour and darker pavilion facets
- Angle-driven additive glints that stay aligned to the world light instead of rotating like a painted highlight
- Shared textures per tier, so every gem does not need its own generated asset
- Canvas generation only at startup, avoiding per-frame texture uploads
- Graceful non-WebGL fallback to the base procedural gem art

Physics remain separate from the visuals. Each tier uses a chamfered polygon Matter body so the stones can tumble, land on flats and corners, wedge, settle and merge without making the visual facet complexity part of collision solving.

## Controls

- Swipe the control strip below the basin to move the dropper.
- Release to drop the current gem.
- Match two identical gems to create the next tier.
- Keep the settled pile below the glowing limit.

## Power-ups

- Tumble: jostles and rotates the pile so gems can settle into new gaps.
- Cascade: merges all currently available matching pairs.
- Prism: upgrades the current dropper gem by one tier.

## Runtime

- Phaser 3.90.0
- Matter Physics
- Fixed 60 Hz simulation
- WebGL Light2D normal-map rendering when available
- Three shared scene lights
- Chamfered polygon colliders
- Inset physical walls plus a render mask to keep jewels inside the visible frame
