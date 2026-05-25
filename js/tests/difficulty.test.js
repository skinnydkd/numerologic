import { test } from "node:test";
import assert from "node:assert/strict";
import { difficulty } from "../difficulty.js";

test("fàcil: positiu petit (0..999)", () => {
  assert.equal(difficulty(617), "Fàcil");
  assert.equal(difficulty(0), "Fàcil");
  assert.equal(difficulty(999), "Fàcil");
});

test("mitjà: positiu gran o negatiu petit", () => {
  assert.equal(difficulty(1000), "Mitjà");
  assert.equal(difficulty(6569), "Mitjà");
  assert.equal(difficulty(-1), "Mitjà");
  assert.equal(difficulty(-999), "Mitjà");
});

test("difícil: negatiu gran (<= -1000)", () => {
  assert.equal(difficulty(-1000), "Difícil");
  assert.equal(difficulty(-6560), "Difícil");
});
