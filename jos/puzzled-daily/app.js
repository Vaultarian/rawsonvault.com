// Jos's Puzzle Daily: one game per page. The page sets window.ONLY = 'scoot' | 'neon' | 'currents'.
const S = 480, PAD = 36, W = S + PAD*2;      // board size, margin (for the exit), canvas size
const ONLY = window.ONLY;
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

const THEMES = [
  { name:'Space',   emoji:'🌌', bg:'#0d0b1f', panel:'#17143a', line:'#2a2550', accent:'#b46bff', pal:['#ff4ec7','#2196f3','#6bff4e','#ffe14e','#ff8a3d','#b46bff','#00e5d0','#ff5a5a'] },
  { name:'Ocean',   emoji:'🌊', bg:'#06151f', panel:'#0b2a3d', line:'#134a66', accent:'#00e5d0', pal:['#ff6b9d','#ffd93d','#6bff8a','#4dd2ff','#ff9a3d','#c08bff','#ff5a5a','#e0f7ff'] },
  { name:'Candy',   emoji:'🍭', bg:'#2a0f24', panel:'#43193a', line:'#6b2a5c', accent:'#ff7ac8', pal:['#ff7ac8','#7ad7ff','#b6ff7a','#ffe97a','#ffa07a','#c9a7ff','#7affd9','#ff6b6b'] },
  { name:'Forest',  emoji:'🌲', bg:'#0a1a10', panel:'#12301d', line:'#1f5030', accent:'#6bff4e', pal:['#ffe14e','#ff7a59','#7ad7ff','#ff8ad8','#c4ff4e','#b48bff','#4effc9','#ff5a5a'] },
  { name:'Sunset',  emoji:'🌅', bg:'#1f0d0a', panel:'#3a1912', line:'#63291c', accent:'#ff8a3d', pal:['#ffe14e','#ff4ec7','#4dd2ff','#6bff8a','#ff6b3d','#b46bff','#00e5d0','#ffffff'] },
  { name:'Ice',     emoji:'❄️', bg:'#0a1424', panel:'#12233f', line:'#223d6b', accent:'#8fe3ff', pal:['#8fe3ff','#ff7ab8','#b6ff7a','#ffe97a','#ffa07a','#c9a7ff','#5affd0','#ff6b6b'] },
  { name:'Volcano', emoji:'🌋', bg:'#1a0707', panel:'#301010', line:'#561c1c', accent:'#ff5a3d', pal:['#ffe14e','#4dd2ff','#6bff8a','#ff7ac8','#ffa23d','#b48bff','#00e5d0','#ffffff'] },
  { name:'Jungle',  emoji:'🦜', bg:'#07180f', panel:'#0e2e1a', line:'#1a5030', accent:'#ffe14e', pal:['#ff4ec7','#4dd2ff','#b6ff4e','#ff8a3d','#c08bff','#00e5d0','#ff5a5a','#fff3a0'] }
];

// ---- today (add ?day=2026-11-20 to the address to peek at another day)
function dayKey() {
  const q = new URLSearchParams(location.search).get('day');
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
const DAY = dayKey();
const [yy, mm, dd] = DAY.split('-').map(Number);
$('date').textContent = 'Today is ' + new Date(yy, mm-1, dd).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
setInterval(() => { if (!new URLSearchParams(location.search).get('day') && dayKey() !== DAY) location.reload(); }, 30000);

// ---- saved results: this is what keeps a finished game locked, even after a reload
const store = {
  get(g) { try { return JSON.parse(localStorage.getItem('jos-puzzle:' + DAY + ':' + g)); } catch (e) { return null; } },
  set(g, v) { try { localStorage.setItem('jos-puzzle:' + DAY + ':' + g, JSON.stringify(v)); } catch (e) {} }
};

// ---- today's theme for this game
const rs = n => Gen.rng(Gen.hash(DAY + ':' + n));
const TH = THEMES[Math.floor(rs(ONLY + ':theme')() * THEMES.length)];
(function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty('--bg', TH.bg); r.setProperty('--panel', TH.panel); r.setProperty('--line', TH.line); r.setProperty('--accent', TH.accent);
  $('theme').textContent = 'Today\'s theme: ' + TH.emoji + ' ' + TH.name;
})();

