/* ===== Jos's Marble Run Builder — engine =====
   Grid editor (left: tool state, build a track) + a small physics sim (Run).
   editGrid is what you build and what gets saved. runGrid is a throwaway copy
   made fresh every time you press Run, so breakable blocks / used dispensers /
   gravity never "remember" between runs. */
(function(){
'use strict';

const CELL = 40;                 // base pixel size of one grid cell, before zoom
const DIRS = [                   // rot 0..3, clockwise, matches the brick icons
  {x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}
];
const DEFAULT_ROT = { oneway:0, gravswitch:0, dispenser:2, spring:0 };
// which DIRS index each brick's real picture points to at zero rotation (others point "up")
const IMG_NATIVE_DIR = { dispenser: 2, speedup: 1 };

const BASIC   = ['solid','ramp','curve','flat','start','finish'];
const SPECIAL = ['spring','oneway','portal','breakable','speedup','gravswitch','dispenser'];
const NAMES = {
  solid:'Block', ramp:'Ramp', curve:'Curve', flat:'Flat',
  start:'Start', finish:'Finish', spring:'Spring', oneway:'One-Way',
  portal:'Portal', breakable:'Breakable', speedup:'Speed Up',
  gravswitch:'Gravity', dispenser:'Dispenser', eraser:'Eraser'
};
const SINGLETON = { start:true, finish:true }; // only one of these allowed on the board

/* real screenshots of the actual marblerun.at bricks — used instead of drawn icons */
const IMG_TYPES = ['speedup','gravswitch','dispenser','eraser'];
const BRICK_IMAGES = {};
let imagesReadyCount = 0;
IMG_TYPES.forEach(t=>{
  const img = new Image();
  img.onload = ()=>{ imagesReadyCount++; if (gridCtx) renderGrid(); refreshToolboxIcons(); };
  img.src = 'brick-art/' + t + '.png';
  BRICK_IMAGES[t] = img;
});
function refreshToolboxIcons(){
  document.querySelectorAll('.brick-slot').forEach(slot=>{
    const cv = slot.querySelector('canvas');
    if (cv) drawBrick(cv.getContext('2d'), 35, 31, 54, slot.dataset.type, slot._rot, {});
  });
}

/* ---------------- state ---------------- */
let gridW = 10, gridH = 10;
let editGrid = makeGrid(gridW, gridH);
let startXY = null, finishXY = null;   // {x,y} cell coords, kept in sync with editGrid
let zoom = 1;
let selected = null;        // {type, rot}
let painting = false;       // mouse held down, painting/erasing across cells
let dragBrickFrom = null;   // {brick, fromGx, fromGy, startX, startY, moved} while dragging a brick already on the board
let dragGhost = null;       // currently-dragged toolbox brick (drag & drop placement)

let running = false;
let runGrid = null, marbles = [], gravityDir = {x:0,y:1}, activeGravSwitch = null;
let finished = false, dirty = false, rafId = null, portalPairs = [];

// each portal remembers its own number and who it's paired with, so the pairing survives
// a drag-move and doesn't depend on where the portals happen to sit on the board
let nextPortalId = 1, portalWaitingId = null; // the most recently placed portal with no partner yet

function makeGrid(w,h){ return Array.from({length:h},()=>Array.from({length:w},()=>null)); }

/* ================= portal pairing ================= */
// pairing is placement order, not board position: portal 1 + portal 2 are a pair,
// portal 3 + portal 4 are the next pair, and so on - and it stays that way even if you
// drag one of them somewhere else on the board.
function portalIsFirst(meta){
  // the first of a pair (or a portal still waiting for its partner) faces the base way;
  // the second faces the opposite way - a plain 180 degree flip of the same shape
  return !meta || meta.pairedWith == null || meta.portalId < meta.pairedWith;
}
function portalEffRot(cell){
  // rot is the player's own click-to-rotate, same as any other brick; the pairing role
  // just adds a 180 on top of that, so both can apply at once
  return (cell.rot + (portalIsFirst(cell.meta) ? 0 : 2)) % 4;
}
function findPortalCellById(id){
  for(let y=0;y<editGrid.length;y++) for(let x=0;x<editGrid[0].length;x++){
    const c = editGrid[y][x];
    if (c && c.type==='portal' && c.meta && c.meta.portalId===id) return c;
  }
  return null;
}
function makeBrick(type, rot){
  const brick = {type, rot};
  if (type === 'portal'){
    const id = nextPortalId++;
    const meta = {portalId:id, pairedWith:null};
    const waiting = portalWaitingId!==null ? findPortalCellById(portalWaitingId) : null;
    if (waiting){
      meta.pairedWith = portalWaitingId;
      waiting.meta.pairedWith = id;
      portalWaitingId = null;
    } else {
      portalWaitingId = id; // nothing waiting (or it got deleted) - this one waits now
    }
    brick.meta = meta;
  }
  return brick;
}
function destroyPortalPartner(old){
  // called just before `old` is removed from the board (erased, dragged off, or painted
  // over) - if it was half of a pair, the other half goes too
  if (!old.meta) return;
  if (portalWaitingId === old.meta.portalId) portalWaitingId = null;
  const partnerId = old.meta.pairedWith;
  if (partnerId == null) return;
  for(let y=0;y<editGrid.length;y++) for(let x=0;x<editGrid[0].length;x++){
    const c = editGrid[y][x];
    if (c && c.type==='portal' && c.meta && c.meta.portalId===partnerId){
      editGrid[y][x] = null;
      if (portalWaitingId === partnerId) portalWaitingId = null;
      return;
    }
  }
}
function resetPortalState(){ nextPortalId = 1; portalWaitingId = null; }
function recomputePortalState(grid){
  // after loading a saved track - figure out the highest id used and whether one portal
  // is still waiting for a partner, rather than trusting module state left over from before
  let maxId = 0, waiting = null;
  for(let y=0;y<grid.length;y++) for(let x=0;x<grid[0].length;x++){
    const c = grid[y][x];
    if (c && c.type==='portal' && c.meta && c.meta.portalId){
      if (c.meta.portalId > maxId) maxId = c.meta.portalId;
      if (c.meta.pairedWith == null) waiting = c.meta.portalId;
    }
  }
  nextPortalId = maxId+1;
  portalWaitingId = waiting;
}

/* ================= toolbox ================= */
function buildToolbox(){
  const basicBox = document.getElementById('basicBox');
  const specialBox = document.getElementById('specialBox');
  BASIC.forEach(t => basicBox.appendChild(makeSlot(t)));
  SPECIAL.forEach(t => specialBox.appendChild(makeSlot(t)));
  specialBox.appendChild(makeSlot('eraser'));
}
function makeSlot(type){
  const slot = document.createElement('div');
  slot.className = 'brick-slot' + (type==='eraser' ? ' eraser-slot' : '');
  slot.dataset.type = type;
  slot.title = NAMES[type];
  const cv = document.createElement('canvas');
  cv.width = 70; cv.height = 62;
  slot.appendChild(cv);
  slot._rot = DEFAULT_ROT[type] || 0;
  drawBrick(cv.getContext('2d'), 35, 31, 54, type, slot._rot, {});
  slot.addEventListener('click', () => onSlotClick(slot, type));
  slot.addEventListener('mousedown', (e) => { dragGhost = {type, rot:slot._rot}; showDragPreview(type, slot._rot, e.clientX, e.clientY); });
  return slot;
}
function onSlotClick(slot, type){
  if (running) stopRun(false); // any click always works - picking a brick stops a live run instead of being ignored
  if (selected && selected.type === type && selected.slot === slot){
    slot._rot = (slot._rot + 1) % 4;
    drawBrick(slot.querySelector('canvas').getContext('2d'), 35, 31, 54, type, slot._rot, {});
    selected.rot = slot._rot;
    return;
  }
  document.querySelectorAll('.brick-slot.selected').forEach(s=>s.classList.remove('selected'));
  slot.classList.add('selected');
  selected = { type, rot: slot._rot, slot };
}

/* ================= brick drawing ================= */
function drawRibbon(ctx, x1, y1, x2, y2, thickness){
  // a thin band between two points, pointed at both ends - the "X" cross in the spring coil
  const dx = x2-x1, dy = y2-y1;
  const len = Math.hypot(dx,dy);
  const ux = dx/len, uy = dy/len;
  const px = -uy, py = ux;
  const hw = thickness/2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1+px*hw, y1+py*hw);
  ctx.lineTo(x2+px*hw, y2+py*hw);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2-px*hw, y2-py*hw);
  ctx.lineTo(x1-px*hw, y1-py*hw);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
function mulberry32(seed){
  // small, fast, seeded random number generator - same seed always gives the same
  // sequence, which is how a breakable cell always cracks the same way
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function perimeterParam(x, y, s){
  // where a point on the square's own border sits, going clockwise from the top-left
  // corner (0), round to top-right (1), bottom-right (2), bottom-left (3), back to 0
  const eps = 0.01;
  if (Math.abs(y+s) < eps) return (x+s)/(2*s);
  if (Math.abs(x-s) < eps) return 1 + (y+s)/(2*s);
  if (Math.abs(y-s) < eps) return 2 + (s-x)/(2*s);
  return 3 + (s-y)/(2*s);
}
function breakableShards(cx, cy, size){
  // Jos's design: a random dot inside, lines from random points on the edge all meeting
  // there. Seeded from the brick's own position, so the same cell always cracks the same
  // way instead of a new pattern every redraw. The square's own corners are folded into
  // the same sorted list as the line endpoints, so each gap between two neighbours -
  // always on the same edge - is one triangular shard; no shard is ever more than that.
  const s = size/2;
  const rnd = mulberry32((Math.round(cx)*374761393 + Math.round(cy)*668265263) >>> 0);
  const dot = {x:(rnd()-0.5)*size*0.5, y:(rnd()-0.5)*size*0.5};
  const lineCount = 6 + Math.floor(rnd()*4);
  const pts = [];
  for(let i=0;i<lineCount;i++){
    const edge = Math.floor(rnd()*4), t = rnd();
    let ex, ey;
    if (edge===0){ ex=-s+t*size; ey=-s; }
    else if (edge===1){ ex=s; ey=-s+t*size; }
    else if (edge===2){ ex=-s+t*size; ey=s; }
    else { ex=-s; ey=-s+t*size; }
    pts.push({x:ex, y:ey, p:perimeterParam(ex,ey,s)});
  }
  const corners = [{x:-s,y:-s,p:0},{x:s,y:-s,p:1},{x:s,y:s,p:2},{x:-s,y:s,p:3}];
  const all = pts.concat(corners).sort((a,b)=>a.p-b.p);
  const shards = [];
  for(let i=0;i<all.length;i++){
    const a = all[i], b = all[(i+1)%all.length];
    const cxm = (dot.x+a.x+b.x)/3, cym = (dot.y+a.y+b.y)/3;
    shards.push({ dot, a:{x:a.x,y:a.y}, b:{x:b.x,y:b.y}, cx:cxm, cy:cym, spin:(rnd()-0.5)*4 });
  }
  return shards;
}
function drawBrick(ctx, cx, cy, size, type, rot, meta){
  ctx.clearRect(cx-size/2-4, cy-size/2-4, size+8, size+8);
  ctx.save();
  ctx.translate(cx, cy);
  const angle = rot * Math.PI/2;
  const s = size/2;
  switch(type){
    case 'solid':
      ctx.fillStyle = '#7a4a2e'; ctx.fillRect(-s,-s,size,size);
      ctx.strokeStyle = '#4e2f1c'; ctx.lineWidth=2; ctx.strokeRect(-s+1,-s+1,size-2,size-2);
      break;
    case 'ramp':
      ctx.rotate(angle);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.moveTo(-s,-s); ctx.lineTo(-s,s); ctx.lineTo(s,s);
      ctx.closePath(); ctx.fill();
      break;
    case 'curve':
      // same two straight edges as a ramp, but the diagonal is a real curve, not a straight line
      ctx.rotate(angle);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.moveTo(-s,-s); ctx.lineTo(-s,s); ctx.lineTo(s,s);
      ctx.quadraticCurveTo(s*0.98,-s*0.98, -s,-s);
      ctx.closePath(); ctx.fill();
      break;
    case 'flat':
      ctx.rotate(angle);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-s, s-size*0.22, size, size*0.22);
      break;
    case 'start':
      ctx.fillStyle = '#d94c3d'; ctx.beginPath(); ctx.arc(0,0,s*0.65,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
      break;
    case 'finish': {
      const n=6, cw=size/n;
      for(let yy=0; yy<n; yy++) for(let xx=0; xx<n; xx++){
        ctx.fillStyle = (xx+yy)%2===0 ? '#222' : '#fff';
        ctx.fillRect(-s+xx*cw, -s+yy*cw, cw, cw);
      }
      break; }
    case 'spring': {
      // Jos's own design: a base block, 3 rows of crossed ribbons, a thin top slab
      ctx.rotate(angle);
      const w = size*0.78, baseH = size*0.30, slabH = size*0.08, coilH = size*0.40;
      const baseTopY = s - baseH;
      const coilTopY = baseTopY - coilH;
      const slabTopY = coilTopY - slabH;
      ctx.fillStyle = '#ececea'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.fillRect(-w/2, baseTopY, w, baseH);
      ctx.strokeRect(-w/2, baseTopY, w, baseH);
      const xCount = 3, segH = coilH/xCount, half = w*0.46, ribbonW = size*0.065;
      ctx.lineWidth = 1.5;
      for(let i=0;i<xCount;i++){
        const yBot = baseTopY - i*segH, yTop = baseTopY - (i+1)*segH;
        drawRibbon(ctx, -half, yBot, half, yTop, ribbonW);
        drawRibbon(ctx, half, yBot, -half, yTop, ribbonW);
      }
      ctx.lineWidth = 2;
      ctx.fillRect(-w/2, slabTopY, w, slabH);
      ctx.strokeRect(-w/2, slabTopY, w, slabH);
      break; }
    case 'oneway': {
      // Jos's own design: a thin slab at the top of the brick, a small triangle dead
      // centre, tip pointing the way the marble is allowed through (rot 0 = up, matches
      // DIRS[0] - same convention collideOneway already uses)
      ctx.rotate(angle);
      const triW = size*0.31, triH = size*0.275;
      const slabW = size, slabH = size*0.10; // slab spans the full grid cell - a marble can't sneak past the end of it
      const slabTopY = -s*0.88;
      const triApexY = -triH/2, triBaseY = triH/2;
      ctx.fillStyle = '#1a1a1a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, triApexY);
      ctx.lineTo(-triW/2, triBaseY);
      ctx.lineTo(triW/2, triBaseY);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ececea'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.fillRect(-slabW/2, slabTopY, slabW, slabH);
      ctx.strokeRect(-slabW/2, slabTopY, slabW, slabH);
      break; }
    case 'portal': {
      // Jos's design, matching the real piece: only HALF the tile is solid block, flush
      // to one edge, with a semicircle notch bitten out of its inner edge. One shape,
      // drawn flush to the top with the notch biting up into it - rotation (the player's
      // own click-to-rotate, plus a built-in 180 for the second of a pair) does the rest,
      // same as every other rotatable brick.
      ctx.rotate(portalEffRot({rot, meta}) * Math.PI/2);
      const blockW = size, blockH = s, r = size*0.42;
      ctx.fillStyle = '#ececea'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.fillRect(-blockW/2, -s, blockW, blockH);
      ctx.strokeRect(-blockW/2, -s, blockW, blockH);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, Math.PI*2, false); // bites up into the block
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break; }
    case 'breakable': {
      // Jos's design: a cracked brick (random dot, lines from the edges to it), and when
      // it actually breaks, each wedge between the crack lines flies apart under gravity
      // with a small outward push, then is gone a second later.
      const shards = breakableShards(cx, cy, size);
      if (meta && meta.broken){
        const t = meta.brokenAt ? (performance.now()-meta.brokenAt)/1000 : 0;
        if (t < 1){
          const IMPULSE = 90, SHARD_GRAVITY = 500;
          shards.forEach(sh=>{
            const dx = sh.cx-sh.dot.x, dy = sh.cy-sh.dot.y, dlen = Math.hypot(dx,dy) || 1;
            const ox = (dx/dlen)*IMPULSE*t + 0.5*gravityDir.x*SHARD_GRAVITY*t*t;
            const oy = (dy/dlen)*IMPULSE*t + 0.5*gravityDir.y*SHARD_GRAVITY*t*t;
            ctx.save();
            ctx.translate(ox, oy);
            ctx.translate(sh.cx, sh.cy); ctx.rotate(sh.spin*t); ctx.translate(-sh.cx, -sh.cy);
            ctx.fillStyle = '#ececea'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(sh.dot.x, sh.dot.y); ctx.lineTo(sh.a.x, sh.a.y); ctx.lineTo(sh.b.x, sh.b.y);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.restore();
          });
        }
      } else {
        ctx.fillStyle = '#ececea'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.fillRect(-s, -s, size, size);
        ctx.strokeRect(-s, -s, size, size);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.3;
        shards.forEach(sh=>{
          ctx.beginPath();
          ctx.moveTo(sh.a.x, sh.a.y); ctx.lineTo(sh.dot.x, sh.dot.y); ctx.lineTo(sh.b.x, sh.b.y);
          ctx.stroke();
        });
      }
      break; }
    case 'speedup': case 'gravswitch': case 'dispenser': case 'eraser': {
      const img = BRICK_IMAGES[type];
      let alpha = 1;
      if (type==='dispenser' && meta && meta.used) alpha = 0.3;
      ctx.globalAlpha = alpha;
      if (type !== 'eraser'){
        // the real picture's own arrow doesn't always point "up" at rest (dispenser's points
        // down), so rotate from whichever way the picture actually points, not from rot=0
        const nativeDir = IMG_NATIVE_DIR[type] || 0;
        const steps = (rot - nativeDir + 4) % 4;
        ctx.rotate(steps * Math.PI/2);
      }
      if (img && img.complete && img.naturalWidth){
        ctx.imageSmoothingEnabled = false;
        const fit = Math.min(size/img.naturalWidth, size/img.naturalHeight);
        const dw = img.naturalWidth*fit, dh = img.naturalHeight*fit;
        ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
      } else {
        ctx.fillStyle = '#ccc'; ctx.fillRect(-s,-s,size,size); // still loading
      }
      if (type==='gravswitch' && meta && meta.active){
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#f0c419';
        ctx.beginPath(); ctx.arc(0,0,s*0.95,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      break; }
  }
  ctx.restore();
}

/* ================= board <-> toolbox interaction ================= */
function setCell(gx, gy, brick){
  if (gx<0||gy<0||gx>=gridW||gy>=gridH) return;
  const old = editGrid[gy][gx];
  if (old && old.type==='portal' && old!==brick) destroyPortalPartner(old);
  if (brick && SINGLETON[brick.type]){
    const prev = brick.type==='start' ? startXY : finishXY;
    if (prev) editGrid[prev.y][prev.x] = null;
    if (brick.type==='start') startXY = {x:gx,y:gy}; else finishXY = {x:gx,y:gy};
  } else {
    if (old && old.type==='start' && startXY && startXY.x===gx && startXY.y===gy) startXY=null;
    if (old && old.type==='finish' && finishXY && finishXY.x===gx && finishXY.y===gy) finishXY=null;
  }
  editGrid[gy][gx] = brick;
  markDirty();
  renderGrid();
}
function placeDefaultStartFinish(){
  // every fresh board gets a Start and Finish already down, straight-line below each other,
  // so there's always something to press Run on - no empty board with nothing testable
  const col = Math.min(1, gridW-1);
  setCell(col, 0, {type:'start', rot:0});
  setCell(col, gridH-1, {type:'finish', rot:0});
}
function eraseCell(gx,gy){ setCell(gx,gy,null); }

function markDirty(){
  dirty = true;
  finished = false;
  document.getElementById('saveBtn').disabled = true;
  document.getElementById('saveBtn').classList.remove('ready');
  document.getElementById('finishBanner').style.display = 'none';
}

/* ================= rendering ================= */
let gridCtx, marbleCtx;
function sizeCanvases(){
  const w = gridW*CELL, h = gridH*CELL;
  [document.getElementById('gridCanvas'), document.getElementById('marbleCanvas')].forEach(cv=>{
    cv.width = w; cv.height = h; cv.style.width = w+'px'; cv.style.height = h+'px';
  });
  document.getElementById('viewportInner').style.width = w+'px';
  document.getElementById('viewportInner').style.height = h+'px';
}
function renderGrid(){ renderGridFrom(editGrid); }
function renderGridFrom(grid){
  // used for both the still board while building (editGrid) and the live board during a
  // run (runGrid) - without this second use, a crack, a used dispenser, a lit-up gravity
  // switch... none of it would ever actually show, only the marble would animate
  gridCtx.clearRect(0,0,gridW*CELL,gridH*CELL);
  gridCtx.strokeStyle = 'rgba(0,0,0,.12)'; gridCtx.lineWidth=1;
  for(let x=0;x<=gridW;x++){ gridCtx.beginPath(); gridCtx.moveTo(x*CELL+.5,0); gridCtx.lineTo(x*CELL+.5,gridH*CELL); gridCtx.stroke(); }
  for(let y=0;y<=gridH;y++){ gridCtx.beginPath(); gridCtx.moveTo(0,y*CELL+.5); gridCtx.lineTo(gridW*CELL,y*CELL+.5); gridCtx.stroke(); }
  for(let y=0;y<gridH;y++) for(let x=0;x<gridW;x++){
    const b = grid[y][x];
    if (!b) continue;
    let meta = b.meta ? Object.assign({}, b.meta) : {};
    drawBrick(gridCtx, x*CELL+CELL/2, y*CELL+CELL/2, CELL*0.92, b.type, b.rot, meta);
  }
}

/* ================= viewport interaction ================= */
function cellFromEvent(e, viewportInner){
  const rect = viewportInner.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom;
  const y = (e.clientY - rect.top) / zoom;
  return { gx: Math.floor(x/CELL), gy: Math.floor(y/CELL) };
}
function applyPaint(gx,gy){
  if (gx<0||gy<0||gx>=gridW||gy>=gridH) return;
  if (!selected) return;
  if (selected.type === 'eraser') eraseCell(gx,gy);
  else setCell(gx,gy, makeBrick(selected.type, selected.rot));
}

function showDragPreview(type, rot, clientX, clientY){
  const cv = document.getElementById('dragPreview');
  cv.style.display = 'block';
  cv.style.left = (clientX-26)+'px'; cv.style.top = (clientY-26)+'px';
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,64,64);
  drawBrick(ctx, 32, 32, 48, type, rot, {});
}
function moveDragPreview(clientX, clientY){
  const cv = document.getElementById('dragPreview');
  cv.style.left = (clientX-26)+'px'; cv.style.top = (clientY-26)+'px';
}
function hideDragPreview(){ document.getElementById('dragPreview').style.display = 'none'; }

function initViewportEvents(){
  const vpInner = document.getElementById('viewportInner');
  const gridCanvas = document.getElementById('gridCanvas');

  gridCanvas.addEventListener('mousedown', (e)=>{
    if (running) stopRun(false); // any click always works - stop a live run instead of ignoring the click
    const {gx,gy} = cellFromEvent(e, vpInner);
    if (gx<0||gy<0||gx>=gridW||gy>=gridH) return;
    const existing = editGrid[gy][gx];
    if (selected && selected.type === 'eraser'){ painting = true; eraseCell(gx,gy); return; }
    if (existing && !dragGhost){
      // don't know yet if this is a click (rotate) or a drag (move/remove) - mousemove decides
      dragBrickFrom = { brick: existing, fromGx: gx, fromGy: gy, startX: e.clientX, startY: e.clientY, moved: false };
      return;
    }
    if (selected){ painting = true; applyPaint(gx,gy); }
  });
  window.addEventListener('mousemove', (e)=>{
    if (dragBrickFrom && !dragBrickFrom.moved){
      const dist = Math.hypot(e.clientX-dragBrickFrom.startX, e.clientY-dragBrickFrom.startY);
      if (dist > 6){
        dragBrickFrom.moved = true;
        // pick it up off its old spot - it's either going somewhere else on the board,
        // or off the edge to be thrown away, same as dragging a brick in the real game
        editGrid[dragBrickFrom.fromGy][dragBrickFrom.fromGx] = null;
        if (dragBrickFrom.brick.type==='start' && startXY && startXY.x===dragBrickFrom.fromGx && startXY.y===dragBrickFrom.fromGy) startXY=null;
        if (dragBrickFrom.brick.type==='finish' && finishXY && finishXY.x===dragBrickFrom.fromGx && finishXY.y===dragBrickFrom.fromGy) finishXY=null;
        markDirty(); renderGrid();
        showDragPreview(dragBrickFrom.brick.type, dragBrickFrom.brick.rot, e.clientX, e.clientY);
      }
    }
    if (dragBrickFrom && dragBrickFrom.moved) moveDragPreview(e.clientX, e.clientY);
    if (dragGhost) moveDragPreview(e.clientX, e.clientY);
    if (!painting || running) return;
    const {gx,gy} = cellFromEvent(e, vpInner);
    applyPaint(gx,gy);
  });
  window.addEventListener('mouseup', (e)=>{
    painting = false; dragGhost = null;
    hideDragPreview();
    if (dragBrickFrom){
      if (dragBrickFrom.moved){
        const {gx,gy} = cellFromEvent(e, vpInner);
        if (gx>=0 && gy>=0 && gx<gridW && gy<gridH) setCell(gx,gy, dragBrickFrom.brick);
        else {
          // dropped off the board: it was already lifted off, so it's just gone - that's
          // the delete. setCell never sees this one, so the partner cleanup has to happen here.
          if (dragBrickFrom.brick.type==='portal') destroyPortalPartner(dragBrickFrom.brick);
          markDirty(); renderGrid();
        }
      } else {
        // never actually dragged - treat the click as a rotate, same as before
        dragBrickFrom.brick.rot = (dragBrickFrom.brick.rot + 1) % 4;
        markDirty(); renderGrid();
      }
      dragBrickFrom = null;
    }
  });

  // drag a toolbox brick straight onto the grid
  gridCanvas.addEventListener('mouseup', (e)=>{
    if (running || !dragGhost) return;
    const {gx,gy} = cellFromEvent(e, vpInner);
    setCell(gx,gy, makeBrick(dragGhost.type, dragGhost.rot));
  });
}

/* ================= zoom ================= */
function setZoom(z){
  zoom = Math.max(0.4, Math.min(2.2, z));
  document.getElementById('viewportInner').style.transform = `scale(${zoom})`;
  document.getElementById('zoomLabel').textContent = Math.round(zoom*100)+'%';
}
function fitZoomToViewport(){
  const vp = document.getElementById('viewport');
  const availW = vp.clientWidth - 24, availH = vp.clientHeight - 24; // a little breathing room
  const fit = Math.min(availW/(gridW*CELL), availH/(gridH*CELL));
  setZoom(fit);
}

/* ================= physics ================= */
function cloneRunGrid(){
  return editGrid.map(row => row.map(c => {
    if (!c) return null;
    const meta = {broken:false, used:false, touching:false, breakAt:0};
    // a portal's id and partner are part of what it IS, not runtime state - keep them,
    // or a run would forget who's paired with who
    if (c.type==='portal' && c.meta){ meta.portalId = c.meta.portalId; meta.pairedWith = c.meta.pairedWith; }
    return {type:c.type, rot:c.rot, meta};
  }));
}
function collectPortalPairs(grid){
  // pairs come from each portal's own pairedWith, same as the drawing - not board position
  const pairs = [], seen = new Set();
  for(let y=0;y<grid.length;y++) for(let x=0;x<grid[0].length;x++){
    const c = grid[y][x];
    if (!c || c.type!=='portal' || !c.meta) continue;
    const id = c.meta.portalId, partnerId = c.meta.pairedWith;
    if (partnerId == null || seen.has(id)) continue;
    outer:
    for(let yy=0;yy<grid.length;yy++) for(let xx=0;xx<grid[0].length;xx++){
      const p = grid[yy][xx];
      if (p && p.type==='portal' && p.meta && p.meta.portalId===partnerId){
        pairs.push([{x,y},{x:xx,y:yy}]);
        seen.add(id); seen.add(partnerId);
        break outer;
      }
    }
  }
  return pairs;
}
function makeMarble(x,y,vx,vy,color){
  return { x,y,vx,vy, r: CELL*0.28, color: color||'#d94c3d', lastCellX:null, lastCellY:null,
           portalCooldown:0, dead:false, won:false,
           fanDir:null, fanActive:false, fanStartX:0, fanStartY:0 };
}

function cellAt(grid,gx,gy){ if(gx<0||gy<0||gy>=grid.length||gx>=grid[0].length) return null; return grid[gy][gx]; }

function startRun(){
  if (!startXY || !finishXY){
    alert(!startXY ? "Put down a Start block first!" : "Put down a Finish block first!");
    return;
  }
  running = true; finished = false;
  document.getElementById('finishBanner').style.display = 'none';
  runGrid = cloneRunGrid();
  portalPairs = collectPortalPairs(runGrid);
  gravityDir = {x:0,y:1};
  activeGravSwitch = null;
  const sx = startXY.x*CELL+CELL/2, sy = startXY.y*CELL+CELL/2;
  marbles = [ makeMarble(sx, sy-CELL*0.1, 0, 0) ];
  lastTime = performance.now();
  runStartedAt = lastTime;
  const rb = document.getElementById('runBtn');
  rb.textContent = '⏹ Stop'; rb.style.background = '#c0392b';
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(physicsLoop);
}
function stopRun(won){
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  const rb = document.getElementById('runBtn');
  rb.textContent = '▶ Run'; rb.style.background = '';
  renderGrid(); // back to the clean, unbroken board - ready to edit again
  if (won){
    finished = true; dirty = false;
    document.getElementById('finishBanner').style.display = 'block';
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveBtn').classList.add('ready');
  }
}

let lastTime = 0, runStartedAt = 0;
const GRAVITY_ACCEL = 1700;
const MAX_SPEED = 2600;
const MAX_RUN_MS = 12000; // safety: if nothing finishes or falls off in 12s, stop so you can edit again
const FAN_SPEED = 650;         // top speed the speed-up pushes you toward - a nudge, not a takeover
const FAN_PUSH = 1100;         // weaker than gravity itself, so it adds to your motion, not override it
const FAN_RANGE = CELL * 10;   // how far the wind reaches before it lets go ("10 blocks")
const FAN_WINDDOWN = 0.1;      // fraction of fan-speed left after 1 full second once out of range

function physicsLoop(now){
  const dt = Math.min(0.032, (now-lastTime)/1000);
  lastTime = now;
  if (now - runStartedAt > MAX_RUN_MS){ stopRun(false); return; }
  let anyAlive = false;
  marbles.forEach(m=>{ if(!m.dead && !m.won){ anyAlive=true; stepMarble(m, dt); }});
  renderGridFrom(runGrid); // so a crack, a used dispenser, a lit-up gravity switch actually show
  renderMarbles();
  if (!anyAlive){ stopRun(marbles.some(m=>m.won)); return; }
  rafId = requestAnimationFrame(physicsLoop);
}

function stepMarble(m, dt){
  const steps = Math.max(1, Math.min(8, Math.ceil((Math.hypot(m.vx,m.vy)*dt)/(CELL*0.25))));
  const sdt = dt/steps;
  for(let i=0;i<steps;i++) subStep(m, sdt);
}

function subStep(m, dt){
  m.vx += gravityDir.x*GRAVITY_ACCEL*dt;
  m.vy += gravityDir.y*GRAVITY_ACCEL*dt;

  // the fan: pushes toward FAN_SPEED along its own direction, like wind on a feather - works
  // even from a standstill, keeps blowing for FAN_RANGE, then fades out instead of cutting off
  if (m.fanActive){
    const cur = m.vx*m.fanDir.x + m.vy*m.fanDir.y;
    if (cur < FAN_SPEED){
      const push = Math.min(FAN_PUSH*dt, FAN_SPEED-cur);
      m.vx += m.fanDir.x*push; m.vy += m.fanDir.y*push;
    }
    if (Math.hypot(m.x-m.fanStartX, m.y-m.fanStartY) >= FAN_RANGE) m.fanActive = false;
  } else if (m.fanDir){
    const cur = m.vx*m.fanDir.x + m.vy*m.fanDir.y;
    if (cur > 2){
      const decayed = cur * Math.pow(FAN_WINDDOWN, dt);
      m.vx += m.fanDir.x*(decayed-cur); m.vy += m.fanDir.y*(decayed-cur);
    } else {
      m.fanDir = null;
    }
  }

  const speed = Math.hypot(m.vx,m.vy);
  if (speed > MAX_SPEED){ m.vx *= MAX_SPEED/speed; m.vy *= MAX_SPEED/speed; }

  m.x += m.vx*dt; m.y += m.vy*dt;

  // the board's own edge is a wall all the way round - sides and top bounce a little,
  // the bottom is solid ground the marble comes to rest on, same as any other floor
  if (m.x < m.r) { m.x = m.r; m.vx = Math.abs(m.vx)*0.3; }
  if (m.x > gridW*CELL-m.r) { m.x = gridW*CELL-m.r; m.vx = -Math.abs(m.vx)*0.3; }
  if (m.y < m.r) { m.y = m.r; m.vy = Math.abs(m.vy)*0.3; }
  if (m.y > gridH*CELL-m.r) { m.y = gridH*CELL-m.r; if (m.vy>0) m.vy = 0; }

  const gx = Math.floor(m.x/CELL), gy = Math.floor(m.y/CELL);
  resolveCollisions(m, gx, gy);
  handleTriggers(m, gx, gy);
}

function resolveCollisions(m, gx, gy){
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    const cell = cellAt(runGrid, gx+dx, gy+dy);
    if (!cell) continue;
    collideWithCell(m, gx+dx, gy+dy, cell);
  }
}

function collideWithCell(m, cx, cy, cell){
  const ox = cx*CELL, oy = cy*CELL; // cell origin px
  if (cell.type==='solid'){
    collideAABB(m, ox, oy, CELL, CELL, 0.15);
  } else if (cell.type==='ramp'){
    collideRamp(m, ox, oy, cell.rot);
  } else if (cell.type==='curve'){
    collideCurve(m, ox, oy, cell.rot);
  } else if (cell.type==='oneway'){
    collideOneway(m, ox, oy, cell);
  } else if (cell.type==='flat'){
    collideThinStrip(m, ox, oy, cell.rot);
  } else if (cell.type==='gravswitch'){
    // a real brick - the marble can't pass through it, but touching it still flips gravity
    if (collideAABB(m, ox, oy, CELL, CELL, 0.15)){
      gravityDir = DIRS[cell.rot]; activeGravSwitch = {x:cx,y:cy}; cell.meta.active = true;
    }
  } else if (cell.type==='dispenser'){
    // a real brick too - solid, but still fires its one marble on contact
    if (collideAABB(m, ox, oy, CELL, CELL, 0.15) && !cell.meta.used){
      cell.meta.used = true;
      const f = DIRS[cell.rot];
      // spawn just outside the dispenser's own edge (not dead-centre in it), so the new
      // marble doesn't instantly re-collide with the solid block it was just fired from
      const spawnX = cx*CELL+CELL/2 + f.x*(CELL*0.5+12), spawnY = cy*CELL+CELL/2 + f.y*(CELL*0.5+12);
      marbles.push(makeMarble(spawnX, spawnY, f.x*900, f.y*900, '#e67e22'));
    }
  } else if (['finish','spring'].includes(cell.type)){
    collideThinStrip(m, ox, oy, 0); // always sit as a floor; rot is only the "facing" for its effect
  } else if (cell.type==='breakable' && !cell.meta.broken){
    // a real solid brick - cracks the moment it's touched, gone a second later
    if (collideAABB(m, ox, oy, CELL, CELL, 0.15) && !cell.meta.breakAt){
      cell.meta.breakAt = performance.now() + 1000;
    }
  } else if (cell.type==='portal'){
    // a real solid half-block, like the others above. Touching its flat back is just a
    // wall - only touching it from the notch's open side warps the marble to its partner
    if (collidePortal(m, ox, oy, cell) && m.portalCooldown<=0){
      const pair = portalPairs.find(p => (p[0].x===cx&&p[0].y===cy) || (p[1].x===cx&&p[1].y===cy));
      if (pair){
        const dest = (pair[0].x===cx&&pair[0].y===cy) ? pair[1] : pair[0];
        const destCell = cellAt(runGrid, dest.x, dest.y);
        const facing = DIRS[(portalEffRot(destCell)+2)%4]; // out through the notch, not into the block
        const speed = Math.max(Math.hypot(m.vx,m.vy), 300); // always a real push out, even from a stop
        m.x = dest.x*CELL+CELL/2; m.y = dest.y*CELL+CELL/2;
        m.vx = facing.x*speed; m.vy = facing.y*speed;
        m.portalCooldown = 14;
      }
    }
  }
  // speedup and broken breakable: no collider at all (pass through) - speedup landing
  // on a floor first would zero its speed before the boost ever multiplied it
}
function collidePortal(m, ox, oy, cell){
  // solid only where the drawn block is - flush to whichever edge portalEffRot points at
  const h = CELL/2;
  let rx=ox, ry=oy, rw=CELL, rh=h;
  const effRot = portalEffRot(cell);
  if (effRot===2){ ry = oy+CELL-h; }
  else if (effRot===1){ rx = ox+CELL-h; rw=h; rh=CELL; }
  else if (effRot===3){ rw=h; rh=CELL; }
  // which side the marble is coming from, checked before the solid push-back moves it -
  // the notch only works from its open side, same as the real toy; the flat back is a wall
  const notchFacing = DIRS[(effRot+2)%4];
  const bcx = ox+CELL/2, bcy = oy+CELL/2;
  const fromOpenSide = (m.x-bcx)*notchFacing.x + (m.y-bcy)*notchFacing.y > 0;
  const touching = collideAABB(m, rx, ry, rw, rh, 0.15);
  return touching && fromOpenSide;
}

function collideAABB(m, ox, oy, w, h, restitution){
  const cx = Math.max(ox, Math.min(m.x, ox+w));
  const cy = Math.max(oy, Math.min(m.y, oy+h));
  const dx = m.x-cx, dy = m.y-cy;
  const dist = Math.hypot(dx,dy);
  if (dist < m.r && dist > 0.0001){
    const nx = dx/dist, ny = dy/dist;
    const pen = m.r-dist;
    m.x += nx*pen; m.y += ny*pen;
    const vn = m.vx*nx + m.vy*ny;
    if (vn < 0){ m.vx -= (1+restitution)*vn*nx; m.vy -= (1+restitution)*vn*ny; }
  } else if (dist===0){
    m.y -= m.r; m.vy = 0;
  }
  return dist < m.r + 1.5; // "is the marble touching this block" — used by solid bricks with an effect
}
// Solid-half-plane collision against the cell's diagonal: pushes the marble out to the
// empty side and keeps only its tangential (along-the-slope) velocity — a frictionless slide.
// Used for both 'ramp' (straight) and 'curve' (same collision, rounder look only).
function collideDiagonal(m, ox, oy, x1,y1,x2,y2, solidPx,solidPy){
  const ex=x2-x1, ey=y2-y1, len=Math.hypot(ex,ey)||1;
  const tx=ex/len, ty=ey/len;
  let nx=-ty, ny=tx; // perpendicular to the diagonal
  if ( (solidPx-x1)*nx + (solidPy-y1)*ny > 0 ){ nx=-nx; ny=-ny; } // make nx,ny point AWAY from solid
  // only act near this cell, so the infinite line doesn't reach into unrelated areas
  if (m.x < ox-CELL*0.6 || m.x > ox+CELL*1.6 || m.y < oy-CELL*0.6 || m.y > oy+CELL*1.6) return;
  const rel = (m.x-x1)*nx + (m.y-y1)*ny; // signed distance to the line; positive = empty side
  if (rel >= m.r) return;
  const pen = m.r-rel;
  m.x += nx*pen; m.y += ny*pen;
  const vn = m.vx*nx+m.vy*ny;
  if (vn < 0){ m.vx -= vn*nx; m.vy -= vn*ny; } // remove only the into-surface component
}
function rampGeometry(rot){
  const [ax,ay,bx,by] = rotatePoints(0,0,1,1,rot);
  const [slx,sly] = rotatePoint(0.04, 0.96, rot);
  return {ax,ay,bx,by,slx,sly};
}
function collideRamp(m, ox, oy, rot){
  const g = rampGeometry(rot);
  collideDiagonal(m, ox, oy, ox+g.ax*CELL, oy+g.ay*CELL, ox+g.bx*CELL, oy+g.by*CELL, ox+g.slx*CELL, oy+g.sly*CELL);
}
function collideCurve(m, ox, oy, rot){
  // same solid-half physics as a ramp; only the drawn icon is rounded
  collideRamp(m, ox, oy, rot);
}
function collideThinStrip(m, ox, oy, rot){
  const t = CELL*0.22;
  let rx=ox, ry=oy, rw=CELL, rh=t;
  if (rot===0){ ry = oy+CELL-t; }
  else if (rot===2){ ry = oy; }
  else if (rot===1){ rx = ox+CELL-t; rw=t; rh=CELL; }
  else if (rot===3){ rw=t; rh=CELL; }
  collideAABB(m, rx, ry, rw, rh, 0.1);
}
function collideOneway(m, ox, oy, cell){
  const facing = DIRS[cell.rot];
  const horizontal = facing.y !== 0; // gate wall is perpendicular to travel axis
  const t = CELL*0.18;
  let rx=ox, ry=oy, rw=CELL, rh=t;
  if (horizontal){ ry = oy+CELL/2-t/2; } else { rx = ox+CELL/2-t/2; rw=t; rh=CELL; }
  const cx = Math.max(rx, Math.min(m.x, rx+rw));
  const cy = Math.max(ry, Math.min(m.y, ry+rh));
  const dx=m.x-cx, dy=m.y-cy, dist=Math.hypot(dx,dy);
  if (dist >= m.r) return;
  const travel = m.vx*facing.x + m.vy*facing.y; // speed along the allowed direction
  if (travel > 90) return; // fast enough the right way: let it straight through, no push-out
  // either wrong way, or too slow: act as a wall
  const nx = dist>0? dx/dist : -facing.x, ny = dist>0? dy/dist : -facing.y;
  const pen = m.r-dist;
  m.x += nx*pen; m.y += ny*pen;
  m.vx = 0; m.vy = 0;
}
function rotatePoint(x,y,rot){
  // rotate point around cell center (0.5,0.5) in unit-cell space, rot*90deg clockwise
  let px=x-0.5, py=y-0.5;
  for(let i=0;i<rot;i++){ const nx=-py, ny=px; px=nx; py=ny; }
  return [px+0.5, py+0.5];
}
function rotatePoints(ax,ay,bx,by,rot){
  const [rax,ray]=rotatePoint(ax,ay,rot), [rbx,rby]=rotatePoint(bx,by,rot);
  return [rax,ray,rbx,rby];
}

function handleTriggers(m, gx, gy){
  const cell = cellAt(runGrid, gx, gy);
  const enteredNewCell = (gx!==m.lastCellX || gy!==m.lastCellY);
  // breakable's own on-off tracking now happens in subStep, from contact, not this cell lookup

  if (enteredNewCell && cell){
    if (cell.type==='finish'){ m.won = true; m.color = '#2e9e4f'; stopRun(true); }
    else if (cell.type==='spring'){
      const up = {x:-gravityDir.x,y:-gravityDir.y};
      m.vx = up.x*1500; m.vy = up.y*1500;
    } else if (cell.type==='speedup'){
      m.fanDir = DIRS[cell.rot];
      m.fanActive = true;
      m.fanStartX = m.x; m.fanStartY = m.y;
    // gravswitch, dispenser and portal are solid now - they fire from contact in
    // collideWithCell instead
    }
  }
  if (m.portalCooldown>0) m.portalCooldown--;
  m.lastCellX = gx; m.lastCellY = gy;

  // fire any scheduled breaks, and clear away any that finished shattering a second ago
  for(let yy=0; yy<runGrid.length; yy++) for(let xx=0; xx<runGrid[0].length; xx++){
    const c = runGrid[yy][xx];
    if (!c || c.type!=='breakable') continue;
    if (c.meta.breakAt && !c.meta.broken && performance.now()>=c.meta.breakAt){
      c.meta.broken = true;
      c.meta.brokenAt = performance.now();
    } else if (c.meta.broken && performance.now()-c.meta.brokenAt >= 1000){
      runGrid[yy][xx] = null;
    }
  }
}

function renderMarbles(){
  marbleCtx.clearRect(0,0,gridW*CELL,gridH*CELL);
  marbles.forEach(m=>{
    if (m.dead) return;
    marbleCtx.fillStyle = m.color;
    marbleCtx.beginPath(); marbleCtx.arc(m.x,m.y,m.r,0,Math.PI*2); marbleCtx.fill();
    marbleCtx.strokeStyle='rgba(0,0,0,.25)'; marbleCtx.lineWidth=1.5; marbleCtx.stroke();
  });
}

/* ================= save / gallery ================= */
const STORE_KEY = 'jos-marble-run-builder-tracks';
function loadTracks(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY))||[]; }catch(e){ return []; } }
function saveTracks(list){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }catch(e){} }

