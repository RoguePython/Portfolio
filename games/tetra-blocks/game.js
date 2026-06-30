/**
 * Tetra Blocks — guideline-style falling blocks with 7-bag, SRS rotation,
 * ghost piece, simultaneous line clears, and canvas rendering.
 */

const HIGH_SCORE_KEY = "tetra-blocks-high-score-v1";

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const PREVIEW_CELL = 21;
const PREVIEW_COLS = 4;
const PREVIEW_ROWS = 4;

const NEXT_VISIBLE = 3;
const LINE_CLEAR_MS = 520;
const LOCK_DELAY_MS = 500;

const SCORE_TABLE = [0, 100, 300, 500, 800];

/** Gravity interval in ms per level (1-indexed; index 0 unused). */
const GRAVITY_MS = [
  0, 800, 717, 633, 550, 467, 383, 300, 217, 133, 100, 83, 83, 83, 67, 67, 67, 50, 50, 50, 33,
];

const PIECE_IDS = ["I", "O", "T", "S", "Z", "J", "L"];

const PIECE_COLORS = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
  G: "#ffffff",
};

/**
 * Each rotation: list of [col, row] offsets from piece origin.
 * Origin matches guideline spawn orientation.
 */
const SHAPES = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};

/** SRS wall kick tests: [from][to] => [[dx, dy], ...] */
const KICKS_JLSTZ = {
  "0-1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "1-0": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "1-2": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "2-1": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "2-3": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "3-2": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "3-0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "0-3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const KICKS_I = {
  "0-1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "1-0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "1-2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  "2-1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "2-3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "3-2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "3-0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "0-3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

const SPAWN = {
  I: { col: 3, row: -1 },
  O: { col: 3, row: -1 },
  T: { col: 3, row: -1 },
  S: { col: 3, row: -1 },
  Z: { col: 3, row: -1 },
  J: { col: 3, row: -1 },
  L: { col: 3, row: -1 },
};

const els = {
  boardCanvas: null,
  nextCanvases: [],
  scoreVal: null,
  levelVal: null,
  linesVal: null,
  bestVal: null,
  statusMsg: null,
  pauseBtn: null,
  pauseOverlay: null,
  resumeBtn: null,
  newGamePauseBtn: null,
  gameOverOverlay: null,
  finalScore: null,
  newBestMsg: null,
  playAgainBtn: null,
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const game = {
  phase: "playing",
  grid: [],
  bag: [],
  queue: [],
  active: null,
  score: 0,
  level: 1,
  lines: 0,
  highScore: 0,
  lastGravity: 0,
  lockStarted: 0,
  onGround: false,
  fullRows: [],
  clearAnimStart: 0,
  clearParticles: [],
  animFrame: 0,
  statusTimer: 0,
};

function gravityMs() {
  const idx = Math.min(game.level, GRAVITY_MS.length - 1);
  return GRAVITY_MS[idx];
}

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function refillBag() {
  game.bag = shuffle(PIECE_IDS);
}

function pullFromBag() {
  if (game.bag.length === 0) refillBag();
  return game.bag.pop();
}

function ensureQueue() {
  while (game.queue.length < NEXT_VISIBLE + 1) {
    game.queue.push(pullFromBag());
  }
}

function loadHighScore() {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (raw) game.highScore = Math.max(0, parseInt(raw, 10) || 0);
  } catch {
    /* ignore */
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(game.highScore));
  } catch {
    /* ignore */
  }
}

function getCells(piece) {
  const shape = SHAPES[piece.type][piece.rotation];
  return shape.map(([dc, dr]) => [piece.col + dc, piece.row + dr]);
}

function inBounds(col, row) {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

function collides(piece, grid, offsetCol = 0, offsetRow = 0) {
  const cells = getCells({
    type: piece.type,
    rotation: piece.rotation,
    col: piece.col + offsetCol,
    row: piece.row + offsetRow,
  });
  for (const [c, r] of cells) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && grid[r][c]) return true;
  }
  return false;
}

