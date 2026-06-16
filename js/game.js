// Estat i lògica d'una partida (sense DOM). Reutilitza el nucli del Pla 2a.
import { parse, ParseError } from "./parser.js";
import { validate } from "./validate.js";
import { canonical } from "./canonical.js";
import { solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits, breviFoundCount } from "./score.js";

export const TUTTI_BONUS = 10;
export const BREVI_BONUS = 10;

export function createGame(puzzle, savedProgress = null) {
  const { digits, target } = puzzle;
  const central = digits[puzzle.centralIndex];
  const rules = puzzle.rules || {};
  const allowRepeat = rules.allowRepeat !== false;
  const ops = rules.ops || null;
  const found = new Map(); // canonical -> { text, points, leaves }
  let tuttiFound = false;
  const breviOps = puzzle.brevi ? puzzle.brevi.operands : null;
  const breviTotal = puzzle.brevi ? puzzle.brevi.count : 0;

  if (savedProgress) {
    for (const f of savedProgress.found || []) {
      let ast;
      try {
        ast = parse(f.text);
      } catch {
        continue; // omet entrades corruptes en lloc de bloquejar la partida
      }
      const isTutti = usesAllDigits(ast, digits);
      found.set(f.canonical, {
        text: f.text,
        points: isTutti
          ? TUTTI_BONUS // el tutti val 10 punts (no els 7 operands)
          : solutionPoints(countLeaves(ast), hasPowOrSqrt(ast)),
        leaves: isTutti ? digits.length : countLeaves(ast),
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
    const v = validate(ast, { digits, central, allowRepeat, ops });
    if (!v.ok) return { status: "invalid", reason: v.reason };
    if (v.value !== target) return { status: "wrong" };

    if (usesAllDigits(ast, digits)) {
      if (tuttiFound) return { status: "duplicate" };
      tuttiFound = true;
      const c = canonical(ast);
      found.set(c, { text: inputText, points: TUTTI_BONUS, leaves: digits.length }); // el tutti és una solució de 10 punts
      return { status: "tutti", points: TUTTI_BONUS, canonical: c };
    }

    const c = canonical(ast);
    if (found.has(c)) return { status: "duplicate" };
    const leaves = countLeaves(ast);
    const points = solutionPoints(leaves, hasPowOrSqrt(ast));
    found.set(c, { text: inputText, points, leaves });
    return { status: "found", points, canonical: c };
  }

  function breviFound() {
    return breviOps ? breviFoundCount(found, breviOps) : 0;
  }
  function breviComplete() {
    return breviTotal > 0 && breviFound() >= breviTotal;
  }
  function breviBonus() {
    return breviComplete() ? BREVI_BONUS : 0;
  }

  function score() {
    let s = breviBonus();
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
    breviFound,
    breviComplete,
    breviBonus,
    progress,
    get found() {
      return found;
    },
    get tuttiFound() {
      return tuttiFound;
    },
  };
}
