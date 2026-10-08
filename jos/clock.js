/* ============ ⏰ JOS'S CLOCK ============
   Top left of the home page: the time and the date.

   Click it and:
   1. the screen turns into a lava lamp (gooey bubbles floating up and down)
   2. little 1s and 0s jump in from the edges like terminal text (one grid box at a time:
      across, up, across, up) and take over the clock, scrambling it
   3. the clock flies to the middle of the screen and gets big: hours and minutes only,
      and when a number changes it rolls, like Jos's stopwatch
   Click again, or press Esc, to go back.

   Jos's design, 8 Oct 2026. */
(function () {
  var css = document.createElement('style');
  css.textContent = [
    /* the small clock */
    '#josClock{position:fixed;top:1rem;left:1rem;z-index:500;border:none;cursor:pointer;text-align:left;',
    '  font-family:"Fredoka One",cursive;color:#fff;background:#3d9595;padding:.5rem 1rem .55rem;border-radius:16px;',
    '  box-shadow:0 4px 14px rgba(0,0,0,.25);transition:transform .12s,box-shadow .12s}',
    '#josClock:hover{transform:scale(1.05);box-shadow:0 8px 22px rgba(0,0,0,.3)}',
    '#josClock .t{display:block;font-size:1.35rem;line-height:1.1;letter-spacing:.03em}',
    '#josClock .d{display:block;font-family:Nunito,sans-serif;font-weight:700;font-size:.75rem;opacity:.9}',
    '#josClock.taken{visibility:hidden}',
    'body.sm-open #josClock,body.set-open #josClock{display:none}',
    '@media (max-width:600px){#josClock{top:.6rem;left:.6rem;padding:.35rem .7rem}#josClock .t{font-size:1rem}}',

    /* the lava lamp stage */
    '#clockStage{position:fixed;inset:0;z-index:2147470000;opacity:0;transition:opacity .6s ease;cursor:pointer;overflow:hidden}',
    '#clockStage.on{opacity:1}',
    /* the gooey trick: blurry blobs + a very high contrast = blobs that melt into each other like lava */
    '#clockStage .lava{position:absolute;inset:-10%;background:#1d0730;filter:contrast(16)}',
    '#clockStage .blob{position:absolute;border-radius:50%;background:#ff5e3a;filter:blur(22px);',
    '  animation:lavaFloat linear infinite alternate}',
    '#clockStage .glow{position:absolute;inset:0;pointer-events:none;',
    '  background:radial-gradient(ellipse at 50% 120%,rgba(255,140,60,.35),transparent 60%),',
    '  radial-gradient(ellipse at 50% -20%,rgba(160,60,255,.35),transparent 60%)}',
    '@keyframes lavaFloat{from{transform:translateY(0) scale(1)}to{transform:translateY(var(--rise)) scale(var(--grow))}}',

    /* the 1s and 0s */
    '.clock-bit{position:fixed;left:0;top:0;z-index:2147470001;pointer-events:none;font:700 18px/1 Menlo,Consolas,monospace;',
    '  color:#7dffb0;text-shadow:0 0 8px #2bff88}',

    /* the big clock */
    '#clockBig{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;',
    '  font-family:"Fredoka One",cursive;text-shadow:0 0 30px rgba(255,170,90,.8),0 6px 0 rgba(0,0,0,.25);',
    '  transform-origin:50% 50%;white-space:nowrap}',
    '#clockBig .t{display:block;font-size:clamp(4rem,15vw,11rem);line-height:1;letter-spacing:.03em}',
    /* the roll (from Jos's stopwatch): the old number slides up and fades out while the
       new one rises from below and fades in. Only the group that changed moves. */
    '#clockBig .grp{display:inline-block;position:relative}',
    '#clockBig .grp .num{display:inline-block}',
    '#clockBig .grp .old{position:absolute;left:0;top:0;pointer-events:none}',
    '#clockBig .d{display:block;font-family:Nunito,sans-serif;font-weight:800;font-size:clamp(1rem,3vw,2rem);opacity:.9;margin-top:.6rem}',
    '#clockStage .hint{position:absolute;left:0;right:0;bottom:1.4rem;text-align:center;color:rgba(255,255,255,.55);',
    '  font:700 .85rem Nunito,sans-serif;letter-spacing:.06em}'
  ].join('\n');
  document.head.appendChild(css);

  function time(d, secs) {
    return d.toLocaleTimeString(undefined, secs ? { hour: 'numeric', minute: '2-digit', second: '2-digit' }
                                                : { hour: 'numeric', minute: '2-digit' });
  }
  function date(d, long) {
    return d.toLocaleDateString(undefined, long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                                                : { weekday: 'short', day: 'numeric', month: 'short' });
  }
  /* the time split into its parts: hour, ":", minute (and am/pm if the computer uses it) */
  var PARTS = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });   /* hours and minutes, no seconds (Jos) */

  /* write the time into the big clock, rolling any group of numbers that changed */
  function roll(box, now) {
    var parts = PARTS.formatToParts(now);
    if (box.dataset.mode !== 'roll' || box.children.length !== parts.length) {
      box.dataset.mode = 'roll';                     /* first time: just build it, no roll */
      box.textContent = '';
      parts.forEach(function (p) {
        var g = document.createElement('span');
        g.className = 'grp';
        g.innerHTML = '<span class="num"></span>';
        g.firstChild.textContent = p.value;
        box.appendChild(g);
      });
      return;
    }
    parts.forEach(function (p, i) {
      var g = box.children[i], cur = g.querySelector('.num:not(.old)');
      if (cur.textContent === p.value) return;
      /* the old number: lift it out, slide it up and fade it */
      cur.classList.add('old');
      cur.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60%)', opacity: 0 }],
                  { duration: 300, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' })
         .finished.then(function () { cur.remove(); });
      /* the new number: rise from below into its place */
      var nu = document.createElement('span');
      nu.className = 'num';
      nu.textContent = p.value;
      g.appendChild(nu);
      nu.animate([{ transform: 'translateY(45%)', opacity: 0.3 }, { transform: 'translateY(0)', opacity: 1 }],
                 { duration: 300, easing: 'cubic-bezier(.2,.7,.3,1)' });
    });
  }

  function scramble(text) {           /* turn every letter and number into a 1 or a 0 */
    return text.replace(/[^\s]/g, function () { return Math.random() < 0.5 ? '0' : '1'; });
  }

  var small, stage = null, big = null, busy = false, scrambling = false, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* ---------- the small clock, ticking ---------- */
  function tick() {
    var now = new Date();
    if (!scrambling) {
      small.querySelector('.t').textContent = time(now);
      small.querySelector('.d').textContent = date(now);
    }
    if (big && !big.decoding) {
      roll(big.querySelector('.t'), now);
      big.querySelector('.d').textContent = date(now, true);
    }
  }

  /* ---------- click: lava lamp, 1s and 0s, big clock ---------- */
  function open() {
    if (stage || busy) return;
    busy = true;

    /* 1. the lava lamp */
    stage = document.createElement('div');
    stage.id = 'clockStage';
    var lava = document.createElement('div');
    lava.className = 'lava';
    var colours = ['#ff5e3a', '#ff7b2e', '#ff3d6e', '#ff9a3c'];
    for (var i = 0; i < 9; i++) {
      var b = document.createElement('div');
      b.className = 'blob';
      var size = 120 + Math.random() * 200;
      b.style.width = b.style.height = size + 'px';
      b.style.left = (Math.random() * 90) + '%';
      b.style.top = (20 + Math.random() * 70) + '%';
      b.style.background = colours[i % colours.length];
      b.style.setProperty('--rise', -(25 + Math.random() * 45) + 'vh');
      b.style.setProperty('--grow', (0.7 + Math.random() * 0.6).toFixed(2));
      b.style.animationDuration = (7 + Math.random() * 8) + 's';
      b.style.animationDelay = (-Math.random() * 10) + 's';
      lava.appendChild(b);
    }
    var glow = document.createElement('div');
    glow.className = 'glow';
    var hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Click anywhere to go back';
    stage.appendChild(lava); stage.appendChild(glow); stage.appendChild(hint);
    document.body.appendChild(stage);
    void stage.offsetWidth;
    stage.classList.add('on');
    stage.addEventListener('click', close);

    /* 2. the 1s and 0s come in like TERMINAL text: a terminal can only put letters in boxes
          on a grid, so nothing can glide. Each 1 or 0 jumps one box at a time — across, up,
          across, up, like a staircase — until it lands on the clock. */
    var r = small.getBoundingClientRect();
    var CW = 20, CH = 28;                                /* the size of one grid box, in pixels */
    var cols = Math.floor(innerWidth / CW), rows = Math.floor(innerHeight / CH);
    var bits = [], landed = 0, started = false;
    later(function () {
      small.style.zIndex = '2147470002';               /* the clock sits on top of the lava while it is taken over */
      for (var k = 0; k < 40; k++) {
        var el = document.createElement('div');
        el.className = 'clock-bit';
        el.textContent = Math.random() < 0.5 ? '0' : '1';
        var side = k % 4, c, w;                          /* start on one of the four edges */
        if (side === 0) { c = Math.floor(Math.random() * cols); w = 0; }
        else if (side === 1) { c = cols - 1; w = Math.floor(Math.random() * rows); }
        else if (side === 2) { c = Math.floor(Math.random() * cols); w = rows - 1; }
        else { c = 0; w = Math.floor(Math.random() * rows); }
        bits.push({ el: el, c: c, r: w, wait: Math.floor(Math.random() * 18), across: Math.random() < 0.5,
                    tc: Math.floor((r.left + Math.random() * (r.width - CW)) / CW),
                    tr: Math.floor((r.top + Math.random() * (r.height - CH / 2)) / CH) });
        el.style.transform = 'translate(' + c * CW + 'px,' + w * CH + 'px)';
        el.style.visibility = 'hidden';
        document.body.appendChild(el);
      }
      var mine = stage;                                  /* one box per screen frame, until they have all landed */
      (function step() {
        if (stage !== mine) return;                      /* closed early: stop */
        bits.forEach(function (b) {
          if (b.done) return;
          if (b.wait > 0) { if (--b.wait === 0) b.el.style.visibility = ''; return; }
          var dc = b.tc - b.c, dr = b.tr - b.r;
          if (!dc && !dr) {                              /* landed on the clock */
            b.done = true; landed++;
            b.el.style.transition = 'opacity .25s'; b.el.style.opacity = '0';
            setTimeout(function () { b.el.remove(); }, 300);
            if (!started) { started = true; takeOver(); }
            if (landed === bits.length) { later(flyToMiddle, 150); }
            return;
          }
          /* one box: across, then up, then across... (straight on once one way is finished) */
          if (dc && (b.across || !dr)) b.c += dc > 0 ? 1 : -1;
          else b.r += dr > 0 ? 1 : -1;
          b.across = !b.across;
          b.el.style.transform = 'translate(' + b.c * CW + 'px,' + b.r * CH + 'px)';
        });
        if (landed < bits.length) requestAnimationFrame(step);
      })();

    }, 250);

    /* ...and as they land, the clock scrambles into code */
    function takeOver() {
      scrambling = true;
      var t = small.querySelector('.t'), d = small.querySelector('.d');
      var iv = setInterval(function () {
        t.textContent = scramble(time(new Date()));
        d.textContent = scramble(date(new Date()));
      }, 60);
      timers.push(iv);
    }

    /* 3. the clock flies to the middle and gets big */
    function flyToMiddle() {
      big = document.createElement('div');
      big.id = 'clockBig';
      big.innerHTML = '<span class="t"></span><span class="d"></span>';
      big.decoding = true;
      big.querySelector('.t').textContent = scramble(time(new Date()));
      big.querySelector('.d').textContent = scramble(date(new Date(), true));
      stage.appendChild(big);
      var b = big.getBoundingClientRect(), s = r.width / b.width;
      var dx = (r.left + r.width / 2) - (b.left + b.width / 2), dy = (r.top + r.height / 2) - (b.top + b.height / 2);
      small.classList.add('taken');
      small.style.zIndex = '';
      big.animate([
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' },
        { transform: 'translate(-50%,-50%)' }
      ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });

      /* the code turns back into the real time, one letter at a time */
      later(function () {
        var steps = 0, iv = setInterval(function () {
          var real = time(new Date()), realD = date(new Date(), true);
          var keep = Math.floor(real.length * steps / 12), keepD = Math.floor(realD.length * steps / 12);
          big.querySelector('.t').textContent = real.slice(0, keep) + scramble(real.slice(keep));
          big.querySelector('.d').textContent = realD.slice(0, keepD) + scramble(realD.slice(keepD));
          if (++steps > 12) { clearInterval(iv); big.decoding = false; busy = false; tick(); }
        }, 55);
        timers.push(iv);
      }, 850);
    }
  }

  /* ---------- click again or Esc: back to normal ---------- */
  function close() {
    if (!stage || busy) return;
    var s = stage;
    stage = null; big = null;
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
    scrambling = false;
    small.classList.remove('taken');
    tick();
    s.classList.remove('on');
    setTimeout(function () { s.remove(); }, 650);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function setup() {
    small = document.createElement('button');
    small.id = 'josClock';
    small.title = 'Click me!';
    small.innerHTML = '<span class="t"></span><span class="d"></span>';
    small.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    document.body.appendChild(small);
    tick();
    setInterval(tick, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
