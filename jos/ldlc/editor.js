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
  knockSlow:  30,    // how fast a sideways knock dies away
  portalSpit: 12,    // how hard a portal spits you out of its Output side
  sawSpin:    8,     // how fast a sawblade spins
  moveSpeed:  .22,   // Movement speed 1 = 0.22 blocks a second, measured from Jos's recording
  portalFlip: 0.30,  // Jos: the portal switches colours every 0.30 seconds
  pickSwap:   0.9    // two blocks in one square: keep the mouse still this long and it picks the other
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
  { id:'controls',   name:'Edit controls', ready:true },
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
  fixPortals();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(grid)); } catch (e) {}
}
function load() {
  try {
    const g = JSON.parse(localStorage.getItem(SAVE_KEY));
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
/* ---------- turning blocks ----------
   Jos: blocks that look the same whichever way round they are (tile, sawblade, coin, portal)
   don't turn. r = how many quarter turns clockwise: 0 up, 1 right, 2 down, 3 left. */
const TURNS = ['spike', 'smallspike', 'spring', 'oneway', 'button'];
const FACING = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const FACE_NAME = ['Up', 'Right', 'Down', 'Left'];
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
  else if (type === 'oneway') drawOneWay(c, x, y, s);
  else if (type === 'trigger') drawTrigger(c, x, y, s);
  else if (type === 'controls') drawControls(c, x, y, s);
  else if (type === 'button') drawButton(c, x, y, s);
  else if (type === 'door') drawDoor(c, x, y, s);
  else if (type === 'portal') drawPortal(c, x, y, s, time);
  else if (type === 'startpos') drawStartPos(c, x, y, s);
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
  button:     ['deadly', 'collision', 'visible', 'disguise', 'action'],
  portal:     ['deadly', 'collision', 'visible', 'disguise', 'action'],
  door:       ['visible', 'disguise'],
  hero:       ['visible'],
  trigger:    ['visible', 'action'],        // Jos: the trigger only has these two
  controls:   ['visible', 'action']
};
const LABEL = { deadly:'Deadly', collision:'Collision', disguise:'Disguise as block',
                action:'Do action', visible:'Visible', needed:'Needed for finish' };
const LINKERS = ['trigger', 'button'];    // the blocks you can connect to other blocks
const KEYS = [['ArrowLeft', '← arrow'], ['ArrowRight', '→ arrow'], ['ArrowUp', '↑ arrow'],
              ['ArrowDown', '↓ arrow'], ['Space', 'Space'], ['KeyA', 'A'], ['KeyD', 'D'],
              ['KeyW', 'W'], ['KeyS', 'S']];
/* a new Edit controls block starts with Jos's example: left = ←, right = →, up = Space or ↑ */
const BLOCK_CONTROLS = { left:['ArrowLeft'], right:['ArrowRight'], up:['Space', 'ArrowUp'], auto:0 };
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

function fit() {
  const r = wrap.getBoundingClientRect();
  const testing = document.body.classList.contains('testing');
  const padX = testing ? 0 : 104, padY = testing ? 0 : 126;   // room round the level for the ✏️ edge buttons
  cell = Math.max(10, Math.floor(Math.min((r.width - padX) / T.cols, (r.height - padY) / T.rows)));
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = cell * T.cols + 'px';
  cv.style.height = cell * T.rows + 'px';
  cv.width = cell * T.cols * dpr;
  cv.height = cell * T.rows * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  placeBanner();
}
window.addEventListener('resize', fit);

function pointAt(e) {
  const r = cv.getBoundingClientRect();
  return { x:(e.clientX - r.left) / cell, y:(e.clientY - r.top) / cell };
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
  if (same && (!click || ONLY_ONE.includes(chosen))) {   // just turn it to match
    const r = TURNS.includes(chosen) ? chosenTurn : 0;
    if ((same.r || 0) !== r) { same.r = r; save(); }
    return;
  }
  if (here.length >= 2) { say('That square already has 2 blocks in it 😈'); return; }
  if (ONLY_ONE.includes(chosen)) {
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

cv.addEventListener('pointerdown', e => {
  if (play || chomp) return;
  const a = cellAt(e), c = a && pickAt(a.x, a.y);
  cv.setPointerCapture(e.pointerId);
  if (tool === 'place' || tool === 'erase') { painting = true; stroke = new Set(); paint(a, true); return; }
  if (tool === 'cursor') {
    // Jos: the cursor shows a block's properties, and can drag that one block somewhere else.
    // The properties open when you let go: opening them makes the level smaller, which would
    // move the blocks out from under the mouse in the middle of a drag.
    if (c) moveDrag = { from:a, off:{ x:0, y:0 }, ids:new Set([c.id]), open:c.id };
    else closePanel();
    return;
  }
  if (tool === 'link') { linkClick(c, a && stackAt(a.x, a.y)); return; }
  if (tool === 'select') {
    // Jos: click one of the selected blocks (without dragging) to change all their properties
    if (c && stackAt(a.x, a.y).some(b => sel.has(b.id))) moveDrag = { from:a, off:{ x:0, y:0 }, ids:sel, click:true };
    // Jos: another box, or a click on another block, adds to what's already selected
    else { closePanel(); const p = pointAt(e); boxDrag = { x0:p.x, y0:p.y, x1:p.x, y1:p.y, block:c }; }
  }
});
cv.addEventListener('pointermove', e => {
  const h = cellAt(e);
  if (!h || !hover || h.x !== hover.x || h.y !== hover.y) hoverSince = performance.now();
  hover = h;
  if (painting && !ONLY_ONE.includes(chosen)) paint(hover);
  if (boxDrag) { const p = pointAt(e); boxDrag.x1 = p.x; boxDrag.y1 = p.y; }
  if (moveDrag && hover) moveDrag.off = { x:hover.x - moveDrag.from.x, y:hover.y - moveDrag.from.y };
});
cv.addEventListener('pointerup', () => {
  painting = false;
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
const EDGE_KEY = 'jos-ldlc-edges';
const EDGE_NAME = { top:'roof', bottom:'floor', left:'wall', right:'wall' };
const EDGE_START = { top:'solid', bottom:'edge', left:'solid', right:'solid' };   // what LDLC did before
let edges = Object.assign({}, EDGE_START);
try { Object.assign(edges, JSON.parse(localStorage.getItem(EDGE_KEY)) || {}); } catch (e) {}
function saveEdges() { try { localStorage.setItem(EDGE_KEY, JSON.stringify(edges)); } catch (e) {} }
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
    linking = true;                                // the first other block: from now on every click connects
  }
  if (!c || linkFrom.includes(c.id) || c.t === 'hero') return;
  const trs = linkFrom.map(byId).filter(Boolean).map(f => f.c);
  const had = trs.every(tr => (tr.links || []).some(l => l.id === c.id));
  trs.forEach(tr => {
    tr.links = tr.links || [];
    if (had) tr.links = tr.links.filter(l => l.id !== c.id);   // click a connected block again to undo it
    else if (!tr.links.some(l => l.id === c.id)) tr.links.push({ id:c.id, actions:[] });
  });
  if (!had) linkedLast = c.id;
  save();
  linkBanner();
}
function linkBanner() {
  const n = linkFrom.length;
  if (!linking) {
    banner(!n ? 'Choose a trigger or button' : n === 1 ? 'Click on a block/blocks, or choose more triggers or buttons'
                                                   : n + ' chosen · click on a block/blocks');
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
let openId = null, openIds = null, hoverLink = null;   // openIds = lots of selected blocks at once

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
  return n;
}

function openPanel(id) { openId = id; openIds = null; renderPanel(); }
/* Jos: the selected blocks' properties, all at once. Only if they all have the same properties. */
function openSelection(ids = sel) {
  if (ids.size === 1) { openPanel([...ids][0]); return; }
  const cells = [...ids].map(byId).filter(Boolean).map(f => f.c);
  const list = c => (SWITCHES[c.t] || []).join();
  if (!cells.every(c => list(c) === list(cells[0]))) {
    say('These blocks have different properties 😈'); return;
  }
  openId = null; openIds = new Set(ids); renderPanel();
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
  openId = null; openIds = null; hoverLink = null;
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
        if (k === 'disguise' && v && !x.as) x.as = 'tile';
      });
      save(); renderPanel();
    }));
    if (k === 'disguise' && on === true) {
      panel.append(row('Block', pick(BLOCKS.map(b => [b.id, b.name]), common(cells.map(x => x.as || 'tile')),
                                     v => { cells.forEach(x => { x.as = v; }); save(); renderPanel(); })));
    }
  });

  if (cells.every(x => TURNS.includes(x.t))) {
    const go = by => { cells.forEach(x => { x.r = ((x.r || 0) + by + 4) % 4; }); save(); renderPanel(); };
    const r = common(cells.map(x => x.r || 0));
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
    manyTriggersSection(cells);
  } else {
    if (c.t === 'controls') controlsSection(c);
    if (LINKERS.includes(c.t)) linksSection(c);
    triggersSection(c);
  }
  panel.scrollTop = scroll;
  if (!wasOpen) fit();
}

