// Forma canònica determinista d'un AST.
// Paritat byte a byte amb generator/engine.py::canonical.

function flatten(ast, op) {
  // Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques.
  const parts = [];
  for (const child of [ast[1], ast[2]]) {
    if (child[0] === op) {
      parts.push(...flatten(child, op));
    } else {
      parts.push(canonical(child));
    }
  }
  return parts;
}

export function canonical(ast) {
  const k = ast[0];
  if (k === "num") return String(ast[1]);
  if (k === "sqrt") return "r(" + canonical(ast[1]) + ")";
  if (k === "add") return "(+ " + flatten(ast, "add").sort().join(" ") + ")";
  if (k === "mul") return "(* " + flatten(ast, "mul").sort().join(" ") + ")";
  const sym = { sub: "-", div: "/", pow: "^" }[k];
  return "(" + sym + " " + canonical(ast[1]) + " " + canonical(ast[2]) + ")";
}