function ghostRow(piece, grid) {
  let row = piece.row;
  while (!collides({ ...piece, row: row + 1 }, grid)) {
    row += 1;
  }
  return row;
}

function rotatePiece(dir) {
  if (!game.active || game.phase !== "playing") return false;
  const from = game.active.rotation;
  const to = (from + (dir === 1 ? 1 : 3)) % 4;
  const kicks = game.active.type === "I" ? KICKS_I : KICKS_JLSTZ;
  const key = `${from}-${to}`;
  const tests = kicks[key] || [[0, 0]];

  for (const [dx, dy] of tests) {
    const trial = {
      ...game.active,
      rotation: to,
      col: game.active.col + dx,
      row: game.active.row + dy,
    };
    if (!collides(trial, game.grid)) {
      game.active = trial;
      game.onGround = collides({ ...game.active, row: game.active.row + 1 }, game.grid);
      if (game.onGround) game.lockStarted = performance.now();
      else game.lockStarted = 0;
      return true;
    }
  }
  return false;
}

function tryMove(dc, dr) {
  if (!game.active || game.phase !== "playing") return false;
  const trial = { ...game.active, col: game.active.col + dc, row: game.active.row + dr };
  if (collides(trial, game.grid)) return false;
  game.active = trial;
  game.onGround = collides({ ...game.active, row: game.active.row + 1 }, game.grid);
  if (game.onGround) {
    if (!game.lockStarted) game.lockStarted = performance.now();
  } else {
    game.lockStarted = 0;
  }
  return true;
}

function mergeActiveIntoGrid() {
  for (const [c, r] of getCells(game.active)) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      game.grid[r][c] = game.active.type;
    }
  }
}

function findFullRows() {
  const full = [];
  for (let r = 0; r < ROWS; r += 1) {
    if (game.grid[r].every((cell) => cell !== null)) full.push(r);
  }
  return full;
}

function buildClearParticles(rows) {
  const particles = [];
  for (const row of rows) {
    for (let c = 0; c < COLS; c += 1) {
      const type = game.grid[row][c];
      if (!type) continue;
      particles.push({
        col: c,
        row,
        color: PIECE_COLORS[type],
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 3,
        life: 1,
      });
    }
  }
  return particles;
}

function removeFullRowsBatch(rows) {
  const sorted = rows.slice().sort((a, b) => a - b);
  let newGrid = game.grid.filter((_, idx) => !sorted.includes(idx));
  while (newGrid.length < ROWS) {
    newGrid.unshift(Array(COLS).fill(null));
  }
  game.grid = newGrid;
}

function applyLineScore(count) {
  if (count <= 0) return;
  const gained = SCORE_TABLE[count] * game.level;
  game.score += gained;
  game.lines += count;
  const prevLevel = game.level;
  game.level = Math.floor(game.lines / 10) + 1;
  if (game.score > game.highScore) {
    game.highScore = game.score;
    saveHighScore();
  }
  updateHud();
  showComboStatus(count, gained, prevLevel !== game.level);
}

function showComboStatus(count, gained, leveledUp) {
  const labels = ["", "Single!", "Double!", "Triple!", "Tetra!"];
  let msg = `${labels[count] || "Clear!"} +${gained}`;
  if (leveledUp) msg += ` — Level ${game.level}!`;
  els.statusMsg.textContent = msg;
  els.statusMsg.classList.add("status--combo");
  window.clearTimeout(game.statusTimer);
  game.statusTimer = window.setTimeout(() => {
    els.statusMsg.textContent = "";
    els.statusMsg.classList.remove("status--combo");
  }, 1800);
}

function startLineClear(rows) {
  game.fullRows = rows;
  if (reducedMotion) {
    removeFullRowsBatch(rows);
    applyLineScore(rows.length);
    game.fullRows = [];
    spawnPiece();
    return;
  }
  game.phase = "lineClearing";
  game.clearAnimStart = performance.now();
  game.clearParticles = buildClearParticles(rows);
}

function finishLineClear() {
  const count = game.fullRows.length;
  removeFullRowsBatch(game.fullRows);
  game.fullRows = [];
  game.clearParticles = [];
  applyLineScore(count);
  game.phase = "playing";
  spawnPiece();
}

