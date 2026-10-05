/* Whirl! Copied from Jos's Scratch project: "change whirl effect by 10" fifty
   times, then "change whirl effect by -10" fifty times.
   Click a game or tool on the home page: the screen whirls up, the new page
   loads, then it de-whirls back into place.
   How: take a picture of the page (html2canvas), then twist the picture with
   the same maths Scratch uses for its whirl effect (a WebGL shader). */
(function () {
  var KEY = 'jos-swirl';
  var MAX_WHIRL = 500;      /* 50 steps x 10, like the Scratch project */
  var MS = 1100;            /* how long each half takes */
  var CALM = '#0b2a16';     /* the soft dark green both halves fade through (same as the Rawson intro) */

  var me = document.currentScript;
  var base = me.src.replace(/swirl\.js.*$/, '');
  var root = document.documentElement;
  var real = {
    st: window.setTimeout, si: window.setInterval, ct: window.clearTimeout,
    ci: window.clearInterval, raf: window.requestAnimationFrame, caf: window.cancelAnimationFrame
  };

  var css = document.createElement('style');
  css.textContent =
    'html.jos-frozen *,html.jos-frozen *::before,html.jos-frozen *::after{animation-play-state:paused!important}' +
    'html.jos-whirl-in{background:' + CALM + '}html.jos-whirl-in body{visibility:hidden}' +
    '#jos-whirl{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;background:' + CALM + '}';
  document.head.appendChild(css);

  /* load the picture-taker */
  var libReady = new Promise(function (ok, fail) {
    if (window.html2canvas) return ok();
    var s = document.createElement('script');
    s.src = base + 'vendor/html2canvas.min.js';
    s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });

  function snapshot() {
    return libReady.then(function () {
      return html2canvas(document.body, {
        x: window.scrollX, y: window.scrollY,
        width: window.innerWidth, height: window.innerHeight,
        windowWidth: window.innerWidth, windowHeight: window.innerHeight,
        scale: 1, logging: false, useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#000',
        onclone: function (doc) {
          doc.documentElement.classList.remove('jos-whirl-in');
          /* freeze fade-ins in the copy, or the picture comes out see-through */
          var st = doc.createElement('style');
          st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
          doc.head.appendChild(st);
        }
      });
    });
  }

  /* Scratch's whirl: twist each point round the middle, more near the centre */
  var FRAG =
    'precision mediump float;uniform sampler2D u_img;uniform float u_whirl;uniform float u_fade;uniform vec2 u_size;varying vec2 v_uv;' +
    'void main(){vec2 p=(v_uv-0.5)*u_size;float r=0.5*length(u_size);' +
    'float f=max(1.0-length(p)/r,0.0);float a=u_whirl*f*f;float s=sin(a),c=cos(a);' +
    'vec2 q=mat2(c,-s,s,c)*p/u_size+0.5;' +
    'gl_FragColor=vec4(mix(texture2D(u_img,q).rgb,vec3(0.043,0.165,0.086),u_fade),1.0);}';
  var VERT =
    'attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=vec2(a_pos.x*0.5+0.5,0.5-a_pos.y*0.5);gl_Position=vec4(a_pos,0,1);}';

  function makeWhirler(picture) {
    var cv = document.createElement('canvas');
    cv.id = 'jos-whirl';
    cv.width = picture.width; cv.height = picture.height;
    var gl = cv.getContext('webgl');
    function sh(type, src) { var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_size'), cv.width, cv.height);
    var uWhirl = gl.getUniformLocation(prog, 'u_whirl');
    var uFade = gl.getUniformLocation(prog, 'u_fade');
    gl.viewport(0, 0, cv.width, cv.height);
    function draw(amount, fade) {   /* amount in Scratch units: 0 = still, 500 = full whirl.
                                       fade: 0 = the page, 1 = all calm green */
      gl.uniform1f(uWhirl, amount * Math.PI / 180);
      gl.uniform1f(uFade, fade || 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return { canvas: cv, draw: draw };
  }

  function smooth(a, b, k) { var x = Math.min(1, Math.max(0, (k - a) / (b - a))); return x * x * (3 - 2 * x); }

  function animate(w, from, to, done) {
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / MS);
      var e = 0.5 - 0.5 * Math.cos(Math.PI * k);          /* gentle start, gentle stop */
      var fade = to > from ? smooth(0.3, 1, k)              /* whirling up: sink into green */
                           : 1 - smooth(0, 0.7, k);         /* de-whirling: rise out of green */
      w.draw(from + (to - from) * e, fade);
      if (k < 1) real.raf.call(window, step); else if (done) done();
    })(t0);
  }

  /* ---- the freeze: while the page de-whirls, nothing on it starts ----
     Timers, animation frames, videos, sounds and CSS animations all wait,
     then everything starts the moment the whirl stops. */
  var frozen = false, held = [], nextId = 1e9, realIds = {}, pausedMedia = [];
  function fromPictureTaker() { return ((new Error()).stack || '').indexOf('html2canvas') !== -1; }
  function holdOr(kind, realFn) {
    return function (fn, delay) {
      if (!frozen || fromPictureTaker()) return realFn.apply(window, arguments);
      var id = nextId++;
      held.push({ id: id, kind: kind, args: [].slice.call(arguments) });
      return id;
    };
  }
  function clearOr(realFn) {
    return function (id) {
      if (id >= 1e9) {
        held = held.filter(function (h) { return h.id !== id; });
        if (realIds[id]) realFn.call(window, realIds[id]);
      } else realFn.call(window, id);
    };
  }
  function freeze() {
    frozen = true;
    root.classList.add('jos-frozen');
    window.setTimeout = holdOr('t', real.st);
    window.setInterval = holdOr('i', real.si);
    window.requestAnimationFrame = holdOr('r', real.raf);
    window.clearTimeout = clearOr(real.ct);
    window.clearInterval = clearOr(real.ci);
    window.cancelAnimationFrame = clearOr(real.caf);
    document.addEventListener('play', function (e) {
      if (!frozen) return;
      e.target.pause();
      pausedMedia.push(e.target);
    }, true);
    real.st.call(window, unfreeze, 6000);   /* never leave the page stuck */
  }
  function unfreeze() {
    if (!frozen) return;
    frozen = false;
    root.classList.remove('jos-frozen');
    var list = held; held = [];
    list.forEach(function (h) {
      var fn = h.kind === 't' ? real.st : h.kind === 'i' ? real.si : real.raf;
      realIds[h.id] = fn.apply(window, h.args);
    });
    pausedMedia.forEach(function (m) { var p = m.play(); if (p && p.catch) p.catch(function () {}); });
  }

  /* ---- de-whirl: we just arrived from a whirl-up ---- */
  var arriving = false;
  try { arriving = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arriving) {
    root.classList.add('jos-whirl-in');
    freeze();
    var revealed = false;
    var reveal = function () { if (!revealed) { revealed = true; root.classList.remove('jos-whirl-in'); } };
    real.st.call(window, reveal, 4000);   /* never leave the page hidden */
    var go = function () {
      snapshot().then(function (pic) {
        var w = makeWhirler(pic);
        w.draw(MAX_WHIRL, 1);
        root.appendChild(w.canvas);   /* on <html>, not <body>: a transform on body would pin it to the page */
        reveal();
        animate(w, MAX_WHIRL, 0, function () { w.canvas.remove(); unfreeze(); });
      }).catch(function () { reveal(); unfreeze(); });
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }

  /* ---- whirl-up: only on pages that ask for it (the home page) ---- */
  if (!me.hasAttribute('data-swirl-links')) return;

  var busy = false;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || busy || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^[a-z]+:/i.test(href) || a.target === '_blank') return;
    e.preventDefault();
    busy = true;
    var url = a.href;
    var leave = function () {
      try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
      location.href = url;
    };
    snapshot().then(function (pic) {
      var w = makeWhirler(pic);
      w.draw(0);
      root.appendChild(w.canvas);   /* on <html>, not <body>: a transform on body would pin it to the page */
      animate(w, 0, MAX_WHIRL, leave);
    }).catch(function () { location.href = url; });
  });

  /* pressing Back brings the home page back un-whirled */
  window.addEventListener('pageshow', function () {
    busy = false;
    var old = document.getElementById('jos-whirl');
    if (old) old.remove();
  });
})();
