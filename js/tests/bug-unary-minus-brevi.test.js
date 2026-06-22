// Bug: el menys unari deixa entrar trucs de signe com (−3)×(−7)=21 com a solució
// DISTINTA de 3×7, inflant el comptador del Brevi (trobava 2 quan el banc en diu 1).
// Repte real de hui (índex 21): objectiu 21, central 3, variant bàsica sense repetir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../game.js";
import { canonical } from "../canonical.js";

function puzzle() {
  return {
    target: 21,
    digits: [1, 2, 3, 5, 6, 7, 8],
    centralIndex: 2, // central = 3
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
    solutions: [],
    totalPoints: 50,
    ranks: [["Principiant", 0], ["Geni", 50]],
    hasTutti: true,
    brevi: { operands: 2, count: 1 }, // única solució de 2 operands: 3×7
  };
}

test("(−3)×(−7) és la MATEIXA solució que 3×7 (mateixa canònica)", () => {
  assert.equal(canonical(["mul", ["neg", ["num", 3]], ["neg", ["num", 7]]]), canonical(["mul", ["num", 3], ["num", 7]]));
});

test("3×7 i després −3×−7: el truc de signe és un duplicat, Brevi no s'infla", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("3*7").status, "found");
  assert.equal(g.submit("-3*-7").status, "duplicate");
  assert.equal(g.breviFound(), 1);
  assert.equal(g.breviComplete(), true);
});

test("ordre invers −3×−7 i després 3×7: igual, un sol Brevi", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("-3*-7").status, "found");
  assert.equal(g.submit("3*7").status, "duplicate");
  assert.equal(g.breviFound(), 1);
});
