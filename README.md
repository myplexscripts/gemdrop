# Gem Drop

Gem Drop is a mobile-first physics merge game built with Phaser 3 and Matter Physics.

## Gem rendering

The gems use a lightweight 2D material system designed for mobile browsers. The active progression now uses distinct real-world-inspired cuts: Rose, Trillion, Cushion, Emerald, Princess, Radiant, Oval, Asscher, Pear, Navette and Brilliant.

The rendering stack:

- Procedurally generated gemstone albedo textures
- Matching per-facet normal maps generated once at startup
- Phaser WebGL Light2D lighting with a fixed warm key light, violet fill and pink rim light
- Normal-map rotation handled by Phaser while Matter rotates each gem
- Saturated jewel-tone transmission, internal caustic colour and darker pavilion facets
- Angle-driven additive glints that stay aligned to the world light instead of rotating like a painted highlight
- Shared textures per tier, so every gem does not need its own generated asset
- Canvas generation only at startup, avoiding per-frame texture uploads
- Graceful non-WebGL fallback to the base procedural gem art

Physics remain separate from the visuals. Each tier uses a convex Matter body matched to its gemstone silhouette so the stones can tumble, land on flats and corners, wedge, settle and merge without making the visual facet complexity part of collision solving.

## Controls

- Swipe the control strip below the basin to move the dropper.
- Release to drop the current gem.
- Match two identical gems to create the next tier.
- Keep the settled pile below the glowing limit.

## Power-ups

- Tumble: jostles and rotates the pile so gems can settle into new gaps.
- Cascade: merges all currently available matching pairs.
- Prism: upgrades the current dropper gem by one tier.

## Game feel

- Merges: parents slide together, a short physics hit-stop, the new gem springs out with squash/stretch and a flash, and neighbours get a soft radial push
- Drops: dotted aim guide with an outlined landing ghost, claw release animation, landing squash + dust + thud, slider detent ticks
- Chains: a single combo badge with a draining window bar, rising pentatonic chain chimes, and at ×4+ slow-motion, edge glow and a music swell
- Score: the HUD rolls up as coin trails land; the results screen tallies and celebrates a new best
- Danger: heartbeat (sound + haptic) that speeds up, red vignette, progressively muffled music; game over plays a slow-motion shatter sequence
- Screens: spring-in cards, native-style page pushes and bottom sheets, staggered menus, gem rain behind the home menu
- Everything honours `prefers-reduced-motion`

## Native & offline

- `native.js` routes haptics to the Capacitor Haptics plugin in store builds, `navigator.vibrate` on Android, and the iOS 18 switch-toggle tick on iOS Safari. Haptics can be toggled in the pause menu.
- Phaser, Lucide and fonts are bundled in `vendor/`; `sw.js` precaches the game shell so it launches offline.
- A branded boot splash covers texture generation; PNG and maskable icons live in `icons/`.
- Render resolution matches the device's pixel density and steps down automatically if frame times stay high.

### Building the iOS / Android apps (Capacitor)

```sh
npm install
npm run cap:add:android   # once; needs Android Studio to build
npm run cap:add:ios       # once; macOS + Xcode
npm run cap:android       # sync web files and open Android Studio
npm run cap:ios           # sync web files and open Xcode
```

`npm run build` copies the static game into `www/`, which Capacitor bundles into the native shell.

## Runtime

- Phaser 3.90.0 (bundled in `vendor/`)
- Matter Physics
- Fixed 60 Hz simulation
- WebGL Light2D normal-map rendering when available
- Three shared scene lights
- Cut-matched convex colliders
- Inset physical walls plus a render mask to keep jewels inside the visible frame
