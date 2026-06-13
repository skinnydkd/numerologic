import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../validate.js";

const rusc = { digits: [2, 3, 5, 6, 7, 8, 9], central: 5 };

test("expressió vàlida", () => {
  const r = validate(["add", ["num", 5], ["num", 3]], rusc);
  assert.equal(r.ok, true);
  assert.equal(r.value, 8);
});

test("dígit fora del rusc", () => {
  const r = validate(["add", ["num", 5], ["num", 1]], rusc); // 1 no és al rusc
  assert.equal(r.ok, false);
});

test("no usa el dígit central", () => {
  const r = validate(["add", ["num", 2], ["num", 3]], rusc); // sense 5
  assert.equal(r.ok, false);
});

test("regla del motor (divisió inexacta)", () => {
  const r = validate(["div", ["num", 5], ["num", 2]], rusc);
  assert.equal(r.ok, false);
});

test("variant sense repetir: dígit repetit -> invàlid", () => {
  const r = validate(["add", ["num", 5], ["num", 5]], { ...rusc, allowRepeat: false });
  assert.equal(r.ok, false);
});

test("variant amb operadors restringits: potència no permesa -> invàlid", () => {
  const r = validate(["pow", ["num", 5], ["num", 2]], { ...rusc, ops: ["add", "sub", "mul", "div"] });
  assert.equal(r.ok, false);
});
