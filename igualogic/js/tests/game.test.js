import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, hintValues, MAX_GUESSES } from "../game.js";

const P = { eq: "3*7-4=17", difficulty: "mitja" };

test("guanya a la primera: Llegenda", () => {
  const g = createGame(P);
  assert.equal(g.submit("3*7-4=17").status, "won");
  assert.ok(g.won);
  assert.equal(g.rank(), "Llegenda");
});

test("el rang baixa amb els intents i perdre és Principiant", () => {
  const g = createGame(P);
  assert.equal(g.rank(), null); // en joc
  for (let i = 0; i < MAX_GUESSES - 1; i++) assert.equal(g.submit("2+3*4=14").status, "guess");
  assert.equal(g.submit("9-10+6=5").status, "lost");
  assert.ok(g.lost && !g.won);
  assert.equal(g.rank(), "Principiant");
  assert.equal(g.submit("3*7-4=17").status, "done");

  const h = createGame(P);
  h.submit("2+3*4=14"); h.submit("2+3*4=14");
  h.submit("3*7-4=17");
  assert.equal(h.rank(), "Mestre");
});

test("intents invàlids no compten", () => {
  const g = createGame(P);
  assert.equal(g.submit("2+3*4=1").status, "invalid");   // llargària
  assert.equal(g.submit("2+3*4=15").status, "invalid");  // falsa
  assert.equal(g.submit("08+16=24").status, "invalid");  // zero a l'esquerra
  assert.equal(g.guesses.length, 0);
});

test("pistes limiten el rang a Expert", () => {
  const g = createGame(P);
  g.useHint(0);
  g.submit("3*7-4=17");
  assert.equal(g.rank(), "Expert");
  const h = createGame(P);
  h.useHint(2);
  for (let i = 0; i < 4; i++) h.submit("2+3*4=14");
  h.submit("3*7-4=17");
  assert.equal(h.rank(), "Avançat"); // 5 intents ja és per sota d'Expert
});

test("valors de les pistes", () => {
  assert.deepEqual(hintValues("3*7-4=17"), { ops: 2, resultDigits: 2, repeated: true });
  assert.deepEqual(hintValues("68-45=23"), { ops: 1, resultDigits: 2, repeated: false });
});

test("mode difícil: només abans del primer intent", () => {
  const g = createGame(P);
  g.submit("2+3*4=14");
  assert.equal(g.setHard(true), false);
  assert.equal(g.hard, false);
  const h = createGame(P);
  assert.equal(h.setHard(true), true);
  assert.ok(h.hard);
});

test("mode difícil obliga a reutilitzar turqueses i ors", () => {
  const g = createGame({ eq: "3*7-4=17" });
  g.setHard(true);
  assert.equal(g.submit("3+2*7=17").status, "guess"); // 3 g, '=' g, '1' g, '7' g, '*' y, '7' y
  const r1 = g.submit("2+3*4=14");
  assert.equal(r1.status, "hardfail");
  assert.match(r1.reason, /posició 1/);
  const r2 = g.submit("3+9+5=17"); // turqueses al lloc, però només un 7 i cap ×
  assert.equal(r2.status, "hardfail");
  assert.match(r2.reason, /Cal fer servir/);
  assert.equal(g.submit("3*7-4=17").status, "won");
  assert.equal(g.rank(), "Geni");
});

test("colors del teclat: el millor color guanya", () => {
  const g = createGame(P);
  g.submit("3+2*7=17");
  const k = g.keyColors();
  assert.equal(k["3"], "g");
  assert.equal(k["*"], "y");
  assert.equal(k["+"], "x");
  assert.equal(k["9"], undefined);
});

test("restaura el progrés desat", () => {
  const g = createGame(P);
  g.setHard(true);
  g.useHint(1);
  g.submit("2+3*4=14");
  const again = createGame(P, JSON.parse(JSON.stringify(g.progress())));
  assert.deepEqual(again.guesses, ["2+3*4=14"]);
  assert.ok(again.hard);
  assert.deepEqual([...again.hintsUsed], [1]);
  assert.deepEqual(again.rows(), [{ guess: "2+3*4=14", colors: g.rows()[0].colors }]);
});
