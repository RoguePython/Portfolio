/**
 * Ball Bash — slingshot physics game (Matter.js + custom canvas).
 */

const STORAGE_KEY = "ball-bash-progress-v1";

const WORLD_W = 2400;
const WORLD_H = 900;
const GROUND_TOP = 820;
const GROUND_H = 80;
const VIEW_W = 1200;

const BIRD_RADIUS = 18;
const ENEMY_RADIUS = 22;
const MAX_STRETCH = 130;
const MIN_STRETCH = 12;
const LAUNCH_POWER = 0.2;
const SETTLE_TIMEOUT_MS = 2500;
const SETTLE_SLEEP_MS = 600;

const KILL_IMPACT = 9;
const FALL_KILL_SPEED = 7;
const GLASS_BREAK_SPEED = 5.5;

const BIRD_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#a855f7", "#22c55e"];

const CAT_BIRD = 0x0001;
const CAT_ENEMY = 0x0002;
const CAT_BLOCK = 0x0004;
const CAT_GROUND = 0x0008;
const CAT_WALL = 0x0010;

const MATERIALS = {
  wood: { density: 0.002, friction: 0.55, restitution: 0.15 },
  glass: { density: 0.001, friction: 0.35, restitution: 0.55 },
  stone: { density: 0.004, friction: 0.75, restitution: 0.08 },
};

const THEMES = {
  neon: {
    label: "Neon Green",
    swatch: ["#3ddc97", "#1a9f6a", "#ff4757"],
    skyTop: "#1b2636",
    skyBottom: "#2d4a3e",
    ground: "#1e2a3a",
    groundLine: "#3ddc97",
    wood: ["#c2783a", "#8b4513"],
    glass: ["#b8f0ff", "#67e8f9"],
    stone: ["#9ca3af", "#4b5563"],
    enemy: "#84cc16",
    enemyDead: "#4b5563",
    slingshot: "#5c4033",
    band: "#3ddc97",
    trajectory: "rgba(61,220,151,0.55)",
    accent: "#3ddc97",
  },
  ice: {
    label: "Ice",
    swatch: ["#7dd3fc", "#38bdf8", "#f472b6"],
    skyTop: "#152028",
    skyBottom: "#1e3a5f",
    ground: "#152028",
    groundLine: "#7dd3fc",
    wood: ["#d4a574", "#a16207"],
    glass: ["#e0f2fe", "#7dd3fc"],
    stone: ["#94a3b8", "#475569"],
    enemy: "#f472b6",
    enemyDead: "#475569",
    slingshot: "#44403c",
    band: "#7dd3fc",
    trajectory: "rgba(125,211,252,0.55)",
    accent: "#7dd3fc",
  },
  ember: {
    label: "Ember",
    swatch: ["#fb923c", "#ea580c", "#fde047"],
    skyTop: "#1a1410",
    skyBottom: "#3d1f0f",
    ground: "#1a1410",
    groundLine: "#fb923c",
    wood: ["#d97706", "#92400e"],
    glass: ["#fed7aa", "#fdba74"],
    stone: ["#78716c", "#44403c"],
    enemy: "#fde047",
    enemyDead: "#57534e",
    slingshot: "#292524",
    band: "#fb923c",
    trajectory: "rgba(251,146,60,0.55)",
    accent: "#fb923c",
  },
  violet: {
    label: "Violet",
    swatch: ["#a78bfa", "#7c3aed", "#34d399"],
    skyTop: "#161320",
    skyBottom: "#2e1065",
    ground: "#161320",
    groundLine: "#a78bfa",
    wood: ["#c4a882", "#78350f"],
    glass: ["#ddd6fe", "#a78bfa"],
    stone: ["#a1a1aa", "#52525b"],
    enemy: "#34d399",
    enemyDead: "#52525b",
    slingshot: "#3f3f46",
    band: "#a78bfa",
    trajectory: "rgba(167,139,250,0.55)",
    accent: "#a78bfa",
  },
};

const { Engine, World, Bodies, Body, Constraint, Events, Composite } = Matter;

const els = {
  canvas: null,
  boardWrap: null,
  levelVal: null,
  birdsVal: null,
  starsVal: null,
  controlsHint: null,
  statusMsg: null,
  pauseBtn: null,
  settingsOverlay: null,
  settingsForm: null,
  themeGroup: null,
  levelSelectOverlay: null,
  levelGrid: null,
  levelSettingsBtn: null,
  pauseOverlay: null,
  resumeBtn: null,
  pauseLevelSelectBtn: null,
  winOverlay: null,
  winStars: null,
  winBirdsUsed: null,
  nextLevelBtn: null,
  winRetryBtn: null,
  winLevelSelectBtn: null,
  loseOverlay: null,
  loseRetryBtn: null,
  loseLevelSelectBtn: null,
};

