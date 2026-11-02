/* ============ 📰 JOS'S NEWS ============
   Jos (2 Nov 2026): "in the bottom left is news in big orange letters and behind it is the Mobius
   strip instead of a globe. You know how there is news with a globe behind it; make it the Mobius
   strip." And: "everything I make below it, add a look at it button or a play it button, and it
   will send you to that game or tool, or it will show you what it is if it's not a game and it's
   just a visual."
   Then: "make it so it covers the whole screen when they click news and there's a bit more detail
   to it… in the bottom right corner… is a news person holding the register of all the new news
   with news on the front page and news on the back and a little speech bubble is coming out of
   him and it tells you the news."

   Then: "the newsman is saying the whole thing… he should be saying this, not his own little
   detail. Make that small bubble fill all of those" — and "I can't see my cursor".

   Bottom left of the home page: NEWS, with the family's Möbius strip turning round behind it, like
   the globe behind the news on TV. Click it and the home page goes grey, and ALL the news comes
   out of the newsman's mouth in one big speech bubble, newest first. He stands in the bottom right
   corner holding his newspaper (NEWS on the front, NEWS on the back). Point at a story and he
   flips his paper and talks. Click the grey edges, the ✕, or press Esc to go back.

   ⭐ CARL: when Jos finishes something (or moves on to something else), write it in
     ~/jos/news-notes.md. At gameover, move everything from there to the TOP of the list below.
     play:    'folder/'        → a ▶ Play it button (a game)
     look:    'folder/'        → a 👀 Look at it button (a tool, or something to look at)
     picture: 'folder/pic.png' → a 👀 Look at it button that shows the picture right here
     show:    'clock'          → a 👀 Look at it button that shows something already on this page
     what = the headline (in bold), more = the detail underneath */
