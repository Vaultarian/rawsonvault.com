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
    '#clockBig.hidden{display:none}',
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
    '  font:700 .85rem Nunito,sans-serif;letter-spacing:.06em}',

    /* the clock screen controls its own cursor - the home page's own cursor trick (which
       hides the real one everywhere, site-wide, with !important) must not reach in here */
    '#clockStage,#clockStage *{cursor:pointer!important}',
    '#clockStage.hideCursor,#clockStage.hideCursor *{cursor:none!important}',
    '#clockStage.hideCursor #clockBig,#clockStage.hideCursor #clockAnalog{cursor:pointer!important}',

    /* the analog clock */
    '#clockAnalog{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);cursor:pointer;',
    '  display:none;opacity:0;transition:opacity .4s ease}',
    '#clockAnalog.on{display:block;opacity:1}',
    '#clockAnalog svg{width:min(78vmin,480px);height:min(78vmin,480px);display:block}',
    '#clockAnalog .face{fill:rgba(10,6,22,.55);stroke:rgba(255,255,255,.35);stroke-width:3}',
    '#clockAnalog .num{fill:#fff;font-family:Nunito,sans-serif;font-weight:800;',
    '  text-shadow:0 0 10px rgba(0,0,0,.6)}',
    '#clockAnalog .tick{stroke:#fff;stroke-width:5;stroke-linecap:round}',
    '#clockAnalog .hand{stroke-linecap:round;transform-origin:210px 210px}',   /* 210,210 = CX,CY in the JS below */
    '#clockAnalog .hourHand{stroke:#fff;stroke-width:9}',
    '#clockAnalog .minuteHand{stroke:#fff;stroke-width:6}',
    '#clockAnalog .secondHand{stroke:#d9643a;stroke-width:3}',
    '#clockAnalog .hub{fill:#d9643a}',

    /* the beginner/.../expert slider, below the clock face */
    '#clockLevel{position:absolute;left:50%;bottom:4.6rem;transform:translateX(-50%);width:min(70vmin,420px);',
    '  display:none;text-align:center}',
    '#clockAnalog.on ~ #clockLevel,#clockStage.analogOn #clockLevel{display:block}',
    '#clockLevel input{width:100%;accent-color:#d9643a}',
    '#clockLevel .lvRow{display:flex;justify-content:space-between;margin-top:.3rem;',
    '  font:700 .68rem Nunito,sans-serif;color:rgba(255,255,255,.75);letter-spacing:.02em}'
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

  var small, stage = null, big = null, analog = null, mode = 'digital', timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* ---------- clicking the clock screen ----------
     click the clock (digital or analog) -> swap mode, and show the cursor again
     click anywhere else -> hide the cursor (moving the mouse brings it back) */
  function onStageClick(e) {
    if (e.target.closest('#clockLevel')) return;            /* using the slider: do nothing else */
    if (e.target.closest('#clockBig, #clockAnalog')) { toggleMode(); return; }
    stage.classList.add('hideCursor');
  }
  function toggleMode() {
    mode = (mode === 'digital') ? 'analog' : 'digital';
    stage.classList.remove('hideCursor');
    stage.classList.toggle('analogOn', mode === 'analog');
    if (big) big.classList.toggle('hidden', mode === 'analog');
    if (analog) analog.classList.toggle('on', mode === 'analog');
    if (mode === 'analog') updateAnalog(new Date());
  }

  /* ---------- the analog clock ----------
     A slider picks how it's labelled, easiest to hardest:
     Beginner+ (hour/minute/second rings, 3 hands) -> Beginner (hour/minute rings, 2 hands)
     -> Regular (1-12) -> Intermediate (Roman numerals) -> Expert (just 4 lines, no numbers). */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  var CX = 210, CY = 210;
  var LEVELS = [
    { label: 'Beginner+', numbers: 'triple', hourR: 95,  minuteR: 142, secondR: 182, hourLen: 95,  minuteLen: 142, secondLen: 182, hands: 3 },
    { label: 'Beginner',  numbers: 'double', hourR: 100, minuteR: 165, hourLen: 100, minuteLen: 165, hands: 2 },
    { label: 'Regular',   numbers: 'plain',  numR: 155,  hourLen: 95,  minuteLen: 145, hands: 2 },
    { label: 'Intermediate', numbers: 'roman', numR: 155, hourLen: 95, minuteLen: 145, hands: 2 },
    { label: 'Expert',    numbers: 'ticks',  hourLen: 95, minuteLen: 145, hands: 2 }
  ];
  function loadLevel() {
    try {
      var raw = localStorage.getItem('jos-clock-level');
      if (raw === null) return 1;             /* nothing saved yet - Beginner */
      var v = +raw;
      return (v >= 0 && v <= 4) ? v : 1;
    } catch (e) { return 1; }
  }
  function saveLevel(v) { try { localStorage.setItem('jos-clock-level', v); } catch (e) {} }

  function polar(r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function numberRing(group, count, radius, fontSize, labelFn) {
    for (var i = 0; i < count; i++) {
      var p = polar(radius, i * (360 / count));
      var t = svgEl('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': fontSize, 'class': 'num' });
      t.textContent = labelFn(i);
      group.appendChild(t);
    }
  }

  var elFace, elNumbers, elTicks, elHour, elMinute, elSecond;
  function buildAnalog(stageEl) {
    analog = document.createElement('div');
    analog.id = 'clockAnalog';
    var svg = svgEl('svg', { viewBox: '0 0 420 420' });
    elFace = svgEl('circle', { class: 'face', cx: CX, cy: CY, r: 200 });
    elNumbers = svgEl('g', {});
    elTicks = svgEl('g', {});
    elSecond = svgEl('line', { class: 'hand secondHand', x1: CX, y1: CY, x2: CX, y2: CY });
    elMinute = svgEl('line', { class: 'hand minuteHand', x1: CX, y1: CY, x2: CX, y2: CY });
    elHour = svgEl('line', { class: 'hand hourHand', x1: CX, y1: CY, x2: CX, y2: CY });
    var hub = svgEl('circle', { class: 'hub', cx: CX, cy: CY, r: 7 });
    svg.appendChild(elFace); svg.appendChild(elTicks); svg.appendChild(elNumbers);
    svg.appendChild(elHour); svg.appendChild(elMinute); svg.appendChild(elSecond); svg.appendChild(hub);
    analog.appendChild(svg);
    stageEl.appendChild(analog);

    var panel = document.createElement('div');
    panel.id = 'clockLevel';
    var slider = document.createElement('input');
    slider.type = 'range'; slider.min = 0; slider.max = 4; slider.step = 1;
    var row = document.createElement('div');
    row.className = 'lvRow';
    LEVELS.forEach(function (lv) { var s = document.createElement('span'); s.textContent = lv.label; row.appendChild(s); });
    panel.appendChild(slider); panel.appendChild(row);
    stageEl.appendChild(panel);

    slider.value = loadLevel();
    renderLevel(+slider.value);
    slider.addEventListener('input', function () { renderLevel(+slider.value); saveLevel(+slider.value); });
  }

  function renderLevel(i) {
    var lv = LEVELS[i];
    elNumbers.innerHTML = ''; elTicks.innerHTML = '';
    elSecond.style.display = (lv.hands === 3) ? '' : 'none';
    if (lv.numbers === 'triple') {
      numberRing(elNumbers, 12, lv.hourR, 15, function (i) { return i === 0 ? '12' : String(i); });
      numberRing(elNumbers, 60, lv.minuteR, 9, function (i) { return i === 0 ? '60' : String(i); });
      numberRing(elNumbers, 60, lv.secondR, 8, function (i) { return i === 0 ? '60' : String(i); });
    } else if (lv.numbers === 'double') {
      numberRing(elNumbers, 12, lv.hourR, 16, function (i) { return i === 0 ? '12' : String(i); });
      numberRing(elNumbers, 60, lv.minuteR, 9, function (i) { return i === 0 ? '60' : String(i); });
    } else if (lv.numbers === 'plain') {
      numberRing(elNumbers, 12, lv.numR, 20, function (i) { return i === 0 ? '12' : String(i); });
    } else if (lv.numbers === 'roman') {
      numberRing(elNumbers, 12, lv.numR, 17, function (i) { return ROMAN[i]; });
    } else if (lv.numbers === 'ticks') {
      [0, 90, 180, 270].forEach(function (deg) {
        var a = polar(195, deg), b = polar(170, deg);
        elTicks.appendChild(svgEl('line', { class: 'tick', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      });
    }
    setHandLength(elHour, lv.hourLen);
    setHandLength(elMinute, lv.minuteLen);
    if (lv.hands === 3) setHandLength(elSecond, lv.secondLen);
    curLevel = lv;
    updateAnalog(new Date());
  }
  function setHandLength(line, len) { line.setAttribute('y2', CY - len); }
  function rotate(line, deg) { line.style.transform = 'rotate(' + deg + 'deg)'; }

  var curLevel = LEVELS[1];
  function updateAnalog(now) {
    if (!analog) return;
    var h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    rotate(elHour, h * 30 + m * 0.5);
    rotate(elMinute, m * 6 + s * 0.1);
    if (curLevel.hands === 3) rotate(elSecond, s * 6);
  }

  /* ---------- the small clock, ticking ---------- */
  function tick() {
    var now = new Date();
    small.querySelector('.t').textContent = time(now);
    small.querySelector('.d').textContent = date(now);
    if (big && big.ready) {
      roll(big.querySelector('.t'), now);
      big.querySelector('.d .words').textContent = date(now, true);
    }
    if (mode === 'analog') updateAnalog(now);
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
    hint.textContent = 'Click the clock for analog · click anywhere else to hide your cursor · Esc to go back';
    stage.appendChild(lava); stage.appendChild(glow); stage.appendChild(hint);
    document.body.appendChild(stage);
    void stage.offsetWidth;
    stage.classList.add('on');
    stage.addEventListener('click', onStageClick);
    stage.addEventListener('mousemove', function () { stage.classList.remove('hideCursor'); });
    lavaLamp(lava);
    buildAnalog(stage);

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
    stage = null; big = null; analog = null; mode = 'digital';
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