const progress = {
  theme: "neon",
  unlockedLevel: 1,
  levels: {},
};

const game = {
  phase: "settings",
  levelId: 1,
  level: null,
  engine: null,
  world: null,
  ground: null,
  walls: [],
  blocks: [],
  enemies: [],
  bird: null,
  birdConstraintL: null,
  birdConstraintR: null,
  birdsRemaining: 0,
  birdsUsed: 0,
  totalBirds: 0,
  birdColorIndex: 0,
  isDragging: false,
  dragPointerId: null,
  stretch: { x: 0, y: 0 },
  trajectory: [],
  camera: { x: 0, targetX: 0 },
  settlingStart: 0,
  activeBirdFlying: false,
  earnedStars: 0,
  animFrame: null,
  lastFrame: 0,
  scale: 1,
  slingshotForkL: null,
  slingshotForkR: null,
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.theme && THEMES[parsed.theme]) progress.theme = parsed.theme;
    if (Number.isFinite(parsed.unlockedLevel)) {
      progress.unlockedLevel = Math.max(1, Math.min(parsed.unlockedLevel, BALL_BASH_LEVELS.length));
    }
    if (parsed.levels && typeof parsed.levels === "object") progress.levels = parsed.levels;
  } catch {
    /* ignore */
  }
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      theme: progress.theme,
      unlockedLevel: progress.unlockedLevel,
      levels: progress.levels,
    })
  );
}

function getLevelStars(levelId) {
  const entry = progress.levels[String(levelId)];
  return entry?.stars ?? 0;
}

function computeStars(level, birdsUsed) {
  if (birdsUsed <= level.stars.three) return 3;
  if (birdsUsed <= level.stars.two) return 2;
  return 1;
}

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  document.documentElement.style.setProperty("--accent", theme.accent);
}

function showOverlay(el, show) {
  if (!el) return;
  el.classList.toggle("overlay--hidden", !show);
  el.hidden = !show;
}

function setPhase(phase) {
  game.phase = phase;
  updateHud();
  updateHint();
}

function updateHud() {
  if (els.levelVal) els.levelVal.textContent = String(game.levelId);
  if (els.birdsVal) els.birdsVal.textContent = String(game.birdsRemaining);
  const stars = getLevelStars(game.levelId);
  if (els.starsVal) els.starsVal.textContent = stars > 0 ? "★".repeat(stars) : "—";
}

function updateHint() {
  if (!els.controlsHint) return;
  const hints = {
    settings: "Choose a theme, then open Level Select",
    levelSelect: "Pick a level to play",
    aiming: "Drag the bird backward to aim · Release to launch",
    flying: "Bird in flight…",
    settling: "Waiting for structures to settle…",
    paused: "Paused",
    won: "Level complete!",
    lost: "Out of birds!",
  };
  els.controlsHint.textContent = hints[game.phase] ?? "";
}

function setStatus(msg) {
  if (els.statusMsg) els.statusMsg.textContent = msg;
}

function renderStarRow(container, earned, total = 3, large = false) {
  if (!container) return;
  container.className = large ? "star-row star-row--large" : "star-row";
  container.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const span = document.createElement("span");
    span.textContent = "★";
    span.className = i < earned ? "star--earned" : "star--empty";
    span.setAttribute("aria-hidden", "true");
    container.appendChild(span);
  }
}

function buildThemePicker() {
  if (!els.themeGroup) return;
  els.themeGroup.innerHTML = "";
  Object.entries(THEMES).forEach(([key, theme]) => {
    const label = document.createElement("label");
    label.className = "theme-option";
    label.innerHTML = `
      <input type="radio" name="theme" value="${key}" ${progress.theme === key ? "checked" : ""} />
      <div class="theme-option__swatch">
        ${theme.swatch.map((c) => `<span style="background:${c}"></span>`).join("")}
      </div>
      <span class="theme-option__name">${theme.label}</span>
    `;
    els.themeGroup.appendChild(label);
  });
}

