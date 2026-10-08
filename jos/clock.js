/* ============ ⏰ JOS'S CLOCK ============
   Top left of the home page: the time and the date.

   Click it and:
   1. the screen turns into a lava lamp (gooey bubbles floating up and down)
   2. a blinking typing bar appears in the middle, types the time, goes to the next
      line (no Enter button) and types the date
   3. the big clock shows hours and minutes only, and when a number changes it rolls,
      like Jos's stopwatch
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
    'body.sm-open #josClock,body.set-open #josClock{display:none}',
    '@media (max-width:600px){#josClock{top:.6rem;left:.6rem;padding:.35rem .7rem}#josClock .t{font-size:1rem}}',

    /* the lava lamp stage */
    '#clockStage{position:fixed;inset:0;z-index:2147470000;opacity:0;transition:opacity .6s ease;cursor:pointer;overflow:hidden}',
    '#clockStage.on{opacity:1}',
    /* the gooey trick: blurry blobs + a very high contrast = blobs that melt into each other like lava */
    '#clockStage .lava{position:absolute;inset:-10%;background:#1d0730;filter:contrast(16)}',
    '#clockStage .blob{position:absolute;left:0;top:0;border-radius:50%;background:#ff4a2a;filter:blur(22px);will-change:transform}',
    /* the pool of lava that always sits at the bottom, gently breathing */
    '#clockStage .pool{position:absolute;border-radius:50%;background:#ff4a2a;filter:blur(22px);animation:poolBreathe 5s ease-in-out infinite alternate}',
    '@keyframes poolBreathe{from{transform:scaleY(1)}to{transform:scaleY(1.18)}}',
    '#clockStage .glow{position:absolute;inset:0;pointer-events:none;',
    '  background:radial-gradient(ellipse at 50% 120%,rgba(255,140,60,.35),transparent 60%),',
    '  radial-gradient(ellipse at 50% -20%,rgba(160,60,255,.35),transparent 60%)}',

    /* the 1s and 0s */
    /* the typing bar: blinks while waiting, stays solid while typing */
    '#clockBig .caret{display:inline-block;width:.07em;height:.85em;margin-left:.05em;vertical-align:-.04em;background:#fff;',
    '  box-shadow:0 0 14px rgba(255,170,90,.9);animation:caretBlink 1s steps(1) infinite}',
    '#clockBig .caret.typing{animation:none}',
    '@keyframes caretBlink{50%{opacity:0}}',
    '#clockBig .typed{text-align:left;margin-left:auto;margin-right:auto}',

    /* the big clock */
    '#clockBig{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;',
    '  font-family:"Fredoka One",cursive;text-shadow:0 0 30px rgba(255,170,90,.8),0 6px 0 rgba(0,0,0,.25);',
    '  transform-origin:50% 50%;white-space:nowrap}',
    '#clockBig .t{display:block;font-size:clamp(4rem,15vw,11rem);line-height:1;letter-spacing:.03em}',
    /* the roll (from Jos's stopwatch): the old number slides up and fades out while the
       new one rises from below and fades in. Only the group that changed moves. */
    '#clockBig .grp{display:inline-block;position:relative;white-space:pre}',   /* pre: keeps a space on its own from vanishing */
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

  var small, stage = null, big = null, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* ---------- the small clock, ticking ---------- */
  function tick() {
    var now = new Date();
    small.querySelector('.t').textContent = time(now);
    small.querySelector('.d').textContent = date(now);
    if (big && big.ready) {
      roll(big.querySelector('.t'), now);
      big.querySelector('.d .words').textContent = date(now, true);
    }
  }

  /* ---------- click: lava lamp, then the time is typed out ---------- */
  function open() {
    if (stage) return;

    /* 1. the lava lamp */
    stage = document.createElement('div');
    stage.id = 'clockStage';
    var lava = document.createElement('div');
    lava.className = 'lava';
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
    lavaLamp(lava);

    /* 2. a typing bar in the middle types the time, goes to the next line, types the date */
    big = document.createElement('div');
    big.id = 'clockBig';
    big.innerHTML = '<span class="t typed"></span><span class="d typed"><span class="words"></span></span>';
    stage.appendChild(big);
    var t = big.querySelector('.t'), d = big.querySelector('.d'), words = d.querySelector('.words');
    var caret = document.createElement('span');
    caret.className = 'caret';

    /* each line gets the width of its finished words, so the typing starts at the left of where
       the words will end up and they finish in the middle */
    var timeText = time(new Date()), dateText = date(new Date(), true);
    t.textContent = timeText; d.firstChild.textContent = dateText;
    t.style.width = (t.getBoundingClientRect().width + 20) + 'px';
    d.style.width = (d.getBoundingClientRect().width + 12) + 'px';
    t.textContent = ''; words.textContent = '';
    t.appendChild(caret);                                /* the bar waits, blinking */

    function typeOut(into, text, gap, then) {
      var i = 0;
      caret.classList.add('typing');
      (function next() {
        if (big === null) return;                        /* closed early */
        into.textContent = text.slice(0, ++i);
        into.parentNode.appendChild(caret);              /* the bar sits right after the last letter */
        if (i < text.length) later(next, gap * (0.6 + Math.random() * 0.8));   /* a little uneven, like real typing */
        else { caret.classList.remove('typing'); later(then, 450); }
      })();
    }
    later(function () {
      var tt = document.createElement('span');          /* the time is typed into its own span, then the bar follows it */
      t.textContent = ''; t.appendChild(tt); t.appendChild(caret);
      typeOut(tt, timeText, 150, function () {
        d.appendChild(caret);                            /* "enter": the bar jumps to the next line */
        later(function () {
          typeOut(words, dateText, 70, function () {
            /* finished: the clock keeps time from now on (and rolls when the minute changes) */
            t.style.width = ''; d.style.width = '';
            t.classList.remove('typed'); d.classList.remove('typed');
            big.ready = true;
            tick();
          });
        }, 350);
      });
    }, 1300);                                            /* the lava fades in, the bar blinks a couple of times */
  }

  /* ---------- 🌋 a real lava lamp ----------
     Each blob has a temperature. In the pool at the bottom it slowly heats up; when it is
     hot enough it stretches off the pool and rises. At the top it cools, rests a moment,
     then sinks back down and melts into the pool again. Blobs that touch melt together
     (that is the blur + high-contrast trick in the CSS). */
  function lavaLamp(lava) {
    var mine = stage;
    var box = lava.getBoundingClientRect();
    var top = -box.top, bottom = top + innerHeight;      /* the part of the lava you can see */
    var W = box.width;

    var pool = document.createElement('div');
    pool.className = 'pool';
    pool.style.width = (W * 0.9) + 'px'; pool.style.height = '170px';
    pool.style.left = (W * 0.05) + 'px'; pool.style.top = (bottom - 75) + 'px';
    lava.appendChild(pool);

    var blobs = [];
    for (var i = 0; i < 8; i++) {
      var r = 40 + Math.random() * 50;
      var el = document.createElement('div');
      el.className = 'blob';
      el.style.width = el.style.height = (2 * r) + 'px';
      lava.appendChild(el);
      var b = { el: el, r: r, x: W * (0.12 + Math.random() * 0.76), y: bottom - r * 0.5, vy: 0,
                phase: Math.random() * 6.3, speed: 1.1 + Math.random() * 1.1,
                state: 'heating', wait: 30 + Math.random() * 420 };   /* frames until hot enough */
      if (i < 2) { b.state = 'rising'; b.y = bottom - innerHeight * (0.3 + 0.3 * i); }   /* two already on the way up */
      blobs.push(b);
    }

    var frame = 0;
    (function step() {
      if (stage !== mine) return;                        /* closed: stop */
      frame++;
      blobs.forEach(function (b) {
        var rest = bottom - b.r * 0.5, ceiling = top + b.r * 0.7, want = 0;
        if (b.state === 'heating') {                     /* sitting in the pool, warming up */
          b.y = rest;
          if (--b.wait <= 0) b.state = 'rising';
        } else if (b.state === 'rising') {               /* hot: floats up */
          want = -b.speed;
          if (b.y <= ceiling) { b.y = ceiling; b.vy = 0; b.state = 'cooling'; b.wait = 60 + Math.random() * 150; }
        } else if (b.state === 'cooling') {              /* at the top, cooling down */
          if (--b.wait <= 0) b.state = 'sinking';
        } else if (b.state === 'sinking') {              /* cold: sinks back to the pool */
          want = b.speed * 0.8;
          if (b.y >= rest) { b.y = rest; b.vy = 0; b.state = 'heating'; b.wait = 150 + Math.random() * 450; }
        }
        b.vy += (want - b.vy) * 0.025;                   /* lava is heavy: it speeds up and slows down gently */
        b.y += b.vy;
        b.x += Math.sin(frame * 0.012 + b.phase) * 0.25; /* a little sideways wander */
        /* stretch tall when moving fast, squash when resting */
        var stretch = Math.min(0.4, Math.abs(b.vy) * 0.18);
        var sy = b.state === 'heating' ? 0.8 : 1 + stretch, sx = 1 / sy;
        b.el.style.transform = 'translate(' + (b.x - b.r) + 'px,' + (b.y - b.r) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
      });
      requestAnimationFrame(step);
    })();
  }

  /* ---------- click again or Esc: back to normal ---------- */
  function close() {
    if (!stage) return;
    var s = stage;
    stage = null; big = null;
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
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