const fmt = s => s >= 60 ? Math.floor(s/60) + ' min ' + (s % 60) + ' sec' : s + ' sec';
const ptr = { x: W/2, y: W/2 };          // where the pointer is (canvas pixels), for the blocks' eyes

function cellAt(e, N, ox = 0, oy = 0) {
  const r = canvas.getBoundingClientRect(), u = S / N;
  return { fx: ((e.clientX - r.left) / r.width * W - PAD - ox) / u, fy: ((e.clientY - r.top) / r.height * W - PAD - oy) / u };
}
function begin() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = TH.bg; ctx.fillRect(0, 0, W, W); ctx.translate(PAD, PAD); }
function drawBoard(N, exitRow) {
  ctx.fillStyle = TH.panel; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = TH.line; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 1; i < N; i++) { ctx.moveTo(i*S/N, 0); ctx.lineTo(i*S/N, S); ctx.moveTo(0, i*S/N); ctx.lineTo(S, i*S/N); }
  ctx.stroke();
}
function wall(exitRow, N) {                                // the frame, with a real gap for the exit
  const u = S / N;
  ctx.save(); ctx.strokeStyle = TH.accent; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.shadowColor = TH.accent; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(S, 0); ctx.moveTo(0, S); ctx.lineTo(S, S); ctx.moveTo(0, 0); ctx.lineTo(0, S);
  if (exitRow == null) { ctx.moveTo(S, 0); ctx.lineTo(S, S); }
  else { ctx.moveTo(S, 0); ctx.lineTo(S, exitRow*u); ctx.moveTo(S, (exitRow+1)*u); ctx.lineTo(S, S); }
  ctx.stroke(); ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// =============================== SCOOT
const BLUES = ['#2196f3', '#3d7bff', '#1e88e5', '#4aa8ff', '#2f6fe0', '#5b9bff', '#1976d2', '#42a5f5'];
const Scoot = {
  name: 'scoot', title: '🟥 Scoot',
  rules: 'Slide the blocks. Get the red block out through the EXIT on the right. Drag a block along its track.',
  init() {
    const p = puzzles.scoot;
    this.cars = p.cars.map((c, i) => ({ ...c, dp: null, col: i === 0 ? '#ff3b3b' : BLUES[i % BLUES.length] }));
    this.moves = 0; this.drag = null; this.won = false; this.out = null; this.fin = false; this.mood = 'neutral';
  },
  occ(except) {
    const o = new Array(36).fill(-1);
    this.cars.forEach((c, i) => { if (i === except) return; for (let k = 0; k < c.len; k++) { const x = c.h ? c.p + k : c.f, y = c.h ? c.f : c.p + k; o[y*6 + x] = i; } });
    return o;
  },
  down(e) {
    if (this.won) return;
    const { fx, fy } = cellAt(e, 6), cx = Math.floor(fx), cy = Math.floor(fy);
    const i = this.cars.findIndex(c => { for (let k = 0; k < c.len; k++) { const x = c.h ? c.p + k : c.f, y = c.h ? c.f : c.p + k; if (x === cx && y === cy) return true; } return false; });
    if (i < 0) return;
    const c = this.cars[i], o = this.occ(i);
    let lo = c.p, hi = c.p;
    const cell = q => c.h ? o[c.f*6 + q] : o[q*6 + c.f];
    while (lo - 1 >= 0 && cell(lo - 1) < 0) lo--;
    while (hi + c.len < 6 && cell(hi + c.len) < 0) hi++;
    this.drag = { i, lo, hi, from: c.p, sp: c.h ? fx : fy, tx: { v: fx, dir: 0, ext: fx }, ty: { v: fy, dir: 0, ext: fy }, turns: [] };
  },
  move(e) {
    if (!this.drag) return;
    const d = this.drag, c = this.cars[d.i], { fx, fy } = cellAt(e, 6);
    c.dp = Math.max(d.lo, Math.min(d.hi, d.from + ((c.h ? fx : fy) - d.sp)));
    const now = performance.now();                           // shaking: several quick reversals along either axis
    for (const [tr, v] of [[d.tx, fx], [d.ty, fy]]) {
      const dir = Math.sign(v - tr.ext);
      if (!tr.dir) { if (Math.abs(v - tr.ext) > .12) { tr.dir = dir; tr.ext = v; } continue; }
      if (dir === tr.dir) { tr.ext = v; }
      else if (Math.abs(v - tr.ext) > .2) { tr.dir = dir; tr.ext = v; d.turns.push(now); }
    }
    d.turns = d.turns.filter(x => now - x < 1500);
    if (d.i !== 0 && d.turns.length >= 4) c.dizzy = now + 2500;
  },
  up() {
    if (!this.drag) return;
    const c = this.cars[this.drag.i];
    const p = Math.round(c.dp == null ? c.p : c.dp);
    if (p !== this.drag.from) this.moves++;
    c.p = p; c.dp = null; this.drag = null;
    if (this.cars[0].p === 4) { this.won = true; this.out = performance.now(); }   // red drives out of the exit
  },
  draw() {
    begin(); const u = S/6, t = performance.now();
    const E = this.out != null ? t - this.out : -1;          // ms since the red block reached the exit
    const ease = x => x*x*(3 - 2*x), cl = x => Math.max(0, Math.min(1, x));
    let redP = null, iris = null;
    if (E >= 0) {
      // he keeps going the way he was pushed: smile, then really happy, camera following him, then zoom + iris-out
      redP = 4 + 0.0034*E*(0.6 + 0.4*ease(cl(E/500)));                        // rolls out and keeps rolling
      const k = ease(cl(E / 900));
      const ox = k*(W/2 - (PAD + (redP + 1)*u)), oy = k*(W/2 - (PAD + 2.5*u)); // the camera locks onto him
      const z = 1 + 0.9*ease(cl((E - 1300) / 1500));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.translate(W/2, W/2); ctx.scale(z, z); ctx.translate(-W/2 + ox, -W/2 + oy); ctx.translate(PAD, PAD);
      iris = E < 1600 ? W : W*.8*(1 - ease(cl((E - 1600) / 1300)));
      this.mood = E < 700 ? 'smile' : 'cheer';
      if (E >= 3200 && !this.fin) { this.fin = true; finish({ moves: this.moves }); }
    }
    drawBoard(6);
    // exit lane glows
    ctx.fillStyle = TH.accent + '22'; ctx.fillRect(0, 2*u, S, u);
    this.cars.forEach((c, i) => {
      let p = c.dp == null ? c.p : c.dp;
      if (i === 0 && redP != null) p = redP;
      const x = c.h ? p*u : c.f*u, y = c.h ? c.f*u : p*u, w = c.h ? c.len*u : u, h = c.h ? u : c.len*u;
      ctx.save(); ctx.shadowColor = c.col; ctx.shadowBlur = 12; ctx.fillStyle = c.col;
      rr(x + 5, y + 5, w - 10, h - 10, 14); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#ffffff44'; rr(x + 12, y + 9, w - 24, 7, 4); ctx.fill();
      this.face(c, i, x + w/2, y + h/2, u, t, w/2 - 5);
    });
    if (E >= 0) {                                                 // streaks in the world, so you can see him racing past them
      ctx.save(); ctx.strokeStyle = TH.accent + '55'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (let n = 0; n < 60; n++) { const lx = S + 60 + n*170 % 2600, ly = ((n*97) % 15) * 40 - 120; ctx.moveTo(lx, ly); ctx.lineTo(lx + 60 + (n % 4)*30, ly); }
      ctx.stroke(); ctx.restore();
    }
    wall(2, 6);
    // EXIT sign, outside the board
    ctx.fillStyle = '#ffe14e'; ctx.beginPath();
    ctx.moveTo(S + 8, 2*u + u/2 - 12); ctx.lineTo(S + 24, 2*u + u/2); ctx.lineTo(S + 8, 2*u + u/2 + 12); ctx.fill();
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', S + 18, 2*u + u/2 - 24);
    if (iris != null && iris < W) {                           // the iris-out: everything goes black except a circle on his face
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, W);
      if (iris > 1) ctx.arc(W/2, W/2, iris, 0, 7);
      ctx.fill('evenodd');
    }
  },
  face(c, i, cx, cy, u, t, hw) {          // red: neutral, glasses. blues: annoyed, half-open eyes. shake a blue: swirly eyes.
    const red = i === 0, dragging = this.drag && this.cars[this.drag.i] === c, dizzy = !red && c.dizzy && t < c.dizzy;
    let lx = ptr.x - PAD - cx, ly = ptr.y - PAD - cy;
    if (dragging && c.dp != null) { lx = c.h ? (c.dp - this.drag.from) : 0; ly = c.h ? 0 : (c.dp - this.drag.from); if (!lx && !ly) { lx = 1; ly = 0; } }
    const m = Math.hypot(lx, ly) || 1, look = Math.min(1, m / 120);
    const px = lx/m * u*.05*look, py = ly/m * u*.05*look;
    const blink = ((t/1000 + i*1.37) % 4.3) < 0.14;
    const ex = u*.17, er = u*.115, ey = cy - u*.06, DK = '#102040';
    ctx.save(); ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      const x = cx + s*ex;
      if (dizzy) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, ey, er*1.1, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(x, ey); ctx.rotate(t/160 * s); ctx.strokeStyle = DK; ctx.lineWidth = 2; ctx.beginPath();
        for (let a = 0; a <= Math.PI*6; a += .3) { const r = er*1.0*a/(Math.PI*6); a ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(0, 0); }
        ctx.stroke(); ctx.restore();
      } else if (blink) {
        ctx.strokeStyle = DK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - er*.8, ey); ctx.lineTo(x + er*.8, ey); ctx.stroke();
      } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, ey, er, 0, 7); ctx.fill();
        ctx.fillStyle = DK; ctx.beginPath(); ctx.arc(x + px, ey + py, er*.5, 0, 7); ctx.fill();
        if (!red) {                                          // heavy, annoyed eyelid: half closed, tilted down toward the nose
          const xo = x + s*er, xi = x - s*er;
          ctx.save(); ctx.beginPath(); ctx.arc(x, ey, er + 1, 0, 7); ctx.clip();
          ctx.fillStyle = c.col; ctx.beginPath();
          ctx.moveTo(xo + s*2, ey - er*.1); ctx.lineTo(xi - s*2, ey - er*.1); ctx.lineTo(xi - s*2, ey - er*2); ctx.lineTo(xo + s*2, ey - er*2); ctx.fill();
          ctx.restore();
          ctx.strokeStyle = DK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xo, ey - er*.1); ctx.lineTo(xi, ey - er*.1); ctx.stroke();
        }
      }
    }
    if (red) {                                               // glasses
      ctx.strokeStyle = '#101018'; ctx.lineWidth = 3.5;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s*ex, ey, er*1.5, 0, 7); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - ex + er*1.5, ey); ctx.lineTo(cx + ex - er*1.5, ey); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - ex - er*1.5, ey); ctx.lineTo(cx - hw, ey); ctx.moveTo(cx + ex + er*1.5, ey); ctx.lineTo(cx + hw, ey); ctx.stroke();   // arms reach the sides
    }
    ctx.strokeStyle = DK; ctx.lineWidth = 3; ctx.beginPath();
    const mood = red ? (this.mood || 'neutral') : '';
    if (red && mood === 'smile') ctx.arc(cx, cy + u*.1, u*.13, Math.PI*.15, Math.PI*.85);
    else if (red && mood === 'cheer') {                       // really happy: wide open mouth
      ctx.fillStyle = DK; ctx.arc(cx, cy + u*.06, u*.21, 0, Math.PI); ctx.closePath(); ctx.fill();   // big open smile
      ctx.save(); ctx.clip(); ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.ellipse(cx, cy + u*.27, u*.12, u*.08, 0, 0, 7); ctx.fill(); ctx.restore(); ctx.beginPath();
    }
    else if (red) { ctx.moveTo(cx - u*.09, cy + u*.19); ctx.lineTo(cx + u*.09, cy + u*.19); }                  // neutral
    else if (dizzy) { for (let k = 0; k <= 12; k++) { const mx = cx - u*.12 + k*u*.02, my = cy + u*.2 + Math.sin(k + t/90)*3; k ? ctx.lineTo(mx, my) : ctx.moveTo(mx, my); } }
    else ctx.arc(cx, cy + u*.27, u*.1, Math.PI*1.15, Math.PI*1.85);                                            // frown
    ctx.stroke(); ctx.restore();
  },
  status() { return this.won ? '' : 'Moves: ' + this.moves + '   ·   best possible: ' + puzzles.scoot.par; },
  botNote() { return '🤖 Today\'s bot built this level, then solved it itself. The best answer needs ' + puzzles.scoot.par + ' moves, so it can be done.'; },
  lockText(r) { return 'The red block escaped in <b>' + r.moves + '</b> moves' + (r.moves <= puzzles.scoot.par ? ' — the best possible! 🏆' : ' (best possible is ' + puzzles.scoot.par + ')'); }
};