function lockActivePiece() {
  mergeActiveIntoGrid();
  game.active = null;
  game.onGround = false;
  game.lockStarted = 0;

  const fullRows = findFullRows();
  if (fullRows.length > 0) {
    startLineClear(fullRows);
  } else {
    spawnPiece();
  }
}

function spawnPiece() {
  ensureQueue();
  const type = game.queue.shift();
  ensureQueue();

  const spawn = SPAWN[type];
  const piece = {
    type,
    rotation: 0,
    col: spawn.col,
    row: spawn.row,
  };

  if (collides(piece, game.grid)) {
    game.active = null;
    endGame();
    return;
  }

  game.active = piece;
  game.onGround = false;
  game.lockStarted = 0;
  game.lastGravity = performance.now();
}

function softDrop() {
  if (!tryMove(0, 1)) return false;
  game.score += 1;
  updateHud();
  return true;
}

function hardDrop() {
  if (!game.active || game.phase !== "playing") return;
  const dropRow = ghostRow(game.active, game.grid);
  const dist = dropRow - game.active.row;
  if (dist > 0) {
    game.active.row = dropRow;
    game.score += dist * 2;
    updateHud();
  }
  lockActivePiece();
}

function endGame() {
  const isNewBest = game.score > 0 && game.score > game.highScore;
  game.phase = "gameOver";
  if (isNewBest) {
    game.highScore = game.score;
    saveHighScore();
  }
  els.finalScore.textContent = String(game.score);
  els.newBestMsg.hidden = !isNewBest;
  els.gameOverOverlay.hidden = false;
  els.gameOverOverlay.classList.remove("overlay--hidden");
  updateHud();
}

function pauseGame() {
  if (game.phase !== "playing" && game.phase !== "lineClearing") return;
  game.phase = "paused";
  window.cancelAnimationFrame(game.animFrame);
  els.pauseOverlay.hidden = false;
  els.pauseOverlay.classList.remove("overlay--hidden");
}

function resumeGame() {
  if (game.phase !== "paused") return;
  game.phase = game.fullRows.length > 0 ? "lineClearing" : "playing";
  els.pauseOverlay.hidden = true;
  els.pauseOverlay.classList.add("overlay--hidden");
  game.lastGravity = performance.now();
  if (game.onGround) game.lockStarted = performance.now();
  startLoop();
}

function newGame() {
  window.cancelAnimationFrame(game.animFrame);
  game.phase = "playing";
  game.grid = emptyGrid();
  game.bag = [];
  game.queue = [];
  game.active = null;
  game.score = 0;
  game.level = 1;
  game.lines = 0;
  game.fullRows = [];
  game.clearParticles = [];
  game.onGround = false;
  game.lockStarted = 0;
  els.statusMsg.textContent = "";
  els.statusMsg.classList.remove("status--combo");
  els.pauseOverlay.hidden = true;
  els.pauseOverlay.classList.add("overlay--hidden");
  els.gameOverOverlay.hidden = true;
  els.gameOverOverlay.classList.add("overlay--hidden");
  refillBag();
  ensureQueue();
  spawnPiece();
  updateHud();
  game.lastGravity = performance.now();
  startLoop();
}

function updateHud() {
  els.scoreVal.textContent = String(game.score);
  els.levelVal.textContent = String(game.level);
  els.linesVal.textContent = String(game.lines);
  els.bestVal.textContent = String(game.highScore);
}

function updateGravity(now) {
  if (game.phase !== "playing" || !game.active) return;
  if (now - game.lastGravity < gravityMs()) return;
  game.lastGravity = now;
  if (!tryMove(0, 1)) {
    if (!game.onGround) {
      game.onGround = true;
      game.lockStarted = now;
    }
  }
}

function updateLock(now) {
  if (game.phase !== "playing" || !game.active || !game.onGround) return;
  if (now - game.lockStarted >= LOCK_DELAY_MS) {
    lockActivePiece();
  }
}

