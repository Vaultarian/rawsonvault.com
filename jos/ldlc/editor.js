/* ===== LDLC — Level Devil Level Creator: the editor =====
   Jos's design is in DESIGN.md. Blocks marked ready:true work; the rest are on his list
   and get built one at a time. */
'use strict';

/* ---------- numbers to tweak ---------- */
const T = {
  cols:       32,    // how wide a level is, in blocks
  rows:       18,    // how tall a level is, in blocks
  speed:      7,     // how fast the hero runs, blocks per second
  jump:       15.5,  // how hard he jumps
  gravity:    45,    // how fast he falls
  maxFall:    22,    // the fastest he can fall
  hero:       0.75,  // how big he is, in blocks
  respawn:    0.6,   // seconds before he tries again
  portalFlip: 0.30   // Jos: the portal switches colours every 0.30 seconds
};

/* Jos's list of blocks, in his order */
const BLOCKS = [
  { id:'tile',       name:'Tile',          ready:true },
  { id:'hero',       name:'Hero',          ready:true },
  { id:'door',       name:'Door',          ready:true },
  { id:'spike',      name:'Spike',         ready:true },
  { id:'smallspike', name:'Small spike' },
  { id:'sawblade',   name:'Sawblade' },
  { id:'spring',     name:'Spring' },
  { id:'coin',       name:'Coin' },
  { id:'oneway',     name:'One way' },
  { id:'portal',     name:'Portal' },
  { id:'trigger',    name:'Trigger' },
  { id:'button',     name:'Button' },
  { id:'controls',   name:'Edit controls' }
];
const NAME = {};
BLOCKS.forEach(b => { NAME[b.id] = b.name; });

/* what each block does, until Block properties lets you change it */
const DEFAULTS = {
  tile:  { collision:true,  deadly:false },
  spike: { collision:false, deadly:true  },
  hero:  { collision:false, deadly:false },
  door:  { collision:false, deadly:false }
};
const ONLY_ONE = ['hero', 'door'];   // placing another one moves it

/* ---------- the level ---------- */
const SAVE_KEY = 'jos-ldlc-level';
let grid = emptyGrid();

function emptyGrid() {
  return Array.from({ length:T.rows }, () => Array(T.cols).fill(null));
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(grid)); } catch (e) {}
}
function load() {
  try {
    const g = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (Array.isArray(g) && g.length === T.rows && g[0].length === T.cols) grid = g;
  } catch (e) {}
}
function props(cell) {
  return Object.assign({}, DEFAULTS[cell.t] || { collision:false, deadly:false }, cell.p || {});
}
function find(type) {
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++)
      if (grid[y][x] && grid[y][x].t === type) return { x, y };
  return null;
}

/* ---------- drawing the blocks ---------- */
/* Jos: a tile is a block, not a slab. Tiles that touch join up into one solid block,
   with the red edge only on the outside. gx, gy = where it is on the grid (if it is). */
