/* ---------- Jos: the secret word "beginner" ----------
   Jos (1 Nov): "make a little word command that is beginner, and if you type it in it shows you
   everything you can do, how to do cursor, how to do select box, how to do trigger to block, how
   to do eraser, how to do all the blocks, how to connect triggers, how to get into the
   properties, how to do everything."

   Type beginner on the keyboard (not in a box) and the guide opens. Type it again, press Esc,
   click ✕, or click outside the box to close it. The editor commands stay secret: the guide
   never mentions the word editor.

   Needs editor.js first: it uses drawIcon() to draw the real blocks. */
(() => {
  const WORD = 'beginner';

  document.head.append(Object.assign(document.createElement('style'), { textContent:`
#guide { position:fixed; inset:0; z-index:310; display:flex; align-items:center; justify-content:center;
         background:rgba(0, 0, 0, .72); }
#guide[hidden] { display:none; }
#guide .gbox { width:min(880px, 94vw); height:min(640px, 90vh); display:flex; overflow:hidden;
  border-radius:16px; background:#1c0008; color:#fff; border:2px solid #ff2a3d;
  box-shadow:0 14px 40px rgba(0,0,0,.6); }
#guide .gside { width:215px; flex:none; overflow-y:auto; background:#0c0006; padding:14px 10px;
  border-right:2px solid #ff2a3d33; scrollbar-width:thin; scrollbar-color:#ff2a3d55 transparent; }
#guide .gside h2 { font-family:'Fredoka One', cursive; font-weight:400; font-size:1.25rem; color:#ffd23f;
  margin:0 0 10px 6px; }
#guide .gside button { display:block; width:100%; text-align:left; margin:0 0 4px; padding:.4rem .7rem;
  font-size:.95rem; border-radius:10px; background:transparent; box-shadow:none; }
#guide .gside button:hover { background:#3a0010; }
#guide .gside button.on { background:#ff2a3d; }
#guide .gmain { flex:1; overflow-y:auto; padding:18px 24px 24px; position:relative;
  scrollbar-width:thin; scrollbar-color:#ff2a3d55 transparent; }
#guide .gclose { position:sticky; top:0; float:right; background:#3a0010; box-shadow:none;
  padding:.25rem .65rem; margin:-6px -10px 0 8px; }
#guide h3 { font-family:'Fredoka One', cursive; font-weight:400; font-size:1.6rem; color:#ff2a3d; margin:0 0 10px; }
#guide p, #guide li { font-weight:700; line-height:1.45; font-size:1rem; }
#guide p { margin:0 0 10px; }
#guide ul, #guide ol { margin:0 0 12px; padding-left:1.4rem; }
#guide li { margin:0 0 6px; }
#guide b { color:#ffd23f; }
#guide .tip { background:#0c0006; border:2px solid #5dff8a55; border-radius:12px; padding:.55rem .8rem;
  margin:12px 0; }
#guide .tip::before { content:'💡 '; }
#guide kbd { font-family:'Fredoka One', cursive; background:#000; border:2px solid #ff2a3d77;
  border-radius:6px; padding:0 .4rem; font-size:.9rem; }
#guide .next { margin-top:14px; background:#2e9e4f; }
#guide .next:hover { background:#38c261; }
#guide .gblocks { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:8px; }
#guide .gblock { display:flex; gap:10px; align-items:center; background:#0c0006; border-radius:12px;
  padding:6px 10px 6px 6px; }
#guide .gblock canvas { width:54px; height:54px; flex:none; background:#14000a; border-radius:8px; }
#guide .gblock div { font-weight:700; font-size:.9rem; line-height:1.35; }
#guide .gblock b { font-family:'Fredoka One', cursive; font-weight:400; font-size:1rem; display:block; }
@media (max-width:640px) {
  #guide .gbox { flex-direction:column; }
  #guide .gside { width:auto; max-height:34%; border-right:none; border-bottom:2px solid #ff2a3d33; }
  #guide .gside button { display:inline-block; width:auto; }
}
` }));

  /* Jos's list of what a beginner needs, in the order to learn it */
  const TOPICS = [
    { id:'start', title:'👋 Start here', html:`
      <h3>Welcome to LDLC!</h3>
      <p>LDLC is where you make your own Level Devil levels.</p>
      <ol>
        <li>Pick a block from <b>BLOCKS</b> on the left.</li>
        <li>Click on the level to put it down. Click and drag to put down lots.</li>
        <li>Press <b>▶ TEST</b> to play your level.</li>
      </ol>
      <p>Every level needs a <b>Hero</b> (where you start) and a <b>Door</b> (where you finish).
         A new level already has a floor, a Hero and a Door.</p>
      <p>Your level saves itself. <b>← Back</b> takes you to <b>My levels</b>, where all your levels are.</p>
      <p class="tip">Click a topic on the left to learn it. Type <b>beginner</b> again, or press <kbd>Esc</kbd>, to close this.</p>` },

    { id:'blocks', title:'🧱 The blocks', blocks:true, html:`
      <h3>The blocks</h3>
      <p>Click a block in <b>BLOCKS</b>, then click on the level to put it down.</p>` },

    { id:'cursor', title:'🖱 Cursor', html:`
      <h3>🖱 Cursor</h3>
      <p>Click <b>🖱 Cursor</b> in the top bar first.</p>
      <ul>
        <li><b>Click a block</b> and its <b>Block properties</b> open on the right.</li>
        <li><b>Drag a block</b> to move it. Drop it on another block and it takes that square.</li>
        <li><b>Two blocks in one square?</b> Point at it and the name shows. Keep the mouse still
            and it changes to the other block. Then click.</li>
      </ul>
      <p class="tip">The Cursor moves one block. To move lots of blocks, use ✋ Select blocks.</p>` },

    { id:'select', title:'✋ Select blocks', html:`
      <h3>✋ Select blocks</h3>
      <p>Click <b>✋ Select blocks</b> in the top bar first.</p>
      <ul>
        <li><b>Click and drag</b> to draw a dotted box. Every block inside it is selected.</li>
        <li><b>Drag</b> one of the selected blocks to move them all.</li>
        <li>Press <kbd>Delete</kbd> to delete them all.</li>
        <li><b>Click</b> one of the selected blocks to change all their properties at once.
            It works when they all have the same properties.</li>
        <li><b>Add more:</b> draw another box, or click one more block.</li>
        <li><b>Start again:</b> click an empty square, or press <kbd>Esc</kbd>.</li>
      </ul>
      <p>Box round blocks that have blocks inside them and three buttons appear:
         <b>Select inside blocks</b>, <b>Select all blocks</b> and <b>Select outside blocks</b>.
         Click one to open the properties for just those.</p>
      <p class="tip">A switch that is half green and half black means some blocks are on and some are off.</p>` },

    { id:'link', title:'🔗 Trigger to block', html:`
      <h3>🔗 Trigger to block</h3>
      <p>This connects a <b>Trigger</b> or a <b>Button</b> to other blocks. When the hero runs
         through the trigger (or stands on the button), those blocks do something.</p>
      <ol>
        <li>Put down a Trigger or a Button.</li>
        <li>Click <b>🔗 Trigger to block</b> in the top bar.</li>
        <li><b>Choose a trigger or button.</b> It goes green. You can choose lots.</li>
        <li><b>Click on the blocks</b> you want it to set off. A line joins them up.</li>
        <li>Press <b>Done</b>. The last block you connected opens, ready for <b>+ Add</b>.</li>
      </ol>
      <p>Click a connected block again to disconnect it.</p>
      <p class="tip">Next, tell the blocks what to do. That's the next topic.</p>` },

    { id:'add', title:'⚡ Make it do something', html:`
      <h3>⚡ Make it do something</h3>
      <p>Once a block is connected, you tell it what to do when the trigger goes off.</p>
      <ol>
        <li>Click the connected block with <b>🖱 Cursor</b>.</li>
        <li>In its properties, find the <b>← Trigger</b> card.</li>
        <li>Click <b>+ Add</b>, then choose what it does from <b>Do</b>.</li>
      </ol>
      <ul>
        <li><b>Change size:</b> type the new size. It grows from the bottom, so it stays on the floor.</li>
        <li><b>Movement:</b> Left, Right, Up or Down, how many blocks, and how fast (Speed 1 to 50).
            A green dot shows where it will go.</li>
        <li><b>Change properties:</b> switch its properties on or off, like Visible or Deadly.
            This is how a block appears out of nowhere.</li>
      </ul>
      <p><b>Delay</b> on the card waits 0 to 30 seconds before it happens. The line gets a ⏱ tag.</p>
      <p>You can press + Add more than once, so one trigger can move a block <i>and</i> make it bigger.</p>
      <p class="tip">Turn on <b>Show trigger connections</b> in the top bar to see every connection as a
         dotted green line. Point at a connection in the properties and that block flashes red and green.</p>` },

    { id:'erase', title:'🧽 Eraser', html:`
      <h3>🧽 Eraser</h3>
      <p>Click <b>🧽 Eraser</b> in the top bar, then click a block to rub it out. Drag to rub out lots.</p>
      <p>It clears the whole square, and the block inside it too.</p>
      <p>To swap a block for a different one, rub it out first, then put the new one down.</p>
      <p><b>🗑 Clear</b> rubs out the whole level. It asks you first.</p>` },

    { id:'props', title:'⚙️ Block properties', html:`
      <h3>⚙️ Block properties</h3>
      <p>Click a block with <b>🖱 Cursor</b> and its properties open on the right.
         Green switch = on. Click ✕ at the top to close them.</p>
      <ul>
        <li><b>Deadly:</b> touch it and you die.</li>
        <li><b>Collision:</b> the hero stands on it and bumps into it.</li>
        <li><b>Visible:</b> off, and you can't see it when you play. It looks see-through in the creator.</li>
        <li><b>Do action:</b> off, and it does nothing. A spring won't boot you. A coin won't collect.</li>
        <li><b>Disguise as block:</b> pick a block, and it looks like that one. A spike that looks like a
            tile still gets you 😈. A little 🎭 shows in the creator.</li>
        <li><b>Turn:</b> ↺ ↻ turn the block round.</li>
      </ul>
      <p>Some blocks have extra ones:</p>
      <ul>
        <li><b>Spring → Strength:</b> how many blocks it boots you. It starts at 5.</li>
        <li><b>Coin → Needed for finish:</b> the door sinks into the ground until you get the coin.</li>
        <li><b>Portal → Output:</b> which way you come out (blank, Up, Down, Left or Right).</li>
        <li><b>Edit controls:</b> which key does left, right and up, or make the hero always run one way.</li>
      </ul>` },

    { id:'turn', title:'↻ Turning blocks', html:`
      <h3>↻ Turning blocks</h3>
      <p>Press <kbd>R</kbd> before you put a block down, and it goes down turned.</p>
      <p>Or click a block with <b>🖱 Cursor</b> and use <b>↺ ↻</b> next to <b>Turn</b>.</p>
      <p>These turn: <b>Spike</b>, <b>Small spike</b>, <b>Spring</b>, <b>One way</b>, <b>Button</b> and
         <b>Dash orb</b>. Turning changes which way it works:</p>
      <ul>
        <li>A spring on its side bounces you back. Facing down, it boots you down.</li>
        <li>A spike gets you on its new pointy side.</li>
        <li>A dash orb shoots you the way its arrow points.</li>
      </ul>` },

    { id:'inside', title:'📦 Block inside a block', html:`
      <h3>📦 Block inside a block</h3>
      <p>Pick a block and click on a block that's already there. It goes <b>inside</b> it.
         One square holds 2 blocks.</p>
      <p>The inside block shows as a small picture in the corner. When you play, it hides behind
         the other block until it moves out.</p>
      <p class="tip">Try this: put a spring inside the floor. Connect a trigger to it. Give it
         Movement, Up 1 block. Now a spring pops out of the floor!</p>` },

    { id:'portals', title:'🌀 Portals', html:`
      <h3>🌀 Portals</h3>
      <p>Portals come in <b>pairs</b>, in the order you put them down: the 1st and 2nd are a pair,
         then the 3rd and 4th.</p>
      <p>Go into one portal and you come out of the other one.</p>
      <p>Turn on <b>Show portal connections</b> in the top bar to see the pairs, with a number and a
         dotted line. A portal with no partner shows <b>?</b>.</p>
      <p><b>Output</b> in a portal's properties picks which way you come out of it. A little blue
         arrow shows that side in the creator.</p>` },

    { id:'edges', title:'✏️ Edges', html:`
      <h3>✏️ The edges of the level</h3>
      <p>There is a <b>✏️</b> button by the floor, the roof and each wall. Click it to swap:</p>
      <ul>
        <li><b>Floor, wall or roof</b> (a white line): the hero stands on it or bumps into it.</li>
        <li><b>Edge of screen</b> (red dashes): touch it and you die.</li>
      </ul>
      <p>A new level starts with solid walls and roof, and the bottom as the edge of the screen.</p>` },

    { id:'test', title:'▶ TEST', html:`
      <h3>▶ TEST</h3>
      <p>Press <b>▶ TEST</b> to play your level. The devil closes his mouth, then opens it with your
         level inside.</p>
      <ul>
        <li><kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to move.</li>
        <li><kbd>↑</kbd>, <kbd>Space</kbd> or <kbd>W</kbd> to jump. Let go early for a small jump.</li>
        <li><b>🔄</b> starts again. <b>✏️</b> or <kbd>Esc</kbd> takes you back to the creator.
            <b>💀</b> counts how many times you died.</li>
      </ul>
      <p>Get to the <b>Door</b> to beat your level.</p>` },

    { id:'send', title:'📤 Send to Jos', html:`
      <h3>📤 Send to Jos</h3>
      <p>Made a great level? Send it to Jos!</p>
      <ol>
        <li>Beat your level with <b>▶ TEST</b>, starting from the Hero.</li>
        <li><b>📤 Send to Jos</b> lights up gold, next to TEST.</li>
        <li>Click it. Type your <b>nickname</b> and your level's name.</li>
        <li>Pick Easy, Medium or Hard, and press <b>Send</b>.</li>
      </ol>
      <p>Change your level and you need to beat it again before you can send it.</p>
      <p class="tip">In <b>My levels</b>, right-click a level to <b>Play</b>, <b>Rename</b>, <b>Delete</b>
         or <b>Copy level link</b>.</p>` },

    { id:'keys', title:'⌨️ Keys', html:`
      <h3>⌨️ Keys</h3>
      <ul>
        <li><kbd>R</kbd> turns a block.</li>
        <li><kbd>Delete</kbd> deletes the selected blocks (with ✋ Select blocks).</li>
        <li><kbd>Esc</kbd> starts a selection again, or closes the properties.</li>
        <li><kbd>←</kbd> <kbd>→</kbd> <kbd>A</kbd> <kbd>D</kbd> move, and <kbd>↑</kbd> <kbd>Space</kbd>
            <kbd>W</kbd> jump, when you TEST.</li>
        <li>Type <b>beginner</b> to open and close this guide.</li>
      </ul>` }
  ];

  /* what each block does, for the blocks page */
  const ABOUT = {
    tile:       'Ground. You stand on it. Tiles that touch join up into one block.',
    hero:       'Where you start. A level has one.',
    door:       'Where you finish. Get to it to beat the level.',
    spike:      'Three spikes in one block. The pointy side gets you.',
    smallspike: 'One small spike. It gets you too.',
    sawblade:   'A spinning blade. Touch it and you die.',
    spring:     'Boots you up. Strength 5 boots you 5 blocks.',
    coin:       'Collect it. Turn on Needed for finish and the door waits for it.',
    oneway:     'Jump up through it. You don\'t fall back down.',
    portal:     'Comes in pairs. Go in one, come out the other.',
    trigger:    'Invisible when you play. Run through it to set off its blocks.',
    button:     'Stand on it. It goes down and sets off its blocks.',
    controls:   'Invisible. Touch it and the keys change to what it says.',
    dashorb:    'Touch it and press jump. You shoot the way the arrow points.'
  };

  const guide = Object.assign(document.createElement('div'), { id:'guide', hidden:true });
  guide.innerHTML = `<div class="gbox"><nav class="gside"><h2>📖 Beginner guide</h2></nav>
    <div class="gmain"><button class="gclose" title="Close">✕</button><div class="gpage"></div></div></div>`;
  document.body.append(guide);
  const side = guide.querySelector('.gside');
  const main = guide.querySelector('.gmain');
  const page = guide.querySelector('.gpage');
  let current = 'start', pics = [], raf = 0;

  TOPICS.forEach(t => {
    const b = Object.assign(document.createElement('button'), { textContent:t.title });
    b.dataset.id = t.id;
    b.addEventListener('click', () => go(t.id));
    side.append(b);
  });

  function go(id) {
    current = id;
    const i = TOPICS.findIndex(t => t.id === id);
    const t = TOPICS[i];
    side.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    page.innerHTML = t.html;
    pics = [];
    if (t.blocks) page.append(blockList());
    const after = TOPICS[i + 1];
    if (after) {
      const n = Object.assign(document.createElement('button'), { className:'next',
        textContent:`Next: ${after.title} →` });
      n.addEventListener('click', () => go(after.id));
      page.append(n);
    }
    main.scrollTop = 0;
  }

  /* every block, drawn by the creator itself, with what it does */
  function blockList() {
    const grid = Object.assign(document.createElement('div'), { className:'gblocks' });
    BLOCKS.filter(b => ABOUT[b.id]).forEach(b => {
      const card = Object.assign(document.createElement('div'), { className:'gblock' });
      const cv = document.createElement('canvas');
      cv.width = cv.height = 80;
      const words = document.createElement('div');
      words.append(Object.assign(document.createElement('b'), { textContent:b.name }), ABOUT[b.id]);
      card.append(cv, words);
      grid.append(card);
      pics.push({ id:b.id, c:cv.getContext('2d') });
    });
    return grid;
  }
  // the blocks move like they do in BLOCKS: the hero runs, the saw spins, the portal flashes
  function animate(now) {
    if (guide.hidden) { raf = 0; return; }
    pics.forEach(p => { try { drawIcon(p.c, p.id, now / 1000, 0); } catch (e) { /* a picture can't break the guide */ } });
    raf = requestAnimationFrame(animate);
  }

  function show() {
    guide.hidden = false;
    go(current);
    if (!raf) raf = requestAnimationFrame(animate);
  }
  function close() { guide.hidden = true; }

  guide.querySelector('.gclose').addEventListener('click', close);
  guide.addEventListener('mousedown', e => { if (e.target === guide) close(); });   // click outside the box

  /* the secret word. While the guide is open, keys are for the guide, not the creator behind it */
  let typed = '';
  addEventListener('keydown', e => {
    const open = !guide.hidden;
    if (open) {
      e.stopPropagation();
      if (e.key === 'Escape') { close(); return; }
    }
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const send = document.getElementById('sendModal');
    if (!open && (document.body.classList.contains('testing') || (send && !send.hidden))) return;
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
    typed = (typed + e.key.toLowerCase()).slice(-WORD.length);
    if (typed !== WORD) return;
    typed = '';
    e.stopPropagation();          // so the last r of beginner doesn't turn a block
    open ? close() : show();
  }, true);
})();
