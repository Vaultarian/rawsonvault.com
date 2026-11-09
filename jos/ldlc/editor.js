/* ===== LDLC — Level Devil Level Creator: the editor =====
   Jos's design is in DESIGN.md. Blocks marked ready:true work; the rest are on his list
   and get built one at a time. */
'use strict';

/* ---------- numbers to tweak ---------- */
const T = {
  cols:       32,    // how wide a level is, in blocks
  rows:       18,    // how tall a level is, in blocks
  speed:      7,     // how fast the hero runs, blocks per second
  jump:       2,     // Jos: how high he jumps, in blocks. Every jump goes exactly this high
  gravity:    45,    // how fast he falls
  maxFall:    22,    // the fastest he can fall
  heroW:      0.36,  // how wide the hero is, in blocks
  heroH:      0.8,   // how tall the hero is, in blocks
  stride:     0.1,   // seconds per step of his running legs
  respawn:    0.6,   // seconds before he tries again
  knockSlow:  30,    // how fast a sideways knock dies away
  portalSpit: 12,    // how hard a portal spits you out of its Output side
  sawSpin:    8,     // how fast a sawblade spins
  moveSpeed:  .22,   // Movement speed 1 = 0.22 blocks a second, measured from Jos's recording
  portalFlip: 0.30,  // Jos: the portal switches colours every 0.30 seconds
  pickSwap:   0.9,   // two blocks in one square: keep the mouse still this long and it picks the other
  dash:       14     // Jos's dash orb: how fast it shoots you, blocks per second
};

/* Jos's list of blocks, in his order */
const JUMP_H = T.jump;   // the normal jump: 2 blocks high

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
  { id:'controls',   name:'Edit controls', ready:true },
  { id:'dashorb',    name:'Dash orb',      ready:true },   // Jos: the green dash orb from Geometry Dash
  { id:'ball',       name:'Ball',          ready:true },   // Jos (8 Nov): like a sawblade that doesn't spin
  { id:'hill',       name:'Hill',          ready:true },   // Jos (8 Nov): a slope the ball rolls down
  { id:'camera',     name:'Camera position', ready:true }, // Jos (8 Nov): moves the camera when the hero touches it
  { id:'repeater',   name:'Repeating trigger', ready:true }, // Jos (8 Nov): a trigger whose steps repeat over and over
  { id:'startpos',   name:'Start pos',     ready:true }    // Jos: an editor command, hidden without the secret word
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
  spring:     { collision:false, deadly:false, action:true, strength:5 },   // Jos: strength 5 = boots you 5 blocks
  coin:       { collision:false, deadly:false, action:true, needed:false },
  trigger:    { visible:false, action:true },   // Jos: invisible when you play, like G-dash
  controls:   { visible:false, action:true },   // Jos: like the trigger, but it changes the controls
  button:     { collision:false, deadly:false, action:true },
  portal:     { collision:false, deadly:false, action:true },
  dashorb:    { collision:false, deadly:false, action:true },
  ball:       { collision:false, deadly:false, gravity:false, crush:false, triggers:false },   // Jos: only deadly if you turn it on
  hill:       { collision:true,  deadly:false },
  camera:     { visible:false, action:true },   // Jos: invisible when you play, like the trigger
  repeater:   { visible:false, action:true }    // Jos: invisible when you play, like the trigger
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
                   up:['ArrowUp', 'Space', 'KeyW'], auto:0 };   // (the jump height and speed come from the hero, or from an Edit controls block)

/* ---------- the level ----------
   Jos: every level is kept (levels.js). editor.html?level=L… opens one of them. */
const params = new URLSearchParams(location.search);
// Jos: PLAY (editor.html?play) plays every level you made in a random order. At the end of the
// list it mixes them up again and keeps going. Right-click → Play (editor.html?play=L…) plays just
// that one level, then goes back to My levels.
const playAll = params.has('play'), playOne = params.get('play') || null;
let levelId = params.get('level'), queue = [];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function nextLevel() {
  if (playOne) return LDLC.playable(playOne) ? playOne : null;
  if (!queue.length) {
    queue = shuffle(LDLC.list().map(l => l.id).filter(LDLC.playable));
    if (queue.length > 1 && queue[0] === levelId) queue.push(queue.shift());   // never the same one twice in a row
  }
  return queue.shift();
}
if (playAll) levelId = nextLevel();
if (!levelId) { location.replace(playAll && !playOne ? 'index.html' : 'levels.html'); throw new Error('no level: back to the levels page'); }
if (!playAll) LDLC.ensure(levelId);
/* Jos (8 Nov): every level has its own grid size. A brand-new level asks for it. Older levels were always 32 by 18.
   32 by 18 fits one screen. A bigger level scrolls: the camera follows the hero when you play. */
const SIZE = { minCols:12, maxCols:160, minRows:8, maxRows:90, oneScreen:[32, 18] };
let needSize = false;
function applySize(id) {                        // sets T.cols and T.rows for this level; false = it has no size yet
  const s = LDLC.read(LDLC.key('size', id));
  if (s && s.cols >= SIZE.minCols && s.cols <= SIZE.maxCols && s.rows >= SIZE.minRows && s.rows <= SIZE.maxRows) {
    T.cols = Math.round(s.cols); T.rows = Math.round(s.rows); return true;
  }
  T.cols = SIZE.oneScreen[0]; T.rows = SIZE.oneScreen[1];
  return localStorage.getItem(LDLC.key('level', id)) !== null;      // it has a level but no size: it is an older one
}
function saveSize() { if (playAll) return; try { localStorage.setItem(LDLC.key('size', levelId), JSON.stringify({ cols:T.cols, rows:T.rows })); } catch (e) {} }
needSize = !applySize(levelId) && !playAll;
/* Jos (8 Nov): every level has a difficulty, chosen when you create it.
   Beginner: the beginner guide is on and the advanced commands are off, and there is no Edit controls or Dash orb.
   Regular: the usual blocks, and you can turn the guide or the advanced commands on yourself.
   Advanced: the advanced commands are on, you also get Camera position, Hill and Ball, and you can put down
   more than one Hero and more than one Door (they all do the same). */
let difficulty = 'regular';
const BLOCK_NEEDS = { dashorb:'regular', controls:'regular', ball:'advanced', hill:'advanced', camera:'advanced', repeater:'advanced' };
function blockAllowed(id) {
  const need = BLOCK_NEEDS[id];
  return !need || (need === 'regular' ? difficulty !== 'beginner' : difficulty === 'advanced');
}
const onlyOne = type => ONLY_ONE.includes(type) && difficulty !== 'advanced';   // placing another Hero or Door moves it
function inferDifficulty() {                  // an older level has no difficulty: it is Regular, unless it already has advanced things
  const all = allBlocks().map(f => f.c.t);
  const adv = all.some(t => ['ball', 'hill', 'camera', 'repeater'].includes(t)) || all.filter(t => t === 'hero').length > 1 || all.filter(t => t === 'door').length > 1;
  return adv ? 'advanced' : 'regular';
}
let grid = emptyGrid();

function emptyGrid() {
  return Array.from({ length:T.rows }, () => Array(T.cols).fill(null));
}
function save() {
  fixPortals();
  if (playAll) return;              // PLAY never changes your levels
  try { localStorage.setItem(LDLC.key('level', levelId), JSON.stringify(grid)); } catch (e) {}
  refreshSend();
}
function load() {
  try {
    const g = JSON.parse(localStorage.getItem(LDLC.key('level', levelId)));
    if (Array.isArray(g) && g.length === T.rows && g[0].length === T.cols) grid = g;
  } catch (e) {}
}
function props(cell) {
  return Object.assign({ collision:false, deadly:false, visible:true, action:false, disguise:false },
                       DEFAULTS[cell.t] || {}, cell.p || {});
}
/* Jos: one block can go inside another, like a spring inside the floor.
   A square holds its block, and the block can hold one more inside it (.inner). */