// =============================== NEON
const Neon = {
  name: 'neon', title: '💡 Neon',
  rules: 'Join each pair of matching dots. Your line can only follow the track lines, and every dot on the board needs a line through it. Lines can\'t cross. A ring is a portal: go in and you come out of its twin. White rings let any colour through; a coloured ring only lets that colour through.',
  init() {
    const p = puzzles.neon; this.p = p; this.w = p.w; this.h = p.h; this.act = p.active; this.pairs = p.pairs;
    this.N = Math.max(p.w, p.h); this.u = S / this.N; this.ox = (S - p.w*this.u) / 2; this.oy = (S - p.h*this.u) / 2;
    this.total = p.active.filter(Boolean).length;
    this.E = new Set(p.edges.map(e => e[0] < e[1] ? e[0] + ',' + e[1] : e[1] + ',' + e[0]));
    this.line = p.pairs.map(() => []); this.cur = -1; this.won = false; this.t0 = null;
    this.endOf = {}; p.pairs.forEach((pr, k) => { this.endOf[pr[0]] = k; this.endOf[pr[1]] = k; });
    this.portal = {}; p.portals.forEach((q, n) => { this.portal[q.a] = { to: q.b, col: q.col, n }; this.portal[q.b] = { to: q.a, col: q.col, n }; });
  },
  adjacent(a, b) { const w = this.w; return Math.abs(a % w - b % w) + Math.abs(((a/w)|0) - ((b/w)|0)) === 1; },
  track(a, b) { return this.E.has(a < b ? a + ',' + b : b + ',' + a); },     // is there a real line between these two dots?
  owner(cell) { for (let k = 0; k < this.line.length; k++) if (this.line[k].includes(cell)) return k; return -1; },
  connected(k) { const l = this.line[k]; return l.length > 1 && l[0] !== l[l.length-1] && this.endOf[l[0]] === k && this.endOf[l[l.length-1]] === k; },
  covered() { return this.line.reduce((n, l) => n + l.length, 0); },
  fix(l) {   // a line may not stop on the entrance of a portal: it always comes out of the twin
    while (l.length && this.portal[l[l.length-1]] && l[l.length-2] !== this.portal[l[l.length-1]].to) l.pop();
    return l;
  },
  allowed(k, cell) { const q = this.portal[cell]; return !q || q.col === -1 || q.col === k; },
  cellFrom(e) {
    const { fx, fy } = cellAt(e, this.N, this.ox, this.oy), x = Math.floor(fx), y = Math.floor(fy);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    const c = y*this.w + x; return this.act[c] ? c : -1;
  },
  down(e) {
    if (this.won) return;
    const cell = this.cellFrom(e); if (cell < 0) return;
    if (this.t0 == null) this.t0 = Date.now();
    if (cell in this.endOf) { this.cur = this.endOf[cell]; this.line[this.cur] = [cell]; return; }
    const k = this.owner(cell);
    if (k >= 0) { const l = this.line[k]; this.line[k] = this.fix(l.slice(0, l.indexOf(cell) + 1)); this.cur = k; }
  },
  move(e) {
    if (this.cur < 0 || this.won) return;
    const cell = this.cellFrom(e); if (cell < 0) return;
    const k = this.cur, l = this.line[k], tail = l[l.length-1];
    if (cell === tail) return;
    if (this.connected(k)) { if (cell === l[l.length-2]) l.pop(); return; }
    if (!this.adjacent(cell, tail) || !this.track(cell, tail)) return;
    const i = l.indexOf(cell);
    if (i >= 0) { this.line[k] = this.fix(l.slice(0, i + 1)); return; }
    if (cell in this.endOf && this.endOf[cell] !== k) return;
    if (!this.allowed(k, cell)) return;
    const cells = [cell], q = this.portal[cell];
    if (q) { if (l.includes(q.to) || (q.to in this.endOf)) return; cells.push(q.to); }
    for (const c of cells) {
      const o = this.owner(c);
      if (o >= 0 && o !== k) { const ol = this.line[o]; this.line[o] = this.fix(ol.slice(0, ol.indexOf(c))); if (this.line[o].length < 2) this.line[o] = []; }
    }
    l.push(...cells);
  },
  up() {
    this.cur = -1;
    if (this.line.every((_, k) => this.connected(k)) && this.covered() === this.total) { this.won = true; finish({ secs: Math.round((Date.now() - this.t0) / 1000) }); }
  },
  xy(c) { return [this.ox + (c % this.w + .5)*this.u, this.oy + (((c/this.w)|0) + .5)*this.u]; },
  draw() {
    begin(); const u = this.u, w = this.w, h = this.h;
    // the network: track lines (some are missing) and a dot at every junction
    ctx.save(); ctx.strokeStyle = TH.accent + '66'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
    for (const e of this.p.edges) { const [x1, y1] = this.xy(e[0]), [x2, y2] = this.xy(e[1]); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = TH.accent + 'aa';
    for (let c = 0; c < w*h; c++) { const [x, y] = this.xy(c); ctx.beginPath(); ctx.arc(x, y, u*.09, 0, 7); ctx.fill(); }
    // portals (rings), white = any colour
    this.p.portals.forEach((q, n) => {
      const col = q.col === -1 ? '#ffffff' : TH.pal[q.col % 8];
      [q.a, q.b].forEach(c => {
        const [x, y] = this.xy(c);
        ctx.save(); ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, u*.4, 0, 7); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, u*.27, 0, 7); ctx.stroke(); ctx.restore();
        ctx.fillStyle = col; ctx.font = 'bold ' + Math.round(u*.28) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n + 1, x, y + 1);
      });
    });
    // the lines (a jump through a portal is drawn as a break)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    this.line.forEach((l, k) => {
      if (l.length < 2) return;
      const col = TH.pal[k % 8];
      ctx.save(); ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.lineWidth = u*.34; ctx.beginPath();
      l.forEach((c, j) => { const [x, y] = this.xy(c); (j && this.adjacent(c, l[j-1])) ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.restore();
    });
    this.pairs.forEach((pr, k) => pr.forEach(c => {
      const [x, y] = this.xy(c), col = TH.pal[k % 8];
      ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(x, y, u*.3, 0, 7); ctx.fill(); ctx.restore();
    }));
  },
  status() { const n = this.line.filter((_, k) => this.connected(k)).length; return this.won ? '' : 'Joined: ' + n + ' of ' + this.pairs.length + '   ·   Squares covered: ' + this.covered() + ' of ' + this.total; },
  botNote() { return ''; },
  lockText(r) { return 'All the lights are on! ⚡<br>You took <b>' + fmt(r.secs) + '</b>'; }
};