function makeThumbnail(){
  const cv = document.createElement('canvas');
  cv.width = 190; cv.height = 120;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f0c419'; ctx.fillRect(0,0,190,120);
  const sx = 190/(gridW*CELL), sy = 120/(gridH*CELL), sc = Math.min(sx,sy);
  const ox=(190-gridW*CELL*sc)/2, oy=(120-gridH*CELL*sc)/2;
  ctx.save(); ctx.translate(ox,oy); ctx.scale(sc,sc);
  ctx.drawImage(document.getElementById('gridCanvas'), 0, 0);
  ctx.restore();
  return cv.toDataURL('image/png');
}

function openSaveDialog(){
  if (!finished) return;
  document.getElementById('trackNameInput').value = '';
  document.getElementById('trackUserInput').value = localStorage.getItem('jos-marble-last-user') || 'Jos';
  document.getElementById('saveModal').classList.add('active');
}
function confirmSave(){
  const name = document.getElementById('trackNameInput').value.trim() || 'Untitled Track';
  const user = document.getElementById('trackUserInput').value.trim() || 'Jos';
  localStorage.setItem('jos-marble-last-user', user);
  const tracks = loadTracks();
  tracks.unshift({
    id: Date.now().toString(36),
    name, user, w:gridW, h:gridH,
    grid: editGrid, startXY, finishXY,
    thumb: makeThumbnail(), savedAt: new Date().toISOString()
  });
  saveTracks(tracks);
  document.getElementById('saveModal').classList.remove('active');
  renderGallery();
}

