/* ============ 👀 SHOW OTHER CURSORS ============
   A switch in Settings. When it is on, you can see the cursors of other people on the
   website, each in their own colour, and they can see yours.

   Your cursor is only shared while YOUR switch is on.

   It needs a server to pass the positions between everyone. For now that is the
   practice server on this computer (~/jos/cursor-server/server.mjs), so it only works
   here: open the site in Chrome and Safari at the same time to see it.
   Later, a real server can be put in SERVER below.

   The Cursors box in the bottom-left corner lists everyone else who is on, with a circle
   in their colour and the page they are on (● = Whack a Mole).

   Coming later: sign in with Google, choose a username, and show names next to cursors. */
(function () {
  var SERVER = window.JOS_CURSOR_SERVER || 'http://127.0.0.1:8767';
  var KEY = 'jos-show-cursors';

  function load() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function save(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }

  /* who am I? a random id and colour, kept for this tab */
  function pick(k, make) {
    try { var v = sessionStorage.getItem(k); if (!v) { v = make(); sessionStorage.setItem(k, v); } return v; }
    catch (e) { return make(); }
  }
  function newId() { return Math.random().toString(36).slice(2, 12); }
  function newColour() {
    /* a bright colour: any hue, strong and not too dark */
    var h = Math.random() * 360, s = 0.85, l = 0.55;
    function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }
    return '#' + f(0) + f(8) + f(4);
  }
  var me = pick('jos-cursor-id', newId);
  var colour = pick('jos-cursor-colour', newColour);

  /* A COPIED tab gets a copy of the id as well, and then the two tabs think they are the
     same person and hide each other. So when a page opens it asks the other open tabs
     "is anyone using my id?" — if one answers, this tab takes a new id and colour. */
  try {
    var tabs = new BroadcastChannel('jos-cursor-ids'), checking = true;
    tabs.onmessage = function (e) {
      var d = e.data || {};
      if (d.ask === me) tabs.postMessage({ taken: me });
      else if (d.taken === me && checking) {
        me = newId(); colour = newColour(); checking = false;
        try { sessionStorage.setItem('jos-cursor-id', me); sessionStorage.setItem('jos-cursor-colour', colour); } catch (er) {}
      }
    };
    tabs.postMessage({ ask: me });
    setTimeout(function () { checking = false; }, 400);
  } catch (e) {}

  /* this page's name for the Cursors box: the page title, tidied up */
  function pageName() {
    if (/\/jos\/(index\.html)?$/.test(location.pathname)) return 'Home';
    var t = document.title
      .replace(/\s*[—–-]\s*Jos('s?|')?( Projects)?\s*$/i, '')     /* "2048 — Jos' Projects" -> "2048" */
      .replace(/^Jos('s|')?\s+/i, '')                              /* "Jos's Spirograph"     -> "Spirograph" */
      .replace(/\p{Extended_Pictographic}/gu, '').trim();
    return t || 'a page';
  }
  var myPage = 'a page';   /* read properly in setup(), once the page (and its <title>) has loaded */

  function safeColour(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : '#888888'; }

  var css = document.createElement('style');
  css.textContent =
    '.other-cursor{position:fixed;left:0;top:0;z-index:1000004;pointer-events:none;width:22px;height:30px;' +
    '  transition:transform .12s linear,opacity .3s;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}' +
    '.other-cursor.gone{opacity:0}' +
    /* the Cursors box */
    '#cursorBox{position:fixed;left:1rem;bottom:1rem;z-index:100000;display:none;min-width:150px;max-width:260px;' +
    '  background:#f2ede3;border:3px solid #3d9595;border-radius:14px;padding:.55rem .85rem .6rem;' +
    '  font:700 .85rem Nunito,sans-serif;color:#234;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
    'body.cursors-on #cursorBox{display:block}' +
    'body.mod-sky:not(.mods-game) #cursorBox{left:4.6rem}' +            /* room for the sun or moon */
    '#cursorBox h4{font-family:"Fredoka One",cursive;font-weight:400;color:#d9643a;font-size:1rem;margin:0 0 .35rem}' +
    '.cb-row{display:flex;align-items:center;gap:.45rem;margin:.25rem 0}' +
    '.cb-dot{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)}' +
    '.cb-none{color:#678;font-weight:600}';
  document.head.appendChild(css);

  var on = false, listen = null, others = {}, lastSend = 0, queued = null, beat = null;

  /* ---- drawing the other people's cursors ---- */
  function arrow(c) {
    var d = document.createElement('div');
    d.className = 'other-cursor';
    d.innerHTML = '<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2 L2 24 L8 18.5 L12 28 L16 26.3 L12 17 L20 17 Z" ' +
                  'fill="' + c + '" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.appendChild(d);
    return d;
  }
  function place(o) {
    o.el.style.transform = 'translate(' + (o.x * innerWidth) + 'px,' + (o.y - scrollY) + 'px)';
  }
  window.addEventListener('scroll', function () { for (var id in others) place(others[id]); }, { passive: true });
  window.addEventListener('resize', function () { for (var id in others) place(others[id]); });

  function dropArrow(o) {
    if (!o.el) return;
    var el = o.el;
    o.el = null;
    el.classList.add('gone');
    setTimeout(function () { el.remove(); }, 300);
  }
  function onMove(e) {
    var m = JSON.parse(e.data);
    if (m.id === me) return;
    var o = others[m.id] || (others[m.id] = {});
    o.colour = safeColour(m.colour);
    o.title = String(m.title || 'a page').slice(0, 60);
    o.x = m.x; o.y = m.y;
    /* an arrow only for people on this same page, and only once they have moved */
    if (m.page === location.pathname && m.x >= 0) {
      if (!o.el) o.el = arrow(o.colour);
      place(o);
    } else dropArrow(o);
    list();
  }
  function remove(id) {
    var o = others[id];
    if (!o) return;
    delete others[id];
    dropArrow(o);
    list();
  }

  /* ---- the Cursors box: a circle in their colour = the page they are on ---- */
  var box = document.createElement('div');
  box.id = 'cursorBox';
  function list() {
    box.textContent = '';
    var h = document.createElement('h4');
    h.textContent = 'Cursors';
    box.appendChild(h);
    var ids = Object.keys(others);
    if (!ids.length) {
      var none = document.createElement('div');
      none.className = 'cb-none';
      none.textContent = 'No one else is on yet';
      box.appendChild(none);
    }
    ids.forEach(function (id) {
      var row = document.createElement('div'), dot = document.createElement('span'), words = document.createElement('span');
      row.className = 'cb-row';
      dot.className = 'cb-dot';
      dot.style.background = others[id].colour;
      words.textContent = '= ' + others[id].title;        /* textContent, so nobody can sneak code in */
      row.appendChild(dot); row.appendChild(words);
      box.appendChild(row);
    });
  }

  /* ---- sending mine (about 15 times a second, no more) ---- */
  function post(path, data) {
    /* sent as plain text, so the browser doesn't need to ask permission first */
    return fetch(SERVER + path, { method: 'POST', body: JSON.stringify(data), keepalive: true }).catch(function () {});
  }
  function onPointer(e) {
    queued = { id: me, colour: colour, x: e.clientX / innerWidth, y: e.clientY + scrollY, page: location.pathname, title: myPage };
    var now = Date.now();
    if (now - lastSend < 66) return;
    lastSend = now;
    post('/move', queued);
  }

  /* ---- switching on and off ---- */
  function start() {
    if (on) return;
    on = true;
    listen = new EventSource(SERVER + '/events');
    listen.addEventListener('move', onMove);
    listen.addEventListener('leave', function (e) { remove(JSON.parse(e.data).id); });
    listen.onopen = function () {
      say('');
      /* say hello straight away, so I show up in other people's boxes before I move */
      post('/move', { id: me, colour: colour, x: -1, y: 0, page: location.pathname, title: myPage });
    };
    listen.onerror = function () { say('Can\'t reach the cursor server. It only works on this computer for now.'); };
    document.addEventListener('pointermove', onPointer);
    /* every 4 seconds say "still here", so people who are just reading don't vanish */
    beat = setInterval(function () {
      post('/move', queued || { id: me, colour: colour, x: -1, y: 0, page: location.pathname, title: myPage });
    }, 4000);
    document.body.classList.add('cursors-on');
    list();
  }
  function stop() {
    if (!on) return;
    on = false;
    if (listen) listen.close();
    clearInterval(beat);
    document.removeEventListener('pointermove', onPointer);
    post('/leave', { id: me });
    for (var id in others) remove(id);
    document.body.classList.remove('cursors-on');
    say('');
  }
  window.addEventListener('pagehide', function () { if (on) post('/leave', { id: me }); });

  /* ---- the Settings button ---- */
  var btn, msg;
  function say(t) { if (msg) msg.textContent = t; }
  function paint() { if (btn) btn.classList.toggle('off', !load()); }
  function setup() {
    btn = document.getElementById('tCursors');
    msg = document.getElementById('cursorMsg');
    myPage = pageName();
    document.body.appendChild(box);
    if (btn) btn.addEventListener('click', function () {
      var v = !load();
      save(v); paint();
      if (v) start(); else stop();
    });
    paint();
    if (load()) setTimeout(start, 450);   /* after the copied-tab check above */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
