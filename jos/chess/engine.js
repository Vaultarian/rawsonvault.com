/* ===== Jos's Chess: the rules and the robot's brain =====
   Shared by the game (chess/index.html) and the game review (chess/gamereview/). */
// the \uFE0E stops the pawn turning into an emoji
const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟\uFE0E' };
const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
const other = c => c === 'w' ? 'b' : 'w';
const sqName = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));

/* ---------- the position ----------
   The board is a list of 64 squares, 0 = top-left (a8), 63 = bottom-right (h1).
   A piece is a 2-letter code: colour + type, like 'wK' (white king) or 'bP' (black pawn). */
const rc = i => [i >> 3, i & 7];
const at = (r, c) => r * 8 + c;
const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function startPosition() {
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  const b = Array(64).fill(null);
  for (let c = 0; c < 8; c++) {
    b[at(0, c)] = 'b' + back[c]; b[at(1, c)] = 'bP';
    b[at(6, c)] = 'wP'; b[at(7, c)] = 'w' + back[c];
  }
  return { b, turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: -1, quiet: 0 };
}

/* ---------- the rules ---------- */
const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

// is square i attacked by colour `by`?
function attacked(b, i, by) {
  const [r, c] = rc(i);
  const pr = by === 'w' ? r + 1 : r - 1;            // where an attacking pawn would stand
  for (const dc of [-1, 1]) if (onBoard(pr, c + dc) && b[at(pr, c + dc)] === by + 'P') return true;
  for (const [dr, dc] of KNIGHT) if (onBoard(r + dr, c + dc) && b[at(r + dr, c + dc)] === by + 'N') return true;
  for (const [dr, dc] of KING) if (onBoard(r + dr, c + dc) && b[at(r + dr, c + dc)] === by + 'K') return true;
  for (const [dirs, kinds] of [[ROOK, 'RQ'], [BISHOP, 'BQ']]) for (const [dr, dc] of dirs) {
    let rr = r + dr, cc = c + dc;
    while (onBoard(rr, cc)) {
      const p = b[at(rr, cc)];
      if (p) { if (p[0] === by && kinds.includes(p[1])) return true; break; }
      rr += dr; cc += dc;
    }
  }
  return false;
}
const kingAt = (b, col) => b.indexOf(col + 'K');
const inCheck = (s, col) => attacked(s.b, kingAt(s.b, col), other(col));

// every move that follows how the pieces move (before checking whether it leaves your king in check)
function pseudo(s) {
  const b = s.b, me = s.turn, out = [];
  const add = (f, t, extra) => out.push({ f, t, piece: b[f], cap: b[t], ...extra });
  for (let f = 0; f < 64; f++) {
    const p = b[f]; if (!p || p[0] !== me) continue;
    const [r, c] = rc(f), kind = p[1];
    if (kind === 'P') {
      const d = me === 'w' ? -1 : 1, startRow = me === 'w' ? 6 : 1, endRow = me === 'w' ? 0 : 7;
      const promo = rr => rr === endRow ? { promo: 'Q' } : {};
      if (onBoard(r + d, c) && !b[at(r + d, c)]) {
        add(f, at(r + d, c), promo(r + d));
        if (r === startRow && !b[at(r + 2 * d, c)]) add(f, at(r + 2 * d, c), { double: true });
      }
      for (const dc of [-1, 1]) {
        if (!onBoard(r + d, c + dc)) continue;
        const t = at(r + d, c + dc);
        if (b[t] && b[t][0] !== me) add(f, t, promo(r + d));
        if (t === s.ep) add(f, t, { enPassant: true, cap: other(me) + 'P' });
      }
    } else if (kind === 'N' || kind === 'K') {
      for (const [dr, dc] of kind === 'N' ? KNIGHT : KING) {
        if (!onBoard(r + dr, c + dc)) continue;
        const t = at(r + dr, c + dc);
        if (!b[t] || b[t][0] !== me) add(f, t);
      }
      if (kind === 'K') {                             // castling
        const row = me === 'w' ? 7 : 0, them = other(me);
        if (f === at(row, 4) && !attacked(b, f, them)) {
          if (s.castle[me + 'K'] && !b[at(row, 5)] && !b[at(row, 6)] && b[at(row, 7)] === me + 'R'
              && !attacked(b, at(row, 5), them) && !attacked(b, at(row, 6), them)) add(f, at(row, 6), { castle: 'K' });
          if (s.castle[me + 'Q'] && !b[at(row, 3)] && !b[at(row, 2)] && !b[at(row, 1)] && b[at(row, 0)] === me + 'R'
              && !attacked(b, at(row, 3), them) && !attacked(b, at(row, 2), them)) add(f, at(row, 2), { castle: 'Q' });
        }
      }
    } else {
      const dirs = kind === 'R' ? ROOK : kind === 'B' ? BISHOP : [...ROOK, ...BISHOP];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (onBoard(rr, cc)) {
          const t = at(rr, cc);
          if (b[t]) { if (b[t][0] !== me) add(f, t); break; }
          add(f, t); rr += dr; cc += dc;
        }
      }
    }
  }
  return out;
}