function renderGallery(){
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  const tracks = loadTracks();
  if (!tracks.length){
    grid.innerHTML = '<div class="gallery-empty">No saved tracks yet — build one and finish it to save!</div>';
    return;
  }
  tracks.forEach(t=>{
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `<img class="thumb" src="${t.thumb}"><div class="info"><div class="tname">${escapeHtml(t.name)}</div><div class="tuser">by ${escapeHtml(t.user)}</div></div>`;
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const editBtn = document.createElement('button'); editBtn.textContent='✏️ Edit';
    editBtn.addEventListener('click', (e)=>{ e.stopPropagation(); loadTrackForEdit(t); });
    const viewBtn = document.createElement('button'); viewBtn.textContent='👁️ View'; viewBtn.style.background='#8e44ad';
    viewBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openViewMode(t); });
    const delBtn = document.createElement('button'); delBtn.textContent='🗑'; delBtn.style.background='#c0392b';
    delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); if(confirm('Delete "'+t.name+'"?')){ saveTracks(loadTracks().filter(x=>x.id!==t.id)); renderGallery(); } });
    actions.append(editBtn, viewBtn, delBtn);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function loadTrackForEdit(t){
  gridW=t.w; gridH=t.h; editGrid=t.grid; startXY=t.startXY; finishXY=t.finishXY;
  recomputePortalState(editGrid);
  document.getElementById('sizeTag').textContent = gridW+'×'+gridH;
  showScreen('builderScreen');
  sizeCanvases(); fitZoomToViewport(); renderGrid(); markDirty();
}