function updateLineClear(now) {
  if (game.phase !== "lineClearing") return;
  const elapsed = now - game.clearAnimStart;
  if (elapsed >= LINE_CLEAR_MS) {
    finishLineClear();
    return;
  }
  if (game.clearParticles.length > 0) {
    for (const p of game.clearParticles) {
      p.col += p.vx * 0.04;
      p.row += p.vy * 0.04;
      p.vy += 0.12;
      p.life -= 0.025;
    }
    game.clearParticles = game.clearParticles.filter((p) => p.life > 0);
  }
}

function drawCell(ctx, col, row, type, cellSize, alpha = 1) {
  const x = col * cellSize;
  const y = row * cellSize;
  const pad = Math.max(1, Math.floor(cellSize * 0.08));
  const color = PIECE_COLORS[type] || PIECE_COLORS.G;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, Math.max(2, cellSize * 0.12));

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, cellSize - pad * 2 - 1, cellSize - pad * 2 - 1);
  ctx.restore();
}

function drawGridBackground(ctx, cols, rows, cellSize) {
  ctx.fillStyle = "#152028";
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c += 1) {
    const x = c * cellSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * cellSize);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r += 1) {
    const y = r * cellSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * cellSize, y);
    ctx.stroke();
  }
}

function drawPieceAt(ctx, piece, cellSize, alpha = 1) {
  for (const [c, r] of getCells(piece)) {
    if (r < 0) continue;
    drawCell(ctx, c, r, piece.type, cellSize, alpha);
  }
}

function drawLineClearEffect(ctx, now) {
  const elapsed = now - game.clearAnimStart;
  const t = Math.min(1, elapsed / LINE_CLEAR_MS);

  for (const row of game.fullRows) {
    const y = row * CELL;
    const flash = t < 0.35 ? 1 : Math.max(0, 1 - (t - 0.35) / 0.65);
    const shrink = t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.5);

    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y, COLS * CELL, CELL);

    ctx.globalAlpha = flash * 0.85;
    ctx.fillStyle = "rgba(61,220,151,0.6)";
    ctx.fillRect(0, y + CELL * 0.35, COLS * CELL * shrink, CELL * 0.3);

    ctx.globalAlpha = flash;
    ctx.translate((COLS * CELL) / 2, y + CELL / 2);
    ctx.scale(shrink, 1);
    ctx.translate(-(COLS * CELL) / 2, -(y + CELL / 2));

    for (let c = 0; c < COLS; c += 1) {
      const type = game.grid[row][c];
      if (type) drawCell(ctx, c, row, type, CELL, flash);
    }
    ctx.restore();
  }

  for (const p of game.clearParticles) {
    const x = p.col * CELL + CELL / 2;
    const y = p.row * CELL + CELL / 2;
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.restore();
  }
}

function drawNextPreviews() {
  ensureQueue();
  for (let i = 0; i < NEXT_VISIBLE; i += 1) {
    const canvas = els.nextCanvases[i];
    const ctx = canvas.getContext("2d");
    const w = PREVIEW_COLS * PREVIEW_CELL;
    const h = PREVIEW_ROWS * PREVIEW_CELL;
    ctx.clearRect(0, 0, w, h);
    drawGridBackground(ctx, PREVIEW_COLS, PREVIEW_ROWS, PREVIEW_CELL);

    const type = game.queue[i];
    if (!type) continue;

    const cells = SHAPES[type][0];
    let minC = 4;
    let maxC = 0;
    let minR = 4;
    let maxR = 0;
    for (const [dc, dr] of cells) {
      minC = Math.min(minC, dc);
      maxC = Math.max(maxC, dc);
      minR = Math.min(minR, dr);
      maxR = Math.max(maxR, dr);
    }
    const pieceW = maxC - minC + 1;
    const pieceH = maxR - minR + 1;
    const offsetCol = Math.floor((PREVIEW_COLS - pieceW) / 2) - minC;
    const offsetRow = Math.floor((PREVIEW_ROWS - pieceH) / 2) - minR;

    drawPieceAt(
      ctx,
      { type, rotation: 0, col: offsetCol, row: offsetRow },
      PREVIEW_CELL,
      1
    );
  }
}