function stackAt(x, y) {
  const c = grid[y][x];
  return c ? (c.inner ? [c, c.inner] : [c]) : [];
}
function allBlocks() {
  const out = [];
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++)
      stackAt(x, y).forEach((c, layer) => out.push({ x, y, c, layer }));
  return out;
}
function takeOut(x, y, id) {        // take one block out of its square (the inner one moves up)
  const c = grid[y][x];
  if (!c) return null;
  if (c.id === id) { grid[y][x] = c.inner || null; delete c.inner; return c; }
  if (c.inner && c.inner.id === id) { const b = c.inner; delete c.inner; return b; }
  return null;
}
function putIn(x, y, b) {           // put a block into a square: on its own, or inside the one there
  if (grid[y][x]) grid[y][x].inner = b; else grid[y][x] = b;
}
function find(type) {
  const f = allBlocks().find(f => f.c.t === type);
  return f ? { x:f.x, y:f.y, c:f.c } : null;
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
function drawBall(c, x, y, s) {
  /* Jos's ball: like the sawblade, but it doesn't spin. A smooth round ball with a ring and a square hole. */
  const r = s * .42, cx = x + s / 2, cy = y + s / 2;
  const g = c.createRadialGradient(cx - r * .35, cy - r * .35, r * .1, cx, cy, r);
  g.addColorStop(0, '#9fd2ff'); g.addColorStop(.5, '#2f8cff'); g.addColorStop(1, '#1556b8');   // Jos: the ball is blue
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#0d3f8f'; c.lineWidth = Math.max(1, s * .04);
  c.beginPath(); c.arc(cx, cy, r * .55, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#12000a'; c.fillRect(cx - s * .07, cy - s * .07, s * .14, s * .14);
}
function drawHill(c, x, y, s) {
  /* Jos's hill: a slope, a block cut corner to corner. Turned 0 it rises to the right. */
  c.fillStyle = COL.tile;
  c.beginPath(); c.moveTo(x, y + s + .5); c.lineTo(x + s + .5, y + s + .5); c.lineTo(x + s + .5, y); c.closePath(); c.fill();
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
/* Jos: a coin that is Needed for finish has a green circle with spikes going round it */
function drawNeededRing(c, x, y, s, time) {
  const r = s * .4, n = 10;
  c.save();
  c.translate(x + s / 2, y + s / 2);
  c.rotate(time * 1.5);
  c.strokeStyle = c.fillStyle = COL.green;
  c.lineWidth = Math.max(1.5, s * .05);
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, w = Math.PI / n * .55;
    c.beginPath();
    c.moveTo(Math.cos(a - w) * r, Math.sin(a - w) * r);
    c.lineTo(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22);
    c.lineTo(Math.cos(a + w) * r, Math.sin(a + w) * r);
    c.fill();
  }
  c.restore();
}
/* Jos's Start pos: a green flag where the hero starts when you TEST */
function drawStartPos(c, x, y, s) {
  c.fillStyle = COL.metal;
  c.fillRect(x + s * .22, y + s * .1, s * .08, s * .9);           // the pole
  c.fillStyle = COL.green;
  c.beginPath(); c.moveTo(x + s * .3, y + s * .1); c.lineTo(x + s * .86, y + s * .3); c.lineTo(x + s * .3, y + s * .5); c.fill();
  c.fillStyle = '#12000a';                                       // a go arrow on the flag
  c.beginPath(); c.moveTo(x + s * .4, y + s * .2); c.lineTo(x + s * .56, y + s * .3); c.lineTo(x + s * .4, y + s * .4); c.fill();
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
function drawRepeater(c, x, y, s) {
  /* Jos (8 Nov): the repeating trigger: the trigger's "!" with arrows curling round it. Drawn, not an emoji. Only in the creator. */
  c.fillStyle = COL.green;
  roundRect(c, x + s * .08, y + s * .08, s * .84, s * .84, s * .12); c.fill();
  c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineWidth = s * .075; c.lineCap = 'round';
  const cx = x + s / 2, cy = y + s / 2, r = s * .33;
  const head = a => {                              // an arrowhead at angle a, pointing round clockwise
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a), nx = Math.cos(a), ny = Math.sin(a), k = s * .1;
    c.beginPath();
    c.moveTo(px + tx * k, py + ty * k);
    c.lineTo(px - tx * k * .3 + nx * k, py - ty * k * .3 + ny * k);
    c.lineTo(px - tx * k * .3 - nx * k, py - ty * k * .3 - ny * k);
    c.closePath(); c.fill();
  };
  [[-Math.PI * .88, -Math.PI * .12], [Math.PI * .12, Math.PI * .88]].forEach(([a0, a1]) => {   // one over the top, one under the bottom
    c.beginPath(); c.arc(cx, cy, r, a0, a1 - .12); c.stroke(); head(a1 - .08);
  });
  c.beginPath();                                   // the small "!" in the middle
  c.moveTo(cx - s * .045, cy - s * .2); c.lineTo(cx + s * .045, cy - s * .2); c.lineTo(cx + s * .03, cy + s * .06); c.lineTo(cx - s * .03, cy + s * .06); c.fill();
  c.fillRect(cx - s * .04, cy + s * .13, s * .08, s * .08);
}
function drawCameraBlock(c, x, y, s) {
  /* Jos (8 Nov): the camera position block: like the trigger, with a little camera on it. Only in the creator. */
  c.fillStyle = COL.green;
  roundRect(c, x + s * .08, y + s * .08, s * .84, s * .84, s * .12); c.fill();
  c.fillStyle = '#000';
  roundRect(c, x + s * .2, y + s * .34, s * .46, s * .34, s * .05); c.fill();          // the body
  c.beginPath(); c.moveTo(x + s * .66, y + s * .46); c.lineTo(x + s * .8, y + s * .38);     // the lens, opening out
  c.lineTo(x + s * .8, y + s * .64); c.lineTo(x + s * .66, y + s * .56); c.closePath(); c.fill();
  c.fillRect(x + s * .27, y + s * .27, s * .14, s * .09);                                  // the top bump
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
function drawButton(c, x, y, s, pressed) {
  /* Jos's button: a dome on a base. Brown, not green. It squashes down when you stand on it. */
  const top = pressed ? .8 : .58;
  c.fillStyle = COL.brownDark;
  c.fillRect(x + s * .05, y + s * .9, s * .9, s * .1);
  c.fillStyle = COL.brown;
  c.beginPath();
  c.moveTo(x + s * .14, y + s * .9);
  c.quadraticCurveTo(x + s * .18, y + s * top, x + s * .5, y + s * top);
  c.quadraticCurveTo(x + s * .82, y + s * top, x + s * .86, y + s * .9);
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
/* Jos (8 Nov): a Needed hero goes in, but not all the Needed heroes are in yet. The door closes and opens again, but it is
   RED inside, not black. A second later it shakes and goes back to black. (It keeps the hero inside, waiting.) */
const DOOR_WAIT = { shut:DOOR.shut, open:.35, hold:1, shake:.4 };
const DOOR_WAIT_END = DOOR_WAIT.shut + DOOR_WAIT.open + DOOR_WAIT.hold + DOOR_WAIT.shake;
function drawDoorWaiting(c, x, y, s, t) {
  const W = DOOR_WAIT, opened = t >= W.shut + 0.0001;
  const f = t < W.shut ? t / W.shut : t < W.shut + W.open ? 1 - (t - W.shut) / W.open : 0;     // the shutter goes down, then up again
  const k = Math.max(0, Math.min(1, (t - W.shut - W.open - W.hold) / W.shake));              // 0 = steady red, 1 = back to black
  const shaking = t > W.shut + W.open + W.hold;
  c.save();
  if (shaking) c.translate(Math.sin(t * 70) * s * .045 * (1 - k * .5), 0);
  const { w, h, dx, dy } = doorPath(c, x, y, s);
  c.fillStyle = COL.doorIn; c.fill();
  if (opened) { c.globalAlpha = 1 - k; c.fillStyle = COL.tile; doorPath(c, x, y, s); c.fill(); c.globalAlpha = 1; }
  if (f > 0) {
    c.save(); doorPath(c, x, y, s); c.clip();
    c.fillStyle = COL.gold; c.strokeStyle = COL.gold;
    c.fillRect(dx, dy, w, h * f * .25 + 1);
    c.lineWidth = Math.max(1.5, s * .06);
    for (let i = 1; i < 4; i++) { const bx = dx + w * i / 4; c.beginPath(); c.moveTo(bx, dy); c.lineTo(bx, dy + h * f); c.stroke(); }
    c.restore();
  }
  c.strokeStyle = COL.gold; c.lineWidth = Math.max(2, s * .12);
  doorPath(c, x, y, s); c.stroke();
  c.restore();
}
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
/* Jos: while a Needed coin is left, the door waits under the ground. k = 0 up, 1 all the way down */
function drawSunk(c, x, y, s, k, draw) {
  c.save();
  c.beginPath(); c.rect(x - s, y - s, s * 3, s * 2); c.clip();   // nothing shows below the ground
  c.translate(0, k * s * 1.1);                                    // a bit extra, so the gold edge goes too
  draw();
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
/* Jos: the dash orb, from Geometry Dash. A green orb with a white arrow. Touch it and press jump:
   you shoot the way the arrow points, in a straight line, for as long as you hold jump. */
function drawDashOrb(c, x, y, s, time) {
  const m = x + s / 2, n = y + s / 2, R = s * .38;
  c.strokeStyle = 'rgba(125, 255, 106, .5)'; c.lineWidth = s * .05;      // the ring round it, breathing
  c.beginPath(); c.arc(m, n, R * (1.2 + .06 * Math.sin(time * 6)), 0, Math.PI * 2); c.stroke();
  const g = c.createRadialGradient(m - R * .3, n - R * .3, R * .1, m, n, R);
  g.addColorStop(0, '#a6ff80'); g.addColorStop(1, '#22b02e');
  c.fillStyle = g; c.beginPath(); c.arc(m, n, R, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#0d5a16'; c.lineWidth = s * .05; c.stroke();
  c.lineJoin = 'round'; c.lineCap = 'round';                             // the arrow, pointing right
  c.beginPath(); c.moveTo(m - R * .28, n - R * .48); c.lineTo(m + R * .36, n); c.lineTo(m - R * .28, n + R * .48);
  c.strokeStyle = '#0d5a16'; c.lineWidth = s * .2; c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = s * .11; c.stroke();
}

/* ---------- turning blocks ----------
   Jos: blocks that look the same whichever way round they are (tile, sawblade, coin, portal)
   don't turn. r = how many quarter turns clockwise: 0 up, 1 right, 2 down, 3 left. */
const TURNS = ['spike', 'smallspike', 'spring', 'oneway', 'button', 'dashorb', 'hill'];
const FACING = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const FACE_NAME = ['Up', 'Right', 'Down', 'Left'];
// the dash orb's arrow starts pointing right (Jos's picture), so it is one turn ahead
const facing = c => ((c.r || 0) + (c.t === 'dashorb' ? 1 : 0)) % 4;
function turn(c, x, y, s, r, draw) {
  if (!r) { draw(); return; }
  c.save();
  c.translate(x + s / 2, y + s / 2); c.rotate(r * Math.PI / 2); c.translate(-x - s / 2, -y - s / 2);
  draw();
  c.restore();
}
/* a box inside a block's square (x, y, width, height, from 0 to 1), turned with the block,
   so a turned spike gets you on its new pointy side */
function turnBox(b, r) {
  const [x, y, w, h] = b;
  if (r === 1) return [1 - y - h, x, h, w];
  if (r === 2) return [1 - x - w, 1 - y - h, w, h];
  if (r === 3) return [y, 1 - x - w, h, w];
  return b;
}
function drawBlock(c, type, x, y, s, time, r) {
  if (r && TURNS.includes(type)) { turn(c, x, y, s, r, () => drawBlock(c, type, x, y, s, time)); return; }
  if (type === 'tile') drawTile(c, x, y, s);
  else if (type === 'spike') drawSpike(c, x, y, s);
  else if (type === 'smallspike') drawSmallSpike(c, x, y, s);
  else if (type === 'sawblade') drawSaw(c, x, y, s, time);
  else if (type === 'spring') drawSpring(c, x, y, s, 0);
  else if (type === 'coin') drawCoin(c, x, y, s, time);
  else if (type === 'neededcoin') { drawCoin(c, x, y, s, time); drawNeededRing(c, x, y, s, time); }
  else if (type === 'oneway') drawOneWay(c, x, y, s);
  else if (type === 'trigger') drawTrigger(c, x, y, s);
  else if (type === 'controls') drawControls(c, x, y, s);
  else if (type === 'camera') drawCameraBlock(c, x, y, s);
  else if (type === 'repeater') drawRepeater(c, x, y, s);
  else if (type === 'button') drawButton(c, x, y, s);
  else if (type === 'door') drawDoor(c, x, y, s);
  else if (type === 'portal') drawPortal(c, x, y, s, time);
  else if (type === 'startpos') drawStartPos(c, x, y, s);
  else if (type === 'dashorb') drawDashOrb(c, x, y, s, time || 0);
  else if (type === 'ball') drawBall(c, x, y, s);
  else if (type === 'hill') drawHill(c, x, y, s);
  else if (type === 'hero') {
    const h = s * T.heroH;
    drawHero(c, x + (s - h * 9 / 23) / 2, y + s - h, h, 1, 0);
  }
}

/* ---------- Block properties: which switches each block has ----------
   Jos: "it's not always the same properties, so make the machine look what properties it has"
   Jos: every single block has Visible. */
const SWITCHES = {
  tile:       ['deadly', 'collision', 'visible', 'disguise'],
  spike:      ['deadly', 'collision', 'visible', 'disguise'],
  smallspike: ['deadly', 'collision', 'visible', 'disguise'],
  sawblade:   ['deadly', 'collision', 'visible', 'disguise'],
  oneway:     ['deadly', 'visible', 'disguise'],
  spring:     ['deadly', 'collision', 'visible', 'disguise', 'action'],
  coin:       ['deadly', 'collision', 'visible', 'disguise', 'action', 'needed'],   // Jos: Needed for finish
  dashorb:    ['deadly', 'collision', 'visible', 'disguise', 'action'],
  button:     ['deadly', 'collision', 'visible', 'disguise', 'action'],
  portal:     ['deadly', 'collision', 'visible', 'disguise', 'action'],
  door:       ['visible', 'disguise'],
  hero:       ['visible', 'needed'],           // Jos (8 Nov): Needed for finish: every needed hero must go into a door
  trigger:    ['visible', 'action'],        // Jos: the trigger only has these two
  controls:   ['visible', 'action'],
  ball:       ['deadly', 'gravity', 'crush', 'triggers', 'visible', 'disguise'],      // Jos (8 Nov)
  hill:       ['collision', 'visible', 'disguise'],
  camera:     ['visible', 'action'],            // Jos: the regular Visible and Do action, then its own camera settings
  repeater:   ['visible', 'action']             // Jos: like the trigger
};
const LABEL = { deadly:'Deadly', collision:'Collision', disguise:'Disguise as block',
                action:'Do action', visible:'Visible', needed:'Needed for finish',
                gravity:'Gravity', crush:'Crush deadly', triggers:'Go through portals and use triggers' };
/* Jos: Crush deadly needs gravity, so turning it on turns Gravity on, and turning Gravity off turns it off */
function ballHasGravity(c) {
  const p = props(c);
  if (p.gravity || p.crush) return true;
  return linksTo(c.id).some(f => (f.l.actions || []).some(a => a.do === 'props' && a.props && a.props.gravity === true));
}
function tieBall(p, k, v) {
  if (k === 'crush' && v) p.gravity = true;
  if (k === 'gravity' && !v) p.crush = false;
}
// what a block can be disguised as. Jos: a Coin for finish too (a coin with the green spiky circle)
const DISGUISES_ALL = BLOCKS.filter(b => b.id !== 'startpos').map(b => [b.id, b.name])
                        .concat([['neededcoin', 'Coin for finish']]);
const disguises = () => DISGUISES_ALL.filter(d => d[0] === 'neededcoin' || blockAllowed(d[0]));
const LINKERS = ['trigger', 'button', 'repeater'];    // the blocks you can connect to other blocks
const KEYS = [['ArrowLeft', '← arrow'], ['ArrowRight', '→ arrow'], ['ArrowUp', '↑ arrow'],
              ['ArrowDown', '↓ arrow'], ['Space', 'Space'], ['KeyA', 'A'], ['KeyD', 'D'],
              ['KeyW', 'W'], ['KeyS', 'S']];
/* a new Edit controls block starts with Jos's example: left = ←, right = →, up = Space or ↑ */
const BLOCK_CONTROLS = { left:['ArrowLeft'], right:['ArrowRight'], up:['Space', 'ArrowUp'], auto:0, jumpH:2, speed:100 };
const DIRS = { left:[-1, 0], right:[1, 0], up:[0, -1], down:[0, 1] };

/* every block gets its own number, so connections still work after a block is moved */
let nextId = 1;
function giveIds() {
  allBlocks().forEach(({ c }) => { if (c.id) nextId = Math.max(nextId, c.id + 1); });
  allBlocks().forEach(({ c }) => { if (!c.id) c.id = nextId++; });
}
function byId(id) {
  return allBlocks().find(f => f.c.id === id) || null;
}
function forgetLinksTo(ids) {
  allBlocks().forEach(({ c }) => { if (c.links) c.links = c.links.filter(l => !ids.has(l.id)); });
}
/* two blocks in one square: the name shows, and if you keep the mouse still it swaps to the other */
let hoverSince = 0;
function pickAt(x, y) {
  const s = stackAt(x, y);
  if (s.length < 2) return s[0] || null;
  // Jos's editor command: Trigger to block always picks the inside block, or always the outside one
  if (editorOn && tool === 'link') return s[editorPick === 'in' ? 1 : 0];
  const held = hover && hover.x === x && hover.y === y ? (performance.now() - hoverSince) / 1000 : 0;
  return s[Math.floor(held / T.pickSwap) % 2];
}
function looksLike(c) { return props(c).disguise ? (c.as || 'tile') : c.t; }

/* ---------- the blocks bar ---------- */
const palette = document.getElementById('palette');
const icons = [];
let chosen = 'tile', tool = 'place';
let chosenTurn = 0, turnTold = false;    // which way round new blocks go down (R turns it)

function drawIcon(c, type, time, r) {
  c.clearRect(0, 0, 80, 80);
  if (type === 'hero') drawHero(c, 31, 12, 60, 1, Math.floor(time / .25) % 2);   // running on the spot
  else drawBlock(c, type, 8, 8, 64, time, r);
}

BLOCKS.forEach(b => {
  const btn = document.createElement('button');
  btn.className = 'block';
  btn.dataset.id = b.id;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 80;
  btn.appendChild(cv);
  btn.appendChild(document.createTextNode(b.name));
  btn.addEventListener('click', () => {
    if (chosen !== b.id) chosenTurn = 0;
    chosen = b.id; setTool('place');
    if (TURNS.includes(b.id) && !turnTold) { say('Press R to turn it ↻'); turnTold = true; }
    if (b.id === 'startpos') say('Click where the hero starts when you TEST');
  });
  palette.appendChild(btn);
  icons.push({ id:b.id, cv });
});
function drawIcons(time) {
  icons.forEach(({ id, cv }) => drawIcon(cv.getContext('2d'), id, time, id === chosen ? chosenTurn : 0));
}

document.querySelectorAll('.tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});
function setTool(t) {
  tool = t;
  sel.clear(); boxDrag = moveDrag = null;
  linkFrom = []; linking = false;
  hideBanner();
  if (t !== 'cursor' || openIds) closePanel();
  if (t === 'select') banner('Click and drag to make a box round the blocks you want');
  if (t === 'link') linkBanner();
  cv.style.cursor = t === 'select' ? 'crosshair' : t === 'cursor' || t === 'link' ? 'pointer' : 'default';
  refreshButtons();
}
function applyDifficulty() {                  // the palette shows only what this level's difficulty has
  document.querySelectorAll('.block[data-id]').forEach(b => {
    if (b.dataset.id !== 'startpos') b.style.display = blockAllowed(b.dataset.id) ? '' : 'none';
  });
  if (!blockAllowed(chosen)) { chosen = 'tile'; tool = tool === 'place' ? 'place' : tool; }
  refreshButtons();
}
function refreshButtons() {
  document.querySelectorAll('.block').forEach(b =>
    b.classList.toggle('on', tool === 'place' && b.dataset.id === chosen));
  document.querySelectorAll('.tool[data-tool]').forEach(b =>
    b.classList.toggle('on', tool === b.dataset.tool));
}

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear the whole level?')) return;
  grid = emptyGrid(); save(); closePanel(); sel.clear();
  edges = Object.assign({}, EDGE_START); saveEdges();
  startPos = null; saveStart();
});

/* ---------- the level canvas ---------- */
const cv = document.getElementById('level');
const ctx = cv.getContext('2d');
const wrap = document.getElementById('stageWrap');
let cell = 30, hover = null, painting = false;

/* The camera (Jos, 8 Nov). A block is always the same size on the screen (the size that fits 32 by 18 blocks).
   A level that is smaller than that is blown up to fit, and one that is bigger scrolls. edCam is where the
   creator's view is, in blocks; when you play, the camera follows the hero (play.cam). */
let edCam = { x:0, y:0 };
let viewW = 32, viewH = 18, viewPx = { w:0, h:0 };       // how much of the level fits on the screen, in blocks and in pixels
const camNow = () => (play && play.cam) || edCam;
function clampCam(c) {
  const z = c.z || 1;                                   // z < 1: zoomed out, so more of the level is on the screen
  c.x = Math.max(0, Math.min(c.x, Math.max(0, T.cols - viewW / z)));
  c.y = Math.max(0, Math.min(c.y, Math.max(0, T.rows - viewH / z)));
}
/* Jos (8 Nov): zoom. 1 is the normal size; smaller shows more of a big level. Only in the creator: when you play it is normal. */
let zoom = 1;
let zoomInfo = { base:13, whole:13 };          // the normal block size, and the block size that shows the whole level
function fit() {
  const r = wrap.getBoundingClientRect();
  const testing = document.body.classList.contains('testing');
  const padX = testing ? 0 : 104, padY = testing ? 0 : 126;   // room round the level for the ✏️ edge buttons
  const availW = Math.max(40, r.width - padX), availH = Math.max(40, r.height - padY);
  const oneScreen = Math.floor(Math.min(availW / SIZE.oneScreen[0], availH / SIZE.oneScreen[1]));
  const whole = Math.floor(Math.min(availW / T.cols, availH / T.rows));
  const base = Math.max(10, oneScreen, whole);
  zoomInfo = { base, whole };
  cell = Math.max(3, Math.floor(base * (testing ? 1 : zoom)));
  const cw = Math.min(cell * T.cols, Math.floor(availW)), ch = Math.min(cell * T.rows, Math.floor(availH));
  viewW = cw / cell; viewH = ch / cell; viewPx = { w:cw, h:ch };
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = cw + 'px';
  cv.style.height = ch + 'px';
  cv.width = cw * dpr;
  cv.height = ch * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clampCam(edCam);
  if (play && play.cam) { clampCam(play.cam); play.cam.snap = 3; }
  placeBanner();
}
window.addEventListener('resize', fit);

function setZoom(z) {                            // keeps the middle of the screen where it is
  const cx = edCam.x + viewW / 2, cy = edCam.y + viewH / 2;
  zoom = z; fit();
  edCam.x = cx - viewW / 2; edCam.y = cy - viewH / 2; clampCam(edCam);
}
let zoomBoxEl = null;
function closeZoom() { if (zoomBoxEl) { zoomBoxEl.remove(); zoomBoxEl = null; } }
function openZoom() {
  closeZoom();
  const fitZ = Math.min(1, zoomInfo.whole / zoomInfo.base);               // the zoom that shows the whole level
  const min = Math.max(.05, Math.min(.5, fitZ));
  const slider = el('input', { type:'range', min, max:2, step:.01, value:zoom });
  const pct = el('span', { className:'zm-pct', textContent:Math.round(zoom * 100) + '%' });
  const set = z => { setZoom(z); slider.value = z; pct.textContent = Math.round(z * 100) + '%'; };
  slider.addEventListener('input', () => set(+slider.value));
  const box = zoomBoxEl = el('div', { id:'zoomBox' }, [
    el('div', { className:'zm-title', textContent:'Zoom' }),
    el('div', { className:'zm-row' }, [el('span', { textContent:'out' }), slider, el('span', { textContent:'in' })]),
    pct,
    el('div', { className:'zm-buttons' }, [
      el('button', { className:'zm-fit', textContent:'Zoom to fit', onclick:() => set(fitZ) }),
      el('button', { className:'zm-100', textContent:'100%', onclick:() => set(1) })])]);
  document.body.append(box);
  const b = document.getElementById('zoomBtn').getBoundingClientRect();
  box.style.left = Math.max(8, Math.min(innerWidth - 260, b.left)) + 'px'; box.style.top = (b.bottom + 6) + 'px';
}
document.getElementById('zoomBtn')?.addEventListener('click', e => {
  e.stopPropagation(); e.currentTarget.blur();
  if (play || chomp) return;
  if (zoomBoxEl) closeZoom(); else openZoom();
});
document.addEventListener('pointerdown', e => { if (zoomBoxEl && !zoomBoxEl.contains(e.target) && e.target.id !== 'zoomBtn') closeZoom(); });
function pointAt(e) {
  const r = cv.getBoundingClientRect(), c = camNow();
  return { x:(e.clientX - r.left) / cell + c.x, y:(e.clientY - r.top) / cell + c.y };
}
function cellAt(e) {
  const p = pointAt(e), x = Math.floor(p.x), y = Math.floor(p.y);
  return (x >= 0 && y >= 0 && x < T.cols && y < T.rows) ? { x, y } : null;
}
let stroke = new Set();   // squares already done in this click-and-drag
function paint(a, click) {
  if (!a || play || chomp) return;
  const here = stackAt(a.x, a.y);
  const k = a.x + ',' + a.y;
  if (stroke.has(k)) return;                     // one square once each time you click or drag
  stroke.add(k);
  const startHere = editorOn && startPos && startPos.x === a.x && startPos.y === a.y;
  if (tool === 'erase') {                        // the eraser clears the whole square
    if (startHere) { startPos = null; saveStart(); return; }   // the Start pos goes first
    if (here.length) { grid[a.y][a.x] = null; forgetLinksTo(new Set(here.map(b => b.id))); save(); }
    return;
  }
  if (tool !== 'place') return;
  if (chosen === 'startpos') {                   // only one: the old one goes, the new one appears
    startPos = { x:a.x, y:a.y }; saveStart(); return;
  }
  const same = here.find(b => b.t === chosen);
  // Jos: a click puts a block inside the same block (a tile inside a tile).
  // Dragging over the same block leaves it be, like before.
  if (same && (!click || onlyOne(chosen))) {   // just turn it to match
    const r = TURNS.includes(chosen) ? chosenTurn : 0;
    if ((same.r || 0) !== r) { same.r = r; save(); }
    return;
  }
  if (here.length >= 2) { say('That square already has 2 blocks in it 😈'); return; }
  if (onlyOne(chosen)) {
    const was = find(chosen);
    if (was) takeOut(was.x, was.y, was.c.id);
  }
  const b = { t:chosen, id:nextId++ };
  if (TURNS.includes(chosen) && chosenTurn) b.r = chosenTurn;
  putIn(a.x, a.y, b);                            // Jos: on an empty square, or inside the block there
  save();
}
/* R turns whatever you're working with: the block you're about to put down,
   the blocks you've selected, or the block whose properties are open */
function turnKey() {
  if (tool === 'place') {
    if (!TURNS.includes(chosen)) { say(NAME[chosen] + " doesn't turn"); return; }
    chosenTurn = (chosenTurn + 1) % 4;
    return;
  }
  const ids = tool === 'select' ? [...sel] : tool === 'cursor' && openId ? [openId] : [];
  let turned = 0;
  ids.forEach(id => {
    const f = byId(id);
    if (f && TURNS.includes(f.c.t)) { f.c.r = ((f.c.r || 0) + 1) % 4; turned++; }
  });
  if (turned) { save(); if (openId || openIds) renderPanel(); }
}

/* Jos (8 Nov): hold Space and drag to move around a big level, whatever you are holding (you won't put a block down).
   With the Cursor, dragging on empty space moves around too. The mouse wheel does as well. */
let panning = null;
function panBy(dx, dy) { edCam.x += dx; edCam.y += dy; clampCam(edCam); }
cv.addEventListener('wheel', e => {
  if (play || chomp) return;
  e.preventDefault();
  panBy((e.deltaX || (e.shiftKey ? e.deltaY : 0)) / cell, (e.shiftKey ? 0 : e.deltaY) / cell);
}, { passive:false });
cv.addEventListener('pointerdown', e => {
  if (play || chomp) return;
  const a = cellAt(e), c = a && pickAt(a.x, a.y);
  cv.setPointerCapture(e.pointerId);
  if (camPick && !keys.Space) {                 // choosing where the camera goes
    if (a) { camPick.ids.forEach(id => { const f = byId(id); if (f) f.c.cam = { x:a.x, y:a.y }; }); save(); endCamPick(); }
    return;
  }
  if (keys.Space || (tool === 'cursor' && !c)) {
    panning = { x:e.clientX, y:e.clientY, cx:edCam.x, cy:edCam.y, moved:false, closeIfClick:!keys.Space };
    return;
  }
  if (tool === 'place' || tool === 'erase') { painting = true; stroke = new Set(); paint(a, true); return; }
  if (tool === 'cursor') {
    // Jos: the cursor shows a block's properties, and can drag that one block somewhere else.
    // The properties open when you let go: opening them makes the level smaller, which would
    // move the blocks out from under the mouse in the middle of a drag.
    if (c) moveDrag = { from:a, off:{ x:0, y:0 }, ids:new Set([c.id]), open:c.id };
    else closePanel();
    return;
  }
  if (tool === 'link') {
    if (linking) { const p = pointAt(e); boxDrag = { x0:p.x, y0:p.y, x1:p.x, y1:p.y, block:c, stack:a && stackAt(a.x, a.y), link:true }; return; }   // Jos (9 Nov): drag a box round blocks to connect them all
    linkClick(c, a && stackAt(a.x, a.y)); return;
  }
  if (tool === 'select') {
    // Jos: click one of the selected blocks (without dragging) to change all their properties
    if (c && stackAt(a.x, a.y).some(b => sel.has(b.id))) moveDrag = { from:a, off:{ x:0, y:0 }, ids:sel, click:true };
    // Jos: another box, or a click on another block, adds to what's already selected
    else { closePanel(); const p = pointAt(e); boxDrag = { x0:p.x, y0:p.y, x1:p.x, y1:p.y, block:c }; }
  }
});
cv.addEventListener('pointermove', e => {
  if (panning) {
    if (Math.abs(e.clientX - panning.x) + Math.abs(e.clientY - panning.y) > 4) panning.moved = true;
    edCam.x = panning.cx - (e.clientX - panning.x) / cell; edCam.y = panning.cy - (e.clientY - panning.y) / cell; clampCam(edCam);
  }
  const h = cellAt(e);
  if (!h || !hover || h.x !== hover.x || h.y !== hover.y) hoverSince = performance.now();
  hover = h;
  if (painting && !onlyOne(chosen)) paint(hover);
  if (boxDrag) { const p = pointAt(e); boxDrag.x1 = p.x; boxDrag.y1 = p.y; }
  if (moveDrag && hover) moveDrag.off = { x:hover.x - moveDrag.from.x, y:hover.y - moveDrag.from.y };
});
cv.addEventListener('pointerup', () => {
  painting = false;
  if (panning) { if (!panning.moved && panning.closeIfClick) closePanel(); panning = null; return; }
  if (boxDrag) { finishBox(); boxDrag = null; }
  if (moveDrag) {
    const still = !moveDrag.off.x && !moveDrag.off.y;
    moveBlocks(moveDrag.ids, moveDrag.off);
    if (moveDrag.open) openPanel(moveDrag.open);
    else if (moveDrag.click && still) openSelection();
    moveDrag = null;
  }
});
cv.addEventListener('pointerleave', () => { hover = null; });

/* ---------- Select blocks: drag a dotted box, then move or delete what's in it ---------- */
const sel = new Set();
let boxDrag = null, moveDrag = null;

function finishBox() {
  if (boxDrag.link) { finishLinkBox(); return; }
  const x0 = Math.min(boxDrag.x0, boxDrag.x1), x1 = Math.max(boxDrag.x0, boxDrag.x1);
  const y0 = Math.min(boxDrag.y0, boxDrag.y1), y1 = Math.max(boxDrag.y0, boxDrag.y1);
  if (x1 - x0 < .2 && y1 - y0 < .2) {           // a click, not a box
    if (boxDrag.block) sel.add(boxDrag.block.id);   // only that block
    else sel.clear();                             // a click on nothing: nothing selected
  } else {
    for (let y = 0; y < T.rows; y++)
      for (let x = 0; x < T.cols; x++)
        if (x < x1 && x + 1 > x0 && y < y1 && y + 1 > y0) stackAt(x, y).forEach(b => sel.add(b.id));
  }
  selectionBanner();
}
function selectionBanner() {
  if (!sel.size) { banner('Click and drag to make a box round the blocks you want'); return; }
  // Jos: blocks with blocks inside them: choose the inside ones, all of them, or the outside ones
  const layers = selLayer(1).size && [['Select inside blocks', () => openSelection(selLayer(1))],
                                      ['Select all blocks', () => openSelection(sel)],
                                      ['Select outside blocks', () => openSelection(selLayer(0))]];
  banner(sel.size + (sel.size === 1 ? ' block' : ' blocks') + ' selected · drag them to move',
         [['🗑 Delete', deleteSelected]], layers || null);
}
function selLayer(layer) {          // 0 = the block in the square, 1 = the block inside it
  return new Set(allBlocks().filter(f => f.layer === layer && sel.has(f.c.id)).map(f => f.c.id));
}
function moveBlocks(ids, off) {
  if (!off.x && !off.y) return;
  const moving = allBlocks().filter(f => ids.has(f.c.id));
  if (moving.some(m => m.x + off.x < 0 || m.y + off.y < 0 ||
                       m.x + off.x >= T.cols || m.y + off.y >= T.rows)) {
    say('That would go off the edge 😈'); return;
  }
  moving.sort((a, b) => b.layer - a.layer).forEach(m => takeOut(m.x, m.y, m.c.id));
  moving.sort((a, b) => a.layer - b.layer);      // put them back down outer first, so they stay stacked
  // a square only holds 2 blocks: if there isn't room, what was there gets squashed
  const coming = {};
  moving.forEach(m => { const k = (m.x + off.x) + ',' + (m.y + off.y); coming[k] = (coming[k] || 0) + 1; });
  const squashed = new Set();
  Object.keys(coming).forEach(k => {
    const [x, y] = k.split(',').map(Number);
    if (stackAt(x, y).length + coming[k] > 2) { stackAt(x, y).forEach(b => squashed.add(b.id)); grid[y][x] = null; }
  });
  moving.forEach(m => putIn(m.x + off.x, m.y + off.y, m.c));
  if (squashed.size) forgetLinksTo(squashed);
  save();
}
function deleteSelected() {
  allBlocks().filter(f => sel.has(f.c.id)).sort((a, b) => b.layer - a.layer)
    .forEach(f => takeOut(f.x, f.y, f.c.id));
  forgetLinksTo(sel);
  if (sel.has(openId) || openIds) closePanel();
  sel.clear();
  save();
  selectionBanner();
}

/* ---------- the edges of the level ----------
   Jos: each edge has an edit button. The floor, walls and roof can be solid (you stand on them,
   bump into them) or the edge of the screen (go onto it and you die). */
const EDGE_NAME = { top:'roof', bottom:'floor', left:'wall', right:'wall' };
const EDGE_START = { top:'solid', bottom:'edge', left:'solid', right:'solid' };   // what LDLC did before
let edges = Object.assign({}, EDGE_START);
function loadEdges() { edges = Object.assign({}, EDGE_START, LDLC.read(LDLC.key('edges', levelId)) || {}); }
function saveEdges() { if (playAll) return; try { localStorage.setItem(LDLC.key('edges', levelId), JSON.stringify(edges)); } catch (e) {} refreshSend(); }
loadEdges();
document.querySelectorAll('.edgeBtn').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.edge;
  edges[k] = edges[k] === 'solid' ? 'edge' : 'solid';
  saveEdges();
  say(edges[k] === 'solid' ? 'Switched to ' + EDGE_NAME[k] : 'Changed to edge of screen');
  b.blur();
}));
function drawEdges() {
  const W = cell * T.cols, H = cell * T.rows;
  [['top', 0, 1.5, W, 1.5], ['bottom', 0, H - 1.5, W, H - 1.5],
   ['left', 1.5, 0, 1.5, H], ['right', W - 1.5, 0, W - 1.5, H]].forEach(([k, x1, y1, x2, y2]) => {
    if (edges[k] === 'solid') { ctx.strokeStyle = COL.metal; ctx.lineWidth = 3; ctx.setLineDash([]); }
    else { ctx.strokeStyle = COL.tile; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); }
    line(x1, y1, x2, y2);
  });
  ctx.setLineDash([]);
}

/* ---------- Trigger to block ---------- */
let linkFrom = [];     // the triggers (or buttons) being connected. Jos: you can choose lots
let linking = false;   // false while you're choosing them, true once you're clicking blocks
let linkedLast = null; // the last block they were connected to
function linkClick(c, stack) {
  if (!linking) {
    // a trigger with something else in its square (like the hero) still counts
    const tr = c && LINKERS.includes(c.t) ? c : (stack || []).find(b => LINKERS.includes(b.t));
    if (tr) {
      // Jos: click more triggers or buttons to connect them all at once (click one again to drop it)
      linkFrom = linkFrom.includes(tr.id) ? linkFrom.filter(id => id !== tr.id) : linkFrom.concat(tr.id);
      linkBanner();
      return;
    }
    if (!linkFrom.length) { say('Click on one of your triggers (or a button) 😈'); return; }
    say('Press Done first 😈'); return;            // Jos (9 Nov): Done starts the connecting, nothing starts it by itself
  }
  if (!c || linkFrom.includes(c.id) || c.t === 'hero') return;
  linkMany([c]);
}
function linkMany(list) {
  if (!list.length) return;
  const trs = linkFrom.map(byId).filter(Boolean).map(f => f.c);
  const had = list.every(c => trs.every(tr => (tr.links || []).some(l => l.id === c.id)));
  list.forEach(c => trs.forEach(tr => {
    tr.links = tr.links || [];
    if (had) tr.links = tr.links.filter(l => l.id !== c.id);   // click a connected block again to undo it
    else if (!tr.links.some(l => l.id === c.id)) tr.links.push({ id:c.id, actions:[] });
  }));
  if (!had) linkedLast = list[list.length - 1].id;
  save();
  linkBanner();
}
function finishLinkBox() {
  const b = boxDrag;
  const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
  if (x1 - x0 < .2 && y1 - y0 < .2) { linkClick(b.block, b.stack); return; }     // a click, not a box
  const list = [];
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++)
      if (x < x1 && x + 1 > x0 && y < y1 && y + 1 > y0) stackAt(x, y).forEach(c => { if (!linkFrom.includes(c.id) && c.t !== 'hero') list.push(c); });
  linkMany(list);
}
function linkBanner() {
  const n = linkFrom.length;
  if (!linking) {
    // Jos (9 Nov): it says how many are chosen, and you press Done when you have them all
    banner(!n ? 'Choose a trigger or button' : n + (n === 1 ? ' trigger' : ' triggers') + ' selected',
           n ? [['Done', () => { linking = true; linkBanner(); }]] : []);
    return;
  }
  const any = linkFrom.some(id => (byId(id)?.c.links || []).length);
  banner('Click on a block/blocks', any ? [['Done', finishLinking]] : []);
}
function finishLinking() {
  // Jos: the Add is in the connected block, so Done opens the block you just connected
  const id = linkedLast && byId(linkedLast) ? linkedLast : linkFrom[0];
  setTool('cursor');
  openPanel(id);
}
/* every trigger or button connected to this block */
function linksTo(id) {
  const out = [];
  allBlocks().forEach(({ x, y, c }) => {
    if (c.links) c.links.forEach(l => { if (l.id === id) out.push({ x, y, c, l }); });
  });
  return out;
}

