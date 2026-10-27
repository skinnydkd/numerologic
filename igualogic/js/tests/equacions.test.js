import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { evalLhs, isValid, feedback } from "../equacions.js";

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, "fixtures", "equacions_fixtures.json"), "utf-8"));

test("paritat de validesa i valor amb Python", () => {
  assert.ok(data.equations.length >= 600);
  for (const c of data.equations) {
    assert.equal(isValid(c.eq), c.valid, "isValid divergeix per " + c.eq);
    assert.equal(evalLhs(c.eq.split("=")[0]), c.lhs, "evalLhs divergeix per " + c.eq);
  }
});

test("paritat de colors amb Python", () => {
  assert.ok(data.colors.length >= 100);
  for (const c of data.colors) {
    assert.equal(feedback(c.guess, c.answer), c.colors, `${c.guess} vs ${c.answer}`);
  }
});
