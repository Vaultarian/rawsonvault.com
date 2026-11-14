// Jos's Bomb Sandbox
const TS = 8, WW = 400, WH = 150, VW = 640, VH = 360;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
cv.width = VW; cv.height = VH;
const worldCv = document.createElement('canvas'); worldCv.width = WW*TS; worldCv.height = WH*TS;
const wx = worldCv.getContext('2d');
const $ = id => document.getElementById(id);

// ---------------------------------------------------------------- saving: every game has a name and lives in the browser's memory (localStorage)
const OLD_SAVE = 'jos-bomb-sandbox', INDEX_KEY = 'jos-bomb-games', GAME_KEY = n => 'jos-bomb-game:' + n;
let wallet = 0, total = 0, inv = {}, sel = 'L', currentName = null, inGame = false;
function save() { if (inGame && currentName) saveGame(); }
const LIGHTER = { id: 'L', name: 'Lighter', color: '#ffd54f', free: true, tool: true, label: 'lights bombs' };
const NATURE = { id: 'N', name: 'Nature Block', color: '#66bb6a', free: true, tool: true, label: 'fills holes like the ground' };
const NATSQ = { id: 'S', name: 'Nature Square', color: '#7cb342', free: true, tool: true, label: 'click below you: 30x30 grass' };
const PICKAXE = { id: 'P', name: 'Pickaxe', color: '#b0bec5', free: true, tool: true, label: 'digs 10 up the slope' };
setInterval(save, 3000);
addEventListener('pagehide', save);
const count = b => b.free ? Infinity : (inv[b.id] || 0);

// ---------------------------------------------------------------- the world
const COL = { 1:['#52b04f','#47a043','#5cbc57'], 2:['#8b5a2b','#7d4f26','#97612f'], 3:['#80808a','#74747e','#8a8a95'], 4:['#4d4d5c','#444453','#565665'], 5:['#1d1d22'], 6:['#58585e','#4e4e54','#626268'], 7:['#8fb02a','#7f9f22','#9ec030'], 8:['#c68a4a'], 9:['#0b0b0e','#15151a','#1e1e24','#0f0f12','#27272e'] };
let tiles, surf;
const infected = new Map();
let orig = null, origSurf = null, skyBelow = false, indFlat = false;    // indFlat: the indestructible flat world is active (the Nature Square only works there)                          // what the ground looked like when the world was made (nature bombs grow it back)
const placed = new Set(), voidTiles = new Set();   // nature blocks you placed (they pay nothing), and holes in the bottom of the world
const bridges = new Set(), sagMap = new Map();   // bridge planks, and how far each one is bending down right now
function natureType(tx, ty) { const d = ty - surf[tx]; return d <= 0 ? 1 : d < 4 ? 2 : d < 34 ? 3 : 4; }      // grass on top, then dirt, then stone, then deep stone
function placeNature(tx, ty) { const i = ty*WW + tx; tiles[i] = natureType(tx, ty); placed.add(i); drawTile(tx, ty); }
function placeFill(tx, ty) { if (sel === 'N') placeNature(tx, ty); else placeBridge(tx, ty); }     // the Nature Block replaces the bridge plank
function placeBridge(tx, ty) { const i = ty*WW + tx; tiles[i] = 8; bridges.add(i); drawTile(tx, ty); }
function drawTile(x, y) {
  const t = tiles[y*WW + x], px = x*TS, py = y*TS;
  if (t === 0 && y === WH - 1) { wx.clearRect(px, py, TS, TS); wx.fillStyle = '#fffde7'; wx.fillRect(px, py, TS, TS); return; }   // the void
  if (t === 0) { wx.clearRect(px, py, TS, TS); if (y > surf[x] + 2 && !skyBelow) { wx.fillStyle = (x + y) % 2 ? '#2a1f1a' : '#2e221c'; wx.fillRect(px, py, TS, TS); } return; }
  if (t === 8) { wx.clearRect(px, py, TS, TS); if (y > surf[x] + 2 && !skyBelow) { wx.fillStyle = (x + y) % 2 ? '#2a1f1a' : '#2e221c'; wx.fillRect(px, py, TS, TS); } return; }   // planks are drawn live (they bend)
  const c = COL[t]; wx.fillStyle = c[(x*7 + y*13) % c.length]; wx.fillRect(px, py, TS, TS);
  if (t === 1) { wx.fillStyle = '#6fd36a'; wx.fillRect(px, py, TS, 2); }
}
function makeWorld() {
  tiles = new Uint8Array(WW*WH); surf = new Int16Array(WW);
  const base = 60;
  for (let x = 0; x < WW; x++) {
    let s = base + 5*Math.sin(x*.04) + 3*Math.sin(x*.11 + 1.3) + 2*Math.sin(x*.27);
    const d = Math.abs(x - 190); if (d < 24) s = base + (s - base)*Math.max(0, (d - 14)/10);
    surf[x] = Math.round(s);
    for (let y = surf[x]; y < WH; y++) tiles[y*WW + x] = y === WH-1 ? 5 : y === surf[x] ? 1 : y < surf[x] + 4 ? 2 : y < surf[x] + 34 ? 3 : 4;
  }
  orig = tiles.slice(); origSurf = surf.slice(); skyBelow = false; indFlat = false;
  wx.clearRect(0, 0, worldCv.width, worldCv.height);
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) drawTile(x, y);
  shopY = surf[190]*TS; shopVy = 0;
  bridges.clear(); sagMap.clear(); placed.clear(); voidTiles.clear();
  infected.clear(); bombs.length = agents.length = parts.length = texts.length = beams.length = 0;
}
const solid = (tx, ty) => tx < 0 || tx >= WW || (ty >= WH && !voidTiles.has((WH - 1)*WW + tx)) || (ty >= 0 && ty < WH && tiles[ty*WW + tx] !== 0 && tiles[ty*WW + tx] !== 8);
const solidPx = (x, y) => solid(Math.floor(x/TS), Math.floor(y/TS));

// ---------------------------------------------------------------- things that move
const bombs = [], agents = [], parts = [], texts = [], beams = [];
let shake = 0, flash = 0, pulse = 0;
const rnd = (a, b) => a + Math.random()*(b - a);
function spark(x, y, n, col, sp = 160, life = .7) {
  for (let i = 0; i < n && parts.length < 1400; i++) { const a = rnd(0, 6.283), s = rnd(.2, 1)*sp; parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 40, life: rnd(.3, 1)*life, max: life, col, r: rnd(1.5, 3.5), g: 500 }); }
}
function breakTile(x, y) {
  if (x < 0 || y < 0 || x >= WW || y >= WH) return 0;
  const i = y*WW + x, t = tiles[i]; if (t === 0 || t === 9) return 0;      // the black flat world cannot be blown up
  if (placed.has(i)) { placed.delete(i); tiles[i] = 0; drawTile(x, y); return 0; }     // a block you placed: free to remove, pays nothing
  if (t === 5) { tiles[i] = 0; voidTiles.add(i); drawTile(x, y); wallet++; total++; return 1; }   // the bottom of the world opens into the void
  if (t === 8) { tiles[i] = 0; bridges.delete(i); sagMap.delete(i); drawTile(x, y); return 0; }     // bridge planks vanish but pay nothing
  tiles[i] = 0; infected.delete(i); drawTile(x, y); wallet++; total++; pulse = .25;
  if (parts.length < 900 && Math.random() < .1) parts.push({ x: x*TS + 4, y: y*TS + 4, vx: rnd(-60, 60), vy: rnd(-120, -20), life: rnd(.4, 1), max: 1, col: COL[t][0], r: 2.5, g: 600 });
  return 1;
}
function carve(tx, ty, r, fn) {
  let n = 0; const R = Math.ceil(r) + 2;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (fn(dx, dy)) n += breakTile(tx + dx, ty + dy);
  return n;
}
const circ = r => (dx, dy) => dx*dx + dy*dy <= r*r*(.9 + .2*Math.random());
function boom(x, y, r, col = '#ffb300') {
  spark(x, y, Math.min(60, 10 + r*3), col, 120 + r*14, .8); spark(x, y, Math.min(30, 6 + r), '#fff', 100 + r*8, .4);
  parts.push({ ring: true, x, y, r: 2, max: r*TS*1.1, life: .35, mx: .35, col });
  shake = Math.max(shake, Math.min(14, r*.7));
}
function floatText(x, y, s) { texts.push({ x, y, s, life: 1.4 }); }

// shapes (dx, dy in tiles; dy is down)
const SHAPES = {
  cross: (x, y, r) => (Math.abs(x) <= 1 || Math.abs(y) <= 1) && Math.abs(x) <= r && Math.abs(y) <= r,
  x: (x, y, r) => Math.abs(Math.abs(x) - Math.abs(y)) <= 1 && Math.max(Math.abs(x), Math.abs(y)) <= r,
  square: (x, y, r) => Math.max(Math.abs(x), Math.abs(y)) <= r*.8,
  diamond: (x, y, r) => Math.abs(x) + Math.abs(y) <= r,
  ring: (x, y, r) => { const d = Math.hypot(x, y); return d <= r && d >= r*.6; },
  smile: (x, y, r) => { const d = Math.hypot(x, y); return (d <= r && d >= r - 1.3) || Math.hypot(x - r*.35, y + r*.3) <= 1.4 || Math.hypot(x + r*.35, y + r*.3) <= 1.4 || (y > 0 && Math.abs(d - r*.55) <= 1.1); },
  heart: (x, y, r) => { const a = x/r*1.3, b = -y/r*1.3 + .1; return Math.pow(a*a + b*b - 1, 3) - a*a*b*b*b <= 0; },
  star: (x, y, r) => { const d = Math.hypot(x, y), a = Math.atan2(y, x) + Math.PI/2; return d <= r*(.45 + .55*Math.pow(Math.abs(Math.cos(2.5*a)), 1.6)); },
  hline: (x, y, r) => Math.abs(y) <= 1 && Math.abs(x) <= r,
  vline: (x, y, r) => Math.abs(x) <= 1 && y >= -r*.2 && y <= r,
  dome: (x, y, r) => y <= 0 && Math.hypot(x, y) <= r,
  bowl: (x, y, r) => y >= 0 && Math.hypot(x, y) <= r,
  pyramid: (x, y, r) => y <= 0 && y >= -r && Math.abs(x) <= r + y,
  stairs: (x, y, r) => Math.abs(x) <= r && y >= x && y <= x + 3,
  checker: (x, y, r) => Math.hypot(x, y) <= r && ((x + y) & 1) === 0,
  stripes: (x, y, r) => Math.hypot(x, y) <= r && ((x % 3) + 3) % 3 === 0,
  dots: (x, y, r) => Math.hypot(x, y) <= r && ((x % 3) + 3) % 3 === 0 && ((y % 3) + 3) % 3 === 0,
  spiral: (x, y, r) => { const d = Math.hypot(x, y), a = Math.atan2(y, x); return d <= r && (((d - a*1.1) % 3.2) + 3.2) % 3.2 < 1.5; },
  wave: (x, y, r) => Math.abs(x) <= r*1.4 && Math.abs(y - Math.round(Math.sin(x*.6)*r*.3)) <= 1,
  tower: (x, y, r) => Math.abs(x) <= 1 && y >= -r*1.5 && y <= r*.4,
};

