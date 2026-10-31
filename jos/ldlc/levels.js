/* ===== LDLC — Jos's levels =====
   Every level you make is kept (they save themselves), so the levels page can list them
   and PLAY can use them all. Each level has its own blocks, edges and Start pos. */
const LDLC = (() => {
  const LIST = 'jos-ldlc-levels';
  const key = (what, id) => 'jos-ldlc-' + what + '-' + id;     // what = level, edges or start

  function read(k) {
    try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
  }
  function list() { return read(LIST) || []; }
  function keep(levels) { localStorage.setItem(LIST, JSON.stringify(levels)); }

  // the one level LDLC had before there were lots: it becomes Level 1
  function moveOldLevel() {
    if (localStorage.getItem(LIST) !== null) return;
    const old = read('jos-ldlc-level');
    if (!Array.isArray(old) || !old.some(r => r && r.some(Boolean))) { keep([]); return; }
    keep([{ id:'L1', n:1, name:'Level 1', made:Date.now() }]);
    localStorage.setItem(key('level', 'L1'), JSON.stringify(old));
    ['edges', 'start'].forEach(w => {
      const v = localStorage.getItem('jos-ldlc-' + w);
      if (v !== null) localStorage.setItem(key(w, 'L1'), v);
    });
  }

  function make() {
    const levels = list();
    const n = levels.reduce((m, l) => Math.max(m, l.n || 0), 0) + 1;
    const level = { id:'L' + Date.now().toString(36), n, name:'Level ' + n, made:Date.now() };
    levels.push(level);
    keep(levels);
    return level;
  }
  // a level opened by its id that isn't in the list yet goes in the list
  function ensure(id) {
    if (!id || list().some(l => l.id === id)) return;
    const levels = list();
    const n = levels.reduce((m, l) => Math.max(m, l.n || 0), 0) + 1;
    levels.push({ id, n, name:'Level ' + n, made:Date.now() });
    keep(levels);
  }

  // PLAY can use a level once it has a Hero and a Door
  function playable(id) {
    const g = read(key('level', id));
    const all = Array.isArray(g) ? g.flat().flatMap(c => c ? [c, c.inner] : []) : [];
    return ['hero', 'door'].every(t => all.some(c => c && c.t === t));
  }

  // Jos: right-click a level to rename it or delete it
  function rename(id, name) {
    keep(list().map(l => l.id === id ? Object.assign(l, { name }) : l));
  }
  function remove(id) {
    keep(list().filter(l => l.id !== id));
    ['level', 'edges', 'start'].forEach(w => localStorage.removeItem(key(w, id)));
  }

  /* ---------- sharing a level ----------
     A level becomes a code: LDLC1. + the level, squashed small. It travels as plain text, so it can go in
     a link or in Dad's Google Form. Coming back in, a code is only ever read as blocks: anything that
     isn't a known block, switch or number is thrown away, and nothing in it is ever run. */
  const KINDS = ['tile', 'hero', 'door', 'spike', 'smallspike', 'sawblade', 'spring', 'coin', 'oneway',
                 'portal', 'trigger', 'button', 'controls', 'dashorb'];
  const SWITCH = ['collision', 'deadly', 'visible', 'action', 'disguise', 'needed'];
  const WAYS = ['up', 'down', 'left', 'right'];
  const num = (v, lo, hi, d) => typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
  const text = (v, most) => typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, most) : '';
  const keyList = v => Array.isArray(v) ? v.filter(k => typeof k === 'string' && /^[A-Za-z0-9]{1,20}$/.test(k)).slice(0, 8) : [];

  function cleanAction(a) {
    if (!a || typeof a !== 'object') return null;
    const out = { do:['', 'size', 'move', 'props'].includes(a.do) ? a.do : '' };
    if (a.size !== undefined) out.size = num(a.size, .5, 6, 2);
    if (WAYS.includes(a.dir)) out.dir = a.dir;
    if (a.n !== undefined) out.n = num(a.n, 1, 31, 1);
    if (a.speed !== undefined) out.speed = num(a.speed, 1, 50, 1);
    if (a.props && typeof a.props === 'object') {
      out.props = {};
      SWITCH.forEach(k => { if (typeof a.props[k] === 'boolean') out.props[k] = a.props[k]; });
    }
    return out;
  }
  function cleanCell(c, inside) {
    if (!c || typeof c !== 'object' || !KINDS.includes(c.t)) return null;
    const out = { t:c.t, id:Math.round(num(c.id, 1, 1e6, 1)) };
    if (c.p && typeof c.p === 'object') {
      out.p = {};
      SWITCH.forEach(k => { if (typeof c.p[k] === 'boolean') out.p[k] = c.p[k]; });
      if (c.p.strength !== undefined) out.p.strength = num(c.p.strength, 1, 100, 5);
    }
    if (KINDS.includes(c.as) || c.as === 'neededcoin') out.as = c.as;
    if (c.r !== undefined) out.r = Math.round(num(c.r, 0, 3, 0));
    if (WAYS.includes(c.out)) out.out = c.out;
    if (c.pair != null) out.pair = Math.round(num(c.pair, 1, 1e6, 1));
    if (Array.isArray(c.links)) out.links = c.links.slice(0, 300).filter(l => l && typeof l === 'object').map(l => ({
      id:Math.round(num(l.id, 1, 1e6, 1)), delay:num(l.delay, 0, 30, 0),
      actions:(Array.isArray(l.actions) ? l.actions.slice(0, 20) : []).map(cleanAction).filter(Boolean) }));
    if (c.controls && typeof c.controls === 'object') out.controls = {
      left:keyList(c.controls.left), right:keyList(c.controls.right), up:keyList(c.controls.up),
      auto:[-1, 0, 1].includes(c.controls.auto) ? c.controls.auto : 0 };
    if (!inside && c.inner) { const i = cleanCell(c.inner, true); if (i) out.inner = i; }
    return out;
  }
  function cleanLevel(o) {
    if (!o || typeof o !== 'object' || o.v !== 1 || !Array.isArray(o.grid) || o.grid.length !== 18) return null;
    if (!o.grid.every(r => Array.isArray(r) && r.length === 32)) return null;
    const edges = {};
    ['top', 'bottom', 'left', 'right'].forEach(k => { if (['solid', 'edge'].includes(o.edges && o.edges[k])) edges[k] = o.edges[k]; });
    return { name:text(o.name, 40) || 'Shared level', by:text(o.by, 40),
             grid:o.grid.map(r => r.map(c => cleanCell(c, false))), edges };
  }

  async function pack(id, name, by) {
    const level = { v:1, name, by, grid:read(key('level', id)), edges:read(key('edges', id)) || {} };
    const squashed = new Blob([JSON.stringify(level)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const bytes = new Uint8Array(await new Response(squashed).arrayBuffer());
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return 'LDLC1.' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function unpack(code) {
    try {
      if (typeof code !== 'string' || !code.startsWith('LDLC1.') || code.length > 100000) return null;
      const bin = atob(code.slice(6).replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
      const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const parts = [];
      let size = 0;
      for (;;) {                    // a small code can't be made to unsquash into something enormous
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 1e6) { reader.cancel(); return null; }
        parts.push(value);
      }
      return cleanLevel(JSON.parse(await new Blob(parts).text()));
    } catch (e) { return null; }
  }
  // a shared level goes into My levels as a new level of your own
  function addShared(level) {
    const l = make();
    rename(l.id, level.name);
    if (level.by) keep(list().map(x => x.id === l.id ? Object.assign(x, { by:level.by }) : x));
    localStorage.setItem(key('level', l.id), JSON.stringify(level.grid));
    localStorage.setItem(key('edges', l.id), JSON.stringify(level.edges));
    return l;
  }

  moveOldLevel();
  return { list, make, ensure, key, read, playable, rename, remove, pack, unpack, addShared };
})();
