# Tetra Blocks

Guideline-style falling-blocks puzzle built with vanilla HTML, CSS, and JavaScript. No build step, no dependencies — open `index.html` in a browser or play from the [Prompt Games hub](../).

## Features

- **10×20 playfield** with canvas rendering
- **7-bag randomizer** — every bag contains one of each tetromino (`I`, `O`, `T`, `S`, `Z`, `J`, `L`), shuffled for fair randomness
- **3-piece next queue** — upcoming pieces shown in a side panel with geometry matched to the main board
- **SRS rotation** — Super Rotation System wall kicks for reliable rotation near walls and floors
- **Ghost piece** — semi-transparent preview of where the active piece will land
- **Hard drop** — instant drop to the landing row (`Space`)
- **Simultaneous line clears** — when multiple rows fill at once, they animate together and are removed in a single batch
- **Guideline scoring** — combo points scale with level; soft/hard drop bonuses
- **Level progression** — speed increases every 10 lines cleared
- **High score** — persisted in `localStorage`
- **Pause / game over overlays** — keyboard-first UX consistent with other Prompt Games
- **Reduced motion** — line-clear animation skipped when `prefers-reduced-motion: reduce` is set

## Controls

| Key | Action |
|-----|--------|
| ← / → | Move piece left / right |
| ↓ | Soft drop (+1 point per cell) |
| ↑ or X | Rotate clockwise |
| Z | Rotate counter-clockwise |
| Space | Hard drop (+2 points per cell, locks piece) |
| Esc | Pause / resume |

## Scoring

| Event | Points |
|-------|--------|
| Single (1 line) | `100 × level` |
| Double (2 lines) | `300 × level` |
| Triple (3 lines) | `500 × level` |
| Tetris (4 lines) | `800 × level` |
| Soft drop | `1` per cell moved down |
| Hard drop | `2` per cell dropped |

- **Level** starts at 1 and increases by 1 for every 10 lines cleared (10 lines → level 2, 20 lines → level 3, etc.).
- Line combo score is applied **once per lock** based on how many rows were full, not per row individually.

## Game flow

```text
Playing → (piece locks) → scan all rows for full lines
  ├─ no full lines → spawn next piece
  └─ 1+ full lines → LineClearing animation → batch remove rows → score → spawn next piece

Playing ↔ Paused (Esc)
Playing → GameOver (spawn blocked)
```

During **LineClearing**, gravity and input are frozen. All full rows flash and shrink in parallel (~520 ms), then collapse in one operation before the next piece spawns.

## File structure

```text
tetra-blocks/
├── index.html   # Layout shell, HUD, overlays
├── game.js      # Logic, rendering, input
├── styles.css   # Dark theme (matches Snake / Minesweeper)
└── README.md    # This file
```

## Technical notes

### Grid alignment

Cell size is defined once in `game.js`:

```javascript
const COLS = 10;
const ROWS = 20;
const CELL = 28;           // main board pixels per cell
const PREVIEW_CELL = 21;   // next-queue preview (4×4 slots)
```

Canvas dimensions are derived from these constants (`280×560` for the board). The next panel reuses the same shape definitions and drawing helpers so previews align with in-game pieces.

### Randomizer

The 7-bag system refills when empty:

1. Shuffle all seven piece IDs.
2. Pop from the bag when the queue needs pieces.
3. Maintain at least four pieces internally (active + three visible next).

### Persistence

| Key | Purpose |
|-----|---------|
| `tetra-blocks-high-score-v1` | Best score across sessions |

### Phases

| Phase | Description |
|-------|-------------|
| `playing` | Active piece, gravity, input |
| `lineClearing` | Line-clear animation; no input |
| `paused` | Overlay shown; loop stopped |
| `gameOver` | Spawn blocked; play-again overlay |

## Browser support

Modern evergreen browsers with Canvas 2D and `localStorage`. Keyboard controls are required; touch/on-screen buttons are not included in v1.

## License

Part of the [Portfolio](https://github.com/RoguePython/Portfolio) project. Tetra Blocks is a generic falling-blocks implementation — not affiliated with or endorsed by The Tetris Company.