function controlsSection(c) {
  panel.append(el('div', { className:'p-sub', textContent:'Controls' }));
  if (!c.controls) { c.controls = JSON.parse(JSON.stringify(BLOCK_CONTROLS)); save(); }
  const ctl = c.controls;
  [['left', 'Left ='], ['right', 'Right ='], ['up', 'Up =']].forEach(([k, label]) => {
    const first = pick(KEYS, ctl[k][0], v => { ctl[k][0] = v; save(); });
    const second = pick([['', '—']].concat(KEYS), ctl[k][1] || '',
                        v => { ctl[k] = [ctl[k][0]].concat(v ? [v] : []); save(); });
    panel.append(row(label, first, el('span', { className:'p-or', textContent:'or' }), second));
  });
  panel.append(row('Always going', pick([['0', 'No'], ['-1', 'Left'], ['1', 'Right']], String(ctl.auto || 0),
                                        v => { ctl.auto = +v; save(); })));
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
    card.append(row('Delay', number(l.delay || 0, 0, 30, .1, v => { l.delay = v; save(); }),
                    el('span', { className:'p-or', textContent:'seconds' })));
    l.actions = l.actions || [];
    l.actions.forEach((a, j) => card.append(actionBox(l, a, j, c)));
    card.append(el('button', { className:'p-add', textContent:'+ Add',
                               onclick:() => { l.actions.push({ do:'' }); save(); renderPanel(); } }));
    // Jos's editor command: every trigger connected to this block does what this one does
    // (only for this block, and the delays stay as they are)
    if (editorOn && from.length > 1) card.append(el('button', { className:'p-cmd', textContent:'🛠 Do same with all triggers',
      onclick:() => {
        from.forEach(o => { if (o.l !== l) o.l.actions = JSON.parse(JSON.stringify(l.actions)); });
        save(); renderPanel(); say('All ' + from.length + ' do the same now');
      } }));
    panel.append(card);
  });
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
    panel.append(card);
  });
}
function actionBox(link, a, j, target, saved = save) {
  const box = el('div', { className:'p-action' });
  box.append(row('Do', pick([['', '—'], ['size', 'Change size'], ['move', 'Movement'], ['props', 'Change properties']],
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
    keys.forEach(k => box.append(toggle(LABEL[k], a.props[k], v => { a.props[k] = v; saved(); })));
  }
  return box;
}

/* ---------- keys ---------- */
const keys = {};
addEventListener('keydown', e => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
  if (play && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (play && e.code === 'Escape') stopTest();
  if (!play && !typing) {
    if (tool === 'select' && sel.size && (e.code === 'Delete' || e.code === 'Backspace')) {
      e.preventDefault(); deleteSelected();
    }
    if (e.code === 'Escape') { if (sel.size || linkFrom.length) setTool(tool); else closePanel(); }
    const secret = secretKey(e);
    if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !secret) turnKey();
  }
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });

/* ---------- Jos: a secret word. Type "editor" to show the editor commands ---------- */
const SECRET = 'editor';
let typed = '', editorOn = localStorage.getItem('jos-ldlc-editor') === '1';
let startPos = JSON.parse(localStorage.getItem('jos-ldlc-start') || 'null');   // Jos's Start pos
function saveStart() { localStorage.setItem('jos-ldlc-start', JSON.stringify(startPos)); }
function showEditor() {
  document.getElementById('editorCmds').hidden = !editorOn;
  document.querySelector('.block[data-id=startpos]').style.display = editorOn ? '' : 'none';
  if (!editorOn && chosen === 'startpos') { chosen = 'tile'; refreshButtons(); }
  if (openIds) renderPanel();
}
function secretKey(e) {             // true when this key finishes the secret word
  if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return false;
  typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
  if (typed !== SECRET) return false;
  typed = '';
  editorOn = !editorOn;
  localStorage.setItem('jos-ldlc-editor', editorOn ? '1' : '');
  showEditor();
  say(editorOn ? '🛠 Editor commands on' : 'Editor commands off');
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
  }, () => {
    if (!play) return;
    play.state = 'play';
    if (play.things.some(t => t.t === 'coin' && t.pr.needed)) play.devil = { t:0, words:'A coin is hidden' };
  });
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
                    links:c.links || [], controls:c.controls, pair:c.pair, r:c.r || 0, out:c.out || '',
                    dx:0, dy:0 });
      });
  return list;
}
function spawn() {
  // every try starts fresh: coins come back, traps reset
  const h = find('hero'), at = editorOn && startPos ? startPos : h;   // Jos: the Start pos wins
  play = { hidden:!props(h.c).visible, x:at.x + (1 - T.heroW) / 2, y:at.y + 1 - T.heroH, vx:0, vy:0,
           ground:false, state:'play', timer:0, face:1, walkT:0, coins:0, kx:0,
           things:makeThings(), on:null, later:[] };
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
  });
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
  const W = cell * T.cols, H = cell * T.rows, t = d.t;
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
function doLink(l) {
  const g = play.byId[l.id];
  if (!g) return;
  (l.actions || []).forEach(a => {
    if (a.do === 'size') g.grow = { from:g.w, to:a.size || 1, t:0 };
    if (a.do === 'move') {
      // a distance to travel, not a spot to reach, so it still works if it grows too
      const d = DIRS[a.dir || 'up'];
      g.move = { dx:d[0], dy:d[1], left:a.n || 1, v:(a.speed || 1) * T.moveSpeed };
    }
    if (a.do === 'props') g.pr = Object.assign({}, g.pr, a.props || {});
  });
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
    t.dx = t.x - ox; t.dy = t.y - oy;
    if (t.ext !== undefined) { t.ext += dt; if (t.ext > .5) t.ext = undefined; }
  });
}