function apply(s, m) {
  const b = s.b.slice(), me = s.turn;
  const castle = { ...s.castle };
  b[m.t] = m.promo ? me + m.promo : b[m.f];
  b[m.f] = null;
  if (m.enPassant) b[m.t + (me === 'w' ? 8 : -8)] = null;
  if (m.castle) {
    const row = me === 'w' ? 7 : 0;
    if (m.castle === 'K') { b[at(row, 5)] = b[at(row, 7)]; b[at(row, 7)] = null; }
    else { b[at(row, 3)] = b[at(row, 0)]; b[at(row, 0)] = null; }
  }
  if (m.piece[1] === 'K') castle[me + 'K'] = castle[me + 'Q'] = false;
  for (const [sq, key] of [[63, 'wK'], [56, 'wQ'], [7, 'bK'], [0, 'bQ']]) if (m.f === sq || m.t === sq) castle[key] = false;
  return { b, turn: other(me), castle, ep: m.double ? (m.f + m.t) / 2 : -1,
           quiet: m.cap || m.piece[1] === 'P' ? 0 : s.quiet + 1 };
}

const legal = s => pseudo(s).filter(m => !inCheck(apply(s, m), s.turn));

// only kings, or king + one bishop/knight: nobody can ever checkmate
function notEnough(b) {
  const rest = b.filter(p => p && p[1] !== 'K');
  return rest.length === 0 || (rest.length === 1 && 'BN'.includes(rest[0][1]));
}

/* ---------- the computer's brain ----------
   It scores a position by adding up the pieces (pawn 1, knight 3, bishop 3, rook 5, queen 9),
   plus a little extra for good squares: knights and bishops in the middle, pawns pushed forward.
   Then it looks ahead: "if I go here, what is their best reply, and my best reply to that..." */
const CENTRE = [0, 1, 2, 3, 3, 2, 1, 0];
function judge(s) {
  let total = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.b[i]; if (!p) continue;
    const [r, c] = rc(i), kind = p[1];
    let v = VALUE[kind];
    if (kind === 'N' || kind === 'B') v += (CENTRE[r] + CENTRE[c]) * 5;
    if (kind === 'P') v += (p[0] === 'w' ? 6 - r : r - 1) * 6 + (c >= 2 && c <= 5 ? 6 : 0);
    if (kind === 'Q') v += (CENTRE[r] + CENTRE[c]) * 2;
    if (kind === 'K' && s.b.filter(Boolean).length > 12) v += (p[0] === 'w' ? r - 6 : 1 - r) * 8 - CENTRE[c] * 6;   // stay home early on
    total += p[0] === s.turn ? v : -v;
  }
  return total;
}
// try captures of big pieces by small pieces first: it makes the search much faster
const order = ms => ms.sort((a, b) => (b.cap ? VALUE[b.cap[1]] * 10 - VALUE[b.piece[1]] : 0) + (b.promo ? 800 : 0)
                                   - (a.cap ? VALUE[a.cap[1]] * 10 - VALUE[a.piece[1]] : 0) - (a.promo ? 800 : 0));

function search(s, depth, a, beta, ply) {
  if (depth <= 0) return captures(s, a, beta, 4);
  const ms = legal(s);
  if (!ms.length) return inCheck(s, s.turn) ? -100000 + ply : 0;
  let best = -Infinity;
  for (const m of order(ms)) {
    const v = -search(apply(s, m), depth - 1, -beta, -a, ply + 1);
    if (v > best) best = v;
    if (v > a) a = v;
    if (a >= beta) break;
  }
  return best;
}
// at the end of the look-ahead, keep following captures so it does not stop halfway through a swap
function captures(s, a, beta, left) {
  const standPat = judge(s);
  if (left === 0 || standPat >= beta) return standPat;
  if (standPat > a) a = standPat;
  for (const m of order(pseudo(s).filter(m => m.cap))) {
    const n = apply(s, m);
    if (inCheck(n, s.turn)) continue;
    const v = -captures(n, -beta, -a, left - 1);
    if (v >= beta) return v;
    if (v > a) a = v;
  }
  return a;
}