// ---------------------------------------------------------------- what each kind of bomb does
const K = {
  blast(b, p) { const tx = b.tx, ty = b.ty; carve(tx, ty, p.r, circ(p.r)); boom(b.x, b.y, p.r, b.def.color); },
  shape(b, p) { const f = SHAPES[p.shape]; carve(b.tx, b.ty, p.r*1.5, (x, y) => f(x, y, p.r)); boom(b.x, b.y, p.r*.8, b.def.color); },
  tunnel(b, p) {
    const D = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
    p.dirs.forEach(d => agents.push({ type: 'drill', x: b.tx, y: b.ty, dx: D[d][0], dy: D[d][1], left: p.len, w: p.w, acc: 0 }));
    boom(b.x, b.y, 3, b.def.color);
  },
  worms(b, p) { for (let i = 0; i < p.n; i++) agents.push({ type: 'worm', x: b.tx, y: b.ty, a: rnd(0, 6.283), left: p.len, acc: 0, t: rnd(0, 9) }); boom(b.x, b.y, 3, b.def.color); },
  mice(b, p) { for (let i = 0; i < p.n; i++) agents.push({ type: 'mouse', x: b.x, y: b.y - 4, a: rnd(0, 6.283), life: rnd(4.5, 6.5), t: rnd(0, 9) }); boom(b.x, b.y, 2, '#ccc'); },
  blackhole(b, p) { agents.push({ type: 'hole', x: b.x, y: b.y, R: p.r*TS, t: 0, T: p.t }); shake = 6; },
  plague(b, p) {
    if (p.mega) {                                          // starts where the bomb goes off and spreads outward, block by block: green, then gone
      plagueCap = 45000; let n = 0, tries = 0;
      while (n < 14 && tries++ < 400) { const tx = b.tx + Math.round(rnd(-6, 6)), ty = b.ty + Math.round(rnd(-6, 6)); if (tx >= 0 && tx < WW && ty >= 0 && ty < WH && tiles[ty*WW + tx] !== 0 && tiles[ty*WW + tx] !== 8 && tiles[ty*WW + tx] !== 9 && !infected.has(ty*WW + tx)) { infect(tx, ty, p.spread, true); n++; } }
      boom(b.x, b.y, 4, '#33691e'); shake = 6; floatText(b.x, b.y - 30, 'The plague is spreading...'); return;
    }
    let n = 0, tries = 0; while (n < p.seeds && tries++ < 200) { const tx = b.tx + Math.round(rnd(-6, 6)), ty = b.ty + Math.round(rnd(-6, 6)); if (solid(tx, ty) && tx >= 0 && tx < WW && ty < WH && tiles[ty*WW + tx] !== 5 && tiles[ty*WW + tx] !== 8 && tiles[ty*WW + tx] !== 9 && !infected.has(ty*WW + tx)) { infect(tx, ty, p.spread || .5); n++; } }
    boom(b.x, b.y, 2, '#9ccc65');
  },
  cluster(b, p) { for (let i = 0; i < p.n; i++) throwBomb(b.x, b.y - 6, rnd(-p.spread, p.spread), rnd(-260, -80), subDef(p.sub), rnd(.5, 1.2)); boom(b.x, b.y, 2, b.def.color); },
  chain(b, p) { for (let i = 0; i < p.n; i++) agents.push({ type: 'later', t: i*p.gap, fn: () => { const x = b.x + (i - (p.n-1)/2)*TS*p.sub.r*1.2; explodeAt({ x, y: b.y, tx: Math.floor(x/TS), ty: b.ty, def: subDef(p.sub) }); } }); },
  airstrike(b, p) { for (let i = 0; i < p.n; i++) { const x = b.x + rnd(-p.width/2, p.width/2); agents.push({ type: 'later', t: i*.12, fn: () => throwBomb(x, camY - 20, 0, 200, subDef(p.sub), 5, true) }); } },
  meteors(b, p) { for (let i = 0; i < p.n; i++) { const x = b.x + rnd(-120, 120); agents.push({ type: 'later', t: i*.18 + .1, fn: () => agents.push({ type: 'meteor', x: x - 120, y: camY - 40, tx: x, r: p.r, vx: 340, vy: 560 }) }); } },
  lightning(b, p) {
    for (let i = 0; i < p.n; i++) agents.push({ type: 'later', t: i*.2, fn: () => { const x = Math.floor(b.tx + rnd(-14, 14)); let y = 0; while (y < WH && !solid(x, y)) y++; beams.push({ x1: x*TS + 4, y1: 0, x2: x*TS + 4, y2: y*TS, life: .25, col: '#fff59d' }); flash = Math.max(flash, .25); for (let d = 0; d < p.depth; d++) { breakTile(x, y + d); if (d % 3 === 0) { breakTile(x + 1, y + d); breakTile(x - 1, y + d); } } spark(x*TS, y*TS, 14, '#fff59d', 200, .5); shake = Math.max(shake, 4); } });
  },
  quake(b, p) { for (let dx = -p.width; dx <= p.width; dx++) { const x = b.tx + dx; if (Math.random() < .7) agents.push({ type: 'later', t: Math.abs(dx)*.02, fn: () => { let y = 0; while (y < WH && !solid(x, y)) y++; const d = Math.round(rnd(2, p.d)); for (let k = 0; k < d; k++) breakTile(x, y + k); spark(x*TS, y*TS, 2, '#a1887f', 80, .5); } }); } shake = 12; },
  volcano(b, p) { for (let i = 0; i < p.n; i++) agents.push({ type: 'later', t: i*.06, fn: () => parts.push({ lava: true, x: b.x + rnd(-10, 10), y: b.y, vx: rnd(-160, 160), vy: rnd(-520, -240), life: 6, max: 6, col: '#ff6d00', r: 3, g: 700 }) }); shake = 8; boom(b.x, b.y, 4, '#ff6d00'); },
  acid(b, p) { agents.push({ type: 'acid', x: b.tx, y: b.ty, r: p.r, t: 0, T: p.t, acc: 0 }); },
  fire(b, p) { carve(b.tx, b.ty, p.blast, circ(p.blast)); boom(b.x, b.y, p.blast + 2, '#ff5722'); for (const s of [-1, 1]) agents.push({ type: 'fire', x: b.tx, dir: s, left: p.r, acc: 0 }); },
  laser(b, p) { for (const ax of p.axes) for (const s of [-1, 1]) agents.push({ type: 'laser', x: b.tx, y: b.ty, h: ax === 'h', s, left: p.len, th: p.th, acc: 0 }); flash = .15; },
  nuke(b, p) {
    carve(b.tx, b.ty, p.r, (dx, dy) => { const d = Math.hypot(dx, dy); return d <= p.r*(.92 + .1*Math.sin(Math.atan2(dy, dx)*7 + dx*.1)); });
    flash = 1; shake = 22; spark(b.x, b.y, 200, '#fff3b0', 600, 1.5);
    agents.push({ type: 'cloud', x: b.x, y: b.y, t: 0, r: p.r*TS });
  },
  apoc(b, p) {
    carve(b.tx, b.ty, p.r, (dx, dy) => { const d = Math.hypot(dx, dy); if (d > p.r*.55) return false; return Math.random() < .85; });
    for (let dy = -p.r; dy <= p.r; dy++) for (let dx = -p.r; dx <= p.r; dx++) { const x = b.tx + dx, y = b.ty + dy; if (x < 0 || y < 0 || x >= WW || y >= WH) continue; const i = y*WW + x, t = tiles[i]; if (t && t !== 5 && t !== 6 && t !== 9 && Math.hypot(dx, dy) <= p.r) { tiles[i] = 6; drawTile(x, y); } }
    flash = .7; shake = 14; boom(b.x, b.y, p.r*.6, '#9e9d24');
    agents.push({ type: 'radiation', x: b.x, y: b.y, r: p.r*TS, t: 0 });
  },
  party(b, p) { carve(b.tx, b.ty, p.r, circ(p.r)); for (let i = 0; i < 80; i++) spark(b.x, b.y, 1, ['#f44336', '#ffeb3b', '#4caf50', '#2196f3', '#e91e63'][i % 5], 260, 1.4); },
  random(b, p) {
    const pool = ORDER.filter(x => x.kind !== 'random' && x.kind !== 'nature' && x.kind !== 'flat' && !x.p.mega && (!p.safe || x.est < 900) && x.est > 5);
    const d = pool[Math.floor(Math.random()*pool.length)]; floatText(b.x, b.y - 24, d.name + '!');
    explodeAt({ x: b.x, y: b.y, tx: b.tx, ty: b.ty, def: d });
  },
};
function restoreTile(x, y) {
  const i = y*WW + x; if (tiles[i] === orig[i] && !bridges.has(i)) return false;
  tiles[i] = orig[i]; bridges.delete(i); sagMap.delete(i); infected.delete(i); placed.delete(i); voidTiles.delete(i); drawTile(x, y); return true;
}
K.nature = function (b, p) {                  // grows the ground back the way it was made
  const whole = p.r >= 1000;
  if (whole) { for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) restoreTile(x, y); surf.set(origSurf); skyBelow = false; indFlat = false; renderBar(); placed.clear(); voidTiles.clear(); for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) drawTile(x, y); flash = .8; spark(b.x, b.y, 80, '#a5d6a7', 500, 1.2); }
  else { const R = Math.ceil(p.r) + 1; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx*dx + dy*dy <= p.r*p.r) { const x = b.tx + dx, y = b.ty + dy; if (x >= 0 && y >= 0 && x < WW && y < WH) restoreTile(x, y); } boom(b.x, b.y, p.r, '#66bb6a'); spark(b.x, b.y, 40, '#a5d6a7', 200, 1); }
  shopY = topRow(Math.floor(SHOP.x/TS))*TS; shopVy = 0;                    // the shop stands on the ground again
  if (hitsSolid(P.x, P.y)) respawn();                                      // and if the ground grew over him, he pops back to the surface
};
K.flat = function (b, p) {
  const G = Math.max(20, Math.min(WH - 20, b.ty + 1));                  // the top of the new world: the ground under the bomb
  for (let x = 0; x < WW; x++) for (let y = 0; y < WH; y++) {
    const i = y*WW + x;
    tiles[i] = (y >= G && y < G + 15) ? (p.indestructible ? 9 : 1) : 0;
    if (tiles[i] === 1) placed.add(i); else placed.delete(i);          // flat grass pays nothing when broken, so it cannot be farmed
  }
  bridges.clear(); sagMap.clear(); infected.clear(); voidTiles.clear();
  for (let x = 0; x < WW; x++) { surf[x] = G; voidTiles.add((WH - 1)*WW + x); }     // everything below the slab is void
  skyBelow = true; indFlat = !!p.indestructible; renderBar();
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) drawTile(x, y);
  flash = 1; shake = 16; spark(b.x, b.y, 80, p.indestructible ? '#9e9e9e' : '#aed581', 500, 1.2);
  shopY = G*TS; shopVy = 0;
  if (hitsSolid(P.x, P.y)) respawn();
};
const subDef = s => ({ name: 'sub', color: '#ff9800', kind: s.kind, p: s });
let plagueCap = 3500;
const NEIGH8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, .5], [-1, 1, .5], [1, -1, .5], [-1, -1, .5]];
function infect(tx, ty, sp, mega) {
  const i = ty*WW + tx; if (tiles[i] === 5) voidTiles.add(i);          // the mega plague eats the bottom of the world too
  infected.set(i, { t: 0, sp, mega, life: rnd(1, 5), wait: rnd(.1, mega ? .9 : 1.5) }); tiles[i] = 7; if (mega) placed.add(i); drawTile(tx, ty);     // (mega-plagued blocks pay nothing, so it cannot be farmed)
}
function explodeAt(b) { K[b.def.kind](b, b.def.p, b.def); }

