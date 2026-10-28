// Estat d'una partida de Quadrològic (lògica pura, sense DOM). Cel·les en índex pla r*n+c.

export const CHECK_PENALTY = 30;
export const HINT_PENALTY = 60;
// Rang segons temps efectiu / refSeconds (el primer llindar que no se supera).
const RANK_RATIOS = [[0.5, "Llegenda"], [0.7, "Geni"], [1, "Mestre"], [1.5, "Expert"], [2, "Avançat"], [3, "Aprenent"]];
export const RANK_TABLE = [...RANK_RATIOS.map(([r, name]) => [name, r]), ["Principiant", Infinity]];

export function rankFor(seconds, ref) {
  const hit = RANK_RATIOS.find(([r]) => seconds <= r * ref);
  return hit ? hit[1] : "Principiant";
}

export function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function createGame(puzzle, saved = null) {
  const n = puzzle.size;
  const answer = puzzle.solution.flat();
  const values = saved ? [...saved.values] : Array(n * n).fill(0);
  const notes = saved ? saved.notes.map((a) => [...a]) : Array.from({ length: n * n }, () => []);
  const locked = new Set(saved ? saved.locked : []);
  let elapsed = saved ? saved.elapsed : 0;
  let errors = saved ? saved.errors : 0;
  let hints = saved ? saved.hints : 0;

  const full = () => values.every((v, i) => v === answer[i]);
  const game = {
    puzzle, n, values, notes,
    get solved() { return full(); },
    get perfect() { return full() && errors === 0 && hints === 0; },
    get errors() { return errors; },
    get hints() { return hints; },
    get started() { return elapsed > 0 || values.some((v) => v) || notes.some((a) => a.length); },
    isLocked: (i) => locked.has(i),

    // Temps efectiu: rellotge + penalitzacions.
    seconds: () => elapsed + CHECK_PENALTY * errors + HINT_PENALTY * hints,
    tick(dt) { if (!full()) elapsed += dt; },
    rank() { return full() ? rankFor(game.seconds(), puzzle.refSeconds) : null; },

    set(i, v) {
      if (full() || locked.has(i)) return false;
      values[i] = v;
      notes[i] = [];
      return true;
    },
    clear(i) { return game.set(i, 0); },

    toggleNote(i, v) {
      if (full() || values[i]) return false;
      const k = notes[i].indexOf(v);
      if (k >= 0) notes[i].splice(k, 1);
      else notes[i] = [...notes[i], v].sort((a, b) => a - b);
      return true;
    },

    // Cel·les plenes errònies; si n'hi ha, +30 s.
    check() {
      const wrong = values.map((v, i) => (v && v !== answer[i] ? i : -1)).filter((i) => i >= 0);
      if (wrong.length) errors += 1;
      return wrong;
    },

    // Revela la primera cel·la buida o errònia en l'ordre del solucionador lògic (+60 s).
    hint() {
      const cell = puzzle.order.map(([r, c]) => r * n + c).find((i) => values[i] !== answer[i]);
      if (cell === undefined) return null;
      values[cell] = answer[cell];
      notes[cell] = [];
      locked.add(cell);
      hints += 1;
      return cell;
    },

    progress() {
      return { values: [...values], notes: notes.map((a) => [...a]), locked: [...locked], elapsed, errors, hints };
    },
  };
  return game;
}
