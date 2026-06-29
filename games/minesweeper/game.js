/**
 * Minesweeper — classic difficulties with timer, chord, and themes.
 */

const DIFFICULTY_PRESETS = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 30, rows: 16, mines: 99 },
};

const STORAGE_KEY = "minesweeper-settings-v1";
const BEST_TIMES_KEY = "minesweeper-best-times-v1";
const LONG_PRESS_MS = 450;
const TOUCH_MOVE_THRESHOLD = 12;

const THEMES = {
  neon: {
    label: "Neon Green",
    swatch: ["#3ddc97", "#1a9f6a", "#ff4757"],
    accent: "#3ddc97",
    cellCovered: "#2a3548",
    cellCoveredEdge: "#3d4f6a",
    cellRevealed: "#152028",
    flag: "#ff4757",
    mine: "#8b9bb4",
    numbers: ["#6eb5ff", "#3ddc97", "#ff4757", "#a78bfa", "#fb923c", "#22d3ee", "#e8eef5", "#8b9bb4"],
  },
  ice: {
    label: "Ice",
    swatch: ["#7dd3fc", "#38bdf8", "#f472b6"],
    accent: "#7dd3fc",
    cellCovered: "#1e2a38",
    cellCoveredEdge: "#2d4058",
    cellRevealed: "#121c28",
    flag: "#f472b6",
    mine: "#7dd3fc",
    numbers: ["#7dd3fc", "#38bdf8", "#f472b6", "#818cf8", "#fb923c", "#2dd4bf", "#e0f2fe", "#94a3b8"],
  },
  ember: {
    label: "Ember",
    swatch: ["#fb923c", "#ea580c", "#fde047"],
    accent: "#fb923c",
    cellCovered: "#2a1f18",
    cellCoveredEdge: "#3d2e22",
    cellRevealed: "#1a1410",
    flag: "#fde047",
    mine: "#fb923c",
    numbers: ["#7dd3fc", "#4ade80", "#ff6b6b", "#c084fc", "#fb923c", "#22d3ee", "#fde047", "#a8a29e"],
  },
  violet: {
    label: "Violet",
    swatch: ["#a78bfa", "#7c3aed", "#34d399"],
    accent: "#a78bfa",
    cellCovered: "#221830",
    cellCoveredEdge: "#342448",
    cellRevealed: "#161320",
    flag: "#34d399",
    mine: "#a78bfa",
    numbers: ["#7dd3fc", "#34d399", "#f472b6", "#a78bfa", "#fb923c", "#22d3ee", "#e8eef5", "#8b9bb4"],
  },
};

const els = {
  app: null,
  board: null,
  boardWrap: null,
  minesVal: null,
  timerVal: null,
  bestVal: null,
  statusMsg: null,
  settingsOverlay: null,
  settingsForm: null,
  themeGroup: null,
  pauseOverlay: null,
  resumeBtn: null,
  pauseSettingsBtn: null,
  winOverlay: null,
  finalTime: null,
  newBestMsg: null,
  playAgainBtn: null,
  settingsBtn: null,
  loseOverlay: null,
  retryBtn: null,
  loseSettingsBtn: null,
};

const settings = {
  difficulty: "beginner",
  theme: "neon",
};

const bestTimes = {
  beginner: null,
  intermediate: null,
  expert: null,
};

const game = {
  phase: "settings",
  cols: 9,
  rows: 9,
  mineCount: 10,
  grid: [],
  minesPlaced: false,
  flagsPlaced: 0,
  revealedSafeCount: 0,
  hitMineRC: null,
  timerMs: 0,
  timerInterval: null,
  timerRunning: false,
  timerStartPerf: 0,
  longPressTimer: null,
  longPressFired: false,
  touchStart: null,
  chordFlashTimer: null,
  lastTouchEnd: 0,
  pointerLeft: false,
  pointerRight: false,
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function preset() {
  return DIFFICULTY_PRESETS[settings.difficulty];
}

function totalSafeCells() {
  return game.cols * game.rows - game.mineCount;
}

function inBounds(r, c) {
  return r >= 0 && r < game.rows && c >= 0 && c < game.cols;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.difficulty && DIFFICULTY_PRESETS[parsed.difficulty]) {
      settings.difficulty = parsed.difficulty;
    }
    if (parsed.theme && THEMES[parsed.theme]) {
      settings.theme = parsed.theme;
    }
  } catch {
    /* ignore */
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadBestTimes() {
  try {
    const raw = localStorage.getItem(BEST_TIMES_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(bestTimes)) {
      const n = Number(parsed[key]);
      if (Number.isFinite(n) && n > 0) bestTimes[key] = n;
    }
  } catch {
    /* ignore */
  }
}

function saveBestTimes() {
  localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(bestTimes));
}