// delayed things: mice, worms, black holes, plague spread, etc.
function updateAgents(dt) {
  for (let i = agents.length - 1; i >= 0; i--) {
    const a = agents[i]; let alive = true;
    switch (a.type) {
      case 'square': {
        a.t += dt; const rows = Math.min(30, Math.floor(a.t/1.0*30));
        while (a.done < rows) { const y = a.g - 1 - a.done;                 // each new row grows on top of the last one
          if (y >= 0) for (let x = a.tx - 15; x <= a.tx + 14; x++) {
            if (x < 0 || x >= WW) continue; const i = y*WW + x;
            if (tiles[i] === 0) { tiles[i] = 1; placed.add(i); drawTile(x, y); } }
          if (hitsSolid(P.x, P.y)) { P.y = y*TS; P.vy = 0; P.onGround = true; P.jumped = false; }     // if you are standing on it, it carries you up with it
          if (a.done % 3 === 0) spark(a.tx*TS + rnd(-100, 100), (y + 1)*TS, 3, '#8bc34a', 70, .5);
          a.done++; }
        alive = a.done < 30; break; }
      case 'later': a.t -= dt; if (a.t <= 0) { a.fn(); alive = false; } break;
      case 'drill': a.acc += dt*60; while (a.acc >= 1 && a.left > 0) { a.acc--; a.left--; for (let k = -a.w; k <= a.w; k++) breakTile(a.x + (a.dy ? k : 0), a.y + (a.dx ? k : 0)); a.x += a.dx; a.y += a.dy; if (a.left % 2) spark(a.x*TS + 4, a.y*TS + 4, 2, '#fbc02d', 60, .3); } alive = a.left > 0; break;
      case 'worm': a.acc += dt*40; while (a.acc >= 1 && a.left > 0) { a.acc--; a.left--; a.t += .3; a.a += Math.sin(a.t)*.35; if (a.y < surf[Math.max(0, Math.min(WW-1, Math.round(a.x)))] + 1 && Math.sin(a.a) < 0) a.a = -a.a; a.x += Math.cos(a.a); a.y += Math.sin(a.a); breakTile(Math.round(a.x), Math.round(a.y)); breakTile(Math.round(a.x) + 1, Math.round(a.y)); } alive = a.left > 0; break;
      case 'mouse': {
        a.life -= dt; a.t += dt*12; a.a += (Math.random() - .5)*.5;
        const sp = 70; const nx = a.x + Math.cos(a.a)*sp*dt, ny = a.y + Math.sin(a.a)*sp*dt;
        const tx = Math.floor(nx/TS), ty = Math.floor(ny/TS);
        if (ty < surf[Math.max(0, Math.min(WW-1, tx))] - 2) { a.a = Math.abs(a.a) % 3.14 + .3; }
        else { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) breakTile(tx + dx, ty + dy); a.x = Math.max(4, Math.min(WW*TS - 4, nx)); a.y = ny; }
        alive = a.life > 0 && a.y < (WH - 2)*TS; break;
      }
      case 'hole': {
        a.t += dt; const k = a.t < a.T*.7 ? a.t/(a.T*.7) : Math.max(0, 1 - (a.t - a.T*.7)/(a.T*.3)); const r = a.R*k/TS, tx = Math.floor(a.x/TS), ty = Math.floor(a.y/TS);
        carve(tx, ty, r, (dx, dy) => dx*dx + dy*dy <= r*r);
        if (Math.random() < .5) { const an = rnd(0, 6.283), d = rnd(a.R*.6, a.R*1.1); parts.push({ x: a.x + Math.cos(an)*d, y: a.y + Math.sin(an)*d, vx: -Math.cos(an)*200, vy: -Math.sin(an)*200, life: .5, max: .5, col: '#7e57c2', r: 2.5, g: 0 }); }
        alive = a.t < a.T; shake = Math.max(shake, 3); break;
      }
      case 'acid': a.t += dt; a.acc += dt; while (a.acc > .06) { a.acc -= .06; const x = Math.round(a.x + rnd(-a.r, a.r)); let y = Math.round(a.y - a.r*.5); const d = Math.round(rnd(1, 3)); let cnt = 0; for (let k = 0; k < 14 && cnt < d; k++, y++) { if (y >= 0 && solid(x, y)) { if (breakTile(x, y)) cnt++; } } spark(x*TS + 4, (y)*TS, 1, '#aeea00', 40, .4); } alive = a.t < a.T; break;
      case 'fire': a.acc += dt*14; while (a.acc >= 1 && a.left > 0) { a.acc--; a.left--; a.x += a.dir; let y = 0; const x = Math.max(0, Math.min(WW-1, a.x)); while (y < WH && !solid(x, y)) y++; if (tiles[y*WW + x] === 1) breakTile(x, y); parts.push({ x: x*TS + 4, y: y*TS - 2, vx: rnd(-20, 20), vy: rnd(-90, -40), life: .6, max: .6, col: ['#ff5722', '#ffb300', '#ff9800'][Math.floor(rnd(0, 3))], r: 3, g: -60 }); } alive = a.left > 0; break;
      case 'laser': a.acc += dt*90; while (a.acc >= 1 && a.left > 0) { a.acc--; a.left--; a.x += a.h ? a.s : 0; a.y += a.h ? 0 : a.s; for (let k = -a.th; k <= a.th; k++) breakTile(a.x + (a.h ? 0 : k), a.y + (a.h ? k : 0)); parts.push({ x: a.x*TS + 4, y: a.y*TS + 4, vx: 0, vy: 0, life: .15, max: .15, col: '#ff1744', r: 3, g: 0 }); } alive = a.left > 0; break;
      case 'meteor': a.x += a.vx*dt; a.y += a.vy*dt; parts.push({ x: a.x, y: a.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: .4, max: .4, col: '#ff9100', r: 4, g: 0 });
        if (solidPx(a.x, a.y) || a.y > WH*TS) { const b = { x: a.x, y: a.y, tx: Math.floor(a.x/TS), ty: Math.floor(a.y/TS), def: subDef({ kind: 'blast', r: a.r }) }; explodeAt(b); alive = false; } break;
      case 'cloud': a.t += dt; if (a.t < 3.2 && Math.random() < .8) { const k = a.t/3.2; parts.push({ x: a.x + rnd(-14, 14), y: a.y - k*a.r*2.6, vx: rnd(-20, 20), vy: -30, life: 1.6, max: 1.6, col: k < .5 ? '#ff7043' : '#8d6e63', r: rnd(10, 18) + k*10, g: 0, fade: true }); for (let j = 0; j < 3; j++) { const an = rnd(0, 6.283); parts.push({ x: a.x + Math.cos(an)*a.r*.5*k, y: a.y - a.r*2.6*k + Math.sin(an)*10, vx: Math.cos(an)*60, vy: -10, life: 1.4, max: 1.4, col: '#a1887f', r: rnd(8, 14), g: 0, fade: true }); } } alive = a.t < 3.4; break;
      case 'radiation': a.t += dt; if (Math.random() < .6) parts.push({ x: a.x + rnd(-a.r, a.r), y: a.y + rnd(-a.r*.4, a.r*.4), vx: 0, vy: -20, life: 2, max: 2, col: '#aeea00', r: 2, g: 0, fade: true }); alive = a.t < 10; break;
    }
    if (!alive) agents.splice(i, 1);
  }
  // plague spreading and crumbling
  if (!infected.size) plagueCap = 3500;
  if (infected.size) {
    plagueClock += dt;
    if (plagueClock >= .12) {
      plagueClock = 0;
      for (const [i, s] of [...infected]) {
        s.t += .12; const x = i % WW, y = (i/WW)|0;
        if (s.t > s.wait && infected.size < plagueCap) for (const [dx, dy, w] of NEIGH8) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < WW && ny >= 0 && ny < WH) { const j = ny*WW + nx; if (tiles[j] && (tiles[j] !== 5 || s.mega) && tiles[j] !== 8 && tiles[j] !== 9 && !infected.has(j) && Math.random() < s.sp*.12*w) infect(nx, ny, s.sp, s.mega); } }
        if (s.t > s.life) breakTile(x, y);
      }
    }
  }
}
let plagueClock = 0;

