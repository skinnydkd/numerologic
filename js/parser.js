// Parseja una cadena d'entrada a AST.
// Precedència (alta -> baixa): √ (unari) > ^ (dreta) > * / (esquerra) > + - (esquerra).

export class ParseError extends Error {}

function tokenize(str) {
  const tokens = [];
  for (const ch of str) {
    if (ch === " " || ch === "\t") continue;
    if (ch >= "1" && ch <= "9") tokens.push({ type: "num", value: Number(ch) });
    else if ("+-*/^()".includes(ch)) tokens.push({ type: ch });
    else if (ch === "√") tokens.push({ type: "sqrt" });
    else throw new ParseError("caràcter no vàlid: " + ch);
  }
  return tokens;
}

export function parse(str) {
  const tokens = tokenize(str);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const op = next().type === "+" ? "add" : "sub";
      node = [op, node, parseTerm()];
    }
    return node;
  }
  function parseTerm() {
    let node = parseFactor();
    while (peek() && (peek().type === "*" || peek().type === "/")) {
      const op = next().type === "*" ? "mul" : "div";
      node = [op, node, parseFactor()];
    }
    return node;
  }
  function parseFactor() {
    const node = parseUnary();
    if (peek() && peek().type === "^") {
      next();
      return ["pow", node, parseFactor()]; // associativa per la dreta
    }
    return node;
  }
  function parseUnary() {
    if (peek() && peek().type === "sqrt") {
      next();
      return ["sqrt", parseUnary()];
    }
    return parseAtom();
  }
  function parseAtom() {
    const t = peek();
    if (!t) throw new ParseError("expressió incompleta");
    if (t.type === "num") {
      next();
      return ["num", t.value];
    }
    if (t.type === "(") {
      next();
      const node = parseExpr();
      if (!peek() || peek().type !== ")") throw new ParseError("falta ')'");
      next();
      return node;
    }
    throw new ParseError("token inesperat: " + t.type);
  }

  const ast = parseExpr();
  if (pos !== tokens.length) throw new ParseError("tokens sobrants");
  return ast;
}
