// All the bombs. [name, colour, kind, settings]. Settings: r = size, n = how many, fuse, impact, bounce, stick...
const RAW = [
  ['Regular Bomb','#455a64','blast',{r:5}],
  ['Nature Bomb','#66bb6a','nature',{r:10}],
  ['Super Nature Bomb','#43a047','nature',{r:24}],
  ['Ultra Mega Nature Bomb','#1b5e20','nature',{r:9999}],
  ['Flat Bomb','#9ccc65','flat',{}],
  ['Indestructible Flat Bomb','#212121','flat',{indestructible:true}],
  ['Tiny Bomb','#90a4ae','blast',{r:1.6,fuse:1}],
  ['Pop Pop Bomb','#ef5350','cluster',{n:6,sub:{kind:'blast',r:1.6},spread:140,fuse:1.2}],
  ['Dynamite','#c62828','blast',{r:4,fuse:2.2}],
  ['Sticky Bomb','#7cb342','blast',{r:5,stick:true,fuse:2}],
  ['Bouncy Bomb','#ab47bc','blast',{r:5.5,bounce:.85,fuse:3}],
  ['Impact Bomb','#ff7043','blast',{r:5,impact:true}],
  ['Cross Bomb','#42a5f5','shape',{shape:'cross',r:8}],
  ['X Bomb','#26c6da','shape',{shape:'x',r:8}],
  ['Square Bomb','#8d6e63','shape',{shape:'square',r:6}],
  ['Diamond Bomb','#29b6f6','shape',{shape:'diamond',r:8}],
  ['Ring Bomb','#ffca28','shape',{shape:'ring',r:9}],
  ['Smiley Bomb','#fdd835','shape',{shape:'smile',r:9}],
  ['Heart Bomb','#ec407a','shape',{shape:'heart',r:9}],
  ['Star Bomb','#ffee58','shape',{shape:'star',r:10}],
  ['Line Bomb','#78909c','shape',{shape:'hline',r:24}],
  ['Pillar Bomb','#5d4037','shape',{shape:'vline',r:22}],
  ['Drill Bomb','#f9a825','tunnel',{dirs:['down'],len:26,w:1}],
  ['Side Drill','#ff8f00','tunnel',{dirs:['left','right'],len:22,w:1}],
  ['Big Bomb','#37474f','blast',{r:9}],
  ['Cluster Bomb','#e53935','cluster',{n:6,sub:{kind:'blast',r:4},spread:200}],
  ['Mini Cluster','#ff7043','cluster',{n:12,sub:{kind:'blast',r:2.2},spread:200}],
  ['Triple Bomb','#5c6bc0','chain',{n:3,sub:{kind:'blast',r:5},gap:.35}],
  ['Mouse Bomb','#bdbdbd','mice',{n:8}],
  ['Mice Swarm','#9e9e9e','mice',{n:22}],
  ['Worm Bomb','#ef9a9a','worms',{n:4,len:34}],
  ['Mole Bomb','#6d4c41','worms',{n:9,len:40}],
  ['Staircase Bomb','#a1887f','shape',{shape:'stairs',r:14}],
  ['Pyramid Bomb','#ffb300','shape',{shape:'pyramid',r:12}],
  ['Checker Bomb','#212121','shape',{shape:'checker',r:10}],
  ['Stripe Bomb','#e91e63','shape',{shape:'stripes',r:11}],
  ['Dot Bomb','#00acc1','shape',{shape:'dots',r:12}],
  ['Spiral Bomb','#7e57c2','shape',{shape:'spiral',r:12}],
  ['Wave Bomb','#039be5','shape',{shape:'wave',r:16}],
  ['Dome Bomb','#26a69a','shape',{shape:'dome',r:12}],
  ['Bowl Bomb','#8d6e63','shape',{shape:'bowl',r:12}],
  ['Tower Bomb','#607d8b','shape',{shape:'tower',r:14}],
  ['Lightning Bomb','#fff176','lightning',{n:3,depth:28}],
  ['Thunderstorm','#ffee58','lightning',{n:9,depth:34}],
  ['Fire Bomb','#ff5722','fire',{r:14,blast:3}],
  ['Acid Bomb','#aeea00','acid',{r:6,t:5}],
  ['Acid Rain','#76ff03','acid',{r:13,t:8}],
  ['Laser Bomb','#ff1744','laser',{len:40,th:1,axes:'h'}],
  ['Cross Laser','#f50057','laser',{len:40,th:1,axes:'hv'}],
  ['Meteor Bomb','#ff6e40','meteors',{n:3,r:5}],
  ['Meteor Shower','#ff3d00','meteors',{n:11,r:5}],
  ['Sky Drop','#546e7a','airstrike',{n:8,width:160,sub:{kind:'blast',r:4}}],
  ['Big Sky Drop','#455a64','airstrike',{n:18,width:260,sub:{kind:'blast',r:3.5}}],
  ['Earthquake Bomb','#795548','quake',{width:46,d:12}],
  ['Volcano Bomb','#d84315','volcano',{n:40}],
  ['Gravity Bomb','#5e35b1','blackhole',{r:7,t:3}],
  ['Black Hole Bomb','#000000','blackhole',{r:15,t:4.5}],
  ['Mega Hole','#1a1a1a','blackhole',{r:24,t:6}],
  ['Goo Bomb','#9ccc65','plague',{seeds:3}],
  ['Slime Bomb','#689f38','plague',{seeds:12,spread:.6}],
  ['Gunk Bomb','#827717','plague',{seeds:6,spread:.75}],
  ['Mega Goo Bomb','#33691e','plague',{mega:true,spread:6,warn:true}],
  ['Chain Reaction','#d32f2f','chain',{n:6,sub:{kind:'blast',r:6},gap:.28}],
  ['Mega Bomb','#263238','blast',{r:15}],
  ['Giga Bomb','#1c2a30','blast',{r:21}],
  ['Rainbow Bomb','#ff4081','random',{safe:true}],
  ['Mystery Bomb','#7c4dff','random',{}],
  ['Party Bomb','#ff80ab','party',{r:2}],
  ['Dust Bowl Bomb','#6d6d3a','apoc',{r:26}],
  ['Tumbleweed Bomb','#555529','apoc',{r:34}],
  ['Big Bang Bomb','#cddc39','nuke',{r:32}],
  ['Biggest Bang Bomb','#ffeb3b','nuke',{r:48}],
];
// Super and Ultra versions of many of them, so there are lots of sizes
const SCALE_UP = ['Cross Bomb','X Bomb','Diamond Bomb','Ring Bomb','Heart Bomb','Star Bomb','Smiley Bomb','Drill Bomb','Side Drill','Mouse Bomb','Worm Bomb','Lightning Bomb','Fire Bomb','Acid Bomb','Laser Bomb','Meteor Bomb','Sky Drop','Goo Bomb','Gravity Bomb','Cluster Bomb','Spiral Bomb','Wave Bomb','Dome Bomb','Bowl Bomb'];
function scaled(p, f) {
  const q = JSON.parse(JSON.stringify(p));
  for (const k of ['r','len','n','seeds','depth','width','d','t']) if (q[k] != null) q[k] = (k === 'n' || k === 'seeds') ? Math.round(q[k]*f) : +(q[k]*f).toFixed(1);
  if (q.sub && q.sub.r) q.sub.r = +(q.sub.r*Math.min(f, 1.6)).toFixed(1);
  return q;
}
for (const nm of SCALE_UP) {
  const b = RAW.find(x => x[0] === nm); if (!b) continue;
  RAW.push(['Super ' + nm, b[1], b[2], scaled(b[3], 1.5)]);
  RAW.push(['Ultra ' + nm, b[1], b[2], scaled(b[3], 2.2)]);
}
// a rough "how many blocks does it break", used to price and order them
function est(k, p) {
  switch (k) {
    case 'blast': return Math.PI*p.r*p.r;
    case 'shape': return Math.PI*p.r*p.r*(p.shape === 'hline' ? .3 : p.shape === 'vline' ? .3 : p.shape === 'ring' ? .55 : p.shape === 'checker' || p.shape === 'dots' || p.shape === 'stripes' ? .35 : .6);
    case 'tunnel': return p.len*(2*p.w+1)*p.dirs.length;
    case 'worms': return p.n*p.len*3;
    case 'mice': return p.n*38;
    case 'blackhole': return Math.PI*p.r*p.r;
    case 'plague': return p.mega ? 40000 : p.seeds*80;
    case 'cluster': return p.n*Math.PI*p.sub.r*p.sub.r*.8;
    case 'chain': return p.n*Math.PI*p.sub.r*p.sub.r;
    case 'airstrike': return p.n*Math.PI*p.sub.r*p.sub.r;
    case 'meteors': return p.n*Math.PI*p.r*p.r*.9;
    case 'lightning': return p.n*p.depth*3;
    case 'quake': return p.width*p.d*.9;
    case 'volcano': return p.n*14;
    case 'acid': return Math.PI*p.r*p.r*.9;
    case 'fire': return p.r*8 + Math.PI*p.blast*p.blast;
    case 'laser': return p.len*2*(2*p.th+1)*p.axes.length;
    case 'nuke': return Math.PI*p.r*p.r;
    case 'apoc': return Math.PI*p.r*p.r*.55;
    case 'party': return 12;
    case 'random': return 120;
    case 'nature': return 4;
    case 'flat': return 5;
  } return 50;
}
const BOMBS = RAW.map(([name, color, kind, p]) => ({ name, color, kind, p, est: est(kind, p) }));
const FREE = ['Regular Bomb'];   // the Lighter is a tool, not a bomb: it lives in game.js
const rest = BOMBS.filter(b => !FREE.includes(b.name)).sort((a, b) => a.est - b.est);
const ORDER = [...FREE.map(n => BOMBS.find(b => b.name === n)), ...rest];