function currentTheme() {
  return THEMES[settings.theme];
}

function applyThemeCss() {
  const t = currentTheme();
  const root = document.documentElement.style;
  root.setProperty("--accent", t.accent);
  root.setProperty("--cell-covered", t.cellCovered);
  root.setProperty("--cell-covered-edge", t.cellCoveredEdge);
  root.setProperty("--cell-revealed", t.cellRevealed);
  root.setProperty("--flag", t.flag);
  root.setProperty("--mine", t.mine);
  t.numbers.forEach((color, i) => {
    root.setProperty(`--n${i + 1}`, color);
  });
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function updateBestDisplay() {
  const best = bestTimes[settings.difficulty];
  els.bestVal.textContent = best != null ? formatTime(best) : "—";
}

function updateMinesDisplay() {
  els.minesVal.textContent = String(game.mineCount - game.flagsPlaced);
}

function updateTimerDisplay() {
  els.timerVal.textContent = formatTime(game.timerMs);
}

function startTimer() {
  if (game.timerRunning) return;
  game.timerRunning = true;
  game.timerStartPerf = performance.now() - game.timerMs;
  game.timerInterval = window.setInterval(() => {
    game.timerMs = performance.now() - game.timerStartPerf;
    updateTimerDisplay();
  }, 100);
}

function stopTimer() {
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
  if (game.timerRunning) {
    game.timerMs = performance.now() - game.timerStartPerf;
    game.timerRunning = false;
    updateTimerDisplay();
  }
}

function pauseTimer() {
  stopTimer();
}

function resumeTimer() {
  startTimer();
}

function initEmptyGrid() {
  game.grid = [];
  for (let r = 0; r < game.rows; r++) {
    const row = [];
    for (let c = 0; c < game.cols; c++) {
      row.push({ mine: false, adjacent: 0, revealed: false, flagged: false });
    }
    game.grid.push(row);
  }
}

function placeMines(excludeR, excludeC) {
  const positions = [];
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (r === excludeR && c === excludeC) continue;
      positions.push({ r, c });
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < game.mineCount; i++) {
    const { r, c } = positions[i];
    game.grid[r][c].mine = true;
  }

  game.minesPlaced = true;
  computeAdjacentCounts();
}

function computeAdjacentCounts() {
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.grid[r][c].mine) {
        game.grid[r][c].adjacent = 0;
        continue;
      }
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc) && game.grid[nr][nc].mine) count++;
        }
      }
      game.grid[r][c].adjacent = count;
    }
  }
}

function countAdjacentFlags(r, c) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && game.grid[nr][nc].flagged) count++;
    }
  }
  return count;
}

function describeCell(cell, r, c) {
  const pos = `row ${r + 1}, column ${c + 1}`;
  if (cell.flagged && !cell.revealed) return `Flagged cell at ${pos}.`;
  if (!cell.revealed) return `Hidden cell at ${pos}.`;
  if (cell.mine) return `Mine at ${pos}.`;
  if (cell.adjacent === 0) return `Empty revealed cell at ${pos}.`;
  return `${cell.adjacent} adjacent mines at ${pos}.`;
}

function render() {
  const { board } = els;
  const showAllMines = game.phase === "lost" || game.phase === "won";

  board.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;
  board.innerHTML = "";

  const disabled = game.phase !== "playing";
  if (disabled) board.classList.add("is-disabled");
  else board.classList.remove("is-disabled");

  if (game.phase === "paused") board.classList.add("is-paused");
  else board.classList.remove("is-paused");

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.grid[r][c];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.r = String(r);
      btn.dataset.c = String(c);
      btn.setAttribute("aria-label", describeCell(cell, r, c));

      if (cell.revealed) {
        btn.classList.add("cell--revealed");
        btn.setAttribute("aria-disabled", "true");
        btn.tabIndex = cell.adjacent > 0 ? 0 : -1;
        if (cell.mine) {
          btn.classList.add("cell--mine");
          if (game.hitMineRC && game.hitMineRC.r === r && game.hitMineRC.c === c) {
            btn.classList.add("cell--mine-hit");
          }
        } else if (cell.adjacent > 0) {
          btn.classList.add(`cell--n${cell.adjacent}`);
          btn.textContent = String(cell.adjacent);
        }
      } else {
        btn.classList.add("cell--covered");
        btn.tabIndex = 0;
        if (cell.flagged) btn.classList.add("cell--flagged");
      }

      if (showAllMines && cell.mine && !cell.revealed && !cell.flagged) {
        btn.classList.remove("cell--covered");
        btn.classList.add("cell--revealed", "cell--mine");
        btn.setAttribute("aria-disabled", "true");
        btn.tabIndex = -1;
      }

      if (showAllMines && cell.mine && cell.flagged && !cell.revealed) {
        btn.classList.remove("cell--flagged");
        btn.classList.add("cell--revealed", "cell--mine");
        btn.setAttribute("aria-disabled", "true");
        btn.tabIndex = -1;
      }

      board.appendChild(btn);
    }
  }

  updateMinesDisplay();
  updateTimerDisplay();
}