function buildLevelGrid() {
  if (!els.levelGrid) return;
  els.levelGrid.innerHTML = "";
  BALL_BASH_LEVELS.forEach((lvl) => {
    const locked = lvl.id > progress.unlockedLevel;
    const stars = getLevelStars(lvl.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `level-tile${locked ? " level-tile--locked" : ""}`;
    btn.disabled = locked;
    btn.setAttribute("role", "listitem");
    btn.setAttribute("aria-label", locked ? `Level ${lvl.id} locked` : `Level ${lvl.id}: ${lvl.name}`);
    btn.innerHTML = locked
      ? `<span class="level-tile__lock" aria-hidden="true">🔒</span><span class="level-tile__num">${lvl.id}</span>`
      : `<span class="level-tile__num">${lvl.id}</span>
         <span class="star-row">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>`;
    const name = document.createElement("span");
    name.className = "level-tile__name";
    name.textContent = lvl.name;
    btn.appendChild(name);
    if (!locked) {
      btn.addEventListener("click", () => startLevel(lvl.id));
    }
    els.levelGrid.appendChild(btn);
  });
}

function openSettings() {
  buildThemePicker();
  showOverlay(els.levelSelectOverlay, false);
  showOverlay(els.pauseOverlay, false);
  showOverlay(els.winOverlay, false);
  showOverlay(els.loseOverlay, false);
  showOverlay(els.settingsOverlay, true);
  setPhase("settings");
}

function openLevelSelect() {
  buildLevelGrid();
  showOverlay(els.settingsOverlay, false);
  showOverlay(els.pauseOverlay, false);
  showOverlay(els.winOverlay, false);
  showOverlay(els.loseOverlay, false);
  showOverlay(els.levelSelectOverlay, true);
  setPhase("levelSelect");
  destroyWorld();
}

function collisionSpeed(bodyA, bodyB) {
  const rvx = bodyA.velocity.x - bodyB.velocity.x;
  const rvy = bodyA.velocity.y - bodyB.velocity.y;
  return Math.hypot(rvx, rvy);
}

function killEnemy(enemyBody) {
  if (!enemyBody.gameData || enemyBody.gameData.dead) return;
  enemyBody.gameData.dead = true;
  enemyBody.gameData.deathTime = performance.now();
  enemyBody.collisionFilter.mask = 0;
  setTimeout(() => {
    if (game.world && enemyBody.parent) {
      World.remove(game.world, enemyBody);
    }
  }, 400);
}

function breakGlassBlock(blockBody) {
  if (!blockBody.gameData || blockBody.gameData.broken) return;
  blockBody.gameData.broken = true;
  if (game.world) World.remove(game.world, blockBody);
  game.blocks = game.blocks.filter((b) => b !== blockBody);
}

function livingEnemies() {
  return game.enemies.filter((e) => e.gameData && !e.gameData.dead);
}

function destroyWorld() {
  if (game.animFrame) {
    cancelAnimationFrame(game.animFrame);
    game.animFrame = null;
  }
  if (game.engine) {
    Events.off(game.engine, "collisionStart");
    Engine.clear(game.engine);
    game.engine = null;
    game.world = null;
  }
  game.ground = null;
  game.walls = [];
  game.blocks = [];
  game.enemies = [];
  game.bird = null;
  game.birdConstraintL = null;
  game.birdConstraintR = null;
  game.activeBirdFlying = false;
  game.isDragging = false;
  game.trajectory = [];
}

function createEngine() {
  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 8,
    velocityIterations: 6,
  });
  engine.world.gravity.y = 1;
  engine.world.gravity.scale = 0.001;
  return engine;
}

