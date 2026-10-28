import { test } from "node:test";
import assert from "node:assert/strict";
import { buildShareText } from "../share.js";
import { createGame, MAX_GUESSES } from "../game.js";

test("text de compartir: capçalera, graella, ratxa i URL, sense la solució", () => {
  const g = createGame({ eq: "3*7-4=17" });
  g.setHard(true);
  g.submit("3+2*7=17");
  g.submit("3*7-4=17");
  const text = buildShareText({
    number: 12, rows: g.rows(), won: g.won, maxGuesses: MAX_GUESSES,
    rankName: g.rank(), hard: g.hard, streak: 4,
  });
  assert.equal(text, [
    "Igualògic #12 · 2/6 · Geni ★",
    "🟦⬜⬜🟨🟨🟦🟦🟦",
    "🟦🟦🟦🟦🟦🟦🟦🟦",
    "🔥 Ratxa 4",
    "https://numerologic.cat/igualogic/",
  ].join("\n"));
  assert.ok(!/\d[+\-*/=]/.test(text.split("\n").slice(1, 3).join("")));
});

test("partida perduda: X/6 i sense ★ ni ratxa", () => {
  const text = buildShareText({
    number: 3, rows: [{ colors: "xxxxxxxx" }], won: false, maxGuesses: 6,
    rankName: "Principiant", hard: true, streak: 0,
  });
  assert.equal(text.split("\n")[0], "Igualògic #3 · X/6 · Principiant");
  assert.ok(!text.includes("Ratxa"));
});
