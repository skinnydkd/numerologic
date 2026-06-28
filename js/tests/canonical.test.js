import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical } from "../canonical.js";

test("num", () => {
  assert.equal(canonical(["num", 3]), "3");
});

test("ordre commutatiu i aplanat (mul)", () => {
  const a = ["mul", ["mul", ["num", 3], ["num", 4]], ["num", 2]];
  const b = ["mul", ["num", 2], ["mul", ["num", 4], ["num", 3]]];
  assert.equal(canonical(a), "(* 2 3 4)");
  assert.equal(canonical(b), "(* 2 3 4)");
});

test("aplanat add", () => {
  const a = ["add", ["add", ["num", 1], ["num", 2]], ["num", 3]];
  assert.equal(canonical(a), "(+ 1 2 3)");
});

test("la resta s'aplana a suma amb signe", () => {
  assert.equal(canonical(["sub", ["num", 5], ["num", 3]]), "(+ (~ 3) 5)");
  assert.equal(canonical(["sub", ["num", 3], ["num", 5]]), "(+ (~ 5) 3)");
});

test("no commutatius (÷, ^) mantenen l'ordre", () => {
  assert.equal(canonical(["div", ["num", 8], ["num", 4]]), "(/ 8 4)");
  assert.equal(canonical(["pow", ["num", 2], ["num", 3]]), "(^ 2 3)");
});

test("sqrt", () => {
  assert.equal(canonical(["sqrt", ["num", 9]]), "r(9)");
});

test("nombres diferents donen canòniques diferents", () => {
  assert.notEqual(
    canonical(["mul", ["num", 3], ["num", 8]]),
    canonical(["mul", ["num", 4], ["num", 6]])
  );
});
