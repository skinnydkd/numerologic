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

test("el pool publicat: 364 reptes vàlids, Maxi de 10 en diumenge", () => {
  const pool = JSON.parse(readFileSync(join(here, "..", "..", "data", "puzzles.json"), "utf-8"));
  assert.equal(pool.puzzles.length, 364);
  assert.equal(pool.startDate, "2026-10-26");
  pool.puzzles.forEach((p, i) => {
    assert.ok(isValid(p.eq), p.eq);
    const sunday = new Date(Date.UTC(2026, 9, 26 + i)).getUTCDay() === 0;
    assert.equal(!!p.maxi, sunday, `índex ${i}`);
    assert.equal(p.eq.length, sunday ? 10 : 8, p.eq);
  });
});