// ---------------------------------------------------------------- the bombs in flight
function throwBomb(x, y, vx, vy, def, fuse, impact, lit = true) {
  bombs.push({ x, y, vx, vy, def, fuse: fuse ?? def.p.fuse ?? 1.6, age: 0, bounces: 0, stuck: false, impact: impact || def.p.impact, tx: 0, ty: 0, lit });
  if (!lit) { const unlit = bombs.filter(b => !b.lit); if (unlit.length > 80) bombs.splice(bombs.indexOf(unlit[0]), 1); }
}
function ignite(b) { b.lit = true; b.fuse = b.def.p.fuse ?? 1.6; b.age = 0; spark(b.x, b.y - 6, 8, '#ffd740', 90, .4); }
function updateBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.age += dt; if (b.lit) b.fuse -= dt;
    if (!b.stuck) {
      b.vy += 900*dt;
      const nx = b.x + b.vx*dt; if (solidPx(nx, b.y)) { b.vx *= -.4; if (b.impact && b.lit && b.age > .05) b.fuse = 0; } else b.x = nx;
      const ny = b.y + b.vy*dt;
      if (solidPx(b.x, ny + (b.vy > 0 ? 3 : -3))) {
        if (b.impact && b.lit && b.age > .05) b.fuse = 0;
        else if (b.def.p.stick) { b.stuck = true; b.vx = b.vy = 0; }
        else { const bo = b.def.p.bounce ?? .35; b.vy = Math.abs(b.vy) > 60 ? -b.vy*bo : 0; b.vx *= .8; }
      } else b.y = ny;
      if (b.y > WH*TS + 6) { spark(b.x, WH*TS - 4, 6, '#fff', 80, .4); bombs.splice(i, 1); continue; }   // into the void: gone
    }
    if (b.lit && b.fuse <= 0) { b.tx = Math.floor(b.x/TS); b.ty = Math.floor(b.y/TS); bombs.splice(i, 1); explodeAt(b); }
  }
}

// ---------------------------------------------------------------- the player
const P = { x: 176*TS, y: 0, vx: 0, vy: 0, face: 1, phase: 0, onGround: false, grounded: 0, jumped: false, jumpBuf: 0, coyote: 0, sagDy: 0, stepOff: 0, airT: 0, dig: null, throwT: 0, aim: 0, w: 10, h: 26 };
function makePad(cx, w) { for (let x = cx - w/2; x < cx + w/2; x++) { const i = 60*WW + x; if (tiles[i] === 0) { tiles[i] = 1; placed.add(i); drawTile(x, 60); } } }
function respawn() { if (topRow(176) >= WH - 1) { makePad(176, 12); P.x = 176*TS; P.y = 57*TS; P.vx = P.vy = 0; P.stepOff = 0; P.sagDy = 0; P.dig = null; return; } P.x = 176*TS; P.y = (topRow(176) - 3)*TS; P.vx = P.vy = 0; P.stepOff = 0; P.sagDy = 0; P.dig = null; }
const keys = {};
addEventListener('keydown', e => { if (!inGame) return; if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) P.jumpBuf = .12; keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); if (e.code.startsWith('Digit')) { const n = +e.code.slice(5) - 1; const list = hotbar(); if (list[n]) { sel = list[n].id; renderBar(); } } if (e.code === 'KeyQ') cycle(-1); if (e.code === 'KeyE') cycle(1); });
addEventListener('keyup', e => { keys[e.code] = false; });
function hitsSolid(x, y) { // box of the player at (x = centre, y = feet)
  for (const px of [x - P.w/2, x, x + P.w/2]) for (let py = y - P.h; py <= y - .01; py += 6) if (solidPx(px, py)) return true;
  return solidPx(x - P.w/2, y - .5) || solidPx(x + P.w/2, y - .5);
}
function blockInFront() {
  const tx0 = Math.floor((P.x + P.face*(P.w/2 + 1))/TS), r0 = Math.floor((P.y - 1)/TS);
  for (let c = 0; c < 3; c++) for (let k = 0; k < 6; k++) { const tx = tx0 + P.face*c; if (tx < 0 || tx >= WW) continue; const t = tiles[(r0 - k)*WW + tx]; if (t && t !== 8 && t !== 5) return true; }   // a block within three steps ahead
  return false;
}
function startDig(up) { if (P.dig || !P.onGround) return; if (!blockInFront()) { floatText(P.x, P.y - 36, 'Nothing to dig!'); return; } P.dig = { t: 1, face: P.face, up, sparks: 0 }; }
function finishDig() {
  const d = P.dig, tx0 = Math.floor((P.x + d.face*(P.w/2 + 1))/TS), r0 = Math.floor((P.y - 1)/TS); let n = 0;
  for (let i = 0; i < 10; i++) for (let k = 0; k < (d.up ? 6 : 4); k++) n += breakTile(tx0 + d.face*i, r0 - (d.up ? i : 0) - k);   // the sloping tunnel is taller so his body fits as it climbs each step   // a staircase going up, wide enough to walk
  if (d.up) for (let i = 0; i < 10; i++) { const tx = tx0 + d.face*i, ty = r0 - i + 1; if (tx >= 0 && tx < WW && ty < WH && tiles[ty*WW + tx] === 0) { /* leave the floor as it was */ } }
  spark(P.x + d.face*40, P.y - 12 - (d.up ? 36 : 0), 30, '#a1887f', 180, .8); shake = Math.max(shake, 3); if (n) floatText(P.x + d.face*30, P.y - 40, '+' + n + ' 🧱');
  P.dig = null;
}
function updatePlayer(dt) {
  if (P.dig) {                                                  // one second of digging, then ten blocks ahead are gone
    P.dig.t -= dt; P.dig.sparks -= dt; P.vx = 0; P.face = P.dig.face;
    if (P.dig.sparks <= 0) { P.dig.sparks = .25; const tx = Math.floor((P.x + P.face*(P.w/2 + 3))/TS), ty = Math.floor((P.y - 8)/TS); spark(tx*TS + 4, ty*TS + 4, 6, '#8d6e63', 90, .4); shake = Math.max(shake, 1.5); }
    if (P.dig.t <= 0) finishDig();
  }
  const run = keys.Space, dir = P.dig ? 0 : (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const max = run ? 150 : 78; P.vx += (dir*max - P.vx)*Math.min(1, dt*(P.onGround ? 14 : 5));
  if (dir) P.face = dir;
  const down = keys.KeyS || keys.ArrowDown;
  const wasGround = P.onGround;
  P.jumpBuf = Math.max(0, P.jumpBuf - dt); P.coyote = P.onGround ? .1 : Math.max(0, P.coyote - dt);
  if (((keys.KeyW || keys.ArrowUp) || P.jumpBuf > 0) && P.coyote > 0 && !P.dig) { P.vy = -330; P.onGround = false; P.grounded = 0; P.coyote = 0; P.jumpBuf = 0; P.jumped = true; }
  P.vy += 900*dt;
  let nx = P.x + P.vx*dt;
  if (hitsSolid(nx, P.y)) { let stepped = false; for (let s = 1; s <= TS; s++) if (!hitsSolid(nx, P.y - s)) { P.y -= s; P.stepJust = s; stepped = true; break; } if (!stepped) { nx = P.x; P.vx = 0; } else { P.stepOff += (P.stepJust || 0); } }
  P.x = Math.max(8, Math.min(WW*TS - 8, nx));
  let ny = P.y + P.vy*dt;
  if (hitsSolid(P.x, ny)) { if (P.vy > 0) { P.onGround = true; ny = Math.floor(ny/TS)*TS; if (hitsSolid(P.x, ny)) ny = P.y; } else { ny = P.y; } P.vy = 0; }
  else {
    let landed = false;                                           // bridge planks: land on them from above, drop through with S or the down arrow
    if (P.vy >= 0 && !down) { const row = Math.floor(ny/TS); if (P.y <= row*TS + 1) for (const sx of [P.x - P.w/2 + 1, P.x, P.x + P.w/2 - 1]) { const tx = Math.floor(sx/TS); if (tx >= 0 && tx < WW && row >= 0 && row < WH && tiles[row*WW + tx] === 8) landed = true; } if (landed) ny = row*TS; }
    if (landed) { P.vy = 0; P.onGround = true; } else P.onGround = false;
  }
  P.y = ny;
  if (!P.onGround && wasGround && P.vy >= 0 && !P.jumped) {      // walking down a step or slope: stay glued to the ground instead of hopping
    for (let d = 1; d <= TS; d++) if (hitsSolid(P.x, P.y + d)) { const ty = Math.floor((P.y + d)/TS)*TS; P.stepOff -= (ty - P.y); P.y = ty; P.vy = 0; P.onGround = true; break; }
  }
  if (P.stepJust) { P.onGround = true; P.vy = 0; P.stepJust = 0; }
  P.stepOff -= Math.sign(P.stepOff)*Math.min(Math.abs(P.stepOff), 70*dt); P.stepOff = Math.max(-10, Math.min(10, P.stepOff));
  P.airT = P.onGround ? 0 : P.airT + dt;
  if (P.onGround) P.jumped = false;
  if (P.jumped && !P.onGround && P.vy > 0 && !down) {          // underground: the second you start falling after a jump, a bridge appears under you
    const tx0 = Math.floor(P.x/TS);
    if (tx0 >= 0 && tx0 < WW && P.y/TS > surf[tx0] + 2) {
      const row = Math.ceil(P.y/TS);
      for (const sx of [P.x - 3, P.x + 3]) { const tx = Math.floor(sx/TS); if (tx >= 0 && tx < WW && row < WH && tiles[row*WW + tx] === 0) { placeFill(tx, row); spark(tx*TS + 4, row*TS + 2, 5, sel === 'N' ? '#8bc34a' : '#c68a4a', 60, .35); } }
      P.jumped = false;
    }
  }
  // walking into a hole: a bridge block appears under his feet (he has endless bridge blocks)
  if (P.onGround) P.grounded = .15; else P.grounded -= dt;
  if (!down && P.grounded > 0) {
    const row = Math.round(P.y/TS);
    for (const sx of [P.x - 3, P.x + 3]) { const tx = Math.floor(sx/TS); if (tx < 0 || tx >= WW || row < 0 || row + 2 >= WH) continue;
      if (tiles[row*WW + tx] === 0 && tiles[(row + 1)*WW + tx] === 0 && tiles[(row + 2)*WW + tx] === 0) placeFill(tx, row); }
  }
  if (P.y > WH*TS + 6) { flash = Math.max(flash, .6); spark(P.x, WH*TS - 6, 24, '#fff', 200, .8); respawn(); }
  const sp = Math.abs(P.vx); if (P.onGround && sp > 4) P.phase += dt*(sp*.11 + 1.5); else if (sp < 4 && P.onGround) P.phase *= .9;
  P.throwT = Math.max(0, P.throwT - dt);
}
function drawPerson(c, x, y, face, ph, speed, air, throwT, aim, look, dig) {
  const TH = 7, SH = 7.5, TO = 9, UA = 5.5, FA = 5.5, run = speed > 110, moving = speed > 6;
  const amp = !moving ? .03 : run ? .95 : .55, Kf = run ? 1.5 : 1;
  const bob = moving && !air ? Math.abs(Math.sin(ph))*(run ? 2 : 1.2) : 0;
  const hx = x, hy = y - (TH + SH) + 1 - bob;
  const lean = air ? .15 : run ? .28 : moving ? .08 : 0;
  const sx = hx + face*Math.sin(lean)*TO, sy = hy - Math.cos(lean)*TO;
  const limb = (x0, y0, a1, a2, L1, L2) => { const kx = x0 + face*Math.sin(a1)*L1, ky = y0 + Math.cos(a1)*L1; return [kx, ky, kx + face*Math.sin(a2)*L2, ky + Math.cos(a2)*L2]; };
  const legs = [0, 1].map(i => { const f = ph + i*Math.PI; let th = amp*Math.sin(f), flex = moving ? Kf*Math.max(0, Math.cos(f))*.9 + .12 : .05; if (air) { th = i ? .7 : -.3; flex = i ? 1.4 : .5; } return limb(hx, hy, th, th - flex, TH, SH); });
  const arms = [0, 1].map(i => { const f = ph + i*Math.PI + Math.PI; let th = (moving ? amp*.9 : .04)*Math.sin(f), flex = moving ? (run ? 1.3 : .35 + .25*Math.max(0, Math.sin(f))) : .12; if (air) { th = i ? -2.4 : 1.6; flex = .6; } if (i === 0 && throwT > 0) { const p = 1 - throwT/.3; th = 2.5 - p*2.2 + aim*.0; flex = .5; } if (i === 0 && dig) { th = 1.35 + 1.25*Math.cos(dig.p*Math.PI*8); flex = .55; } return limb(sx, sy, th, th + flex, UA, FA); });
  const col = { skin: '#f1c27d', shirt: '#2979ff', pants: '#37474f', shoe: '#212121', dark: '#1a237e' };
  const line = (pts, color, w) => { c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.lineTo(pts[4], pts[5]); c.stroke(); };
  const joint = (x1, y1, color) => { c.fillStyle = color; c.beginPath(); c.arc(x1, y1, 1.9, 0, 7); c.fill(); };
  const drawLeg = (i, shade) => { const l = legs[i]; line([hx, hy, l[0], l[1], l[2], l[3]], shade ? '#263238' : col.pants, 3.4); joint(l[0], l[1], shade ? '#1b262c' : '#4a5d68'); c.fillStyle = col.shoe; c.fillRect(l[2] - (face > 0 ? 1 : 3.5), l[3] - 1, 4.5, 2.4); };
  const drawPick = a => {            // the pickaxe, held along the forearm
    const ang = (dig.th || 0), dx = face*Math.sin(ang), dy = Math.cos(ang), ex = a[2] + dx*12, ey = a[3] + dy*12;
    c.strokeStyle = '#8d6e63'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[2] - dx*3, a[3] - dy*3); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = '#cfd8dc'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(ex - dy*face*5 - dx*1, ey + dx*face*5 - dy*1); c.lineTo(ex + dy*face*5 - dx*1, ey - dx*face*5 - dy*1); c.stroke();
  };
  const drawArm = i => { const a = arms[i]; line([sx, sy, a[0], a[1], a[2], a[3]], i ? '#1c4fb8' : col.shirt, 2.8); joint(a[0], a[1], i ? '#c9a066' : col.skin); c.fillStyle = col.skin; c.beginPath(); c.arc(a[2], a[3], 1.6, 0, 7); c.fill(); if (i === 0 && dig) { dig.th = (1.35 + 1.25*Math.cos(dig.p*Math.PI*8)) + .55; drawPick(a); } };
  drawLeg(1, true); drawArm(1);
  c.strokeStyle = col.shirt; c.lineWidth = 5.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, hy); c.lineTo(sx, sy); c.stroke();
  const hdx = sx + face*Math.sin(lean)*3, hdy = sy - 5;
  c.fillStyle = col.skin; c.beginPath(); c.arc(hdx, hdy, 4.3, 0, 7); c.fill();
  c.fillStyle = '#3e2723'; c.beginPath(); c.arc(hdx - face*.6, hdy - .8, 4.4, Math.PI*1.02, Math.PI*2.0); c.fill();
  const lx = look ? Math.max(-1, Math.min(1, look)) : 0;
  c.fillStyle = '#fff'; c.fillRect(hdx + face*1.4, hdy - 1.2, 2.3, 2.3); c.fillStyle = '#111'; c.fillRect(hdx + face*1.4 + (face > 0 ? .9 : .1) + lx*.3, hdy - .6, 1.2, 1.4);
  drawLeg(0, false); drawArm(0);
}

