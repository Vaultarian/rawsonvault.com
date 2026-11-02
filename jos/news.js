/* ============ 📰 JOS'S NEWS ============
   Jos (2 Nov 2026): "in the bottom left is news in big orange letters and behind it is the Mobius
   strip instead of a globe. You know how there is news with a globe behind it; make it the Mobius
   strip." And: "everything I make below it, add a look at it button or a play it button, and it
   will send you to that game or tool, or it will show you what it is if it's not a game and it's
   just a visual."

   Bottom left of the home page: NEWS, with the family's Möbius strip turning round behind it, like
   the globe behind the news on TV. Click it and the news opens: the newest thing Jos made at the top.

   ⭐ CARL: when Jos finishes something (or moves on to something else), write it in
     ~/jos/news-notes.md. At gameover, move everything from there to the TOP of the list below.
     play:    'folder/'        → a ▶ Play it button (a game)
     look:    'folder/'        → a 👀 Look at it button (a tool, or something to look at)
     picture: 'folder/pic.png' → a 👀 Look at it button that shows the picture right here
     show:    'clock'          → a 👀 Look at it button that shows something already on this page */
(function () {
  var NEWS = [
    { emoji:'📖', when:'1 Nov', title:'LDLC beginner bubbles',
      what:'Open a level in LDLC and type beginner. Gold bubbles with arrows show you how everything works.',
      look:'ldlc/levels.html' },
    { emoji:'😈', when:'31 Oct', title:'LDLC: Level Devil Level Creator',
      what:'Make your own Level Devil levels, play them, and send the best ones to Jos.',
      play:'ldlc/' },
    { emoji:'🌳', when:'29 Oct', title:'SEASONALITY!',
      what:'Grow your forest with sun energy, and keep your plants alive.',
      play:'seasonality/preview-start.html' },
    { emoji:'🧱', when:'26 Oct', title:'Marble Run Builder',
      what:'Build your own marble track with springs, portals, one-ways and breakable bricks.',
      play:'marble-run-builder/' },
    { emoji:'⏰', when:'23 Oct', title:'The clock',
      what:'Click the clock in the top left: a lava lamp, typing, and a big rolling clock. It can be analog too.',
      show:'clock' },
    { emoji:'♟️', when:'23 Oct', title:'Checkers jump rules',
      what:'Three ways to play: Regular, Competition and Competition Plus.',
      play:'checkers/' },
    { emoji:'🚢', when:'22 Oct', title:'Battleships',
      what:'Hide your ships and sink the other side’s fleet.',
      play:'battleships/' },
    { emoji:'🐛', when:'22 Oct', title:'Caterpillar',
      what:'Dots and Boxes, Jos-style. Finish a box to claim it, against a friend or the computer.',
      play:'caterpillar/' },
    { emoji:'🛗', when:'9 Oct', title:'Space & Sea Elevator',
      what:'Ride a glass lift from the bottom of the Mariana Trench all the way up to the Moon.',
      look:'space-sea-elevator/' }
  ];

  var css = document.createElement('style');
  css.textContent = [
    /* the NEWS badge: the Möbius strip turning round, NEWS in big orange letters across it */
    '#newsBtn{position:fixed;left:16px;bottom:16px;z-index:480;width:150px;height:150px;padding:0;border:none;',
    '  background:none;cursor:pointer;transition:transform .15s}',
    '#newsBtn:hover{transform:scale(1.07)}',
    '#newsBtn .ring{position:absolute;inset:0;background:url(ldlc/ring-spin.webp) 0 0/7200px 150px no-repeat;',
    '  animation:newsSpin 4.32s steps(48) infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}',
    '@keyframes newsSpin{to{background-position:-7200px 0}}',
    '#newsBtn .word{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:"Fredoka One",cursive;',
    '  font-size:2.7rem;letter-spacing:.04em;color:#d9643a;line-height:1;',
    '  text-shadow:3px 0 #f2ede3,-3px 0 #f2ede3,0 3px #f2ede3,0 -3px #f2ede3,2px 2px #f2ede3,-2px 2px #f2ede3,',
    '  2px -2px #f2ede3,-2px -2px #f2ede3,0 6px 12px rgba(0,0,0,.3)}',
    '#newsBtn .dot{position:absolute;right:14px;top:16px;width:20px;height:20px;border-radius:50%;background:#e23b3b;',
    '  border:3px solid #f2ede3;display:none}',
    '#newsBtn.unseen .dot{display:block}',
    /* the news */
    '#newsPanel{position:fixed;left:16px;bottom:176px;z-index:2000;width:min(390px,calc(100vw - 32px));',
    '  max-height:min(68vh,calc(100vh - 196px));overflow-y:auto;background:#f2ede3;border:3px solid #2a7070;',
    '  border-radius:18px;padding:12px 16px 14px;box-shadow:0 14px 40px rgba(0,0,0,.3);font-family:Nunito,sans-serif}',
    '#newsPanel[hidden]{display:none}',
    '#newsPanel .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}',
    '#newsPanel h2{font-family:"Fredoka One",cursive;font-weight:400;font-size:2rem;color:#d9643a;margin:0}',
    '#newsPanel .x{border:none;background:#3d9595;color:#fff;font-size:1rem;width:32px;height:32px;border-radius:50%;cursor:pointer}',
    '#newsPanel .item{display:flex;gap:10px;padding:10px 0;border-top:2px dashed rgba(61,149,149,.4)}',
    '#newsPanel .emoji{font-size:1.9rem;line-height:1}',
    '#newsPanel .title{font-family:"Fredoka One",cursive;font-size:1.1rem;color:#d9643a;line-height:1.2}',
    '#newsPanel .when{font-weight:800;font-size:.78rem;color:#3d9595;text-transform:uppercase;letter-spacing:.06em}',
    '#newsPanel .what{font-weight:600;font-size:.92rem;color:#2a4545;line-height:1.4;margin:3px 0 7px}',
    '#newsPanel .go{display:inline-block;border:none;cursor:pointer;text-decoration:none;font-family:"Fredoka One",cursive;',
    '  font-size:.95rem;color:#fff;background:#3d9595;border-radius:50px;padding:.35rem 1rem}',
    '#newsPanel .go:hover{background:#2a7070}',
    '#newsPanel .go.play{background:#d9643a}',
    '#newsPanel .go.play:hover{background:#b94f29}',
    '#newsPanel .pic{display:block;margin:6px auto 8px;max-width:100%;max-height:200px}',
    '#newsPanel .strip{width:200px;height:200px;margin:6px auto 8px;background-size:9600px 200px;',
    '  background-repeat:no-repeat;animation:newsSpinBig 4.32s steps(48) infinite}',
    '@keyframes newsSpinBig{to{background-position:-9600px 0}}',
    /* "Look at it" on the clock: it glows so you can find it */
    '@keyframes newsGlow{0%,100%{box-shadow:0 0 0 0 rgba(217,100,58,0)}50%{box-shadow:0 0 0 10px rgba(217,100,58,.55)}}',
    '.newsGlow{animation:newsGlow .7s ease-in-out 4}',
    '@media (max-width:600px){#newsBtn{width:100px;height:100px}',
    '  #newsBtn .ring{background-size:4800px 100px;animation-name:newsSpinSmall}',
    '  #newsBtn .word{font-size:1.8rem}#newsBtn .dot{right:8px;top:8px;width:16px;height:16px}',
    '  #newsPanel{bottom:124px;max-height:calc(100vh - 140px)}}',
    '@keyframes newsSpinSmall{to{background-position:-4800px 0}}',
    '@media (prefers-reduced-motion:reduce){#newsBtn .ring,#newsPanel .strip{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.id = 'newsBtn';
  btn.title = 'News';
  btn.innerHTML = '<span class="ring"></span><span class="word">NEWS</span><span class="dot"></span>';
  var panel = document.createElement('div');
  panel.id = 'newsPanel';
  panel.hidden = true;
  document.body.appendChild(btn);
  document.body.appendChild(panel);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function top(label, back) {
    var t = el('div', 'top');
    t.appendChild(el('h2', '', label));
    var x = el('button', 'x', back ? '←' : '✕');
    x.title = back ? 'Back to the news' : 'Close';
    x.onclick = back ? showList : close;
    t.appendChild(x);
    return t;
  }

  function showList() {
    panel.innerHTML = '';
    panel.appendChild(top('NEWS'));
    NEWS.forEach(function (n) {
      var item = el('div', 'item');
      item.appendChild(el('div', 'emoji', n.emoji));
      var words = el('div');
      words.appendChild(el('div', 'when', n.when));
      words.appendChild(el('div', 'title', n.title));
      words.appendChild(el('div', 'what', n.what));
      var go;
      if (n.play || n.look) {
        go = el('a', 'go' + (n.play ? ' play' : ''), n.play ? '▶ Play it' : '👀 Look at it');
        go.href = n.play || n.look;
      } else {
        go = el('button', 'go', '👀 Look at it');
        go.onclick = function () { lookAt(n); };
      }
      words.appendChild(go);
      item.appendChild(words);
      panel.appendChild(item);
    });
  }

  // things that aren't a game: show them right here
  function lookAt(n) {
    if (n.show === 'clock') {
      close();
      var c = document.getElementById('josClock');
      if (c) { c.classList.remove('newsGlow'); void c.offsetWidth; c.classList.add('newsGlow'); }
      return;
    }
    panel.innerHTML = '';
    panel.appendChild(top(n.title, true));
    if (n.strip) {                // a picture that's lots of pictures in a row: play it
      var s = el('div', 'strip');
      s.style.backgroundImage = 'url(' + n.picture + ')';
      panel.appendChild(s);
    } else {
      var img = el('img', 'pic');
      img.src = n.picture;
      img.alt = n.title;
      panel.appendChild(img);
    }
    panel.appendChild(el('div', 'what', n.what));
  }

  // a red dot until you've looked at the newest news
  var SEEN = 'jos-news-seen';
  function newest() { return NEWS[0].when + ' ' + NEWS[0].title; }
  function seen() { try { return localStorage.getItem(SEEN) === newest(); } catch (e) { return true; } }
  if (!seen()) btn.classList.add('unseen');

  function open() {
    showList();
    panel.hidden = false;
    btn.classList.remove('unseen');
    try { localStorage.setItem(SEEN, newest()); } catch (e) {}
  }
  function close() { panel.hidden = true; }

  btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('mousedown', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
})();
