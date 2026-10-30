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
  heroW:      0.36,  // how wide the hero is, in blocks
  heroH:      0.8,   // how tall the hero is, in blocks
  stride:     0.1,   // seconds per step of his running legs
  respawn:    0.6,   // seconds before he tries again
  springBoot: 22,    // how hard a spring boots you up
  sawSpin:    8,     // how fast a sawblade spins
  portalFlip: 0.30   // Jos: the portal switches colours every 0.30 seconds
};

/* Jos's list of blocks, in his order */
const BLOCKS = [
  { id:'tile',       name:'Tile',          ready:true },
  { id:'hero',       name:'Hero',          ready:true },
  { id:'door',       name:'Door',          ready:true },
  { id:'spike',      name:'Spike',         ready:true },
  { id:'smallspike', name:'Small spike',   ready:true },
  { id:'sawblade',   name:'Sawblade',      ready:true },
  { id:'spring',     name:'Spring',        ready:true },
  { id:'coin',       name:'Coin',          ready:true },
  { id:'oneway',     name:'One way',       ready:true },
  { id:'portal',     name:'Portal',        ready:true },
  { id:'trigger',    name:'Trigger',       ready:true },
  { id:'button',     name:'Button',        ready:true },
  { id:'controls',   name:'Edit controls', ready:true }
];
const NAME = {};
BLOCKS.forEach(b => { NAME[b.id] = b.name; });

/* what each block does, until Block properties lets you change it.
   action = Jos's "Do action" switch: a spring boots you, a coin collects. */
const DEFAULTS = {
  tile:       { collision:true,  deadly:false },
  spike:      { collision:false, deadly:true  },
  smallspike: { collision:false, deadly:true  },
  sawblade:   { collision:false, deadly:true  },
  spring:     { collision:false, deadly:false, action:true },
  coin:       { collision:false, deadly:false, action:true },
  trigger:    { visible:false, action:true },   // Jos: invisible when you play, like G-dash
  controls:   { visible:false, action:true },   // Jos: like the trigger, but it changes the controls
  button:     { collision:false, deadly:false, action:true },
  portal:     { collision:false, deadly:false, action:true }
};
/* the part of a deadly block that actually gets you, inside its square: x, y, width, height */
const HITBOX = {
  spike:      [.06, .68, .88, .32],
  smallspike: [.32, .7,  .36, .3]
};
const ONLY_ONE = ['hero', 'door'];   // placing another one moves it

/* the normal controls. An Edit controls block swaps these for its own when you touch it.
   Jos: keys don't all have to be different, and the hero can be set to always go one way
   (auto: -1 = always left, 1 = always right). */
const CONTROLS = { left:['ArrowLeft', 'KeyA'], right:['ArrowRight', 'KeyD'],
                   up:['ArrowUp', 'Space', 'KeyW'], auto:0 };

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
  return Object.assign({ collision:false, deadly:false, visible:true, action:false },
                       DEFAULTS[cell.t] || {}, cell.p || {});
}
function find(type) {
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++)
      if (grid[y][x] && grid[y][x].t === type) return { x, y };
  return null;
}

/* ---------- drawing the blocks ----------
   Every block is Jos's own picture, in LDLC's colours. x, y = top-left corner, s = block size. */
const COL = {
  tile:'#ff2a3d', metal:'#ececf2', metalDark:'#9a9aa8', gold:'#ffd23f',
  doorIn:'#5a3d00', green:'#5dff8a', brown:'#9a6233', brownDark:'#5e3a1c'
};

