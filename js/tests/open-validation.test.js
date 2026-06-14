// Joc obert per punts: s'accepta qualsevol expressió vàlida (no només un conjunt curat),
// deduplicant per forma canònica, i s'apliquen les regles de la variant (no-repetir, operadors).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../game.js";

// Repte tipus "índex 12" de producció: objectiu 25, central 5, variant bàsica sense repetir.
// `solutions: []` a propòsit: la validació NO ha de dependre del conjunt precalculat.
function puzzle() {
  return {
    target: 25,
    digits: [1, 3, 4, 5, 6, 7, 8],
    centralIndex: 3, // central = 5
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
    solutions: [],
    totalPoints: 20,
    ranks: [["Principiant", 0], ["Geni", 20]],
    hasTutti: true,
  };
}

test("expressió vàlida de 5 operands fora del conjunt -> found", () => {
  const g = createGame(puzzle());
  const r = g.submit("3+4+5+6+7"); // = 25, central 5, sense repetir
  assert.equal(r.status, "found");
  assert.equal(r.points, 5);
  assert.equal(g.score(), 5);
});

test("expressió vàlida de 6 operands amb × i − -> found", () => {
  const g = createGame(puzzle());
  const r = g.submit("5*8-7-6-3+1"); // = 25
  assert.equal(r.status, "found");
  assert.equal(r.points, 6);
});

test("mateixa forma canònica (commutativitat/parèntesis) -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("3+4+5+6+7");
  const r = g.submit("(6+4)+3+7+5"); // mateixa canònica que l'anterior
  assert.equal(r.status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("repetir un dígit viola la variant sense-repetir -> invalid", () => {
  const g = createGame(puzzle());
  const r = g.submit("5+5+5+5+5"); // = 25 però repeteix el 5
  assert.equal(r.status, "invalid");
});

test("operador no permès per la variant (potència) -> invalid", () => {
  const g = createGame(puzzle());
  const r = g.submit("4^1+3+6+7+5"); // = 25, dígits OK, però usa ^ no permès
  assert.equal(r.status, "invalid");
});

test("quan és invàlida, retorna el motiu (sense central)", () => {
  const g = createGame(puzzle());
  const r = g.submit("3+4"); // no usa el dígit central (5)
  assert.equal(r.status, "invalid");
  assert.match(r.reason, /central/);
});

test("menys unari: (3-8)×(-5) = 25 -> found", () => {
  const g = createGame(puzzle());
  const r = g.submit("(3-8)*(-5)"); // (-5)*(-5) = 25, central 5
  assert.equal(r.status, "found");
  assert.equal(r.points, 3);
});
