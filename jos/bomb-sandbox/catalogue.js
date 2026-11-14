// All the bombs. [name, colour, kind, settings]. Settings: r = size, n = how many, fuse, impact, bounce, stick...
const RAW = [
  ['Regular Bomb','#455a64','blast',{r:5}],
  ['Nature Bomb','#66bb6a','nature',{r:10}],
  ['Super Nature Bomb','#43a047','nature',{r:24}],
  ['Ultra Mega Nature Bomb','#1b5e20','nature',{r:9999}],
  ['Flat Bomb','#9ccc65','flat',{}],
  ['Indestructible Flat Bomb','#212121','flat',{indestructible:true}],
  ['Tiny Bomb','#90a4ae','blast',{r:1.6,fuse:1}],
  ['Firecracker','#ef5350','cluster',{n:6,sub:{kind:'blast',r:1.6},spread:140,fuse:1.2}],
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
  ['Airstrike','#546e7a','airstrike',{n:8,width:160,sub:{kind:'blast',r:4}}],
  ['Carpet Bomb','#455a64','airstrike',{n:18,width:260,sub:{kind:'blast',r:3.5}}],
  ['Earthquake Bomb','#795548','quake',{width:46,d:12}],
  ['Volcano Bomb','#d84315','volcano',{n:40}],
  ['Gravity Bomb','#5e35b1','blackhole',{r:7,t:3}],
  ['Black Hole Bomb','#000000','blackhole',{r:15,t:4.5}],
  ['Mega Hole','#1a1a1a','blackhole',{r:24,t:6}],
  ['Plague Bomb','#9ccc65','plague',{seeds:3}],
  ['Pandemic Bomb','#689f38','plague',{seeds:12,spread:.6}],
  ['Rot Bomb','#827717','plague',{seeds:6,spread:.75}],
  ['Mega Plague Bomb','#33691e','plague',{mega:true,spread:6,warn:true}],
  ['Chain Reaction','#d32f2f','chain',{n:6,sub:{kind:'blast',r:6},gap:.28}],
  ['Mega Bomb','#263238','blast',{r:15}],
  ['Giga Bomb','#1c2a30','blast',{r:21}],
  ['Rainbow Bomb','#ff4081','random',{safe:true}],
  ['Mystery Bomb','#7c4dff','random',{}],
  ['Party Bomb','#ff80ab','party',{r:2}],
  ['Post-Apocalyptic Bomb','#6d6d3a','apoc',{r:26}],
  ['Wasteland Bomb','#555529','apoc',{r:34}],
  ['Nuclear Bomb','#cddc39','nuke',{r:32}],
  ['Tsar Bomb','#ffeb3b','nuke',{r:48}],
];
// Super and Ultra versions of many of them, so there are lots of sizes
const SCALE_UP = ['Cross Bomb','X Bomb','Diamond Bomb','Ring Bomb','Heart Bomb','Star Bomb','Smiley Bomb','Drill Bomb','Side Drill','Mouse Bomb','Worm Bomb','Lightning Bomb','Fire Bomb','Acid Bomb','Laser Bomb','Meteor Bomb','Airstrike','Plague Bomb','Gravity Bomb','Cluster Bomb','Spiral Bomb','Wave Bomb','Dome Bomb','Bowl Bomb'];
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
ORDER.forEach((b, i) => {
  b.id = i; b.rank = i; b.free = i < FREE.length;
  b.need = b.free ? 0 : Math.round(2 * Math.pow(i, 1.85));          // blocks you must have broken in total to unlock it
  b.stock = b.free ? Infinity : i < 18 ? Infinity : i < 45 ? 4 : i < 75 ? 2 : 1;   // how many times it can be bought before the next van
  b.give = b.free ? Infinity : i < 18 ? 4 : i < 45 ? 3 : i < 75 ? 2 : 1;           // how many bombs one purchase gives
  b.price = b.free ? 0 : Math.max(2, Math.round(b.est * b.give * 0.3));
  b.warn = !!b.p.warn;
  if (b.p.mega) { b.need = 0; b.stock = Infinity; b.give = 1; b.price = 10; }    // always available, but the shop asks first
  if (b.kind === 'nature' || b.kind === 'flat') { b.need = 0; b.stock = Infinity; b.give = 1; b.price = 1; }     // the nature bombs repair the world: always for sale, one block each
});