/* ---------- the message bar at the top ---------- */
const bannerEl = document.getElementById('banner');
function banner(text, buttons, row2) {
  bannerEl.innerHTML = '';
  bannerEl.append(el('span', { textContent:text }));
  const button = ([label, fn]) => el('button', { textContent:label, onclick:fn });
  (buttons || []).forEach(b => bannerEl.append(button(b)));
  if (row2) bannerEl.append(el('div', { className:'row2' }, row2.map(button)));
  bannerEl.classList.toggle('tall', !!row2);
  bannerEl.classList.add('show');
  placeBanner();
}
function placeBanner() {            // over the middle of the level, so it doesn't cover the panel
  const r = wrap.getBoundingClientRect();
  document.getElementById('banner').style.left = r.left + r.width / 2 + 'px';
}
function hideBanner() { bannerEl.classList.remove('show'); }

/* ---------- the Block properties panel ---------- */
const panel = document.getElementById('panel');
let openId = null, openIds = null, hoverLink = null;
let copyFrom = null;   // Do same with other triggers: { id:the block, l:the one being copied, to:the ticked ones }   // openIds = lots of selected blocks at once

function el(tag, attrs, kids) {
  const e = Object.assign(document.createElement(tag), attrs || {});
  (kids || []).forEach(k => e.append(k));
  return e;
}
function row(label, ...kids) {
  return el('div', { className:'p-row' }, [el('span', { className:'p-label', textContent:label }), ...kids]);
}
function toggle(label, on, change) {
  const box = el('input', { type:'checkbox', checked:!!on });
  if (on === null) box.indeterminate = true;   // Jos: some on, some off: the switch sits in the middle
  box.addEventListener('change', () => change(box.checked));
  return el('label', { className:'p-row p-switch' },
            [el('span', { className:'p-label', textContent:label }), box, el('span', { className:'knob' })]);
}
function pick(options, value, change) {
  const s = el('select');
  if (value === null) s.append(el('option', { value:'__mixed', textContent:'Mixed', disabled:true }));
  options.forEach(([v, t]) => s.append(el('option', { value:v, textContent:t })));
  s.value = value === null ? '__mixed' : value;
  s.addEventListener('change', () => change(s.value));
  return s;
}
function number(value, min, max, step, change) {
  const n = el('input', { type:'number', min, max, step, value:value === null ? '' : value });
  if (value === null) n.placeholder = 'Mixed';
  n.addEventListener('input', () => {
    const v = parseFloat(n.value);
    if (!isNaN(v)) change(Math.max(min, Math.min(max, v)));
  });
  n.addEventListener('change', () => {            // Jos: if you type more than the most it can be, the box shows the real number
    const v = parseFloat(n.value);
    if (!isNaN(v)) n.value = Math.max(min, Math.min(max, v));
  });
  return n;
}

function openPanel(id) { openId = id; openIds = null; copyFrom = null; renderPanel(); }
/* Jos: the selected blocks' properties, all at once. Only if they all have the same properties. */
function openSelection(ids = sel) {
  if (ids.size === 1) { openPanel([...ids][0]); return; }
  const cells = [...ids].map(byId).filter(Boolean).map(f => f.c);
  const list = c => (SWITCHES[c.t] || []).join();
  if (!cells.every(c => list(c) === list(cells[0]))) {
    say('These blocks have different properties 😈'); return;
  }
  openId = null; openIds = new Set(ids); copyFrom = null; renderPanel();
}
function panelCells() {
  if (openIds) return [...openIds].map(byId).filter(Boolean).map(f => f.c);
  const f = byId(openId);
  return f ? [f.c] : [];
}
/* the same for every block → that; different → null, which shows as "in the middle" or Mixed */
function common(vals) { return vals.every(v => v === vals[0]) ? vals[0] : null; }
function closePanel() {
  if (!panel.classList.contains('open')) return;
  openId = null; openIds = null; hoverLink = null; copyFrom = null;
  panel.classList.remove('open');
  panel.innerHTML = '';
  fit();
}
function renderPanel() {
  const cells = panelCells();
  if (!cells.length) { closePanel(); return; }
  const c = cells[0], many = cells.length > 1, wasOpen = panel.classList.contains('open');
  const scroll = panel.scrollTop;
  panel.innerHTML = '';
  panel.classList.add('open');

  const icon = el('canvas', { width:80, height:80, className:'p-icon' });
  drawIcon(icon.getContext('2d'), c.t, 0, many ? 0 : c.r);
  panel.append(el('div', { className:'p-head' }, [
    icon, el('span', { className:'p-title', textContent:many ? cells.length + ' blocks' : NAME[c.t] }),
    el('button', { className:'p-close', textContent:'✕', title:'Close', onclick:closePanel })
  ]));

  panel.append(el('div', { className:'p-sub', textContent:'Block properties' }));
  // Jos: turn one on and every selected block goes on; the same with off
  (SWITCHES[c.t] || []).forEach(k => {
    const on = common(cells.map(x => !!props(x)[k]));
    panel.append(toggle(LABEL[k], on, v => {
      cells.forEach(x => {
        x.p = Object.assign({}, x.p, { [k]:v });
        tieBall(x.p, k, v);
        if (k === 'disguise' && v && !x.as) x.as = 'tile';
      });
      save(); renderPanel();
    }));
    if (k === 'disguise' && on === true) {
      panel.append(row('Block', pick(disguises(), common(cells.map(x => x.as || 'tile')),
                                     v => { cells.forEach(x => { x.as = v; }); save(); renderPanel(); })));
    }
  });

  /* Jos (9 Nov): a ball that uses triggers and portals needs Gravity on, or a connected trigger that turns it on */
  if (cells.some(x => x.t === 'ball' && props(x).triggers && !ballHasGravity(x))) {
    panel.append(el('p', { className:'p-note', textContent:'Gravity must be on, or a trigger must turn it on (Change properties, Gravity).' }));
  }
  if (cells.every(x => TURNS.includes(x.t))) {
    const go = by => { cells.forEach(x => { x.r = ((x.r || 0) + by + 4) % 4; }); save(); renderPanel(); };
    const r = common(cells.map(facing));
    panel.append(row('Turn', el('span', { className:'p-face', textContent:r === null ? 'Mixed' : FACE_NAME[r] }),
      el('button', { className:'p-turn', textContent:'↺', title:'Turn left', onclick:() => go(-1) }),
      el('button', { className:'p-turn', textContent:'↻', title:'Turn right (R)', onclick:() => go(1) })));
  }
  if (cells.every(x => x.t === 'spring')) {
    // Jos: strength = how many blocks it boots you
    const n = common(cells.map(x => props(x).strength));
    panel.append(row('Strength', number(n, 1, 100, 1, v => {
      cells.forEach(x => { x.p = Object.assign({}, x.p, { strength:v }); }); save();
    })));
  }
  if (cells.every(x => x.t === 'portal')) {
    // Jos: Output = which way you come out of this portal
    const out = common(cells.map(x => x.out || ''));
    panel.append(row('Output =', pick([['', '—'], ['up', 'Up'], ['down', 'Down'], ['left', 'Left'], ['right', 'Right']],
                                      out, v => { cells.forEach(x => { x.out = v || undefined; }); save(); renderPanel(); })));
    if (out === '') panel.append(el('p', { className:'p-note',
      textContent:'— means: out of the bottom, or out of the side if there is a block under it.' }));
  }
  if (many) {
    panel.append(el('p', { className:'p-note', textContent:'Changing a switch changes all ' + cells.length + ' blocks.' }));
    if (cells.every(x => x.t === 'camera')) cameraSection(cells);
    manyTriggersSection(cells);
  } else {
    if (c.t === 'controls') controlsSection(c);
    if (c.t === 'camera') cameraSection([c]);
    if (c.t === 'hero') heroSection(c);
    if (LINKERS.includes(c.t)) linksSection(c);
    triggersSection(c);
  }
  panel.scrollTop = scroll;
  if (!wasOpen) fit();
}

