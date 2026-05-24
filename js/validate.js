// Validació d'una expressió per a un rusc donat (no limita el nombre d'operands).
import { evaluate, InvalidExpr } from "./evaluator.js";

function collectLeafDigits(ast, out) {
  if (ast[0] === "num") {
    out.push(ast[1]);
    return;
  }
  for (const c of ast.slice(1)) collectLeafDigits(c, out);
}

export function validate(ast, { digits, central }) {
  const leaves = [];
  collectLeafDigits(ast, leaves);

  const allowed = new Set(digits);
  for (const d of leaves) {
    if (!allowed.has(d)) return { ok: false, reason: "dígit fora del rusc: " + d };
  }
  if (!leaves.includes(central)) {
    return { ok: false, reason: "no usa el dígit central" };
  }

  let value;
  try {
    value = evaluate(ast);
  } catch (e) {
    if (e instanceof InvalidExpr) return { ok: false, reason: "expressió no vàlida" };
    throw e;
  }
  return { ok: true, value };
}
