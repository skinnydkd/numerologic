// Puntuació d'una solució i ajudes de classificació.
import { reduce1 } from "./canonical.js";

export function solutionPoints(leaves, usesPowSqrt) {
  return leaves + (usesPowSqrt ? 2 : 0);
}

export function hasPowOrSqrt(ast) {
  const k = ast[0];
  if (k === "num") return false;
  if (k === "pow" || k === "sqrt") return true;
  return ast.slice(1).some((c) => hasPowOrSqrt(c));
}

export function countLeaves(ast) {
  if (ast[0] === "num") return 1;
  return ast.slice(1).reduce((sum, c) => sum + countLeaves(c), 0);
}

function collectDigits(ast, out) {
  if (ast[0] === "num") {
    out.add(ast[1]);
    return;
  }
  for (const c of ast.slice(1)) collectDigits(c, out);
}

export function usesAllDigits(ast, digits) {
  const used = new Set();
  collectDigits(reduce1(ast), used);
  const needed = new Set(digits);
  if (used.size !== needed.size) return false;
  for (const d of needed) if (!used.has(d)) return false;
  return true;
}

// Nombre de solucions trobades amb el recompte d'operands del Brevi (el tier mínim).
// Com que cap solució té menys operands, qualsevol amb aquest recompte ÉS del Brevi.
export function breviFoundCount(foundMap, breviOperands) {
  let n = 0;
  for (const { leaves } of foundMap.values()) {
    if (leaves === breviOperands) n++;
  }
  return n;
}