function step(dt) {
  const p = play, W = T.heroW, H = T.heroH;
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
    if (p.wonT > DOOR.shut + DOOR.sink + 0.3) stopTest();   // Jos: no LEVEL COMPLETE message
    return;
  }

  // delayed connections go off when their time is up
  p.later = p.later.filter(d => { d.left -= dt; if (d.left > 0) return true; doLink(d.l); return false; });
  // Jos: the door goes down at the start, and comes up again when the Needed coins are collected
  const locked = p.things.some(t => t.t === 'coin' && t.pr.needed && !t.gone);
  p.things.forEach(t => {
    if (t.t === 'door') t.sink = Math.max(0, Math.min(1, (t.sink || 0) + (locked ? dt : -dt) / DOOR.sink));
  });

  // ride along on whatever you're standing on
  if (p.on && p.ground) { p.x += p.on.dx; p.y += p.on.dy; }
  // a moving block that runs into you pushes you out of the way
  touching(p.x, p.y, W, H, t => {
    if (!t.pr.collision) return;
    const l = p.x + W - t.x, r = t.x + t.w - p.x, u = p.y + H - t.y, d = t.y + t.h - p.y;
    const m = Math.min(l, r, u, d);
    if (m === l) p.x -= l; else if (m === r) p.x += r; else if (m === u) p.y -= u; else p.y += d;
  });

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

  // a sideways spring or a portal knocks you along; it dies away
  if (p.kx) { const k = T.knockSlow * dt; p.kx = Math.abs(p.kx) <= k ? 0 : p.kx - Math.sign(p.kx) * k; }
  const mx = p.vx + p.kx, oldX = p.x;
  p.x += mx * dt;
  // the walls: solid, or the edge of the screen (Jos: go onto it and you die)
  if (p.x < 0) { if (edges.left === 'solid') { p.x = 0; p.kx = 0; } else { die(); return; } }
  if (p.x + W > T.cols) { if (edges.right === 'solid') { p.x = T.cols - W; p.kx = 0; } else { die(); return; } }
  touching(p.x, p.y, W, H, t => {
    if (!t.pr.collision) return;
    if (mx > 0) p.x = t.x - W;
    else if (mx < 0) p.x = t.x + t.w;
    p.kx = 0;
  });
  // a one way turned on its side: you go through one way, and it stops you coming back
  touching(p.x, p.y, W, H, t => {
    if (t.t !== 'oneway') return;
    if (t.r === 1 && mx < 0) {
      const face = t.x + .9 * t.w;
      if (oldX >= face - .01 && p.x <= face) { p.x = face; p.kx = 0; }
    }
    if (t.r === 3 && mx > 0) {
      const face = t.x + .1 * t.w;
      if (oldX + W <= face + .01 && p.x + W >= face) { p.x = face - W; p.kx = 0; }
    }
  });

  const oldBottom = p.y + H, oldTop = p.y;
  p.y += p.vy * dt;
  p.ground = false; p.on = null;
  if (p.y < 0) { if (edges.top === 'solid') { p.y = 0; p.vy = 0; } else { die(); return; } }
  touching(p.x, p.y, W, H, t => {
    if (!t.pr.collision) return;
    if (p.vy > 0) { p.y = t.y - H; p.vy = 0; p.ground = true; p.on = t; }
    else if (p.vy < 0) { p.y = t.y + t.h; p.vy = 0; }
  });
  // one way: you only land on it coming down from above
  if (p.vy >= 0) {
    touching(p.x, p.y, W, H, t => {
      if (t.t !== 'oneway' || t.r) return;
      const top = t.y + .1 * t.h;
      if (oldBottom <= top + .01 && p.y + H >= top) { p.y = top - H; p.vy = 0; p.ground = true; p.on = t; }
    });
  }
  // upside down: you fall through it, and bump your head on it jumping back up
  if (p.vy < 0) {
    touching(p.x, p.y, W, H, t => {
      if (t.t !== 'oneway' || t.r !== 2) return;
      const bottom = t.y + .9 * t.h;
      if (oldTop >= bottom - .01 && p.y <= bottom) { p.y = bottom; p.vy = 0; }
    });
  }

  if (p.y + H > T.rows && edges.bottom === 'solid') { p.y = T.rows - H; p.vy = 0; p.ground = true; p.on = null; }
  if (p.y > T.rows) { die(); return; }

  let inPortal = null;
  touching(p.x, p.y, W, H, t => {
    if (p.state !== 'play') return;
    const pr = t.pr;

    if (pr.deadly) {
      let hit;
      if (t.t === 'sawblade') {                   // round blade: only the circle gets you
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
      const comingIn = (p.vx + p.kx) * f[0] + p.vy * f[1] <= 0;
      if (comingIn && boxesTouch(p.x, p.y, W, H, t.x + zx * t.w, t.y + zy * t.h, zw * t.w, zh * t.h)) {
        // Jos: strength = how many blocks it boots you. Up or down: the speed that rises that high.
        // On its side: the knock that slides you that far.
        const n = Math.max(1, pr.strength || 5);
        if (f[1]) { p.vy = f[1] * Math.sqrt(2 * T.gravity * n); p.ground = false; p.booted = true; }
        else p.kx = f[0] * Math.sqrt(2 * T.knockSlow * n);   // Jos: on its side, it bounces you back
        t.ext = 0;
      }
    }
    if (t.t === 'coin' && pr.action && !t.gone &&
        boxesTouch(p.x, p.y, W, H, t.x + .3 * t.w, t.y + .3 * t.h, .4 * t.w, .4 * t.h)) {
      t.gone = true;
      playCoin();
      if (pr.needed) p.devil = { t:0, words:devilWords() };
      for (let k = 0; k < 8; k++) {
        bits.push({ x:t.x + t.w / 2, y:t.y + t.h / 2, vx:(Math.random() - .5) * 6,
                    vy:-3 - Math.random() * 4, life:.5, col:COL.gold });
      }
    }
    if (t.t === 'controls' && pr.action) p.controls = Object.assign({}, BLOCK_CONTROLS, t.controls || {});
    if (t.t === 'trigger' && pr.action) fire(t);
    const pb = t.t === 'button' && turnBox([.14, .5, .72, .5], t.r);
    if (pb && boxesTouch(p.x, p.y, W, H, t.x + pb[0] * t.w, t.y + pb[1] * t.h, pb[2] * t.w, pb[3] * t.h)) {
      t.pressed = true;                           // Jos: it goes down when you stand on it
      if (pr.action) fire(t);
    }
    if (t.t === 'portal' && pr.action &&
        boxesTouch(p.x, p.y, W, H, t.x + .2 * t.w, t.y + .2 * t.h, .6 * t.w, .6 * t.h)) inPortal = t;
    if (t.t === 'door' && !t.sink && boxesTouch(p.x, p.y, W, H, t.x + .2 * t.w, t.y + .2 * t.h, .6 * t.w, .8 * t.h)) {
      // pulled into the middle of the door
      p.state = 'won'; p.wonT = 0; p.door = t;
      p.x = t.x + (t.w - W) / 2; p.y = t.y + t.h - H; p.vx = p.vy = 0;
    }
  });

  // portals: step in one, come out of its partner (and don't bounce straight back)
  if (p.state === 'play' && inPortal) {
    if (inPortal.id !== p.portalLock) {
      const out = play.byId[inPortal.pair];
      if (out) { comeOut(p, out); p.portalLock = out.id; }
    }
  } else p.portalLock = null;
}

