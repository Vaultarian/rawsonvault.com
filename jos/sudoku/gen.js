// Sudoku maker: put random numbers in the grid, check it can be solved, if not try again.
function canPlace(g, i, n) {
  const r = (i / 9) | 0, c = i % 9;
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n || g[k * 9 + c] === n) return false;
  }
  const br = r - (r % 3), bc = c - (c % 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    if (g[(br + y) * 9 + bc + x] === n) return false;
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
    for (let i = 0; i < 81; i++) {
      if (grid[i]) continue;
      const opts = [];
      for (let n = 1; n <= 9; n++) if (canPlace(grid, i, n)) opts.push(n);
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
    const g = new Array(81).fill(0);
    let placed = 0, guard = 0;
    while (placed < howMany && guard++ < 1000) {
      const i = (Math.random() * 81) | 0;
      const n = 1 + ((Math.random() * 9) | 0);
      if (!g[i] && canPlace(g, i, n)) { g[i] = n; placed++; }
    }
    const solution = solve(g, 3000);
    if (solution) return { puzzle: g, solution, tries };
  }
}

if (typeof module !== 'undefined') module.exports = { makeSudoku, solve, canPlace };