function drawTile(c, x, y, s, gx, gy) {
  const isTile = (ax, ay) => gx !== undefined && ax >= 0 && ay >= 0 && ax < T.cols && ay < T.rows
                             && grid[ay][ax] && grid[ay][ax].t === 'tile';
  c.fillStyle = '#2a0008'; c.fillRect(x, y, s, s);
  const e = Math.max(2, s * .1);
  c.fillStyle = '#ff2a3d';
  if (!isTile(gx, gy - 1)) c.fillRect(x, y, s, e);
  if (!isTile(gx, gy + 1)) c.fillRect(x, y + s - e, s, e);
  if (!isTile(gx - 1, gy)) c.fillRect(x, y, e, s);
  if (!isTile(gx + 1, gy)) c.fillRect(x + s - e, y, e, s);
}
function drawSpike(c, x, y, s) {
  c.fillStyle = '#e6e6e6';
  for (let i = 0; i < 3; i++) {             // Jos: a triple spike on one block
    const w = s / 3;
    c.beginPath();
    c.moveTo(x + i * w, y + s);
    c.lineTo(x + i * w + w / 2, y + s * .3);
    c.lineTo(x + (i + 1) * w, y + s);
    c.fill();
  }
}
function doorPath(c, x, y, s) {
  const w = s * .7, h = s * .95, dx = x + (s - w) / 2, dy = y + s - h;
  c.beginPath();
  c.moveTo(dx, y + s);
  c.lineTo(dx, dy + w / 2);
  c.arc(dx + w / 2, dy + w / 2, w / 2, Math.PI, 0);
  c.lineTo(dx + w, y + s);
  return { w, h, dx, dy };
}
function drawDoor(c, x, y, s) {
  c.fillStyle = '#14000a';
  c.strokeStyle = '#ffd23f';
  c.lineWidth = Math.max(2, s * .08);
  const { w, h, dx, dy } = doorPath(c, x, y, s);
  c.fill(); c.stroke();
  c.fillStyle = c.strokeStyle;
  c.beginPath(); c.arc(dx + w * .75, dy + h * .58, Math.max(1.5, s * .05), 0, Math.PI * 2); c.fill();
}
/* Jos's door: it pulls you into the middle, a shutter comes down over you,
   then the whole door sinks into the ground. t = seconds since you touched it. */
const DOOR = { shut:0.35, sink:0.5 };
function drawDoorClosing(c, x, y, s, t, heroDraw) {
  const down = Math.max(0, Math.min(1, (t - DOOR.shut) / DOOR.sink)) * s;
  c.save();
  c.beginPath(); c.rect(x - s, y - s, s * 3, s * 2); c.clip();   // nothing shows below the ground
  c.translate(0, down);
  c.fillStyle = '#14000a';
  c.strokeStyle = '#ffd23f';
  c.lineWidth = Math.max(2, s * .08);
  const { w, h, dx, dy } = doorPath(c, x, y, s);
  c.fill();
  heroDraw();
  const f = Math.min(1, t / DOOR.shut);                          // the shutter coming down
  c.save();
  doorPath(c, x, y, s); c.clip();
  c.fillStyle = '#ffd23f';
  c.fillRect(dx, dy, w, h * f * .25 + 1);
  c.lineWidth = Math.max(1.5, s * .05);
  for (let i = 1; i < 4; i++) {
    const bx = dx + w * i / 4;
    c.beginPath(); c.moveTo(bx, dy); c.lineTo(bx, dy + h * f); c.stroke();
  }
  c.restore();
  doorPath(c, x, y, s); c.stroke();
  c.restore();
}
function drawHero(c, x, y, size) {
  const s = size;
  c.fillStyle = '#ff4d5e';
  c.beginPath();                            // horns
  c.moveTo(x + s * .1,  y); c.lineTo(x + s * .22, y - s * .28); c.lineTo(x + s * .36, y);
  c.moveTo(x + s * .64, y); c.lineTo(x + s * .78, y - s * .28); c.lineTo(x + s * .9,  y);
  c.fill();
  roundRect(c, x, y, s, s, s * .2); c.fill();
  c.fillStyle = '#fff';                     // eyes
  roundRect(c, x + s * .28, y + s * .28, s * .24, s * .3, s * .08); c.fill();
  roundRect(c, x + s * .6,  y + s * .28, s * .24, s * .3, s * .08); c.fill();
  c.fillStyle = '#000';
  c.fillRect(x + s * .4, y + s * .4, s * .09, s * .1);
  c.fillRect(x + s * .72, y + s * .4, s * .09, s * .1);
}
function drawPortal(c, x, y, s, time) {
  /* Jos's own drawing: black ring, white gap, smaller black ring, white middle.
     It swaps its black and white every 0.30 seconds. */
  const flip = Math.floor(time / T.portalFlip) % 2 === 1;
  const a = flip ? '#fff' : '#000', b = flip ? '#000' : '#fff';
  const rings = [[.08, .14, a], [.2, .26, b], [.3, .36, a], [.39, .44, b]];
  rings.forEach(([ix, iy, col]) => {
    c.fillStyle = col;
    c.fillRect(x + s * ix, y + s * iy, s * (1 - 2 * ix), s * (1 - 2 * iy));
  });
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function drawBlock(c, type, x, y, s, time, gx, gy) {
  if (type === 'tile') drawTile(c, x, y, s, gx, gy);
  else if (type === 'spike') drawSpike(c, x, y, s);
  else if (type === 'door') drawDoor(c, x, y, s);
  else if (type === 'portal') drawPortal(c, x, y, s, time);
  else if (type === 'hero') {
    const h = s * T.hero;
    drawHero(c, x + (s - h) / 2, y + s - h, h);
  }
}

/* ---------- the blocks bar ---------- */
const palette = document.getElementById('palette');
const icons = [];
let chosen = 'tile', tool = 'place';

BLOCKS.forEach(b => {
  const btn = document.createElement('button');
  btn.className = 'block' + (b.ready ? '' : ' soon');
  btn.dataset.id = b.id;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 80;
  btn.appendChild(cv);
  btn.appendChild(document.createTextNode(b.name));
  if (!b.ready) {
    const tag = document.createElement('span');
    tag.className = 'soon-tag'; tag.textContent = 'soon';
    btn.appendChild(tag);
  }
  btn.addEventListener('click', () => {
    if (!b.ready) { say(b.name + ' is coming soon 😈'); return; }
    chosen = b.id; tool = 'place';
    refreshButtons();
  });
  palette.appendChild(btn);
  icons.push({ id:b.id, cv });
});

function drawIcons(time) {
  icons.forEach(({ id, cv }) => {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 80, 80);
    if (id === 'hero') drawHero(c, 18, 30, 44);
    else drawBlock(c, id, 8, 8, 64, time);
    if (!['tile', 'hero', 'door', 'spike', 'portal'].includes(id)) {
      c.fillStyle = '#ff8a94'; c.font = 'bold 40px Nunito'; c.textAlign = 'center';
      c.fillText('?', 40, 54);
    }
  });
}

