// Validació d'una expressió per a un rusc donat (no limita el nombre d'operands).
import { evaluate, InvalidExpr } from "./evaluator.js";

function collectLeafDigits(ast, out) {
  if (ast[0] === "num") {
    out.push(ast[1]);
    return;
  }
  for (const c of ast.slice(1)) collectLeafDigits(c, out);
}

function collectOps(ast, out) {
  const k = ast[0];
  if (k === "num") return;
  out.add(k);
  for (const c of ast.slice(1)) collectOps(c, out);
}

export function validate(ast, { digits, central, allowRepeat = true, ops = null }) {
  const leaves = [];
  collectLeafDigits(ast, leaves);

  const allowed = new Set(digits);
  for (const d of leaves) {
    if (!allowed.has(d)) return { ok: false, reason: `El dígit ${d} no és al rusc` };
  }
  if (!leaves.includes(central)) {
    return { ok: false, reason: `Has d'usar el dígit central (${central})` };
  }

  // Variant sense repetir: cap dígit no es pot usar més vegades que la seva multiplicitat al rusc.
  if (!allowRepeat) {
    const cap = new Map();
    for (const d of digits) cap.set(d, (cap.get(d) || 0) + 1);
    const seen = new Map();
    for (const d of leaves) {
      const n = (seen.get(d) || 0) + 1;
      seen.set(d, n);
      if (n > (cap.get(d) || 0)) return { ok: false, reason: `No pots repetir el dígit ${d}` };
    }
  }

  // Variant amb operadors restringits: només es permeten els de `ops`.
  if (ops) {
    const allowedOps = new Set(ops);
    const used = new Set();
    collectOps(ast, used);
    for (const op of used) {
      if (op === "neg") continue; // el menys unari sempre es permet (no és cap operador del rusc)
      if (!allowedOps.has(op)) return { ok: false, reason: "Aquest operador no es pot usar avui" };
    }
  }

  let value;
  try {
    value = evaluate(ast);
  } catch (e) {
    if (e instanceof InvalidExpr) return { ok: false, reason: "Operació no vàlida (divisió no exacta?)" };
    throw e;
  }
  return { ok: true, value };
}
