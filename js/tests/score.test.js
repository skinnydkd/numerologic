import { test } from "node:test";
import assert from "node:assert/strict";
import { solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits } from "../score.js";

test("solutionPoints", () => {
  assert.equal(solutionPoints(2, false), 2);
  assert.equal(solutionPoints(3, true), 5);
});

test("hasPowOrSqrt", () => {
  assert.equal(hasPowOrSqrt(["pow", ["num", 2], ["num", 3]]), true);
  assert.equal(hasPowOrSqrt(["sqrt", ["num", 9]]), true);
  assert.equal(hasPowOrSqrt(["add", ["num", 1], ["mul", ["num", 2], ["num", 3]]]), false);
});

test("countLeaves", () => {
  assert.equal(countLeaves(["num", 5]), 1);
  assert.equal(countLeaves(["add", ["num", 1], ["mul", ["num", 2], ["num", 3]]]), 3);
  assert.equal(countLeaves(["sqrt", ["add", ["num", 1], ["num", 2]]]), 2);
});

test("usesAllDigits", () => {
  assert.equal(usesAllDigits(["add", ["num", 1], ["num", 2]], [1, 2]), true);
  assert.equal(usesAllDigits(["add", ["num", 1], ["num", 2]], [1, 2, 3]), false);
  assert.equal(usesAllDigits(["mul", ["num", 2], ["num", 2]], [2]), true);
});
