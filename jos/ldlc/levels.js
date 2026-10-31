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

  moveOldLevel();
  return { list, make, ensure, key, read, playable, rename, remove };
})();
