import { test } from "node:test";
import assert from "node:assert/strict";
import {
  esc, introHTML, listHTML, leagueHTML, panelHTML, debounce,
  loadPlayer, savePlayer, loadLeague, saveLeague,
} from "../ranking.js";

function fakeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
}

test("jugador: round-trip i esborrat", () => {
  const s = fakeStore();
  assert.equal(loadPlayer(s), null);
  savePlayer(s, { token: "abc", alias: "Rusc Taronja 42" });
  assert.deepEqual(loadPlayer(s), { token: "abc", alias: "Rusc Taronja 42" });
  savePlayer(s, null);
  assert.equal(loadPlayer(s), null);
});

test("jugador: JSON corrupte o sense token -> null", () => {
  const s = fakeStore();
  s.setItem("numerologic:jugador", "{no json");
  assert.equal(loadPlayer(s), null);
  s.setItem("numerologic:jugador", JSON.stringify({ alias: "x" }));
  assert.equal(loadPlayer(s), null);
});

test("lliga: desa, llegeix i esborra", () => {
  const s = fakeStore();
  assert.equal(loadLeague(s), null);
  saveLeague(s, "ABC123");
  assert.equal(loadLeague(s), "ABC123");
  saveLeague(s, null);
  assert.equal(loadLeague(s), null);
});

test("store que llança no trenca res", () => {
  const bad = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
  assert.equal(loadPlayer(bad), null);
  assert.equal(loadLeague(bad), null);
  savePlayer(bad, { token: "t", alias: "a" });
  saveLeague(bad, "X");
});

test("esc escapa HTML", () => {
  assert.equal(esc(`<img src=x onerror="a">&'`), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
});

test("llista: escapa àlies i marca la fila pròpia", () => {
  const html = listHTML({
    top: [
      { posicio: 1, alias: "<b>Hack</b>", punts: 30, jo: false },
      { posicio: 2, alias: "Jo mateix", punts: 20, jo: true },
    ],
    jo: { posicio: 2, punts: 20, alias: "Jo mateix" },
  });
  assert.ok(!html.includes("<b>Hack</b>"));
  assert.ok(html.includes("&lt;b&gt;Hack&lt;/b&gt;"));
  assert.equal((html.match(/class="rk-row jo"/g) || []).length, 1);
  assert.ok(!html.includes("rk-own")); // ja és al top: no es repeteix
});

test("llista: posició pròpia fora del top va a part, ressaltada", () => {
  const html = listHTML({
    top: [{ posicio: 1, alias: "A", punts: 9, jo: false }],
    jo: { posicio: 57, punts: 3, alias: "Jo" },
  });
  assert.ok(html.includes("rk-own"));
  assert.ok(html.includes(">57<"));
  assert.equal((html.match(/rk-row jo/g) || []).length, 1);
});

test("llista: carregant i buida", () => {
  assert.ok(listHTML(null).includes("Carregant"));
  assert.ok(listHTML({ top: [], jo: null }).includes("Encara no hi ha ningú"));
});

test("lliga: escapa el codi; sense lliga mostra unir/crear", () => {
  assert.ok(leagueHTML("<X>").includes("&lt;X&gt;"));
  assert.ok(leagueHTML("AB12").includes('data-rk="surt-lliga"'));
  const none = leagueHTML(null);
  assert.ok(none.includes('data-rk="uneix"') && none.includes('data-rk="crea"'));
});

test("panell: pestanya activa, àlies escapat i lliga desactivada sense lliga", () => {
  const html = panelHTML({ alias: "<i>x</i>", lliga: null, periode: "mes", ambit: "global", data: null, msg: "" });
  assert.ok(html.includes("&lt;i&gt;x&lt;/i&gt;"));
  assert.ok(/data-v="mes" aria-pressed="true"/.test(html));
  assert.ok(/data-v="dia" aria-pressed="false"/.test(html));
  assert.ok(/data-v="lliga" aria-pressed="false" disabled/.test(html));
  assert.ok(html.includes('data-rk="surt"') && html.includes('data-rk="alias"'));
});

test("intro: text d'opt-in i botó", () => {
  const html = introHTML();
  assert.ok(html.includes("Vols aparèixer al rànquing?"));
  assert.ok(html.includes('data-rk="entra"'));
  assert.ok(introHTML("<e>").includes("&lt;e&gt;"));
});

test("debounce: col·lapsa crides en una sola", () => {
  const queue = new Map();
  let next = 1;
  const timers = {
    set: (fn) => { queue.set(next, fn); return next++; },
    clear: (id) => queue.delete(id),
  };
  let calls = 0;
  const d = debounce(() => { calls++; }, 3000, timers);
  d(); d(); d();
  assert.equal(queue.size, 1);
  const [id, fire] = [...queue][0];
  queue.delete(id);
  fire();
  assert.equal(calls, 1);
  d();
  assert.equal(queue.size, 1);
});