function spawnLevelBodies(level) {
  const world = game.world;

  game.ground = Bodies.rectangle(WORLD_W / 2, GROUND_TOP + GROUND_H / 2, WORLD_W + 400, GROUND_H, {
    isStatic: true,
    friction: 0.9,
    label: "ground",
    collisionFilter: { category: CAT_GROUND, mask: CAT_BIRD | CAT_ENEMY | CAT_BLOCK },
  });
  game.ground.gameData = { type: "ground" };

  game.walls = [
    Bodies.rectangle(-30, WORLD_H / 2, 60, WORLD_H + 200, {
      isStatic: true,
      label: "wall",
      collisionFilter: { category: CAT_WALL, mask: CAT_BIRD | CAT_ENEMY | CAT_BLOCK },
    }),
    Bodies.rectangle(WORLD_W + 30, WORLD_H / 2, 60, WORLD_H + 200, {
      isStatic: true,
      label: "wall",
      collisionFilter: { category: CAT_WALL, mask: CAT_BIRD | CAT_ENEMY | CAT_BLOCK },
    }),
  ];

  game.blocks = level.blocks.map((def) => {
    const mat = MATERIALS[def.material] || MATERIALS.wood;
    const body = Bodies.rectangle(def.x, def.y, def.w, def.h, {
      ...mat,
      label: "block",
      chamfer: { radius: 2 },
      collisionFilter: { category: CAT_BLOCK, mask: CAT_BIRD | CAT_ENEMY | CAT_BLOCK | CAT_GROUND },
    });
    body.gameData = { type: "block", material: def.material, broken: false };
    return body;
  });

  game.enemies = level.enemies.map((def) => {
    const body = Bodies.circle(def.x, def.y, def.r || ENEMY_RADIUS, {
      density: 0.002,
      friction: 0.5,
      restitution: 0.25,
      label: "enemy",
      collisionFilter: { category: CAT_ENEMY, mask: CAT_BIRD | CAT_ENEMY | CAT_BLOCK | CAT_GROUND },
    });
    body.gameData = { type: "enemy", dead: false, deathTime: 0 };
    return body;
  });

  const forkSpread = 22;
  const forkY = level.slingshot.y + 30;
  game.slingshotForkL = { x: level.slingshot.x - forkSpread, y: forkY };
  game.slingshotForkR = { x: level.slingshot.x + forkSpread, y: forkY };

  World.add(world, [game.ground, ...game.walls, ...game.blocks, ...game.enemies]);
}

function spawnBird() {
  if (!game.level || game.bird) return;
  const level = game.level;
  const color = BIRD_COLORS[game.birdColorIndex % BIRD_COLORS.length];
  game.birdColorIndex++;

  const spawnX = level.slingshot.x;
  const spawnY = level.slingshot.y;

  const bird = Bodies.circle(spawnX, spawnY, BIRD_RADIUS, {
    density: 0.003,
    friction: 0.4,
    restitution: 0.45,
    label: "bird",
    collisionFilter: { category: CAT_BIRD, mask: CAT_ENEMY | CAT_BLOCK | CAT_GROUND },
  });
  bird.gameData = { type: "bird", color, launched: false };

  game.birdConstraintL = Constraint.create({
    bodyA: bird,
    pointB: { x: game.slingshotForkL.x, y: game.slingshotForkL.y },
    stiffness: 0.04,
    damping: 0.02,
    length: 0,
  });
  game.birdConstraintR = Constraint.create({
    bodyA: bird,
    pointB: { x: game.slingshotForkR.x, y: game.slingshotForkR.y },
    stiffness: 0.04,
    damping: 0.02,
    length: 0,
  });

  game.bird = bird;
  World.add(game.world, [bird, game.birdConstraintL, game.birdConstraintR]);
  game.stretch = { x: 0, y: 0 };
  game.trajectory = [];
  game.isDragging = false;
  setPhase("aiming");
}

function removeBirdConstraints() {
  if (game.birdConstraintL && game.world) {
    World.remove(game.world, game.birdConstraintL);
    game.birdConstraintL = null;
  }
  if (game.birdConstraintR && game.world) {
    World.remove(game.world, game.birdConstraintR);
    game.birdConstraintR = null;
  }
}

function computeLaunchVelocity(stretch) {
  return { x: stretch.x * LAUNCH_POWER, y: stretch.y * LAUNCH_POWER };
}

function predictTrajectory(origin, velocity) {
  const points = [{ x: origin.x, y: origin.y }];
  let x = origin.x;
  let y = origin.y;
  let vx = velocity.x;
  let vy = velocity.y;
  const dt = 1000 / 60;
  const gy = game.engine.world.gravity.y * game.engine.world.gravity.scale;

  for (let i = 0; i < 24; i++) {
    vy += gy * dt;
    x += vx * dt;
    y += vy * dt;
    if (y >= GROUND_TOP - BIRD_RADIUS) break;
    if (x < 0 || x > WORLD_W) break;
    points.push({ x, y });
  }
  return points;
}

function updateTrajectory() {
  if (!game.bird || game.phase !== "aiming") {
    game.trajectory = [];
    return;
  }
  const stretchLen = Math.hypot(game.stretch.x, game.stretch.y);
  if (stretchLen < MIN_STRETCH) {
    game.trajectory = [];
    return;
  }
  const vel = computeLaunchVelocity(game.stretch);
  game.trajectory = predictTrajectory(game.bird.position, vel);
}

