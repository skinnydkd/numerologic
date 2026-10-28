import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, rankFor, formatTime, CHECK_PENALTY, HINT_PENALTY } from "../game.js";

const SOL = [[1, 2], [2, 1]];
const P = { size: 2, solution: SOL, refSeconds: 100, order: [[1, 1], [0, 0], [0, 1], [1, 0]], cages: [] };
const idx = (r, c) => r * 2 + c;

function fill(g) {
  SOL.forEach((row, r) => row.forEach((v, c) => g.set(idx(r, c), v)));
}

test("omplir-la bé la resol sola i para el rellotge", () => {
  const g = createGame(P);
  g.tick(40);
  fill(g);
  assert.ok(g.solved && g.perfect);
  g.tick(30);
  assert.equal(g.seconds(), 40);
  assert.equal(g.rank(), "Llegenda"); // 40/100 ≤ 0,5
});

test("llindars de rang per temps relatiu", () => {
  assert.equal(rankFor(50, 100), "Llegenda");
  assert.equal(rankFor(51, 100), "Geni");
  assert.equal(rankFor(70, 100), "Geni");
  assert.equal(rankFor(100, 100), "Mestre");
  assert.equal(rankFor(150, 100), "Expert");
  assert.equal(rankFor(200, 100), "Avançat");
  assert.equal(rankFor(300, 100), "Aprenent");
  assert.equal(rankFor(301, 100), "Principiant");
});

test("comprovació errònia: +30 s i marca les cel·les", () => {
  const g = createGame(P);
  g.set(idx(0, 0), 2);
  g.set(idx(0, 1), 2);
  assert.deepEqual(g.check(), [idx(0, 0)]);
  assert.equal(g.seconds(), CHECK_PENALTY);
  const ok = createGame(P);
  ok.set(idx(0, 0), 1);
  assert.deepEqual(ok.check(), []);
  assert.equal(ok.seconds(), 0); // comprovar el que està bé no penalitza
});

test("pista: revela en l'ordre del solucionador, +60 s, cel·la fixa i sense ★", () => {
  const g = createGame(P);
  g.set(idx(1, 1), 2); // errònia: la pista la corregeix primer
  assert.equal(g.hint(), idx(1, 1));
  assert.equal(g.values[idx(1, 1)], 1);
  assert.ok(g.isLocked(idx(1, 1)));
  assert.equal(g.set(idx(1, 1), 2), false);
  assert.equal(g.seconds(), HINT_PENALTY);
  fill(g);
  assert.ok(g.solved && !g.perfect);
});

test("notes: es commuten i escriure un valor les esborra", () => {
  const g = createGame(P);
  g.toggleNote(0, 1);
  g.toggleNote(0, 2);
  g.toggleNote(0, 1);
  assert.deepEqual(g.notes[0], [2]);
  g.set(0, 1);
  assert.deepEqual(g.notes[0], []);
  assert.equal(g.toggleNote(0, 2), false); // amb valor no s'hi apunten notes
});

test("restaura el progrés desat", () => {
  const g = createGame(P);
  g.tick(12);
  g.set(0, 1);
  g.toggleNote(1, 2);
  g.hint();
  const again = createGame(P, JSON.parse(JSON.stringify(g.progress())));
  assert.equal(again.values[0], 1);
  assert.deepEqual(again.notes[1], [2]);
  assert.ok(again.isLocked(idx(1, 1)));
  assert.equal(again.seconds(), 12 + HINT_PENALTY);
});

test("format del temps", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(192), "3:12");
  assert.equal(formatTime(3725), "62:05");
});
