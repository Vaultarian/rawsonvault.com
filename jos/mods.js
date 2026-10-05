/* ============ MODS ============
   The 🧪 Mods button (top right, under Easy Mode) opens a panel of
   on/off switches. Each switch turns one effect on the whole page on or off.
   Your choices are remembered for next time.

   To add a new mod: add it to MODS below, then write what it does. */
(function () {
  var KEY = 'jos-mods';
  var SECRET = 'jos';        /* the secret word — type it anywhere on the home page */

  var MODS = [
    { id: 'glow',    name: '✨ Hover glow',     about: 'Buttons glow and float up when your mouse is on them' },
    { id: 'ripple',  name: '💧 Click ripple',   about: 'Every click sends out a soft ring' },
    { id: 'trail',   name: '⭐ Mouse trail',    about: 'Little sparkles follow your mouse' },
    { id: 'sky',     name: '🌗 Day and night',  about: function () { return 'The sky matches the real time. Right now: ' + phase().label; } },
    { id: 'bubbles', name: '🫧 Floating bubbles', about: 'Soft bubbles drift up behind everything' },
    { id: 'pop',     name: '🎈 Buttons pop in', about: 'Buttons bounce in one by one when the page opens' },
    { id: 'secret',  name: '🤫 Secret code',    about: 'Type the secret word and something happens…' }
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  var state = load();
  function isOn(id) { return state[id] !== false; }   /* every mod starts ON */
  function hell() { return document.body.classList.contains('hell'); }

  var css = document.createElement('style');
  css.textContent = [
    /* the Mods button */
    '#modsBtn{position:fixed;top:7.4rem;right:1rem;z-index:500;border:none;cursor:pointer;',
    '  font-family:"Fredoka One",cursive;font-size:1rem;letter-spacing:.05em;color:#fff;',
    '  background:linear-gradient(90deg,#7a4fb5,#3d9595);padding:.7rem 1.35rem;border-radius:50px;',
    '  box-shadow:0 4px 14px rgba(0,0,0,.25);transition:transform .12s,box-shadow .12s}',
    '#modsBtn:hover{transform:scale(1.06);box-shadow:0 8px 22px rgba(0,0,0,.3)}',
    'body.sm-open #modsBtn,body.set-open #modsBtn,body.sm-open #modsPanel,body.set-open #modsPanel{display:none}',
    '@media (max-width:600px){#modsBtn{font-size:.8rem;padding:.55rem 1rem;top:6.2rem;right:.6rem}}',

    /* the panel */
    '#modsPanel{position:fixed;top:10.8rem;right:1rem;z-index:501;width:300px;max-width:calc(100vw - 2rem);',
    '  max-height:calc(100vh - 12rem);overflow-y:auto;',
    '  background:#f2ede3;border:3px solid #3d9595;border-radius:18px;padding:1rem 1.1rem;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:Nunito,sans-serif;',
    '  transform-origin:top right;transition:transform .2s ease,opacity .2s ease}',
    '#modsPanel.shut{transform:scale(.85);opacity:0;pointer-events:none}',
    '#modsPanel h3{font-family:"Fredoka One",cursive;color:#d9643a;font-size:1.15rem;margin:0 0 .7rem}',
    '.mod-row{display:flex;align-items:center;gap:.7rem;padding:.45rem 0;cursor:pointer}',
    '.mod-row+.mod-row{border-top:1px solid rgba(61,149,149,.25)}',
    '.mod-text{flex:1}.mod-name{font-weight:700;color:#234;font-size:.95rem}',
    '.mod-about{font-size:.75rem;color:#567;line-height:1.25}',
    '.mod-switch{flex:none;width:46px;height:26px;border-radius:13px;background:#bbb;position:relative;transition:background .2s}',
    '.mod-switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;',
    '  background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s}',
    '.mod-row.on .mod-switch{background:#2f9e5c}.mod-row.on .mod-switch::after{left:23px}',

    /* MOD: hover glow */
    /* the Games list is a scroll box, which chops off anything poking out —
       so give the glow room inside it, without moving anything on the page */
    'body.mod-glow .panel-scroll{padding:14px 16px 14px 14px;margin:-14px -10px -14px -14px}',
    'body.mod-glow .pill,body.mod-glow .nav-tab,body.mod-glow .big-nav-btn,body.mod-glow .museum-button,',
    'body.mod-glow #showModeBtn,body.mod-glow #hardModeBtn,body.mod-glow #modsBtn{',
    '  transition:transform .18s ease,box-shadow .25s ease,background .15s}',
    'body.mod-glow .pill:hover,body.mod-glow .nav-tab:hover,body.mod-glow .big-nav-btn:hover{',
    '  transform:translateY(-4px) scale(1.05);',
    '  box-shadow:0 0 0 3px rgba(255,255,255,.7),0 0 12px 3px rgba(61,149,149,.75),0 6px 10px rgba(0,0,0,.15)}',
    'body.mod-glow .museum-button:hover,body.mod-glow #showModeBtn:hover,body.mod-glow #hardModeBtn:hover,body.mod-glow #modsBtn:hover{',
    '  transform:translateY(-4px) scale(1.05);',
    '  box-shadow:0 0 0 3px rgba(255,255,255,.7),0 0 22px 6px rgba(217,100,58,.6),0 10px 18px rgba(0,0,0,.2)}',

    /* MOD: click ripple */
    '.mod-ring{position:fixed;z-index:1000002;pointer-events:none;width:16px;height:16px;margin:-8px 0 0 -8px;',
    '  border-radius:50%;border:3px solid rgba(61,149,149,.8);animation:modRipple .6s ease-out forwards}',
    '.mod-ring.hot{border-color:rgba(255,120,30,.85)}',
    '@keyframes modRipple{to{transform:scale(6);opacity:0;border-width:1px}}',

    /* MOD: mouse trail */
    '.mod-spark{position:fixed;z-index:1000002;pointer-events:none;font-size:14px;line-height:1;',
    '  margin:-7px 0 0 -7px;animation:modSpark .8s ease-out forwards}',
    '@keyframes modSpark{to{transform:translate(var(--dx),var(--dy)) scale(.2) rotate(140deg);opacity:0}}',

    /* the layers behind everything (sky, then bubbles) */
    'body.mod-sky,body.mod-bubbles{isolation:isolate}',
    '#modSky,#modBubbles{position:fixed;inset:0;pointer-events:none;transition:opacity 1.2s ease}',
    '#modSky{z-index:-2;opacity:0}#modBubbles{z-index:-1;opacity:0;overflow:hidden}',
    'body.mod-sky #modSky{opacity:1}body.mod-bubbles #modBubbles{opacity:1}',
    'body.hell #modSky{opacity:0}',

    /* MOD: day and night */
    '#modSky .sky{position:absolute;inset:0;opacity:0;transition:opacity 3s ease}',
    '#modSky .sky.now{opacity:1}',
    '#modSky .morning{background:linear-gradient(#ffe2b8,#f7ead6 45%,#f2ede3)}',
    '#modSky .day{background:linear-gradient(#cdeaf2,#e6f0ec 45%,#f2ede3)}',
    '#modSky .evening{background:linear-gradient(#f59a6e,#f8c49c 40%,#f2e0cf)}',
    '#modSky .night{background:linear-gradient(#0d1633,#1b2a57 60%,#2b3a66)}',
    '#modSky .star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;',
    '  animation:modTwinkle 2.5s ease-in-out infinite alternate}',
    '@keyframes modTwinkle{from{opacity:.2}to{opacity:1}}',
    '#modSkyIcon{position:fixed;left:1rem;bottom:1rem;z-index:-1;font-size:2.4rem;pointer-events:none;',
    '  opacity:0;transition:opacity 1.2s ease;filter:drop-shadow(0 0 10px rgba(255,220,120,.8))}',
    'body.mod-sky #modSkyIcon{opacity:1}body.hell #modSkyIcon{opacity:0}',
    /* at night, the light-coloured writing that sits straight on the page needs to show up */
    'body.mod-sky.mod-night:not(.hell) .site-title{text-shadow:0 0 18px rgba(255,180,120,.45)}',

    /* MOD: floating bubbles */
    '.mod-bubble{position:absolute;bottom:-120px;border-radius:50%;',
    '  background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.7),var(--c) 60%);opacity:.35;',
    '  animation:modFloat linear infinite}',
    '@keyframes modFloat{from{transform:translate(0,0)}50%{transform:translate(var(--sway),-55vh)}',
    '  to{transform:translate(0,-115vh)}}',

    /* MOD: buttons pop in */
    'body.mods-popwait .mod-poppable{opacity:0}',
    '.mod-popping{animation:modPop .5s cubic-bezier(.3,1.6,.5,1) both}',
    '@keyframes modPop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}',

    /* MOD: secret code */
    '#modSecretMsg{position:fixed;left:50%;top:40%;z-index:1000003;pointer-events:none;',
    '  font-family:"Fredoka One",cursive;font-size:clamp(2rem,7vw,4.5rem);color:#d9643a;white-space:nowrap;',
    '  text-shadow:0 4px 0 #fff,0 8px 24px rgba(0,0,0,.25);animation:modSecret 2.6s ease forwards}',
    '@keyframes modSecret{0%{transform:translate(-50%,-50%) scale(0) rotate(-20deg)}',
    '  15%{transform:translate(-50%,-50%) scale(1.15) rotate(6deg)}25%{transform:translate(-50%,-50%) scale(1) rotate(0)}',
    '  80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-70%) scale(.9)}}',
    '#modConfetti{position:fixed;inset:0;z-index:1000002;pointer-events:none}',
    'body.mod-wiggle .main-grid{animation:modWiggle .5s ease 2}',
    '@keyframes modWiggle{25%{transform:rotate(1.2deg)}75%{transform:rotate(-1.2deg)}}'
  ].join('\n');
  document.head.appendChild(css);

  function apply() {
    MODS.forEach(function (m) { document.body.classList.toggle('mod-' + m.id, isOn(m.id)); });
  }

  /* ---------- 💧 click ripple ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (!isOn('ripple')) return;
    var r = document.createElement('div');
    r.className = 'mod-ring' + (hell() ? ' hot' : '');
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 650);
  });

  /* ---------- ⭐ mouse trail ---------- */
  var lastX = -99, lastY = -99, sparks = 0;
  var SPARK_COLOURS = ['#d9643a', '#3d9595', '#f2b134', '#7a4fb5', '#e05c8a'];
  document.addEventListener('pointermove', function (e) {
    if (!isOn('trail') || e.pointerType === 'touch') return;
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 16 || sparks > 40) return;
    lastX = e.clientX; lastY = e.clientY;
    var s = document.createElement('div');
    s.className = 'mod-spark';
    s.textContent = Math.random() < 0.5 ? '✦' : '✧';
    s.style.left = e.clientX + 'px';
    s.style.top = e.clientY + 'px';
    s.style.color = hell() ? '#ff7a1a' : SPARK_COLOURS[Math.floor(Math.random() * SPARK_COLOURS.length)];
    s.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
    s.style.setProperty('--dy', (Math.random() * 20 + 10) + 'px');
    document.body.appendChild(s);
    sparks++;
    setTimeout(function () { s.remove(); sparks--; }, 850);
  });

  /* ---------- 🌗 day and night ---------- */
  function phase() {
    var h = new Date().getHours();
    if (h >= 6 && h < 11)  return { id: 'morning', label: '🌅 Morning', icon: '🌤️' };
    if (h >= 11 && h < 17) return { id: 'day',     label: '☀️ Daytime', icon: '☀️' };
    if (h >= 17 && h < 20) return { id: 'evening', label: '🌇 Evening', icon: '🌇' };
    return { id: 'night', label: '🌙 Night', icon: '🌙' };
  }
  function buildSky() {
    var sky = document.createElement('div');
    sky.id = 'modSky';
    ['morning', 'day', 'evening', 'night'].forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'sky ' + p;
      if (p === 'night') {
        for (var i = 0; i < 70; i++) {
          var st = document.createElement('div');
          st.className = 'star';
          st.style.left = (Math.random() * 100) + '%';
          st.style.top = (Math.random() * 70) + '%';
          st.style.animationDelay = (Math.random() * 2.5) + 's';
          var size = Math.random() < 0.15 ? 4 : 2;
          st.style.width = st.style.height = size + 'px';
          d.appendChild(st);
        }
      }
      sky.appendChild(d);
    });
    var icon = document.createElement('div');
    icon.id = 'modSkyIcon';
    document.body.appendChild(sky);
    document.body.appendChild(icon);
    function update() {
      var p = phase();
      sky.querySelectorAll('.sky').forEach(function (d) { d.classList.toggle('now', d.classList.contains(p.id)); });
      icon.textContent = p.icon;
      document.body.classList.toggle('mod-night', p.id === 'night');
    }
    update();
    setInterval(update, 60000);   /* check the clock every minute */
  }

  /* ---------- 🫧 floating bubbles ---------- */
  function buildBubbles() {
    var box = document.createElement('div');
    box.id = 'modBubbles';
    var colours = ['rgba(61,149,149,.6)', 'rgba(217,100,58,.5)', 'rgba(122,79,181,.45)', 'rgba(242,177,52,.5)'];
    for (var i = 0; i < 16; i++) {
      var b = document.createElement('div');
      b.className = 'mod-bubble';
      var size = 30 + Math.random() * 90;
      b.style.width = b.style.height = size + 'px';
      b.style.left = (Math.random() * 100) + '%';
      b.style.setProperty('--c', colours[i % colours.length]);
      b.style.setProperty('--sway', (Math.random() * 120 - 60) + 'px');
      var secs = 18 + Math.random() * 22;
      b.style.animationDuration = secs + 's';
      b.style.animationDelay = (-Math.random() * secs) + 's';   /* start part-way, so the screen is not empty */
      box.appendChild(b);
    }
    document.body.appendChild(box);
  }

  /* ---------- 🎈 buttons pop in ---------- */
  var POP_TARGETS = '.big-nav-btn, .nav-tab, .nav-item > .nav-tab, .panel-heading, .pill, .museum-button, #showModeBtn, #hardModeBtn, #modsBtn, #gearBtn';
  function popIn() {
    var items = Array.prototype.slice.call(document.querySelectorAll(POP_TARGETS));
    items.forEach(function (el) { el.classList.add('mod-poppable'); });
    document.body.classList.add('mods-popwait');
    function go() {
      document.body.classList.remove('mods-popwait');
      items.forEach(function (el, i) {
        el.style.animationDelay = (i * 0.035) + 's';
        el.classList.add('mod-popping');
        setTimeout(function () {          /* tidy up, so hover effects still work afterwards */
          el.classList.remove('mod-popping', 'mod-poppable');
          el.style.animationDelay = '';
        }, 600 + i * 35);
      });
    }
    /* wait for the loading circle to finish first */
    var started = Date.now();
    (function wait() {
      var loader = document.getElementById('canvasContainer');
      var gone = !loader || !document.contains(loader) || getComputedStyle(loader).display === 'none' ||
                 loader.classList.contains('fade-out-content');
      if (gone || Date.now() - started > 15000) go();
      else setTimeout(wait, 100);
    })();
  }

  /* ---------- 🤫 secret code ---------- */
  var typed = '';
  document.addEventListener('keydown', function (e) {
    if (!isOn('secret') || e.key.length !== 1) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
    if (typed === SECRET) { typed = ''; surprise(); }
  });
  function surprise() {
    var msg = document.createElement('div');
    msg.id = 'modSecretMsg';
    msg.textContent = '🎉 SECRET FOUND! 🎉';
    document.body.appendChild(msg);
    document.body.classList.add('mod-wiggle');
    setTimeout(function () { msg.remove(); document.body.classList.remove('mod-wiggle'); }, 2700);
    confetti();
  }
  function confetti() {
    var cv = document.createElement('canvas');
    cv.id = 'modConfetti';
    cv.width = innerWidth; cv.height = innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var colours = ['#d9643a', '#3d9595', '#f2b134', '#7a4fb5', '#e05c8a', '#2f9e5c'];
    var bits = [];
    for (var i = 0; i < 160; i++) {
      bits.push({
        x: innerWidth / 2, y: innerHeight * 0.45,
        vx: (Math.random() - 0.5) * 18, vy: -Math.random() * 16 - 4,
        w: 6 + Math.random() * 6, h: 10 + Math.random() * 8,
        a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4,
        c: colours[i % colours.length]
      });
    }
    var t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      bits.forEach(function (b) {
        b.vy += 0.45; b.vx *= 0.99;
        b.x += b.vx; b.y += b.vy; b.a += b.va;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.a * 2)));
        ctx.restore();
      });
      if (now - t0 < 3500) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  /* ---------- the button and the panel ---------- */
  function build() {
    var btn = document.createElement('button');
    btn.id = 'modsBtn';
    btn.textContent = '🧪 MODS';

    var panel = document.createElement('div');
    panel.id = 'modsPanel';
    panel.className = 'shut';
    panel.innerHTML = '<h3>🧪 Modifications</h3>';

    var rows = [];
    MODS.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'mod-row' + (isOn(m.id) ? ' on' : '');
      row.innerHTML = '<div class="mod-text"><div class="mod-name"></div><div class="mod-about"></div></div><div class="mod-switch"></div>';
      row.querySelector('.mod-name').textContent = m.name;
      row.addEventListener('click', function () {
        state[m.id] = !isOn(m.id);
        save(state);
        row.classList.toggle('on', isOn(m.id));
        apply();
      });
      rows.push({ row: row, mod: m });
      panel.appendChild(row);
    });
    function words() {
      rows.forEach(function (r) {
        r.row.querySelector('.mod-about').textContent = typeof r.mod.about === 'function' ? r.mod.about() : r.mod.about;
      });
    }
    words();

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      words();
      panel.classList.toggle('shut');
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { panel.classList.add('shut'); });   /* click away to close */

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    buildSky();
    buildBubbles();
    apply();
    if (isOn('pop')) popIn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