function launchBird() {
  if (!game.bird || game.phase !== "aiming") return;
  const stretchLen = Math.hypot(game.stretch.x, game.stretch.y);
  if (stretchLen < MIN_STRETCH) {
    Body.setPosition(game.bird, { x: game.level.slingshot.x, y: game.level.slingshot.y });
    Body.setVelocity(game.bird, { x: 0, y: 0 });
    game.stretch = { x: 0, y: 0 };
    game.trajectory = [];
    return;
  }

  removeBirdConstraints();
  const vel = computeLaunchVelocity(game.stretch);
  Body.setVelocity(game.bird, vel);
  game.bird.gameData.launched = true;
  game.activeBirdFlying = true;
  game.birdsUsed++;
  game.birdsRemaining--;
  game.stretch = { x: 0, y: 0 };
  game.trajectory = [];
  setPhase("flying");
  updateHud();
}

function screenToWorld(sx, sy) {
  const rect = els.canvas.getBoundingClientRect();
  const px = ((sx - rect.left) / rect.width) * els.canvas.width;
  const py = ((sy - rect.top) / rect.height) * els.canvas.height;
  const wx = px / game.scale + game.camera.x;
  const wy = py / game.scale;
  return { x: wx, y: wy };
}

function onPointerDown(ev) {
  if (game.phase !== "aiming" || !game.bird) return;
  const world = screenToWorld(ev.clientX, ev.clientY);
  const anchor = game.level.slingshot;
  const nearBird = Math.hypot(world.x - game.bird.position.x, world.y - game.bird.position.y) < BIRD_RADIUS + 40;
  const nearSlingshot = Math.hypot(world.x - anchor.x, world.y - anchor.y) < MAX_STRETCH + 30;
  if (!nearBird && !nearSlingshot) return;

  game.isDragging = true;
  game.dragPointerId = ev.pointerId;
  els.canvas.setPointerCapture(ev.pointerId);
  ev.preventDefault();
}

function onPointerMove(ev) {
  if (!game.isDragging || ev.pointerId !== game.dragPointerId || !game.bird) return;

  const world = screenToWorld(ev.clientX, ev.clientY);
  const anchor = game.level.slingshot;
  let dx = world.x - anchor.x;
  let dy = world.y - anchor.y;
  const dist = Math.hypot(dx, dy);
  if (dist > MAX_STRETCH) {
    const s = MAX_STRETCH / dist;
    dx *= s;
    dy *= s;
  }

  const birdX = anchor.x + dx;
  const birdY = anchor.y + dy;
  Body.setPosition(game.bird, { x: birdX, y: birdY });
  Body.setVelocity(game.bird, { x: 0, y: 0 });
  Body.setAngularVelocity(game.bird, 0);

  game.stretch = { x: -dx, y: -dy };
  updateTrajectory();
  ev.preventDefault();
}

function onPointerUp(ev) {
  if (!game.isDragging || ev.pointerId !== game.dragPointerId) return;
  game.isDragging = false;
  game.dragPointerId = null;
  try {
    els.canvas.releasePointerCapture(ev.pointerId);
  } catch {
    /* ignore */
  }
  launchBird();
  ev.preventDefault();
}

function setupCollisions() {
  Events.on(game.engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const speed = collisionSpeed(bodyA, bodyB);

      [bodyA, bodyB].forEach((body) => {
        if (body.gameData?.type === "enemy" && !body.gameData.dead) {
          if (speed >= KILL_IMPACT) killEnemy(body);
        }
        if (body.gameData?.type === "block" && body.gameData.material === "glass") {
          if (speed >= GLASS_BREAK_SPEED) breakGlassBlock(body);
        }
      });

      const groundHit =
        (bodyA.gameData?.type === "ground" && bodyB.gameData?.type === "enemy") ||
        (bodyB.gameData?.type === "ground" && bodyA.gameData?.type === "enemy");
      if (groundHit) {
        const enemy = bodyA.gameData?.type === "enemy" ? bodyA : bodyB;
        if (!enemy.gameData.dead && enemy.velocity.y >= FALL_KILL_SPEED) {
          killEnemy(enemy);
        }
      }
    });
  });
}

function checkEnemyFalls() {
  game.enemies.forEach((enemy) => {
    if (!enemy.gameData || enemy.gameData.dead) return;
    if (enemy.position.y > GROUND_TOP + 60) {
      killEnemy(enemy);
    }
  });
}