// =============================== CURRENTS
const Currents = {
  name: 'currents', title: '🌊 Currents',
  rules: 'Start at 1 and draw one line through the numbers in order, 1, 2, 3… and cover every square. The line can\'t cross itself. Drag from the 1.',
  init() { const p = puzzles.currents; this.N = p.N; this.nums = p.nums; this.max = p.max; this.path = []; this.on = false; this.won = false; this.t0 = null; this.warn = null; },
  visitedMax() { let m = 0; for (const c of this.path) if (this.nums[c]) m = Math.max(m, this.nums[c]); return m; },
  down(e) {
    if (this.won) return;
    const { fx, fy } = cellAt(e, this.N), x = Math.floor(fx), y = Math.floor(fy);
    if (x < 0 || y < 0 || x >= this.N || y >= this.N) return;
    const cell = y*this.N + x;
    if (this.t0 == null) this.t0 = Date.now();
    if (this.nums[cell] === 1) { this.path = [cell]; this.on = true; return; }
    const i = this.path.indexOf(cell);
    if (i >= 0) { this.path = this.path.slice(0, i + 1); this.on = true; }
  },
  move(e) {
    if (!this.on || this.won) return;
    const { fx, fy } = cellAt(e, this.N), x = Math.floor(fx), y = Math.floor(fy);
    if (x < 0 || y < 0 || x >= this.N || y >= this.N) return;
    const cell = y*this.N + x, p = this.path, tail = p[p.length-1];
    if (cell === tail) return;
    if (Math.abs(cell % this.N - tail % this.N) + Math.abs(((cell/this.N)|0) - ((tail/this.N)|0)) !== 1) return;
    if (cell === p[p.length-2]) { p.pop(); return; }
    if (p.includes(cell)) return;
    if (this.nums[cell] && this.nums[cell] !== this.visitedMax() + 1) {     // a number out of order
      this.warn = { cell, until: performance.now() + 2500 };
      return;
    }
    p.push(cell);
  },
  up() {
    this.on = false;
    const p = this.path;
    if (p.length === this.N*this.N && this.nums[p[p.length-1]] === this.max) { this.won = true; finish({ secs: Math.round((Date.now() - this.t0) / 1000) }); }
  },
  draw() {
    begin(); const N = this.N, u = S/N, now = performance.now(); drawBoard(N);
    const warn = this.warn && now < this.warn.until ? this.warn : null;
    if (this.path.length) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = TH.accent; ctx.shadowColor = TH.accent; ctx.shadowBlur = 16; ctx.lineWidth = u*.34; ctx.beginPath();
      this.path.forEach((c, j) => { const x = (c%N + .5)*u, y = (((c/N)|0) + .5)*u; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.restore();
    }
    ctx.font = 'bold ' + Math.round(u*.4) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c in this.nums) {
      const x = (c%N + .5)*u, y = (((c/N)|0) + .5)*u, hit = this.path.includes(+c), bad = warn && warn.cell === +c;
      ctx.save();
      if (bad) { ctx.shadowColor = '#8fe3ff'; ctx.shadowBlur = 22; }
      ctx.fillStyle = bad ? '#8fe3ff' : hit ? TH.bg : TH.panel; ctx.strokeStyle = bad ? '#ffffff' : TH.accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, u*.3, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = bad ? '#06324a' : '#fff'; ctx.fillText(this.nums[c], x, y + 1);
    }
    wall(null, N);
    if (warn) {
      ctx.fillStyle = '#8fe3ffee'; rr(10, S/2 - 34, S - 20, 68, 14); ctx.fill();
      ctx.fillStyle = '#06324a'; ctx.font = 'bold 21px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Please connect all these', S/2, S/2 - 12); ctx.fillText('squares in order.', S/2, S/2 + 14);
    }
  },
  status() { return this.won ? '' : 'Squares covered: ' + this.path.length + ' of ' + this.N*this.N; },
  botNote() { return '🤖 The bot built this level from a real answer, so it can be done.'; },
  lockText(r) { return 'One long current! 🌊<br>You took <b>' + fmt(r.secs) + '</b>'; }
};

