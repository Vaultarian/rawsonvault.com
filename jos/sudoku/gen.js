// Sudoku maker: put random numbers in the grid, check it can be solved, if not try again.
// The grid can be 4 x 4 (boxes 2 x 2), 6 x 6 (boxes 3 tall, 2 wide) or 9 x 9 (boxes 3 x 3).
var N = 9, BH = 3, BW = 3;   // N = size, BH = box height, BW = box width
function setSize(n) {
  N = n; BH = n === 4 ? 2 : 3; BW = n === 9 ? 3 : 2;
}

function canPlace(g, i, n) {
  const r = (i / N) | 0, c = i % N;
  for (let k = 0; k < N; k++) {
    if (g[r * N + k] === n || g[k * N + c] === n) return false;
  }
  const br = r - (r % BH), bc = c - (c % BW);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    if (g[(br + y) * N + bc + x] === n) return false;
  }
  return true;
}

// Returns a solved copy of the grid, or null if it can't be solved (or takes too long).
function solve(g, budget) {
  const grid = g.slice();
  let steps = 0;
  function go() {
    if (++steps > budget) return false;
    let best = -1, bestOpts = null;
    for (let i = 0; i < N * N; i++) {
      if (grid[i]) continue;
      const opts = [];
      for (let n = 1; n <= N; n++) if (canPlace(grid, i, n)) opts.push(n);
      if (opts.length === 0) return false;
      if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; }
      if (opts.length === 1) break;
    }
    if (best === -1) return true;
    for (const n of bestOpts) {
      grid[best] = n;
      if (go()) return true;
      if (steps > budget) return false;
    }
    grid[best] = 0;
    return false;
  }
  return go() ? grid : null;
}

// howMany = how many starting numbers to put in.
function makeSudoku(howMany) {
  for (let tries = 1; ; tries++) {
    const g = new Array(N * N).fill(0);
    let placed = 0, guard = 0;
    while (placed < howMany && guard++ < 1000) {
      const i = (Math.random() * N * N) | 0;
      const n = 1 + ((Math.random() * N) | 0);
      if (!g[i] && canPlace(g, i, n)) { g[i] = n; placed++; }
    }
    const solution = solve(g, 3000);
    if (solution) return { puzzle: g, solution, tries };
  }
}

if (typeof module !== 'undefined') module.exports = { makeSudoku, solve, canPlace, setSize };