(function () {
  var NEWS = [
    { emoji:'📰', when:'2 Nov', title:'NEWS!',
      what:'This! Click NEWS and the newsman tells you every new thing, in one big speech bubble.',
      more:'The home page goes grey and all the news comes out of the newsman’s mouth in a giant speech ' +
           'bubble. The Möbius strip turns behind the big orange letters, like a TV news globe. He stands in ' +
           'the corner holding his newspaper (NEWS on the front and NEWS on the back). Point at a story and ' +
           'he flips it over and talks, with 10 different mouth shapes. Click the grey edges to go back.',
      picture:'ldlc/ring-spin.webp', strip:48 },
    { emoji:'📖', when:'1 Nov', title:'LDLC beginner bubbles',
      what:'Open a level in LDLC and type beginner. Gold bubbles with arrows show you how everything works.',
      more:'Made with a friend. The bubbles change with what you are doing: pick Trigger to block and they ' +
           'show steps 1, 2 and 3, with the step you are on lit up. The Hero says "You start here" and the ' +
           'Door says "Get here to win!". Clicks go straight through, so you can keep building. Type beginner ' +
           'again to hide them.',
      look:'ldlc/levels.html' },
    { emoji:'😈', when:'31 Oct', title:'LDLC: Level Devil Level Creator',
      what:'Make your own Level Devil levels, play them, and send the best ones to Jos.',
      more:'14 blocks, all drawn from Jos’s own pictures: spikes, sawblades, springs, portals, dash orbs, ' +
           'triggers, buttons and more. Press TEST and the devil’s mouth closes over your level. My levels ' +
           'keeps every level you make, and PLAY mixes them all up. Beat your level and you can send it to Jos.',
      play:'ldlc/' },
    { emoji:'🌳', when:'29 Oct', title:'SEASONALITY!',
      what:'Grow your forest with sun energy, and keep your plants alive.',
      more:'You start with 70 seeds and a tutorial that shows you everything. Plant a willow, then saplings ' +
           'beside it. Sun energy runs along the roots to your trees, and clicking a tree gives you more. ' +
           'Drag along the forest to find new places to plant. It saves itself when you pause.',
      play:'seasonality/preview-start.html' },
    { emoji:'🧱', when:'26 Oct', title:'Marble Run Builder',
      what:'Build your own marble track with springs, portals, one-ways and breakable bricks.',
      more:'12 bricks and real gravity. Portals come in numbered pairs, breakable bricks shatter into ' +
           'pieces, and the spring is Jos’s own design. Save your tracks and show them off in the gallery. ' +
           'The old Marble Run is now called Marble Races.',
      play:'marble-run-builder/' },
    { emoji:'⏰', when:'23 Oct', title:'The clock',
      what:'Click the clock in the top left: a lava lamp, typing, and a big rolling clock. It can be analog too.',
      more:'The screen turns into a lava lamp, the time types itself out, and the big clock rolls its numbers ' +
           'like a stopwatch. There is an analog clock too, and it remembers which one you like. Click again, ' +
           'or press Esc, to go back.',
      show:'clock' },
    { emoji:'♟️', when:'23 Oct', title:'Checkers jump rules',
      what:'Three ways to play: Regular, Competition and Competition Plus.',
      more:'Jos and Dad checked the real competition rules. Regular: jumping is your choice. Competition: ' +
           'if you can jump, you must. Competition Plus: you must take the biggest jump, like in ' +
           'international games.',
      play:'checkers/' },
    { emoji:'🚢', when:'22 Oct', title:'Battleships',
      what:'Hide your ships and sink the other side’s fleet.',
      more:'Place your own fleet by hand: click to put each ship down, 🔄 to turn it, or 🔀 to fill it ' +
           'randomly. Then take turns firing and find their ships before they find yours.',
      play:'battleships/' },
    { emoji:'🐛', when:'22 Oct', title:'Caterpillar',
      what:'Dots and Boxes, Jos-style. Finish a box to claim it, against a friend or the computer.',
      more:'5 by 5 boxes. Draw a line on your turn. Finish the fourth side of a box and it is yours, and ' +
           'you go again. Play a friend, or the computer on Easy or Hard.',
      play:'caterpillar/' },
    { emoji:'🛗', when:'9 Oct', title:'Space & Sea Elevator',
      what:'Ride a glass lift from the bottom of the Mariana Trench all the way up to the Moon.',
      more:'A stickman in a glass lift on two cables, from 10,935 metres down to the Moon, 384,400 km up. ' +
           '11 zones with real things in them: planes, Everest, the ISS, dolphins, giant squid and the ' +
           'Titanic. The 🔍 button zooms out so you can see the whole shaft.',
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
    '.newsWord{font-family:"Fredoka One",cursive;letter-spacing:.04em;color:#d9643a;line-height:1;',
    '  text-shadow:3px 0 #f2ede3,-3px 0 #f2ede3,0 3px #f2ede3,0 -3px #f2ede3,2px 2px #f2ede3,-2px 2px #f2ede3,',
    '  2px -2px #f2ede3,-2px -2px #f2ede3,0 6px 12px rgba(0,0,0,.3)}',
    '#newsBtn .newsWord{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:2.7rem}',
    '#newsBtn .dot{position:absolute;right:14px;top:16px;width:20px;height:20px;border-radius:50%;background:#e23b3b;',
    '  border:3px solid #f2ede3;display:none}',
    '#newsBtn.unseen .dot{display:block}',

    /* the news: the home page goes grey, and the news is one big speech bubble from the newsman */
    '#newsPage{position:fixed;inset:0;z-index:1000500;font-family:Nunito,sans-serif;background:rgba(35,50,50,.45);',
    '  -webkit-backdrop-filter:grayscale(1) brightness(.85);backdrop-filter:grayscale(1) brightness(.85)}',
    '#newsPage[hidden]{display:none}',
    /* the home page draws its own black cursor at layer 1000000 - lift it above the news */
    'html.newsOpen #cursorFire{z-index:2147483100!important}',
    '#newsPage .x{position:fixed;top:16px;right:18px;z-index:3;border:none;background:#3d9595;color:#fff;font-size:1.4rem;',
    '  width:48px;height:48px;border-radius:50%;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25)}',
    '#newsPage .x:hover{background:#2a7070}',
    '#newsPage .bubble{position:absolute;left:28px;top:28px;right:270px;bottom:28px;background:#f8f4ec;',
    '  border:4px solid #2a7070;border-radius:34px;box-shadow:0 14px 40px rgba(0,0,0,.35)}',
    '#newsPage .scroll{position:absolute;inset:0;overflow-y:auto;border-radius:30px;',
    '  background-image:radial-gradient(rgba(61,149,149,.12) 1.5px,transparent 1.5px);background-size:22px 22px}',
    '#newsPage .tail{position:absolute;overflow:visible}',
    '#newsPage .tail.side{right:-96px;bottom:170px;width:100px;height:70px}',
    '#newsPage .tail.down{display:none}',
    '#newsPage .wrap{max-width:1300px;margin:0 auto;padding:6px 26px 30px}',
    '#newsPage .head{position:relative;height:210px;display:flex;align-items:center;justify-content:center}',
    '#newsPage .head .ring{position:absolute;left:50%;top:50%;width:200px;height:200px;margin:-100px 0 0 -100px;',
    '  background:url(ldlc/ring-spin.webp) 0 0/9600px 200px no-repeat;animation:newsSpinBig 4.32s steps(48) infinite}',
    '@keyframes newsSpinBig{to{background-position:-9600px 0}}',
    '#newsPage .head .newsWord{position:relative;font-size:clamp(3.5rem,11vw,6rem)}',
    '#newsPage .sub{text-align:center;font-weight:800;color:#3d9595;font-size:1.05rem;margin:-6px 0 22px}',
    '#newsPage .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}',
    '#newsPage .card{background:#fbf8f1;border:3px solid #2a7070;border-radius:18px;padding:16px 18px 18px;',
    '  box-shadow:0 6px 0 rgba(42,112,112,.25);display:flex;flex-direction:column;transition:transform .15s}',
    '#newsPage .card:hover{transform:translateY(-3px)}',
    '#newsPage .card.first{border-color:#d9643a;box-shadow:0 6px 0 rgba(217,100,58,.35)}',
    '#newsPage .row{display:flex;align-items:center;gap:10px;margin-bottom:6px}',
    '#newsPage .emoji{font-size:2.4rem;line-height:1}',
    '#newsPage .when{font-weight:900;font-size:.8rem;color:#fff;background:#3d9595;border-radius:50px;padding:.15rem .6rem;',
    '  text-transform:uppercase;letter-spacing:.06em}',
    '#newsPage .card.first .when{background:#d9643a}',
    '#newsPage .title{font-family:"Fredoka One",cursive;font-size:1.4rem;color:#d9643a;line-height:1.2;margin:2px 0 6px}',
    '#newsPage .what{font-weight:800;font-size:1rem;color:#2a4545;line-height:1.45;margin:0 0 8px}',
    '#newsPage .more{font-weight:600;font-size:.95rem;color:#4b6464;line-height:1.5;margin:0 0 14px;flex:1}',
    '#newsPage .go{align-self:flex-start;border:none;cursor:pointer;text-decoration:none;font-family:"Fredoka One",cursive;',
    '  font-size:1.05rem;color:#fff;background:#3d9595;border-radius:50px;padding:.45rem 1.2rem}',
    '#newsPage .go:hover{background:#2a7070}',
    '#newsPage .go.play{background:#d9643a}',
    '#newsPage .go.play:hover{background:#b94f29}',
    '#newsPage .look{max-width:700px;margin:0 auto;text-align:center}',
    '#newsPage .look .pic{display:block;margin:10px auto 16px;max-width:100%;max-height:50vh}',
    '#newsPage .look .strip{width:280px;height:280px;margin:10px auto 16px;background-size:13440px 280px;',
    '  background-repeat:no-repeat;animation:newsSpinHuge 4.32s steps(48) infinite}',
    '@keyframes newsSpinHuge{to{background-position:-13440px 0}}',
    '#newsPage .back{margin-top:6px}',

    /* the newsman, bottom right, with his newspaper. The big bubble is what he is saying. */
    '#newsman{position:fixed;right:18px;bottom:0;z-index:2;width:230px;cursor:pointer}',
    '#newsman svg{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.2))}',
    '#newsman .paper{transform-box:fill-box;transform-origin:50% 50%}',
    '#newsman .paper.flip{animation:newsFlip .6s ease-in-out}',
    '@keyframes newsFlip{50%{transform:scaleX(0)}}',
    '#newsman .m{display:none}#newsman .m.on{display:inline}',

    /* "Look at it" on the clock: it glows so you can find it */
    '@keyframes newsGlow{0%,100%{box-shadow:0 0 0 0 rgba(217,100,58,0)}50%{box-shadow:0 0 0 10px rgba(217,100,58,.55)}}',
    '.newsGlow{animation:newsGlow .7s ease-in-out 4}',

    '@media (max-width:700px){#newsBtn{width:100px;height:100px}',
    '  #newsBtn .ring{background-size:4800px 100px;animation-name:newsSpinSmall}',
    '  #newsBtn .newsWord{font-size:1.8rem}#newsBtn .dot{right:8px;top:8px;width:16px;height:16px}',
    '  #newsman{width:130px;right:6px}',
    /* on a phone the bubble sits above him and its tail points down to his mouth */
    '  #newsPage .bubble{left:10px;top:10px;right:10px;bottom:200px;border-radius:26px}#newsPage .scroll{border-radius:22px}',
    '  #newsPage .tail.side{display:none}#newsPage .tail.down{display:block;right:70px;bottom:-76px;width:70px;height:80px}',
    '  #newsPage .x{top:18px;right:18px;width:42px;height:42px;font-size:1.2rem}',
    '  #newsPage .wrap{padding:6px 14px 24px}#newsPage .head{height:150px}',
    '  #newsPage .head .ring{width:140px;height:140px;margin:-70px 0 0 -70px;background-size:6720px 140px;',
    '    animation-name:newsSpinMid}}',
    '@keyframes newsSpinSmall{to{background-position:-4800px 0}}',
    '@keyframes newsSpinMid{to{background-position:-6720px 0}}',
    '@media (prefers-reduced-motion:reduce){#newsBtn .ring,#newsPage .ring,#newsPage .strip{animation:none}',
    '  #newsman .paper.flip{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* the newsman, drawn in the site's colours. The newspaper has NEWS on the front and NEWS on the
     back, and it flips over every time he tells you a new story. */
  var MAN =
    '<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">' +
    // legs and shoes
    '<rect x="78" y="228" width="26" height="62" rx="8" fill="#2a4545"/><rect x="116" y="228" width="26" height="62" rx="8" fill="#2a4545"/>' +
    '<ellipse cx="88" cy="292" rx="22" ry="8" fill="#1d2f2f"/><ellipse cx="132" cy="292" rx="22" ry="8" fill="#1d2f2f"/>' +
    // body: a teal jacket with an orange tie
    '<path d="M58 150 Q60 118 110 116 Q160 118 162 150 L166 238 Q110 250 54 238 Z" fill="#3d9595"/>' +
    '<path d="M98 118 L110 136 L122 118 Z" fill="#fff"/><path d="M106 128 L114 128 L117 168 L110 176 L103 168 Z" fill="#d9643a"/>' +
    // head
    '<rect x="100" y="98" width="20" height="22" fill="#f1c27d"/>' +
    '<circle cx="110" cy="72" r="38" fill="#f1c27d"/>' +
    '<circle cx="72" cy="76" r="8" fill="#e8b06a"/><circle cx="148" cy="76" r="8" fill="#e8b06a"/>' +
    // the cap: a newsboy cap in orange
    '<path d="M70 62 Q72 26 110 24 Q150 26 152 60 Q110 50 70 62 Z" fill="#d9643a"/>' +
    '<path d="M66 62 Q110 46 160 58 Q166 66 150 68 Q110 58 70 70 Q60 68 66 62 Z" fill="#b94f29"/>' +
    '<circle cx="110" cy="26" r="5" fill="#b94f29"/>' +
    // face
    '<circle cx="96" cy="78" r="5" fill="#2a4545"/><circle cx="124" cy="78" r="5" fill="#2a4545"/>' +
    '<circle cx="97.5" cy="76.5" r="1.6" fill="#fff"/><circle cx="125.5" cy="76.5" r="1.6" fill="#fff"/>' +
    '<circle cx="88" cy="92" r="6" fill="#f2a07b" opacity=".6"/><circle cx="132" cy="92" r="6" fill="#f2a07b" opacity=".6"/>' +
    // his mouth: a resting smile (0) and 10 talking shapes, mixed up like real words
    '<g class="m on"><path d="M98 94 Q110 104 122 94" fill="none" stroke="#2a4545" stroke-width="4" stroke-linecap="round"/></g>' +
    // 1  m / b / p: lips pressed together
    '<g class="m"><path d="M100 97 Q110 99.5 120 97" fill="none" stroke="#2a4545" stroke-width="4.5" stroke-linecap="round"/></g>' +
    // 2  uh: a little bit open
    '<g class="m"><ellipse cx="110" cy="97" rx="7" ry="3.8" fill="#7a2a1a"/></g>' +
    // 3  AH: wide open, tongue showing
    '<g class="m"><path d="M99 93 Q110 91 121 93 Q121 108 110 108 Q99 108 99 93 Z" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="104.5" rx="6" ry="3" fill="#e0675a"/></g>' +
    // 4  ee: wide and flat, top teeth
    '<g class="m"><path d="M97 94 Q110 92 123 94 Q122 101 110 102 Q98 101 97 94 Z" fill="#7a2a1a"/>' +
      '<path d="M99 94.3 Q110 92.6 121 94.3 L120.5 96.6 Q110 95.1 99.5 96.6 Z" fill="#fff"/></g>' +
    // 5  oo: small and round, lips pushed out
    '<g class="m"><circle cx="110" cy="98" r="4.5" fill="#7a2a1a" stroke="#c9735a" stroke-width="2.2"/></g>' +
    // 6  oh: tall and round
    '<g class="m"><ellipse cx="110" cy="98.5" rx="6.5" ry="7.5" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="103.5" rx="4" ry="2" fill="#e0675a"/></g>' +
    // 7  f / v: top teeth on the bottom lip
    '<g class="m"><path d="M100 95 Q110 94 120 95 Q119 101 110 101 Q101 101 100 95 Z" fill="#7a2a1a"/>' +
      '<rect x="103" y="94.4" width="14" height="4" rx="1.2" fill="#fff"/></g>' +
    // 8  l / th: open, tongue up
    '<g class="m"><ellipse cx="110" cy="98" rx="9" ry="6.5" fill="#7a2a1a"/>' +
      '<path d="M104 103.5 Q110 93.5 116 103.5 Z" fill="#e0675a"/></g>' +
    // 9  eh: medium open, top teeth
    '<g class="m"><path d="M98 94 Q110 92 122 94 Q120 105 110 105 Q100 105 98 94 Z" fill="#7a2a1a"/>' +
      '<path d="M100 94.4 Q110 92.8 120 94.4 L119.4 97 Q110 95.6 100.6 97 Z" fill="#fff"/></g>' +
    // 10 ha: a big happy open smile
    '<g class="m"><path d="M97 93.5 Q110 96 123 93.5 Q120 107 110 107 Q100 107 97 93.5 Z" fill="#7a2a1a"/>' +
      '<ellipse cx="110" cy="103.5" rx="5.5" ry="2.6" fill="#e0675a"/></g>' +
    // arms up to the paper
    '<path d="M60 160 Q36 190 52 214" fill="none" stroke="#3d9595" stroke-width="20" stroke-linecap="round"/>' +
    '<path d="M160 160 Q184 190 168 214" fill="none" stroke="#3d9595" stroke-width="20" stroke-linecap="round"/>' +
    // the newspaper: front and back both say NEWS
    '<g class="paper">' +
      '<rect x="40" y="150" width="140" height="96" rx="4" fill="#fffdf7" stroke="#9aa9a9" stroke-width="2" transform="rotate(-4 110 198)"/>' +
      '<g class="front" transform="rotate(-4 110 198)">' +
        '<text x="110" y="180" text-anchor="middle" font-family="Fredoka One, cursive" font-size="27" fill="#d9643a">NEWS</text>' +
        '<rect x="52" y="188" width="116" height="3" fill="#2a4545"/>' +
        '<rect x="52" y="197" width="44" height="36" fill="#3d9595" opacity=".5"/>' +
        '<rect x="102" y="198" width="66" height="4" fill="#9aa9a9"/><rect x="102" y="207" width="60" height="4" fill="#9aa9a9"/>' +
        '<rect x="102" y="216" width="66" height="4" fill="#9aa9a9"/><rect x="102" y="225" width="50" height="4" fill="#9aa9a9"/>' +
      '</g>' +
      '<g class="backside" transform="rotate(-4 110 198)" style="display:none">' +
        '<text x="110" y="180" text-anchor="middle" font-family="Fredoka One, cursive" font-size="27" fill="#3d9595">NEWS</text>' +
        '<rect x="52" y="188" width="116" height="3" fill="#2a4545"/>' +
        '<rect x="52" y="198" width="66" height="4" fill="#9aa9a9"/><rect x="52" y="207" width="60" height="4" fill="#9aa9a9"/>' +
        '<rect x="52" y="216" width="66" height="4" fill="#9aa9a9"/><rect x="52" y="225" width="56" height="4" fill="#9aa9a9"/>' +
        '<rect x="124" y="197" width="44" height="36" fill="#d9643a" opacity=".45"/>' +
      '</g>' +
    '</g>' +
    // hands holding the paper
    '<circle cx="50" cy="214" r="11" fill="#f1c27d"/><circle cx="170" cy="210" r="11" fill="#f1c27d"/>' +
    '</svg>';

  var btn = document.createElement('button');
  btn.id = 'newsBtn';
  btn.title = 'News';
  btn.innerHTML = '<span class="ring"></span><span class="newsWord">NEWS</span><span class="dot"></span>';
  var page = document.createElement('div');
  page.id = 'newsPage';
  page.hidden = true;
  // the speech bubble's tail: one pointing sideways to his mouth, one pointing down (on a phone).
  // The little rectangle hides the bubble's edge where the tail joins on.
  var TAILS =
    '<svg class="tail side" viewBox="0 0 100 70"><rect x="-2" y="7" width="11" height="34" fill="#f8f4ec"/>' +
    '<path d="M6 4 L96 56 L6 44" fill="#f8f4ec" stroke="#2a7070" stroke-width="4" stroke-linejoin="round"/></svg>' +
    '<svg class="tail down" viewBox="0 0 70 80"><rect x="7" y="-2" width="34" height="11" fill="#f8f4ec"/>' +
    '<path d="M4 6 L56 76 L44 6" fill="#f8f4ec" stroke="#2a7070" stroke-width="4" stroke-linejoin="round"/></svg>';
  page.innerHTML = '<button class="x" title="Close">✕</button>' +
                   '<div class="bubble"><div class="scroll"><div class="wrap"></div></div>' + TAILS + '</div>' +
                   '<div id="newsman" title="Click me!">' + MAN + '</div>';
  document.body.appendChild(btn);
  document.body.appendChild(page);
  var wrap = page.querySelector('.wrap');
  var scroll = page.querySelector('.scroll');
  var man = page.querySelector('#newsman');
  var paper = man.querySelector('.paper');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function header() {
    var h = el('div', 'head');
    h.appendChild(el('span', 'ring'));
    h.appendChild(el('span', 'newsWord', 'NEWS'));
    wrap.appendChild(h);
  }

  function showList() {
    wrap.innerHTML = '';
    header();
    wrap.appendChild(el('div', 'sub', 'Everything new Jos made, newest first'));
    var grid = el('div', 'grid');
    NEWS.forEach(function (n, i) {
      var card = el('div', 'card' + (i === 0 ? ' first' : ''));
      var row = el('div', 'row');
      row.appendChild(el('span', 'emoji', n.emoji));
      row.appendChild(el('span', 'when', i === 0 ? 'Newest · ' + n.when : n.when));
      card.appendChild(row);
      card.appendChild(el('div', 'title', n.title));
      card.appendChild(el('p', 'what', n.what));
      if (n.more) card.appendChild(el('p', 'more', n.more));
      var go;
      if (n.play || n.look) {
        go = el('a', 'go' + (n.play ? ' play' : ''), n.play ? '▶ Play it' : '👀 Look at it');
        go.href = n.play || n.look;
      } else {
        go = el('button', 'go', '👀 Look at it');
        go.onclick = function () { lookAt(n); };
      }
      card.appendChild(go);
      // point at a story and the newsman flips his paper and talks
      card.addEventListener('mouseenter', function () { if (i !== story) { story = i; talk(1400); } });
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  // things that aren't a game: show them right here
  function lookAt(n) {
    if (n.show === 'clock') {
      close();
      var c = document.getElementById('josClock');
      if (c) { c.classList.remove('newsGlow'); void c.offsetWidth; c.classList.add('newsGlow'); }
      return;
    }
    wrap.innerHTML = '';
    header();
    var box = el('div', 'look');
    box.appendChild(el('div', 'title', n.emoji + ' ' + n.title));
    if (n.strip) {                // a picture that's lots of pictures in a row: play it
      var s = el('div', 'strip');
      s.style.backgroundImage = 'url(' + n.picture + ')';
      box.appendChild(s);
    } else {
      var img = el('img', 'pic');
      img.src = n.picture;
      img.alt = n.title;
      box.appendChild(img);
    }
    box.appendChild(el('p', 'what', n.what));
    if (n.more) box.appendChild(el('p', 'more', n.more));
    var back = el('button', 'go back', '← Back to the news');
    back.onclick = showList;
    box.appendChild(back);
    wrap.appendChild(box);
    scroll.scrollTop = 0;
  }

  /* ---------- the newsman: everything in the big bubble is him talking ---------- */
  var story = -1, mouth = 0, chatter = 0;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouths = [].slice.call(man.querySelectorAll('.m')), now = 0;
  function setMouth(k) {
    mouths[now].classList.remove('on');
    mouths[k].classList.add('on');
    now = k;
  }
  // talking: words of 1 to 4 sounds, each sound a different mouth shape, a tiny pause between
  // words (lips shut or a little smile), then the resting smile when he's finished
  function speak(ms) {
    clearTimeout(mouth);
    var end = Date.now() + ms, left = 0;
    (function step() {
      if (Date.now() >= end) { setMouth(0); return; }
      if (left <= 0) {
        left = 1 + Math.floor(Math.random() * 4);
        setMouth(Math.random() < 0.5 ? 1 : 0);
        mouth = setTimeout(step, 90 + Math.random() * 110);
        return;
      }
      left--;
      var k;
      do { k = 2 + Math.floor(Math.random() * 9); } while (k === now);
      setMouth(k);
      mouth = setTimeout(step, 70 + Math.random() * 90);
    })();
  }
  // flip the newspaper over (NEWS on the front, NEWS on the back) and talk for a bit
  function talk(ms) {
    paper.classList.remove('flip'); void paper.getBoundingClientRect(); paper.classList.add('flip');
    setTimeout(function () {
      var f = paper.querySelector('.front'), b = paper.querySelector('.backside');
      var frontShowing = f.style.display !== 'none';
      f.style.display = frontShowing ? 'none' : '';
      b.style.display = frontShowing ? '' : 'none';
    }, 300);
    if (!calm) speak(ms);
  }
  man.addEventListener('click', function () { talk(1800); });

  // a red dot until you've looked at the newest news
  var SEEN = 'jos-news-seen';
  function newest() { return NEWS[0].when + ' ' + NEWS[0].title; }
  function seen() { try { return localStorage.getItem(SEEN) === newest(); } catch (e) { return true; } }
  if (!seen()) btn.classList.add('unseen');

  function open() {
    showList();
    page.hidden = false;
    scroll.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('newsOpen');
    btn.classList.remove('unseen');
    try { localStorage.setItem(SEEN, newest()); } catch (e) {}
    story = -1;
    talk(3000);
    // now and then he turns the page and keeps talking
    clearInterval(chatter);
    chatter = setInterval(function () { talk(1800); }, 8000);
  }
  function close() {
    page.hidden = true;
    document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('newsOpen');
    clearInterval(chatter); clearTimeout(mouth);
    setMouth(0);
  }

  btn.addEventListener('click', open);
  page.querySelector('.x').addEventListener('click', close);
  // click the grey edges to go back to the home page
  page.addEventListener('click', function (e) { if (e.target === page) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !page.hidden) close(); });
})();