/* ---------------- view mode (fullscreen, playback only) ---------------- */
let viewGrid=null, viewZoom=1, viewMarbles=[], viewRunning=false, viewRaf=null;
function openViewMode(t){
  viewGrid = t.grid; gridWv=t.w; gridHv=t.h;
  showScreen('viewScreen');
  const cv = document.getElementById('viewGridCanvas'), mc = document.getElementById('viewMarbleCanvas');
  cv.width=mc.width=t.w*CELL; cv.height=mc.height=t.h*CELL;
  document.getElementById('viewInner').style.width=cv.width+'px';
  document.getElementById('viewInner').style.height=cv.height+'px';
  const vp = document.getElementById('viewViewport');
  viewZoom = Math.min(1, Math.min((vp.clientWidth-24)/cv.width, (vp.clientHeight-24)/cv.height));
  document.getElementById('viewInner').style.transform = `scale(${viewZoom})`;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  for(let y=0;y<t.h;y++) for(let x=0;x<t.w;x++){
    const b = t.grid[y][x]; if(!b) continue;
    let meta = b.meta ? Object.assign({}, b.meta) : {};
    drawBrick(ctx, x*CELL+CELL/2, y*CELL+CELL/2, CELL*0.92, b.type, b.rot, meta);
  }
  document.getElementById('viewRunBtn').onclick = ()=> runViewTrack(t);
}
let gridWv=10, gridHv=10;
function runViewTrack(t){
  const savedW=gridW, savedH=gridH, savedEdit=editGrid, savedStart=startXY, savedFinish=finishXY, savedRunning=running;
  gridW=t.w; gridH=t.h; editGrid=t.grid; startXY=t.startXY; finishXY=t.finishXY;
  runGrid = cloneRunGrid();
  portalPairs = collectPortalPairs(runGrid);
  gravityDir = {x:0,y:1};
  const sx = startXY.x*CELL+CELL/2, sy = startXY.y*CELL+CELL/2;
  marbles = [ makeMarble(sx, sy-CELL*0.1, 0, 0) ];
  const vcanvas = document.getElementById('viewMarbleCanvas');
  const savedGridCtx = gridCtx, savedMarbleCtx = marbleCtx;
  marbleCtx = vcanvas.getContext('2d');
  gridCtx = document.getElementById('viewGridCanvas').getContext('2d');
  running = true;
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(function loop(now){
    const dt = Math.min(0.032,(now-lastTime)/1000); lastTime=now;
    let anyAlive=false;
    marbles.forEach(m=>{ if(!m.dead && !m.won){ anyAlive=true; stepMarble(m,dt); }});
    renderGridFrom(runGrid); // so a crack, a used dispenser etc. actually show up here too
    renderMarbles();
    if (!anyAlive){ running=false; gridW=savedW; gridH=savedH; editGrid=savedEdit; startXY=savedStart; finishXY=savedFinish; gridCtx=savedGridCtx; marbleCtx=savedMarbleCtx; return; }
    rafId = requestAnimationFrame(loop);
  });
}