// ---- the climb: one smooth ladder from the cheap bombs to the biggest, planned to take about 10 minutes of play ----
// Rank the bombs by size (that is the order of `rest`). A player always throws the best bomb they own, so how fast blocks come in
// grows with the size of the bomb. Walking up the ladder at an even pace (rank 0 at 0:00 to the last rank at TARGET_MIN), the blocks
// broken so far at each rung give the "break this many blocks to unlock it" number. Prices follow the same smooth curve, so there are no big jumps.
const TARGET_MIN = 10, SECS_PER_BOMB = 3.5, BLOCKS_PER_EST = .45;        // tune these three to speed the climb up or slow it down
const LADDER = ORDER.filter(b => !FREE.includes(b.name) && b.kind !== 'nature' && b.kind !== 'flat' && !b.p.mega);
const ladderNeed = []; let sofar = 0;
LADDER.forEach((b, r) => { ladderNeed.push(Math.round(sofar)); const dt = TARGET_MIN*60/LADDER.length; sofar += BLOCKS_PER_EST*Math.max(b.est, 60)/SECS_PER_BOMB*dt; });
const LADDER_END = Math.round(sofar);                                        // about the number of blocks broken by the end of the 10 minutes
const niceNum = x => x < 20 ? Math.round(x) : x < 100 ? Math.round(x/5)*5 : x < 1000 ? Math.round(x/10)*10 : x < 10000 ? Math.round(x/50)*50 : Math.round(x/500)*500;
const EST0 = Math.max(LADDER[0].est, 8), EST1 = LADDER[LADDER.length - 1].est;
ORDER.forEach((b, i) => {
  b.id = i; b.rank = i; b.free = i < FREE.length;
  b.stock = b.free ? Infinity : i < 18 ? Infinity : i < 45 ? 4 : i < 75 ? 2 : 1;   // how many times it can be bought before the next van
  b.give = b.free ? Infinity : i < 18 ? 4 : i < 45 ? 3 : i < 75 ? 2 : 1;           // how many bombs one purchase gives
  const r = LADDER.indexOf(b);
  if (r >= 0) {
    const smoothEst = EST0*Math.pow(EST1/EST0, r/(LADDER.length - 1));              // the size this rung "should" have, so prices climb evenly
    b.need = ladderNeed[r];                                                         // blocks you must have broken in total to unlock it
    b.tier = Math.floor(r/15) + 1;                                                  // Level 1 to 8: every 15 bombs is a new level
    b.price = Math.max(3, niceNum(BLOCKS_PER_EST*smoothEst*1.6));       // per purchase; the earliest purchases hand over 4 bombs, the last ones 1
  } else { b.need = 0; b.tier = 0; b.price = b.free ? 0 : 1; }
  b.warn = !!b.p.warn;
  if (b.p.mega) { b.need = LADDER_END; b.stock = Infinity; b.give = 1; b.price = 70000; b.tier = 9; }    // the last goal: a very big price, unlocked at the end of the climb, and the shop asks first
  if (b.kind === 'nature' || b.kind === 'flat') { b.need = 0; b.stock = Infinity; b.give = 1; b.price = 1; }     // the nature bombs repair the world: always for sale, one block each
});

