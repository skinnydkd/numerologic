import { test } from "node:test";
import assert from "node:assert/strict";
import { sexprToInfix } from "../ui.js";

test("sexprToInfix: suma amb signe, productes i parèntesis mínims", () => {
  assert.equal(sexprToInfix("(* (+ 1 9) 3)"), "(1 + 9) × 3");
  assert.equal(sexprToInfix("(* 2 3 5)"), "2 × 3 × 5");
  assert.equal(sexprToInfix("(+ (* 3 7) 9)"), "3 × 7 + 9");          // × lliga més que +
  assert.equal(sexprToInfix("(+ (~ 3) 9)"), "9 − 3");                // terme negatiu → resta
  assert.equal(sexprToInfix("(+ (* 2 5 7) (~ 4) (~ 6))"), "2 × 5 × 7 − 4 − 6"); // el report del Pau
  assert.equal(sexprToInfix("(+ (~ 4) (~ 6))"), "−4 − 6");           // tot negatiu
  assert.equal(sexprToInfix("(+ (~ (* 3 7)) 5)"), "5 − 3 × 7");      // producte negatiu
  assert.equal(sexprToInfix("(/ 12 (* 2 3))"), "12 ÷ (2 × 3)");      // divisor producte → parèntesis
});
