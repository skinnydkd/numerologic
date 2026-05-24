import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { canonical } from "../canonical.js";
import { evaluate, InvalidExpr } from "../evaluator.js";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "fixtures", "canonical_fixtures.json"), "utf-8")
);

test("paritat canonica amb Python", () => {
  assert.ok(cases.length >= 16);
  for (const c of cases) {
    assert.equal(canonical(c.ast), c.canonical, "canonical divergeix per " + JSON.stringify(c.ast));
  }
});

test("paritat de l'avaluador amb Python", () => {
  for (const c of cases) {
    if (c.valid) {
      assert.equal(evaluate(c.ast), c.value, "value divergeix per " + JSON.stringify(c.ast));
    } else {
      assert.throws(() => evaluate(c.ast), InvalidExpr, "hauria de ser invalid: " + JSON.stringify(c.ast));
    }
  }
});