function checkWin() {
  if (game.revealedSafeCount === totalSafeCells()) {
    triggerWin();
  }
}

function revealCell(r, c) {
  if (game.phase !== "playing") return false;
  if (!inBounds(r, c)) return false;

  const cell = game.grid[r][c];
  if (cell.revealed || cell.flagged) return false;

  if (!game.minesPlaced) {
    placeMines(r, c);
    startTimer();
  }

  if (cell.mine) {
    game.hitMineRC = { r, c };
    triggerLose();
    return false;
  }

  const stack = [{ r, c }];
  while (stack.length > 0) {
    const { r: cr, c: cc } = stack.pop();
    const current = game.grid[cr][cc];
    if (current.revealed || current.flagged || current.mine) continue;

    current.revealed = true;
    game.revealedSafeCount++;

    if (current.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cr + dr;
          const nc = cc + dc;
          if (inBounds(nr, nc) && !game.grid[nr][nc].revealed && !game.grid[nr][nc].flagged) {
            stack.push({ r: nr, c: nc });
          }
        }
      }
    }
  }

  render();
  checkWin();
  return true;
}

function toggleFlag(r, c) {
  if (game.phase !== "playing") return;
  if (!inBounds(r, c)) return;

  const cell = game.grid[r][c];
  if (cell.revealed) return;

  cell.flagged = !cell.flagged;
  game.flagsPlaced += cell.flagged ? 1 : -1;
  render();
}

function chordAt(r, c) {
  if (game.phase !== "playing") return;
  if (!inBounds(r, c)) return;

  const cell = game.grid[r][c];
  if (!cell.revealed || cell.adjacent === 0) return;

  const flagCount = countAdjacentFlags(r, c);
  if (flagCount !== cell.adjacent) {
    flashChordFail(r, c);
    return;
  }

  if (!reducedMotion) {
    flashChord(r, c);
  }

  let hitMine = false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const neighbor = game.grid[nr][nc];
      if (neighbor.revealed || neighbor.flagged) continue;
      if (!game.minesPlaced) continue;
      if (neighbor.mine) {
        game.hitMineRC = { r: nr, c: nc };
        hitMine = true;
      } else if (game.phase === "playing") {
        revealCell(nr, nc);
      }
    }
  }

  if (hitMine) {
    triggerLose();
  }
}

function flashChord(r, c) {
  flashCellClass(r, c, "cell--chord-flash", 250);
}

function flashChordFail(r, c) {
  if (reducedMotion) return;
  flashCellClass(r, c, "cell--chord-fail", 350);
}

function flashCellClass(r, c, className, durationMs) {
  const btn = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!btn) return;
  btn.classList.remove("cell--chord-flash", "cell--chord-fail");
  void btn.offsetWidth;
  btn.classList.add(className);
  if (game.chordFlashTimer) clearTimeout(game.chordFlashTimer);
  game.chordFlashTimer = window.setTimeout(() => {
    btn.classList.remove(className);
  }, durationMs);
}

function isBothMouseButtons(ev) {
  return Boolean(ev.buttons & 1) && Boolean(ev.buttons & 2);
}

function resetPointerState() {
  game.pointerLeft = false;
  game.pointerRight = false;
}

function triggerWin() {
  game.phase = "won";
  stopTimer();

  const isNewBest =
    bestTimes[settings.difficulty] == null || game.timerMs < bestTimes[settings.difficulty];

  if (isNewBest) {
    bestTimes[settings.difficulty] = game.timerMs;
    saveBestTimes();
    updateBestDisplay();
  }

  els.finalTime.textContent = formatTime(game.timerMs);
  els.newBestMsg.hidden = !isNewBest;
  els.statusMsg.textContent = "You cleared the minefield!";
  els.statusMsg.classList.add("status--win");

  render();
  els.winOverlay.hidden = false;
  els.winOverlay.classList.remove("overlay--hidden");
}