/* Jos (8 Nov): an Edit controls block has a Do list, like a trigger: Change controls, or Set gravity.
   Each one only shows its settings once you choose it. */
function controlsSection(c) {
  if (!c.does) {                                             // an older block: its controls become the first Do
    c.does = c.controls ? [Object.assign({ do:'controls' }, c.controls)] : [];
    delete c.controls; save();
  }
  panel.append(el('div', { className:'p-sub', textContent:'When touched' }));
  c.does.forEach((a, j) => panel.append(controlsDo(c, a, j)));
  panel.append(el('button', { className:'p-add', textContent:'+ Add',
                              onclick:() => { c.does.push({ do:'' }); save(); renderPanel(); } }));
}
function controlsDo(c, a, j) {
  const box = el('div', { className:'p-action' });
  box.append(row('Do', pick([['', '—'], ['controls', 'Change controls'], ['gravity', 'Set gravity']], a.do, v => {
      a.do = v;
      if (v === 'controls') Object.assign(a, JSON.parse(JSON.stringify(BLOCK_CONTROLS)));
      if (v === 'gravity' && !a.dir) a.dir = 'down';
      save(); renderPanel();
    }),
    el('button', { className:'p-x', textContent:'🗑', title:'Remove',
                   onclick:() => { c.does.splice(j, 1); save(); renderPanel(); } })));
  if (a.do === 'gravity') box.append(row('Set gravity', pick(GNAMES, a.dir || 'down', v => { a.dir = v; save(); })));
  if (a.do === 'controls') {
    [['left', 'Left ='], ['right', 'Right ='], ['up', 'Up =']].forEach(([k, label]) => {
      const first = pick(KEYS, a[k][0], v => { a[k][0] = v; save(); });
      const second = pick([['', '—']].concat(KEYS), a[k][1] || '',
                          v => { a[k] = [a[k][0]].concat(v ? [v] : []); save(); });
      box.append(row(label, first, el('span', { className:'p-or', textContent:'or' }), second));
    });
    box.append(row('Always going', pick([['0', 'No'], ['-1', 'Left'], ['1', 'Right']], String(a.auto || 0),
                                        v => { a.auto = +v; save(); })));
    /* Jos (8 Nov): jump power is how high he jumps, in blocks. Every jump goes exactly that high. */
    box.append(row('Jump power', number(a.jumpH === undefined ? JUMP_H : a.jumpH, .5, 20, .5, v => { a.jumpH = v; save(); }),
                   el('span', { className:'p-or', textContent:'blocks high' })));
    /* Jos (8 Nov): speed. 100 = normal running, 200 = twice as fast, 50 = half as fast. */
    box.append(row('Speed', number(a.speed === undefined ? 100 : a.speed, 10, 300, 10, v => { a.speed = v; save(); }),
                   el('span', { className:'p-or', textContent:'% (100 = normal)' })));
  }
  return box;
}

/* Jos (8 Nov): the Camera position block. Camera position has a Choose button: it takes the panel away and you click
   the spot the camera should go to. Moving is a switch: it says Camera moving, with a way (up, left, down, right) and a
   speed, and under that a switch: if the hero is off the screen, he dies. */
let camPick = null;                              // the block whose spot is being chosen
function cameraSection(cells) {                   // Jos (9 Nov): works for one camera block or lots selected together
  cells = [].concat(cells);
  const c = cells[0], lots = cells.length > 1;
  panel.append(el('div', { className:'p-sub', textContent:'Camera' }));
  const spots = common(cells.map(x => x.cam ? x.cam.x + ',' + x.cam.y : ''));
  const where = lots && spots === null ? 'different spots' : c.cam ? 'column ' + (c.cam.x + 1) + ', row ' + (c.cam.y + 1) : 'not chosen yet';
  panel.append(row('Camera position', el('span', { className:'p-face', textContent:where }),
    el('button', { className:'p-cmd', textContent:c.cam || lots ? 'Choose again' : 'Choose', onclick:() => startCamPick(cells.map(x => x.id)) })));
  panel.append(toggle('Moving', common(cells.map(x => !!x.cmoving)), v => {
    cells.forEach(x => { x.cmoving = v; if (v) { x.cdir = x.cdir || 'right'; x.cspeed = x.cspeed || 3; } }); save(); renderPanel();
  }));
  if (cells.every(x => x.cmoving)) {
    panel.append(el('div', { className:'p-sub', textContent:'Camera moving' }));
    panel.append(row('Go', pick([['up', 'Up'], ['left', 'Left'], ['down', 'Down'], ['right', 'Right']], c.cdir || 'right',
                                v => { cells.forEach(x => { x.cdir = v; }); save(); })));
    panel.append(row('Speed', number(c.cspeed || 3, .5, 30, .5, v => { cells.forEach(x => { x.cspeed = v; }); save(); }),
                    el('span', { className:'p-or', textContent:'blocks a second' })));
    panel.append(toggle('If off screen, die', common(cells.map(x => !!x.coff)), v => { cells.forEach(x => { x.coff = v; }); save(); }));
  }
  if (T.cols <= viewW && T.rows <= viewH) {
    panel.append(el('p', { className:'p-note', textContent:'The camera only moves in a level bigger than one screen.' }));
  }
}
function startCamPick(ids) {
  camPick = { ids };
  closePanel();
  banner('Click the spot the camera should go to', [['Cancel', endCamPick]]);
}
function endCamPick(open) {
  const ids = (camPick && camPick.ids || []).filter(byId); camPick = null; hideBanner();
  if (ids.length > 1) openSelection(new Set(ids)); else if (ids.length) openPanel(ids[0]);
}

/* Jos (8 Nov): the hero has Jump power and Speed too, so you can set them right from the start.
   An Edit controls block changes them later in the level. */
function heroSection(c) {
  panel.append(el('div', { className:'p-sub', textContent:'Running and jumping' }));
  panel.append(row('Jump power', number(c.jumpH === undefined ? JUMP_H : c.jumpH, .5, 20, .5, v => { c.jumpH = v; save(); }),
                   el('span', { className:'p-or', textContent:'blocks high' })));
  panel.append(row('Speed', number(c.speed === undefined ? 100 : c.speed, 10, 300, 10, v => { c.speed = v; save(); }),
                   el('span', { className:'p-or', textContent:'% (100 = normal)' })));
  /* Jos (8 Nov): which way gravity pulls him from the start */
  panel.append(row('Set gravity', pick(GNAMES, c.gravity || 'down', v => { c.gravity = v === 'down' ? undefined : v; save(); })));
}

function linksSection(c) {
  panel.append(el('div', { className:'p-sub', textContent:'Connected blocks' }));
  const links = c.links || [];
  if (!links.length) {
    panel.append(el('p', { className:'p-note', textContent:'Use 🔗 Trigger to block to connect this to blocks.' }));
  }
  links.forEach(l => {
    const t = byId(l.id);
    if (!t) return;
    const card = el('div', { className:'p-card p-go', title:'Go to this block',
                             onclick:() => openPanel(l.id) });
    card.addEventListener('mouseenter', () => { hoverLink = l.id; });
    card.addEventListener('mouseleave', () => { hoverLink = null; });
    card.append(el('div', { className:'p-card-top' }, [
      el('span', { textContent:'→ ' + NAME[t.c.t] }),
      el('button', { className:'p-x', textContent:'✕', title:'Disconnect',
                     onclick:e => { e.stopPropagation(); c.links = c.links.filter(k => k !== l); save(); renderPanel(); } })
    ]));
    panel.append(card);
  });
  if (links.length) {
    panel.append(el('p', { className:'p-note', textContent:'Click a connected block to Add what it does.' }));
  }
}
/* Jos: the Add goes in the connected block, not in the trigger */
function triggersSection(c) {
  const from = linksTo(c.id);
  if (!from.length) return;
  panel.append(el('div', { className:'p-sub', textContent:'Connected triggers' }));
  const copying = copyFrom && copyFrom.id === c.id;
  from.forEach(f => {
    const l = f.l;
    const card = el('div', { className:'p-card' });
    card.addEventListener('mouseenter', () => { hoverLink = f.c.id; });
    card.addEventListener('mouseleave', () => { hoverLink = null; });
    card.append(el('div', { className:'p-card-top' }, [
      el('span', { textContent:'← ' + NAME[f.c.t] }),
      el('button', { className:'p-x', textContent:'✕', title:'Disconnect',
                     onclick:() => { f.c.links = f.c.links.filter(k => k !== l); save(); renderPanel(); } })
    ]));
    if (copying && copyFrom.l !== l) tickBox(card, l);
    card.append(row('Delay', number(l.delay || 0, 0, 30, .1, v => { l.delay = v; save(); }),
                    el('span', { className:'p-or', textContent:'seconds' })));
    l.actions = l.actions || [];
    const steps = f.c.t === 'repeater';          // a repeating trigger's actions are steps: numbered, and you drag them into order
    if (steps) card.append(el('p', { className:'p-note', textContent:'Steps: they go one after another, then start again, over and over. Drag ⠿ to change the order.' }));
    l.actions.forEach((a, j) => card.append(actionBox(l, a, j, c, save, steps)));
    card.append(el('button', { className:'p-add', textContent:'+ Add',
                               onclick:() => { l.actions.push({ do:'' }); save(); renderPanel(); } }));
    // Jos's editor command: choose which other triggers connected to this block do what this one does
    if (editorOn && from.length > 1 && !copying) copyButton(card, { id:c.id, l });
    if (copying && copyFrom.l === l) copySource(card);
    panel.append(card);
  });
  // only this block's connections change, and their delays stay as they are
  if (copying) copyBar(() => copyFrom.to.forEach(o => { o.actions = JSON.parse(JSON.stringify(copyFrom.l.actions)); }));
}
/* the pieces of Do same with other triggers, for one block and for lots of blocks */
function copyButton(card, from) {
  card.append(el('button', { className:'p-cmd', textContent:'🛠 Do same with other triggers',
                             onclick:() => { copyFrom = Object.assign({ to:new Set() }, from); renderPanel(); } }));
}
function copySource(card) {
  card.classList.add('p-copying');
  card.append(el('p', { className:'p-note', textContent:'Tick the ones that should do the same as this one, then click Done.' }));
}
function tickBox(card, item) {      // Jos: a tick box on every other one
  const box = el('input', { type:'checkbox', checked:copyFrom.to.has(item) });
  box.addEventListener('change', () => { if (box.checked) copyFrom.to.add(item); else copyFrom.to.delete(item); });
  card.append(el('label', { className:'p-tick' }, [box, el('span', { textContent:'Do the same' })]));
}
function copyBar(done) {
  panel.append(el('div', { className:'p-copybar' }, [
    el('button', { className:'p-cmd', textContent:'Done', onclick:() => {
      const n = copyFrom.to.size;
      done();
      copyFrom = null; save(); renderPanel();
      say(n ? n + (n === 1 ? ' does' : ' do') + ' the same now' : 'Nothing was ticked');
    } }),
    el('button', { className:'p-cmd p-cancel', textContent:'Cancel', onclick:() => { copyFrom = null; renderPanel(); } })
  ]));
}
/* Jos's editor command: the first one you connected waits 0 s, the next 1 s, the next 2 s…
   Click again: start from 1 s, then 2 s. Two clicks inside one second turn it off.
   The 1 can be changed, like 0.1: 0, 0.1, 0.2… */
let upLast = { id:null, at:0 }, upStep = +localStorage.getItem('jos-ldlc-upstep') || 1;
const round2 = v => Math.round(v * 100) / 100;
const secs = v => v + (v === 1 ? ' second' : ' seconds');
function upPattern(links) {         // { start, step } when the delays go up evenly, or null
  if (links.length < 2) return null;
  const d = links.map(l => l.delay || 0), start = d[0], step = round2(d[1] - d[0]);
  if (step <= 0) return null;
  return d.every((v, i) => v === Math.min(30, round2(start + i * step))) ? { start, step } : null;
}
function upOneButton(card, links, tr) {
  const pat = upPattern(links);
  const apply = (from, by) => { links.forEach((l, i) => { l.delay = Math.min(30, round2(from + i * by)); }); save(); };
  const label = p => p ? '⏱ Up ' + p.step + ' · starting from ' + secs(p.start) : '⏱ Up ' + secs(upStep) + ' each';
  card.append(row('⏱ Up by', number(pat ? pat.step : upStep, .1, 30, .1, v => {
    upStep = v;
    localStorage.setItem('jos-ldlc-upstep', v);
    if (upPattern(links)) apply(0, v);          // Jos: a new number starts again from 0 seconds
    btn.textContent = label(upPattern(links));
  }), el('span', { className:'p-or', textContent:'seconds' })));
  const btn = el('button', { className:'p-cmd', textContent:label(pat), onclick:() => {
    const now = performance.now(), twice = upLast.id === tr.id && now - upLast.at < 1000;
    upLast = { id:tr.id, at:twice ? 0 : now };
    const p = upPattern(links);
    if (twice) apply(0, 0);
    else if (p) apply(Math.min(30, round2(p.start + p.step)), p.step);
    else apply(0, upStep);
    renderPanel();
  } });
  card.append(btn);
  if (pat) card.append(el('p', { className:'p-note',
    textContent:'Click again to start ' + secs(pat.step) + ' later. Double-click to turn it off.' }));
}
/* Jos: lots of blocks connected to the same trigger: one card changes all of them */
function manyTriggersSection(cells) {
  const ids = new Set(cells.map(x => x.id)), groups = new Map();
  allBlocks().forEach(({ c }) => (c.links || []).forEach(l => {
    if (!ids.has(l.id)) return;
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(l);
  }));
  if (!groups.size) return;
  panel.append(el('div', { className:'p-sub', textContent:'Connected triggers' }));
  const copying = copyFrom && copyFrom.many && groups.has(copyFrom.tr);
  groups.forEach((links, tr) => {
    const card = el('div', { className:'p-card' });
    card.addEventListener('mouseenter', () => { hoverLink = tr.id; });
    card.addEventListener('mouseleave', () => { hoverLink = null; });
    const count = links.length + (links.length < cells.length ? ' of ' + cells.length : '') + ' blocks';
    card.append(el('div', { className:'p-card-top' }, [
      el('span', { textContent:'← ' + NAME[tr.t] + ' · ' + count }),
      el('button', { className:'p-x', textContent:'✕', title:'Disconnect all of them',
                     onclick:() => { tr.links = tr.links.filter(k => !links.includes(k)); save(); renderPanel(); } })
    ]));
    if (copying && copyFrom.tr !== tr) tickBox(card, tr);
    card.append(row('Delay', number(common(links.map(l => l.delay || 0)), 0, 30, .1,
                                    v => { links.forEach(l => { l.delay = v; }); save(); }),
                    el('span', { className:'p-or', textContent:'seconds' })));
    if (editorOn) upOneButton(card, links, tr);
    const same = common(links.map(l => JSON.stringify(l.actions || [])));
    if (same === null) {
      card.append(el('p', { className:'p-note', textContent:'These blocks do different things, so they can\'t be changed together 😈' }));
      panel.append(card);
      return;
    }
    // change one copy, then give every block its own copy of it
    const g = { actions:JSON.parse(same) };
    const saved = () => { links.forEach(l => { l.actions = JSON.parse(JSON.stringify(g.actions)); }); save(); };
    g.actions.forEach((a, j) => card.append(actionBox(g, a, j, cells[0], saved)));
    card.append(el('button', { className:'p-add', textContent:'+ Add',
                               onclick:() => { g.actions.push({ do:'' }); saved(); renderPanel(); } }));
    if (editorOn && groups.size > 1 && !copying) copyButton(card, { many:true, tr });
    if (copying && copyFrom.tr === tr) copySource(card);
    panel.append(card);
  });
  // Jos: the ticked triggers do the same to these blocks (their delays stay as they are)
  if (copying) copyBar(() => {
    const src = groups.get(copyFrom.tr)[0].actions || [];
    copyFrom.to.forEach(tr => groups.get(tr).forEach(l => { l.actions = JSON.parse(JSON.stringify(src)); }));
  });
}
let dragStep = null;
function actionBox(link, a, j, target, saved = save, steps = false) {
  const box = el('div', { className:'p-action' });
  if (steps) {                                   // Jos: drag the steps to choose what goes first, second, and so on
    box.addEventListener('dragover', e => { if (dragStep && dragStep.link === link) { e.preventDefault(); box.classList.add('drop'); } });
    box.addEventListener('dragleave', () => box.classList.remove('drop'));
    box.addEventListener('drop', e => {
      e.preventDefault(); box.classList.remove('drop');
      if (!dragStep || dragStep.link !== link || dragStep.j === j) return;
      const [moved] = link.actions.splice(dragStep.j, 1);
      link.actions.splice(j, 0, moved);
      dragStep = null; saved(); renderPanel();
    });
  }
  box.append(row(steps ? 'Step ' + (j + 1) : 'Do', pick([['', '—'], ['size', 'Change size'], ['move', 'Movement'], ['props', 'Change properties']],
    a.do, v => {
      a.do = v;
      if (v === 'size' && a.size === undefined) a.size = 2;
      if (v === 'move') { a.dir = a.dir || 'up'; a.n = a.n || 1; a.speed = a.speed || 1; }   // Jos: starts on up, 1, speed 1
      if (v === 'props' && !a.props) {
        const tp = props(target);
        a.props = {};
        (SWITCHES[target.t] || []).filter(k => k !== 'disguise').forEach(k => { a.props[k] = !!tp[k]; });
      }
      saved(); renderPanel();
    }),
    el('button', { className:'p-x', textContent:'🗑', title:'Remove',
                   onclick:() => { link.actions.splice(j, 1); saved(); renderPanel(); } })));
  if (steps) {
    const grip = el('span', { className:'p-grip', textContent:'⠿', title:'Drag to change the order', draggable:true });
    grip.addEventListener('dragstart', e => { dragStep = { link, j }; e.dataTransfer.setData('text/plain', 'step'); e.dataTransfer.effectAllowed = 'move'; });
    grip.addEventListener('dragend', () => { dragStep = null; document.querySelectorAll('.p-action.drop').forEach(b => b.classList.remove('drop')); });
    box.firstChild.prepend(grip);
  }
  if (steps && a.do) box.append(row('Wait after', number(a.wait || 0, 0, 30, .1, v => { a.wait = v; saved(); }),
                                    el('span', { className:'p-or', textContent:'seconds' })));   // Jos (9 Nov): a delay between every step
  if (a.do === 'size') box.append(row('New size', number(a.size, .5, 6, .5, v => { a.size = v; saved(); })));
  if (a.do === 'move') {
    box.append(row('Go', pick([['left', 'Left'], ['right', 'Right'], ['up', 'Up'], ['down', 'Down']], a.dir,
                              v => { a.dir = v; saved(); })));
    box.append(row('How many blocks', number(a.n, 1, 31, 1, v => { a.n = v; saved(); })));
    box.append(row('Speed', number(a.speed, 1, 50, 1, v => { a.speed = v; saved(); })));
  }
  if (a.do === 'props') {
    box.append(el('div', { className:'p-mini', textContent:'New properties' }));
    const keys = Object.keys(a.props || {});
    if (!keys.length) box.append(el('p', { className:'p-note', textContent:'This block has no properties to change.' }));
    keys.forEach(k => box.append(toggle(LABEL[k], a.props[k], v => { a.props[k] = v; tieBall(a.props, k, v); saved(); renderPanel(); })));
  }
  return box;
}

