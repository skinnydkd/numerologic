import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, InvalidExpr, CAP } from "../evaluator.js";

test("num", () => assert.equal(evaluate(["num", 5]), 5));

test("operacions bàsiques", () => {
  assert.equal(evaluate(["add", ["num", 3], ["num", 4]]), 7);
  assert.equal(evaluate(["sub", ["num", 3], ["num", 4]]), -1);
  assert.equal(evaluate(["mul", ["num", 3], ["num", 4]]), 12);
});

test("divisió exacta", () => {
  assert.equal(evaluate(["div", ["num", 8], ["num", 4]]), 2);
  assert.throws(() => evaluate(["div", ["num", 7], ["num", 2]]), InvalidExpr);
  assert.throws(() => evaluate(["div", ["num", 4], ["num", 0]]), InvalidExpr);
});

test("regles de potència", () => {
  assert.equal(evaluate(["pow", ["num", 2], ["num", 3]]), 8);
  assert.throws(
    () => evaluate(["pow", ["num", 2], ["sub", ["num", 1], ["num", 3]]]),
    InvalidExpr
  );
  assert.throws(() => evaluate(["pow", ["num", 0], ["num", 0]]), InvalidExpr);
  assert.throws(() => evaluate(["pow", ["num", 2], ["num", 99]]), InvalidExpr);
});

test("regles d'arrel", () => {
  assert.equal(evaluate(["sqrt", ["num", 9]]), 3);
  assert.throws(() => evaluate(["sqrt", ["num", 8]]), InvalidExpr);
  assert.throws(() => evaluate(["sqrt", ["sub", ["num", 1], ["num", 5]]]), InvalidExpr);
  assert.throws(() => evaluate(["sqrt", ["num", 1]]), InvalidExpr);
});

test("cap de valor", () => {
  assert.throws(() => evaluate(["pow", ["num", 9], ["num", 7]]), InvalidExpr);
  assert.equal(CAP, 1_000_000);
});

test("cap aplica a totes les operacions", () => {
  // mul que supera el cap
  assert.throws(() => evaluate(["mul", ["num", 999], ["num", 9999]]), InvalidExpr);
});

test("divisió exacta amb negatius (paritat amb Python //)", () => {
  assert.equal(evaluate(["div", ["num", 6], ["num", -2]]), -3);
  assert.equal(evaluate(["div", ["num", -8], ["num", 4]]), -2);
  assert.throws(() => evaluate(["div", ["num", -7], ["num", 2]]), InvalidExpr);
});