function paintFrame(now) {
  const ctx = els.boardCanvas.getContext("2d");
  drawGridBackground(ctx, COLS, ROWS, CELL);

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (game.grid[r][c] && !game.fullRows.includes(r)) {
        drawCell(ctx, c, r, game.grid[r][c], CELL);
      }
    }
  }

  if (game.active && game.phase !== "gameOver") {
    const ghost = { ...game.active, row: ghostRow(game.active, game.grid) };
    if (ghost.row !== game.active.row) {
      drawPieceAt(ctx, ghost, CELL, 0.22);
    }
    drawPieceAt(ctx, game.active, CELL, 1);
  }

  if (game.phase === "lineClearing") {
    drawLineClearEffect(ctx, now);
  }

  drawNextPreviews();
}

function renderFrame(now) {
  if (game.phase === "paused" || game.phase === "gameOver") return;

  updateGravity(now);
  updateLock(now);
  updateLineClear(now);
  paintFrame(now);

  game.animFrame = requestAnimationFrame(renderFrame);
}

function startLoop() {
  window.cancelAnimationFrame(game.animFrame);
  game.animFrame = requestAnimationFrame(renderFrame);
}

function onKeyDown(ev) {
  if (game.phase === "gameOver") return;

  if (ev.code === "Escape") {
    ev.preventDefault();
    if (game.phase === "playing" || game.phase === "lineClearing") pauseGame();
    else if (game.phase === "paused") resumeGame();
    return;
  }

  if (game.phase === "paused") return;
  if (game.phase === "lineClearing") return;
  if (!game.active) return;

  switch (ev.code) {
    case "ArrowLeft":
      ev.preventDefault();
      tryMove(-1, 0);
      break;
    case "ArrowRight":
      ev.preventDefault();
      tryMove(1, 0);
      break;
    case "ArrowDown":
      ev.preventDefault();
      softDrop();
      game.lastGravity = performance.now();
      break;
    case "ArrowUp":
    case "KeyX":
      ev.preventDefault();
      rotatePiece(1);
      break;
    case "KeyZ":
      ev.preventDefault();
      rotatePiece(-1);
      break;
    case "Space":
      ev.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

function setupCanvas() {
  els.boardCanvas.width = COLS * CELL;
  els.boardCanvas.height = ROWS * CELL;

  els.nextCanvases.forEach((canvas) => {
    canvas.width = PREVIEW_COLS * PREVIEW_CELL;
    canvas.height = PREVIEW_ROWS * PREVIEW_CELL;
  });
}

function init() {
  els.boardCanvas = document.getElementById("boardCanvas");
  els.nextCanvases = Array.from(document.querySelectorAll(".next-canvas"));
  els.scoreVal = document.getElementById("scoreVal");
  els.levelVal = document.getElementById("levelVal");
  els.linesVal = document.getElementById("linesVal");
  els.bestVal = document.getElementById("bestVal");
  els.statusMsg = document.getElementById("statusMsg");
  els.pauseBtn = document.getElementById("pauseBtn");
  els.pauseOverlay = document.getElementById("pauseOverlay");
  els.resumeBtn = document.getElementById("resumeBtn");
  els.newGamePauseBtn = document.getElementById("newGamePauseBtn");
  els.gameOverOverlay = document.getElementById("gameOverOverlay");
  els.finalScore = document.getElementById("finalScore");
  els.newBestMsg = document.getElementById("newBestMsg");
  els.playAgainBtn = document.getElementById("playAgainBtn");

  setupCanvas();
  loadHighScore();
  updateHud();

  els.pauseBtn.addEventListener("click", () => {
    if (game.phase === "playing" || game.phase === "lineClearing") pauseGame();
    else if (game.phase === "paused") resumeGame();
  });
  els.resumeBtn.addEventListener("click", resumeGame);
  els.newGamePauseBtn.addEventListener("click", newGame);
  els.playAgainBtn.addEventListener("click", newGame);
  document.addEventListener("keydown", onKeyDown);

  newGame();
}

init();
