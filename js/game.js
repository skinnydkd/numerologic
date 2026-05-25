// Estat i lògica d'una partida (sense DOM). Reutilitza el nucli del Pla 2a.
import { parse, ParseError } from "./parser.js";
import { validate } from "./validate.js";
import { canonical } from "./canonical.js";
import { solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits } from "./score.js";

export const TUTTI_BONUS = 10;

export function createGame(puzzle, savedProgress = null) {
  const { digits, target } = puzzle;
  const central = digits[puzzle.centralIndex];
  const solutionSet = new Set(puzzle.solutions);
  const found = new Map(); // canonical -> { text, points }
  let tuttiFound = false;

  if (savedProgress) {
    for (const f of savedProgress.found || []) {
      const ast = parse(f.text);
      found.set(f.canonical, {
        text: f.text,
        points: solutionPoints(countLeaves(ast), hasPowOrSqrt(ast)),
      });
    }
    tuttiFound = Boolean(savedProgress.tuttiFound);
  }

  function submit(inputText) {
    let ast;
    try {
      ast = parse(inputText);
    } catch (e) {
      if (e instanceof ParseError) return { status: "invalid" };
      throw e;
    }
    const v = validate(ast, { digits, central });
    if (!v.ok) return { status: "invalid" };
    if (v.value !== target) return { status: "wrong" };

    if (usesAllDigits(ast, digits)) {
      if (tuttiFound) return { status: "duplicate" };
      tuttiFound = true;
      return { status: "tutti", points: TUTTI_BONUS };
    }

    const c = canonical(ast);
    if (solutionSet.has(c)) {
      if (found.has(c)) return { status: "duplicate" };
      const points = solutionPoints(countLeaves(ast), hasPowOrSqrt(ast));
      found.set(c, { text: inputText, points });
      return { status: "found", points, canonical: c };
    }
    return { status: "notInList" };
  }

  function score() {
    let s = 0;
    for (const { points } of found.values()) s += points;
    return s;
  }

  function rank() {
    const s = score();
    let name = puzzle.ranks[0][0];
    for (const [n, threshold] of puzzle.ranks) {
      if (s >= threshold) name = n;
      else break;
    }
    return name;
  }

  function tuttiBonus() {
    return tuttiFound ? TUTTI_BONUS : 0;
  }

  function progress() {
    return {
      found: [...found.entries()].map(([c, { text }]) => ({ canonical: c, text })),
      tuttiFound,
    };
  }

  return {
    puzzle,
    submit,
    score,
    rank,
    tuttiBonus,
    progress,
    get found() {
      return found;
    },
    get tuttiFound() {
      return tuttiFound;
    },
  };
}