// ---- what each bomb does, in a sentence, for the hover box in the shop ----
const SHAPE_TXT = { cross:'a cross (+)', x:'an X', square:'a square', diamond:'a diamond', ring:'a ring', smile:'a smiley face', heart:'a heart', star:'a star', hline:'a long flat trench sideways', vline:'a tall narrow shaft', stairs:'a staircase going down', pyramid:'a pyramid', checker:'a chessboard pattern', stripes:'stripes', dots:'a pattern of dots', spiral:'a spiral', wave:'a wavy channel', dome:'a dome-shaped cave', bowl:'a bowl-shaped dip', tower:'a tall tower shape' };
function bombInfo(b) {
  const p = b.p, k = b.kind; let t;
  const size = r => 'about ' + Math.round(r*2) + ' blocks wide';
  switch (k) {
    case 'blast': t = 'Digs a round hole ' + size(p.r) + '.' + (p.stick ? ' It sticks to whatever it lands on.' : '') + (p.bounce ? ' It bounces before it goes off.' : '') + (p.impact ? ' It goes off the moment it hits something.' : '') + (p.fuse && p.fuse <= 1 ? ' Very short fuse.' : p.fuse >= 2.5 ? ' Long fuse.' : ''); break;
    case 'nature': t = p.r > 1000 ? 'Fills every hole in the whole world with ground.' : 'Grows the ground back: fills the holes nearby with grass, dirt and stone.'; break;
    case 'flat': t = p.indestructible ? 'Makes the whole world flat, in ground that bombs cannot dig.' : 'Makes the whole world flat.'; break;
    case 'cluster': t = 'Pops open into ' + p.n + ' small bombs that fly out and go off.'; break;
    case 'shape': t = 'Digs ' + (SHAPE_TXT[p.shape] || 'a shape') + ' into the ground, ' + size(p.r) + '.'; break;
    case 'tunnel': t = p.dirs.includes('down') ? 'Drills a narrow tunnel straight down.' : 'Drills a narrow tunnel sideways, both left and right.'; break;
    case 'chain': t = 'Goes off ' + p.n + ' times in a row, side by side.'; break;
    case 'mice': t = 'Lets out ' + p.n + ' mice that scurry about and nibble the ground.'; break;
    case 'worms': t = 'Lets out ' + p.n + ' worms that wriggle through the ground and leave tunnels.'; break;
    case 'lightning': t = 'Calls down ' + p.n + ' lightning bolts that zap holes into the ground.'; break;
    case 'fire': t = 'Digs a hole, then flames run along the ground both ways.'; break;
    case 'acid': t = 'Leaves a bubbling pool that slowly eats down into the ground.'; break;
    case 'laser': t = p.axes === 'hv' ? 'Fires lasers sideways, up and down.' : 'Fires a laser sideways, both left and right.'; break;
    case 'meteors': t = 'Calls down ' + p.n + ' meteors from the sky.'; break;
    case 'airstrike': t = 'Drops ' + p.n + ' small bombs from the sky across a wide stretch.'; break;
    case 'quake': t = 'Shakes the ground and cracks open a wide stretch of it.'; break;
    case 'volcano': t = 'Erupts and throws out glowing lava that melts into the ground.'; break;
    case 'blackhole': t = 'Opens a black hole that swallows the ground around it, then closes again.'; break;
    case 'plague': t = p.mega ? 'Goo that spreads over the whole map, turning blocks green until they vanish. It never stops, so the shop asks you first.' : 'Goo that turns up to 30 blocks green, one next to another, until they vanish.'; break;
    case 'random': t = p.safe ? 'A surprise! Sets off a random small bomb.' : 'A surprise! Sets off a random bomb. Anything could happen.'; break;
    case 'party': t = 'A small hole and a big shower of confetti!'; break;
    case 'apoc': t = 'Blasts a crater and turns the ground around it into hard grey rubble.'; break;
    case 'nuke': t = 'One of the biggest bangs in the game: a huge round hole, a bright flash and a big cloud.'; break;
    default: t = 'Digs into the ground.';
  }
  if (/^(Super|Ultra) /.test(b.name)) t += ' This is a ' + (b.name.startsWith('Super') ? 'bigger' : 'much bigger') + ' version.';
  return t;
}