document.querySelectorAll('.tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('soon')) { say(btn.textContent.slice(2).trim() + ' is coming soon 😈'); return; }
    tool = btn.dataset.tool;
    refreshButtons();
  });
});
function refreshButtons() {
  document.querySelectorAll('.block').forEach(b =>
    b.classList.toggle('on', tool === 'place' && b.dataset.id === chosen));
  document.querySelectorAll('.tool[data-tool]').forEach(b =>
    b.classList.toggle('on', tool === b.dataset.tool));
}

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear the whole level?')) return;
  grid = emptyGrid(); save();
});

/* ---------- the level canvas ---------- */
const cv = document.getElementById('level');
const ctx = cv.getContext('2d');
const wrap = document.getElementById('stageWrap');
let cell = 30, hover = null, painting = false;

function fit() {
  const r = wrap.getBoundingClientRect();
  const testing = document.body.classList.contains('testing');
  const padX = testing ? 0 : 32, padY = testing ? 0 : 86;
  cell = Math.max(10, Math.floor(Math.min((r.width - padX) / T.cols, (r.height - padY) / T.rows)));
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = cell * T.cols + 'px';
  cv.style.height = cell * T.rows + 'px';
  cv.width = cell * T.cols * dpr;
  cv.height = cell * T.rows * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fit);

function cellAt(e) {
  const r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / cell), y = Math.floor((e.clientY - r.top) / cell);
  return (x >= 0 && y >= 0 && x < T.cols && y < T.rows) ? { x, y } : null;
}
function paint(at) {
  if (!at || play || chomp) return;
  if (tool === 'erase') { grid[at.y][at.x] = null; save(); return; }
  if (tool !== 'place') return;
  if (ONLY_ONE.includes(chosen)) {
    const old = find(chosen);
    if (old) grid[old.y][old.x] = null;
  }
  grid[at.y][at.x] = { t:chosen };
  save();
}
cv.addEventListener('pointerdown', e => {
  painting = true; cv.setPointerCapture(e.pointerId); paint(cellAt(e));
});
cv.addEventListener('pointermove', e => {
  hover = cellAt(e);
  if (painting && !ONLY_ONE.includes(chosen)) paint(hover);
});
cv.addEventListener('pointerup', () => { painting = false; });
cv.addEventListener('pointerleave', () => { hover = null; });