/* ---------- keys ---------- */
const keys = {};
addEventListener('keydown', e => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
  if (play && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (!play && !typing && e.code === 'Space') e.preventDefault();
  if (play && e.code === 'Escape') playAll ? setPaused(!paused) : stopTest();
  if (!play && !playAll && !typing) {
    if (tool === 'select' && sel.size && (e.code === 'Delete' || e.code === 'Backspace')) {
      e.preventDefault(); deleteSelected();
    }
    if (e.code === 'Escape' && zoomBoxEl) closeZoom();
    else if (e.code === 'Escape' && camPick) endCamPick();
    else if (e.code === 'Escape') { if (sel.size || linkFrom.length) setTool(tool); else closePanel(); }
    const secret = secretKey(e);
    if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !secret) turnKey();
  }
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); });

/* ---------- Jos: a secret word. Type "advanced" (or "editor") to show the advanced commands ----------
   (they were called editor commands until 8 Nov). A Beginner level keeps them off and an Advanced level keeps them on. */
const SECRETS = ['advanced', 'editor'];
let typed = '', editorOn = localStorage.getItem('jos-ldlc-editor') === '1';
let startPos = LDLC.read(LDLC.key('start', levelId));   // Jos's Start pos (each level has its own)
function saveStart() { if (playAll) return; localStorage.setItem(LDLC.key('start', levelId), JSON.stringify(startPos)); }
function showEditor() {
  document.getElementById('editorCmds').hidden = !editorOn;
  document.querySelector('.block[data-id=startpos]').style.display = editorOn ? '' : 'none';
  if (!editorOn && chosen === 'startpos') { chosen = 'tile'; refreshButtons(); }
  // Jos: off means off on the blocks too: the editor buttons in their properties go (and a
  // half-done Do same with other triggers is cancelled)
  if (!editorOn) copyFrom = null;
  if (openId || openIds) renderPanel();
}
function secretKey(e) {             // true when this key finishes the secret word
  if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return false;
  typed = (typed + e.key.toLowerCase()).slice(-8);
  if (!SECRETS.some(w => typed.endsWith(w))) return false;
  typed = '';
  if (difficulty !== 'regular') {
    say(difficulty === 'beginner' ? 'Advanced commands are off in a Beginner level' : 'Advanced commands stay on in an Advanced level');
    return true;
  }
  editorOn = !editorOn;
  localStorage.setItem('jos-ldlc-editor', editorOn ? '1' : '');
  showEditor();
  say(editorOn ? '🛠 Advanced commands on' : 'Advanced commands off');
  return true;
}
let editorPick = localStorage.getItem('jos-ldlc-pick') || 'out';
const pickBtns = document.querySelectorAll('#pickInOut button');
function showPick() { pickBtns.forEach(b => b.classList.toggle('on', b.dataset.pick === editorPick)); }
pickBtns.forEach(b => b.addEventListener('click', () => {
  editorPick = b.dataset.pick;
  localStorage.setItem('jos-ldlc-pick', editorPick);
  showPick();
}));
showPick();
document.getElementById('editorBtn').addEventListener('click', () => {
  const list = document.getElementById('editorList');
  list.hidden = !list.hidden;
});
showEditor();

/* ---------- TEST: play your own level ---------- */
const testBtn = document.getElementById('testBtn');
const deathsEl = document.getElementById('deaths');
let play = null, deaths = 0, bits = [];

testBtn.addEventListener('click', () => { play ? stopTest() : startTest(); testBtn.blur(); });

function startTest() {
  if (chomp) return;
  if (!find('hero')) { say('Put a Hero in first 😈'); return; }
  // the devil closes his mouth over the creator, and opens it onto your level
  startChomp(() => {
    deaths = 0;
    deathsEl.textContent = '💀 0';
    hideBanner();
    spawn();
    play.state = 'intro';         // nothing moves until his mouth is open
    document.body.classList.add('testing');
    fit();
  }, letsGo);
}
function letsGo() {
  if (!play) return;
  play.state = 'play';
  if (play.things.some(t => t.t === 'coin' && t.pr.needed)) play.devil = { t:0, words:'A coin is hidden' };
}
/* PLAY: you got to the door, so the devil's mouth closes and opens onto the next level */
function nextPlay() {
  if (chomp) return;
  if (playOne) { startChomp(() => { location.href = 'levels.html'; }); return; }   // just one level: done
  startChomp(() => {
    levelId = nextLevel();
    applySize(levelId);
    grid = emptyGrid(); load(); loadEdges(); giveIds(); fixPortals();
    deaths = 0;
    deathsEl.textContent = '💀 0';
    bits = [];
    spawn();
    play.state = 'intro';
    fit();
  }, letsGo);
}
/* when you play, every block becomes a thing that can move, grow and change */
function makeThings() {
  const list = [];
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++)
      stackAt(x, y).reverse().forEach(c => {     // the inside block first, so it's drawn behind
        if (c.t === 'hero') return;
        const pr = props(c);
        list.push({ id:c.id, t:c.t, x, y, w:1, h:1, pr, as:pr.disguise ? (c.as || 'tile') : null,
                    cam:c.cam, cmoving:c.cmoving, cdir:c.cdir, cspeed:c.cspeed, coff:c.coff,
                    links:c.links || [], does:c.does || (c.controls ? [Object.assign({ do:'controls' }, c.controls)] : []), pair:c.pair, r:c.r || 0, out:c.out || '',
                    dx:0, dy:0 });
      });
  return list;
}
/* one hero's own numbers: where he is, how fast, which way gravity pulls him, his controls... (Jos: in an Advanced
   level there can be lots of heroes, and they all do the same thing: press left and every one of them goes left) */
function heroState(cell, at) {
  // Jos: the hero starts with the gravity he was given (down, up, left or right), his feet on that side of his square
  const gd = GDIRS[cell.gravity] ? cell.gravity : 'down', [bw, bh] = heroBox({ gdir:gd });
  const px = gd === 'left' ? at.x : gd === 'right' ? at.x + 1 - bw : at.x + (1 - bw) / 2;
  const py = gd === 'up' ? at.y : gd === 'down' ? at.y + 1 - bh : at.y + (1 - bh) / 2;
  return { hidden:!props(cell).visible, needed:!!props(cell).needed, inDoor:null, x:px, y:py, vx:0, vy:0, kx:0, ky:0, gdir:gd, ctlHere:new Set(),
           ground:false, face:1, walkT:0, on:null,
           jumpH:cell.jumpH === undefined ? JUMP_H : cell.jumpH, speedPct:cell.speed === undefined ? 100 : cell.speed };
}
function spawn() {
  // every try starts fresh: coins come back, traps reset
  const h = find('hero'), at = !playAll && editorOn && startPos ? startPos : h;   // Jos: the Start pos wins (not in PLAY)
  // the first hero is `play` itself (his numbers sit beside the level's own); any others are in play.others
  play = Object.assign(heroState(h.c, at),
         { fromHero:at === h, state:'play', timer:0, coins:0, things:makeThings(), later:[], cam:{ x:0, y:0, z:1, snap:3 } });
  play.others = allBlocks().filter(f => f.c.t === 'hero' && f.c.id !== h.c.id).map(f => heroState(f.c, f));
  { const [cw, ch] = heroBox(play); play.cam.x = play.x + cw / 2 - viewW / 2; play.cam.y = play.y + ch / 2 - viewH / 2; clampCam(play.cam); }
  play.byId = {};
  play.things.forEach(t => { play.byId[t.id] = t; });
}

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
    document.body.classList.remove('testing');
    fit();
    if (tool === 'select') selectionBanner();
    if (tool === 'link') setTool('link');
  }, () => {                         // back in the creator, the devil's mouth open: anything waiting?
    if (afterTest) { const f = afterTest; afterTest = null; f(); }
  });
}

/* ---------- Send to Jos (Dad's idea). Only a level you have beaten can go ----------
   Grey until you get to the door in TEST, starting from the Hero. Change anything and it is grey
   again. Beat it and, back in the creator, it asks "Would you like to send it to Jos?". */
// var, not let: save() can run before this part of the file has
var afterTest = null;                // something to do once you are back in the creator
var wasReady = null;
function refreshSend() {
  const b = document.getElementById('sendBtn');
  if (!b || playAll) return;
  const ready = LDLC.beaten(levelId);
  b.classList.toggle('off', !ready);
  b.parentNode.querySelector('.tip').classList.toggle('show', !ready);   // grey: a bubble on hover
  if (ready && wasReady === false) {                 // it just lit up: a little bounce so you notice
    b.classList.remove('ready'); void b.offsetWidth; b.classList.add('ready');
  }
  wasReady = ready;
}
const levelName = () => (LDLC.list().find(x => x.id === levelId) || { name:'' }).name;
/* Jos (9 Nov): Copy link, next to Test. It works even if the level hasn't been sent: the whole level is inside the link.
   Open it on another device and it asks to add the level to My levels. From localhost the link goes to the real site. */
document.getElementById('copyLinkBtn').addEventListener('click', async e => {
  e.currentTarget.blur();
  const local = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);
  const base = local ? 'https://rawsonvault.com/jos/ldlc/levels.html' : new URL('levels.html', location.href).href;
  const link = base + '#get=' + await LDLC.pack(levelId, levelName(), '');
  try { await navigator.clipboard.writeText(link); }
  catch (err) { const t = document.createElement('textarea'); t.value = link; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  say('🔗 Link copied! Paste it on another device');
});
document.getElementById('sendBtn').addEventListener('click', e => {
  e.currentTarget.blur();
  if (play || chomp) return;
  if (!LDLC.beaten(levelId)) { say('You have to beat it in order to send it 😈'); return; }
  LDLCSend.open(levelId, levelName(), refreshSend);
});
function beatLevel() {
  save(); saveEdges();               // what gets sent is exactly what you just beat
  const fresh = !LDLC.beaten(levelId);
  LDLC.markBeaten(levelId);
  refreshSend();
  // the first time since a change: ask (Jos: no LEVEL COMPLETE while you play, so it waits till you're back)
  if (fresh) afterTest = () => LDLCSend.wellDone(levelId, levelName(), refreshSend);
}
document.getElementById('editBtn').addEventListener('click', e => { stopTest(); e.target.blur(); });
document.getElementById('restartBtn').addEventListener('click', e => {
  if (play && !chomp) spawn();
  e.target.blur();
});

/* ---------- Jos: a Needed coin on the board, and the devil pops up over the whole board.
   Words fade in: A coin is hidden. When you get the coin he comes back: Noooooo ---------- */
const DEVIL = { pop:.3, words:.45, gone:2.3, done:2.6 };
// what he says when you get a Needed coin: a different one each time (the first three are Jos's)
const DEVIL_WORDS = ['Noooooo', 'My door!', 'The coin!', 'Give it back!', 'Not fair!',
                     'How did you find it?!', 'That was MY coin!', 'Grrrrr!', 'Impossible!', 'Next time…'];