function triggerLose() {
  hideWin();
  game.phase = "lost";
  stopTimer();
  els.statusMsg.textContent = "Boom! You hit a mine.";
  render();
  els.loseOverlay.hidden = false;
  els.loseOverlay.classList.remove("overlay--hidden");
}

function hideWin() {
  els.winOverlay.hidden = true;
  els.winOverlay.classList.add("overlay--hidden");
}

function hideLose() {
  els.loseOverlay.hidden = true;
  els.loseOverlay.classList.add("overlay--hidden");
}

function showPause() {
  game.phase = "paused";
  pauseTimer();
  els.pauseOverlay.hidden = false;
  els.pauseOverlay.classList.remove("overlay--hidden");
  els.statusMsg.textContent = "Paused";
  els.statusMsg.classList.remove("status--win");
  render();
}

function hidePause() {
  els.pauseOverlay.hidden = true;
  els.pauseOverlay.classList.add("overlay--hidden");
  els.statusMsg.textContent = "";
}

function pauseGame() {
  if (game.phase !== "playing") return;
  showPause();
}

function resumeGame() {
  if (game.phase !== "paused") return;
  hidePause();
  game.phase = "playing";
  resumeTimer();
  render();
}

function showSettings() {
  game.phase = "settings";
  stopTimer();
  hideWin();
  hideLose();
  hidePause();
  syncSettingsForm();
  els.settingsOverlay.classList.remove("overlay--hidden");
  els.settingsOverlay.hidden = false;
  els.statusMsg.textContent = "";
  els.statusMsg.classList.remove("status--win");
}

function hideSettings() {
  els.settingsOverlay.classList.add("overlay--hidden");
  els.settingsOverlay.hidden = true;
}

function resetMatchState() {
  const p = preset();
  game.cols = p.cols;
  game.rows = p.rows;
  game.mineCount = p.mines;
  game.minesPlaced = false;
  game.flagsPlaced = 0;
  game.revealedSafeCount = 0;
  game.hitMineRC = null;
  game.timerMs = 0;
  stopTimer();
  resetPointerState();

  initEmptyGrid();
  updateMinesDisplay();
  updateTimerDisplay();
}

function beginMatch() {
  resetMatchState();
  hideWin();
  hideLose();
  hidePause();

  game.phase = "playing";

  els.app.classList.toggle("app--expert", settings.difficulty === "expert");
  els.statusMsg.textContent = "";
  els.statusMsg.classList.remove("status--win");
  updateBestDisplay();
  render();
}

function startGame() {
  readSettingsForm();
  saveSettings();
  applyThemeCss();
  hideSettings();
  beginMatch();
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
  const diffInput = form.querySelector(`input[name="difficulty"][value="${settings.difficulty}"]`);
  if (diffInput) diffInput.checked = true;
  buildThemeOptions();
}

function readSettingsForm() {
  const form = els.settingsForm;
  const diff = form.querySelector('input[name="difficulty"]:checked');
  const theme = form.querySelector('input[name="theme"]:checked');
  if (diff) settings.difficulty = diff.value;
  if (theme) settings.theme = theme.value;
}

function getCellFromEvent(ev) {
  return ev.target.closest(".cell");
}

function onBoardMouseDown(ev) {
  if (game.phase !== "playing") return;
  if (Date.now() - game.lastTouchEnd < 500) return;

  const target = getCellFromEvent(ev);
  if (!target) return;

  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);
  const cell = game.grid[r][c];

  if (ev.button === 0) game.pointerLeft = true;
  if (ev.button === 2) {
    ev.preventDefault();
    game.pointerRight = true;
  }

  const bothHeld = isBothMouseButtons(ev) || (game.pointerLeft && game.pointerRight);
  if (cell.revealed && cell.adjacent > 0 && bothHeld) {
    ev.preventDefault();
    chordAt(r, c);
    return;
  }

  if (ev.button === 2) return;

  if (ev.button === 0 && !cell.revealed && !cell.flagged) {
    revealCell(r, c);
  }
}

function onBoardMouseUp(ev) {
  if (ev.button === 0) game.pointerLeft = false;
  if (ev.button === 2) game.pointerRight = false;
}

function onBoardContextMenu(ev) {
  ev.preventDefault();
  if (game.phase !== "playing") return;

  const target = getCellFromEvent(ev);
  if (!target) return;

  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);
  const cell = game.grid[r][c];

  if (cell.revealed) return;
  toggleFlag(r, c);
}

function clearLongPress() {
  if (game.longPressTimer) {
    clearTimeout(game.longPressTimer);
    game.longPressTimer = null;
  }
}

