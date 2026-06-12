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

// --- Variant bàsica (només +−×÷): l'eix és la proporció de solucions amb divisió ---
const BASIC = { allowRepeat: false, ops: ["add", "sub", "mul", "div"] };
function basicHints(div, total) {
  return { byLeaves: { "4": total }, byOp: { add: 0, sub: 0, mul: total, div, pow: 0, sqrt: 0 } };
}

test("bàsica fàcil: poca divisió", () => {
  assert.equal(difficulty(basicHints(12, 120), BASIC), "Fàcil"); // 0.10 < 0.15
});

test("bàsica mitjà: divisió moderada", () => {
  assert.equal(difficulty(basicHints(24, 120), BASIC), "Mitjà"); // 0.20 dins [0.15, 0.24)
});

test("bàsica difícil: molta divisió", () => {
  assert.equal(difficulty(basicHints(36, 120), BASIC), "Difícil"); // 0.30 >= 0.24
});

test("bàsica: llindars inclusius (0.15 -> Mitjà, 0.24 -> Difícil)", () => {
  assert.equal(difficulty(basicHints(18, 120), BASIC), "Mitjà");   // 0.15
  assert.equal(difficulty(basicHints(24, 100), BASIC), "Difícil"); // 0.24
});

test("sense rules, unes pistes bàsiques cauen a l'eix complet (retrocompat)", () => {
  // sense pow/sqrt i sense rules -> eix avançat -> advanced=0 -> Fàcil
  assert.equal(difficulty(basicHints(36, 120)), "Fàcil");
});