// ---------------------------------------------------------------- the shop, the shopkeeper, the van
const SHOP = { x: 190*TS, w: 76, h: 50 };
let shopY = 0, shopVy = 0;
let vanT = -1, vanClock = 0, purchases = 0;
const stockLeft = {};
function restock() { ORDER.forEach(b => { stockLeft[b.id] = b.stock; }); }
restock();
function shopClosed() { return vanT >= 0; }
const van = { rY: 0, fY: 0, rV: 0, fV: 0 };
function topRow(tx) { tx = Math.max(0, Math.min(WW - 1, tx)); for (let r = 0; r < WH; r++) if (tiles[r*WW + tx] !== 0) return r; return WH - 1; }
function wheelGround(xpx, lvl) {   // where does this wheel stand? if there is no ground, lay a bridge plank at the van's level
  const tx = Math.max(0, Math.min(WW - 1, Math.floor(xpx/TS))), lr = Math.max(0, Math.floor(lvl/TS));
  for (let r = Math.max(0, lr - 4); r <= Math.min(WH - 1, lr + 3); r++) if (tiles[r*WW + tx] !== 0) return r*TS;
  if (tiles[lr*WW + tx] === 0) placeBridge(tx, lr);
  return lr*TS;
}
function startVan() { if (vanT < 0) { vanT = 0; const g = topRow(Math.floor(vanPos()/TS))*TS; van.rY = van.fY = g; van.rV = van.fV = 0; shopRender(); } }
function updateVanBody(dt) {
  const x = vanPos(), lvl = (van.rY + van.fY)/2;
  const gr = wheelGround(x - 26, lvl), gf = wheelGround(x + 26, lvl);
  for (const [k, v, g] of [['rY', 'rV', gr], ['fY', 'fV', gf]]) {
    if (van[k] < g - .1) { van[v] += 900*dt; van[k] = Math.min(g, van[k] + van[v]*dt); }     // falls (gravity)
    else { van[v] = 0; van[k] += (g - van[k])*Math.min(1, dt*10); }                        // climbs a slope
  }
}
function updateVan(dt) {
  if (vanT >= 0) {
    const prev = vanT; vanT += dt; updateVanBody(dt);
    if (prev < 5 && vanT >= 5) { restock(); }
    if (vanT >= 10.4) { vanT = -1; vanClock = 0; purchases = 0; }
    if ($('shop').classList.contains('open')) shopRender(true);
  } else { vanClock += dt; if (vanClock >= 60 || purchases >= 5) startVan(); }
}
function vanPos() { // the van's x position and whether the shopkeeper has his back turned
  const stop = SHOP.x - 80, from = stop - 520, to = stop + 800;
  if (vanT < 2.6) { const k = vanT/2.6; return from + (stop - from)*(1 - Math.pow(1 - k, 2)); }
  if (vanT < 8) return stop;
  const k = Math.min(1, (vanT - 8)/2.4); return stop + (to - stop)*k*k;
}
function drawShop(c, hover) {
  const sx = SHOP.x, gy = shopY, x0 = sx - SHOP.w/2;
  const back = vanT >= 2.6 && vanT < 8;
  // the keeper
  const kx = sx + (back ? -22 : 0), ky = gy - 10;
  c.save(); c.translate(0, 0);
  c.fillStyle = '#212121'; c.fillRect(kx - 5, ky - 14, 10, 10);                         // legs / lower
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fff' : '#d32f2f'; c.fillRect(kx - 6, ky - 24 + i*2.4, 12, 2.4); }  // red and white top
  c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(kx, ky - 29, 5, 0, 7); c.fill();       // head
  c.fillStyle = '#111'; c.beginPath(); c.arc(kx, ky - 30.5, 5.2, Math.PI, 0); c.fill(); // black hair
  if (!back) { c.fillStyle = '#111'; c.fillRect(kx - 2.6, ky - 29.5, 1.6, 1.8); c.fillRect(kx + 1.2, ky - 29.5, 1.6, 1.8); c.fillRect(kx - 1.5, ky - 26.4, 3, 1); }
  else { c.fillStyle = '#111'; c.beginPath(); c.arc(kx, ky - 29, 5.1, 0, 7); c.fill(); }
  if (back) { const bob = Math.sin(vanT*6)*2; c.fillStyle = '#a1783f'; c.fillRect(kx - 8, ky - 18 + bob, 7, 6); c.fillRect(kx + 1, ky - 18 - bob, 7, 6); }
  c.restore();
  // the stall
  c.fillStyle = '#6d4c2f'; c.fillRect(x0, gy - 40, 5, 40); c.fillRect(x0 + SHOP.w - 5, gy - 40, 5, 40);            // posts
  c.fillStyle = '#8d6238'; c.fillRect(x0 + 2, gy - 16, SHOP.w - 4, 16);                                              // counter
  c.fillStyle = '#a97c4a'; c.fillRect(x0 + 2, gy - 18, SHOP.w - 4, 3);
  for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#d32f2f'; c.fillRect(x0 - 3 + i*(SHOP.w + 6)/8, gy - 50, (SHOP.w + 6)/8, 10); }   // striped roof
  c.fillStyle = '#5d3d20'; c.fillRect(x0 - 3, gy - 41, SHOP.w + 6, 2);
  c.fillStyle = '#333'; c.fillRect(sx - 14, gy - 12, 28, 8); c.fillStyle = '#ffe14e'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('BOMBS', sx, gy - 6);
  if (shopClosed() && !back) { c.fillStyle = '#b71c1c'; c.fillRect(sx - 18, gy - 36, 36, 8); c.fillStyle = '#fff'; c.fillText('CLOSED', sx, gy - 30); }
  if (hover) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.setLineDash([4, 3]); c.strokeRect(x0 - 5, gy - 52, SHOP.w + 10, 54); c.setLineDash([]); }
  // the van: it rides the ground, tilting on slopes
  if (vanT >= 0) {
    const vx = vanPos(), vy = (van.rY + van.fY)/2, ang = Math.atan2(van.fY - van.rY, 52);
    c.save(); c.translate(vx, vy); c.rotate(ang);
    c.fillStyle = '#eceff1'; c.fillRect(-40, -34, 56, 28); c.fillStyle = '#1e88e5'; c.fillRect(16, -26, 24, 20);
    c.fillStyle = '#90caf9'; c.fillRect(28, -23, 10, 9); c.fillStyle = '#d32f2f'; c.fillRect(-40, -18, 56, 4);
    c.fillStyle = '#212121'; for (const w of [-26, 26]) { c.beginPath(); c.arc(w, -5, 6, 0, 7); c.fill(); c.fillStyle = '#777'; c.beginPath(); c.arc(w, -5, 2.5, 0, 7); c.fill(); c.fillStyle = '#212121'; }
    c.fillStyle = '#111'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('BOMB VAN', -12, -24);
    c.restore();
    if (vanT >= 2.6 && vanT < 8) for (let i = 0; i < 3; i++) { const k = ((vanT - 2.6)*.7 + i/3) % 1; c.fillStyle = '#a1783f'; c.fillRect(vx + (sx - 14 - vx)*k - 4, vy - 24 + (gy - vy)*k - Math.sin(k*3.14)*14 - 4, 8, 8); }
  }
}

