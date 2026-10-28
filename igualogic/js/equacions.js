// Regles d'Igualògic: validesa d'una igualtat i colors. Paritat exacta amb gen_igualogic/equacions.py.
// Caràcters interns: 0-9 + - * / = (a la interfície, + − × ÷ =).

const OPS = "+-*/";
const isDigit = (c) => c >= "0" && c <= "9";

// Parteix l'esquerra en [nombre, op, nombre, ...]; null si la forma no és vàlida.
function tokens(lhs) {
  const toks = [];
  let cur = "";
  for (const ch of lhs) {
    if (isDigit(ch)) cur += ch;
    else if (OPS.includes(ch)) {
      if (!cur) return null;
      toks.push(cur, ch);
      cur = "";
    } else return null;
  }
  if (!cur) return null;
  toks.push(cur);
  for (let i = 0; i < toks.length; i += 2) {
    if (toks[i].length > 1 && toks[i][0] === "0") return null;
  }
  return toks;
}

// Valor enter de l'esquerra amb prioritat d'operacions; null si no és vàlida.
// ponytail: Number és exacte fins a 2^53; amb 10 caselles el màxim és ~10^8, de sobres.
export function evalLhs(lhs) {
  const toks = tokens(lhs);
  if (toks === null || toks.length < 3) return null;
  const terms = [Number(toks[0])];
  const addops = [];
  for (let i = 1; i < toks.length; i += 2) {
    const op = toks[i], n = Number(toks[i + 1]);
    const last = terms.length - 1;
    if (op === "*") terms[last] *= n;
    else if (op === "/") {
      if (n === 0 || terms[last] % n !== 0) return null;
      terms[last] /= n;
    } else {
      addops.push(op);
      terms.push(n);
    }
  }
  let v = terms[0];
  addops.forEach((op, k) => { v = op === "+" ? v + terms[k + 1] : v - terms[k + 1]; });
  return v;
}

// True si `eq` és una igualtat certa segons les regles del joc.
export function isValid(eq) {
  if (eq.split("=").length !== 2) return false;
  const [lhs, rhs] = eq.split("=");
  if (!rhs || ![...rhs].every(isDigit)) return false;
  if (rhs.length > 1 && rhs[0] === "0") return false;
  const v = evalLhs(lhs);
  return v !== null && v === Number(rhs);
}

// Colors per posició: g lloc correcte, y hi és en un altre lloc, x no hi és (regla del Wordle).
export function feedback(guess, answer) {
  const res = Array(guess.length).fill("x");
  const rest = {};
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) res[i] = "g";
    else rest[answer[i]] = (rest[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (res[i] !== "g" && rest[guess[i]] > 0) {
      res[i] = "y";
      rest[guess[i]] -= 1;
    }
  }
  return res.join("");
}
