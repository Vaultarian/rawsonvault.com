/* ============ LANGUAGE ============
   The 🌍 Language button (bottom right) opens a list of languages.
   Pick one and the whole site changes into it, games too, using Google Translate.
   English is at the top, so you can always get back.
   Your choice is remembered (Google keeps it in a cookie called googtrans).

   THE GLITCH (Jos's idea): the page does not reload. Instead
     1. a glitch wave sweeps across the screen, scrambling every letter it passes,
     2. the language swaps underneath while everything is glitching,
     3. a second wave sweeps across and the new language pushes the glitch away.
   How: the real words are hidden for a moment, and a see-through canvas on top
   draws every letter in the same place, scrambled or real.

   To add a language: add it to LANGS below. code = Google's language code,
   label = the word "language" in that language (shown on the button). */
(function () {
  var GAME = !!(document.currentScript && document.currentScript.hasAttribute('data-game'));

  var LANGS = [
    { code: 'en',    flag: '🇬🇧', name: 'English',    label: 'LANGUAGE' },
    { code: 'gd',    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Gàidhlig',   label: 'CÀNAN' },
    { code: 'fr',    flag: '🇫🇷', name: 'Français',   label: 'LANGUE' },
    { code: 'de',    flag: '🇩🇪', name: 'Deutsch',    label: 'SPRACHE' },
    { code: 'es',    flag: '🇪🇸', name: 'Español',    label: 'IDIOMA' },
    { code: 'it',    flag: '🇮🇹', name: 'Italiano',   label: 'LINGUA' },
    { code: 'pt',    flag: '🇵🇹', name: 'Português',  label: 'IDIOMA' },
    { code: 'nl',    flag: '🇳🇱', name: 'Nederlands', label: 'TAAL' },
    { code: 'pl',    flag: '🇵🇱', name: 'Polski',     label: 'JĘZYK' },
    { code: 'uk',    flag: '🇺🇦', name: 'Українська', label: 'МОВА' },
    { code: 'ru',    flag: '🇷🇺', name: 'Русский',    label: 'ЯЗЫК' },
    { code: 'el',    flag: '🇬🇷', name: 'Ελληνικά',   label: 'ΓΛΩΣΣΑ' },
    { code: 'tr',    flag: '🇹🇷', name: 'Türkçe',     label: 'DİL' },
    { code: 'ar',    flag: '🇸🇦', name: 'العربية',    label: 'اللغة' },
    { code: 'hi',    flag: '🇮🇳', name: 'हिन्दी',      label: 'भाषा' },
    { code: 'zh-CN', flag: '🇨🇳', name: '中文',       label: '语言' },
    { code: 'ja',    flag: '🇯🇵', name: '日本語',     label: '言語' },
    { code: 'ko',    flag: '🇰🇷', name: '한국어',     label: '언어' }
  ];
  function find(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i]; return LANGS[0]; }

  /* ---------- which language are we in? ---------- */
  function current() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    var c = m ? decodeURIComponent(m[1]) : 'en';
    return c || 'en';
  }
  /* the cookie has to be set (and cleared) on both the exact site and the main domain */
  function setCookie(value, days) {
    var exp = days < 0 ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '; max-age=' + days * 86400;
    var host = location.hostname;
    document.cookie = 'googtrans=' + value + '; path=/' + exp;
    if (host.indexOf('.') > 0 && !/^[\d.]+$/.test(host)) {
      var root = host.split('.').slice(-2).join('.');
      document.cookie = 'googtrans=' + value + '; path=/; domain=' + host + exp;
      document.cookie = 'googtrans=' + value + '; path=/; domain=.' + root + exp;
    }
  }

  /* ---------- the look ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#langBtn{position:fixed;bottom:1rem;right:1rem;z-index:100000;border:none;cursor:pointer;',
    '  font-family:"Fredoka One",cursive;font-size:1rem;letter-spacing:.05em;color:#fff;',
    '  background:linear-gradient(90deg,#2a5f7a,#3d9595);padding:.7rem 1.35rem;border-radius:50px;',
    '  box-shadow:0 4px 14px rgba(0,0,0,.25);transition:transform .12s,box-shadow .12s}',
    '#langBtn:hover{transform:scale(1.06);box-shadow:0 8px 22px rgba(0,0,0,.3)}',
    '#langBtn.game{right:10rem}',          /* in a game, sit just left of the Mods button */
    '#langPanel{position:fixed;bottom:4.6rem;right:1rem;z-index:100001;width:240px;max-width:calc(100vw - 2rem);',
    '  max-height:calc(100vh - 6rem);overflow-y:auto;background:#f2ede3;border:3px solid #3d9595;',
    '  border-radius:18px;padding:.8rem;box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:Nunito,sans-serif;',
    '  transform-origin:bottom right;transition:transform .2s ease,opacity .2s ease}',
    '#langPanel.game{right:10rem}',
    '#langPanel.shut{transform:scale(.85);opacity:0;pointer-events:none}',
    '#langPanel h3{font-family:"Fredoka One",cursive;color:#d9643a;font-size:1.1rem;margin:0 0 .5rem .3rem}',
    '.lang-row{display:flex;align-items:center;gap:.6rem;width:100%;border:none;background:none;cursor:pointer;',
    '  font-family:Nunito,sans-serif;font-weight:700;font-size:.95rem;color:#234;text-align:left;',
    '  padding:.45rem .6rem;border-radius:10px}',
    '.lang-row:hover{background:rgba(61,149,149,.15)}',
    '.lang-row.on{background:#3d9595;color:#fff}',
    '.lang-row .flag{font-size:1.3rem}',
    'body.sm-open #langBtn,body.set-open #langBtn,body.sm-open #langPanel,body.set-open #langPanel{display:none}',
    '@media (max-width:600px){#langBtn{font-size:.8rem;padding:.55rem 1rem;bottom:.6rem;right:.6rem}',
    '  #langBtn.game{right:8rem}#langPanel.game{right:.6rem}}',
    /* hide Google's own bar and pop-ups, so only our button shows */
    'iframe.skiptranslate,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame,#gtHidden{display:none!important}',
    'body{top:0!important}',
    '.goog-text-highlight,font[class*="VIpgJd"]{background:none!important;box-shadow:none!important}',
    'div[class*="VIpgJd-yAWNEb-L7lbkb"]{display:none!important}',      /* Google's "original text" pop-up */
    /* the glitch: real words go see-through while the canvas draws them */
    'html.lang-hide body :not(.notranslate):not(.notranslate *){color:transparent!important;',
    '  -webkit-text-fill-color:transparent!important;text-shadow:none!important}',
    '#langCanvas{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none}'
  ].join('\n');
  document.head.appendChild(css);

  /* in another language? hide the English words straight away, so they never flash up */
  var START = current();
  if (START !== 'en') document.documentElement.classList.add('lang-hide');

  /* ---------- Google Translate (hidden; we only use its engine) ---------- */
  var combo = null, googleWaiters = [];
  function google_() {
    return new Promise(function (resolve) {
      if (combo) return resolve(combo);
      googleWaiters.push(resolve);
      if (googleWaiters.length > 1) return;
      var holder = document.createElement('div');
      holder.id = 'gtHidden';
      document.body.appendChild(holder);
      window.josTranslateReady = function () {
        new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'gtHidden');
        (function look() {
          combo = document.querySelector('.goog-te-combo');
          if (combo) googleWaiters.forEach(function (w) { w(combo); });
          else setTimeout(look, 100);
        })();
      };
      var s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=josTranslateReady';
      document.body.appendChild(s);
    });
  }

  /* resolves once the words on the page have stopped changing.
     Gives back false if nothing changed at all within firstMs. */
  function settled(maxMs, firstMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now(), last = Date.now(), seen = false;
      /* only count Google's own work: it wraps translated words in <font> tags */
      function google(nodes) {
        for (var j = 0; j < nodes.length; j++) if (nodes[j].nodeName === 'FONT') return true;
        return false;
      }
      var mo = new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          if (google(list[i].addedNodes) || google(list[i].removedNodes)) { last = Date.now(); seen = true; return; }
        }
      });
      mo.observe(document.body, { subtree: true, childList: true });
      (function check() {
        var now = Date.now();
        if (seen && now - last > 350) { mo.disconnect(); resolve(true); }
        else if (!seen && firstMs && now - t0 > firstMs) { mo.disconnect(); resolve(false); }
        else if (now - t0 > maxMs) { mo.disconnect(); resolve(seen); }
        else setTimeout(check, 60);
      })();
    });
  }

  /* Google sometimes ignores the first request, so if nothing changes, ask again (up to 3 times) */
  function translateTo(code, tries) {
    tries = tries || 1;
    return google_().then(function (c) {
      var done = settled(4000, 1300);
      if (code === 'en') {
        /* Google's own "show original" button lives in a hidden frame */
        c.value = 'en'; c.dispatchEvent(new Event('change'));
        document.querySelectorAll('iframe').forEach(function (f) {
          try { var b = f.contentDocument.querySelector('[id$=".restore"]'); if (b) b.click(); } catch (e) {}
        });
        setCookie('', -1);
      } else {
        setCookie('/en/' + code, 365);
        c.value = code; c.dispatchEvent(new Event('change'));
      }
      return done.then(function (changed) {
        if (!changed && tries < 3) return translateTo(code, tries + 1);
      });
    });
  }

  /* ---------- the glitch ---------- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*+=?!<>/\\|{}[]~^ΔΣΩЖЯ';
  var EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u;
  function glyph() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }

  /* every visible letter on screen: where it is, its font, its colour */
  function gather() {
    var hidden = document.documentElement.classList.contains('lang-hide');
    if (hidden) document.documentElement.classList.remove('lang-hide');   /* read the real colours */
    var out = [], range = document.createRange(), styles = new Map(), clips = new Map();
    var W = innerWidth, H = innerHeight;

    function clipFor(el) {
      if (clips.has(el)) return clips.get(el);
      var box = { l: 0, t: 0, r: W, b: H };
      for (var a = el; a && a !== document.body; a = a.parentElement) {
        var cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          var r = a.getBoundingClientRect();
          box = { l: Math.max(box.l, r.left), t: Math.max(box.t, r.top), r: Math.min(box.r, r.right), b: Math.min(box.b, r.bottom) };
        }
      }
      clips.set(el, box);
      return box;
    }
    function styleFor(el) {
      if (styles.has(el)) return styles.get(el);
      var cs = getComputedStyle(el), s = null;
      /* skip anything you can't actually see, like a closed panel */
      var seen = el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
      if (seen && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05) {
        var col = cs.webkitTextFillColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.webkitTextFillColor) ? cs.webkitTextFillColor : cs.color;
        if (/rgba\(.*,\s*0\)$|transparent/.test(col)) col = '#d9643a';
        s = { font: cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily, color: col };
      }
      styles.set(el, s);
      return s;
    }

    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (var n = walk.nextNode(); n && out.length < 6000; n = walk.nextNode()) {
      var el = n.parentElement, txt = n.nodeValue;
      if (!el || !txt.trim()) continue;
      if (el.closest('script,style,noscript,textarea,select,option,.notranslate,#gtHidden')) continue;
      var st = styleFor(el);
      if (!st) continue;
      var clip = clipFor(el);
      for (var i = 0; i < txt.length; ) {
        var cp = txt.codePointAt(i), len = cp > 0xffff ? 2 : 1, ch = txt.substr(i, len);
        if (!/\s/.test(ch)) {
          range.setStart(n, i); range.setEnd(n, i + len);
          var r = range.getClientRects()[0];
          if (r && r.width > 0 && r.right > clip.l && r.left < clip.r && r.bottom > clip.t && r.top < clip.b) {
            out.push({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, ch: ch, font: st.font, color: st.color,
                       emoji: EMOJI.test(ch), g: glyph() });
          }
        }
        i += len;
      }
    }
    if (hidden) document.documentElement.classList.add('lang-hide');
    return out;
  }

  var canvas = null, ctx = null, chars = [], mode = 'off', front = 0, raf = 0;
  var SWEEP_MS = 900, BAND = 70;

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'langCanvas';
    canvas.className = 'notranslate';
    var dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    document.documentElement.appendChild(canvas);   /* outside <body>, so a page animation can't move it */
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.textBaseline = 'middle';
  }
  function removeCanvas() { if (canvas) canvas.remove(); canvas = null; ctx = null; cancelAnimationFrame(raf); mode = 'off'; }

  /* one frame: letters behind the wave are glitched (out) or new (in) */
  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var lastFont = '', lastColor = '', sx = scrollX, sy = scrollY;   /* letters are pinned to the page, not the screen */
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i], glitched;
      var vx = c.x - sx;
      if (mode === 'out')  glitched = vx < front;
      else if (mode === 'hold') glitched = true;
      else glitched = vx > front - BAND;               /* 'in': new words behind the wave */
      if (c.emoji) glitched = false;                    /* emojis don't need translating */
      var show = c.ch, dx = 0, col = c.color;
      if (glitched) {
        if (Math.random() < 0.35) c.g = glyph();        /* keeps changing, lots and lots of times */
        show = c.g;                                     /* same colour, same place: only the letter changes */
      }
      if (c.font !== lastFont) { ctx.font = c.font; lastFont = c.font; }
      if (col !== lastColor) { ctx.fillStyle = col; lastColor = col; }
      ctx.fillText(show, vx + dx, c.y - sy + c.h / 2);
    }
  }

  function sweep(newMode) {
    return new Promise(function (resolve) {
      mode = newMode;
      var t0 = performance.now(), end = innerWidth + BAND * 2;
      cancelAnimationFrame(raf);
      (function frame(now) {
        front = -BAND + ((now - t0) / SWEEP_MS) * end;
        draw();
        if (front < end - BAND) raf = requestAnimationFrame(frame);
        else resolve();
      })(t0);
    });
  }
  function hold() {
    mode = 'hold';
    cancelAnimationFrame(raf);
    (function frame() { draw(); raf = requestAnimationFrame(frame); })();
  }

  /* ---------- switching ---------- */
  var busy = false, btn = null, panel = null;

  function paint(code) {
    var l = find(code);
    if (btn) btn.textContent = '🌍 ' + l.label;
    if (panel) {
      panel.querySelector('h3').textContent = '🌍 ' + l.label.charAt(0) + l.label.slice(1).toLowerCase();
      panel.querySelectorAll('.lang-row').forEach(function (r) { r.classList.toggle('on', r.dataset.code === code); });
    }
  }

  function choose(code) {
    if (busy || code === current()) return;
    busy = true;
    panel.classList.add('shut');
    chars = gather();
    ensureCanvas();
    document.documentElement.classList.add('lang-hide');
    sweep('out')                                             /* 1. the glitch pushes the old words away */
      .then(function () { hold(); return translateTo(code); }) /* 2. swap language while it glitches */
      .then(function () {
        paint(code);
        chars = gather();
        return sweep('in');                                  /* 3. the new words push the glitch away */
      })
      .then(function () {
        document.documentElement.classList.remove('lang-hide');
        removeCanvas();
        busy = false;
      });
  }

  /* arriving on a page already in another language: wait for Google, then glitch in */
  function arrive() {
    var safety = setTimeout(function () { document.documentElement.classList.remove('lang-hide'); }, 7000);
    google_().then(function () { return settled(4000, 2500); }).then(function () {
      clearTimeout(safety);
      chars = gather();
      ensureCanvas();
      return sweep('in');
    }).then(function () {
      document.documentElement.classList.remove('lang-hide');
      removeCanvas();
    });
  }

  /* ---------- the button and the list ---------- */
  function build() {
    btn = document.createElement('button');
    btn.id = 'langBtn';
    btn.className = 'notranslate' + (GAME ? ' game' : '');

    panel = document.createElement('div');
    panel.id = 'langPanel';
    panel.className = 'notranslate shut' + (GAME ? ' game' : '');
    panel.innerHTML = '<h3></h3>';
    LANGS.forEach(function (l) {
      var row = document.createElement('button');
      row.className = 'lang-row';
      row.dataset.code = l.code;
      row.innerHTML = '<span class="flag"></span><span class="nm"></span>';
      row.querySelector('.flag').textContent = l.flag;
      row.querySelector('.nm').textContent = l.name;
      row.addEventListener('click', function () { choose(l.code); });
      panel.appendChild(row);
    });

    btn.addEventListener('click', function (e) { e.stopPropagation(); if (!busy) panel.classList.toggle('shut'); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { panel.classList.add('shut'); });   /* click away to close */

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    paint(START);
    if (START !== 'en') arrive();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
