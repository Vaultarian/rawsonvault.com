/* ---------- Jos: the secret word "beginner" ----------
   Jos (1 Nov): "make a little word command that is beginner, and if you type it in it shows you
   everything you can do, how to do cursor, how to do select box, how to do trigger to block, how
   to do eraser, how to do all the blocks, how to connect triggers, how to get into the
   properties, how to do everything."
   Then: "Can you not make it a separate tab? How about just make it so it has arrows and little
   message blocks showing you how to do stuff, so you can look at the guide while building."

   Type beginner on the keyboard (not in a box): little gold message bubbles appear, with arrows
   pointing at the real buttons. They change with what you're doing: pick Trigger to block and its
   bubble tells you step 1, then step 2… Clicks go straight through them, so you keep building.
   Type beginner again to hide them. It remembers, like the editor commands.

   Needs editor.js first: it reads tool, chosen, sel, linkFrom, linking, find, cv and cell. */
(() => {
  const WORD = 'beginner';
  const STORE = 'jos-ldlc-beginner';
  let on = false;
  try { on = localStorage.getItem(STORE) === '1'; } catch (e) {}

  document.head.append(Object.assign(document.createElement('style'), { textContent:`
#bubbles, #bubArrows { position:fixed; inset:0; z-index:245; pointer-events:none; }
#bubArrows { width:100%; height:100%; }
.bub { position:absolute; max-width:210px; padding:.4rem .65rem; border-radius:10px;
  background:#ffd23f; color:#2a0008; font-family:'Nunito', sans-serif; font-weight:800; font-size:.85rem;
  line-height:1.3; box-shadow:0 3px 0 #8a6a00, 0 6px 16px rgba(0,0,0,.45); }
.bub.big { max-width:250px; font-size:.9rem; }
.bub b { font-family:'Fredoka One', cursive; font-weight:400; }
.bub .now { background:#2a0008; color:#ffd23f; border-radius:6px; padding:0 .3rem; }
body.testing #bubbles, body.testing #bubArrows { display:none; }
` }));

  const layer = Object.assign(document.createElement('div'), { id:'bubbles' });
  const svgNS = 'http://www.w3.org/2000/svg';
  const arrows = document.createElementNS(svgNS, 'svg');
  arrows.id = 'bubArrows';
  document.body.append(arrows, layer);
  const divs = {};   // one bubble div per key, kept between frames

  /* ---------- what to say, and what to point at, right now ---------- */
  const q = s => document.querySelector(s);
  const box = el => el && el.getBoundingClientRect();
  function cellBox(p) {     // a square on the level, on the screen
    const r = cv.getBoundingClientRect();
    return { left:r.left + p.x * cell, top:r.top + p.y * cell, right:r.left + (p.x + 1) * cell,
             bottom:r.top + (p.y + 1) * cell, width:cell, height:cell };
  }

  function wanted() {
    const list = [];
    const add = (key, el, side, html, big) => { const r = el && (el.getBoundingClientRect ? box(el) : el);
      if (r && r.width) list.push({ key, r, side, html, big }); };

    // the tools in the top bar
    const TIPS = {
      cursor: 'Click a block to see its properties',
      select: 'Drag a box to pick lots of blocks',
      link:   'Connect a trigger to blocks',
      erase:  'Rub blocks out'
    };
    if (tool === 'place') {
      Object.keys(TIPS).forEach(t => add('tool-' + t, q(`.tool[data-tool=${t}]`), 'below', TIPS[t]));
    } else {
      add('tool-' + tool, q(`.tool[data-tool=${tool}]`), 'below', toolHow(), true);
    }
    if (tool === 'link') add('links', q('#triggerLinks') && q('#triggerLinks').closest('label'), 'below',
                             'Turn this on to see every trigger\'s lines');

    // (not while the properties are open: it would cover the top of them)
    if (!q('#panel.open')) add('test', q('#testBtn'), 'below', '<b>▶ TEST</b> plays your level. Beat it and <b>📤 Send</b> lights up.');

    // the blocks bar
    if (tool === 'place') add('blocks', q(`.block[data-id="${chosen}"]`), 'right', placeHow(), true);
    else add('blocks', q('#palette h3'), 'right', 'Pick a block here to put it down');

    // the properties
    const panel = q('#panel.open');
    if (panel) {
      const r = box(panel);
      const top = { left:r.left, right:r.right, top:r.top, bottom:r.top + 110, width:r.width, height:110 };
      add('panel', top, 'left', '<b>⚙️ Block properties</b><br>Green switch = on.' +
          (q('#panel .p-add') ? ' Press <b>+ Add</b> to make it do something when its trigger goes off.'
                              : ' Connect a trigger to it to get <b>+ Add</b>.'), true);
    }

    // the edges, and the hero and the door on the level
    add('edge', q('.edgeBtn[data-edge=bottom]'), 'right', '<b>✏️</b> Swap floor and edge of screen (touch the edge and you die)');
    const hero = find('hero'), door = find('door');
    if (hero) add('hero', cellBox(hero), 'above', 'You start here');
    if (door) add('door', cellBox(door), 'above', 'Get here to win!');
    // a small screen has no room for them all: just the ones about what you're doing now
    return innerWidth < 700 ? list.filter(b => b.big) : list;
  }

  function toolHow() {
    if (tool === 'cursor') return '<b>🖱 Cursor</b><br>Click a block to open its properties. Drag a block to move it.';
    if (tool === 'erase')  return '<b>🧽 Eraser</b><br>Click a block to rub it out. Drag to rub out lots. ' +
                                  '<b>🗑 Clear</b> rubs out everything.';
    if (tool === 'select') {
      if (!sel.size) return '<b>✋ Select blocks</b><br>Click and drag to make a box round the blocks you want.';
      return `<b>✋ ${sel.size} selected</b><br>Drag them to move them. <b>Delete</b> deletes them. ` +
             'Click one to change all their properties. Click an empty square to start again.';
    }
    if (tool === 'link') {
      const step = !linkFrom.length ? 1 : linking ? 3 : 2;
      const s = (n, text) => n === step ? `<span class="now">${text}</span>` : text;
      return '<b>🔗 Trigger to block</b><br>' +
             s(1, '1. Click a trigger or a button.') + '<br>' +
             s(2, '2. Click the blocks it sets off.') + '<br>' +
             s(3, '3. Click more blocks, or press <b>Done</b>. Then <b>+ Add</b>.');
    }
    return '';
  }

  function placeHow() {
    let h = `<b>${NAME[chosen]}</b> is picked. Click on the level to put it down. Drag to put down lots.`;
    if (TURNS.includes(chosen)) h += ' Press <b>R</b> to turn it.';
    if (chosen === 'hero' || chosen === 'door') h += ' There\'s only one, so it moves.';
    if (chosen === 'trigger' || chosen === 'button') h += ' Then connect it with <b>🔗 Trigger to block</b>.';
    if (chosen === 'portal') h += ' Portals go in pairs: put down 2.';
    return h;
  }

  /* ---------- putting the bubbles in place, and drawing the arrows ---------- */
  const GAP = 30;   // how long the arrows are
  function place(list) {
    // the creator's own message at the top (like "Choose a trigger or button") always stays readable
    const placed = [];
    const msg = q('#banner.show');
    if (msg) { const m = box(msg); placed.push({ x:m.left, y:m.top, w:m.width, h:m.height, b:null }); }
    const W = innerWidth, H = innerHeight;
    list.forEach(b => {
      let d = divs[b.key];
      if (!d) { d = divs[b.key] = Object.assign(document.createElement('div'), { className:'bub' }); layer.append(d); }
      if (d._html !== b.html) { d.innerHTML = b.html; d._html = b.html; }
      d.classList.toggle('big', !!b.big);
      const w = d.offsetWidth, h = d.offsetHeight, r = b.r;
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      let x, y;
      if (b.side === 'below') { x = cx - w / 2; y = r.bottom + GAP; }
      if (b.side === 'above') { x = cx - w / 2; y = r.top - GAP - h; }
      if (b.side === 'right') { x = r.right + GAP; y = cy - h / 2; }
      if (b.side === 'left')  { x = r.left - GAP - w; y = cy - h / 2; }
      x = Math.max(8, Math.min(W - w - 8, x));
      y = Math.max(8, Math.min(H - h - 8, y));
      // bumping into a bubble that's already there? move out of its way (up for "above", down for the rest)
      for (let tries = 0; tries < 12; tries++) {
        const hit = placed.find(p => x < p.x + p.w + 6 && p.x < x + w + 6 && y < p.y + p.h + 6 && p.y < y + h + 6);
        if (!hit) break;
        y = b.side === 'above' ? hit.y - h - 8 : hit.y + hit.h + 8;
      }
      d.style.left = x + 'px'; d.style.top = y + 'px';
      placed.push({ x, y, w, h, b });
    });
    Object.keys(divs).forEach(k => { if (!list.some(b => b.key === k)) { divs[k].remove(); delete divs[k]; } });

    // an arrow from each bubble to the thing it's talking about
    let svg = '';
    placed.forEach(p => {
      if (!p.b) return;
      const r = p.b.r, cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      const end = p.b.side === 'below' ? [cx, r.bottom + 3] : p.b.side === 'above' ? [cx, r.top - 3]
                : p.b.side === 'right' ? [r.right + 3, cy] : [r.left - 3, cy];
      const sx = Math.max(p.x + 12, Math.min(p.x + p.w - 12, end[0]));
      const sy = Math.max(p.y, Math.min(p.y + p.h, end[1]));
      const dx = end[0] - sx, dy = end[1] - sy, len = Math.hypot(dx, dy);
      if (len < 8) return;
      const ux = dx / len, uy = dy / len, hx = end[0] - ux * 11, hy = end[1] - uy * 11;
      svg += `<line x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy}" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>` +
             `<path d="M${end[0]} ${end[1]} L${hx - uy * 7} ${hy + ux * 7} L${hx + uy * 7} ${hy - ux * 7} Z" fill="#ffd23f"/>`;
    });
    arrows.innerHTML = svg;
  }

  let raf = 0;
  function frame() {
    const send = q('#sendModal');
    const hide = !on || (typeof chomp !== 'undefined' && chomp) || (send && !send.hidden);
    if (hide) { place([]); } else { try { place(wanted()); } catch (e) { place([]); } }
    raf = on ? requestAnimationFrame(frame) : 0;
  }
  function turn(v) {
    on = v;
    try { localStorage.setItem(STORE, on ? '1' : ''); } catch (e) {}
    if (on && !raf) raf = requestAnimationFrame(frame);
    if (!on) place([]);
  }
  if (on) raf = requestAnimationFrame(frame);

  /* ---------- the secret word ---------- */
  let typed = '';
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const send = q('#sendModal');
    if (document.body.classList.contains('testing') || (send && !send.hidden)) return;
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
    typed = (typed + e.key.toLowerCase()).slice(-WORD.length);
    if (typed !== WORD) return;
    typed = '';
    e.stopPropagation();          // so the last r of beginner doesn't turn a block
    turn(!on);
    say(on ? '📖 Beginner guide on' : 'Beginner guide off');
  }, true);
})();
