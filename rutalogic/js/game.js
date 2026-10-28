// Estat d'una partida de Rutalògic (lògica pura, sense DOM).
import { CENTER, NEIGHBORS, applyOp, run } from "./hive.js";

export const SPECIAL_POINTS = 10;
export const BREVI_BONUS = 10;

export function createGame(puzzle, saved = null) {
  const minLen = puzzle.brevi[0].length;
  const maxLen = puzzle.marato[0].length;
  const found = new Map();
  const points = (len) => (len === minLen || len === maxLen ? SPECIAL_POINTS : len);
  const add = (route) => found.set(route.join(","), { route: [...route], len: route.length, points: points(route.length) });
  if (saved && Array.isArray(saved.found)) {
    for (const r of saved.found) if (run(puzzle.start, puzzle.ops, r) === puzzle.target) add(r);
  }
  let path = [];

  const game = {
    puzzle, found, minLen, maxLen,
    get path() { return path; },
    value: () => run(puzzle.start, puzzle.ops, path),
    last: () => (path.length ? path[path.length - 1] : CENTER),

    canTap(cell) {
      return cell !== CENTER && !path.includes(cell) && NEIGHBORS[game.last()].includes(cell) &&
        applyOp(game.value(), puzzle.ops[cell]) !== null;
    },
    tap(cell) {
      if (!game.canTap(cell)) return false;
      path = [...path, cell];
      return true;
    },
    back() { path = path.slice(0, -1); },
    reset() { path = []; },

    submit() {
      if (!path.length || game.value() !== puzzle.target) return { status: "wrong" };
      const key = path.join(",");
      if (found.has(key)) return { status: "duplicate" };
      add(path);
      const len = path.length;
      path = [];
      const status = len === minLen ? "brevi" : len === maxLen ? "marato" : "found";
      return { status, points: points(len) };
    },

    breviFound: () => [...found.values()].filter((f) => f.len === minLen).length,
    breviComplete: () => game.breviFound() === puzzle.brevi.length,
    maratoFound: () => [...found.values()].some((f) => f.len === maxLen),
    score() {
      return [...found.values()].reduce((a, f) => a + f.points, 0) + (game.breviComplete() ? BREVI_BONUS : 0);
    },
    rank() {
      const sc = game.score();
      return puzzle.ranks.filter(([, th]) => sc >= th).pop()[0];
    },
    progress: () => ({ found: [...found.values()].map((f) => f.route) }),
  };
  return game;
}