let lastWords = '';
function devilWords() {             // never the same one twice in a row
  const choices = DEVIL_WORDS.filter(w => w !== lastWords);
  return lastWords = choices[Math.floor(Math.random() * choices.length)];
}
function drawDevil(c, d) {
  const W = viewPx.w, H = viewPx.h, t = d.t;
  const back = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;      // a bit too big, then settles
  const k = t < DEVIL.pop ? back(t / DEVIL.pop) : t > DEVIL.gone ? 1 - (t - DEVIL.gone) / (DEVIL.done - DEVIL.gone) : 1;
  c.save();
  c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-W / 2, -H / 2);
  c.fillStyle = '#3a000c'; c.fillRect(0, 0, W, H);
  c.fillStyle = COL.tile;                                              // horns
  [[.2, 1], [.8, -1]].forEach(([hx, f]) => {
    c.beginPath();
    c.moveTo(W * hx - f * W * .07, H * .2);
    c.quadraticCurveTo(W * hx - f * W * .06, H * .06, W * hx - f * W * .1, H * .02);
    c.quadraticCurveTo(W * hx + f * W * .03, H * .08, W * hx + f * W * .03, H * .2);
    c.fill();
  });
  [W * .32, W * .68].forEach((ex, i) => devilEye(c, ex, H * .26, W * .13, i));
  const mx = W * .22, mw = W * .56, my = H * .74, mh = H * .16, n = 8, tw = mw / n;   // the grin
  c.fillStyle = '#000'; roundRect(c, mx, my, mw, mh, mh * .3); c.fill();
  c.fillStyle = '#f2f2f2';
  for (let i = 0; i < n; i++) {
    c.beginPath(); c.moveTo(mx + i * tw, my); c.lineTo(mx + (i + .5) * tw, my + mh * .45); c.lineTo(mx + (i + 1) * tw, my); c.fill();
    c.beginPath(); c.moveTo(mx + i * tw, my + mh); c.lineTo(mx + (i + .5) * tw, my + mh * .55); c.lineTo(mx + (i + 1) * tw, my + mh); c.fill();
  }
  // the words fade in, as wide as they can go
  c.globalAlpha = Math.max(0, Math.min(1, (t - DEVIL.words) / .4));
  c.font = "100px 'Fredoka One', cursive";
  const size = Math.min(H * .24, 100 * W * .8 / c.measureText(d.words).width);
  c.font = size + "px 'Fredoka One', cursive";
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = '#ff2a3d'; c.shadowBlur = 24;
  c.fillStyle = '#fff'; c.fillText(d.words, W / 2, H * .55);
  c.restore();
}

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
function devilEye(c, x, y, ew, flip) {
  const eh = ew * .55;
  c.save();
  c.translate(x, y);
  c.scale(flip ? -1 : 1, 1);                  // the right eye is the left one flipped
  c.shadowColor = '#ff2a3d'; c.shadowBlur = 30;
  c.fillStyle = '#ff2a3d';
  c.beginPath();                              // an angry eye: flat bottom, slanted top
  c.moveTo(-ew / 2, -eh * .25);
  c.lineTo(ew / 2, eh * .35);
  c.quadraticCurveTo(ew / 2, eh, 0, eh);
  c.quadraticCurveTo(-ew / 2, eh, -ew / 2, -eh * .25);
  c.fill();
  c.restore();
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
  if (eyesOn) [W * .32, W * .68].forEach((ex, i) => devilEye(c, ex, H * .26 - gap, W * .13, i));

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

/* ---------- portals come in pairs ----------
   Jos: like Marble Run Builder, a portal needs a partner. The 1st and 2nd portals you put
   down are a pair, then the 3rd and 4th. Delete one and its partner waits for a new one. */
function fixPortals() {
  const portals = allBlocks().map(f => f.c).filter(c => c.t === 'portal').sort((a, b) => a.id - b.id);
  portals.forEach(c => {
    const q = portals.find(o => o.id === c.pair);
    if (!q || q.pair !== c.id) c.pair = null;
  });
  let waiting = null;
  portals.forEach(c => {
    if (c.pair) return;
    if (waiting) { waiting.pair = c.id; c.pair = waiting.id; waiting = null; }
    else waiting = c;
  });
}
/* Jos: Show trigger connections, right under Show portal connections */
const triggerSwitch = document.getElementById('triggerLinks');
try { triggerSwitch.checked = localStorage.getItem('jos-ldlc-trigger-links') === '1'; } catch (e) {}
triggerSwitch.addEventListener('change', () => {
  try { localStorage.setItem('jos-ldlc-trigger-links', triggerSwitch.checked ? '1' : '0'); } catch (e) {}
});
const portalSwitch = document.getElementById('portalLinks');
try { portalSwitch.checked = localStorage.getItem('jos-ldlc-portal-links') === '1'; } catch (e) {}
portalSwitch.addEventListener('change', () => {
  try { localStorage.setItem('jos-ldlc-portal-links', portalSwitch.checked ? '1' : '0'); } catch (e) {}
});

/* ---------- playing: blocks move, grow and change when a trigger fires ---------- */
function boxesTouch(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function touching(x, y, w, h, fn) {
  for (const t of play.things) if (!t.gone && boxesTouch(x, y, w, h, t.x, t.y, t.w, t.h)) fn(t);
}
function fire(t) {
  if (t.fired) return;            // a trigger goes off once per try
  t.fired = true;
  t.links.forEach(l => {
    // Jos: a delay, so a trap can go off a bit after you cross the trigger
    if (l.delay > 0) play.later.push({ left:l.delay, l });
    else doLink(l);
  });
}
function applyAction(g, a) {
  if (a.do === 'size') g.grow = { from:g.w, to:a.size || 1, t:0 };
  if (a.do === 'move') {
    // a distance to travel, not a spot to reach, so it still works if it grows too
    const d = DIRS[a.dir || 'up'];
    g.move = { dx:d[0], dy:d[1], left:a.n || 1, v:(a.speed || 1) * T.moveSpeed };
  }
  if (a.do === 'props') g.pr = Object.assign({}, g.pr, a.props || {});
}
function doLink(l) {
  const g = play.byId[l.id];
  if (!g) return;
  (l.actions || []).forEach(a => applyAction(g, a));
}
/* Jos (8 Nov): the repeating trigger. Its steps are done one after another, in the order you put them, and then it starts
   again from the first, over and over. A step is done when its block has finished moving or growing. Each connected block
   goes round on its own. A Change properties step takes half a second, so a loop of only those doesn't flicker. */
function fireRepeat(t) {
  if (t.fired) return;
  t.fired = true;
  t.links.forEach(l => {
    if (l.delay > 0) play.later.push({ left:l.delay, l, loop:true });
    else startLoop(l);
  });
}
function startLoop(l) {
  const g = play.byId[l.id], steps = (l.actions || []).filter(a => a.do);
  if (!g || !steps.length) return;
  g.loop = { steps, i:0, wait:0 };
  nextStep(g);
}
function nextStep(g) {
  const L = g.loop, a = L.steps[L.i];
  L.i = (L.i + 1) % L.steps.length;
  applyAction(g, a);
  L.wait = (a.do === 'props' ? .5 : 0) + (a.wait || 0);   // Jos (9 Nov): each step can Wait before the next one starts
}
function moveThings(dt) {
  play.things.forEach(t => {
    const ox = t.x, oy = t.y;
    if (t.grow) {
      t.grow.t += dt;
      const k = Math.min(1, t.grow.t / .25), s = t.grow.from + (t.grow.to - t.grow.from) * k;
      const mid = t.x + t.w / 2, bottom = t.y + t.h;        // it grows from its bottom middle
      t.w = t.h = s; t.x = mid - s / 2; t.y = bottom - s;
      if (k >= 1) t.grow = null;
    }
    if (t.move) {
      const go = Math.min(t.move.left, t.move.v * dt);
      t.x += t.move.dx * go; t.y += t.move.dy * go;
      t.move.left -= go;
      if (t.move.left <= 0) t.move = null;
    }
    if (t.loop && !t.move && !t.grow) { if (t.loop.wait > 0) t.loop.wait -= dt; else nextStep(t); }   // the wait only counts once the step has finished   // the next step of a repeating trigger
    t.dx = t.x - ox; t.dy = t.y - oy;
    if (t.ext !== undefined) { t.ext += dt; if (t.ext > .5) t.ext = undefined; }
    if (t.wait) { t.wait.t += dt; if (t.wait.t > DOOR_WAIT_END) t.wait = null; }
  });
}

/* Jos (8 Nov): gravity can point down (normal), up, left or right.
   Sideways, the hero falls along x, runs along y (← runs up, → runs down) and jumps away from the wall.
   He is turned so his feet are on the floor, which means his box is wide and short the other way. */
const GDIRS = { down:[0, 1], up:[0, -1], left:[-1, 0], right:[1, 0] };
const GANGLE = { down:0, up:Math.PI, left:Math.PI / 2, right:-Math.PI / 2 };
const GNAMES = [['down', 'Down'], ['up', 'Up'], ['left', 'Left'], ['right', 'Right']];
function heroBox(p) {                         // [width, height] of his box in the level
  return p.gdir === 'left' || p.gdir === 'right' ? [T.heroH, T.heroW] : [T.heroW, T.heroH];
}
function setGravity(p, dir) {                 // he turns round the middle of his box, and stops
  if (p.gdir === dir) return;
  const [w0, h0] = heroBox(p), cx = p.x + w0 / 2, cy = p.y + h0 / 2;
  p.gdir = dir;
  const [w1, h1] = heroBox(p);
  p.x = cx - w1 / 2; p.y = cy - h1 / 2;
  p.vx = p.vy = 0; p.kx = p.ky = 0; p.ground = false; p.on = null; p.dash = null;
}
/* an Edit controls block does what its Do list says, once, when he touches it */
function applyDoes(p, does) {
  does.forEach(a => {
    if (a.do === 'controls') p.controls = Object.assign({}, BLOCK_CONTROLS, { jumpH:undefined, speed:undefined }, a);
    if (a.do === 'gravity' && GDIRS[a.dir]) setGravity(p, a.dir);
  });
}

/* ---------- Jos's ball and hill (8 Nov) ----------
   A ball with Gravity on falls the way the hero falls, bounces and rolls down hills. Without Gravity it just sits
   there (a trigger's Movement still carries it, and when that is over it falls). Crush deadly: if it falls on his
   head he dies; touching his side or top does nothing, it just bounces off him. */
const BALL_R = .42, BALL_BOUNCE = .5, BALL_FALL = 30;
function rectPoly(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function hillPoly(t) {                       // a slope: half a block, cut corner to corner
  const x = t.x, y = t.y, w = t.w, h = t.h, r = t.r || 0;
  if (r === 1) return [[x, y + h], [x + w, y + h], [x, y]];
  if (r === 2) return [[x, y], [x + w, y], [x, y + h]];
  if (r === 3) return [[x, y], [x + w, y], [x + w, y + h]];
  return [[x, y + h], [x + w, y + h], [x + w, y]];
}
/* does a circle touch a flat-sided shape? { nx, ny, depth }: push it that way, that far, to get it out */
function circlePoly(cx, cy, r, poly) {
  const n = poly.length; let mx = 0, my = 0;
  poly.forEach(q => { mx += q[0] / n; my += q[1] / n; });
  let dmin = Infinity, qx = 0, qy = 0, ex = 0, ey = 0, inside = true;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], abx = b[0] - a[0], aby = b[1] - a[1];
    const k = Math.max(0, Math.min(1, ((cx - a[0]) * abx + (cy - a[1]) * aby) / (abx * abx + aby * aby)));
    const px = a[0] + abx * k, py = a[1] + aby * k, d = Math.hypot(cx - px, cy - py);
    let nx = aby, ny = -abx; const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    if (nx * (a[0] - mx) + ny * (a[1] - my) < 0) { nx = -nx; ny = -ny; }       // pointing out, away from the middle
    if ((cx - a[0]) * nx + (cy - a[1]) * ny > 0) inside = false;
    if (d < dmin) { dmin = d; qx = px; qy = py; ex = nx; ey = ny; }
  }
  if (inside) return { nx:ex, ny:ey, depth:r + dmin };
  if (dmin >= r) return null;
  return { nx:(cx - qx) / (dmin || 1e-9), ny:(cy - qy) / (dmin || 1e-9), depth:r - dmin };
}
/* Jos (9 Nov): a ball with "Go through portals and use triggers" on sets off triggers, repeating triggers and buttons, and
   goes in one portal and comes out of its partner (on the Output side, or out of the bottom) */
function ballUse(b) {
  let inP = null;
  play.things.forEach(t => {
    if (t === b || t.gone || !t.pr.action) return;
    if (t.t === 'trigger' && boxesTouch(b.x, b.y, b.w, b.h, t.x, t.y, t.w, t.h)) fire(t);
    if (t.t === 'repeater' && boxesTouch(b.x, b.y, b.w, b.h, t.x, t.y, t.w, t.h)) fireRepeat(t);
    if (t.t === 'button') {
      const pb = turnBox([.14, .5, .72, .5], t.r);
      if (pb && boxesTouch(b.x, b.y, b.w, b.h, t.x + pb[0] * t.w, t.y + pb[1] * t.h, pb[2] * t.w, pb[3] * t.h)) { t.pressed = true; fire(t); }
    }
    if (t.t === 'portal' && boxesTouch(b.x, b.y, b.w, b.h, t.x + .2 * t.w, t.y + .2 * t.h, .6 * t.w, .6 * t.h)) inP = t;
  });
  if (!inP) { b.portalLock = null; return; }
  if (inP.id === b.portalLock) return;
  const out = play.byId[inP.pair];
  if (!out) return;
  const dir = out.out || 'down', d = DIRS[dir] || DIRS.down;
  b.x = out.x + (out.w - b.w) / 2 + d[0] * (out.w + b.w) / 2;
  b.y = out.y + (out.h - b.h) / 2 + d[1] * (out.h + b.h) / 2;
  b.bvx = d[0] * (dir === 'down' ? 0 : T.portalSpit); b.bvy = d[1] * (dir === 'down' ? 0 : T.portalSpit);
  b.portalLock = out.id;
}
function stepBalls(dt) {                     // true if one of them killed the hero
  const p = play, G = GDIRS[p.gdir], heroes = [p].concat(p.others || []);
  const balls = p.things.filter(t => t.t === 'ball' && !t.gone);
  if (!balls.length) return false;
  let killed = false;
  balls.forEach(b => {
    if (killed) return;
    if (b.pr.triggers) ballUse(b);
    if (!(b.pr.gravity || b.pr.crush) || b.move) { b.bvx = b.bvy = 0; return; }   // Crush deadly means Gravity too
    b.bvx = b.bvx || 0; b.bvy = b.bvy || 0;
    const r = BALL_R * b.w;
    let cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const shapes = p.things.filter(t => t !== b && !t.gone && t.pr.collision && t.t !== 'ball')
                           .map(t => t.t === 'hill' ? hillPoly(t) : rectPoly(t.x, t.y, t.w, t.h));
    const STEPS = 4, h = dt / STEPS;
    const bounce = vn => -vn > 2 ? BALL_BOUNCE : 0;                    // a gentle landing doesn't bounce
    for (let k = 0; k < STEPS && !killed; k++) {
      b.bvx += G[0] * T.gravity * h; b.bvy += G[1] * T.gravity * h;
      const along = b.bvx * G[0] + b.bvy * G[1];
      if (along > BALL_FALL) { b.bvx -= G[0] * (along - BALL_FALL); b.bvy -= G[1] * (along - BALL_FALL); }
      cx += b.bvx * h; cy += b.bvy * h;
      let nx0 = 0, ny0 = 0, touched = false;
      // the edges of the level: solid ones are walls, the others let it fall out of the level
      const wall = (solid, over, nx, ny, fix) => {
        if (over) { if (solid) { fix(); const vn = b.bvx * nx + b.bvy * ny; if (vn < 0) { const e = bounce(vn); b.bvx -= (1 + e) * vn * nx; b.bvy -= (1 + e) * vn * ny; } nx0 = nx; ny0 = ny; touched = true; } }
      };
      wall(edges.left === 'solid',   cx - r < 0,        1, 0, () => { cx = r; });
      wall(edges.right === 'solid',  cx + r > T.cols, -1, 0, () => { cx = T.cols - r; });
      wall(edges.top === 'solid',    cy - r < 0,        0, 1, () => { cy = r; });
      wall(edges.bottom === 'solid', cy + r > T.rows,   0, -1, () => { cy = T.rows - r; });
      if (cx < -r || cx > T.cols + r || cy < -r || cy > T.rows + r) { b.gone = true; return; }
      for (const shape of shapes) {
        const hit = circlePoly(cx, cy, r, shape);
        if (!hit) continue;
        cx += hit.nx * hit.depth; cy += hit.ny * hit.depth;
        const vn = b.bvx * hit.nx + b.bvy * hit.ny;
        if (vn < 0) { const e = bounce(vn); b.bvx -= (1 + e) * vn * hit.nx; b.bvy -= (1 + e) * vn * hit.ny; }
        nx0 = hit.nx; ny0 = hit.ny; touched = true;
      }
      if (touched) {                                                   // a little rolling friction along what it touches
        const vn = b.bvx * nx0 + b.bvy * ny0, f = Math.max(0, 1 - .6 * h);
        b.bvx = nx0 * vn + (b.bvx - nx0 * vn) * f; b.bvy = ny0 * vn + (b.bvy - ny0 * vn) * f;
      }
      // the hero: crush him from above, or just bounce off him
      for (const hp of heroes) {
        const [hw, hh] = heroBox(hp), hit = circlePoly(cx, cy, r, rectPoly(hp.x, hp.y, hw, hh));
        if (!hit) continue;
        const onHead = hit.nx * -G[0] + hit.ny * -G[1] > .5, falling = b.bvx * G[0] + b.bvy * G[1];
        if (b.pr.crush && onHead && falling > 1.5) { die(); killed = true; return; }
        cx += hit.nx * hit.depth; cy += hit.ny * hit.depth;
        const rx = b.bvx - (hp.vx + hp.kx), ry = b.bvy - (hp.vy + hp.ky), vn = rx * hit.nx + ry * hit.ny;
        if (vn < 0) { b.bvx -= (1 + BALL_BOUNCE) * vn * hit.nx; b.bvy -= (1 + BALL_BOUNCE) * vn * hit.ny; }
      }
    }
    b.x = cx - b.w / 2; b.y = cy - b.h / 2;
  });
  return killed;
}

/* the camera: it follows the hero and is kept inside the level, until he touches a Camera position block:
   - a position chosen: the camera glides over to it and stays there
   - Moving: the camera slides the way the block says, at its speed (and if "If off screen, die" is on, he dies off the screen)
   - nothing chosen and not moving: the camera goes back to following him
   It only matters in a level bigger than the screen: in a smaller one the whole level is already on the screen. */
function applyCamera(p, t) {
  const c = p.cam;
  if (t.cmoving) { c.mode = 'moving'; c.dir = t.cdir || 'right'; c.speed = t.cspeed || 3; c.offDie = !!t.coff; }
  else if (t.cam) { c.mode = 'point'; c.tx = t.cam.x + .5; c.ty = t.cam.y + .5; c.offDie = false; }
  else { c.mode = 'follow'; c.offDie = false; }
}
function updateCam(dt) {
  const p = play, c = p && p.cam;
  if (!c) return;
  const all = [p].concat(p.others || []), inPlay = all.filter(h => !h.inDoor), heroes = inPlay.length ? inPlay : all;
  const centre = h => { const [w, ht] = heroBox(h); return [h.x + w / 2, h.y + ht / 2]; };
  if (c.mode === 'moving') {
    const d = DIRS[c.dir] || DIRS.right, z = c.z || 1;
    c.z = z + (1 - z) * Math.min(1, dt * 4);
    c.x += d[0] * c.speed * dt; c.y += d[1] * c.speed * dt;
    clampCam(c);
    if (c.offDie && p.state === 'play' && all.some(h => {
      const [x, y] = centre(h);
      return x < c.x || x > c.x + viewW / c.z || y < c.y || y > c.y + viewH / c.z;
    })) die();
    return;
  }
  let tz = 1, tx, ty;
  if (c.mode === 'point') {
    tx = c.tx; ty = c.ty;
  } else {
    // Jos (8 Nov): with no Camera position, the camera follows the hero (or heroes), and zooms out if they spread out,
    // so they are all on the screen
    const pts = heroes.map(centre), xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 2.5;
    const zMin = Math.min(1, viewW / T.cols, viewH / T.rows);                       // the whole level on the screen
    tz = Math.max(zMin, Math.min(1, viewW / (x1 - x0 + 2 * pad), viewH / (y1 - y0 + 2 * pad)));
    tx = (x0 + x1) / 2; ty = (y0 + y1) / 2;
  }
  const snap = c.snap > 0;
  c.z = snap ? tz : (c.z || 1) + (tz - (c.z || 1)) * Math.min(1, dt * 4);
  const vw = viewW / c.z, vh = viewH / c.z;
  const f = snap ? 1 : Math.min(1, dt * (c.mode === 'point' ? 3 : 8));
  if (snap) c.snap--;
  c.x += (tx - vw / 2 - c.x) * f; c.y += (ty - vh / 2 - c.y) * f;
  clampCam(c);
}

function step(dt) {
  const p = play;
  if (p.devil) {                  // everything waits while the devil is on the screen
    p.devil.t += dt;
    if (p.devil.t > DEVIL.done) p.devil = null;
    return;
  }
  moveThings(dt);
  if (p.state === 'intro') return;
  if (p.state === 'dead') {
    p.timer -= dt;
    if (p.timer <= 0) spawn();
    return;
  }
  if (p.state === 'won') {
    p.wonT += dt;
    if (p.wonT > DOOR.shut + DOOR.sink + 0.3) playAll ? nextPlay() : stopTest();   // Jos: no LEVEL COMPLETE message
    return;
  }

  // delayed connections go off when their time is up
  p.later = p.later.filter(d => { d.left -= dt; if (d.left > 0) return true; if (d.loop) startLoop(d.l); else doLink(d.l); return false; });
  // Jos: the door goes down at the start, and comes up again when the Needed coins are collected
  const locked = p.things.some(t => t.t === 'coin' && t.pr.needed && !t.gone);
  p.things.forEach(t => {
    if (t.t === 'door') t.sink = Math.max(0, Math.min(1, (t.sink || 0) + (locked ? dt : -dt) / DOOR.sink));
  });

  if (stepBalls(dt)) return;
  heroStep(p, dt);
  (p.others || []).forEach(h => heroStep(h, dt));
}

/* one hero's turn. Everything shared (the things, the state, the door, the camera) is in `play`. */
function heroStep(p, dt) {
  if (play.state !== 'play' || p.inDoor) return;
  const G = GDIRS[p.gdir], [W, H] = heroBox(p);
  // Jos's hill is a slope when gravity pulls down. Any other way (or a hill turned onto the ceiling), it is a plain block.
  const slopes = G[0] === 0 && G[1] > 0;
  const solid = t => t.pr.collision && !(slopes && t.t === 'hill' && (t.r || 0) < 2);
  // ride along on whatever you're standing on
  if (p.on && p.ground) { p.x += p.on.dx; p.y += p.on.dy; }
  // a moving block that runs into you pushes you out of the way
  touching(p.x, p.y, W, H, t => {
    if (!solid(t)) return;
    const l = p.x + W - t.x, r = t.x + t.w - p.x, u = p.y + H - t.y, d = t.y + t.h - p.y;
    const m = Math.min(l, r, u, d);
    if (m === l) p.x -= l; else if (m === r) p.x += r; else if (m === u) p.y -= u; else p.y += d;
  });

  const ctl = p.controls || CONTROLS;
  const held  = list => list.some(k => keys[k]);
  const left  = held(ctl.left);
  const right = held(ctl.right);
  const up    = held(ctl.up);
  // sideways gravity: he falls along x and runs along y. gs = which way he falls along his falling axis.
  const horiz = G[0] !== 0, gs = horiz ? G[0] : G[1];
  const gravStep = p.gravStep; p.gravStep = false;

  const upNew = up && !p.upWas;      // jump pressed just now (a dash orb needs a new press)
  p.upWas = up;
  let run = 0;
  if (p.dash && !up) {               // Jos's dash orb: let go and you fall again, still flying a bit
    p.vy = p.dash[1] * T.dash * .5; p.kx = p.dash[0] * T.dash * .4; p.booted = true;
    p.dash = null;
  }
  if (p.dash) {                      // dashing: a straight line the way the arrow points, no falling
    p.vx = p.dash[0] * T.dash; p.vy = p.dash[1] * T.dash; p.kx = 0; p.ky = 0;
    if (p.vx) p.face = Math.sign(p.vx);
    bits.push({ x:p.x + W / 2, y:p.y + H / 2, vx:-p.vx * .1, vy:-p.vy * .1, life:.25, col:'#7dff6a' });
  } else {
    const speedPct = ctl.speed === undefined ? p.speedPct : ctl.speed;   // the hero's own Speed, or an Edit controls block's
    run = (ctl.auto || ((right ? 1 : 0) - (left ? 1 : 0))) * T.speed * speedPct / 100;
    if (horiz) p.vy = run; else p.vx = run;                            // the way he runs
    if (run) p.face = Math.sign(run);
    // Jos: Jump power is how high he jumps, in blocks, and every jump goes exactly that high (no smaller hops)
    const jumpH = ctl.jumpH === undefined ? p.jumpH : ctl.jumpH;
    if (up && p.ground) {                                              // straight away from the floor
      const v = Math.sqrt(2 * T.gravity * jumpH);
      if (horiz) p.vx = -G[0] * v; else p.vy = -G[1] * v;
      p.ground = false; p.booted = false;
    }
    const v0 = horiz ? p.vx : p.vy;
    let v1 = v0 + gs * T.gravity * dt;
    if (v1 * gs > T.maxFall) v1 = gs * T.maxFall;                      // the fastest he can fall
    p.gravStep = v1 === v0 + gs * T.gravity * dt;                      // falling normally this frame
    if (horiz) p.vx = v1; else p.vy = v1;
  }
  p.walkT = (run && p.ground && !p.dash) ? p.walkT + dt : 0;

  // a sideways spring or a portal knocks you along; it dies away
  if (p.kx) { const k = T.knockSlow * dt; p.kx = Math.abs(p.kx) <= k ? 0 : p.kx - Math.sign(p.kx) * k; }
  if (p.ky) { const k = T.knockSlow * dt; p.ky = Math.abs(p.ky) <= k ? 0 : p.ky - Math.sign(p.ky) * k; }
  const mx = p.vx + p.kx, oldX = p.x;
  const wasGround = p.ground;
  p.ground = false; p.on = null;
  // exact for gravity at any frame rate, so a 2 block jump is 2 blocks at 30 or 60 frames a second
  p.x += mx * dt - (horiz && gravStep ? gs * .5 * T.gravity * dt * dt : 0);
  // the walls: solid, or the edge of the screen (Jos: go onto it and you die)
  if (p.x < 0) {
    if (edges.left === 'solid') { p.x = 0; p.kx = 0; if (horiz) { p.vx = 0; if (G[0] < 0) p.ground = true; } }
    else { die(); return; }
  }
  if (p.x + W > T.cols) {
    if (edges.right === 'solid') { p.x = T.cols - W; p.kx = 0; if (horiz) { p.vx = 0; if (G[0] > 0) p.ground = true; } }
    else { die(); return; }
  }
  touching(p.x, p.y, W, H, t => {
    if (!solid(t)) return;
    if (mx > 0) { p.x = t.x - W; if (horiz) { p.vx = 0; if (G[0] > 0) { p.ground = true; p.on = t; } } }
    else if (mx < 0) { p.x = t.x + t.w; if (horiz) { p.vx = 0; if (G[0] < 0) { p.ground = true; p.on = t; } } }
    p.kx = 0;
  });
  // the straight side of a hill is a wall (the slope itself is walked up in the y part below)
  if (slopes) touching(p.x, p.y, W, H, t => {
    if (t.t !== 'hill' || !t.pr.collision || (t.r || 0) > 1) return;
    if (p.y + H <= t.y + .02 || p.y >= t.y + t.h) return;
    if (!t.r && mx < 0) { const wall = t.x + t.w; if (oldX >= wall - .01 && p.x < wall) p.x = wall; }
    if (t.r === 1 && mx > 0) { if (oldX + W <= t.x + .01 && p.x + W > t.x) p.x = t.x - W; }
  });
  // a one way turned on its side: you go through one way, and it stops you coming back
  touching(p.x, p.y, W, H, t => {
    if (t.t !== 'oneway') return;
    if (t.r === 1 && mx < 0) {
      const face = t.x + .9 * t.w;
      if (oldX >= face - .01 && p.x <= face) { p.x = face; p.kx = 0; if (horiz) { p.vx = 0; if (G[0] < 0) { p.ground = true; p.on = t; } } }
    }
    if (t.r === 3 && mx > 0) {
      const face = t.x + .1 * t.w;
      if (oldX + W <= face + .01 && p.x + W >= face) { p.x = face - W; p.kx = 0; if (horiz) { p.vx = 0; if (G[0] > 0) { p.ground = true; p.on = t; } } }
    }
  });

  const my = p.vy + p.ky;
  const oldBottom = p.y + H, oldTop = p.y;
  p.y += my * dt - (!horiz && gravStep ? gs * .5 * T.gravity * dt * dt : 0);
  // landing on the floor on the y axis: only counts as the floor when the floor is on the side gravity pulls toward
  const floorY = t => { if (horiz) p.ky = 0; else { p.vy = 0; if (G[1] > 0) { p.ground = true; p.on = t; } } };
  const ceilY  = t => { if (horiz) p.ky = 0; else { p.vy = 0; if (G[1] < 0) { p.ground = true; p.on = t; } } };
  if (p.y < 0) { if (edges.top === 'solid') { p.y = 0; ceilY(null); } else { die(); return; } }
  touching(p.x, p.y, W, H, t => {
    if (!solid(t)) return;
    if (my > 0) { p.y = t.y - H; floorY(t); }
    else if (my < 0) { p.y = t.y + t.h; ceilY(t); }
  });
  // Jos's hill: he walks up and down it. He keeps hold of the slope going downhill, and not when he jumps.
  if (slopes) touching(p.x, p.y, W, H, t => {
    if (t.t !== 'hill' || !t.pr.collision || (t.r || 0) > 1) return;
    const high = !t.r;                                           // turned 0: high on the right. Turned 1: high on the left
    const foot = high ? Math.min(p.x + W, t.x + t.w) : Math.max(p.x, t.x);   // the foot nearest the high side
    const k = (high ? foot - t.x : t.x + t.w - foot) / t.w;
    const surface = t.y + t.h - k * t.h;
    if (my < 0) { if (oldTop >= t.y + t.h - .05 && p.y < t.y + t.h) { p.y = t.y + t.h; p.vy = 0; } return; }   // bump the flat underside
    if (p.y + H > surface - (wasGround ? .25 : 0) && p.y < t.y + t.h) { p.y = surface - H; p.vy = 0; p.ground = true; p.on = t; }
  });
  // one way: you only land on it coming down from above
  if (my >= 0) {
    touching(p.x, p.y, W, H, t => {
      if (t.t !== 'oneway' || t.r) return;
      const top = t.y + .1 * t.h;
      if (oldBottom <= top + .01 && p.y + H >= top) { p.y = top - H; floorY(t); }
    });
  }
  // upside down: you fall through it, and bump your head on it jumping back up
  if (my < 0) {
    touching(p.x, p.y, W, H, t => {
      if (t.t !== 'oneway' || t.r !== 2) return;
      const bottom = t.y + .9 * t.h;
      if (oldTop >= bottom - .01 && p.y <= bottom) { p.y = bottom; ceilY(t); }
    });
  }

  if (p.y + H > T.rows && edges.bottom === 'solid') { p.y = T.rows - H; floorY(null); }
  if (p.y > T.rows) { die(); return; }
  // a dash that runs into something stops there
  if (p.dash && (p.x - oldX) * p.dash[0] + (p.y - oldTop) * p.dash[1] < T.dash * dt * .5) p.dash = null;

  let inPortal = null;
  p.ctlNow = new Set();
  touching(p.x, p.y, W, H, t => {
    if (play.state !== 'play') return;
    const pr = t.pr;

    if (pr.deadly) {
      let hit;
      if (t.t === 'sawblade' || t.t === 'ball') { // round: only the circle gets you
        const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
        const nx = Math.max(p.x, Math.min(cx, p.x + W)), ny = Math.max(p.y, Math.min(cy, p.y + H));
        hit = Math.hypot(nx - cx, ny - cy) < .42 * t.w;
      } else if (HITBOX[t.t]) {                   // a spike only gets you on the pointy part
        const [bx, by, bw, bh] = turnBox(HITBOX[t.t], t.r);
        hit = boxesTouch(p.x, p.y, W, H, t.x + bx * t.w, t.y + by * t.h, bw * t.w, bh * t.h);
      } else hit = true;
      if (hit) { die(); return; }
    }
    if (t.t === 'spring' && pr.action) {
      // hit the slab: the bar shoots out and boots you the way the spring is facing
      const f = FACING[t.r], [zx, zy, zw, zh] = turnBox([0, .75, 1, .25], t.r);
      const comingIn = (p.vx + p.kx) * f[0] + (p.vy + p.ky) * f[1] <= 0;
      if (comingIn && boxesTouch(p.x, p.y, W, H, t.x + zx * t.w, t.y + zy * t.h, zw * t.w, zh * t.h)) {
        // Jos: strength = how many blocks it boots you. Up or down: the speed that rises that high.
        // On its side: the knock that slides you that far.
        const n = Math.max(1, pr.strength || 5);
        // (with sideways gravity it is the other way round: a side spring boots, an up or down one knocks)
        if (f[1] && !horiz) { p.vy = f[1] * Math.sqrt(2 * T.gravity * n); p.ground = false; p.booted = true; }
        else if (f[1]) p.ky = f[1] * Math.sqrt(2 * T.knockSlow * n);
        else if (horiz) { p.vx = f[0] * Math.sqrt(2 * T.gravity * n); p.ground = false; p.booted = true; }
        else p.kx = f[0] * Math.sqrt(2 * T.knockSlow * n);   // Jos: on its side, it bounces you back
        t.ext = 0;
      }
    }
    if (t.t === 'coin' && pr.action && !t.gone &&
        boxesTouch(p.x, p.y, W, H, t.x + .3 * t.w, t.y + .3 * t.h, .4 * t.w, .4 * t.h)) {
      t.gone = true;
      playCoin();
      if (pr.needed) play.devil = { t:0, words:devilWords() };
      for (let k = 0; k < 8; k++) {
        bits.push({ x:t.x + t.w / 2, y:t.y + t.h / 2, vx:(Math.random() - .5) * 6,
                    vy:-3 - Math.random() * 4, life:.5, col:COL.gold });
      }
    }
    if (t.t === 'controls' && pr.action) {
      if (!p.ctlHere.has(t.id)) applyDoes(p, t.does || []);      // Jos: once, when he touches it
      p.ctlNow.add(t.id);
    }
    if (t.t === 'camera' && pr.action) {
      if (!p.ctlHere.has(t.id)) applyCamera(play, t);                // once, when he touches it
      p.ctlNow.add(t.id);
    }
    // Jos's dash orb: touch it and press jump
    if (t.t === 'dashorb' && pr.action && upNew && !p.dash &&
        boxesTouch(p.x, p.y, W, H, t.x + .1 * t.w, t.y + .1 * t.h, .8 * t.w, .8 * t.h)) {
      p.dash = FACING[facing(t)]; p.ground = false;
    }
    if (t.t === 'trigger' && pr.action) fire(t);
    if (t.t === 'repeater' && pr.action) fireRepeat(t);
    const pb = t.t === 'button' && turnBox([.14, .5, .72, .5], t.r);
    if (pb && boxesTouch(p.x, p.y, W, H, t.x + pb[0] * t.w, t.y + pb[1] * t.h, pb[2] * t.w, pb[3] * t.h)) {
      t.pressed = true;                           // Jos: it goes down when you stand on it
      if (pr.action) fire(t);
    }
    if (t.t === 'portal' && pr.action &&
        boxesTouch(p.x, p.y, W, H, t.x + .2 * t.w, t.y + .2 * t.h, .6 * t.w, .6 * t.h)) inPortal = t;
    if (t.t === 'door' && !t.sink && boxesTouch(p.x, p.y, W, H, t.x + .2 * t.w, t.y + .2 * t.h, .6 * t.w, .8 * t.h)) {
      // Needed heroes: if any hero is marked Needed for finish, only those count, and ALL of them must be in a door.
      const everyone = [play].concat(play.others || []), needed = everyone.filter(h => h.needed);
      if (needed.length && !p.needed) return;                      // this one isn't wanted by the door
      if (needed.length && !needed.every(h => h === p || h.inDoor)) {
        p.inDoor = t; p.vx = p.vy = p.kx = p.ky = 0;                // he goes in and waits for the others
        p.x = t.x + (t.w - W) / 2; p.y = t.y + (t.h - H) / 2;
        t.wait = { t:0 };
        return;
      }
      // pulled into the middle of the door
      play.state = 'won'; play.wonT = 0; play.door = t; play.wonHero = p;   // any hero at any door finishes the level
      if (!playAll && play.fromHero) beatLevel();   // Jos: now it can be sent (not from a Start pos)
      p.gdir = 'down'; p.x = t.x + (t.w - T.heroW) / 2; p.y = t.y + t.h - T.heroH; p.vx = p.vy = 0;
    }
  });

  p.ctlHere = p.ctlNow;

  // portals: step in one, come out of its partner (and don't bounce straight back)
  if (play.state === 'play' && inPortal) {
    if (inPortal.id !== p.portalLock) {
      const out = play.byId[inPortal.pair];
      if (out) p.dash = null;
      if (out) { comeOut(p, out); p.portalLock = out.id; }
    }
  } else p.portalLock = null;
}

/* Jos: you come out of the other portal on its Output side. With no Output, you drop out of the
   bottom, or out of the side if there's a block under it (the way you were running, if it can). */
const G_HORIZ = p => p.gdir === 'left' || p.gdir === 'right';
function comeOut(p, out) {
  const [W, H] = heroBox(p);
  const solid = (x, y) => play.things.some(t => !t.gone && t.pr.collision &&
                                           boxesTouch(x + .1, y + .1, .8, .8, t.x, t.y, t.w, t.h));
  let dir = out.out;
  if (!dir) {
    if (!solid(out.x, out.y + out.h)) dir = 'down';
    else {
      const ahead = p.face < 0 ? 'left' : 'right', back = p.face < 0 ? 'right' : 'left';
      dir = solid(out.x + (ahead === 'right' ? out.w : -1), out.y) ? back : ahead;
    }
  }
  p.x = out.x + (out.w - W) / 2;
  p.vx = p.vy = 0; p.kx = p.ky = 0; p.ground = false;
  if (dir === 'down') { p.y = out.y + out.h; }
  if (dir === 'up')   { p.y = out.y - H; if (G_HORIZ(p)) p.ky = -T.portalSpit; else p.vy = -T.portalSpit; p.booted = true; }
  if (dir === 'left' || dir === 'right') {
    const d = dir === 'right' ? 1 : -1;
    p.x = d > 0 ? out.x + out.w : out.x - W;
    p.y = out.y + out.h - H;
    p.kx = d * T.portalSpit; p.face = d;
  }
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
function heroNow(p = play) {
  const h = T.heroH * cell;
  const frame = !p.ground ? 1 : (p.walkT ? Math.floor(p.walkT / T.stride) % 2 : 0);
  const [bw, bh] = heroBox(p);
  // turned round the middle of his box; he faces the way he runs, and turning upside down mirrors that
  ctx.save();
  ctx.translate((p.x + bw / 2) * cell, (p.y + bh / 2) * cell);
  ctx.rotate(GANGLE[p.gdir]);
  drawHero(ctx, -T.heroW * cell / 2, -T.heroH * cell / 2, h, (p.gdir === 'up' || p.gdir === 'right') ? -p.face : p.face, frame);
  ctx.restore();
}
function springExt(t) {
  if (t === undefined) return 0;
  if (t < .06) return t / .06;        // shoots up
  if (t < .16) return 1;              // holds
  return Math.max(0, 1 - (t - .16) / .3);   // settles back
}
function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function outline(x, y, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w || 2;
  ctx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
}

function render(time) {
  const cam = camNow();
  ctx.fillStyle = '#12000a'; ctx.fillRect(0, 0, viewPx.w, viewPx.h);
  ctx.save();
  const cz = cam.z || 1;
  ctx.scale(cz, cz);
  ctx.translate(-cam.x * cell, -cam.y * cell);              // from here on, everything is drawn where it is in the level
  ctx.fillStyle = '#12000a'; ctx.fillRect(0, 0, cell * T.cols, cell * T.rows);
  if (play) renderPlay(time); else renderEditor(time);
  bits.forEach(b => {
    ctx.fillStyle = b.col || '#fff';
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillRect(b.x * cell - cell * .08, b.y * cell - cell * .08, cell * .16, cell * .16);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
  if (play && play.devil) drawDevil(ctx, play.devil);
}

function renderPlay(time) {
  for (const t of play.things) {
    if (t.gone || !t.pr.visible) continue;       // triggers can't be seen when you play
    const X = t.x * cell, Y = t.y * cell, S = t.w * cell;
    if (play.state === 'won' && play.door === t) {
      drawDoorClosing(ctx, X, Y, S, play.wonT, play.wonHero.hidden ? () => {} : () => heroNow(play.wonHero)); continue;
    }
    if (!t.as && t.t === 'spring') { turn(ctx, X, Y, S, t.r, () => drawSpring(ctx, X, Y, S, springExt(t.ext))); continue; }
    if (!t.as && t.t === 'button') { turn(ctx, X, Y, S, t.r, () => drawButton(ctx, X, Y, S, t.pressed)); continue; }
    if (t.t === 'door' && t.wait && !t.sink && !t.as) { drawDoorWaiting(ctx, X, Y, S, t.wait.t); continue; }
    if (t.t === 'door' && t.sink) { drawSunk(ctx, X, Y, S, t.sink, () => drawBlock(ctx, t.as || t.t, X, Y, S, time, t.r)); continue; }
    drawBlock(ctx, t.as || t.t, X, Y, S, time, t.r);
    if (t.t === 'coin' && t.pr.needed && !t.as) drawNeededRing(ctx, X, Y, S, time);
  }
  const heroes = [play].concat(play.others || []);
  if (play.state === 'play' || play.state === 'intro') heroes.forEach(h => { if (!h.hidden && !h.inDoor) heroNow(h); });
  else if (play.state === 'won') heroes.forEach(h => { if (h !== play.wonHero && !h.hidden && !h.inDoor) heroNow(h); });
}

function renderEditor(time) {
  const W = cell * T.cols, H = cell * T.rows;
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;    // faint grid while you build
  ctx.beginPath();
  for (let x = 1; x < T.cols; x++) { ctx.moveTo(x * cell + .5, 0); ctx.lineTo(x * cell + .5, H); }
  for (let y = 1; y < T.rows; y++) { ctx.moveTo(0, y * cell + .5); ctx.lineTo(W, y * cell + .5); }
  ctx.stroke();

  // blocks being dragged (or selected) are drawn on top, where the mouse has taken them
  const off = moveDrag ? moveDrag.off : { x:0, y:0 }, dragging = moveDrag ? moveDrag.ids : new Set();
  const drawn = [];
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++) {
      const s = stackAt(x, y);
      if (!s.length) continue;
      const going = s.filter(b => dragging.has(b.id)), staying = s.filter(b => !dragging.has(b.id));
      if (going.length) drawn.push({ x:x + off.x, y:y + off.y, s:going });
      if (staying.some(b => sel.has(b.id))) drawn.push({ x, y, s:staying });
      else if (staying.length) drawStack(staying, x, y, time);
    }
  drawn.forEach(d => {
    drawStack(d.s, d.x, d.y, time);
    if (d.s.some(b => sel.has(b.id))) {
      ctx.fillStyle = 'rgba(93,200,255,.22)'; ctx.fillRect(d.x * cell, d.y * cell, cell, cell);
      outline(d.x, d.y, '#5dc8ff');
    }
  });

  if (boxDrag) {                                 // Jos: a dotted box
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.min(boxDrag.x0, boxDrag.x1) * cell, Math.min(boxDrag.y0, boxDrag.y1) * cell,
                   Math.abs(boxDrag.x1 - boxDrag.x0) * cell, Math.abs(boxDrag.y1 - boxDrag.y0) * cell);
    ctx.setLineDash([]);
  }

  // Jos: the spot each Camera position block points at, and while you are choosing, a pulsing green circle under the mouse
  const pulse = (x, y, strong) => {
    const k = (Math.sin(time * 6) + 1) / 2, cx = (x + .5) * cell, cy = (y + .5) * cell;
    ctx.strokeStyle = COL.green; ctx.lineWidth = 3; ctx.globalAlpha = strong ? 1 : .6;
    ctx.beginPath(); ctx.arc(cx, cy, cell * (.28 + .16 * k), 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COL.green; ctx.beginPath(); ctx.arc(cx, cy, cell * .1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  };
  allBlocks().forEach(f => {
    if (f.c.t !== 'camera' || !f.c.cam) return;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(93,255,138,.55)'; ctx.lineWidth = 2;
    line((f.x + .5) * cell, (f.y + .5) * cell, (f.c.cam.x + .5) * cell, (f.c.cam.y + .5) * cell);
    ctx.setLineDash([]);
    pulse(f.c.cam.x, f.c.cam.y, f.c.id === openId);
  });
  if (camPick && hover) pulse(hover.x, hover.y, true);
  if (editorOn && startPos) drawBlock(ctx, 'startpos', startPos.x * cell, startPos.y * cell, cell, time);
  drawEdges();
  if (portalSwitch.checked) drawPortalLinks();
  if (triggerSwitch.checked) drawAllLinks();

  const open = openId && byId(openId);
  if (open) {
    drawLinks(open, time);
    const o = dragging.has(openId) ? off : { x:0, y:0 };
    outline(open.x + o.x, open.y + o.y, COL.gold, 3);
  }
  linkFrom.map(byId).filter(Boolean).forEach(from => { drawLinks(from, time); outline(from.x, from.y, COL.green, 3); });

  if (hover) {                                   // what's under the mouse
    const hx = hover.x * cell, hy = hover.y * cell;
    if (tool === 'erase') outline(hover.x, hover.y, '#ff2a3d');
    else if (tool === 'place') { ctx.globalAlpha = .45; drawBlock(ctx, chosen, hx, hy, cell, time, chosenTurn); ctx.globalAlpha = 1; }
    else if ((tool === 'cursor' || tool === 'link') && grid[hover.y][hover.x] && !moveDrag) {
      const s = stackAt(hover.x, hover.y);
      if (s.length < 2) outline(hover.x, hover.y, '#fff');
      else {
        // Jos: it says which block; keep the mouse still and it changes to the other one
        const b = pickAt(hover.x, hover.y), inner = b === s[1];
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        if (inner) ctx.strokeRect((hover.x + .48) * cell, (hover.y + .48) * cell, cell * .5, cell * .5);
        else outline(hover.x, hover.y, '#fff');
        const name = NAME[b.t] + (inner && s[0].t === s[1].t ? ' (inside)' : '');
        namePill(name, (hover.x + .5) * cell, hover.y * cell - 4);
      }
    }
  }
}
/* the little name that pops up over a square with two blocks in it */
function namePill(text, cx, bottom) {
  ctx.font = 'bold ' + Math.max(11, Math.round(cell * .4)) + 'px Nunito';
  const w = ctx.measureText(text).width + 14, h = Math.max(16, cell * .55);
  const x = Math.max(2, Math.min(cell * T.cols - w - 2, cx - w / 2)), y = Math.max(2, bottom - h);
  ctx.fillStyle = '#fff'; roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#12000a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
}
/* a square in the creator: its block, and a small picture of the block inside it in the corner */
function drawStack(s, x, y, time) {
  drawCell(s[0], x, y, time);
  if (s[1]) {
    const X = (x + .48) * cell, Y = (y + .48) * cell, S = cell * .5;
    ctx.fillStyle = 'rgba(18,0,10,.85)'; roundRect(ctx, X - 1, Y - 1, S + 2, S + 2, 3); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; roundRect(ctx, X - 1, Y - 1, S + 2, S + 2, 3); ctx.stroke();
    drawBlock(ctx, looksLike(s[1]), X, Y, S, time, s[1].r);
  }
}
function drawCell(c, x, y, time) {
  // a block with Visible off is see-through in the creator, so you can still find it
  // (triggers and Edit controls always look normal here: they start invisible)
  const faded = !props(c).visible && (DEFAULTS[c.t] || {}).visible !== false;
  if (faded) ctx.globalAlpha = .35;
  drawBlock(ctx, looksLike(c), x * cell, y * cell, cell, time, c.r);
  if (c.t === 'coin' && props(c).needed && !props(c).disguise) drawNeededRing(ctx, x * cell, y * cell, cell, time);
  ctx.globalAlpha = 1;
  if (c.t === 'portal' && c.out) drawOutput(c.out, x, y);
  if (props(c).disguise) {                       // a little mask, so you know it's in disguise
    ctx.font = Math.round(cell * .38) + 'px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('🎭', (x + 1) * cell - 1, y * cell + 1);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }
}
/* a little arrow on the portal's Output side, in the creator only */
function drawOutput(dir, x, y) {
  const d = { up:[0, -1], down:[0, 1], left:[-1, 0], right:[1, 0] }[dir];
  const cx = (x + .5 + d[0] * .62) * cell, cy = (y + .5 + d[1] * .62) * cell, a = cell * .16;
  ctx.fillStyle = '#5dc8ff';
  ctx.beginPath();
  ctx.moveTo(cx + d[0] * a, cy + d[1] * a);
  ctx.lineTo(cx - d[0] * a + d[1] * a, cy - d[1] * a + d[0] * a);
  ctx.lineTo(cx - d[0] * a - d[1] * a, cy - d[1] * a - d[0] * a);
  ctx.fill();
}
/* every trigger (and button) and the blocks it's connected to */
function drawAllLinks() {
  allBlocks().forEach(f => (f.c.links || []).forEach(l => {
    const t = byId(l.id);
    if (!t) return;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(93,255,138,.7)'; ctx.lineWidth = 2;
    line((f.x + .5) * cell, (f.y + .5) * cell, (t.x + .5) * cell, (t.y + .5) * cell);
    ctx.setLineDash([]);
    ctx.fillStyle = COL.green;
    ctx.beginPath(); ctx.arc((t.x + .5) * cell, (t.y + .5) * cell, cell * .12, 0, Math.PI * 2); ctx.fill();
    delayTag(f, t, l);
  }));
}
/* a connection with a delay says how long, halfway along its line */
function delayTag(f, t, l) {
  if (!(l.delay > 0)) return;
  namePill('⏱ ' + (+l.delay.toFixed(1)) + 's', (f.x + t.x + 1) / 2 * cell, ((f.y + t.y + 1) / 2 + .27) * cell);
}
/* the open block's connections: to the blocks it sets off, and from the triggers that set it off */
function drawLinks(f, time) {
  (f.c.links || []).forEach(l => {
    const t = byId(l.id);
    if (t) drawLink(f, t, l, l.id === hoverLink, t, time);
  });
  linksTo(f.c.id).forEach(g => drawLink(g, f, g.l, g.c.id === hoverLink, g, time));
}
function drawLink(f, t, l, lit, mark, time) {
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = lit ? '#fff' : 'rgba(93,255,138,.85)'; ctx.lineWidth = 2;
  line((f.x + .5) * cell, (f.y + .5) * cell, (t.x + .5) * cell, (t.y + .5) * cell);
  ctx.setLineDash([]);
  delayTag(f, t, l);
  if (lit) {
    // Jos: hover over a connected block in the properties and it flashes red and green on the level
    const col = Math.floor(time / .15) % 2 ? COL.tile : COL.green;
    ctx.globalAlpha = .45; ctx.fillStyle = col; ctx.fillRect(mark.x * cell, mark.y * cell, cell, cell);
    ctx.globalAlpha = 1; outline(mark.x, mark.y, col, 3);
  } else outline(mark.x, mark.y, COL.green);
  (l.actions || []).forEach(a => {
    if (a.do === 'move') {
      // Jos: a little green dot where it will go, yellow lines going to it at its speed
      const d = DIRS[a.dir || 'up'], n = a.n || 1;
      const sx = (t.x + .5) * cell, sy = (t.y + .5) * cell;
      const ex = sx + d[0] * n * cell, ey = sy + d[1] * n * cell;
      ctx.strokeStyle = COL.gold; ctx.lineWidth = 3;
      ctx.setLineDash([cell * .22, cell * .18]);
      ctx.lineDashOffset = -time * (a.speed || 1) * T.moveSpeed * cell;
      line(sx, sy, ex, ey);
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      ctx.fillStyle = COL.green;
      ctx.beginPath(); ctx.arc(ex, ey, cell * .16, 0, Math.PI * 2); ctx.fill();
    }
    if (a.do === 'size') {                     // a dashed outline of its new size
      const s = (a.size || 1) * cell;
      ctx.strokeStyle = COL.gold; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.strokeRect((t.x + .5) * cell - s / 2, (t.y + 1) * cell - s, s, s);
      ctx.setLineDash([]);
    }
  });
}
function drawPortalLinks() {
  const portals = allBlocks().filter(f => f.c.t === 'portal');
  const done = new Set();
  let n = 0;
  portals.sort((a, b) => a.c.id - b.c.id).forEach(a => {
    if (done.has(a.c.id)) return;
    const b = portals.find(q => q.c.id === a.c.pair);
    const label = b ? String(++n) : '?';
    [a, b].forEach(q => {
      if (!q) return;
      done.add(q.c.id);
      ctx.fillStyle = '#5dc8ff';
      ctx.beginPath(); ctx.arc((q.x + .85) * cell, (q.y + .15) * cell, cell * .2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.font = 'bold ' + Math.round(cell * .28) + 'px Nunito';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, (q.x + .85) * cell, (q.y + .15) * cell + 1);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    });
    if (b) {
      ctx.strokeStyle = '#5dc8ff'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
      line((a.x + .5) * cell, (a.y + .5) * cell, (b.x + .5) * cell, (b.y + .5) * cell);
      ctx.setLineDash([]);
    }
  });
}

/* ---------- Jos: pause, in the top left corner. It stops everything: the hero, the triggers, the
   delays, the devil, the spinning saws. In the middle: ▶ to carry on, and the exit door ---------- */
let paused = false;
function setPaused(on) {
  paused = on;
  document.body.classList.toggle('paused', on);
}
document.getElementById('pauseBtn').addEventListener('click', e => { setPaused(!paused); e.currentTarget.blur(); });
document.getElementById('resumeBtn').addEventListener('click', () => setPaused(false));
document.getElementById('exitBtn').addEventListener('click', () => { location.href = playOne ? 'levels.html' : 'index.html'; });

let last = performance.now(), clock = 0;
function loop(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  if (!paused) {
    clock += dt;
    if (play) { step(dt); updateCam(dt); }
    if (chomp) chompStep(dt);
    bits = bits.filter(b => {
      b.life -= dt; b.vy += T.gravity * .6 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      return b.life > 0;
    });
  }
  const time = clock;             // spinning and glowing stop too
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
giveIds();
difficulty = LDLC.difficulty(levelId) || inferDifficulty();
if (difficulty === 'advanced') editorOn = true; else if (difficulty === 'beginner') editorOn = false;
showEditor(); applyDifficulty();
function newLevelStart() {
  // a brand-new level starts with a floor, the hero and the door, so TEST works straight away
  for (let x = 0; x < T.cols; x++) grid[T.rows - 1][x] = { t:'tile', id:nextId++ };
  grid[T.rows - 2][1] = { t:'hero', id:nextId++ };
  grid[T.rows - 2][T.cols - 2] = { t:'door', id:nextId++ };
  saveSize();
  save();                       // so a brand-new level is in the list straight away
}
/* Jos (8 Nov): a little red message when you first go into a new level: what do you want your grid size to be? */
function askSize(redo) {                         // redo: choosing again for a level that already has blocks in it
  const input = (v, lo, hi) => el('input', { type:'number', min:lo, max:hi, step:1, value:v });
  const wide = input(redo ? T.cols : SIZE.oneScreen[0], SIZE.minCols, SIZE.maxCols), tall = input(redo ? T.rows : SIZE.oneScreen[1], SIZE.minRows, SIZE.maxRows);
  const note = el('p', { className:'sz-note', textContent:redo
    ? 'The floor stays at the bottom. Any block that is outside the new size goes away.'
    : '32 by 18 is one screen. Bigger, and the camera follows you.' });
  const go = el('button', { className:'sz-go', textContent:'Continue' });
  const cancel = redo ? el('button', { className:'sz-cancel', textContent:'Cancel' }) : null;
  const box = el('div', { id:'sizeBox' }, [el('div', { className:'sz-card' }, [
    el('div', { className:'sz-title', textContent:'What do you want your grid size to be?' }),
    el('div', { className:'sz-row' }, [el('label', { textContent:'Wide' }), wide, el('span', { textContent:'blocks' })]),
    el('div', { className:'sz-row' }, [el('label', { textContent:'Tall' }), tall, el('span', { textContent:'blocks' })]),
    note, el('div', { className:'sz-buttons' }, cancel ? [cancel, go] : [go])])]);
  document.body.append(box);
  if (cancel) cancel.addEventListener('click', () => box.remove());
  const clamp = (n, lo, hi, d) => { n = Math.round(parseFloat(n)); return isNaN(n) ? d : Math.max(lo, Math.min(hi, n)); };
  go.addEventListener('click', () => {
    if (redo) {
      resizeLevel(clamp(wide.value, SIZE.minCols, SIZE.maxCols, T.cols), clamp(tall.value, SIZE.minRows, SIZE.maxRows, T.rows));
      box.remove(); return;
    }
    T.cols = clamp(wide.value, SIZE.minCols, SIZE.maxCols, 32);
    T.rows = clamp(tall.value, SIZE.minRows, SIZE.maxRows, 18);
    grid = emptyGrid(); edCam = { x:0, y:0 };
    newLevelStart();
    needSize = false; box.remove(); fit(); refreshSend();
    if (T.cols > viewW || T.rows > viewH) say('Hold Space and drag to move around 😈');
  });
}
/* Jos (8 Nov): the Rechoose size button. The blocks stay where they are on the floor: the bottom left corner stays put,
   so a taller level gets room above and a wider one gets room on the right. A smaller one loses what no longer fits. */
function resizeLevel(nc, nr) {
  if (nc === T.cols && nr === T.rows) return;
  const dy = nr - T.rows, old = grid, g = Array.from({ length:nr }, () => Array(nc).fill(null)), lost = new Set();
  for (let y = 0; y < T.rows; y++)
    for (let x = 0; x < T.cols; x++) {
      const c = old[y][x];
      if (!c) continue;
      if (x < nc && y + dy >= 0) g[y + dy][x] = c;
      else { lost.add(c.id); if (c.inner) lost.add(c.inner.id); }
    }
  grid = g; T.cols = nc; T.rows = nr;
  if (lost.size) forgetLinksTo(lost);
  allBlocks().forEach(f => {                    // a Camera position block's chosen spot moves with the floor
    if (f.c.t !== 'camera' || !f.c.cam) return;
    const y = f.c.cam.y + dy;
    if (f.c.cam.x < nc && y >= 0 && y < nr) f.c.cam = { x:f.c.cam.x, y }; else delete f.c.cam;
  });
  if (startPos) { startPos = { x:startPos.x, y:startPos.y + dy }; if (startPos.x >= nc || startPos.y < 0) startPos = null; saveStart(); }
  closePanel(); sel.clear(); linkFrom = []; linking = false; camPick = null; hideBanner();
  saveSize(); save();
  edCam = { x:0, y:Math.max(0, nr - viewH) };
  fit(); refreshSend();
  if (tool === 'select') selectionBanner();
  say(lost.size ? lost.size + ' block' + (lost.size === 1 ? '' : 's') + ' did not fit and went away' : 'New size: ' + nc + ' by ' + nr);
}
document.getElementById('resizeBtn')?.addEventListener('click', e => {
  e.currentTarget.blur();
  if (play || chomp || document.getElementById('sizeBox')) return;
  askSize(true);
});
if (needSize) askSize();
else if (!playAll && !grid.some(r => r.some(Boolean))) newLevelStart();
fixPortals();
refreshSend();
refreshButtons();
if (playAll) {                  // PLAY: straight into the first level, the devil's mouth already shut
  document.body.classList.add('playall');
  startTest();
  if (chomp) chomp.t = CHOMP.close;
}
fit();
requestAnimationFrame(loop);