/* Jos: a tile is a plain solid block. Tiles that touch join into one. */
function drawTile(c, x, y, s) {
  c.fillStyle = COL.tile;
  c.fillRect(x, y, s + .5, s + .5);           // the extra half pixel stops hairlines between tiles
}
function drawSpikes(c, x, y, s, count, w, h) {
  c.fillStyle = COL.metal;
  const total = w * s, left = x + (s - total) / 2, each = total / count;
  c.fillRect(left, y + s - s * .06, total, s * .06);          // the little base
  for (let i = 0; i < count; i++) {
    c.beginPath();
    c.moveTo(left + i * each, y + s);
    c.lineTo(left + i * each + each / 2, y + s - h * s);
    c.lineTo(left + (i + 1) * each, y + s);
    c.fill();
  }
}
const drawSpike      = (c, x, y, s) => drawSpikes(c, x, y, s, 3, .94, .32);  // Jos: shorter
const drawSmallSpike = (c, x, y, s) => drawSpikes(c, x, y, s, 1, .4,  .3);
function drawSaw(c, x, y, s, time) {
  /* Jos's sawblade: a big round blade with a square hole. It really spins. */
  const r = s * .46;
  c.save();
  c.translate(x + s / 2, y + s / 2);
  c.rotate(time * T.sawSpin);
  c.fillStyle = COL.metal;
  c.beginPath();
  const teeth = 12;
  for (let i = 0; i < teeth; i++) {          // little hooked teeth, so you can see it turning
    const a = i / teeth * Math.PI * 2, b = (i + .7) / teeth * Math.PI * 2;
    c.lineTo(Math.cos(a) * r * .86, Math.sin(a) * r * .86);
    c.lineTo(Math.cos(b) * r, Math.sin(b) * r);
  }
  c.closePath(); c.fill();
  c.strokeStyle = COL.metalDark; c.lineWidth = Math.max(1, s * .04);
  c.beginPath(); c.arc(0, 0, r * .55, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#12000a';
  c.fillRect(-s * .07, -s * .07, s * .14, s * .14);
  c.restore();
}
function drawSpring(c, x, y, s, ext) {
  /* Jos's spring: a flat slab on a little bar. When you land on it the bar shoots up
     (ext goes 0 → 1) and boots you. */
  const slabW = s * .84, slabH = s * .1, barW = s * .26;
  const restTop = y + s * .8, upTop = y + s * .25;
  const top = restTop - (restTop - upTop) * (ext || 0);
  c.fillStyle = COL.metalDark;
  c.fillRect(x + (s - barW) / 2, top + slabH, barW, y + s - top - slabH);
  c.fillStyle = COL.gold;
  roundRect(c, x + (s - slabW) / 2, top, slabW, slabH, slabH * .4); c.fill();
}
function drawCoin(c, x, y, s, time) {
  const r = s * .2, squish = Math.max(.18, Math.abs(Math.cos(time * 3)));
  c.save();
  c.translate(x + s / 2, y + s / 2);
  c.scale(squish, 1);                        // turning round and round
  c.fillStyle = COL.gold;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff3b0';
  c.beginPath(); c.arc(-r * .3, -r * .3, r * .3, 0, Math.PI * 2); c.fill();
  c.restore();
}
function drawOneWay(c, x, y, s) {
  /* Jos: three short dashes along the top. Jump up through it, land on top of it. */
  c.fillStyle = COL.metal;
  const w = s * .26, gap = (s - 3 * w) / 4;
  for (let i = 0; i < 3; i++) c.fillRect(x + gap + i * (w + gap), y + s * .1, w, s * .1);
}
function drawTrigger(c, x, y, s) {
  /* green square with a black "!" — only in the creator, never when you play */
  c.fillStyle = COL.green;
  roundRect(c, x + s * .08, y + s * .08, s * .84, s * .84, s * .12); c.fill();
  c.fillStyle = '#000';
  c.beginPath();
  c.moveTo(x + s * .38, y + s * .2); c.lineTo(x + s * .62, y + s * .2);
  c.lineTo(x + s * .54, y + s * .6); c.lineTo(x + s * .46, y + s * .6);
  c.fill();
  c.fillRect(x + s * .44, y + s * .67, s * .12, s * .12);
}
function drawControls(c, x, y, s) {
  /* Jos: like the trigger, but with left, right, up and down arrows instead of the "!" */
  c.fillStyle = COL.green;
  roundRect(c, x + s * .08, y + s * .08, s * .84, s * .84, s * .12); c.fill();
  c.fillStyle = '#000';
  const m = .5, a = .13, d = .3;            // middle, arrow size, how far out each arrow sits
  const tri = (x1, y1, x2, y2, x3, y3) => {
    c.beginPath();
    c.moveTo(x + s * x1, y + s * y1); c.lineTo(x + s * x2, y + s * y2); c.lineTo(x + s * x3, y + s * y3);
    c.fill();
  };
  tri(m, m - d, m - a, m - d + a, m + a, m - d + a);   // up
  tri(m, m + d, m - a, m + d - a, m + a, m + d - a);   // down
  tri(m - d, m, m - d + a, m - a, m - d + a, m + a);   // left
  tri(m + d, m, m + d - a, m - a, m + d - a, m + a);   // right
}
function drawButton(c, x, y, s) {
  /* Jos's button: a dome on a base. Brown, not green. */
  c.fillStyle = COL.brownDark;
  c.fillRect(x + s * .05, y + s * .9, s * .9, s * .1);
  c.fillStyle = COL.brown;
  c.beginPath();
  c.moveTo(x + s * .14, y + s * .9);
  c.quadraticCurveTo(x + s * .18, y + s * .58, x + s * .5, y + s * .58);
  c.quadraticCurveTo(x + s * .82, y + s * .58, x + s * .86, y + s * .9);
  c.fill();
}
function doorPath(c, x, y, s) {
  /* Jos's door: a tall doorway with rounded top corners */
  const w = s * .82, h = s * .96, dx = x + (s - w) / 2, dy = y + s - h, r = w * .22;
  c.beginPath();
  c.moveTo(dx, y + s);
  c.lineTo(dx, dy + r);
  c.arcTo(dx, dy, dx + r, dy, r);
  c.lineTo(dx + w - r, dy);
  c.arcTo(dx + w, dy, dx + w, dy + r, r);
  c.lineTo(dx + w, y + s);
  return { w, h, dx, dy };
}
function drawDoor(c, x, y, s) {
  c.fillStyle = COL.doorIn;
  c.strokeStyle = COL.gold;
  c.lineWidth = Math.max(2, s * .12);
  doorPath(c, x, y, s);
  c.fill(); c.stroke();
}
/* Jos's door: it pulls you into the middle, a shutter comes down over you,
   then the whole door sinks into the ground. t = seconds since you touched it. */
const DOOR = { shut:0.35, sink:0.5 };
function drawDoorClosing(c, x, y, s, t, heroDraw) {
  const down = Math.max(0, Math.min(1, (t - DOOR.shut) / DOOR.sink)) * s;
  c.save();
  c.beginPath(); c.rect(x - s, y - s, s * 3, s * 2); c.clip();   // nothing shows below the ground
  c.translate(0, down);
  c.fillStyle = COL.doorIn;
  const { w, h, dx, dy } = doorPath(c, x, y, s);
  c.fill();
  heroDraw();
  const f = Math.min(1, t / DOOR.shut);                          // the shutter coming down
  c.save();
  doorPath(c, x, y, s); c.clip();
  c.fillStyle = COL.gold; c.strokeStyle = COL.gold;
  c.fillRect(dx, dy, w, h * f * .25 + 1);
  c.lineWidth = Math.max(1.5, s * .06);
  for (let i = 1; i < 4; i++) {
    const bx = dx + w * i / 4;
    c.beginPath(); c.moveTo(bx, dy); c.lineTo(bx, dy + h * f); c.stroke();
  }
  c.restore();
  c.strokeStyle = COL.gold; c.lineWidth = Math.max(2, s * .12);
  doorPath(c, x, y, s); c.stroke();
  c.restore();
}
function drawHero(c, x, y, h, face, frame) {
  /* Jos's hero: a little blocky person — head, body, two legs — with tiny devil horns.
     frame 0 = legs together, frame 1 = legs wide apart (running, like Jos's video).
     x, y = top-left of his box, h = how tall he is. */
  const u = h / 23, w = 9 * u, f = face || 1;
  c.save();
  c.translate(x + w / 2, y);
  c.scale(f, 1);                              // face the way he's going
  const drop = frame ? u : 0;                 // he dips a bit mid-stride
  c.fillStyle = COL.tile;                     // horns
  c.beginPath();
  c.moveTo(-2.5 * u, drop + u);     c.lineTo(-2 * u, drop - 1.5 * u); c.lineTo(-1 * u, drop + u);
  c.moveTo(1 * u, drop + u);        c.lineTo(2 * u, drop - 1.5 * u);  c.lineTo(2.5 * u, drop + u);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-2.5 * u, drop, 5 * u, 5 * u);   // head
  c.fillRect(-4.5 * u, drop + 5 * u, 9 * u, 13 * u);   // body
  if (frame) {                                // legs wide apart
    c.fillRect(-6.5 * u, 18 * u, 4 * u, 5 * u);
    c.fillRect(2.5 * u, 18 * u, 4 * u, 5 * u);
  } else {                                    // legs together
    c.fillRect(-4.5 * u, 18 * u, 3.5 * u, 5 * u);
    c.fillRect(1 * u, 18 * u, 3.5 * u, 5 * u);
  }
  c.fillStyle = '#12000a';                    // one eye, looking where he's going
  c.fillRect(.5 * u, drop + 1.5 * u, 1.3 * u, 1.6 * u);
  c.restore();
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
function drawBlock(c, type, x, y, s, time) {
  if (type === 'tile') drawTile(c, x, y, s);
  else if (type === 'spike') drawSpike(c, x, y, s);
  else if (type === 'smallspike') drawSmallSpike(c, x, y, s);
  else if (type === 'sawblade') drawSaw(c, x, y, s, time);
  else if (type === 'spring') drawSpring(c, x, y, s, 0);
  else if (type === 'coin') drawCoin(c, x, y, s, time);
  else if (type === 'oneway') drawOneWay(c, x, y, s);
  else if (type === 'trigger') drawTrigger(c, x, y, s);
  else if (type === 'controls') drawControls(c, x, y, s);
  else if (type === 'button') drawButton(c, x, y, s);
  else if (type === 'door') drawDoor(c, x, y, s);
  else if (type === 'portal') drawPortal(c, x, y, s, time);
  else if (type === 'hero') {
    const h = s * T.heroH;
    drawHero(c, x + (s - h * 9 / 23) / 2, y + s - h, h, 1, 0);
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
    if (id === 'hero') drawHero(c, 31, 12, 60, 1, Math.floor(time / .25) % 2);   // running on the spot
    else drawBlock(c, id, 8, 8, 64, time);
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
  // every try starts fresh: coins come back, springs settle
  const h = find('hero');
  play = { x:h.x + (1 - T.heroW) / 2, y:h.y + 1 - T.heroH, vx:0, vy:0,
           ground:false, state:'play', timer:0, face:1, walkT:0,
           got:{}, coins:0, springs:{} };
  coinsEl.textContent = '🪙 0';
}

const coinsEl = document.getElementById('coins');
const coinSound = new Audio('sounds/coin.wav');   // Jos's coin sound
function playCoin() {
  try { const s = coinSound.cloneNode(); s.play().catch(() => {}); } catch (e) {}
}
function stopTest() {
  if (chomp) return;
  // and the same on the way back: he closes over the level and opens onto the creator
  startChomp(() => {
    play = null; bits = [];
    deathsEl.textContent = '';
    coinsEl.textContent = '';
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
  const p = play, W = T.heroW, H = T.heroH;
  // springs settle back down after they boot you
  for (const k in p.springs) { p.springs[k] += dt; if (p.springs[k] > .5) delete p.springs[k]; }
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
  const ctl = p.controls || CONTROLS;
  const held  = list => list.some(k => keys[k]);
  const left  = held(ctl.left);
  const right = held(ctl.right);
  const up    = held(ctl.up);

  p.vx = (ctl.auto || ((right ? 1 : 0) - (left ? 1 : 0))) * T.speed;
  if (p.vx) p.face = Math.sign(p.vx);
  if (up && p.ground) { p.vy = -T.jump; p.ground = false; p.booted = false; }
  if (!up && !p.booted && p.vy < -T.jump * .4) p.vy = -T.jump * .4;   // let go early = smaller jump
  p.vy = Math.min(p.vy + T.gravity * dt, T.maxFall);
  p.walkT = (p.vx && p.ground) ? p.walkT + dt : 0;

  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(T.cols - W, p.x));
  eachCell(p.x, p.y, W, H, (cx, cy) => {
    if (!solid(cx, cy)) return;
    if (p.vx > 0) p.x = cx - W;
    else if (p.vx < 0) p.x = cx + 1;
  });

  const oldBottom = p.y + H;
  p.y += p.vy * dt;
  p.ground = false;
  if (p.y < 0) { p.y = 0; p.vy = 0; }
  eachCell(p.x, p.y, W, H, (cx, cy) => {
    if (!solid(cx, cy)) return;
    if (p.vy > 0) { p.y = cy - H; p.vy = 0; p.ground = true; }
    else if (p.vy < 0) { p.y = cy + 1; p.vy = 0; }
  });

  // one way: you only land on it coming down from above
  if (p.vy >= 0) {
    eachCell(p.x, p.y, W, H, (cx, cy) => {
      const c = at(cx, cy);
      if (!c || c.t !== 'oneway') return;
      const top = cy + .1;
      if (oldBottom <= top + .01 && p.y + H >= top) {
        p.y = top - H; p.vy = 0; p.ground = true;
      }
    });
  }

  if (p.y > T.rows + 1) { die(); return; }

  eachCell(p.x, p.y, W, H, (cx, cy) => {
    if (p.state !== 'play') return;
    const c = at(cx, cy);
    if (!c) return;
    const pr = props(c), key = cx + ',' + cy;

    if (pr.deadly) {
      let hit;
      if (c.t === 'sawblade') {                   // round blade: only the circle gets you
        const nx = Math.max(p.x, Math.min(cx + .5, p.x + W));
        const ny = Math.max(p.y, Math.min(cy + .5, p.y + H));
        hit = Math.hypot(nx - cx - .5, ny - cy - .5) < .42;
      } else if (HITBOX[c.t]) {                   // a spike only gets you on the pointy part
        const [bx, by, bw, bh] = HITBOX[c.t];
        hit = boxesTouch(p.x, p.y, W, H, cx + bx, cy + by, bw, bh);
      } else hit = true;
      if (hit) { die(); return; }
    }

    if (c.t === 'spring' && pr.action && p.vy >= 0 && p.y + H > cy + .75) {
      // land on the slab: the bar shoots up and boots you
      p.vy = -T.springBoot; p.ground = false; p.booted = true;
      p.springs[key] = 0;
    }

    if (c.t === 'coin' && pr.action && !p.got[key] &&
        boxesTouch(p.x, p.y, W, H, cx + .3, cy + .3, .4, .4)) {
      p.got[key] = true;
      p.coins++;
      coinsEl.textContent = '🪙 ' + p.coins;
      playCoin();
      for (let k = 0; k < 8; k++) {
        bits.push({ x:cx + .5, y:cy + .5, vx:(Math.random() - .5) * 6, vy:-3 - Math.random() * 4,
                    life:.5, col:COL.gold });
      }
    }

    if (c.t === 'controls' && pr.action) {
      // touching an Edit controls block swaps in its controls (set in Block properties)
      p.controls = Object.assign({}, CONTROLS, c.controls || {});
    }

    if (c.t === 'door' && boxesTouch(p.x, p.y, W, H, cx + .2, cy + .2, .6, .8)) {
      // pulled into the middle of the door
      p.state = 'won'; p.wonT = 0; p.door = { x:cx, y:cy };
      p.x = cx + (1 - W) / 2; p.y = cy + 1 - H; p.vx = p.vy = 0;
    }
  });
}
function at(x, y) {
  return (x < 0 || y < 0 || x >= T.cols || y >= T.rows) ? null : grid[y][x];
}

function die() {
  const p = play;
  p.state = 'dead'; p.timer = T.respawn;
  deaths++;
  deathsEl.textContent = '💀 ' + deaths;
  for (let k = 0; k < 12; k++) {
    bits.push({ x:p.x + T.heroW / 2, y:p.y + T.heroH / 2,
                vx:(Math.random() - .5) * 10, vy:-4 - Math.random() * 8, life:.9, col:'#fff' });
  }
}

/* ---------- draw everything, every frame ---------- */
function heroNow() {
  const p = play, h = T.heroH * cell;
  const frame = !p.ground ? 1 : (p.walkT ? Math.floor(p.walkT / T.stride) % 2 : 0);
  drawHero(ctx, p.x * cell, p.y * cell, h, p.face, frame);
}
function springExt(t) {
  if (t === undefined) return 0;
  if (t < .06) return t / .06;        // shoots up
  if (t < .16) return 1;              // holds
  return Math.max(0, 1 - (t - .16) / .3);   // settles back
}
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
      const key = x + ',' + y;
      if (play) {
        if (c.t === 'hero') continue;            // the real hero is the moving one
        if (!props(c).visible) continue;         // triggers can't be seen when you play
        if (c.t === 'coin' && play.got[key]) continue;
        if (c.t === 'spring') { drawSpring(ctx, x * cell, y * cell, cell, springExt(play.springs[key])); continue; }
        if (play.state === 'won' && c.t === 'door') {
          drawDoorClosing(ctx, x * cell, y * cell, cell, play.wonT, heroNow);
          continue;
        }
      }
      drawBlock(ctx, c.t, x * cell, y * cell, cell, time);
    }

  if (!play && hover) {                          // preview where the block will go
    const hx = hover.x * cell, hy = hover.y * cell;
    if (tool === 'erase') {
      ctx.strokeStyle = '#ff2a3d'; ctx.lineWidth = 2; ctx.strokeRect(hx + 1, hy + 1, cell - 2, cell - 2);
    } else if (tool === 'place') {
      ctx.globalAlpha = .45; drawBlock(ctx, chosen, hx, hy, cell, time); ctx.globalAlpha = 1;
    }
  }

  if (play && (play.state === 'play' || play.state === 'intro')) heroNow();
  bits.forEach(b => {
    ctx.fillStyle = b.col || '#fff';
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillRect(b.x * cell - cell * .08, b.y * cell - cell * .08, cell * .16, cell * .16);
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