function removeBirdIfDone() {
  if (!game.bird || !game.activeBirdFlying) return false;

  const b = game.bird;
  const outOfBounds =
    b.position.x < -100 || b.position.x > WORLD_W + 100 || b.position.y > WORLD_H + 50;
  const sleeping = b.speed < 0.15 && b.position.y > GROUND_TOP - 80;

  if (outOfBounds || sleeping) {
    if (game.world) World.remove(game.world, b);
    game.bird = null;
    game.activeBirdFlying = false;
    return true;
  }
  return false;
}

function bodiesSettled() {
  const dynamic = Composite.allBodies(game.world).filter((b) => !b.isStatic && b.label !== "bird");
  if (dynamic.length === 0) return true;
  return dynamic.every((b) => b.isSleeping || b.speed < 0.08);
}

function checkWinLose() {
  if (livingEnemies().length === 0) {
    const stars = computeStars(game.level, game.birdsUsed);
    game.earnedStars = stars;
    const key = String(game.levelId);
    const prev = progress.levels[key] || { stars: 0, bestBirds: 99 };
    progress.levels[key] = {
      stars: Math.max(prev.stars, stars),
      bestBirds: Math.min(prev.bestBirds, game.birdsUsed),
    };
    if (game.levelId < BALL_BASH_LEVELS.length) {
      progress.unlockedLevel = Math.max(progress.unlockedLevel, game.levelId + 1);
    }
    saveProgress();
    showWinOverlay();
    stopEngine();
    return true;
  }

  if (game.birdsRemaining <= 0 && !game.bird && !game.activeBirdFlying) {
    showLoseOverlay();
    stopEngine();
    return true;
  }
  return false;
}

function beginSettling() {
  game.settlingStart = performance.now();
  setPhase("settling");
}

function afterBirdResolved() {
  if (checkWinLose()) return;
  if (game.birdsRemaining > 0) {
    spawnBird();
  } else {
    checkWinLose();
  }
}

function updateSettling() {
  const elapsed = performance.now() - game.settlingStart;
  if (bodiesSettled() && elapsed > SETTLE_SLEEP_MS) {
    afterBirdResolved();
    return;
  }
  if (elapsed > SETTLE_TIMEOUT_MS) {
    afterBirdResolved();
  }
}

function updateCamera() {
  const level = game.level;
  if (!level) return;

  let target = level.cameraStart ?? 0;
  if (game.phase === "flying" && game.bird) {
    target = Math.max(0, game.bird.position.x - VIEW_W * 0.35);
  } else if (game.phase === "settling" && game.bird) {
    target = Math.max(0, game.bird.position.x - VIEW_W * 0.35);
  } else {
    target = Math.max(0, (level.slingshot.x + 600) / 2 - VIEW_W / 2);
  }

  target = Math.min(target, WORLD_W - VIEW_W);
  target = Math.max(0, target);

  const lerp = reducedMotion ? 1 : 0.08;
  game.camera.targetX = target;
  game.camera.x += (game.camera.targetX - game.camera.x) * lerp;
}

function resizeCanvas() {
  if (!els.canvas || !els.boardWrap) return;
  const wrapW = els.boardWrap.clientWidth - 20;
  const aspect = VIEW_W / WORLD_H;
  const cssW = Math.min(wrapW, 920);
  const cssH = cssW / aspect;

  els.canvas.style.width = `${cssW}px`;
  els.canvas.style.height = `${cssH}px`;
  els.canvas.width = Math.round(VIEW_W * (cssH / WORLD_H));
  els.canvas.height = Math.round(cssH);
  game.scale = els.canvas.height / WORLD_H;
}

