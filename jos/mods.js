/* ============ MODS ============
   The 🧪 Mods button (top right, under Easy Mode) opens a panel of
   mod buttons. Click one to switch that effect on or off — GREEN means on.
   Every mod starts OFF for a first-time visitor. Your choices are remembered for next time.

   To add a new mod: add it to MODS below, then write what it does. */
(function () {
  var KEY = 'jos-mods';
  var SECRET = 'jos';        /* the secret word — type it anywhere on the home page */
  /* in a game the script tag says data-game: the button moves to the bottom corner,
     and Day and night and Secret code stay on the home page only */
  var GAME = !!(document.currentScript && document.currentScript.hasAttribute('data-game'));
  var HOME_ONLY = ['sky', 'secret'];

  var MODS = [
    { id: 'glow',    name: '✨ Hover glow',     about: 'Buttons glow and float up when your mouse is on them' },
    { id: 'ripple',  name: '💧 Click ripple',   about: 'Every click sends out a soft ring' },
    { id: 'trail',   name: '⭐ Mouse trail',    about: 'Little sparkles follow your mouse' },
    { id: 'sky',     name: '🌗 Day and night',  about: function () { return 'The sky matches the real time. Right now: ' + phase().label; } },
    { id: 'bubbles', name: '🫧 Floating bubbles', about: 'Soft bubbles drift up behind everything' },
    { id: 'pop',     name: '🎈 Buttons pop in', about: 'Buttons bounce in one by one when the page opens' },
    { id: 'secret',  name: '🤫 Secret code',    about: 'Type the secret word and something happens…' },
    /* the newer mods */
    { id: 'rainbow', name: '🌈 Rainbow writing', about: 'Big titles slowly change colour' },
    { id: 'snow',    name: '❄️ Snow',            about: 'Snowflakes fall down the screen' },
    { id: 'fw',      name: '🎆 Click fireworks', about: 'Every click makes a tiny firework' },
    { id: 'buddy',   name: '🐱 Mouse buddy',     about: 'A little cat follows your mouse around' },
    { id: 'spin',    name: '🌀 Spinning emojis', about: 'Emojis on buttons spin when your mouse is on them' },
    { id: 'jelly',   name: '🫨 Jelly buttons',   about: 'Buttons wobble like jelly when you click them' },
    { id: 'star',    name: '🌟 Star cursor',     about: 'Your mouse pointer becomes a star' },
    { id: 'leaves',  name: '🍂 Falling leaves',  about: 'Autumn leaves drift down the screen' },
    { id: 'shake',   name: '💥 Screen shake',    about: 'The page shakes a tiny bit when you click' },
    { id: 'colour',  name: '🎨 Colour swap',     about: 'The whole site changes to different colours' },
    { id: 'torch',   name: '🔦 Torch mode',      about: 'The screen goes dark and your mouse is a torch' },
    { id: 'flip',    name: '🙃 Upside down',     about: 'The whole page flips upside down! Press Esc to flip back' },
    { id: 'magnet',  name: '🧲 Magnet buttons',  about: 'Buttons lean towards your mouse' }
  ];
  if (GAME) MODS = MODS.filter(function (m) { return HOME_ONLY.indexOf(m.id) < 0; });

  /* ---------- slow-combo data (23 Oct 2026) ----------
     A robot tested all 190 pairs of mods and timed how much work Chrome did
     for each one (layout + style-recalc + script time, in milliseconds,
     during a few seconds of mouse movement and clicking). Bigger = slower.
     jelly+magnet is the one pair Jos actually caught freezing live, at
     0.6 FPS on his real screen — it measured 82.4ms here, so 80ms+ is BLOCK
     and 55-80ms is WARN. Below 55ms is fine. This can't see combos of three
     or more mods, only pairs — the worst PAIR among whatever is on is used
     as the estimate, which is a simplification, not a guarantee. */
  var PAIR_WORK = {
    "bubbles|buddy": 67.5,
    "bubbles|colour": 51.8,
    "bubbles|flip": 50.9,
    "bubbles|fw": 76.6,
    "bubbles|glow": 53.0,
    "bubbles|jelly": 53.3,
    "bubbles|leaves": 62.1,
    "bubbles|magnet": 81.5,
    "bubbles|pop": 51.0,
    "bubbles|rainbow": 55.2,
    "bubbles|ripple": 58.0,
    "bubbles|secret": 50.1,
    "bubbles|shake": 56.8,
    "bubbles|sky": 49.1,
    "bubbles|snow": 75.8,
    "bubbles|spin": 51.8,
    "bubbles|star": 44.4,
    "bubbles|torch": 58.0,
    "bubbles|trail": 99.5,
    "buddy|colour": 55.5,
    "buddy|flip": 60.6,
    "buddy|fw": 86.5,
    "buddy|glow": 59.9,
    "buddy|jelly": 62.9,
    "buddy|leaves": 65.9,
    "buddy|magnet": 91.8,
    "buddy|pop": 59.3,
    "buddy|rainbow": 66.6,
    "buddy|ripple": 66.4,
    "buddy|secret": 57.8,
    "buddy|shake": 60.7,
    "buddy|sky": 65.8,
    "buddy|snow": 79.6,
    "buddy|spin": 61.9,
    "buddy|star": 55.1,
    "buddy|torch": 60.7,
    "buddy|trail": 110.9,
    "colour|flip": 44.6,
    "colour|fw": 76.7,
    "colour|glow": 51.8,
    "colour|jelly": 53.0,
    "colour|leaves": 57.5,
    "colour|magnet": 79.0,
    "colour|pop": 52.9,
    "colour|rainbow": 50.5,
    "colour|ripple": 55.3,
    "colour|secret": 47.6,
    "colour|shake": 52.7,
    "colour|sky": 55.3,
    "colour|snow": 78.4,
    "colour|spin": 49.8,
    "colour|star": 50.1,
    "colour|torch": 55.7,
    "colour|trail": 105.1,
    "flip|fw": 78.8,
    "flip|glow": 51.2,
    "flip|jelly": 52.9,
    "flip|leaves": 63.1,
    "flip|magnet": 101.4,
    "flip|pop": 50.8,
    "flip|rainbow": 56.4,
    "flip|ripple": 55.4,
    "flip|secret": 46.9,
    "flip|shake": 50.0,
    "flip|sky": 49.7,
    "flip|snow": 80.8,
    "flip|spin": 51.7,
    "flip|star": 45.1,
    "flip|torch": 55.7,
    "flip|trail": 96.5,
    "fw|glow": 70.6,
    "fw|jelly": 74.8,
    "fw|leaves": 81.3,
    "fw|magnet": 103.5,
    "fw|pop": 69.9,
    "fw|rainbow": 74.1,
    "fw|ripple": 77.8,
    "fw|secret": 69.0,
    "fw|shake": 75.6,
    "fw|sky": 84.1,
    "fw|snow": 89.2,
    "fw|spin": 71.7,
    "fw|star": 72.1,
    "fw|torch": 75.7,
    "fw|trail": 123.7,
    "glow|jelly": 49.6,
    "glow|leaves": 60.1,
    "glow|magnet": 80.4,
    "glow|pop": 52.0,
    "glow|rainbow": 55.9,
    "glow|ripple": 59.3,
    "glow|secret": 57.4,
    "glow|shake": 53.5,
    "glow|sky": 55.4,
    "glow|snow": 80.7,
    "glow|spin": 51.9,
    "glow|star": 40.5,
    "glow|torch": 56.5,
    "glow|trail": 114.2,
    "jelly|leaves": 64.8,
    "jelly|magnet": 82.4,
    "jelly|pop": 52.2,
    "jelly|rainbow": 52.3,
    "jelly|ripple": 57.7,
    "jelly|secret": 51.2,
    "jelly|shake": 53.8,
    "jelly|sky": 51.4,
    "jelly|snow": 73.9,
    "jelly|spin": 51.9,
    "jelly|star": 47.0,
    "jelly|torch": 55.9,
    "jelly|trail": 102.1,
    "leaves|magnet": 89.5,
    "leaves|pop": 57.5,
    "leaves|rainbow": 60.0,
    "leaves|ripple": 67.5,
    "leaves|secret": 63.6,
    "leaves|shake": 66.1,
    "leaves|sky": 62.9,
    "leaves|snow": 80.8,
    "leaves|spin": 57.4,
    "leaves|star": 57.5,
    "leaves|torch": 69.3,
    "leaves|trail": 111.6,
    "magnet|pop": 75.8,
    "magnet|rainbow": 85.0,
    "magnet|ripple": 83.3,
    "magnet|secret": 80.9,
    "magnet|shake": 82.4,
    "magnet|sky": 84.9,
    "magnet|snow": 110.5,
    "magnet|spin": 90.4,
    "magnet|star": 77.0,
    "magnet|torch": 79.2,
    "magnet|trail": 130.1,
    "pop|rainbow": 51.6,
    "pop|ripple": 55.3,
    "pop|secret": 50.6,
    "pop|shake": 51.8,
    "pop|sky": 51.6,
    "pop|snow": 72.2,
    "pop|spin": 53.2,
    "pop|star": 44.0,
    "pop|torch": 56.1,
    "pop|trail": 100.4,
    "rainbow|ripple": 57.2,
    "rainbow|secret": 51.8,
    "rainbow|shake": 53.8,
    "rainbow|sky": 59.1,
    "rainbow|snow": 74.0,
    "rainbow|spin": 53.9,
    "rainbow|star": 44.1,
    "rainbow|torch": 59.0,
    "rainbow|trail": 106.2,
    "ripple|secret": 55.4,
    "ripple|shake": 55.7,
    "ripple|sky": 53.5,
    "ripple|snow": 80.8,
    "ripple|spin": 55.8,
    "ripple|star": 48.7,
    "ripple|torch": 61.1,
    "ripple|trail": 114.4,
    "secret|shake": 58.4,
    "secret|sky": 58.1,
    "secret|snow": 67.8,
    "secret|spin": 54.7,
    "secret|star": 43.8,
    "secret|torch": 50.1,
    "secret|trail": 100.4,
    "shake|sky": 57.6,
    "shake|snow": 86.4,
    "shake|spin": 55.3,
    "shake|star": 50.9,
    "shake|torch": 57.9,
    "shake|trail": 102.7,
    "sky|snow": 82.2,
    "sky|spin": 54.3,
    "sky|star": 46.4,
    "sky|torch": 64.7,
    "sky|trail": 99.9,
    "snow|spin": 73.4,
    "snow|star": 68.3,
    "snow|torch": 76.9,
    "snow|trail": 124.7,
    "spin|star": 44.4,
    "spin|torch": 56.0,
    "spin|trail": 105.3,
    "star|torch": 48.7,
    "star|trail": 97.6,
    "torch|trail": 112.0,
  };
  function pairWork(a, b) { return PAIR_WORK[[a, b].sort().join('|')] || 0; }
  function pairTier(a, b) {    /* 1 block, 0 warn, undefined fine */
    var w = pairWork(a, b);
    return w >= 80 ? 1 : (w >= 55 ? 0 : undefined);
  }
  function modLabel(id) { var m = MODS.filter(function (x) { return x.id === id; })[0]; return m ? m.name.replace(/^\S+\s/, '') : id; }
  function showModToast(text, bad) {
    var t = document.createElement('div');
    t.className = 'mod-toast' + (bad ? ' bad' : '');
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('go'); }, 10);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  var state = load();
  /* testing switch: open any page with ?modsoff on the end of the address and
     every mod is switched OFF and saved that way */
  if (/[?&]modsoff\b/.test(location.search)) {
    MODS.concat(HOME_ONLY.map(function (id) { return { id: id }; })).forEach(function (m) { state[m.id] = false; });
    save(state);
    try {      /* tidy the address, keeping anything else that was in it */
      var rest = location.search.replace(/[?&]modsoff\b/, '').replace(/^&/, '?');
      history.replaceState(null, '', location.pathname + rest + location.hash);
    } catch (e) {}
  }
  /* testing switch: ?mods=trail,magnet turns ON exactly that list and everything
     else OFF, saved that way — for checking one specific combination */
  var modsParam = /[?&]mods=([^&]*)/.exec(location.search);
  if (modsParam) {
    var want = decodeURIComponent(modsParam[1]).split(',').filter(Boolean);
    MODS.concat(HOME_ONLY.map(function (id) { return { id: id }; })).forEach(function (m) {
      state[m.id] = want.indexOf(m.id) >= 0;
    });
    save(state);
    try {
      var rest2 = location.search.replace(/[?&]mods=[^&]*/, '').replace(/^&/, '?');
      history.replaceState(null, '', location.pathname + rest2 + location.hash);
    } catch (e) {}
  }
  function isOn(id) {
    if (GAME && HOME_ONLY.indexOf(id) >= 0) return false;
    if (state[id] !== undefined) return state[id] !== false;
    return false;    /* a first-time visitor starts with every mod OFF, and switches on the ones they want */
  }
  function hell() { return document.body.classList.contains('hell'); }

  var css = document.createElement('style');
  css.textContent = [
    /* the Mods button */
    '#modsBtn{position:fixed;top:7.4rem;right:1rem;z-index:500;border:none;cursor:pointer;',
    '  font-family:"Fredoka One",cursive;font-size:1rem;letter-spacing:.05em;color:#fff;',
    '  background:linear-gradient(90deg,#7a4fb5,#3d9595);padding:.7rem 1.35rem;border-radius:50px;',
    '  box-shadow:0 4px 14px rgba(0,0,0,.25);transition:transform .12s,box-shadow .12s}',
    '#modsBtn:hover{transform:scale(1.06);box-shadow:0 8px 22px rgba(0,0,0,.3)}',
    /* the slow-combo toast */
    '.mod-toast{position:fixed;left:50%;bottom:1.4rem;transform:translate(-50%,20px);z-index:2000000;',
    '  max-width:min(90vw,420px);text-align:center;font-family:"Nunito",sans-serif;font-weight:700;',
    '  font-size:.95rem;color:#fff;background:#3d9595;padding:.8rem 1.2rem;border-radius:14px;',
    '  box-shadow:0 6px 18px rgba(0,0,0,.3);opacity:0;transition:opacity .25s,transform .25s}',
    '.mod-toast.go{opacity:1;transform:translate(-50%,0)}',
    '.mod-toast.bad{background:#d9643a}',
    /* the little FPS estimate, bottom of the screen, always there */
    '#estFps{position:fixed;left:50%;bottom:.5rem;transform:translateX(-50%);z-index:499;',
    '  font-family:Nunito,sans-serif;font-weight:700;font-size:.75rem;color:#89806f;',
    '  background:rgba(255,255,255,.75);padding:.25rem .6rem;border-radius:20px;pointer-events:none}',
    '#estFps.ok{color:#2f9e5c}#estFps.mid{color:#b8791f}#estFps.low{color:#c14a2e}',
    '@media (max-width:600px){#estFps{font-size:.68rem;bottom:.35rem}}',
    'body.sm-open #modsBtn,body.set-open #modsBtn,body.sm-open #modsPanel,body.set-open #modsPanel{display:none}',
    '@media (max-width:600px){#modsBtn{font-size:.8rem;padding:.55rem 1rem;top:6.2rem;right:.6rem}}',
    /* in a game: bottom right corner, panel opens upwards */
    '#modsBtn.game{top:auto;bottom:1rem;right:1rem;z-index:100000}',
    '#modsPanel.game{top:auto;bottom:4.6rem;z-index:100001;max-height:calc(100vh - 6rem);transform-origin:bottom right}',
    '@media (max-width:600px){#modsBtn.game{top:auto;bottom:.6rem;right:.6rem}}',

    /* the panel */
    '#modsPanel{position:fixed;top:10.8rem;right:1rem;z-index:501;width:300px;max-width:calc(100vw - 2rem);',
    '  max-height:calc(100vh - 12rem);overflow-y:auto;',
    '  background:#f2ede3;border:3px solid #3d9595;border-radius:18px;padding:1rem 1.1rem;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:Nunito,sans-serif;',
    '  transform-origin:top right;transition:transform .2s ease,opacity .2s ease}',
    '#modsPanel.shut{transform:scale(.85);opacity:0;pointer-events:none}',
    '#modsPanel h3{font-family:"Fredoka One",cursive;color:#d9643a;font-size:1.15rem;margin:0 0 .7rem}',
    /* one button per mod — GREEN means it is on */
    '#modsPanel{width:490px}',
    '.mod-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.45rem}',
    '@media (max-width:600px){.mod-grid{grid-template-columns:1fr 1fr}}',
    '.mod-btn{border:2px solid #cfc7b8;background:#fff;color:#234;border-radius:12px;padding:.5rem .55rem;',
    '  font:700 .85rem Nunito,sans-serif;text-align:left;cursor:pointer;transition:background .15s,border-color .15s,color .15s,scale .1s}',
    '.mod-btn:hover{border-color:#3d9595}.mod-btn:active{scale:.94}',
    '.mod-btn.on{background:#2f9e5c;border-color:#24804a;color:#fff}',
    /* grey + X: can't be turned on right now, because of a mod that is already on.
       orange: can be turned on, but it will run a bit slow together. */
    '.mod-btn.blocked{background:#e4e1d8;border-color:#cfc7b8;color:#9a9284;position:relative}',
    '.mod-btn.blocked::after{content:"✕";position:absolute;top:2px;right:7px;font-size:1rem;color:#b0453a}',
    '.mod-btn.warn-combo{background:#fde2c8;border-color:#e0a248;color:#7a4f14}',
    '.mod-about{font-size:.8rem;color:#567;line-height:1.3;margin-top:.7rem;min-height:2.1em}',

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

    /* hover glow in a game: any button or link */
    'body.mod-glow.mods-game button:not(#modsBtn):not(.mod-btn),body.mod-glow.mods-game a{transition:transform .18s ease,box-shadow .25s ease}',
    'body.mod-glow.mods-game button:not(#modsBtn):not(.mod-btn):not(:disabled):hover,body.mod-glow.mods-game a:hover{',
    '  transform:translateY(-3px) scale(1.04);',
    '  box-shadow:0 0 0 3px rgba(255,255,255,.7),0 0 14px 4px rgba(61,149,149,.7),0 6px 10px rgba(0,0,0,.15)}',

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
    '@keyframes modWiggle{25%{transform:rotate(1.2deg)}75%{transform:rotate(-1.2deg)}}',

    /* MOD: rainbow writing */
    'body.mod-rainbow h1,body.mod-rainbow h2,body.mod-rainbow .site-title{animation:modRainbow 6s linear infinite}',
    '@keyframes modRainbow{0%,100%{color:#e0453a}17%{color:#f28c28}33%{color:#e8b81f}50%{color:#2f9e5c}67%{color:#3d7fc9}83%{color:#7a4fb5}}',

    /* MOD: snow and falling leaves — in front of the page, but clicks go straight through */
    '#modSnow,#modLeaves{position:fixed;inset:0;z-index:450;pointer-events:none;overflow:hidden;display:none}',
    'body.mod-snow #modSnow,body.mod-leaves #modLeaves{display:block}',
    '.mod-fall{position:absolute;top:-50px;line-height:1;animation:modFall linear infinite}',
    '.mod-flake{color:#a9d4f0;text-shadow:0 0 4px #fff,0 0 2px #5b8fb5}',
    '@keyframes modFall{from{transform:translate(0,0) rotate(0)}to{transform:translate(var(--sway),calc(100vh + 100px)) rotate(var(--spin))}}',

    /* MOD: click fireworks */
    '.mod-fwdot{position:fixed;z-index:1000002;pointer-events:none;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;',
    '  animation:modFw .7s ease-out forwards}',
    '@keyframes modFw{to{transform:translate(var(--dx),var(--dy));opacity:0}}',

    /* MOD: mouse buddy */
    '#modBuddy{position:fixed;left:0;top:0;z-index:1000001;pointer-events:none;font-size:30px;line-height:1;display:none}',
    'body.mod-buddy #modBuddy{display:block}',

    /* MOD: spinning emojis */
    '.mod-emo{display:inline-block}',
    'body.mod-spin .mod-emo-host:hover .mod-emo{animation:modSpinE .7s ease-in-out}',
    '@keyframes modSpinE{to{rotate:360deg}}',

    /* MOD: jelly buttons */
    '.mod-wobble{animation:modJelly .5s ease}',
    '@keyframes modJelly{0%,100%{scale:1}25%{scale:1.15 .85}50%{scale:.9 1.1}75%{scale:1.05 .95}}',

    /* MOD: star cursor */
    "body.mod-star,body.mod-star *{cursor:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
    "<path d='M16 2l4.2 9.4 10.1.9-7.7 6.7 2.3 9.9L16 23.6l-8.9 5.3 2.3-9.9-7.7-6.7 10.1-.9z' fill='%23f2b134' stroke='%23233344' stroke-width='2' stroke-linejoin='round'/></svg>\") 16 16,auto!important}",

    /* the home page draws its own fire cursor, so hide it while the star is on */
    'body.mod-star #cursorFire{display:none!important}',

    /* MOD: screen shake */
    'html.mod-shaking{animation:modShake .3s linear}',
    '@keyframes modShake{20%{translate:-5px 2px}40%{translate:5px -2px}60%{translate:-3px 1px}80%{translate:3px -1px}}',

    /* MOD: colour swap */
    'html.mod-colour{filter:hue-rotate(150deg)}',

    /* MOD: torch mode — the menus stay on top so you can always switch it off */
    '#modTorch{position:fixed;inset:0;z-index:1000000;pointer-events:none;display:none;',
    '  background:radial-gradient(circle 150px at var(--x,50%) var(--y,50%),transparent 55%,#000 100%)}',
    'body.mod-torch #cursorFire{z-index:1000002!important}',
    'body.mod-torch #modTorch{display:block}',
    'body.mod-torch #modsBtn,body.mod-torch #modsPanel,body.mod-torch #langBtn,body.mod-torch #langPanel{z-index:1000003!important}',

    /* MOD: upside down */
    'html.mod-flip{rotate:180deg}',

    /* MOD: magnet buttons */
    '.mod-mag{transition:translate .15s ease-out}'
  ].join('\n');
  document.head.appendChild(css);

  function apply() {
    MODS.forEach(function (m) { document.body.classList.toggle('mod-' + m.id, isOn(m.id)); });
    /* colour swap and upside down work on the whole page, so they go on <html> */
    document.documentElement.classList.toggle('mod-colour', isOn('colour'));
    document.documentElement.classList.toggle('mod-flip', isOn('flip'));
    if (isOn('buddy')) startBuddy();
    if (!isOn('magnet')) unmagnet();
  }

  /* 🙃 when the page is upside down, the sparkles, ripples, fireworks, cat and torch
     flip with it — so work out where the mouse is on the flipped page.
     A tiny invisible dot sits at the top-left corner; wherever it ends up after the
     flip tells us how to turn a mouse position round. */
  var probe;
  function at(x, y) {
    if (!probe || !isOn('flip')) return [x, y];
    var r = probe.getBoundingClientRect();
    return [r.left - x, r.top - y];
  }

  /* the escape hatch: Esc turns Upside down off, in case the Mods button has flipped off the screen */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !isOn('flip')) return;
    state.flip = false;
    save(state);
    var b = document.querySelector('.mod-btn[data-mod="flip"]');
    if (b) b.classList.remove('on');
    apply();
  });

  /* things that can be clicked — the Mods and Language menus are left alone */
  var CLICKABLE = 'button, a, .pill, .nav-tab, .big-nav-btn, .museum-button';
  function clickable(el) {
    var c = el && el.closest ? el.closest(CLICKABLE) : null;
    if (!c || c.closest('#modsPanel, #langPanel, #modsBtn, #langBtn')) return null;
    return c;
  }

  /* ---------- 🎆 click fireworks, 🫨 jelly buttons, 💥 screen shake ---------- */
  var FW_COLOURS = ['#d9643a', '#3d9595', '#f2b134', '#7a4fb5', '#e05c8a', '#2f9e5c'];
  document.addEventListener('pointerdown', function (e) {
    if (isOn('fw')) {
      var col = FW_COLOURS[Math.floor(Math.random() * FW_COLOURS.length)];
      for (var i = 0; i < 14; i++) {
        var d = document.createElement('div'), ang = i / 14 * Math.PI * 2, dist = 35 + Math.random() * 25;
        d.className = 'mod-fwdot';
        d.style.left = at(e.clientX, e.clientY)[0] + 'px';
        d.style.top = at(e.clientX, e.clientY)[1] + 'px';
        d.style.background = i % 3 ? col : '#fff3b0';
        d.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
        d.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
        document.body.appendChild(d);
        setTimeout(d.remove.bind(d), 750);
      }
    }
    if (isOn('jelly')) {
      var b = clickable(e.target);
      if (b) {
        b.classList.remove('mod-wobble');
        void b.offsetWidth;            /* restart the wobble even if it is still going */
        b.classList.add('mod-wobble');
        setTimeout(function () { b.classList.remove('mod-wobble'); }, 550);
      }
    }
    if (isOn('shake') && !e.target.closest('#modsPanel')) {
      var h = document.documentElement;
      h.classList.remove('mod-shaking');
      void h.offsetWidth;
      h.classList.add('mod-shaking');
      setTimeout(function () { h.classList.remove('mod-shaking'); }, 320);
    }
  });

  /* ---------- ❄️ snow and 🍂 falling leaves ---------- */
  function buildFalling(id, count, pick, extra) {
    var box = document.createElement('div');
    box.id = id;
    for (var i = 0; i < count; i++) {
      var f = document.createElement('div');
      f.className = 'mod-fall ' + extra;
      f.textContent = pick();
      f.style.left = (Math.random() * 100) + '%';
      f.style.fontSize = (10 + Math.random() * 16) + 'px';
      f.style.setProperty('--sway', (Math.random() * 160 - 80) + 'px');
      f.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      var secs = 7 + Math.random() * 9;
      f.style.animationDuration = secs + 's';
      f.style.animationDelay = (-Math.random() * secs) + 's';   /* start part-way down */
      box.appendChild(f);
    }
    document.body.appendChild(box);
  }

  /* ---------- 🐱 mouse buddy ---------- */
  var mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  document.addEventListener('pointermove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });
  var buddy, bx = 0, by = 0, buddyRunning = false, facing = 1;
  function startBuddy() {
    if (buddyRunning || !buddy) return;
    buddyRunning = true;
    bx = mouseX; by = mouseY;
    (function step() {
      if (!isOn('buddy')) { buddyRunning = false; return; }
      var p = at(mouseX, mouseY), tx = p[0] - 34 * facing, ty = p[1] + 6;        /* sit just behind the mouse */
      var dx = tx - bx, dy = ty - by;
      bx += dx * 0.08; by += dy * 0.08;
      if (Math.abs(dx) > 4) facing = dx > 0 ? 1 : -1;
      var moving = Math.hypot(dx, dy) > 6;
      buddy.textContent = moving ? '🐈' : '🐱';
      /* the cat emoji faces left, so flip it when it walks right */
      buddy.style.transform = 'translate(' + (bx - 15) + 'px,' + (by - 15) + 'px) scaleX(' + (moving ? -facing : 1) + ')';
      requestAnimationFrame(step);
    })();
  }

  /* ---------- 🌀 spinning emojis ---------- */
  var EMOJI = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/u;
  document.addEventListener('mouseover', function (e) {
    if (!isOn('spin')) return;
    var b = clickable(e.target);
    if (!b || b.classList.contains('mod-emo-host')) return;
    b.classList.add('mod-emo-host');
    /* put each emoji in its own little box so it can spin on its own */
    var walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) if (EMOJI.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    nodes.forEach(function (t) {
      var parts = t.nodeValue.split(EMOJI), frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (!p) return;
        if (i % 2) { var s = document.createElement('span'); s.className = 'mod-emo'; s.textContent = p; frag.appendChild(s); }
        else frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag, t);
    });
  });

  /* ---------- 🔦 torch mode ---------- */
  var torch;
  document.addEventListener('pointermove', function (e) {
    if (!torch || !isOn('torch')) return;
    torch.style.setProperty('--x', at(e.clientX, e.clientY)[0] + 'px');
    torch.style.setProperty('--y', at(e.clientX, e.clientY)[1] + 'px');
  });

  /* ---------- 🧲 magnet buttons ---------- */
  var magList = [], magTime = 0, magQueued = false;
  function unmagnet() {
    magList.forEach(function (el) { el.style.translate = ''; el._mx = el._my = 0; });
  }
  document.addEventListener('pointermove', function () {
    if (!isOn('magnet') || magQueued) return;
    magQueued = true;
    requestAnimationFrame(function () {
      magQueued = false;
      if (Date.now() - magTime > 1500) {          /* look for new buttons now and then */
        magTime = Date.now();
        magList = Array.prototype.filter.call(document.querySelectorAll(CLICKABLE), function (el) { return clickable(el) === el; });
        magList.forEach(function (el) { el.classList.add('mod-mag'); });
      }
      magList.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width) return;
        var cx = r.left + r.width / 2 - (el._mx || 0), cy = r.top + r.height / 2 - (el._my || 0);
        var dx = mouseX - cx, dy = mouseY - cy, d = Math.hypot(dx, dy), reach = 130;
        if (d < reach && d > 1) {
          var pull = (1 - d / reach) * 10;
          el._mx = dx / d * pull; el._my = dy / d * pull;
          el.style.translate = el._mx.toFixed(1) + 'px ' + el._my.toFixed(1) + 'px';
        } else if (el._mx || el._my) {
          el._mx = el._my = 0;
          el.style.translate = '';
        }
      });
    });
  });

  /* ---------- 💧 click ripple ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (!isOn('ripple')) return;
    var r = document.createElement('div');
    r.className = 'mod-ring' + (hell() ? ' hot' : '');
    r.style.left = at(e.clientX, e.clientY)[0] + 'px';
    r.style.top = at(e.clientX, e.clientY)[1] + 'px';
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
    s.style.left = at(e.clientX, e.clientY)[0] + 'px';
    s.style.top = at(e.clientX, e.clientY)[1] + 'px';
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
  var POP_TARGETS = GAME ? 'button' : '.big-nav-btn, .nav-tab, .nav-item > .nav-tab, .panel-heading, .pill, .museum-button, #showModeBtn, #hardModeBtn, #modsBtn, #gearBtn';
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
    if (GAME || !isOn('secret') || e.key.length !== 1) return;
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
    if (GAME) { btn.className = 'game'; document.body.classList.add('mods-game'); }
    btn.textContent = '🧪 MODS';

    var panel = document.createElement('div');
    panel.id = 'modsPanel';
    panel.className = GAME ? 'shut game' : 'shut';
    panel.innerHTML = '<h3>🧪 Modifications</h3>';

    /* one button per mod: click to switch it, GREEN means on.
       The line underneath tells you what the mod your mouse is on does. */
    var HINT = 'Green means ON. Click a mod to switch it on or off.';
    var grid = document.createElement('div');
    grid.className = 'mod-grid';
    var about = document.createElement('div');
    about.className = 'mod-about';
    function aboutOf(m) { return typeof m.about === 'function' ? m.about() : m.about; }
    /* every mod that is OFF gets styled against whatever is already ON:
       grey + X (can't be turned on), orange (can, but runs a bit slow),
       or left alone (fine). A mod that is already ON just stays green. */
    function refreshConflictStyles() {
      var onIds = MODS.filter(function (x) { return isOn(x.id); }).map(function (x) { return x.id; });
      Array.prototype.forEach.call(grid.querySelectorAll('.mod-btn'), function (btn) {
        var id = btn.dataset.mod;
        if (isOn(id)) { btn.classList.remove('blocked', 'warn-combo'); return; }
        var others = onIds.filter(function (o) { return o !== id; });
        var blocked = others.some(function (o) { return pairTier(o, id) === 1; });
        var warn = !blocked && others.some(function (o) { return pairTier(o, id) === 0; });
        btn.classList.toggle('blocked', blocked);
        btn.classList.toggle('warn-combo', warn);
      });
    }
    /* Est FPS: the worst pair among whatever mods are ON right now, turned
       into a rough number. 130.1ms (the slowest pair the robot measured) is
       treated as "about 0 FPS" and 0ms of extra work is "60 FPS, fine". It is
       a guess from the robot's numbers, not a live measurement of your screen. */
    var estFps = document.getElementById('estFps');
    if (!estFps) {
      estFps = document.createElement('div');
      estFps.id = 'estFps';
      document.body.appendChild(estFps);
    }
    function refreshEstFps() {
      var onIds = MODS.filter(function (x) { return isOn(x.id); }).map(function (x) { return x.id; });
      var worst = 0;
      for (var i = 0; i < onIds.length; i++) {
        for (var j = i + 1; j < onIds.length; j++) {
          worst = Math.max(worst, pairWork(onIds[i], onIds[j]));
        }
      }
      var fps = worst === 0 ? 60 : Math.max(1, Math.round(60 * (1 - worst / 130.1)));
      estFps.textContent = 'Est FPS: ' + fps;
      estFps.classList.toggle('ok', fps >= 45);
      estFps.classList.toggle('mid', fps >= 20 && fps < 45);
      estFps.classList.toggle('low', fps < 20);
    }
    MODS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.mod = m.id;
      b.className = 'mod-btn' + (isOn(m.id) ? ' on' : '');
      b.textContent = m.name;
      b.addEventListener('click', function () {
        var turningOn = !isOn(m.id);
        if (turningOn) {
          var onIds = MODS.filter(function (x) { return x.id !== m.id && isOn(x.id); }).map(function (x) { return x.id; });
          var blocker = onIds.filter(function (id) { return pairTier(id, m.id) === 1; })[0];
          if (blocker) {
            showModToast('🚫 ' + modLabel(m.id) + ' + ' + modLabel(blocker) + ' makes the screen freeze up — turn ' + modLabel(blocker) + ' off first', true);
            return;
          }
          var warner = onIds.filter(function (id) { return pairTier(id, m.id) === 0; })[0];
          if (warner) {
            showModToast('⚠️ ' + modLabel(m.id) + ' + ' + modLabel(warner) + ' can run a bit slow');
          }
        }
        state[m.id] = turningOn;
        save(state);
        b.classList.toggle('on', isOn(m.id));
        apply();
        refreshConflictStyles();
        refreshEstFps();
        about.textContent = aboutOf(m);
      });
      b.addEventListener('mouseenter', function () { about.textContent = aboutOf(m); });
      b.addEventListener('mouseleave', function () { about.textContent = HINT; });
      grid.appendChild(b);
    });
    refreshConflictStyles();
    refreshEstFps();
    panel.appendChild(grid);
    panel.appendChild(about);
    function words() { about.textContent = HINT; }
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
    if (!GAME) buildSky();
    buildBubbles();
    buildFalling('modSnow', 40, function () { return Math.random() < 0.5 ? '❄' : '❅'; }, 'mod-flake');
    buildFalling('modLeaves', 18, function () { return Math.random() < 0.5 ? '🍂' : '🍁'; }, '');
    buddy = document.createElement('div');
    buddy.id = 'modBuddy';
    document.body.appendChild(buddy);
    torch = document.createElement('div');
    torch.id = 'modTorch';
    document.body.appendChild(torch);
    probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none';
    document.body.appendChild(probe);
    apply();
    if (isOn('pop')) popIn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