function onTouchStart(ev) {
  if (game.phase !== "playing") return;

  const target = getCellFromEvent(ev);
  if (!target) return;

  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);

  game.longPressFired = false;
  game.touchStart = {
    x: ev.touches[0].clientX,
    y: ev.touches[0].clientY,
    r,
    c,
  };

  clearLongPress();
  game.longPressTimer = window.setTimeout(() => {
    game.longPressFired = true;
    toggleFlag(r, c);
  }, LONG_PRESS_MS);
}

function onTouchMove(ev) {
  if (!game.touchStart) return;

  const dx = ev.touches[0].clientX - game.touchStart.x;
  const dy = ev.touches[0].clientY - game.touchStart.y;
  if (Math.hypot(dx, dy) > TOUCH_MOVE_THRESHOLD) {
    clearLongPress();
    game.touchStart = null;
  }
}

function onTouchEnd(ev) {
  clearLongPress();

  if (game.longPressFired) {
    game.longPressFired = false;
    game.touchStart = null;
    game.lastTouchEnd = Date.now();
    ev.preventDefault();
    return;
  }

  if (game.touchStart && game.phase === "playing") {
    revealCell(game.touchStart.r, game.touchStart.c);
  }

  game.touchStart = null;
  game.lastTouchEnd = Date.now();
}

function onBoardKeyDown(ev) {
  const target = ev.target.closest(".cell");
  if (!target || game.phase !== "playing") return;

  const r = Number(target.dataset.r);
  const c = Number(target.dataset.c);

  if (ev.key === "f" || ev.key === "F") {
    ev.preventDefault();
    toggleFlag(r, c);
    return;
  }

  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    const cell = game.grid[r][c];
    if (cell.revealed && cell.adjacent > 0) {
      chordAt(r, c);
    } else {
      revealCell(r, c);
    }
  }
}

function onKeyDown(ev) {
  if (ev.code === "Escape") {
    if (game.phase === "playing") {
      ev.preventDefault();
      pauseGame();
      return;
    }
    if (game.phase === "paused") {
      ev.preventDefault();
      resumeGame();
    }
  }
}

function init() {
  els.app = document.getElementById("app");
  els.board = document.getElementById("board");
  els.boardWrap = document.getElementById("boardWrap");
  els.minesVal = document.getElementById("minesVal");
  els.timerVal = document.getElementById("timerVal");
  els.bestVal = document.getElementById("bestVal");
  els.statusMsg = document.getElementById("statusMsg");
  els.settingsOverlay = document.getElementById("settingsOverlay");
  els.settingsForm = document.getElementById("settingsForm");
  els.themeGroup = document.getElementById("themeGroup");
  els.pauseOverlay = document.getElementById("pauseOverlay");
  els.resumeBtn = document.getElementById("resumeBtn");
  els.pauseSettingsBtn = document.getElementById("pauseSettingsBtn");
  els.winOverlay = document.getElementById("winOverlay");
  els.finalTime = document.getElementById("finalTime");
  els.newBestMsg = document.getElementById("newBestMsg");
  els.playAgainBtn = document.getElementById("playAgainBtn");
  els.settingsBtn = document.getElementById("settingsBtn");
  els.loseOverlay = document.getElementById("loseOverlay");
  els.retryBtn = document.getElementById("retryBtn");
  els.loseSettingsBtn = document.getElementById("loseSettingsBtn");

  loadSettings();
  loadBestTimes();
  applyThemeCss();
  buildThemeOptions();
  syncSettingsForm();
  updateBestDisplay();

  els.settingsForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    startGame();
  });

  els.playAgainBtn.addEventListener("click", beginMatch);
  els.retryBtn.addEventListener("click", beginMatch);
  els.settingsBtn.addEventListener("click", showSettings);
  els.loseSettingsBtn.addEventListener("click", showSettings);
  els.resumeBtn.addEventListener("click", resumeGame);
  els.pauseSettingsBtn.addEventListener("click", showSettings);

  els.board.addEventListener("mousedown", onBoardMouseDown);
  els.board.addEventListener("mouseup", onBoardMouseUp);
  els.board.addEventListener("contextmenu", onBoardContextMenu);
  els.board.addEventListener("keydown", onBoardKeyDown);
  els.board.addEventListener("touchstart", onTouchStart, { passive: true });
  els.board.addEventListener("touchmove", onTouchMove, { passive: true });
  els.board.addEventListener("touchend", onTouchEnd, { passive: false });
  window.addEventListener("mouseup", onBoardMouseUp);

  window.addEventListener("keydown", onKeyDown);
}

init();
