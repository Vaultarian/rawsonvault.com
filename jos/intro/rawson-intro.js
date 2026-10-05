/* ============================================================
   RAWSON VAULT — the studio intro, for any of Jos's games.

   Put this ONE line in a game's <head> or at the top of <body>:

       <script src="../intro/rawson-intro.js"></script>

   It drops a full-screen layer over the page, plays the orb clip,
   writes RAWSON VAULT, then fades out and deletes itself. The game
   underneath never knows it happened.

   Click anywhere to skip.
   ============================================================ */
(function () {
  'use strict';

  /* Work out where this script lives, so the video is found whether the
     game is on this computer or on rawsonvault.com. */
  var here = (document.currentScript && document.currentScript.src) || '';
  var base = here.slice(0, here.lastIndexOf('/') + 1);

  var LETTER_STEP = 65;    /* ms — gap between each letter rising           */
  var HOLD        = 2500;  /* ms — how long to sit on the finished logo     */
  var BLACK_HOLD  = 350;   /* ms — how long to sit on black before the game */

  function start() {
    var layer = document.createElement('div');
    layer.id = 'rawson-intro';
    layer.innerHTML =
      '<video id="ri-clip" muted playsinline preload="auto" src="' + base + 'intro-logo.mp4"></video>' +
      '<div id="ri-brand"></div>' +
      '<div id="ri-skip">CLICK TO SKIP</div>';

    var css = document.createElement('style');
    css.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap");',
      '#rawson-intro{position:fixed;inset:0;z-index:2147483647;background:#0b2a16;',
      '  opacity:1;transition:opacity 600ms ease;cursor:pointer;overflow:hidden}',
      '#rawson-intro.gone{opacity:0}',
      '#ri-clip{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;',
      '  transition:opacity 500ms ease}',
      '#rawson-intro.blackout #ri-clip{opacity:0}',
      '#rawson-intro.blackout #ri-brand,#rawson-intro.blackout #ri-skip{opacity:0;transition:opacity 500ms ease}',
      '#ri-brand{position:absolute;left:50%;top:80%;transform:translateX(-50%);',
      '  white-space:nowrap;font-family:Cinzel,serif;font-weight:700;',
      '  font-size:clamp(16px,2.4vw,30px);letter-spacing:.34em;color:#f4d9b4}',
      '#ri-brand span{display:inline-block;opacity:0;transform:translateY(14px);',
      '  transition:opacity 400ms ease,transform 500ms cubic-bezier(.2,1.4,.4,1)}',
      '#ri-brand span.up{opacity:1;transform:translateY(0)}',
      '#ri-skip{position:absolute;left:0;right:0;bottom:14px;text-align:center;',
      '  font:13px system-ui,sans-serif;letter-spacing:.14em;color:rgba(255,255,255,.4)}'
    ].join('\n');

    document.head.appendChild(css);
    document.body.appendChild(layer);

    /* RAWSON VAULT, one letter per span, so they can rise one at a time */
    var brand = layer.querySelector('#ri-brand');
    var spans = 'RAWSON VAULT'.split('').map(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      brand.appendChild(s);
      return s;
    });

    var clip = layer.querySelector('#ri-clip');
    var timers = [];
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      /* stage 1: fade the picture and text to black */
      layer.classList.add('blackout');
      setTimeout(function () {
        try { clip.pause(); } catch (e) {}
        /* stage 2: sit on black a moment, then fade into the game */
        layer.classList.add('gone');
        setTimeout(function () {
          if (layer.parentNode) layer.parentNode.removeChild(layer);
          if (css.parentNode) css.parentNode.removeChild(css);
        }, 650);
      }, 500 + BLACK_HOLD);
    }

    /* the clip decides when the logo is actually whole — no guessed timestamp.
       Letters rise only once the video has truly ended, then we hold, then fade. */
    clip.addEventListener('ended', function () {
      spans.forEach(function (s, i) {
        timers.push(setTimeout(function () { s.classList.add('up'); }, i * LETTER_STEP));
      });
      timers.push(setTimeout(finish, spans.length * LETTER_STEP + HOLD));
    });

    /* if the video cannot play at all, do not trap the player behind it */
    clip.addEventListener('error', finish);
    timers.push(setTimeout(finish, 20000));   /* last-resort escape hatch */

    layer.addEventListener('click', finish);

    var p = clip.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked — the timeout still frees the page */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
