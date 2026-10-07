/* ============ 👀 SHOW OTHER CURSORS ============
   A switch in Settings. When it is on, you can see the cursors of other people on the
   website, each in their own colour, and they can see yours.

   Your cursor is only shared while YOUR switch is on.

   It needs a server to pass the positions between everyone. For now that is the
   practice server on this computer (~/jos/cursor-server/server.mjs), so it only works
   here: open the site in Chrome and Safari at the same time to see it.
   Later, a real server can be put in SERVER below.

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
  var me = pick('jos-cursor-id', function () { return Math.random().toString(36).slice(2, 12); });
  var colour = pick('jos-cursor-colour', function () {
    /* a bright colour: any hue, strong and not too dark */
    var h = Math.random() * 360, s = 0.85, l = 0.55;
    function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }
    return '#' + f(0) + f(8) + f(4);
  });

  var css = document.createElement('style');
  css.textContent =
    '.other-cursor{position:fixed;left:0;top:0;z-index:1000004;pointer-events:none;width:22px;height:30px;' +
    '  transition:transform .12s linear,opacity .3s;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}' +
    '.other-cursor.gone{opacity:0}';
  document.head.appendChild(css);

  var on = false, listen = null, others = {}, lastSend = 0, queued = null;

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

  function onMove(e) {
    var m = JSON.parse(e.data);
    if (m.id === me) return;
    var o = others[m.id];
    if (m.page !== location.pathname) { if (o) remove(m.id); return; }   /* only people on this page */
    if (!o) o = others[m.id] = { el: arrow(m.colour) };
    o.x = m.x; o.y = m.y;
    place(o);
  }
  function remove(id) {
    var o = others[id];
    if (!o) return;
    delete others[id];
    o.el.classList.add('gone');
    setTimeout(function () { o.el.remove(); }, 300);
  }

  /* ---- sending mine (about 15 times a second, no more) ---- */
  function post(path, data) {
    /* sent as plain text, so the browser doesn't need to ask permission first */
    return fetch(SERVER + path, { method: 'POST', body: JSON.stringify(data), keepalive: true }).catch(function () {});
  }
  function onPointer(e) {
    queued = { id: me, colour: colour, x: e.clientX / innerWidth, y: e.clientY + scrollY, page: location.pathname };
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
    listen.onopen = function () { say(''); };
    listen.onerror = function () { say('Can\'t reach the cursor server. It only works on this computer for now.'); };
    document.addEventListener('pointermove', onPointer);
  }
  function stop() {
    if (!on) return;
    on = false;
    if (listen) listen.close();
    document.removeEventListener('pointermove', onPointer);
    post('/leave', { id: me });
    for (var id in others) remove(id);
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
    if (btn) btn.addEventListener('click', function () {
      var v = !load();
      save(v); paint();
      if (v) start(); else stop();
    });
    paint();
    if (load()) start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
