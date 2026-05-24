import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, ParseError } from "../parser.js";

test("dígit simple", () => assert.deepEqual(parse("3"), ["num", 3]));

test("precedència * abans +", () => {
  assert.deepEqual(parse("2+3*4"), ["add", ["num", 2], ["mul", ["num", 3], ["num", 4]]]);
});

test("parèntesis", () => {
  assert.deepEqual(parse("(2+3)*4"), ["mul", ["add", ["num", 2], ["num", 3]], ["num", 4]]);
});

test("^ associativa per la dreta", () => {
  assert.deepEqual(parse("2^3^2"), ["pow", ["num", 2], ["pow", ["num", 3], ["num", 2]]]);
});

test("√ unari lliga més fort que ^", () => {
  assert.deepEqual(parse("√9^2"), ["pow", ["sqrt", ["num", 9]], ["num", 2]]);
});

test("resta associativa per l'esquerra", () => {
  assert.deepEqual(parse("9-3-2"), ["sub", ["sub", ["num", 9], ["num", 3]], ["num", 2]]);
});

test("errors de sintaxi", () => {
  assert.throws(() => parse("2+"), ParseError);
  assert.throws(() => parse("(2+3"), ParseError);
  assert.throws(() => parse("2@3"), ParseError);
});