function updateSag(dt) {
  const target = new Map();
  P.sagDy = 0;
  if (P.onGround) {
    const row = Math.round(P.y/TS), tx = Math.floor(P.x/TS);
    if (tx >= 0 && tx < WW && row >= 0 && row < WH && tiles[row*WW + tx] === 8) {
      let l = tx, r = tx; while (l > 0 && tiles[row*WW + l - 1] === 8) l--; while (r < WW - 1 && tiles[row*WW + r + 1] === 8) r++;
      const n = r - l + 1, anc = x => x < 0 || x >= WW || (tiles[row*WW + x] !== 0 && tiles[row*WW + x] !== 8);
      const aL = anc(l - 1), aR = anc(r + 1), A = Math.min(18, 3 + n*1.4);
      for (let x = l; x <= r; x++) { const k = (x - l + .5)/n; target.set(row*WW + x, aL && aR ? A*4*k*(1 - k) : aL ? A*k*k : aR ? A*(1 - k)*(1 - k) : A*.7); }
    }
  }
  for (const i of sagMap.keys()) if (!target.has(i)) target.set(i, 0);
  for (const [i, t] of target) { let c = sagMap.get(i) || 0; c += (t - c)*Math.min(1, dt*(t > c ? 10 : 4)); if (c < .05 && t === 0) sagMap.delete(i); else sagMap.set(i, c); }
  if (P.onGround) P.sagDy = sagMap.get(Math.round(P.y/TS)*WW + Math.floor(P.x/TS)) || 0;
}
function drawBridges(c) {
  for (const i of bridges) {
    const x = i % WW, y = (i/WW)|0, px = x*TS; if (px < camX - 16 || px > camX + VW + 16) continue;
    const sg = sagMap.get(i) || 0, py = y*TS + sg;
    c.fillStyle = '#c68a4a'; c.fillRect(px, py, TS, 3); c.fillStyle = '#8d5f2d'; c.fillRect(px, py + 3, TS, 1); c.fillStyle = '#a8713a'; c.fillRect(px + 3, py, 1, 3);
    if (sg > .5) { c.fillStyle = '#8d5f2d'; c.fillRect(px, py - 0, TS, 1); }
  }
}
function groundUnder(xpx, fromY) {
  const tx = Math.max(0, Math.min(WW - 1, Math.floor(xpx/TS)));
  for (let r = Math.max(0, Math.floor(fromY/TS)); r < WH; r++) if (tiles[r*WW + tx] !== 0) return r*TS;
  return WH*TS;
}
function updateShop(dt) {     // the stall has gravity too
  const g = Math.min(groundUnder(SHOP.x - 30, shopY - TS), groundUnder(SHOP.x, shopY - TS), groundUnder(SHOP.x + 30, shopY - TS));
  if (g >= WH*TS) { if (topRow(Math.floor(SHOP.x/TS)) >= WH - 1) { makePad(190, 14); shopY = 60*TS; } else shopY = topRow(Math.floor(SHOP.x/TS))*TS; shopVy = 0; return; }
  if (shopY < g - .1) { shopVy += 900*dt; shopY = Math.min(g, shopY + shopVy*dt); } else { shopVy = 0; shopY = g; }
}