function drawCircle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawRect(ctx, x, y, w, h, angle, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

function worldToCanvas(wx, wy) {
  return {
    x: (wx - game.camera.x) * game.scale,
    y: wy * game.scale,
  };
}

function render() {
  const ctx = els.canvas.getContext("2d");
  const theme = THEMES[progress.theme];
  const w = els.canvas.width;
  const h = els.canvas.height;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, theme.skyTop);
  skyGrad.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const groundY = worldToCanvas(0, GROUND_TOP).y;
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = theme.groundLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  if (!game.world) return;

  game.blocks.forEach((block) => {
    if (block.gameData?.broken) return;
    const mat = block.gameData.material;
    const colors = theme[mat] || theme.wood;
    const p = worldToCanvas(block.position.x, block.position.y);
    drawRect(
      ctx,
      p.x,
      p.y,
      block.bounds.max.x - block.bounds.min.x,
      block.bounds.max.y - block.bounds.min.y,
      block.angle,
      colors[0],
      colors[1]
    );
  });

  game.enemies.forEach((enemy) => {
    const p = worldToCanvas(enemy.position.x, enemy.position.y);
    const r = (enemy.circleRadius || ENEMY_RADIUS) * game.scale;
    const dead = enemy.gameData?.dead;
    const fill = dead ? theme.enemyDead : theme.enemy;
    drawCircle(ctx, p.x, p.y, r, fill, "rgba(0,0,0,0.35)");
    if (!dead) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(p.x - r * 0.3, p.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.arc(p.x + r * 0.3, p.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  if (game.bird) {
    const p = worldToCanvas(game.bird.position.x, game.bird.position.y);
    const r = BIRD_RADIUS * game.scale;
    const color = game.bird.gameData?.color || BIRD_COLORS[0];
    drawCircle(ctx, p.x, p.y, r, color, "rgba(0,0,0,0.4)");
  }

  if (game.slingshotForkL && game.phase === "aiming") {
    const fl = worldToCanvas(game.slingshotForkL.x, game.slingshotForkL.y);
    const fr = worldToCanvas(game.slingshotForkR.x, game.slingshotForkR.y);
    const post = worldToCanvas(game.level.slingshot.x, game.level.slingshot.y + 50);

    ctx.strokeStyle = theme.slingshot;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(post.x, post.y);
    ctx.lineTo(fl.x, fl.y);
    ctx.moveTo(post.x, post.y);
    ctx.lineTo(fr.x, fr.y);
    ctx.stroke();

    if (game.bird) {
      const bp = worldToCanvas(game.bird.position.x, game.bird.position.y);
      ctx.strokeStyle = theme.band;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fl.x, fl.y);
      ctx.lineTo(bp.x, bp.y);
      ctx.lineTo(fr.x, fr.y);
      ctx.stroke();
    }
  }

  if (game.trajectory.length > 1) {
    ctx.fillStyle = theme.trajectory;
    game.trajectory.forEach((pt, i) => {
      if (i === 0) return;
      const p = worldToCanvas(pt.x, pt.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, 4 - i * 0.12) * game.scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const queueX = worldToCanvas(game.level?.slingshot.x ?? 100, 60);
  for (let i = 0; i < game.birdsRemaining; i++) {
    const color = BIRD_COLORS[(game.birdColorIndex + i) % BIRD_COLORS.length];
    drawCircle(ctx, 30 + i * 28, 28, 10, color, null);
  }
}

function gameLoop(now) {
  if (!game.engine) return;

  if (game.phase !== "paused" && game.phase !== "won" && game.phase !== "lost" && game.phase !== "levelSelect" && game.phase !== "settings") {
    Engine.update(game.engine, 1000 / 60);

    checkEnemyFalls();

    if (livingEnemies().length === 0) {
      checkWinLose();
    } else if (game.phase === "flying") {
      if (removeBirdIfDone()) {
        beginSettling();
      } else if (game.bird) {
        game.camera.targetX = Math.max(0, game.bird.position.x - VIEW_W * 0.35);
      }
    } else if (game.phase === "settling") {
      removeBirdIfDone();
      updateSettling();
    }

    if (game.phase === "aiming" && game.bird && !game.isDragging) {
      Body.setVelocity(game.bird, { x: 0, y: 0 });
    }
  }

  updateCamera();
  render();
  game.animFrame = requestAnimationFrame(gameLoop);
}

function stopEngine() {
  if (game.animFrame) {
    cancelAnimationFrame(game.animFrame);
    game.animFrame = null;
  }
}

function startLevel(levelId) {
  destroyWorld();
  showOverlay(els.settingsOverlay, false);
  showOverlay(els.levelSelectOverlay, false);
  showOverlay(els.pauseOverlay, false);
  showOverlay(els.winOverlay, false);
  showOverlay(els.loseOverlay, false);

  const level = BALL_BASH_LEVELS.find((l) => l.id === levelId);
  if (!level) return;

  game.levelId = levelId;
  game.level = level;
  game.birdsRemaining = level.birds;
  game.birdsUsed = 0;
  game.totalBirds = level.birds;
  game.birdColorIndex = 0;
  game.camera.x = Math.max(0, Math.min(level.cameraStart ?? 0, WORLD_W - VIEW_W));
  game.camera.targetX = game.camera.x;

  game.engine = createEngine();
  game.world = game.engine.world;
  setupCollisions();
  spawnLevelBodies(level);
  spawnBird();

  resizeCanvas();
  updateHud();
  setStatus(`${level.name} — ${level.birds} birds`);

  game.animFrame = requestAnimationFrame(gameLoop);
}

function showWinOverlay() {
  setPhase("won");
  renderStarRow(els.winStars, game.earnedStars, 3, true);
  if (els.winBirdsUsed) els.winBirdsUsed.textContent = String(game.birdsUsed);
  const hasNext = game.levelId < BALL_BASH_LEVELS.length;
  if (els.nextLevelBtn) {
    els.nextLevelBtn.hidden = !hasNext;
    els.nextLevelBtn.style.display = hasNext ? "" : "none";
  }
  showOverlay(els.winOverlay, true);
}

function showLoseOverlay() {
  setPhase("lost");
  showOverlay(els.loseOverlay, true);
}

function pauseGame() {
  if (!["aiming", "flying", "settling"].includes(game.phase)) return;
  setPhase("paused");
  showOverlay(els.pauseOverlay, true);
}

function resumeGame() {
  if (game.phase !== "paused") return;
  showOverlay(els.pauseOverlay, false);
  if (game.bird && !game.bird.gameData?.launched) setPhase("aiming");
  else if (game.activeBirdFlying) setPhase("flying");
  else setPhase("settling");
}

function bindEvents() {
  els.settingsForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(els.settingsForm);
    const theme = fd.get("theme");
    if (theme && THEMES[theme]) {
      progress.theme = theme;
      applyTheme(theme);
      saveProgress();
    }
    openLevelSelect();
  });

  els.pauseBtn?.addEventListener("click", () => {
    if (game.phase === "paused") resumeGame();
    else pauseGame();
  });

  els.resumeBtn?.addEventListener("click", resumeGame);
  els.pauseLevelSelectBtn?.addEventListener("click", openLevelSelect);
  els.levelSettingsBtn?.addEventListener("click", openSettings);

  els.nextLevelBtn?.addEventListener("click", () => {
    if (game.levelId < BALL_BASH_LEVELS.length) startLevel(game.levelId + 1);
  });
  els.winRetryBtn?.addEventListener("click", () => startLevel(game.levelId));
  els.winLevelSelectBtn?.addEventListener("click", openLevelSelect);
  els.loseRetryBtn?.addEventListener("click", () => startLevel(game.levelId));
  els.loseLevelSelectBtn?.addEventListener("click", openLevelSelect);

  els.canvas.addEventListener("pointerdown", onPointerDown);
  els.canvas.addEventListener("pointermove", onPointerMove);
  els.canvas.addEventListener("pointerup", onPointerUp);
  els.canvas.addEventListener("pointercancel", onPointerUp);

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (game.phase === "paused") resumeGame();
      else if (["aiming", "flying", "settling"].includes(game.phase)) pauseGame();
    }
  });

  window.addEventListener("resize", resizeCanvas);
}

function init() {
  els.canvas = document.getElementById("canvas");
  els.boardWrap = document.getElementById("boardWrap");
  els.levelVal = document.getElementById("levelVal");
  els.birdsVal = document.getElementById("birdsVal");
  els.starsVal = document.getElementById("starsVal");
  els.controlsHint = document.getElementById("controlsHint");
  els.statusMsg = document.getElementById("statusMsg");
  els.pauseBtn = document.getElementById("pauseBtn");
  els.settingsOverlay = document.getElementById("settingsOverlay");
  els.settingsForm = document.getElementById("settingsForm");
  els.themeGroup = document.getElementById("themeGroup");
  els.levelSelectOverlay = document.getElementById("levelSelectOverlay");
  els.levelGrid = document.getElementById("levelGrid");
  els.levelSettingsBtn = document.getElementById("levelSettingsBtn");
  els.pauseOverlay = document.getElementById("pauseOverlay");
  els.resumeBtn = document.getElementById("resumeBtn");
  els.pauseLevelSelectBtn = document.getElementById("pauseLevelSelectBtn");
  els.winOverlay = document.getElementById("winOverlay");
  els.winStars = document.getElementById("winStars");
  els.winBirdsUsed = document.getElementById("winBirdsUsed");
  els.nextLevelBtn = document.getElementById("nextLevelBtn");
  els.winRetryBtn = document.getElementById("winRetryBtn");
  els.winLevelSelectBtn = document.getElementById("winLevelSelectBtn");
  els.loseOverlay = document.getElementById("loseOverlay");
  els.loseRetryBtn = document.getElementById("loseRetryBtn");
  els.loseLevelSelectBtn = document.getElementById("loseLevelSelectBtn");

  loadProgress();
  applyTheme(progress.theme);
  bindEvents();
  resizeCanvas();
  openSettings();
}

init();
