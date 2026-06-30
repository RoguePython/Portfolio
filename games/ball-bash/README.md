# Ball Bash

Slingshot physics puzzler built with vanilla JS and [Matter.js](https://brm.io/matter-js/) (CDN). Launch colored balls at structures to knock out enemy balls.

## Controls

- **Mouse / touch:** Drag the bird backward on the slingshot to aim. Trajectory dots preview the flight path. Release to launch.
- **Esc:** Pause / resume
- **Pause button:** Pause during play

## Goal

Destroy all enemy balls (green by default). Enemies die from hard impacts or falling far enough / hitting the ground at speed.

## Materials

| Color | Material | Behavior |
|-------|----------|----------|
| Brown | Wood | Standard blocks |
| Cyan | Glass | Breaks on moderate impacts |
| Gray | Stone | Heavy, durable |

## Stars

Each level awards 1–3 stars based on birds used. Fewer birds = more stars. Beat a level to unlock the next. Progress is saved in `localStorage`.

## Files

- `game.js` — state machine, physics glue, input, rendering
- `levels.js` — 10 handcrafted level definitions
- `index.html` / `styles.css` — UI shell and themes

## Dependency

Matter.js 0.20.0 is loaded from jsDelivr CDN. All other code is dependency-free vanilla JS.
