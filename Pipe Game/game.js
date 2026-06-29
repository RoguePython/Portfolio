/**
 * Pipe Flow — vanilla JS pipe puzzle.
 *
 * Scoring (on level complete):
 *   score += max(0, SCORE_BASE + level * SCORE_LEVEL_MULT + (w * h) * SCORE_CELL_MULT
 *                - moves * SCORE_MOVE_PENALTY)
 */

const SCORE_BASE = 100;
const SCORE_LEVEL_MULT = 25;
const SCORE_CELL_MULT = 3;
/** Points subtracted per rotation of a path pipe this level (applied on level complete). */
const SCORE_MOVE_PENALTY = 3;

const GRID_START = 6;
const GRID_MAX = 12;
const GRID_GROW_EVERY_LEVELS = 2;

const GEN_MAX_ATTEMPTS = 80;
const WIN_DELAY_MS = 650;
const CARVE_MAX_STEPS = 200000;

/** Bit: N=1, E=2, S=4, W=8 — index 0..3 matches NESW */
const DIR_BIT = [1, 2, 4, 8];
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

/** Local openings at rotation 0; world mask uses worldMask() */
const KIND_BASE_MASK = {
  straight: 1 | 4, // N+S
  elbow: 1 | 2, // N+E
  /** Default art opens toward grid south (+row); rotations align to carved path */
  start: 4,
  end: 4,
  blocked: 0,
};

function worldMask(localMask, quarterTurnsCw) {
  const k = ((quarterTurnsCw % 4) + 4) % 4;
  let out = 0;
  for (let w = 0; w < 4; w++) {
    const loc = (w - k + 4) % 4;
    if (localMask & DIR_BIT[loc]) out |= DIR_BIT[w];
  }
  return out;
}

function maskToDirs(mask) {
  const d = [];
  for (let i = 0; i < 4; i++) if (mask & DIR_BIT[i]) d.push(i);
  return d;
}

function popcount(mask) {
  let n = 0;
  for (let i = 0; i < 4; i++) if (mask & DIR_BIT[i]) n++;
  return n;
}

function oppositeDir(d) {
  return (d + 2) % 4;
}

function getCellMask(cell) {
  if (cell.kind === "blocked") return 0;
  const base = KIND_BASE_MASK[cell.kind];
  const q = Math.floor(cell.rotation / 90);
  return worldMask(base, q);
}

function gridDimsForLevel(level) {
  const steps = Math.floor((level - 1) / GRID_GROW_EVERY_LEVELS);
  const n = Math.min(GRID_MAX, GRID_START + steps);
  return { w: n, h: n };
}

function cellKey(r, c, w) {
  return r * w + c;
}

function shuffleInPlace(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function neighborsFrom(r, c, w, h) {
  const out = [];
  if (r > 0) out.push({ r: r - 1, c, dirFromHere: 0 });
  if (c < w - 1) out.push({ r, c: c + 1, dirFromHere: 1 });
  if (r < h - 1) out.push({ r: r + 1, c, dirFromHere: 2 });
  if (c > 0) out.push({ r, c: c - 1, dirFromHere: 3 });
  return out;
}

function isBorder(r, c, w, h) {
  return r === 0 || c === 0 || r === h - 1 || c === w - 1;
}

function randomBorderCell(w, h, rnd) {
  const edge = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (isBorder(r, c, w, h)) edge.push({ r, c });
    }
  }
  return edge[Math.floor(rnd() * edge.length)];
}

function manhattanCells(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) + 1;
}

/**
 * Random simple path from s to e with optional minimum length (cell count).
 * Returns list of {r,c} or null.
 */
function carvePath(s, e, w, h, minLen, rnd) {
  const sk = (row) => cellKey(row.r, row.c, w);
  const stack = [{ r: s.r, c: s.c }];
  const onPath = new Set([sk(s)]);
  const manhattan = manhattanCells(s, e);
  const minAccept = Math.max(
    2,
    Math.min(minLen, w * h, manhattan + 6 + Math.floor(minLen / 4)),
  );

  let guard = 0;
  while (guard++ < CARVE_MAX_STEPS) {
    const top = stack[stack.length - 1];
    if (top.r === e.r && top.c === e.c) {
      if (stack.length >= minAccept) return stack.slice();
      onPath.delete(sk(top));
      stack.pop();
      if (stack.length === 0) return null;
      continue;
    }

    let nbrs = neighborsFrom(top.r, top.c, w, h).filter((n) => !onPath.has(sk(n)));
    if (stack.length + 1 < minAccept) {
      nbrs = nbrs.filter((n) => !(n.r === e.r && n.c === e.c));
    }
    shuffleInPlace(nbrs, rnd);

    if (nbrs.length === 0) {
      onPath.delete(sk(top));
      stack.pop();
      if (stack.length === 0) return null;
      continue;
    }

    const next = nbrs[0];
    stack.push({ r: next.r, c: next.c });
    onPath.add(sk(next));
  }
  return null;
}