/* ---------- TEST: play your own level ---------- */
const testBtn = document.getElementById('testBtn');
const deathsEl = document.getElementById('deaths');
const keys = {};
let play = null, deaths = 0, bits = [];

addEventListener('keydown', e => {
  if (play && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (play && e.code === 'Escape') stopTest();
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
testBtn.addEventListener('click', () => { play ? stopTest() : startTest(); testBtn.blur(); });

function startTest() {
  if (chomp) return;
  if (!find('hero')) { say('Put a Hero in first 😈'); return; }
  // the devil closes his mouth over the creator, and opens it onto your level
  startChomp(() => {
    deaths = 0;
    deathsEl.textContent = '💀 0';
    spawn();
    play.state = 'intro';         // nothing moves until his mouth is open
    document.body.classList.add('testing');
    fit();
  }, () => { if (play) play.state = 'play'; });
}
function spawn() {
  const h = find('hero');
  play = { x:h.x + (1 - T.hero) / 2, y:h.y + 1 - T.hero, vx:0, vy:0,
           ground:false, state:'play', timer:0, face:1 };
}
function stopTest() {
  if (chomp) return;
  // and the same on the way back: he closes over the level and opens onto the creator
  startChomp(() => {
    play = null; bits = [];
    deathsEl.textContent = '';
    document.body.classList.remove('testing');
    fit();
  });
}
document.getElementById('editBtn').addEventListener('click', e => { stopTest(); e.target.blur(); });
document.getElementById('restartBtn').addEventListener('click', e => {
  if (play && !chomp) spawn();
  e.target.blur();
});

/* ---------- the devil's mouth: closes, blinks, opens. Whatever is behind it changes while it's shut ---------- */
const mouth = document.getElementById('mouth');
const mctx = mouth.getContext('2d');
const CHOMP = { close:0.4, blinkOff:0.65, blinkOn:0.8, open:1.0, done:1.55 };
let chomp = null;

function startChomp(whenShut, whenOpen) {
  chomp = { t:0, whenShut, whenOpen, shut:false };
  sizeMouth();
  mouth.style.display = 'block';
}
function chompStep(dt) {
  chomp.t += dt;
  if (!chomp.shut && chomp.t >= CHOMP.close) {
    chomp.shut = true;
    if (chomp.whenShut) chomp.whenShut();
  }
  drawMouth(chomp.t);
  if (chomp.t > CHOMP.done) {
    const whenOpen = chomp.whenOpen;
    chomp = null;
    mouth.style.display = 'none';
    if (whenOpen) whenOpen();
  }
}

function sizeMouth() {
  const dpr = window.devicePixelRatio || 1;
  mouth.width = innerWidth * dpr;
  mouth.height = innerHeight * dpr;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawMouth(t) {
  const W = innerWidth, H = innerHeight, c = mctx;
  c.clearRect(0, 0, W, H);
  const tooth = Math.max(40, W / 22), toothH = tooth * .9;
  const wide = H / 2 + toothH;              // jaws this far apart = off the screen
  let gap = 0;
  if (t < CHOMP.close) {                    // closing: slow, then SNAP shut
    const k = t / CHOMP.close;
    gap = (1 - k * k) * wide;
  } else if (t > CHOMP.open) {              // opening: slow, then the jaws fly apart
    const k = Math.min(1, (t - CHOMP.open) / (CHOMP.done - CHOMP.open));
    gap = k * k * wide;
  }
  const mid = H / 2;

  // the two halves of the face
  c.fillStyle = '#3a000c';
  c.fillRect(0, 0, W, mid - gap);
  c.fillRect(0, mid + gap, W, H - mid - gap);

  // the eyes sit on the top half and go up with it
  const eyesOn = t < CHOMP.blinkOff || t > CHOMP.blinkOn;
  if (eyesOn) {
    const ey = H * .26 - gap, ew = W * .13, eh = ew * .55;
    [W * .32, W * .68].forEach((ex, i) => {
      c.save();
      c.translate(ex, ey);
      c.scale(i ? -1 : 1, 1);                 // the right eye is the left one flipped
      c.shadowColor = '#ff2a3d'; c.shadowBlur = 30;
      c.fillStyle = '#ff2a3d';
      c.beginPath();                          // an angry eye: flat bottom, slanted top
      c.moveTo(-ew / 2, -eh * .25);
      c.lineTo(ew / 2, eh * .35);
      c.quadraticCurveTo(ew / 2, eh, 0, eh);
      c.quadraticCurveTo(-ew / 2, eh, -ew / 2, -eh * .25);
      c.fill();
      c.restore();
    });
  }

  // white fangs on the edge of each jaw, biting together in the middle
  {
    c.fillStyle = '#f2f2f2';
    for (let x = -tooth; x < W + tooth; x += tooth) {
      c.beginPath();                          // top teeth point down
      c.moveTo(x, mid - gap);
      c.lineTo(x + tooth / 2, mid - gap + toothH);
      c.lineTo(x + tooth, mid - gap);
      c.fill();
      const bx = x + tooth / 2;               // bottom teeth sit in the gaps
      c.beginPath();
      c.moveTo(bx, mid + gap);
      c.lineTo(bx + tooth / 2, mid + gap - toothH);
      c.lineTo(bx + tooth, mid + gap);
      c.fill();
    }
  }
}
window.addEventListener('resize', sizeMouth);

function solid(x, y) {
  if (x < 0 || x >= T.cols || y < 0 || y >= T.rows) return false;
  const c = grid[y][x];
  return !!c && props(c).collision;
}
function eachCell(x, y, w, h, fn) {
  for (let cy = Math.floor(y); cy <= Math.floor(y + h - 1e-6); cy++)
    for (let cx = Math.floor(x); cx <= Math.floor(x + w - 1e-6); cx++) fn(cx, cy);
}
function boxesTouch(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function step(dt) {
  const p = play, S = T.hero;
  if (p.state === 'intro') return;
  if (p.state === 'dead') {
    p.timer -= dt;
    if (p.timer <= 0) spawn();
    return;
  }
  if (p.state === 'won') {
    p.wonT += dt;
    if (p.wonT > DOOR.shut + DOOR.sink + 0.3) stopTest();   // Jos: no LEVEL COMPLETE message
    return;
  }
  const left  = keys.ArrowLeft || keys.KeyA;
  const right = keys.ArrowRight || keys.KeyD;
  const up    = keys.ArrowUp || keys.Space || keys.KeyW;

  p.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * T.speed;
  if (p.vx) p.face = Math.sign(p.vx);
  if (up && p.ground) { p.vy = -T.jump; p.ground = false; }
  if (!up && p.vy < -T.jump * .4) p.vy = -T.jump * .4;   // let go early = smaller jump
  p.vy = Math.min(p.vy + T.gravity * dt, T.maxFall);

  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(T.cols - S, p.x));
  eachCell(p.x, p.y, S, S, (cx, cy) => {
    if (!solid(cx, cy)) return;
    if (p.vx > 0) p.x = cx - S;
    else if (p.vx < 0) p.x = cx + 1;
  });

  p.y += p.vy * dt;
  p.ground = false;
  if (p.y < 0) { p.y = 0; p.vy = 0; }
  eachCell(p.x, p.y, S, S, (cx, cy) => {
    if (!solid(cx, cy)) return;
    if (p.vy > 0) { p.y = cy - S; p.vy = 0; p.ground = true; }
    else if (p.vy < 0) { p.y = cy + 1; p.vy = 0; }
  });

  if (p.y > T.rows + 1) { die(); return; }

  eachCell(p.x, p.y, S, S, (cx, cy) => {
    if (p.state !== 'play' || cx < 0 || cy < 0 || cx >= T.cols || cy >= T.rows) return;
    const c = grid[cy][cx];
    if (!c) return;
    if (props(c).deadly) {
      // a spike only gets you if you touch the pointy part
      const hit = c.t === 'spike'
        ? boxesTouch(p.x, p.y, S, S, cx + .12, cy + .45, .76, .55)
        : true;
      if (hit) die();
    } else if (c.t === 'door' && boxesTouch(p.x, p.y, S, S, cx + .2, cy + .2, .6, .8)) {
      // pulled into the middle of the door
      p.state = 'won'; p.wonT = 0; p.door = { x:cx, y:cy };
      p.x = cx + (1 - S) / 2; p.y = cy + 1 - S; p.vx = p.vy = 0;
    }
  });
}

function die() {
  const p = play;
  p.state = 'dead'; p.timer = T.respawn;
  deaths++;
  deathsEl.textContent = '💀 ' + deaths;
  for (let k = 0; k < 12; k++) {
    bits.push({ x:p.x + T.hero / 2, y:p.y + T.hero / 2,
                vx:(Math.random() - .5) * 10, vy:-4 - Math.random() * 8, life:.9 });
  }
}

/* ---------- draw everything, every frame ---------- */
function render(time) {
  const W = cell * T.cols, H = cell * T.rows;
  ctx.fillStyle = '#12000a'; ctx.fillRect(0, 0, W, H);

  if (!play) {                                   // faint grid while you build
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < T.cols; x++) { ctx.moveTo(x * cell + .5, 0); ctx.lineTo(x * cell + .5, H); }
    for (let y = 1; y < T.rows; y++) { ctx.moveTo(0, y * cell + .5); ctx.lineTo(W, y * cell + .5); }
    ctx.stroke();
  }

  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++) {
      const c = grid[y][x];
      if (!c) continue;
      if (play && c.t === 'hero') continue;      // the real hero is the moving one
      if (play && play.state === 'won' && c.t === 'door') {
        drawDoorClosing(ctx, x * cell, y * cell, cell, play.wonT,
          () => drawHero(ctx, play.x * cell, play.y * cell, T.hero * cell));
        continue;
      }
      drawBlock(ctx, c.t, x * cell, y * cell, cell, time, x, y);
    }

  if (!play && hover) {                          // preview where the block will go
    const hx = hover.x * cell, hy = hover.y * cell;
    if (tool === 'erase') {
      ctx.strokeStyle = '#ff2a3d'; ctx.lineWidth = 2; ctx.strokeRect(hx + 1, hy + 1, cell - 2, cell - 2);
    } else if (tool === 'place') {
      ctx.globalAlpha = .45; drawBlock(ctx, chosen, hx, hy, cell, time); ctx.globalAlpha = 1;
    }
  }

  if (play && (play.state === 'play' || play.state === 'intro')) {
    drawHero(ctx, play.x * cell, play.y * cell, T.hero * cell);
  }
  ctx.fillStyle = '#ff4d5e';
  bits.forEach(b => {
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillRect(b.x * cell - cell * .1, b.y * cell - cell * .1, cell * .2, cell * .2);
  });
  ctx.globalAlpha = 1;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  const time = now / 1000;
  if (play) step(dt);
  if (chomp) chompStep(dt);
  bits = bits.filter(b => {
    b.life -= dt; b.vy += T.gravity * .6 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    return b.life > 0;
  });
  render(time);
  drawIcons(time);
  requestAnimationFrame(loop);
}

/* ---------- messages ---------- */
const toast = document.getElementById('toast');
let toastTimer;
function say(msg, win) {
  toast.textContent = msg;
  toast.classList.toggle('win', !!win);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------- start ---------- */
load();
if (!find('hero') && !grid.some(r => r.some(Boolean))) {
  // a brand-new level starts with a floor, the hero and the door, so TEST works straight away
  for (let x = 0; x < T.cols; x++) grid[T.rows - 1][x] = { t:'tile' };
  grid[T.rows - 2][1] = { t:'hero' };
  grid[T.rows - 2][T.cols - 2] = { t:'door' };
}
refreshButtons();
fit();
requestAnimationFrame(loop);
