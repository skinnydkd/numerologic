// Estat d'una partida d'Igualògic (lògica pura, sense DOM).
import { isValid, feedback } from "./equacions.js";

export const MAX_GUESSES = 6;
// Rang segons els intents usats (1 → Llegenda … 6 → Aprenent); no resolta → Principiant.
export const RANKS_BY_GUESSES = ["Llegenda", "Geni", "Mestre", "Expert", "Avançat", "Aprenent"];
const HINT_CAP = 3; // amb pistes, com a molt Expert
const BEST = { g: 3, y: 2, x: 1 };

// Pistes: operadors de l'esquerra, xifres del resultat i si hi ha cap xifra repetida.
export function hintValues(eq) {
  const [lhs, rhs] = eq.split("=");
  const digits = eq.replace(/\D/g, "");
  return {
    ops: (lhs.match(/[+\-*/]/g) || []).length,
    resultDigits: rhs.length,
    repeated: new Set(digits).size < digits.length,
  };
}

const pretty = (c) => ({ "*": "×", "/": "÷", "-": "−" }[c] || c);

// Motiu pel qual `guess` incompleix el mode difícil respecte dels intents previs, o null.
function hardViolation(guess, rows) {
  for (const { guess: prev, colors } of rows) {
    for (let i = 0; i < prev.length; i++) {
      if (colors[i] === "g" && guess[i] !== prev[i]) return `La posició ${i + 1} ha de ser ${pretty(prev[i])}`;
    }
    const need = {};
    for (let i = 0; i < prev.length; i++) {
      if (colors[i] !== "x") need[prev[i]] = (need[prev[i]] || 0) + 1;
    }
    for (const [ch, n] of Object.entries(need)) {
      if ([...guess].filter((c) => c === ch).length < n) return `Cal fer servir ${pretty(ch)}${n > 1 ? ` ${n} vegades` : ""}`;
    }
  }
  return null;
}

export function createGame(puzzle, saved = null) {
  const answer = puzzle.eq;
  const guesses = saved && Array.isArray(saved.guesses) ? [...saved.guesses] : [];
  const hintsUsed = new Set(saved && saved.hints ? saved.hints : []);
  let hard = !!(saved && saved.hard);

  const rows = () => guesses.map((g) => ({ guess: g, colors: feedback(g, answer) }));
  const game = {
    puzzle,
    length: answer.length,
    guesses,
    hintsUsed,
    get hard() { return hard; },
    get won() { return guesses.includes(answer); },
    get lost() { return !game.won && guesses.length >= MAX_GUESSES; },
    get done() { return game.won || game.lost; },
    rows,

    // El mode difícil només es pot canviar abans del primer intent.
    setHard(on) {
      if (guesses.length > 0) return false;
      hard = !!on;
      return true;
    },

    useHint(i) { hintsUsed.add(i); },

    submit(guess) {
      if (game.done) return { status: "done" };
      if (guess.length !== answer.length) return { status: "invalid", reason: `Calen ${answer.length} caràcters` };
      if (!isValid(guess)) return { status: "invalid", reason: "No és una igualtat certa" };
      if (hard) {
        const reason = hardViolation(guess, rows());
        if (reason) return { status: "hardfail", reason };
      }
      guesses.push(guess);
      const colors = feedback(guess, answer);
      const status = guess === answer ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "guess";
      return { status, colors };
    },

    // null mentre es juga.
    rank() {
      if (game.won) {
        let i = guesses.length - 1;
        if (hintsUsed.size > 0) i = Math.max(i, HINT_CAP);
        return RANKS_BY_GUESSES[i];
      }
      return game.lost ? "Principiant" : null;
    },

    // Millor color vist per a cada tecla (g > y > x).
    keyColors() {
      const out = {};
      for (const { guess, colors } of rows()) {
        [...guess].forEach((ch, i) => {
          if (!out[ch] || BEST[colors[i]] > BEST[out[ch]]) out[ch] = colors[i];
        });
      }
      return out;
    },

    progress() {
      return { guesses: [...guesses], hard, hints: [...hintsUsed] };
    },
  };
  return game;
}