function pickStartEnd(w, h, rnd) {
  for (let t = 0; t < 40; t++) {
    const s = randomBorderCell(w, h, rnd);
    let e = randomBorderCell(w, h, rnd);
    let guard = 0;
    while (e.r === s.r && e.c === s.c && guard++ < 10) {
      e = randomBorderCell(w, h, rnd);
    }
    if (e.r !== s.r || e.c !== s.c) return { start: s, end: e };
  }
  return { start: { r: 0, c: 0 }, end: { r: h - 1, c: w - 1 } };
}

function dirBetween(from, to) {
  if (to.r < from.r) return 0;
  if (to.c > from.c) return 1;
  if (to.r > from.r) return 2;
  return 3;
}

function isOppositeMask(mask) {
  return mask === (1 | 4) || mask === (2 | 8);
}

function solveStartRotation(requiredMask) {
  for (let q = 0; q < 4; q++) {
    const rot = q * 90;
    if (worldMask(KIND_BASE_MASK.start, q) === requiredMask) {
      return { kind: "start", rotation: rot };
    }
  }
  return { kind: "start", rotation: 0 };
}

function solveEndRotation(requiredMask) {
  for (let q = 0; q < 4; q++) {
    const rot = q * 90;
    if (worldMask(KIND_BASE_MASK.end, q) === requiredMask) {
      return { kind: "end", rotation: rot };
    }
  }
  return { kind: "end", rotation: 0 };
}

function solveInterior(requiredMask) {
  if (isOppositeMask(requiredMask)) {
    for (let q = 0; q < 4; q++) {
      const rot = q * 90;
      if (worldMask(KIND_BASE_MASK.straight, q) === requiredMask) {
        return { kind: "straight", rotation: rot };
      }
    }
  }
  for (let q = 0; q < 4; q++) {
    const rot = q * 90;
    if (worldMask(KIND_BASE_MASK.elbow, q) === requiredMask) {
      return { kind: "elbow", rotation: rot };
    }
  }
  return { kind: "straight", rotation: 0 };
}

function buildLevel(level, rnd) {
  const { w, h } = gridDimsForLevel(level);
  const minLen = Math.min(
    w * h,
    Math.max(
      Math.floor((w + h) * 0.55) + Math.floor(level / 2),
      GRID_START + level,
    ),
  );

  for (let attempt = 0; attempt < GEN_MAX_ATTEMPTS; attempt++) {
    const { start, end } = pickStartEnd(w, h, rnd);
    const path = carvePath(start, end, w, h, minLen, rnd);
    if (!path || path.length < 2) continue;

    const pathSet = new Set(path.map((p) => cellKey(p.r, p.c, w)));
    const grid = [];

    for (let r = 0; r < h; r++) {
      const row = [];
      for (let c = 0; c < w; c++) {
        row.push({ kind: "blocked", rotation: 0, r, c });
      }
      grid.push(row);
    }

    const L = path.length;
    for (let i = 0; i < L; i++) {
      const { r, c } = path[i];
      if (i === 0) {
        const mask = DIR_BIT[dirBetween(path[i], path[i + 1])];
        const sol = solveStartRotation(mask);
        grid[r][c] = { ...sol, r, c };
      } else if (i === L - 1) {
        const mask = DIR_BIT[dirBetween(path[i], path[i - 1])];
        const sol = solveEndRotation(mask);
        grid[r][c] = { ...sol, r, c };
      } else {
        const dPrev = dirBetween(path[i], path[i - 1]);
        const dNext = dirBetween(path[i], path[i + 1]);
        const mask = DIR_BIT[dPrev] | DIR_BIT[dNext];
        const sol = solveInterior(mask);
        grid[r][c] = { ...sol, r, c };
      }
    }

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (!pathSet.has(cellKey(r, c, w))) {
          grid[r][c] = { kind: "blocked", rotation: 0, r, c };
        }
      }
    }

    for (let i = 1; i < L - 1; i++) {
      const { r, c } = path[i];
      grid[r][c].rotation = Math.floor(rnd() * 4) * 90;
    }

    const liquidHue = Math.floor(rnd() * 360);

    return {
      w,
      h,
      grid,
      startRC: path[0],
      endRC: path[L - 1],
      liquidHue,
    };
  }

  return null;
}

