// Estat d'un dia de Simbològic: 3 graelles (lògica pura, sense DOM).

export const POINTS_PER_GRID = 10;
const ERROR_COST = 2;
const HINT_COST = 3;
export const TOTAL = 3 * POINTS_PER_GRID;
// Rangs de la família: % dels punts del dia, arrodonit cap amunt a punts.
export const RANKS = [
  ["Principiant", 0], ["Aprenent", 10], ["Avançat", 25], ["Expert", 45],
  ["Mestre", 65], ["Geni", 85], ["Llegenda", 100],
].map(([name, pct]) => [name, Math.ceil((pct * TOTAL) / 100)]);

const ENTRY = /^-?\d{0,2}$/;
const isNumber = (t) => /^-?\d+$/.test(t);

export function createGame(puzzle, saved = null) {
  const state = puzzle.grids.map((_, gi) => {
    const s = saved && saved.grids && saved.grids[gi];
    return {
      entries: { ...(s ? s.entries : {}) },
      solved: new Set(s ? s.solved : []),
      errors: s ? s.errors : 0,
      hints: s ? s.hints : 0,
    };
  });
  const values = (gi) => puzzle.grids[gi].values;

  const game = {
    puzzle,
    gridState: (gi) => state[gi],
    entries: (gi) => state[gi].entries,
    isSolved: (gi, s) => state[gi].solved.has(s),
    gridDone: (gi) => state[gi].solved.size === values(gi).length,
    gridClean: (gi) => game.gridDone(gi) && state[gi].errors === 0 && state[gi].hints === 0,
    gridPoints(gi) {
      const st = state[gi];
      return game.gridDone(gi) ? Math.max(1, POINTS_PER_GRID - ERROR_COST * st.errors - HINT_COST * st.hints) : 0;
    },
    score: () => state.reduce((a, _, gi) => a + game.gridPoints(gi), 0),
    get allDone() { return state.every((_, gi) => game.gridDone(gi)); },
    get clean() { return state.every((_, gi) => game.gridClean(gi)); },
    rank() {
      const sc = game.score();
      return RANKS.filter(([, th]) => sc >= th).pop()[0];
    },

    // Escriu (o esborra amb "") el valor d'un símbol. False si no s'admet.
    enter(gi, s, text) {
      if (state[gi].solved.has(s) || !ENTRY.test(text)) return false;
      state[gi].entries[s] = text;
      return true;
    },

    // Comprova els símbols escrits i no resolts: els correctes queden fixos; cada erroni és un error.
    check(gi) {
      const st = state[gi];
      const right = [], wrong = [];
      values(gi).forEach((v, s) => {
        const t = st.entries[s];
        if (st.solved.has(s) || t === undefined || !isNumber(t)) return;
        if (Number(t) === v) { st.solved.add(s); right.push(s); }
        else { st.errors += 1; wrong.push(s); }
      });
      return { right, wrong, complete: game.gridDone(gi) };
    },

    // Revela el primer símbol pendent en l'ordre del solucionador.
    hint(gi) {
      const st = state[gi];
      const s = puzzle.grids[gi].order.find((k) => !st.solved.has(k));
      if (s === undefined) return null;
      st.solved.add(s);
      st.entries[s] = String(values(gi)[s]);
      st.hints += 1;
      return s;
    },

    progress() {
      return { grids: state.map((st) => ({ entries: { ...st.entries }, solved: [...st.solved], errors: st.errors, hints: st.hints })) };
    },
  };
  return game;
}