/* ================= screen management ================= */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ================= wire up UI ================= */
function init(){
  buildToolbox();
  gridCtx = document.getElementById('gridCanvas').getContext('2d');
  marbleCtx = document.getElementById('marbleCanvas').getContext('2d');
  initViewportEvents();

  let pickW=10;
  function updateSizeLabel(){ document.getElementById('sizeLabel').textContent = pickW+' × '+pickW; }
  document.getElementById('wMinus').onclick = ()=>{ pickW=Math.max(6,pickW-2); updateSizeLabel(); };
  document.getElementById('wPlus').onclick  = ()=>{ pickW=Math.min(40,pickW+2); updateSizeLabel(); };
  document.getElementById('startBuildBtn').onclick = ()=>{
    gridW=pickW; gridH=pickW; editGrid=makeGrid(gridW,gridH); startXY=null; finishXY=null;
    resetPortalState();
    document.getElementById('sizeTag').textContent = gridW+'×'+gridH;
    showScreen('builderScreen'); sizeCanvases(); fitZoomToViewport();
    placeDefaultStartFinish();
    renderGrid(); markDirty();
  };
  document.getElementById('openGalleryBtn').onclick = ()=>{ renderGallery(); showScreen('galleryScreen'); };
  document.getElementById('galleryBtn').onclick = ()=>{ renderGallery(); showScreen('galleryScreen'); };
  document.getElementById('galleryBackBtn').onclick = ()=> showScreen('builderScreen');

  document.getElementById('runBtn').onclick = ()=> running ? stopRun(false) : startRun();
  document.getElementById('clearBtn').onclick = ()=>{
    if (running) stopRun(false);
    editGrid = makeGrid(gridW,gridH); startXY=null; finishXY=null;
    resetPortalState();
    placeDefaultStartFinish();
    markDirty(); renderGrid();
    marbles = []; // wipe any dispensed balls left sitting on screen from the last run
    marbleCtx.clearRect(0,0,gridW*CELL,gridH*CELL);
  };
  document.getElementById('saveBtn').onclick = openSaveDialog;
  document.getElementById('saveConfirmBtn').onclick = confirmSave;
  document.getElementById('saveCancelBtn').onclick = ()=> document.getElementById('saveModal').classList.remove('active');
  document.getElementById('helpBtn').onclick = ()=> alert(
    "Click a brick to pick it up. Click it again (in the box or on the grid) to spin it 90°.\n"+
    "Drag a brick onto the grid to place it. Hold the mouse down and drag across the grid to paint lots at once.\n"+
    "Use the eraser the same way to remove bricks.\n"+
    "Put down one Start and one Finish, then press Run!"
  );
  document.getElementById('zoomIn').onclick = ()=> setZoom(zoom+0.2);
  document.getElementById('zoomOut').onclick = ()=> setZoom(zoom-0.2);
  document.getElementById('viewExit').onclick = ()=> showScreen('galleryScreen');
  document.getElementById('viewZoomOut').onclick = ()=> {
    viewZoom = Math.max(0.3, viewZoom-0.2);
    document.getElementById('viewInner').style.transform = `scale(${viewZoom})`;
  };
}
document.addEventListener('DOMContentLoaded', init);
})();