function bfsReachable(grid, w, h, start) {
  const visited = new Uint8Array(w * h);
  const q = [];
  const sr = start.r;
  const sc = start.c;
  const startIdx = sr * w + sc;
  q.push(startIdx);
  visited[startIdx] = 1;

  for (let qi = 0; qi < q.length; qi++) {
    const idx = q[qi];
    const r = Math.floor(idx / w);
    const c = idx % w;
    const cell = grid[r][c];
    const mask = getCellMask(cell);
    const dirs = maskToDirs(mask);
    for (const d of dirs) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr < 0 || nr >= h || nc < 0 || nc >= w) continue;
      const nidx = nr * w + nc;
      if (visited[nidx]) continue;
      const nMask = getCellMask(grid[nr][nc]);
      if (nMask & DIR_BIT[oppositeDir(d)]) {
        visited[nidx] = 1;
        q.push(nidx);
      }
    }
  }

  return visited;
}

function isWin(visited, w, end) {
  return visited[end.r * w + end.c] === 1;
}

function liquidColorCss(hue) {
  return `hsl(${hue} 78% 58%)`;
}

function svgForCell(cell) {
  const vb = "0 0 100 100";
  const stroke = "var(--pipe)";
  const sw = 10;
  const inner = 18;
  const mid = 50;

  if (cell.kind === "blocked") {
    return `<svg class="cell__svg" viewBox="${vb}" aria-hidden="true">
      <rect x="22" y="22" width="56" height="56" rx="10" fill="none" stroke="${stroke}" stroke-width="3" opacity="0.25"/>
    </svg>`;
  }

  let paths = "";
  if (cell.kind === "straight") {
    paths = `<line class="pipe-stroke" x1="${mid}" y1="${inner}" x2="${mid}" y2="${100 - inner}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  } else if (cell.kind === "elbow") {
    paths = `<path class="pipe-stroke" d="M ${mid} ${inner} Q ${mid} ${mid} ${100 - inner} ${mid}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  } else if (cell.kind === "start") {
    paths = `<circle cx="${mid}" cy="${inner + 8}" r="12" fill="var(--accent)" opacity="0.9"/>
      <line class="pipe-stroke" x1="${mid}" y1="${inner + 20}" x2="${mid}" y2="${100 - inner}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  } else if (cell.kind === "end") {
    paths = `<rect x="${mid - 14}" y="${inner + 4}" width="28" height="22" rx="6" fill="none" stroke="var(--win)" stroke-width="4"/>
      <line class="pipe-stroke" x1="${mid}" y1="${inner + 26}" x2="${mid}" y2="${100 - inner}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }

  return `<svg class="cell__svg" viewBox="${vb}" aria-hidden="true" style="transform: rotate(${cell.rotation}deg)">
    ${paths}
  </svg>`;
}

const state = {
  level: 1,
  score: 0,
  moves: 0,
  w: 0,
  h: 0,
  grid: null,
  startRC: null,
  endRC: null,
  liquidHue: 160,
  busy: false,
};

const els = {
  board: null,
  levelVal: null,
  movesVal: null,
  scoreVal: null,
  newGameBtn: null,
  statusMsg: null,
  formulaHint: null,
};

function render() {
  const { board, levelVal, movesVal, scoreVal, formulaHint } = els;
  levelVal.textContent = String(state.level);
  movesVal.textContent = String(state.moves);
  scoreVal.textContent = String(state.score);
  formulaHint.textContent = `Each level: +${SCORE_BASE} + level×${SCORE_LEVEL_MULT} + cells×${SCORE_CELL_MULT} − moves×${SCORE_MOVE_PENALTY} (min 0)`;

  board.style.gridTemplateColumns = `repeat(${state.w}, 1fr)`;
  board.innerHTML = "";

  const visited = bfsReachable(state.grid, state.w, state.h, state.startRC);
  const won = isWin(visited, state.w, state.endRC);
  const liq = liquidColorCss(state.liquidHue);
  board.style.setProperty("--liquid", liq);

  for (let r = 0; r < state.h; r++) {
    for (let c = 0; c < state.w; c++) {
      const cell = state.grid[r][c];
      const idx = r * state.w + c;
      const div = document.createElement("button");
      div.type = "button";
      div.className = "cell";
      div.dataset.r = String(r);
      div.dataset.c = String(c);
      if (cell.kind === "blocked") div.classList.add("cell--blocked");
      if (cell.kind === "start") div.classList.add("cell--start");
      if (cell.kind === "end") div.classList.add("cell--end");
      if (visited[idx] && cell.kind !== "blocked") div.classList.add("cell--filled");

      if (cell.kind === "blocked") {
        div.disabled = true;
      } else {
        div.tabIndex = 0;
        div.setAttribute("aria-label", describeCell(cell, r, c));
      }

      div.innerHTML = svgForCell(cell);
      board.appendChild(div);
    }
  }

  if (won) {
    els.statusMsg.textContent = "Level complete!";
    els.statusMsg.classList.add("status--win");
    board.classList.add("is-winning");
  } else {
    els.statusMsg.textContent = "";
    els.statusMsg.classList.remove("status--win");
    board.classList.remove("is-winning");
  }
}

function describeCell(cell, r, c) {
  if (cell.kind === "start") return `Source at row ${r + 1} column ${c + 1}. Flow starts here.`;
  if (cell.kind === "end") return `Exit at row ${r + 1} column ${c + 1}. Connect the flow here.`;
  if (cell.kind === "blocked") return "Blocked.";
  return `Pipe at row ${r + 1} column ${c + 1}. Click or press Enter to rotate.`;
}

function rotateCellAt(r, c) {
  if (state.busy) return;
  const cell = state.grid[r][c];
  if (cell.kind === "blocked" || cell.kind === "start" || cell.kind === "end") return;

  cell.rotation = (cell.rotation + 90) % 360;
  state.moves += 1;
  render();

  const visited = bfsReachable(state.grid, state.w, state.h, state.startRC);
  if (isWin(visited, state.w, state.endRC)) {
    state.busy = true;
    els.board.classList.add("is-disabled");
    const { w, h } = state;
    const raw =
      SCORE_BASE +
      state.level * SCORE_LEVEL_MULT +
      w * h * SCORE_CELL_MULT -
      state.moves * SCORE_MOVE_PENALTY;
    const gained = Math.max(0, raw);
    state.score += gained;
    render();
    window.setTimeout(() => {
      state.level += 1;
      loadLevel();
      state.busy = false;
      els.board.classList.remove("is-disabled");
    }, WIN_DELAY_MS);
  }
}

function loadLevel() {
  const rnd = Math.random;
  const data = buildLevel(state.level, rnd);
  if (!data) {
    els.statusMsg.textContent = "Could not build level; press New game.";
    els.board.classList.add("is-disabled");
    return;
  }
  els.board.classList.remove("is-disabled");
  state.w = data.w;
  state.h = data.h;
  state.grid = data.grid;
  state.startRC = data.startRC;
  state.endRC = data.endRC;
  state.liquidHue = data.liquidHue;
  state.moves = 0;
  els.statusMsg.textContent = "";
  els.statusMsg.classList.remove("status--win");
  render();
}

function newGame() {
  state.level = 1;
  state.score = 0;
  state.busy = false;
  els.board.classList.remove("is-disabled");
  loadLevel();
}

function onBoardClick(ev) {
  const t = ev.target.closest(".cell");
  if (!t || t.disabled) return;
  const r = Number(t.dataset.r);
  const c = Number(t.dataset.c);
  rotateCellAt(r, c);
}

function onBoardKeyDown(ev) {
  if (ev.key !== "Enter" && ev.key !== " ") return;
  const t = ev.target.closest?.(".cell");
  if (!t || t.disabled) return;
  ev.preventDefault();
  const r = Number(t.dataset.r);
  const c = Number(t.dataset.c);
  rotateCellAt(r, c);
}

function init() {
  els.board = document.getElementById("board");
  els.levelVal = document.getElementById("levelVal");
  els.movesVal = document.getElementById("movesVal");
  els.scoreVal = document.getElementById("scoreVal");
  els.newGameBtn = document.getElementById("newGameBtn");
  els.statusMsg = document.getElementById("statusMsg");
  els.formulaHint = document.getElementById("scoreFormulaHint");

  els.board.addEventListener("click", onBoardClick);
  els.board.addEventListener("keydown", onBoardKeyDown);
  els.newGameBtn.addEventListener("click", () => newGame());

  loadLevel();
}

init();
