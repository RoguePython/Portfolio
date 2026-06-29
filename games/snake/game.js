/**
 * Snake — classic arcade with smooth canvas animation.
 */

const STORAGE_KEY = "snake-settings-v1";
const HIGH_SCORE_KEY = "snake-high-score-v1";
const SCORE_PER_FOOD = 10;
const INPUT_QUEUE_MAX = 2;
const COUNTDOWN_STEP_MS = 1000;
const COUNTDOWN_GO_MS = 450;
const COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * 3 + COUNTDOWN_GO_MS;

const GRID_PRESETS = {
  small: { cols: 16, rows: 16, tickMs: 140 },
  medium: { cols: 20, rows: 20, tickMs: 115 },
  large: { cols: 24, rows: 24, tickMs: 95 },
};

const DIRECTIONS = {
  up: { r: -1, c: 0, name: "up" },
  right: { r: 0, c: 1, name: "right" },
  down: { r: 1, c: 0, name: "down" },
  left: { r: 0, c: -1, name: "left" },
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const THEMES = {
  neon: {
    label: "Neon Green",
    swatch: ["#3ddc97", "#1a9f6a", "#ff4757"],
    grid: "#1e2a3a",
    gridLine: "rgba(255,255,255,0.04)",
    snakeHead: ["#5fffb4", "#3ddc97"],
    snakeBody: ["#3ddc97", "#1a9f6a"],
    snakeShadow: "rgba(61,220,151,0.35)",
    food: "#ff4757",
    foodGlow: "rgba(255,71,87,0.55)",
    eye: "#0f1419",
    accent: "#3ddc97",
  },
  ice: {
    label: "Ice",
    swatch: ["#7dd3fc", "#38bdf8", "#f472b6"],
    grid: "#152028",
    gridLine: "rgba(125,211,252,0.06)",
    snakeHead: ["#bae6fd", "#7dd3fc"],
    snakeBody: ["#7dd3fc", "#0284c7"],
    snakeShadow: "rgba(56,189,248,0.35)",
    food: "#f472b6",
    foodGlow: "rgba(244,114,182,0.5)",
    eye: "#0c1929",
    accent: "#7dd3fc",
  },
  ember: {
    label: "Ember",
    swatch: ["#fb923c", "#ea580c", "#fde047"],
    grid: "#1a1410",
    gridLine: "rgba(251,146,60,0.06)",
    snakeHead: ["#fdba74", "#fb923c"],
    snakeBody: ["#fb923c", "#c2410c"],
    snakeShadow: "rgba(234,88,12,0.35)",
    food: "#fde047",
    foodGlow: "rgba(253,224,71,0.5)",
    eye: "#1a0f08",
    accent: "#fb923c",
  },
  violet: {
    label: "Violet",
    swatch: ["#a78bfa", "#7c3aed", "#34d399"],
    grid: "#161320",
    gridLine: "rgba(167,139,250,0.06)",
    snakeHead: ["#c4b5fd", "#a78bfa"],
    snakeBody: ["#a78bfa", "#6d28d9"],
    snakeShadow: "rgba(124,58,237,0.35)",
    food: "#34d399",
    foodGlow: "rgba(52,211,153,0.5)",
    eye: "#0f0a18",
    accent: "#a78bfa",
  },
};

const KEY_MAP = {
  arrows: {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  },
  wasd: {
    KeyW: "up",
    KeyD: "right",
    KeyS: "down",
    KeyA: "left",
  },
};

const els = {
  canvas: null,
  boardWrap: null,
  deathFlash: null,
  scoreVal: null,
  bestVal: null,
  controlsHint: null,
  statusMsg: null,
  settingsOverlay: null,
  settingsForm: null,
  themeGroup: null,
  gameOverOverlay: null,
  finalScore: null,
  newBestMsg: null,
  playAgainBtn: null,
  settingsBtn: null,
  pauseOverlay: null,
  resumeBtn: null,
  pauseSettingsBtn: null,
};

const settings = {
  gridSize: "medium",
  controls: "arrows",
  theme: "neon",
};

const game = {
  phase: "settings",
  cols: 20,
  rows: 20,
  tickMs: 115,
  cellSize: 0,
  snake: [],
  prevSnake: [],
  direction: "right",
  inputQueue: [],
  food: null,
  score: 0,
  highScore: 0,
  growPending: false,
  moveProgress: 0,
  lastTickTime: 0,
  lastFrameTime: 0,
  tickTimer: null,
  animFrame: null,
  eatAnim: 0,
  deathAnim: 0,
  dead: false,
  touchStart: null,
  countdownStart: 0,
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.gridSize && GRID_PRESETS[parsed.gridSize]) settings.gridSize = parsed.gridSize;
    if (parsed.controls && KEY_MAP[parsed.controls]) settings.controls = parsed.controls;
    if (parsed.theme && THEMES[parsed.theme]) settings.theme = parsed.theme;
  } catch {
    /* ignore */
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadHighScore() {
  const n = Number(localStorage.getItem(HIGH_SCORE_KEY));
  game.highScore = Number.isFinite(n) ? n : 0;
}

function saveHighScore() {
  localStorage.setItem(HIGH_SCORE_KEY, String(game.highScore));
}

function currentTheme() {
  return THEMES[settings.theme];
}

function applyThemeCss() {
  const t = currentTheme();
  document.documentElement.style.setProperty("--accent", t.accent);
}

function gridPreset() {
  return GRID_PRESETS[settings.gridSize];
}

function controlsHintText() {
  const base =
    settings.controls === "wasd"
      ? "WASD to move · Swipe on touch devices"
      : "Arrow keys to move · Swipe on touch devices";
  return `${base} · Esc to pause`;
}

function resizeCanvas() {
  const preset = gridPreset();
  game.cols = preset.cols;
  game.rows = preset.rows;
  game.tickMs = preset.tickMs;

  const wrapWidth = els.boardWrap.clientWidth - 20;
  const maxSize = Math.min(wrapWidth, 540);
  game.cellSize = Math.floor(maxSize / Math.max(game.cols, game.rows));
  const w = game.cols * game.cellSize;
  const h = game.rows * game.cellSize;

  els.canvas.width = w;
  els.canvas.height = h;
  els.canvas.style.aspectRatio = `${w} / ${h}`;
}

function centerStart() {
  const midR = Math.floor(game.rows / 2);
  const midC = Math.floor(game.cols / 2);
  return [
    { r: midR, c: midC },
    { r: midR, c: midC - 1 },
    { r: midR, c: midC - 2 },
  ];
}

function spawnFood() {
  const occupied = new Set(game.snake.map((s) => `${s.r},${s.c}`));
  const free = [];
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (!occupied.has(`${r},${c}`)) free.push({ r, c });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function resetGameState() {
  game.snake = centerStart();
  game.prevSnake = game.snake.map((s) => ({ ...s }));
  game.direction = "right";
  game.inputQueue = [];
  game.food = spawnFood();
  game.score = 0;
  game.growPending = false;
  game.moveProgress = 0;
  game.eatAnim = 0;
  game.deathAnim = 0;
  game.dead = false;
  game.lastTickTime = performance.now();
  game.lastFrameTime = game.lastTickTime;

  els.scoreVal.textContent = "0";
  els.statusMsg.textContent = "";
  els.deathFlash.classList.remove("is-active");
  els.boardWrap.classList.remove("is-shaking");
  updateCanvasLabel();
}

function updateCanvasLabel() {
  els.canvas.setAttribute(
    "aria-label",
    `Snake game. Score ${game.score}. Snake length ${game.snake.length}.`,
  );
}

function queueDirection(dirName) {
  if (game.phase !== "playing" || game.dead) return;

  const last =
    game.inputQueue.length > 0
      ? game.inputQueue[game.inputQueue.length - 1]
      : game.direction;

  if (dirName === last || dirName === OPPOSITE[last]) return;

  if (game.inputQueue.length >= INPUT_QUEUE_MAX) return;
  game.inputQueue.push(dirName);
}

function stepSnake() {
  if (game.inputQueue.length > 0) {
    game.direction = game.inputQueue.shift();
  }

  const dir = DIRECTIONS[game.direction];
  const head = game.snake[0];
  const next = { r: head.r + dir.r, c: head.c + dir.c };

  if (next.r < 0 || next.r >= game.rows || next.c < 0 || next.c >= game.cols) {
    triggerDeath();
    return;
  }

  if (game.snake.some((s) => s.r === next.r && s.c === next.c)) {
    triggerDeath();
    return;
  }

  game.prevSnake = game.snake.map((s) => ({ ...s }));
  game.snake.unshift(next);

  const ate =
    game.food && next.r === game.food.r && next.c === game.food.c;

  if (ate) {
    game.score += SCORE_PER_FOOD;
    game.growPending = true;
    game.eatAnim = 1;
    els.scoreVal.textContent = String(game.score);
    game.food = spawnFood();
    if (!game.food) {
      els.statusMsg.textContent = "You filled the board!";
      triggerDeath(false);
      return;
    }
  } else {
    game.snake.pop();
  }

  if (game.growPending && !ate) {
    game.growPending = false;
  }

  updateCanvasLabel();
}

function triggerDeath(showFlash = true) {
  game.dead = true;
  if (game.tickTimer) {
    clearInterval(game.tickTimer);
    game.tickTimer = null;
  }

  if (showFlash && !reducedMotion) {
    els.deathFlash.classList.add("is-active");
    els.boardWrap.classList.add("is-shaking");
    window.setTimeout(() => {
      els.deathFlash.classList.remove("is-active");
      els.boardWrap.classList.remove("is-shaking");
    }, 450);
  }

  game.deathAnim = 0;
  deathRenderLoop();

  const isNewBest = game.score > game.highScore;
  if (isNewBest) {
    game.highScore = game.score;
    saveHighScore();
    els.bestVal.textContent = String(game.highScore);
  }

  window.setTimeout(() => {
    showGameOver(isNewBest);
  }, reducedMotion ? 100 : 500);
}

function showGameOver(isNewBest) {
  game.phase = "gameover";
  els.finalScore.textContent = String(game.score);
  els.newBestMsg.hidden = !isNewBest;
  els.gameOverOverlay.hidden = false;
  els.gameOverOverlay.classList.remove("overlay--hidden");
}

function hideGameOver() {
  els.gameOverOverlay.hidden = true;
  els.gameOverOverlay.classList.add("overlay--hidden");
}

function showPause() {
  game.phase = "paused";
  if (game.tickTimer) {
    clearInterval(game.tickTimer);
    game.tickTimer = null;
  }
  els.pauseOverlay.hidden = false;
  els.pauseOverlay.classList.remove("overlay--hidden");
  els.statusMsg.textContent = "Paused";
}

function hidePause() {
  els.pauseOverlay.hidden = true;
  els.pauseOverlay.classList.add("overlay--hidden");
  els.statusMsg.textContent = "";
}

function pauseGame() {
  if (game.phase !== "playing" || game.dead) return;
  showPause();
}

function resumeGame() {
  if (game.phase !== "paused") return;
  hidePause();
  game.phase = "playing";
  game.lastTickTime = performance.now();
  game.moveProgress = 0;
  startTickLoop();
}

function showSettings() {
  game.phase = "settings";
  stopLoop();
  hideGameOver();
  hidePause();
  syncSettingsForm();
  els.settingsOverlay.classList.remove("overlay--hidden");
  els.settingsOverlay.hidden = false;
}

function hideSettings() {
  els.settingsOverlay.classList.add("overlay--hidden");
  els.settingsOverlay.hidden = true;
}

function beginMatch() {
  resizeCanvas();
  resetGameState();
  hideGameOver();
  hidePause();

  game.phase = "countdown";
  game.countdownStart = performance.now();
  game.lastFrameTime = game.countdownStart;

  els.controlsHint.textContent = controlsHintText();
  els.bestVal.textContent = String(game.highScore);
  els.statusMsg.textContent = "Get ready…";

  startRenderLoop();
}

function finishCountdown() {
  game.phase = "playing";
  game.lastTickTime = performance.now();
  game.moveProgress = 0;
  els.statusMsg.textContent = "";
  startTickLoop();
}

function getCountdownState(elapsed) {
  if (elapsed >= COUNTDOWN_TOTAL_MS) return null;

  if (elapsed >= COUNTDOWN_STEP_MS * 3) {
    return {
      text: "GO!",
      progress: (elapsed - COUNTDOWN_STEP_MS * 3) / COUNTDOWN_GO_MS,
    };
  }

  const index = Math.floor(elapsed / COUNTDOWN_STEP_MS);
  return {
    text: String(3 - index),
    progress: (elapsed % COUNTDOWN_STEP_MS) / COUNTDOWN_STEP_MS,
  };
}

function startGame() {
  readSettingsForm();
  saveSettings();
  applyThemeCss();
  hideSettings();
  beginMatch();
}

function startRenderLoop() {
  stopLoop();
  game.animFrame = requestAnimationFrame(renderFrame);
}

function startTickLoop() {
  if (game.tickTimer) clearInterval(game.tickTimer);
  game.tickTimer = window.setInterval(() => {
    if (game.phase === "playing" && !game.dead) {
      stepSnake();
      game.moveProgress = 0;
      game.lastTickTime = performance.now();
    }
  }, game.tickMs);
}

function startLoop() {
  startRenderLoop();
  startTickLoop();
}

function stopLoop() {
  if (game.animFrame) {
    cancelAnimationFrame(game.animFrame);
    game.animFrame = null;
  }
  if (game.tickTimer) {
    clearInterval(game.tickTimer);
    game.tickTimer = null;
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function posToPixel(r, c) {
  return {
    x: c * game.cellSize + game.cellSize / 2,
    y: r * game.cellSize + game.cellSize / 2,
  };
}

function getRenderPositions() {
  const t = reducedMotion ? 1 : easeOutCubic(Math.min(1, game.moveProgress));
  const positions = [];

  for (let i = 0; i < game.snake.length; i++) {
    const curr = game.snake[i];
    const prev = game.prevSnake[i] || curr;
    positions.push({
      x: lerp(prev.c, curr.c, t) * game.cellSize + game.cellSize / 2,
      y: lerp(prev.r, curr.r, t) * game.cellSize + game.cellSize / 2,
    });
  }
  return positions;
}

function drawGrid(ctx, theme) {
  ctx.fillStyle = theme.grid;
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);

  ctx.strokeStyle = theme.gridLine;
  ctx.lineWidth = 1;
  for (let r = 0; r <= game.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * game.cellSize);
    ctx.lineTo(els.canvas.width, r * game.cellSize);
    ctx.stroke();
  }
  for (let c = 0; c <= game.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * game.cellSize, 0);
    ctx.lineTo(c * game.cellSize, els.canvas.height);
    ctx.stroke();
  }
}

function drawFood(ctx, theme, now) {
  if (!game.food) return;

  const { x, y } = posToPixel(game.food.r, game.food.c);
  const baseR = game.cellSize * 0.32;
  const pulse = reducedMotion ? 1 : 1 + Math.sin(now * 0.006) * 0.12;
  const eatScale = game.eatAnim > 0 ? 1 + game.eatAnim * 0.6 : 1;
  const r = baseR * pulse * eatScale;

  ctx.save();
  ctx.shadowColor = theme.foodGlow;
  ctx.shadowBlur = reducedMotion ? 8 : 14 + Math.sin(now * 0.008) * 6;
  ctx.fillStyle = theme.food;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnakeSegment(ctx, x, y, radius, color, shadow, isHead) {
  ctx.save();
  ctx.shadowColor = shadow;
  ctx.shadowBlur = isHead ? 12 : 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake(ctx, theme) {
  const positions = getRenderPositions();
  const len = positions.length;
  const deathFade = game.dead ? Math.max(0, 1 - game.deathAnim * 0.8) : 1;

  for (let i = len - 1; i >= 0; i--) {
    const { x, y } = positions[i];
    const t = i / Math.max(1, len - 1);
    const isHead = i === 0;
    const radius = game.cellSize * (isHead ? 0.44 : 0.38 - t * 0.04);

    const color = isHead
      ? theme.snakeHead[0]
      : lerpColor(theme.snakeBody[0], theme.snakeBody[1], t);

    ctx.globalAlpha = deathFade * (game.dead ? 0.45 : 1);
    drawSnakeSegment(ctx, x, y, radius, color, theme.snakeShadow, isHead);
  }

  ctx.globalAlpha = deathFade;

  const head = positions[0];
  const headR = game.cellSize * 0.44;
  const dir = DIRECTIONS[game.direction];
  const eyeOffset = headR * 0.35;
  const eyeR = headR * 0.18;
  const perpR = -dir.c;
  const perpC = dir.r;

  const ex1 = head.x + dir.c * eyeOffset + perpC * eyeOffset * 0.55;
  const ey1 = head.y + dir.r * eyeOffset + perpR * eyeOffset * 0.55;
  const ex2 = head.x + dir.c * eyeOffset - perpC * eyeOffset * 0.55;
  const ey2 = head.y + dir.r * eyeOffset - perpR * eyeOffset * 0.55;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2);
  ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2);
  ctx.fill();

  const pupilR = eyeR * 0.55;
  const pupilShift = eyeR * 0.2;
  ctx.fillStyle = theme.eye;
  ctx.beginPath();
  ctx.arc(ex1 + dir.c * pupilShift, ey1 + dir.r * pupilShift, pupilR, 0, Math.PI * 2);
  ctx.arc(ex2 + dir.c * pupilShift, ey2 + dir.r * pupilShift, pupilR, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function drawCountdown(ctx, theme, now) {
  const elapsed = now - game.countdownStart;
  const state = getCountdownState(elapsed);
  if (!state) return;

  const { text, progress } = state;
  const cx = els.canvas.width / 2;
  const cy = els.canvas.height / 2;

  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 18, 0.45)";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);

  let scale;
  let alpha;

  if (reducedMotion) {
    scale = 1;
    alpha = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.1;
  } else {
    const enter = Math.min(1, progress * 4);
    scale = text === "GO!" ? easeOutBack(Math.min(1, progress * 2.2)) : easeOutBack(enter);
    if (progress > 0.72) alpha = 1 - (progress - 0.72) / 0.28;
    else if (progress < 0.12) alpha = progress / 0.12;
    else alpha = 1;
  }

  const fontSize = Math.floor(game.cellSize * (text === "GO!" ? 2.4 : 3.2));
  ctx.font = `800 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = alpha;
  ctx.shadowColor = theme.snakeShadow;
  ctx.shadowBlur = reducedMotion ? 8 : 22;
  ctx.fillStyle = text === "GO!" ? theme.food : theme.accent;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = Math.max(2, fontSize * 0.04);
  ctx.strokeText(text, 0, 0);
  ctx.restore();
}

function paintFrame(now) {
  const dt = now - game.lastFrameTime;
  game.lastFrameTime = now;

  if (!game.dead && game.phase === "playing") {
    game.moveProgress = Math.min(1, (now - game.lastTickTime) / game.tickMs);
  }

  if (game.eatAnim > 0) {
    game.eatAnim = Math.max(0, game.eatAnim - dt * 0.004);
  }
  if (game.dead) {
    game.deathAnim = Math.min(1, game.deathAnim + dt * 0.003);
  }

  const ctx = els.canvas.getContext("2d");
  const theme = currentTheme();

  drawGrid(ctx, theme);
  if (!game.dead && game.phase !== "countdown") drawFood(ctx, theme, now);
  drawSnake(ctx, theme);

  if (game.phase === "countdown") {
    drawCountdown(ctx, theme, now);
  }
}

function isActiveBoardPhase() {
  return game.phase === "countdown" || game.phase === "playing" || game.phase === "paused";
}

function renderFrame(now) {
  if (!isActiveBoardPhase()) return;
  paintFrame(now);

  if (game.phase === "countdown") {
    const elapsed = now - game.countdownStart;
    if (elapsed >= COUNTDOWN_TOTAL_MS) {
      finishCountdown();
    }
  }

  if (!game.dead && isActiveBoardPhase()) {
    game.animFrame = requestAnimationFrame(renderFrame);
  }
}

function deathRenderLoop() {
  const frame = (now) => {
    if (game.phase !== "playing" || !game.dead) return;
    paintFrame(now);
    if (game.deathAnim < 1) {
      game.animFrame = requestAnimationFrame(frame);
    }
  };
  game.animFrame = requestAnimationFrame(frame);
}

function buildThemeOptions() {
  els.themeGroup.innerHTML = "";
  for (const [id, theme] of Object.entries(THEMES)) {
    const label = document.createElement("label");
    label.className = "theme-option";
    label.innerHTML = `
      <input type="radio" name="theme" value="${id}" ${settings.theme === id ? "checked" : ""} />
      <span class="theme-option__swatch" aria-hidden="true">
        ${theme.swatch.map((c) => `<span style="background:${c}"></span>`).join("")}
      </span>
      <span class="theme-option__name">${theme.label}</span>
    `;
    els.themeGroup.appendChild(label);
  }
}

function syncSettingsForm() {
  const form = els.settingsForm;
  const gridInput = form.querySelector(`input[name="gridSize"][value="${settings.gridSize}"]`);
  const ctrlInput = form.querySelector(`input[name="controls"][value="${settings.controls}"]`);
  if (gridInput) gridInput.checked = true;
  if (ctrlInput) ctrlInput.checked = true;
  buildThemeOptions();
}

function readSettingsForm() {
  const form = els.settingsForm;
  const grid = form.querySelector('input[name="gridSize"]:checked');
  const ctrl = form.querySelector('input[name="controls"]:checked');
  const theme = form.querySelector('input[name="theme"]:checked');
  if (grid) settings.gridSize = grid.value;
  if (ctrl) settings.controls = ctrl.value;
  if (theme) settings.theme = theme.value;
}

function onKeyDown(ev) {
  if (ev.code === "Escape") {
    if (game.phase === "playing" && !game.dead) {
      ev.preventDefault();
      pauseGame();
      return;
    }
    if (game.phase === "paused") {
      ev.preventDefault();
      resumeGame();
      return;
    }
  }

  if (game.phase === "playing" && !game.dead) {
    const map = KEY_MAP[settings.controls];
    const dir = map[ev.code];
    if (dir) {
      ev.preventDefault();
      queueDirection(dir);
    }
  }
}

function onTouchStart(ev) {
  if (game.phase !== "playing" || game.dead) return;
  const t = ev.changedTouches[0];
  game.touchStart = { x: t.clientX, y: t.clientY };
}

function onTouchEnd(ev) {
  if (!game.touchStart || game.phase !== "playing" || game.dead) return;
  const t = ev.changedTouches[0];
  const dx = t.clientX - game.touchStart.x;
  const dy = t.clientY - game.touchStart.y;
  game.touchStart = null;

  const minSwipe = 24;
  if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    queueDirection(dx > 0 ? "right" : "left");
  } else {
    queueDirection(dy > 0 ? "down" : "up");
  }
}

function init() {
  els.canvas = document.getElementById("canvas");
  els.boardWrap = document.getElementById("boardWrap");
  els.deathFlash = document.getElementById("deathFlash");
  els.scoreVal = document.getElementById("scoreVal");
  els.bestVal = document.getElementById("bestVal");
  els.controlsHint = document.getElementById("controlsHint");
  els.statusMsg = document.getElementById("statusMsg");
  els.settingsOverlay = document.getElementById("settingsOverlay");
  els.settingsForm = document.getElementById("settingsForm");
  els.themeGroup = document.getElementById("themeGroup");
  els.gameOverOverlay = document.getElementById("gameOverOverlay");
  els.finalScore = document.getElementById("finalScore");
  els.newBestMsg = document.getElementById("newBestMsg");
  els.playAgainBtn = document.getElementById("playAgainBtn");
  els.settingsBtn = document.getElementById("settingsBtn");
  els.pauseOverlay = document.getElementById("pauseOverlay");
  els.resumeBtn = document.getElementById("resumeBtn");
  els.pauseSettingsBtn = document.getElementById("pauseSettingsBtn");

  loadSettings();
  loadHighScore();
  applyThemeCss();
  buildThemeOptions();
  syncSettingsForm();

  els.bestVal.textContent = String(game.highScore);
  els.controlsHint.textContent = controlsHintText();

  els.settingsForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    startGame();
  });

  els.playAgainBtn.addEventListener("click", beginMatch);

  els.settingsBtn.addEventListener("click", showSettings);
  els.resumeBtn.addEventListener("click", resumeGame);
  els.pauseSettingsBtn.addEventListener("click", showSettings);

  window.addEventListener("keydown", onKeyDown);
  els.canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  els.canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  window.addEventListener("resize", () => {
    if (isActiveBoardPhase()) {
      resizeCanvas();
    }
  });

  resizeCanvas();
}

init();
