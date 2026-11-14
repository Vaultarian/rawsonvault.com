// The home screen: a pixel title with bombs flying round the edges (just for show), NEW GAME, LOAD GAME, and a loading bar.
(function () {
  Object.assign(FONT, { '0':[14,17,19,21,25,17,14], '1':[4,12,4,4,4,4,14], '2':[14,17,1,2,4,8,31], '3':[31,2,4,2,1,17,14], '4':[2,6,10,18,31,2,2], '5':[31,16,30,1,1,17,14], '6':[6,8,16,30,17,17,14], '7':[31,1,2,4,8,8,8], '8':[14,17,17,14,17,17,14], '9':[14,17,17,15,1,2,12], '!':[4,4,4,4,4,0,4], '-':[0,0,0,31,0,0,0], '_':[0,0,0,0,0,0,31], "'":[4,4,8,0,0,0,0], '/':[1,1,2,4,8,16,16] });
  const el = $('home'), hc = $('homeCv'), hctx = hc.getContext('2d'), HW = 480, HH = 270;
  let c = hctx;                                   // the canvas we are drawing on (the trailer borrows a bigger, smoother one)
  hctx.imageSmoothingEnabled = false;
  const tc = document.createElement('canvas'); tc.id = 'trailerCv'; tc.width = 960; tc.height = 540;
  tc.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,177.78vh);height:auto;aspect-ratio:16/9;display:none';
  el.appendChild(tc); const tcx = tc.getContext('2d');
  const rnd = (a, b) => a + Math.random()*(b - a);
  const S = { state: 'title', t: 0, name: '', mx: -1, my: -1, bombs: [], fx: [], flash: 0, spawn: 0, page: 0, load: null, btns: [], stars: [] };
  for (let i = 0; i < 60; i++) S.stars.push([Math.random()*HW, Math.random()*HH*.8, Math.random() < .2 ? 2 : 1]);

  // ---- text
  const tw = (text, sc) => text.length*6*sc - sc;
  function T(text, cx, y, sc, col) { c.fillStyle = '#000'; pixelText(c, text, cx + sc, y + sc, sc); c.fillStyle = col || '#fff'; pixelText(c, text, cx, y, sc); }
  function TL(text, x, y, sc, col) { T(text, x + tw(text, sc)/2, y, sc, col); }
  function TR(text, x, y, sc, col) { T(text, x - tw(text, sc)/2, y, sc, col); }

  // ---- a pixel bomb
  function pixelBomb(x, y, col, t, k) {
    if (k && k !== 1) { c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(k, k); pixelBomb(0, 0, col, t); c.restore(); return; }
    x = Math.round(x); y = Math.round(y);
    c.fillStyle = '#000'; for (let dy = -7; dy <= 7; dy++) { const w = Math.floor(Math.sqrt(49 - dy*dy)); c.fillRect(x - w, y + dy, 2*w + 1, 1); }
    c.fillStyle = col; for (let dy = -6; dy <= 6; dy++) { const w = Math.floor(Math.sqrt(36 - dy*dy)); c.fillRect(x - w, y + dy, 2*w + 1, 1); }
    c.fillStyle = '#ffffff99'; c.fillRect(x - 3, y - 4, 3, 2); c.fillRect(x - 4, y - 2, 2, 2);
    c.fillStyle = '#5d4037'; c.fillRect(x + 2, y - 10, 2, 4); c.fillRect(x + 4, y - 11, 2, 2);
    c.fillStyle = Math.floor(t*14) % 2 ? '#ff5252' : '#ffd740'; c.fillRect(x + 4, y - 14, 3, 3);
  }

  // ---- explosions (pictures only: they never touch the words or the buttons)
  function burst(x, y, n, cols, sp, life, g, sz, delay) { for (let i = 0; i < n && S.fx.length < 1200; i++) { const a = rnd(0, 6.283), s = rnd(.2, 1)*sp; S.fx.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: rnd(.4, 1)*life, max: life, col: cols[i % cols.length], sz: sz || 2, g: g ?? 120, delay: delay || 0 }); } }
  function pts(shape, r) {
    const o = [];
    if (shape === 'heart') for (let k = 0; k < 40; k++) { const t = k/40*6.283; o.push([16*Math.pow(Math.sin(t), 3)*r/16, -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t))*r/16]); }
    else if (shape === 'star') for (let k = 0; k < 10; k++) { const a = k/10*6.283 - 1.571, rr = k % 2 ? r*.45 : r; for (let m = 0; m < 4; m++) { const a2 = (k + m/4)/10*6.283 - 1.571, r2 = rr + ((k % 2 ? r : r*.45) - rr)*m/4; o.push([Math.cos(a2)*r2, Math.sin(a2)*r2]); } }
    else if (shape === 'cross') for (let k = -r; k <= r; k += 2) { o.push([k, 0], [0, k]); }
    else if (shape === 'x') for (let k = -r; k <= r; k += 2) { o.push([k, k], [k, -k]); }
    else if (shape === 'diamond') for (let k = 0; k < 40; k++) { const t = k/40*4; const seg = Math.floor(t), f = t - seg; const P = [[r, 0], [0, r], [-r, 0], [0, -r], [r, 0]]; o.push([P[seg][0] + (P[seg + 1][0] - P[seg][0])*f, P[seg][1] + (P[seg + 1][1] - P[seg][1])*f]); }
    else if (shape === 'square') for (let k = -r; k <= r; k += 2) { o.push([k, -r], [k, r], [-r, k], [r, k]); }
    else if (shape === 'hline') for (let k = -r*2; k <= r*2; k += 3) o.push([k, 0]);
    else if (shape === 'vline' || shape === 'tower') for (let k = -r; k <= r; k += 3) o.push([0, k]);
    else for (let k = 0; k < 32; k++) { const t = k/32*6.283; o.push([Math.cos(t)*r, Math.sin(t)*r]); }
    return o;
  }
  const FIRE = ['#ff5722', '#ffb300', '#ffeb3b'], WARM = ['#ff9800', '#ffeb3b', '#fff', '#ff5722'];
  function boomVisual(d, x, y) {
    const p = d.p || {}, k = d.kind;
    const ring = (r, col, n) => { for (let i = 0; i < (n || 26); i++) { const a = i/(n || 26)*6.283; S.fx.push({ x, y, vx: Math.cos(a)*r*1.6, vy: Math.sin(a)*r*1.6, life: .5, max: .5, col, sz: 2, g: 0, delay: 0 }); } };
    switch (k) {
      case 'shape': for (const [dx, dy] of pts(p.shape, 18)) S.fx.push({ x: x + dx, y: y + dy, vx: dx*.3, vy: dy*.3, life: .9, max: .9, col: d.color, sz: 2, g: 0, delay: 0 }); burst(x, y, 12, WARM, 80, .5); break;
      case 'tunnel': case 'laser': for (let i = 0; i < 30; i++) { S.fx.push({ x: x + i*4, y, vx: 0, vy: 0, life: .6, max: .6, col: '#ff1744', sz: 2, g: 0, delay: i*.01 }); S.fx.push({ x: x - i*4, y, vx: 0, vy: 0, life: .6, max: .6, col: '#ff1744', sz: 2, g: 0, delay: i*.01 }); } if (p.dirs && p.dirs[0] === 'down') for (let i = 0; i < 25; i++) S.fx.push({ x, y: y + i*4, vx: 0, vy: 0, life: .6, max: .6, col: '#fbc02d', sz: 2, g: 0, delay: i*.01 }); break;
      case 'worms': case 'mice': burst(x, y, 16, ['#cfcfcf', '#f48fb1', '#bdbdbd'], 50, 1.4, 0, 2); break;
      case 'blackhole': for (let i = 0; i < 36; i++) { const a = rnd(0, 6.283), r = rnd(30, 60); S.fx.push({ x: x + Math.cos(a)*r, y: y + Math.sin(a)*r, vx: -Math.cos(a)*r*1.4 + Math.sin(a)*20, vy: -Math.sin(a)*r*1.4 - Math.cos(a)*20, life: .8, max: .8, col: ['#7e57c2', '#b39ddb', '#000'][i % 3], sz: 2, g: 0, delay: 0 }); } break;
      case 'plague': for (let i = 0; i < 44; i++) { const a = rnd(0, 6.283), r = rnd(2, 34); S.fx.push({ x: x + Math.cos(a)*r, y: y + Math.sin(a)*r, vx: 0, vy: 0, life: rnd(1, 5), max: 5, col: i % 3 ? '#8bc34a' : '#9ccc65', sz: 3, g: 0, delay: rnd(0, 1) }); } break;     // each one fades after its own random time
      case 'cluster': case 'chain': case 'airstrike': case 'meteors': for (let i = 0; i < 6; i++) burst(x + rnd(-26, 26), y + rnd(-20, 20), 10, WARM, 70, .5, 120, 2, i*.12); break;
      case 'lightning': { let px = x, py = 0; while (py < y) { const nx = px + rnd(-8, 8), ny = py + rnd(8, 16); for (let m = 0; m < 6; m++) S.fx.push({ x: px + (nx - px)*m/6, y: py + (ny - py)*m/6, vx: 0, vy: 0, life: .35, max: .35, col: '#fff59d', sz: 2, g: 0, delay: 0 }); px = nx; py = ny; } S.flash = .25; break; }
      case 'fire': burst(x, y, 30, FIRE, 60, 1, -90, 3); break;
      case 'acid': burst(x, y, 24, ['#aeea00', '#76ff03'], 40, 1.1, 160, 2); break;
      case 'quake': for (let i = -30; i <= 30; i += 3) S.fx.push({ x: x + i*2, y: y + rnd(-3, 3), vx: rnd(-10, 10), vy: -rnd(20, 60), life: .8, max: .8, col: '#a1887f', sz: 2, g: 200, delay: Math.abs(i)*.01 }); break;
      case 'volcano': burst(x, y, 30, ['#ff6d00', '#ff9100', '#ffd180'], 130, 1.2, 260, 2); break;
      case 'nuke': S.flash = .5; for (let i = 0; i < 40; i++) S.fx.push({ x: x + rnd(-5, 5), y: y - i*2.4, vx: rnd(-6, 6), vy: -20, life: 1.6, max: 1.6, col: i % 2 ? '#ff7043' : '#8d6e63', sz: 4, g: 0, delay: i*.02 }); for (let i = 0; i < 36; i++) { const a = i/36*6.283; S.fx.push({ x: x + Math.cos(a)*6, y: y - 100 + Math.sin(a)*4, vx: Math.cos(a)*40, vy: Math.sin(a)*14 - 6, life: 1.4, max: 1.4, col: '#bcaaa4', sz: 4, g: 0, delay: .9 }); } burst(x, y, 40, FIRE, 190, .9, 60, 3); break;
      case 'apoc': burst(x, y, 24, ['#9e9d24', '#6d6d3a', '#aeea00'], 90, 1.4, 20, 2); break;
      case 'party': burst(x, y, 50, ['#f44336', '#ffeb3b', '#4caf50', '#2196f3', '#e91e63'], 150, 1.6, 140, 2); break;
      case 'nature': burst(x, y, 30, ['#66bb6a', '#a5d6a7', '#c8e6c9'], 70, 1.2, -30, 2); break;
      case 'flat': for (let i = 0; i < 60; i++) S.fx.push({ x: i*8, y, vx: 0, vy: 0, life: .7, max: .7, col: '#7cb342', sz: 3, g: 0, delay: Math.abs(i*8 - x)*.002 }); break;
      case 'random': boomVisual(ORDER[Math.floor(rnd(0, ORDER.length))], x, y); return;
      default: burst(x, y, 34, WARM, 140, .8, 140, 2);
    }
    ring(12 + (p.r || 5), d.color || '#ffb300', 22); S.flash = Math.max(S.flash, k === 'nuke' ? .5 : 0);
  }
  function spawnBomb() {
    const d = ORDER[Math.floor(Math.random()*ORDER.length)], e = Math.floor(Math.random()*4); let x, y, vx, vy;
    if (e === 0) { x = -10; y = rnd(30, HH - 30); vx = rnd(60, 130); vy = rnd(-110, -20); }
    else if (e === 1) { x = HW + 10; y = rnd(30, HH - 30); vx = -rnd(60, 130); vy = rnd(-110, -20); }
    else if (e === 2) { x = rnd(20, HW - 20); y = -10; vx = rnd(-60, 60); vy = rnd(10, 60); }
    else { x = rnd(20, HW - 20); y = HH + 10; vx = rnd(-60, 60); vy = -rnd(130, 210); }
    S.bombs.push({ x, y, vx, vy, d, life: rnd(1.2, 3.8), t: 0 });
  }

  // ---- the screens
  const games = () => readIndex().sort((a, b) => b.saved - a.saved);
  function show(state) { S.state = state; S.page = 0; if (state === 'title' || state === 'new') { inGame = false; el.style.display = 'flex'; } if (state === 'new') S.name = ''; }
  window.homeShow = state => { el.style.display = 'flex'; inGame = false; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} show(state); };
  function beginLoading(kind, name) { S.state = 'loading'; S.load = { t: 0, D: rnd(1, 7), a: rnd(.7, 1.5), kind, name }; }
  function startNew() {
    let name = S.name.trim() || 'MY GAME'; const have = readIndex().map(g => g.name); let n = name, k = 2; while (have.includes(n)) n = name + ' ' + k++;
    beginLoading('new', n);
  }
  function layout() {
    const B = [], bw = 190, bx = HW/2 - bw/2;
    if (S.state === 'title') { B.push({ x: bx, y: 128, w: bw, h: 32, label: 'LOAD GAME', act: () => show('load') }); B.push({ x: bx, y: 172, w: bw, h: 32, label: 'NEW GAME', act: () => show('new') }); B.push({ x: bx, y: 216, w: bw, h: 32, label: 'TRAILER', act: trailerStart }); }
    if (S.state === 'new') { B.push({ x: HW/2 - 195, y: 176, w: 185, h: 32, label: 'START', act: startNew }); B.push({ x: HW/2 + 10, y: 176, w: 185, h: 32, label: 'BACK', act: () => show('title') }); }
    if (S.state === 'load') {
      const g = games(), per = 5, from = S.page*per;
      g.slice(from, from + per).forEach((gm, i) => { B.push({ x: 60, y: 62 + i*34, w: 292, h: 30, label: gm.name, sub: (gm.wallet || 0) + ' BLOCKS', left: true, act: () => beginLoading('load', gm.name) });
        B.push({ x: 358, y: 62 + i*34, w: 62, h: 30, label: 'LINK', small: true, act: () => { const url = location.href.split('#')[0] + '#game=' + encodeURIComponent(gm.name); const note = ' It only opens on this computer, because the game is saved in this browser.'; try { navigator.clipboard.writeText(url).then(() => toast('Link copied.' + note), () => toast('Your link: ' + url + note)); } catch (e) { toast('Your link: ' + url + note); } } }); });
      if (g.length > per) { B.push({ x: 60, y: 238, w: 100, h: 24, label: 'PREV', small: true, act: () => { S.page = Math.max(0, S.page - 1); } }); B.push({ x: 320, y: 238, w: 100, h: 24, label: 'NEXT', small: true, act: () => { S.page = Math.min(Math.ceil(g.length/per) - 1, S.page + 1); } }); }
      B.push({ x: HW/2 - 50, y: 238, w: 100, h: 24, label: 'BACK', small: true, act: () => show('title') });
    }
    return B;
  }
  function drawButton(b, hover) {
    c.fillStyle = '#000'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = hover ? '#ffd740' : '#fff'; c.fillRect(b.x, b.y, b.w, 2); c.fillRect(b.x, b.y + b.h - 2, b.w, 2); c.fillRect(b.x, b.y, 2, b.h); c.fillRect(b.x + b.w - 2, b.y, 2, b.h);
    const sc = b.small ? 2 : 3, col = hover ? '#ffd740' : '#fff';
    if (b.left) { TL(b.label.length > 9 ? b.label.slice(0, 9) : b.label, b.x + 10, b.y + (b.h - 7*sc)/2, sc, col); if (b.sub) TR(b.sub, b.x + b.w - 10, b.y + 11, 1, '#9e9e9e'); }
    else T(b.label, b.x + b.w/2, b.y + (b.h - 7*sc)/2, sc, col);
  }
  function progress(L) { const f = Math.min(1, L.t/L.D); return Math.pow(f, L.a); }

  function drawBg() {
    const gr = c.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, '#080c26'); gr.addColorStop(1, '#22306a'); c.fillStyle = gr; c.fillRect(0, 0, HW, HH);
    c.fillStyle = '#fff'; for (const [x, y, s] of S.stars) { if (Math.floor(S.t*2 + x) % 5) c.fillRect(x|0, y|0, s, s); }
    c.fillStyle = '#2e7d32'; c.fillRect(0, HH - 12, HW, 12); c.fillStyle = '#43a047'; c.fillRect(0, HH - 12, HW, 3);
  }
  function drawFx() {
    for (const p of S.fx) { if (p.delay > 0) continue; const a = Math.max(0, Math.min(1, p.life/Math.min(p.max, .5))); c.globalAlpha = a > .66 ? 1 : a > .33 ? .66 : .33; c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz); }
    c.globalAlpha = 1;
  }

  // ---- the trailer: your screen recordings, pixel text, bombs, and the green plague wiping from one scene to the next
  const T1 = 8.45, T2 = 16.9, T3 = 23.9, TW = 33.6, TEND = 34.5;
  const TRL = { t: 0, vids: [], cur: -1, trans: [[], []], fly: [], title: [], ev: [], pb: null, plagueT: 0 };
  function mkTrans() {
    const cell = 16, cols = 30, rows = 17, sx = [rnd(40, 440), rnd(40, 440)], sy = [rnd(30, 240), rnd(30, 240)], cs = [], greens = ['#8bc34a', '#7cb342', '#689f38', '#9ccc65', '#558b2f'];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i*cell + 8, y = j*cell + 8, d = Math.min(Math.hypot(x - sx[0], y - sy[0]), Math.hypot(x - sx[1], y - sy[1])); cs.push({ x: i*cell, y: j*cell, on: d/330 + rnd(0, .3), off: 1.7 + rnd(0, 1.5), col: greens[Math.floor(rnd(0, 5))] }); }
    return cs;
  }
  function trailerStart() {
    S.state = 'trailer'; S.bombs.length = 0; S.fx.length = 0; S.flash = 0; S.white = 0; tc.style.display = 'block';
    if (!TRL.vids.length) for (const n of ['store', 'grass', 'plague']) { const v = document.createElement('video'); v.src = 'trailer/' + n + '.mp4'; v.muted = true; v.playsInline = true; v.preload = 'auto'; TRL.vids.push(v); }
    TRL.t = 0; TRL.cur = -1; TRL.trans = [mkTrans(), mkTrans()]; TRL.fly = []; TRL.pb = null; TRL.title = [];
    TRL.vids.forEach(v => { v.pause(); try { v.currentTime = 0; } catch (e) {} });
    const bomb = (t, col, tx, big) => ({ t, fn: () => TRL.fly.push({ t0: TRL.t, dur: big ? 1.5 : 1.2, x0: tx + (tx < HW/2 ? -60 : 60), y0: HH + 14, x1: tx, y1: big ? 70 : 40, col, k: big ? 2.2 : 1, big }) });
    TRL.ev = [bomb(.4, '#ff9800', 150), bomb(T1 + .4, '#e53935', 330), bomb(T2 + 5.3, '#e53935', HW/2, true), { t: T3 + 3.1, fn: () => { TRL.pb = { x: HW/2 + 14, y: -12, vy: 0, land: false, lit: TRL.t, boom: false }; spark2(HW/2 + 14, 30); } }];
  }
  function spark2(x, y) { for (let i = 0; i < 24; i++) S.fx.push({ x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), life: .6, max: .6, col: i % 2 ? '#8bc34a' : '#fff', sz: 2, g: 0, delay: 0 }); }
  function trailerStop(natural) { TRL.vids.forEach(v => v.pause()); S.state = 'title'; S.fx.length = 0; S.bombs.length = 0; S.flash = 0; tc.style.display = 'none'; S.white = natural ? 1 : 0; }

  // letters that are a little smoother: the 5 x 7 font is smoothed twice (Scale2x) so diagonals are not blocky
  const glyphs = {};
  function scale2x(a) {
    const h = a.length, w = a[0].length, o = [], px = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : a[y][x];
    for (let y = 0; y < h; y++) { const r0 = [], r1 = []; for (let x = 0; x < w; x++) { const P = px(x, y), A = px(x, y - 1), B = px(x + 1, y), C = px(x - 1, y), D = px(x, y + 1);
      r0.push((C === A && C !== D && A !== B) ? A : P); r0.push((A === B && A !== C && B !== D) ? B : P); r1.push((D === C && D !== B && C !== A) ? C : P); r1.push((B === D && B !== A && D !== C) ? D : P); } o.push(r0, r1); }
    return o;
  }
  function glyph(ch) {
    if (glyphs[ch]) return glyphs[ch]; const g = FONT[ch] || FONT[' ']; let bm = [];
    for (let r = 0; r < 7; r++) { const row = []; for (let k = 0; k < 5; k++) row.push((g[r] & (16 >> k)) ? 1 : 0); bm.push(row); }
    return glyphs[ch] = scale2x(scale2x(bm));
  }
  function smooth(text, x0, y, cell, col) { c.fillStyle = col; let x = x0; for (const ch of text) { const bm = glyph(ch); for (let r = 0; r < bm.length; r++) for (let k = 0; k < bm[r].length; k++) if (bm[r][k]) c.fillRect(x + k*cell, y + r*cell, cell + .6, cell + .6); x += 24*cell; } }
  function reveal(text, t0, t1, y, cell, col, shake) {                              // letters pop in one at a time
    const n = Math.floor((TRL.t - t0)/.07); if (n <= 0 || TRL.t > t1) return;
    const full = text.length*24*cell - 4*cell, x0 = 480 - full/2, part = text.slice(0, Math.min(text.length, n)), jx = shake ? rnd(-3, 3) : 0, jy = shake ? rnd(-3, 3) : 0;
    smooth(part, x0 + 3 + jx, y + 3 + jy, cell, '#000'); smooth(part, x0 + jx, y + jy, cell, col);
  }
  function titlePixels() {                                                         // "BOMB SANDBOX" as tiny blocks, so the plague can eat it block by block
    const text = 'BOMB SANDBOX', sc = 6, x0 = HW/2 - tw(text, sc)/2, y0 = 78, out = [];
    for (let L = 0; L < text.length; L++) { const g = FONT[text[L]] || FONT[' ']; for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++) if (g[r] & (16 >> k)) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) out.push({ x: x0 + L*6*sc + k*sc + a*3, y: y0 + r*sc + b*3, inf: Infinity, gone: Infinity }); }
    return out;
  }
  function drawTrailer(dt) { const home = c; c = tcx; try { drawTrailerInner(dt); } finally { c = home; } }
  function drawTrailerInner(dt) {
    TRL.t += dt; const t = TRL.t;
    c.imageSmoothingEnabled = true;
    for (const e of TRL.ev) if (!e.done && t >= e.t) { e.done = true; e.fn(); }
    const scene = t < T1 ? 0 : t < T2 ? 1 : t < T3 ? 2 : 3;
    if (scene !== TRL.cur) { TRL.cur = scene; TRL.vids.forEach(v => v.pause()); const v = TRL.vids[scene]; if (v) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); } if (scene === 3) { TRL.title = titlePixels(); S.bombs.length = 0; S.fx.length = 0; } }
    if (scene < 3) {
      c.fillStyle = '#000'; c.fillRect(0, 0, 960, 540); const v = TRL.vids[scene]; if (v && v.readyState >= 2) c.drawImage(v, 0, 0, 960, 540);       // full size and smooth, so the recordings stay sharp
      if (scene === 0) reveal('GET BOMBS', 1.7, 7.4, 52, 1.6, '#fff');
      if (scene === 1) reveal('USE BOMBS', T1 + 1.7, T1 + 6.8, 52, 1.6, '#fff');
      if (scene === 2) reveal('DESTROY THE WORLD', T2 + 1, T3 - .6, 52, 1.5, '#ff1744', true);
      c.save(); c.scale(2, 2);
      for (const [k, t0] of [[0, 7.0], [1, T2 - 1.45]]) { const u = t - t0; if (u >= 0 && u < 3.3) for (const cl of TRL.trans[k]) if (u >= cl.on && u < cl.off) { c.fillStyle = cl.col; c.fillRect(cl.x, cl.y, 16, 16); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cl.x + 2, cl.y + 2, 5, 5); c.fillRect(cl.x + 9, cl.y + 9, 4, 4); } }
      c.restore();
    } else {
      c.save(); c.scale(2, 2);
      c.fillStyle = '#ffd740'; c.fillRect(0, 0, HW, HH);
      for (const b of S.bombs) pixelBomb(b.x, b.y, b.d.color, b.t);
      const jx = rnd(-2, 2), jy = rnd(-2, 2);                                       // BOMB SANDBOX, red and white, shaking, until the plague eats it
      for (const p of TRL.title) { if (t >= p.gone) continue; const green = t >= p.inf; c.fillStyle = green ? '#33691e' : '#fff'; c.fillRect(p.x + 3 + jx, p.y + 3 + jy, 3, 3); c.fillStyle = green ? '#8bc34a' : '#e53935'; c.fillRect(p.x + jx, p.y + jy, 3, 3); }
      const pb = TRL.pb;                                                            // the plague bomb that arrives from nowhere, lands on the title and goes off
      if (pb) {
        if (!pb.land) { pb.vy += 400*dt; pb.y += pb.vy*dt; if (pb.y >= 70) { pb.y = 70; pb.land = true; } }
        if (!pb.boom) { pixelBomb(pb.x, pb.y, '#33691e', t); if (pb.land && t - pb.lit > 2.1) { pb.boom = true; boomVisual({ kind: 'plague', color: '#8bc34a', p: {} }, pb.x, pb.y); S.flash = .3; for (const p of TRL.title) { const d = Math.hypot(p.x - pb.x, p.y - pb.y); p.inf = t + d/150 + rnd(0, .5); p.gone = p.inf + rnd(1, 5); } } }
      }
      c.restore();
      const u = Math.max(0, Math.min(1, (t - (T3 + 1.6))/.9));                       // the web address slides up from under the bottom of the screen, below the title
      if (u > 0) { const link = 'RAWSONVAULT.COM/JOS/BOMBSANDBOX', e = 1 - Math.pow(1 - u, 3), y = 570 - (570 - 292)*e, x0 = 480 - (link.length*24 - 4)/2; smooth(link, x0 + 2, y + 2, 1, '#fff'); smooth(link, x0, y, 1, '#c62828'); }
    }
    c.save(); c.scale(2, 2);
    for (const f of TRL.fly) { const u = (t - f.t0)/f.dur; if (u < 0) continue; if (u < 1) { const x = f.x0 + (f.x1 - f.x0)*u, y = f.y0 + (f.y1 - f.y0)*u - Math.sin(u*Math.PI)*30; pixelBomb(x, y, f.col, t, f.k); } else if (!f.boom) { f.boom = true; boomVisual({ kind: f.big ? 'nuke' : 'blast', color: f.col, p: { r: f.big ? 18 : 8 } }, f.x1, f.y1); if (f.big) S.flash = 1; } }
    drawFx(); c.restore();
    if (S.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(.85, S.flash) + ')'; c.fillRect(0, 0, 960, 540); }
    if (t >= TW) { c.fillStyle = 'rgba(255,255,255,' + Math.min(1, (t - TW)/.6) + ')'; c.fillRect(0, 0, 960, 540); }      // it ends in bright white...
    if (t >= TEND) trailerStop(true);                                                                                          // ...and the white fades away over the home screen
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last)/1000); last = now;
    requestAnimationFrame(frame);
    if (el.style.display === 'none') return;
    S.t += dt;
    // bombs and explosions
    const ambient = S.state !== 'trailer' || TRL.t >= T3;
    S.spawn -= dt; if (ambient && S.spawn <= 0 && S.bombs.length < 13) { spawnBomb(); S.spawn = rnd(.15, .5); }
    for (let i = S.bombs.length - 1; i >= 0; i--) { const b = S.bombs[i]; b.t += dt; b.vy += 110*dt; b.x += b.vx*dt; b.y += b.vy*dt; if (b.t > b.life) { if (b.x > -20 && b.x < HW + 20 && b.y > -20 && b.y < HH + 20) boomVisual(b.d, b.x, b.y); S.bombs.splice(i, 1); } else if (b.y > HH + 40 || b.x < -40 || b.x > HW + 40) S.bombs.splice(i, 1); }
    for (let i = S.fx.length - 1; i >= 0; i--) { const p = S.fx[i]; if (p.delay > 0) { p.delay -= dt; continue; } p.life -= dt; p.vy += p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; if (p.life <= 0) S.fx.splice(i, 1); }
    S.flash = Math.max(0, S.flash - dt*.8);
    if (S.state === 'trailer') { drawTrailer(dt); return; }
    // draw: sky, stars, bombs, fireworks ... and the words last, on top of everything
    drawBg(); for (const b of S.bombs) pixelBomb(b.x, b.y, b.d.color, b.t); drawFx();
    if (S.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(.5, S.flash) + ')'; c.fillRect(0, 0, HW, HH); }
    S.btns = layout();
    S.white = Math.max(0, (S.white || 0) - dt/1.6);
    const hov = S.btns.findIndex(b => S.mx >= b.x && S.mx <= b.x + b.w && S.my >= b.y && S.my <= b.y + b.h);
    if (S.state === 'title') { T('BOMB SANDBOX', HW/2, 40, 6, '#ffd740'); T('BY JOS', HW/2, 96, 2, '#fff'); }
    if (S.state === 'new') { T('NEW GAME', HW/2, 26, 6, '#ffd740'); T('NAME:', HW/2, 84, 3, '#fff');
      c.fillStyle = '#000'; c.fillRect(HW/2 - 160, 112, 320, 40); c.fillStyle = '#fff'; c.fillRect(HW/2 - 160, 112, 320, 2); c.fillRect(HW/2 - 160, 150, 320, 2); c.fillRect(HW/2 - 160, 112, 2, 40); c.fillRect(HW/2 + 158, 112, 2, 40);
      T(S.name + (Math.floor(S.t*2) % 2 ? '_' : ' '), HW/2, 124, 3, '#fff'); }
    if (S.state === 'load') { T('YOUR GAMES', HW/2, 18, 6, '#ffd740'); if (!games().length) T('NO GAMES YET', HW/2, 120, 3, '#fff'); }
    if (S.state === 'loading') {
      const L = S.load; L.t += dt; const p = progress(L), bx = 70, by = 150, bw = 340, bh = 30;
      T('LOADING', HW/2, 84, 6, '#ffd740');
      c.fillStyle = '#000'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#ffd740'; c.fillRect(bx - 2, by - 2, bw + 4, 2); c.fillRect(bx - 2, by + bh, bw + 4, 2); c.fillRect(bx - 2, by - 2, 2, bh + 4); c.fillRect(bx + bw, by - 2, 2, bh + 4);
      const cell = 6, off = Math.floor(S.t*12), fw = Math.floor(bw*p/cell);                      // black and white diagonal stripes, sliding left
      for (let i = 0; i < fw; i++) for (let j = 0; j < bh/cell; j++) { c.fillStyle = ((i + j + off) % 4) < 2 ? '#ffd740' : '#000'; c.fillRect(bx + i*cell, by + j*cell, cell, cell); }
      T(L.name.slice(0, 20), HW/2, 200, 2, '#9e9e9e');
      if (L.t >= L.D) { const k = L.kind, n = L.name; S.load = null; el.style.display = 'none'; S.state = 'title'; startGame(k, n); }
    } else S.btns.forEach((b, i) => drawButton(b, i === hov));
    if (S.white > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(1, S.white) + ')'; c.fillRect(0, 0, HW, HH); }          // the bright white from the end of the trailer, fading away
  }
  requestAnimationFrame(frame);

  // ---- mouse and keyboard
  const at = e => { const r = hc.getBoundingClientRect(); S.mx = (e.clientX - r.left)/r.width*HW; S.my = (e.clientY - r.top)/r.height*HH; };
  tc.addEventListener('pointerdown', () => trailerStop());
  hc.addEventListener('pointermove', at);
  hc.addEventListener('pointerdown', e => { if (S.state === 'trailer') { trailerStop(); return; } at(e); const b = S.btns.find(b => S.mx >= b.x && S.mx <= b.x + b.w && S.my >= b.y && S.my <= b.y + b.h); if (b) b.act(); });
  hc.addEventListener('wheel', e => { if (S.state === 'load') { const per = 5, g = games(); S.page = Math.max(0, Math.min(Math.ceil(g.length/per) - 1, S.page + (e.deltaY > 0 ? 1 : -1))); } });
  addEventListener('keydown', e => {
    if (el.style.display === 'none') return;
    if (S.state === 'trailer') { trailerStop(); return; }
    if (S.state === 'new') {
      if (e.key === 'Enter') { startNew(); e.preventDefault(); }
      else if (e.key === 'Escape') show('title');
      else if (e.key === 'Backspace') { S.name = S.name.slice(0, -1); e.preventDefault(); }
      else if (e.key.length === 1 && S.name.length < 14) { const ch = e.key.toUpperCase(); if (/[A-Z0-9 \-_!']/.test(ch)) { S.name += ch; e.preventDefault(); } }
    } else if (S.state === 'load' && e.key === 'Escape') show('title');
  });
  $('menubtn').onclick = () => { save(); homeShow('title'); };

  // the old single save becomes the first game in the list
  try { const old = JSON.parse(localStorage.getItem(OLD_SAVE)); if (old && !readIndex().length) { const name = 'MY FIRST GAME'; localStorage.setItem(GAME_KEY(name), JSON.stringify({ name, saved: Date.now(), wallet: old.wallet || 0, total: old.total || 0, inv: old.inv || {}, sel: old.sel ?? 'L' })); writeIndex([{ name, saved: Date.now(), wallet: old.wallet || 0, total: old.total || 0 }]); localStorage.removeItem(OLD_SAVE); } } catch (e) {}

  const link = location.hash.match(/^#game=(.+)$/);
  if (link) { const name = decodeURIComponent(link[1]); if (readIndex().some(g => g.name === name)) beginLoading('load', name); else setTimeout(() => toast("That game isn't saved in this browser."), 500); }
})();