/* Jos: you come out of the other portal on its Output side. With no Output, you drop out of the
   bottom, or out of the side if there's a block under it (the way you were running, if it can). */
function comeOut(p, out) {
  const W = T.heroW, H = T.heroH;
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
  p.vy = 0; p.kx = 0; p.ground = false;
  if (dir === 'down') { p.y = out.y + out.h; }
  if (dir === 'up')   { p.y = out.y - H; p.vy = -T.portalSpit; p.booted = true; }
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
function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function outline(x, y, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w || 2;
  ctx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
}

function render(time) {
  ctx.fillStyle = '#12000a'; ctx.fillRect(0, 0, cell * T.cols, cell * T.rows);
  if (play) renderPlay(time); else renderEditor(time);
  bits.forEach(b => {
    ctx.fillStyle = b.col || '#fff';
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillRect(b.x * cell - cell * .08, b.y * cell - cell * .08, cell * .16, cell * .16);
  });
  ctx.globalAlpha = 1;
  if (play && play.devil) drawDevil(ctx, play.devil);
}

function renderPlay(time) {
  for (const t of play.things) {
    if (t.gone || !t.pr.visible) continue;       // triggers can't be seen when you play
    const X = t.x * cell, Y = t.y * cell, S = t.w * cell;
    if (play.state === 'won' && play.door === t) {
      drawDoorClosing(ctx, X, Y, S, play.wonT, play.hidden ? () => {} : heroNow); continue;
    }
    if (!t.as && t.t === 'spring') { turn(ctx, X, Y, S, t.r, () => drawSpring(ctx, X, Y, S, springExt(t.ext))); continue; }
    if (!t.as && t.t === 'button') { turn(ctx, X, Y, S, t.r, () => drawButton(ctx, X, Y, S, t.pressed)); continue; }
    if (t.t === 'door' && t.sink) { drawSunk(ctx, X, Y, S, t.sink, () => drawBlock(ctx, t.as || t.t, X, Y, S, time, t.r)); continue; }
    drawBlock(ctx, t.as || t.t, X, Y, S, time, t.r);
    if (t.t === 'coin' && t.pr.needed && !t.as) drawNeededRing(ctx, X, Y, S, time);
  }
  if ((play.state === 'play' || play.state === 'intro') && !play.hidden) heroNow();
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
giveIds();
if (!grid.some(r => r.some(Boolean))) {
  // a brand-new level starts with a floor, the hero and the door, so TEST works straight away
  for (let x = 0; x < T.cols; x++) grid[T.rows - 1][x] = { t:'tile', id:nextId++ };
  grid[T.rows - 2][1] = { t:'hero', id:nextId++ };
  grid[T.rows - 2][T.cols - 2] = { t:'door', id:nextId++ };
}
fixPortals();
refreshButtons();
fit();
requestAnimationFrame(loop);
