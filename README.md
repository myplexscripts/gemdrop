# Gem Drop

Gem Drop is a mobile-first physics merge game built with Phaser 3 and Matter Physics.

The current build uses fixed-step Matter physics with chamfered polygon bodies so different gem tiers have real geometric behaviour. Gems can land on flats and corners, tumble, wedge, settle and merge while remaining visually clipped inside the jewel basin.

## Controls

- Swipe the control strip below the basin to move the dropper.
- Release to drop the current gem.
- Match two identical gems to create the next tier.
- Keep the settled pile below the glowing limit.

## UI

- The game fills the mobile viewport.
- The next gem is shown directly on the slider handle.
- Current value is displayed as currency.
- Best value is shown on the home screen.
- Notifications use the top status area.
- Shatter, Cascade and Prism power-ups live in the bottom dock.

## Runtime

- Phaser 3.90.0
- Matter Physics
- Fixed 60 Hz simulation
- Chamfered polygon colliders
- Inset physical walls plus a render mask to keep jewels inside the visible frame