// ---------------------------------------------------------------- the shop window
const owned = () => ORDER.filter(b => count(b) > 0);
const hotbar = () => [LIGHTER, PICKAXE, NATURE, ...(indFlat ? [NATSQ] : []), ...owned()];
let pickSlot = null;
function renderBar() {
  const bar = $('bar'); bar.innerHTML = '';
  const list = hotbar(); if (!list.find(b => b.id === sel)) sel = 'L';
  list.forEach((b, i) => {
    const d = document.createElement('div'); d.className = 'slot' + (b.id === sel ? ' sel' : '');
    d.innerHTML = (b.tool ? (b.id === 'L' ? '🔥' : b.id === 'N' ? '🌿' : b.id === 'S' ? '🟩' : '⛏️') : '<i style="background:' + b.color + '"></i>') + (i < 9 ? ' ' + (i + 1) + ' ' : ' ') + b.name + '<br>' + (b.tool ? b.label : b.free ? '∞' : '×' + count(b));
    if (b.id === 'P') pickSlot = d;
    d.onclick = () => { sel = b.id; renderBar(); }; bar.appendChild(d);
  });
}
function cycle(d) { const list = hotbar(); const i = Math.max(0, list.findIndex(b => b.id === sel)); sel = list[(i + d + list.length) % list.length].id; renderBar(); }
addEventListener('wheel', e => { if (inGame && !$('shop').classList.contains('open')) cycle(e.deltaY > 0 ? 1 : -1); });
function shopRender(light) {
  $('shopWallet').innerHTML = '🧱 You have <b style="color:#ffe14e">' + wallet + '</b> blocks';
  const cl = $('closed');
  if (shopClosed()) { cl.style.display = 'block'; cl.textContent = '🚚 The van is here. The shop is closed for ' + Math.max(0, Math.ceil(10.4 - vanT)) + ' seconds while he restocks.'; } else cl.style.display = 'none';
  const g = $('grid'); const top = g.scrollTop; g.innerHTML = '';
  ORDER.forEach(b => {
    if (b.free) return;
    const unlocked = total >= b.need, left = stockLeft[b.id];
    const d = document.createElement('div'); d.className = 'card' + (unlocked ? '' : ' locked');
    let info;
    if (!unlocked) info = '🔒 Break <b>' + b.need + '</b> blocks to unlock<br><span class="dim">(you have broken ' + total + ')</span>';
    else info = '🧱 ' + b.price + ' for <b>' + b.give + '</b> bomb' + (b.give > 1 ? 's' : '') + '<br><span class="dim">' + (left === Infinity ? 'always in stock' : left > 0 ? left + ' left until the van' : 'SOLD OUT until the van') + ' · you own ' + count(b) + '</span>';
    d.innerHTML = '<h3><i style="background:' + b.color + '"></i>' + b.name + '</h3>' + info;
    if (unlocked) {
      const btn = document.createElement('button'); btn.textContent = shopClosed() ? 'Closed' : left <= 0 ? 'Sold out' : wallet < b.price ? 'Need more blocks' : 'Buy';
      btn.disabled = shopClosed() || left <= 0 || wallet < b.price;
      btn.onclick = () => b.warn ? askWarn(() => buy(b)) : buy(b); d.appendChild(btn);
    }
    g.appendChild(d);
  });
  g.scrollTop = top;
}
function buy(b) {
  if (shopClosed() || stockLeft[b.id] <= 0 || wallet < b.price || total < b.need) return;
  wallet -= b.price; inv[b.id] = (inv[b.id] || 0) + b.give; if (stockLeft[b.id] !== Infinity) stockLeft[b.id]--;
  purchases++; if (purchases >= 5) startVan();
  shopRender(); renderBar(); save();
}
const FONT = { A:[14,17,17,31,17,17,17], B:[30,17,17,30,17,17,30], C:[14,17,16,16,16,17,14], D:[30,17,17,17,17,17,30], E:[31,16,16,30,16,16,31], F:[31,16,16,30,16,16,16], G:[14,17,16,23,17,17,15], H:[17,17,17,31,17,17,17], I:[14,4,4,4,4,4,14], J:[7,2,2,2,2,18,12], K:[17,18,20,24,20,18,17], L:[16,16,16,16,16,16,31], M:[17,27,21,21,17,17,17], N:[17,17,25,21,19,17,17], O:[14,17,17,17,17,17,14], P:[30,17,17,30,16,16,16], Q:[14,17,17,17,21,18,13], R:[30,17,17,30,20,18,17], S:[15,16,16,14,1,1,30], T:[31,4,4,4,4,4,4], U:[17,17,17,17,17,17,14], V:[17,17,17,17,17,10,4], W:[17,17,17,21,21,21,10], X:[17,17,10,4,10,17,17], Y:[17,17,10,4,4,4,4], Z:[31,1,2,4,8,16,31], '?':[14,17,1,2,4,0,4], ':':[0,4,0,0,0,4,0], ',':[0,0,0,0,4,4,8], '.':[0,0,0,0,0,0,4], ' ':[0,0,0,0,0,0,0] };
function pixelText(c, text, cx, y, scale) {            // letters drawn from a 5 x 7 grid of squares
  const w = text.length*6*scale - scale; let x = cx - w/2;
  for (const ch of text) { const g = FONT[ch] || FONT[' ']; for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++) if (g[r] & (16 >> k)) c.fillRect(Math.round(x + k*scale), Math.round(y + r*scale), scale, scale); x += 6*scale; }
}
function pixelTriangle(c, x0, y0, sc) {                // a white warning triangle with a black outline and a black ! in it, all in big pixels
  const H = 15, cx = 8;
  for (let r = 0; r < H; r++) {
    const half = Math.round(r*8/(H - 1));
    for (let k = -half; k <= half; k++) {
      const edge = (k === -half || k === half || r === H - 1 || r === 0);
      c.fillStyle = edge ? '#000' : '#fff'; c.fillRect(x0 + (cx + k)*sc, y0 + r*sc, sc, sc);
    }
  }
  c.fillStyle = '#000';
  for (let r = 5; r <= 9; r++) c.fillRect(x0 + (cx - 0)*sc, y0 + r*sc, sc, sc);          // the bar of the !
  for (let r = 5; r <= 9; r++) c.fillRect(x0 + (cx - 1)*sc, y0 + r*sc, sc, sc);
  c.fillRect(x0 + (cx - 1)*sc, y0 + 11*sc, 2*sc, 2*sc);                                  // the dot of the !
}
let warnGo = null;
function askWarn(go) {
  warnGo = go; const cv2 = $('warnSign'), c = cv2.getContext('2d'), W2 = cv2.width, H2 = cv2.height;
  c.imageSmoothingEnabled = false; c.clearRect(0, 0, W2, H2);
  for (let x = 0; x < W2; x += 20) for (let y = 0; y < H2; y += 20) if (x < 20 || y < 20 || x >= W2 - 20 || y >= H2 - 20) { c.fillStyle = ((x + y)/20) % 2 ? '#d32f2f' : '#fff'; c.fillRect(x, y, 20, 20); }   // red and white border
  c.fillStyle = '#c62828'; c.fillRect(20, 20, W2 - 40, H2 - 40); c.strokeStyle = '#fff'; c.lineWidth = 4; c.strokeRect(30, 30, W2 - 60, H2 - 60);
  c.fillStyle = '#fff';
  pixelText(c, 'WARNING:', W2/2, 56, 8); pixelTriangle(c, 42, 44, 5); pixelTriangle(c, W2 - 42 - 17*5, 44, 5); c.fillStyle = '#fff'; pixelText(c, 'THIS WILL DESTROY', W2/2, 132, 5); pixelText(c, 'THE ENTIRE WORLD.', W2/2, 178, 5); pixelText(c, 'CONTINUE?', W2/2, 236, 6);
  $('warn').classList.add('open');
}
function closeWarn() { $('warn').classList.remove('open'); warnGo = null; }
$('warnYes').onclick = () => { const g = warnGo; closeWarn(); if (g) g(); };
$('warnNo').onclick = closeWarn;
function openShop() { $('shop').classList.add('open'); shopRender(); }
$('shopClose').onclick = () => $('shop').classList.remove('open');
addEventListener('keydown', e => { if (e.code === 'Escape') { if ($('warn').classList.contains('open')) closeWarn(); else $('shop').classList.remove('open'); } });
$('shopbtn').onclick = openShop;
$('newworld').onclick = () => { makeWorld(); respawn(); };

// ---------------------------------------------------------------- mouse
const mouse = { x: 0, y: 0, wx: 0, wy: 0 };
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left)/r.width*VW; mouse.y = (e.clientY - r.top)/r.height*VH; });
const overShop = () => mouse.wx > SHOP.x - SHOP.w/2 - 5 && mouse.wx < SHOP.x + SHOP.w/2 + 5 && mouse.wy > shopY - 52 && mouse.wy < shopY + 2;
cv.addEventListener('pointerdown', e => {
  if ($('shop').classList.contains('open')) return;
  const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left)/r.width*VW; mouse.y = (e.clientY - r.top)/r.height*VH; mouse.wx = mouse.x + camX; mouse.wy = mouse.y + camY;
  if (overShop()) { openShop(); return; }
  if (sel === 'L') {                                                    // the Lighter: click any bomb you can see to light it
    let best = null, bd = 22; for (const bm of bombs) if (!bm.lit) { const d = Math.hypot(bm.x - mouse.wx, bm.y - mouse.wy); if (d < bd) { bd = d; best = bm; } }
    if (best) { ignite(best); P.throwT = .3; P.face = best.x >= P.x ? 1 : -1; }
    else spark(mouse.wx, mouse.wy, 4, '#ffd740', 50, .25);
    return;
  }
  if (sel === 'S') {                                                    // the Nature Square: grass rises up out of the ground, 30 wide and 30 tall
    const tx = Math.floor(mouse.wx/TS), ty = Math.floor(mouse.wy/TS);
    if (tx < 0 || tx >= WW) return;
    const g = topRow(tx);
    if (ty < g) { floatText(P.x, P.y - 36, 'Click the ground!'); return; }
    agents.push({ type: 'square', tx, g, t: 0, done: 0 }); return;
  }
  if (sel === 'N') {                                                    // the Nature Block: click to place the block that belongs there
    const tx = Math.floor(mouse.wx/TS), ty = Math.floor(mouse.wy/TS);
    if (tx >= 0 && tx < WW && ty >= 0 && ty < WH - 1 && tiles[ty*WW + tx] === 0 && Math.hypot(mouse.wx - P.x, mouse.wy - (P.y - 12)) < 90) {
      const sv = tiles[ty*WW + tx]; placeNature(tx, ty); if (hitsSolid(P.x, P.y)) { tiles[ty*WW + tx] = sv; placed.delete(ty*WW + tx); drawTile(tx, ty); } else spark(tx*TS + 4, ty*TS + 4, 5, '#8bc34a', 60, .3);
    }
    return;
  }
  if (sel === 'P') { P.face = mouse.wx >= P.x ? 1 : -1; startDig(mouse.wy < P.y - 6); return; }   // click above your feet = dig up the slope, below = dig flat
  const b = ORDER.find(x => x.id === sel); if (!b || count(b) <= 0 || P.throwT > 0) return;
  if (!b.free) { inv[b.id]--; renderBar(); }
  const hx = P.x, hy = P.y - 20; const dx = mouse.wx - hx, dy = mouse.wy - hy, d = Math.hypot(dx, dy) || 1;
  P.face = dx >= 0 ? 1 : -1; P.throwT = .3;
  const sp = Math.max(160, Math.min(560, d*3.2));
  throwBomb(hx + P.face*6, hy - 4, dx/d*sp, dy/d*sp - 40, b, null, false, false);
});