// =============================== the shell
const GAMES = { scoot: Scoot, neon: Neon, currents: Currents };
const G = GAMES[ONLY];
const puzzles = { scoot: null, neon: null, currents: null };
puzzles[ONLY] = ONLY === 'scoot' ? Gen.genScoot(rs('scoot')) : ONLY === 'neon' ? Gen.genNeon(rs('neon')) : Gen.genCurrents(rs('currents'));

let bonus = false;                                           // secret: tap Space three times for another puzzle
const locked = () => !bonus && store.get(ONLY);
function finish(result) {
  if (bonus) { $('lock').innerHTML = '<div class="box">' + G.lockText(result) + '<span style="font-size:.7em;color:var(--dim)">⭐ Bonus puzzle done!</span></div>'; $('lock').classList.add('show'); return; }
  store.set(ONLY, { done: true, ...result }); refresh();
}
let taps = [], typedKeys = '';
addEventListener('keydown', e => {
  if (e.repeat) return;
  let go = false;
  if (e.code === 'Space' || e.key === ' ') {                  // Space three times
    const now = performance.now(); taps = taps.filter(x => now - x < 2000); taps.push(now);
    if (taps.length >= 3) { taps = []; go = true; e.preventDefault(); }
  }
  if (e.key && e.key.length === 1) {                          // or type 3x/space
    typedKeys = (typedKeys + e.key.toLowerCase()).slice(-8);
    if (typedKeys === '3x/space') { typedKeys = ''; go = true; }
  }
  if (!go) return;
  let p = null;
  for (let k = 0; k < 20 && !p; k++) {
    const r = Gen.rng((Math.random() * 4294967296) >>> 0);
    p = ONLY === 'scoot' ? Gen.genScoot(r) : ONLY === 'neon' ? Gen.genNeon(r) : Gen.genCurrents(r);
  }
  if (!p) return;
  bonus = true; puzzles[ONLY] = p;
  G.init(); $('lock').classList.remove('show'); $('bonusTag').style.display = 'block';
});
function refresh() {
  const saved = locked(), lock = $('lock');
  if (saved) {
    lock.innerHTML = '<div class="box">' + G.lockText(saved) + '<span style="font-size:.7em;color:var(--dim)">Finished for today. A new one comes tomorrow! 🌙</span>' +
      '<a href="../index.html" style="font-size:.7em;color:var(--accent)">← All three puzzles</a></div>';
    lock.classList.add('show'); $('status').textContent = '';
  } else lock.classList.remove('show');
}
$('reset').onclick = () => { if (!locked()) { G.init(); refresh(); } };

const dpr = window.devicePixelRatio || 1;
canvas.width = W*dpr; canvas.height = W*dpr;
function fit() { const w = Math.max(260, Math.min(W, window.innerWidth - 32, window.innerHeight - 300)); canvas.style.width = w + 'px'; canvas.style.height = w + 'px'; }
fit(); addEventListener('resize', fit);
canvas.addEventListener('pointerdown', e => { if (locked()) return; canvas.setPointerCapture(e.pointerId); G.down(e); });
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width * W; ptr.y = (e.clientY - r.top) / r.height * W;
  if (!locked()) G.move(e);
});
const end = () => { if (!locked()) G.up(); };
canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

$('rules').textContent = G.rules;
G.init(); refresh();
(function loop() {
  G.draw();
  if (!locked()) $('status').textContent = G.status();
  requestAnimationFrame(loop);
})();
