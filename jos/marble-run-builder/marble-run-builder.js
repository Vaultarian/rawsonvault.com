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
const IMG_NATIVE_DIR = { dispenser: 2 };

const BASIC   = ['solid','ramp','ramp2','curve','flat','start','finish'];
const SPECIAL = ['spring','oneway','portal','breakable','speedup','gravswitch','dispenser'];
const NAMES = {
  solid:'Block', ramp:'Ramp', ramp2:'Ramp', curve:'Curve', flat:'Flat',
  start:'Start', finish:'Finish', spring:'Spring', oneway:'One-Way',
  portal:'Portal', breakable:'Breakable', speedup:'Speed Up',
  gravswitch:'Gravity', dispenser:'Dispenser', eraser:'Eraser'
};
const SINGLETON = { start:true, finish:true }; // only one of these allowed on the board

/* real screenshots of the actual marblerun.at bricks — used instead of drawn icons */
const IMG_TYPES = ['spring','oneway','portal','breakable','speedup','gravswitch','dispenser','eraser'];
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
let dragBrickFrom = null;   // {x,y} when dragging an existing placed brick
let dragGhost = null;       // currently-dragged toolbox brick (drag & drop placement)

let running = false;
let runGrid = null, marbles = [], gravityDir = {x:0,y:1}, activeGravSwitch = null;
let finished = false, dirty = false, rafId = null, portalPairs = [];

