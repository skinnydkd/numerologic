import { test } from "node:test";
import assert from "node:assert/strict";
import { difficulty } from "../difficulty.js";

// hints amb `total` solucions (totes de 4 operands), de les quals `pow` usen potència i `sqrt` arrel.
function hints(pow, sqrt, total) {
  return { byLeaves: { "4": total }, byOp: { add: 0, sub: 0, mul: 0, div: 0, pow, sqrt } };
}

test("fàcil: poques solucions necessiten operacions avançades", () => {
  assert.equal(difficulty(hints(40, 40, 120)), "Fàcil"); // avançament ≈ 0.33
});

test("mitjà: força solucions avançades", () => {
  assert.equal(difficulty(hints(105, 105, 120)), "Mitjà"); // avançament ≈ 0.875
});

test("difícil: gairebé totes les solucions necessiten ^ o √", () => {
  assert.equal(difficulty(hints(120, 120, 120)), "Difícil"); // avançament = 1.0
});

test("llindar baix (~0.81) cau a Mitjà", () => {
  // pow=100, sqrt=95, total=120 -> (0.833+0.792)/2 = 0.812 >= 0.81
  assert.equal(difficulty(hints(100, 95, 120)), "Mitjà");
});