// ---------------------------------------------------------------- the loop
let camX = 0, camY = 0;
function update(dt) {
  if (!inGame) return;
  updatePlayer(dt); updateBombs(dt); updateAgents(dt); updateVan(dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt;
    if (p.ring) { p.r += (p.max - p.r)*Math.min(1, dt*12); }
    else {
      p.vy += (p.g || 0)*dt; p.x += p.vx*dt; p.y += p.vy*dt;
      if (p.lava && solidPx(p.x, p.y)) { const tx = Math.floor(p.x/TS), ty = Math.floor(p.y/TS); carve(tx, ty, 1.8, circ(1.8)); spark(p.x, p.y, 4, '#ff6d00', 80, .4); p.life = 0; }
    }
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) { texts[i].life -= dt; texts[i].y -= 20*dt; if (texts[i].life <= 0) texts.splice(i, 1); }
  for (let i = beams.length - 1; i >= 0; i--) { beams[i].life -= dt; if (beams[i].life <= 0) beams.splice(i, 1); }
  shake *= Math.pow(.02, dt); flash = Math.max(0, flash - dt*.9); pulse = Math.max(0, pulse - dt);
  // the camera follows him
  const tx = P.x - VW/2, ty = P.y - VH*.62;
  camX += (tx - camX)*Math.min(1, dt*6); camY += (ty - camY)*Math.min(1, dt*6);
  camX = Math.max(0, Math.min(WW*TS - VW, camX)); camY = Math.max(0, Math.min(WH*TS - VH, camY));
  mouse.wx = mouse.x + camX; mouse.wy = mouse.y + camY;
  updateShop(dt); updateSag(dt);
  if (pickSlot) pickSlot.style.opacity = blockInFront() || P.dig ? 1 : .45;
  $('hud').innerHTML = '<span style="' + (pulse ? 'transform:scale(1.1);display:inline-block' : '') + '">🧱 <b>' + wallet + '</b> blocks</span><br><span style="font-size:.8em">broken in total: ' + total + ' · next van in ' + (shopClosed() ? 'now!' : Math.max(0, Math.ceil(60 - vanClock)) + 's') + ' · ' + ORDER.length + ' bombs to find<br>🌉 bridge blocks: ∞ (they appear when you walk over a hole)</span>';
}
function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#6ec6ff'); g.addColorStop(1, '#d6f0ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const ox = (Math.random() - .5)*shake, oy = (Math.random() - .5)*shake;
  ctx.save(); ctx.translate(Math.round(-camX + ox), Math.round(-camY + oy));
  // clouds
  ctx.fillStyle = '#ffffffcc'; for (let i = 0; i < 9; i++) { const cx = (i*430 + performance.now()*.004*(1 + i%3)) % (WW*TS), cy = 40 + (i*53) % 220; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.arc(cx + 22, cy + 4, 16, 0, 7); ctx.arc(cx - 22, cy + 5, 14, 0, 7); ctx.fill(); }
  ctx.drawImage(worldCv, 0, 0);
  drawBridges(ctx);
  if (voidTiles.size) { const pulse2 = .65 + .35*Math.sin(performance.now()*.004); for (const i of voidTiles) { const x = i % WW, px = x*TS; if (px < camX - 24 || px > camX + VW + 24) continue; const gr = ctx.createRadialGradient(px + 4, WH*TS, 0, px + 4, WH*TS, 26); gr.addColorStop(0, 'rgba(255,255,255,' + (.85*pulse2) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(px - 24, WH*TS - 30, 56, 30); } }
  drawShop(ctx, overShop() && !$('shop').classList.contains('open'));
  // the player
  drawPerson(ctx, P.x, P.y + P.sagDy + P.stepOff, P.face, P.phase, Math.abs(P.vx), P.airT > .12, P.throwT, 0, 0, P.dig ? { p: 1 - P.dig.t } : null);
  // bombs
  for (const b of bombs) {
    ctx.fillStyle = b.def.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6'; ctx.beginPath(); ctx.arc(b.x - 1.5, b.y - 1.5, 1.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x + 1, b.y - 4); ctx.quadraticCurveTo(b.x + 3, b.y - 7, b.x + 2, b.y - 8); ctx.stroke();
    if (b.lit) { const blink = Math.sin(b.age*(12 + 10/Math.max(.2, b.fuse))) > 0; ctx.fillStyle = blink ? '#ff5252' : '#ffd740'; ctx.beginPath(); ctx.arc(b.x + 2, b.y - 8.5, 2.2, 0, 7); ctx.fill(); if (Math.random() < .5) parts.push({ x: b.x + 2, y: b.y - 9, vx: rnd(-20, 20), vy: rnd(-60, -20), life: .3, max: .3, col: '#ffd740', r: 1.5, g: 0 }); }
    else if (sel === 'L' && Math.hypot(b.x - mouse.wx, b.y - mouse.wy) < 22) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  }
  // things made by bombs
  for (const a of agents) {
    if (a.type === 'mouse') { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a); ctx.fillStyle = '#cfcfcf'; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.arc(-1.5, -2.4, 1.4, 0, 7); ctx.arc(-1.5, 2.4, 1.4, 0, 7); ctx.fill(); ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-8, Math.sin(a.t)*3, -10, 0); ctx.stroke(); ctx.restore(); }
    if (a.type === 'hole') { const k = a.t < a.T*.7 ? a.t/(a.T*.7) : Math.max(0, 1 - (a.t - a.T*.7)/(a.T*.3)); ctx.save(); ctx.translate(a.x, a.y); const r = a.R*k; const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 6); gr.addColorStop(0, '#000'); gr.addColorStop(.7, '#000'); gr.addColorStop(1, '#7e57c2'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, 7); ctx.fill(); ctx.rotate(a.t*5); ctx.strokeStyle = '#b39ddb'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, r*(.5 + i*.2), i, i + 2); ctx.stroke(); } ctx.restore(); }
    if (a.type === 'meteor') { ctx.fillStyle = '#ff6e40'; ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd180'; ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, 7); ctx.fill(); }
  }
  for (const p of parts) {
    if (p.ring) { ctx.strokeStyle = p.col; ctx.globalAlpha = Math.max(0, p.life/p.mx); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; continue; }
    ctx.globalAlpha = p.fade ? Math.max(0, Math.min(1, p.life/p.max))*.7 : Math.max(0, Math.min(1, p.life/Math.min(p.max, .5)));
    ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  for (const b of beams) { ctx.strokeStyle = b.col; ctx.lineWidth = 4; ctx.globalAlpha = Math.max(0, b.life*4); ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x1 + 6, (b.y1 + b.y2)/2); ctx.lineTo(b.x2, b.y2); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; for (const t of texts) { ctx.globalAlpha = Math.min(1, t.life); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(t.s, t.x, t.y); ctx.fillText(t.s, t.x, t.y); } ctx.globalAlpha = 1;
  ctx.restore();
  if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, flash) + ')'; ctx.fillRect(0, 0, VW, VH); }
}
let last = performance.now(), accum = 0;
function frame(now) {
  accum += Math.min(.1, (now - last)/1000); last = now;
  while (accum >= 1/60) { update(1/60); accum -= 1/60; }
  const wn = $('warn'); if (wn.classList.contains('open')) $('warnSign').style.transform = 'translateY(' + (Math.sin(now/1000*5.2)*14).toFixed(1) + 'px)';     // the sign bobs up and down
  draw(); requestAnimationFrame(frame);
}

const readIndex = () => { try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || []; } catch (e) { return []; } };
const writeIndex = a => { try { localStorage.setItem(INDEX_KEY, JSON.stringify(a)); } catch (e) {} };
function rleCols(arr) {                        // squash the tiles into runs, column by column
  const out = []; let prev = -1, run = 0;
  for (let x = 0; x < WW; x++) for (let y = 0; y < WH; y++) { const v = arr[y*WW + x]; if (v === prev) run++; else { if (run) out.push(prev, run); prev = v; run = 1; } }
  out.push(prev, run); return out;
}
function unRleCols(out) { const a = new Uint8Array(WW*WH); let i = 0; for (let k = 0; k < out.length; k += 2) for (let m = 0; m < out[k + 1]; m++, i++) a[(i % WH)*WW + ((i/WH)|0)] = out[k]; return a; }
const maskOf = set => { const m = new Uint8Array(WW*WH); for (const i of set) m[i] = 1; return m; };
function saveGame() {
  const data = { name: currentName, saved: Date.now(), wallet, total, inv, sel, px: P.x, py: P.y, face: P.face,
    world: { t: rleCols(tiles), s: Array.from(surf), p: rleCols(maskOf(placed)), v: [...voidTiles], b: [...bridges], sky: skyBelow, ind: indFlat } };
  try {
    localStorage.setItem(GAME_KEY(currentName), JSON.stringify(data));
    const idx = readIndex().filter(g => g.name !== currentName); idx.push({ name: currentName, saved: data.saved, wallet, total }); writeIndex(idx);
  } catch (e) { toast("Couldn't save: the browser's memory is full"); }
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; setTimeout(() => { t.style.opacity = 0; }, 3500); }
function applyWorld(w) {
  tiles = unRleCols(w.t); surf = Int16Array.from(w.s);
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 7) tiles[i] = 2;      // blocks that were mid-plague settle back as dirt
  placed.clear(); const pm = unRleCols(w.p); for (let i = 0; i < pm.length; i++) if (pm[i]) placed.add(i);
  voidTiles.clear(); w.v.forEach(i => voidTiles.add(i)); bridges.clear(); sagMap.clear(); w.b.forEach(i => bridges.add(i));
  skyBelow = !!w.sky; indFlat = !!w.ind; infected.clear();
  wx.clearRect(0, 0, worldCv.width, worldCv.height); for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) drawTile(x, y);
}
function startGame(kind, name) {
  wallet = 0; total = 0; inv = {}; sel = 'L'; makeWorld();
  let data = null;
  if (kind === 'load') { try { data = JSON.parse(localStorage.getItem(GAME_KEY(name))); } catch (e) {} }
  if (data) { wallet = data.wallet || 0; total = data.total || 0; inv = data.inv || {}; sel = data.sel ?? 'L'; if (data.world) applyWorld(data.world); }
  currentName = name; vanT = -1; vanClock = 0; purchases = 0; restock(); shopY = topRow(Math.floor(SHOP.x/TS))*TS; shopVy = 0;
  respawn(); if (data && data.px != null) { P.x = data.px; P.y = data.py; P.face = data.face || 1; P.vx = P.vy = 0; if (hitsSolid(P.x, P.y)) respawn(); }
  camX = P.x - VW/2; camY = P.y - VH*.62; renderBar(); inGame = true; saveGame();
  try { history.replaceState(null, '', '#game=' + encodeURIComponent(name)); } catch (e) {}     // every game has its own link
}
makeWorld(); respawn(); renderBar();
camX = P.x - VW/2; camY = P.y - VH*.62;
requestAnimationFrame(frame);
window.__bs = { placed, voidTiles, sagMap, bridges, bombs: () => bombs, startVan, van, vanPos, vanT: () => vanT, shopY: () => shopY, keys, tileAt: (x, y) => tiles[y*WW + x], P, cam: () => [camX, camY], explodeAt, ORDER, tiles: () => tiles, WW, WH, TS, surf: () => surf, update, getWallet: () => wallet, setWallet: v => { wallet = v; } };