function makeGrid(w,h){ return Array.from({length:h},()=>Array.from({length:w},()=>null)); }

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
  slot.addEventListener('mousedown', (e) => { dragGhost = {type, rot:slot._rot}; });
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
    case 'ramp': case 'ramp2':
      ctx.rotate(angle);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      if (type==='ramp'){ ctx.moveTo(-s,-s); ctx.lineTo(-s,s); ctx.lineTo(s,s); }
      else { ctx.moveTo(s,-s); ctx.lineTo(-s,s); ctx.lineTo(s,s); }
      ctx.closePath(); ctx.fill();
      break;
    case 'curve':
      ctx.rotate(angle);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.moveTo(-s,s); ctx.arc(-s,s,size,-Math.PI/2,0); ctx.closePath(); ctx.fill();
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
    case 'spring': case 'oneway': case 'portal': case 'breakable':
    case 'speedup': case 'gravswitch': case 'dispenser': case 'eraser': {
      const img = BRICK_IMAGES[type];
      let alpha = 1;
      if (type==='dispenser' && meta && meta.used) alpha = 0.3;
      if (type==='breakable' && meta && meta.broken) alpha = 0.15;
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
  if (brick && SINGLETON[brick.type]){
    const prev = brick.type==='start' ? startXY : finishXY;
    if (prev) editGrid[prev.y][prev.x] = null;
    if (brick.type==='start') startXY = {x:gx,y:gy}; else finishXY = {x:gx,y:gy};
  } else {
    const old = editGrid[gy][gx];
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
function renderGrid(){
  gridCtx.clearRect(0,0,gridW*CELL,gridH*CELL);
  gridCtx.strokeStyle = 'rgba(0,0,0,.12)'; gridCtx.lineWidth=1;
  for(let x=0;x<=gridW;x++){ gridCtx.beginPath(); gridCtx.moveTo(x*CELL+.5,0); gridCtx.lineTo(x*CELL+.5,gridH*CELL); gridCtx.stroke(); }
  for(let y=0;y<=gridH;y++){ gridCtx.beginPath(); gridCtx.moveTo(0,y*CELL+.5); gridCtx.lineTo(gridW*CELL,y*CELL+.5); gridCtx.stroke(); }
  for(let y=0;y<gridH;y++) for(let x=0;x<gridW;x++){
    const b = editGrid[y][x];
    if (!b) continue;
    let meta = {};
    if (b.type==='portal') meta.paired = portalLinked(x,y,editGrid);
    drawBrick(gridCtx, x*CELL+CELL/2, y*CELL+CELL/2, CELL*0.92, b.type, b.rot, meta);
  }
}
function portalLinked(x,y,grid){
  const all = [];
  for(let yy=0; yy<grid.length; yy++) for(let xx=0; xx<grid[0].length; xx++)
    if (grid[yy][xx] && grid[yy][xx].type==='portal') all.push({x:xx,y:yy});
  const idx = all.findIndex(p=>p.x===x&&p.y===y);
  return idx>=0 && idx < (all.length - (all.length%2));
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
  else setCell(gx,gy,{type:selected.type, rot:selected.rot});
}

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
      // click an existing brick: rotate it in place
      existing.rot = (existing.rot + 1) % 4;
      markDirty(); renderGrid();
      return;
    }
    if (selected){ painting = true; applyPaint(gx,gy); }
  });
  window.addEventListener('mousemove', (e)=>{
    if (!painting || running) return;
    const {gx,gy} = cellFromEvent(e, vpInner);
    applyPaint(gx,gy);
  });
  window.addEventListener('mouseup', ()=>{ painting = false; dragGhost = null; });

  // drag a toolbox brick straight onto the grid
  gridCanvas.addEventListener('mouseup', (e)=>{
    if (running || !dragGhost) return;
    const {gx,gy} = cellFromEvent(e, vpInner);
    setCell(gx,gy,{type:dragGhost.type, rot:dragGhost.rot});
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
  return editGrid.map(row => row.map(c => c ? {type:c.type, rot:c.rot, meta:{broken:false, used:false, touching:false, breakAt:0}} : null));
}
function collectPortalPairs(grid){
  const all = [];
  for(let y=0;y<grid.length;y++) for(let x=0;x<grid[0].length;x++)
    if (grid[y][x] && grid[y][x].type==='portal') all.push({x,y});
  const pairs = [];
  for(let i=0;i+1<all.length;i+=2) pairs.push([all[i], all[i+1]]);
  return pairs;
}
function makeMarble(x,y,vx,vy,color){
  return { x,y,vx,vy, r: CELL*0.28, color: color||'#d94c3d', lastCellX:null, lastCellY:null,
           portalCooldown:0, breakTrack:null, touchBreakThisStep:null, dead:false, won:false };
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

function physicsLoop(now){
  const dt = Math.min(0.032, (now-lastTime)/1000);
  lastTime = now;
  if (now - runStartedAt > MAX_RUN_MS){ stopRun(false); return; }
  let anyAlive = false;
  marbles.forEach(m=>{ if(!m.dead && !m.won){ anyAlive=true; stepMarble(m, dt); }});
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
  m.touchBreakThisStep = null;
  resolveCollisions(m, gx, gy);
  // breakable is solid now - track contact (not centre-cell) so it still breaks on-off
  if (m.breakTrack && (!m.touchBreakThisStep || m.touchBreakThisStep.x!==m.breakTrack.x || m.touchBreakThisStep.y!==m.breakTrack.y)){
    const bc = cellAt(runGrid, m.breakTrack.x, m.breakTrack.y);
    if (bc && bc.type==='breakable' && !bc.meta.broken && !bc.meta.breakAt){
      bc.meta.breakAt = performance.now()+1000;
    }
  }
  m.breakTrack = m.touchBreakThisStep;
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
  } else if (cell.type==='ramp' || cell.type==='ramp2'){
    collideRamp(m, ox, oy, cell.type, cell.rot);
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
    // a real solid brick too - it just breaks once the marble has been on it and left
    if (collideAABB(m, ox, oy, CELL, CELL, 0.15)) m.touchBreakThisStep = {x:cx,y:cy};
  }
  // speedup, portal, and broken breakable: no collider at all (pass through) - speedup landing
  // on a floor first would zero its speed before the boost ever multiplied it
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
// Used for both 'ramp'/'ramp2' (straight) and 'curve' (same collision, rounder look only).
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
function rampGeometry(type, rot){
  const pts = type==='ramp2' ? [[1,0],[0,1]] : [[0,0],[1,1]];
  const solidLocal = type==='ramp2' ? [0.96,0.96] : [0.04,0.96];
  const [ax,ay,bx,by] = rotatePoints(pts[0][0],pts[0][1],pts[1][0],pts[1][1],rot);
  const [slx,sly] = rotatePoint(solidLocal[0], solidLocal[1], rot);
  return {ax,ay,bx,by,slx,sly};
}
function collideRamp(m, ox, oy, type, rot){
  const g = rampGeometry(type, rot);
  collideDiagonal(m, ox, oy, ox+g.ax*CELL, oy+g.ay*CELL, ox+g.bx*CELL, oy+g.by*CELL, ox+g.slx*CELL, oy+g.sly*CELL);
}
function collideCurve(m, ox, oy, rot){
  // same solid-half physics as a ramp; only the drawn icon is rounded
  collideRamp(m, ox, oy, 'ramp', rot);
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
      m.vx *= 1.6; m.vy *= 1.6;
    // gravswitch and dispenser are solid now - they fire from contact in collideWithCell instead
    } else if (cell.type==='portal' && m.portalCooldown<=0){
      const pair = portalPairs.find(p => (p[0].x===gx&&p[0].y===gy) || (p[1].x===gx&&p[1].y===gy));
      if (pair){
        const dest = (pair[0].x===gx&&pair[0].y===gy) ? pair[1] : pair[0];
        const destCell = cellAt(runGrid, dest.x, dest.y);
        const facing = DIRS[destCell.rot];
        const speed = Math.hypot(m.vx,m.vy);
        m.x = dest.x*CELL+CELL/2; m.y = dest.y*CELL+CELL/2;
        m.vx = facing.x*speed; m.vy = facing.y*speed;
        m.portalCooldown = 14;
      }
    }
  }
  if (m.portalCooldown>0) m.portalCooldown--;
  m.lastCellX = gx; m.lastCellY = gy;

  // fire any scheduled breaks
  for(let yy=0; yy<runGrid.length; yy++) for(let xx=0; xx<runGrid[0].length; xx++){
    const c = runGrid[yy][xx];
    if (c && c.type==='breakable' && c.meta.breakAt && !c.meta.broken && performance.now()>=c.meta.breakAt){
      c.meta.broken = true;
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
  viewZoom = Math.min(1, Math.min(window.innerWidth/cv.width, window.innerHeight/cv.height));
  document.getElementById('viewInner').style.transform = `scale(${viewZoom})`;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  for(let y=0;y<t.h;y++) for(let x=0;x<t.w;x++){
    const b = t.grid[y][x]; if(!b) continue;
    let meta={}; if (b.type==='portal') meta.paired = portalLinked(x,y,t.grid);
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
  marbleCtx = vcanvas.getContext('2d');
  running = true;
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  const origStop = stopRun;
  rafId = requestAnimationFrame(function loop(now){
    const dt = Math.min(0.032,(now-lastTime)/1000); lastTime=now;
    let anyAlive=false;
    marbles.forEach(m=>{ if(!m.dead && !m.won){ anyAlive=true; stepMarble(m,dt); }});
    renderMarbles();
    if (!anyAlive){ running=false; gridW=savedW; gridH=savedH; editGrid=savedEdit; startXY=savedStart; finishXY=savedFinish; marbleCtx=document.getElementById('marbleCanvas').getContext('2d'); return; }
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
