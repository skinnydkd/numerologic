import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../js/game.js";
import { fakeRedis } from "./fake-redis.js";
import { ApiError, gestiona, jugador, lliga, puntsDe, ranquing, repteDAvui, sync, tempsMadrid } from "./ranquing.js";

// Repte real (4*7 = 28) al mig d'un pool petit; els altres dies són de farciment.
const REAL = {
  target: 28,
  digits: [1, 2, 3, 4, 5, 6, 7],
  centralIndex: 6,
  solutions: ["(* 4 7)"],
  totalPoints: 12,
  ranks: [["Principiant", 0], ["Mig", 6], ["Llegenda", 12]],
  hasTutti: true,
  rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
};
const POOL = { startDate: "2026-10-26", puzzles: [{ ...REAL, target: 99 }, REAL, { ...REAL, target: 98 }] };
// 2026-10-27 11:00 a Madrid (CET): dia 1 des de l'inici -> índex 1, numero 2.
const NOW = Date.UTC(2026, 9, 27, 10, 0, 0);
const DIA = "2026-10-27";
const EXPS = ["4*7", "(1+3)*7", "(5-1)*7"];

function esperat(exps) {
  const g = createGame(REAL);
  for (const e of exps) g.submit(e);
  return g.score();
}

async function nouJugador(redis) {
  const r = await jugador(redis, { token: null, body: {} });
  assert.equal(r[1], 201);
  return r[0].token;
}

// Avança el rellotge del Redis fals perquè el límit de 2 s no molesti (excepte als tests que el proven).
async function sincro(redis, token, expressions, now = NOW) {
  redis.avanca(3000);
  return sync(redis, { token, body: { expressions } }, { pool: POOL, now });
}

const codi = (redis, token) => lliga(redis, { token, body: { accio: "crea" } }).then((r) => r.codi);
const rebutja = (p, status) => assert.rejects(p, (e) => e instanceof ApiError && e.status === status && Boolean(e.message));

test("el servidor tria el repte d'avui (Madrid) i numero = índex + 1", () => {
  assert.equal(repteDAvui(POOL, tempsMadrid(NOW)).numero, 2);
  assert.equal(repteDAvui(POOL, tempsMadrid(NOW + 86400000)).numero, 3);
  assert.equal(repteDAvui(POOL, tempsMadrid(NOW + 2 * 86400000)).numero, 1); // dóna la volta
});

test("tempsMadrid: la mitjanit és de Madrid, no UTC", () => {
  const abans = tempsMadrid(Date.UTC(2026, 9, 27, 22, 59, 59)); // 23:59:59 a Madrid
  const despres = tempsMadrid(Date.UTC(2026, 9, 27, 23, 0, 0)); // 00:00:00 el 28
  assert.equal(abans.dia, "2026-10-27");
  assert.equal(abans.segons, 86399);
  assert.equal(despres.dia, "2026-10-28");
  assert.equal(despres.segons, 0);
});

test("sync: punts calculats pel servidor, iguals que els de createGame", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const r = await sincro(redis, t, EXPS);
  assert.equal(r.punts, esperat(EXPS));
  assert.ok(r.punts > 2);
  assert.equal(r.dia, DIA);
  assert.equal(r.numero, 2);
});

test("sync idempotent: el mateix llistat dues vegades no canvia mes ni sempre", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const a = await sincro(redis, t, EXPS);
  const b = await sincro(redis, t, EXPS);
  assert.equal(b.punts, a.punts);
  const r = await ranquing(redis, { token: t, query: { periode: "mes" } }, { now: NOW });
  assert.equal(r.jo.punts, a.punts);
  const s = await ranquing(redis, { token: t, query: { periode: "sempre" } }, { now: NOW });
  assert.equal(s.jo.punts, a.punts);
});

test("expressions invàlides o brossa s'ignoren", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const r = await sincro(redis, t, ["4*7", "garbage((", "1/0", "", "((((", "9*9", "4*7*1", "\u0000", "2^^3"]);
  assert.equal(r.punts, esperat(["4*7"]));
});

test("una re-sincronització més baixa no redueix la puntuació", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const alta = await sincro(redis, t, EXPS);
  const baixa = await sincro(redis, t, ["4*7"]);
  assert.equal(baixa.punts, alta.punts);
  const r = await ranquing(redis, { token: t, query: { periode: "dia" } }, { now: NOW });
  assert.equal(r.jo.punts, alta.punts);
});

test("mes i sempre reben la diferència (nova − vella), no la suma", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const primera = await sincro(redis, t, ["4*7"]);
  assert.equal(primera.punts, esperat(["4*7"]));
  const segona = await sincro(redis, t, EXPS);
  for (const periode of ["dia", "mes", "sempre"]) {
    const r = await ranquing(redis, { token: t, query: { periode } }, { now: NOW });
    assert.equal(r.jo.punts, segona.punts, periode);
  }
  // Un altre dia suma al mes i a sempre, però no al rànquing d'aquell dia.
  const demà = NOW + 86400000;
  const tercera = await sincro(redis, t, ["4*7"], demà); // el repte de demà té un altre objectiu: 0 punts
  assert.equal(tercera.punts, 0);
});

test("el mes i el sempre acumulen dies diferents", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const dia1 = await sincro(redis, t, EXPS);
  // Dia 3 del pool (índex 2 -> objectiu 98) no és resoluble amb 4*7; fem servir un pool on tots són REAL.
  const pool = { startDate: "2026-10-26", puzzles: [REAL, REAL, REAL] };
  redis.avanca(3000);
  const dia2 = await sync(redis, { token: t, body: { expressions: ["4*7"] } }, { pool, now: NOW + 86400000 });
  const mes = await ranquing(redis, { token: t, query: { periode: "mes" } }, { now: NOW + 86400000 });
  assert.equal(mes.jo.punts, dia1.punts + dia2.punts);
  const avui = await ranquing(redis, { token: t, query: { periode: "dia" } }, { now: NOW + 86400000 });
  assert.equal(avui.jo.punts, dia2.punts);
});

test("claus de caducitat: EXPIREAT al tancament + marge", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  await sincro(redis, t, EXPS);
  assert.equal(redis.caducitats.get(`r:dia:${DIA}`), Date.UTC(2026, 9, 28) / 1000 + 2 * 86400);
  assert.equal(redis.caducitats.get("r:mes:2026-10"), Date.UTC(2026, 10, 1) / 1000 + 40 * 86400);
  assert.equal(redis.caducitats.has("r:sempre"), false);
});

test("lligues: les claus de la lliga s'actualitzen igual que les globals", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const c = await codi(redis, t);
  const r = await sincro(redis, t, EXPS);
  for (const k of [`r:dia:${DIA}:${c}`, `r:mes:2026-10:${c}`, `r:sempre:${c}`]) {
    const z = await redis.zrange(k, 0, -1, { withScores: true });
    assert.equal(Math.floor(z[1]), r.punts, k);
  }
  assert.ok(redis.caducitats.has(`r:dia:${DIA}:${c}`));
  const l = await ranquing(redis, { token: t, query: { periode: "dia", ambit: "lliga" } }, { now: NOW });
  assert.equal(l.lliga, c);
  assert.equal(l.top.length, 1);
  assert.equal(l.jo.punts, r.punts);
});

test("qui s'uneix a una lliga després de puntuar hi apareix al pròxim sync", async () => {
  const redis = fakeRedis();
  const prof = await nouJugador(redis);
  const c = await codi(redis, prof);
  const alu = await nouJugador(redis);
  const r = await sincro(redis, alu, EXPS);
  await lliga(redis, { token: alu, body: { accio: "uneix", codi: c } }, { now: NOW });
  await sincro(redis, alu, EXPS);
  const l = await ranquing(redis, { token: alu, query: { periode: "dia", ambit: "lliga" } }, { now: NOW });
  assert.equal(l.jo.punts, r.punts);
  const g = await ranquing(redis, { token: alu, query: { periode: "sempre" } }, { now: NOW });
  assert.equal(g.jo.punts, r.punts); // el global no es duplica
});

test("desempat: a punts iguals va davant qui hi ha arribat abans", async () => {
  const redis = fakeRedis();
  const tard = await nouJugador(redis);
  const aviat = await nouJugador(redis);
  await sincro(redis, tard, EXPS, NOW + 300000);
  await sincro(redis, aviat, EXPS, NOW);
  const r = await ranquing(redis, { token: tard, query: { periode: "dia" } }, { now: NOW });
  assert.equal(r.top.length, 2);
  assert.equal(r.top[0].punts, r.top[1].punts); // la fracció no es veu
  assert.equal(r.top[0].jo, false);
  assert.equal(r.top[1].jo, true);
  assert.equal(r.jo.posicio, 2);
  assert.ok(Number.isInteger(r.top[0].punts));
});

test("ranquing: ordre per punts, posicions i marca 'jo'", async () => {
  const redis = fakeRedis();
  const a = await nouJugador(redis);
  const b = await nouJugador(redis);
  await sincro(redis, a, ["4*7"]);
  await sincro(redis, b, EXPS);
  const r = await ranquing(redis, { token: a, query: { periode: "sempre" } }, { now: NOW });
  assert.deepEqual(r.top.map((x) => [x.posicio, x.jo]), [[1, false], [2, true]]);
  assert.equal(r.top[0].punts, esperat(EXPS));
  assert.match(r.top[0].alias, /^\S+ \S+ \d\d$/);
  assert.equal(r.jo.alias, r.top[1].alias);
  // Sense autenticació: top però sense 'jo'.
  const anon = await ranquing(redis, { token: null, query: {} }, { now: NOW });
  assert.equal(anon.periode, "dia");
  assert.equal(anon.ambit, "global");
  assert.equal(anon.jo, null);
  assert.equal(anon.top.length, 2);
});

test("ranquing: el top es limita a 20 i 'jo' fora del top té posició real", async () => {
  const redis = fakeRedis();
  const jo = await nouJugador(redis);
  await sincro(redis, jo, ["4*7"]);
  for (let i = 0; i < 20; i++) await sincro(redis, await nouJugador(redis), EXPS);
  const r = await ranquing(redis, { token: jo, query: { periode: "sempre" } }, { now: NOW });
  assert.equal(r.top.length, 20);
  assert.equal(r.jo.posicio, 21);
});

test("ranquing: ambit=lliga sense lliga -> buit; paràmetres dolents -> 400", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  await sincro(redis, t, EXPS);
  const r = await ranquing(redis, { token: t, query: { ambit: "lliga" } }, { now: NOW });
  assert.deepEqual(r, { periode: "dia", ambit: "lliga", lliga: null, top: [], jo: null });
  await rebutja(ranquing(redis, { token: t, query: { periode: "any" } }), 400);
  await rebutja(ranquing(redis, { token: t, query: { ambit: "pais" } }), 400);
});

test("límit de freqüència: segona sincronització immediata -> 429", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const ctx = { token: t, body: { expressions: EXPS } };
  await sync(redis, ctx, { pool: POOL, now: NOW });
  await rebutja(sync(redis, ctx, { pool: POOL, now: NOW }), 429);
  redis.avanca(2001);
  await sync(redis, ctx, { pool: POOL, now: NOW }); // ja passen els 2 s
});

test("token desconegut o absent -> 401", async () => {
  const redis = fakeRedis();
  const ctx = { body: { expressions: EXPS } };
  await rebutja(sync(redis, { ...ctx, token: "inventat" }, { pool: POOL }), 401);
  await rebutja(sync(redis, { ...ctx, token: null }, { pool: POOL }), 401);
  await rebutja(lliga(redis, { token: "inventat", body: { accio: "crea" } }), 401);
  await rebutja(jugador(redis, { token: "inventat", body: { accio: "alias" } }), 401);
});

test("límits d'entrada -> 400", async () => {
  const redis = fakeRedis();
  const t = await nouJugador(redis);
  const prova = (expressions) => sincro(redis, t, expressions);
  await rebutja(prova("4*7"), 400);
  await rebutja(prova(undefined), 400);
  await rebutja(prova(Array(301).fill("4*7")), 400);
  await rebutja(prova(["x".repeat(81)]), 400);
  await rebutja(prova([42]), 400);
  await prova(Array(300).fill("4*7")); // el límit exacte és vàlid
  await prova(["1+".repeat(39) + "1"]); // 79 caràcters
});

test("jugador: token només com a hash, àlies català i canvi d'àlies", async () => {
  const redis = fakeRedis();
  const [{ token, alias }, status] = await jugador(redis, { token: null, body: {} });
  assert.equal(status, 201);
  assert.match(alias, /^\S+ \S+ [1-9]\d$/);
  assert.ok(token.length >= 43);
  assert.equal(redis.claus().some((k) => k.includes(token)), false);
  const { alias: nou } = await jugador(redis, { token, body: { accio: "alias" } });
  assert.match(nou, /^\S+ \S+ [1-9]\d$/);
  await rebutja(jugador(redis, { token, body: { accio: "x" } }), 400);
});

test("surt: esborra el jugador i el treu de tots els rànquings", async () => {
  const redis = fakeRedis();
  const altre = await nouJugador(redis);
  const t = await nouJugador(redis);
  const c = await codi(redis, t);
  await sincro(redis, altre, EXPS);
  await sincro(redis, t, EXPS);
  const abans = await ranquing(redis, { token: t, query: { periode: "sempre" } }, { now: NOW });
  const pid = await redis.get(`lliga:${await pidDeAlias(redis, abans.jo.alias)}`);
  assert.equal(pid, c);
  assert.deepEqual(await jugador(redis, { token: t, body: { accio: "surt" } }, { now: NOW }), { ok: true });
  // Cap clau del jugador: ni tok/alias/lliga/rl ni membre als ZSET (global ni de lliga).
  const claus = redis.claus();
  assert.equal(claus.filter((k) => k.startsWith("tok:")).length, 1); // només l'altre
  assert.equal(claus.filter((k) => k.startsWith("alias:")).length, 1);
  assert.equal(claus.filter((k) => k.startsWith("lliga:")).length, 0);
  for (const k of claus.filter((k) => k.startsWith("r:"))) {
    const z = await redis.zrange(k, 0, -1);
    assert.equal(z.length, k.endsWith(`:${c}`) ? 0 : 1, k);
  }
  await rebutja(sync(redis, { token: t, body: { expressions: EXPS } }, { pool: POOL, now: NOW }), 401);
  // La lliga continua existint.
  assert.deepEqual(await lliga(redis, { token: altre, body: { accio: "uneix", codi: c } }), { codi: c });
});

test("lliga: crea, uneix (sense distingir majúscules), 404 i surt", async () => {
  const redis = fakeRedis();
  const prof = await nouJugador(redis);
  const alu = await nouJugador(redis);
  const c = await codi(redis, prof);
  assert.match(c, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  assert.deepEqual(await lliga(redis, { token: alu, body: { accio: "uneix", codi: ` ${c.toLowerCase()} ` } }), { codi: c });
  await sincro(redis, prof, EXPS);
  await sincro(redis, alu, ["4*7"]);
  const r = await ranquing(redis, { token: alu, query: { periode: "dia", ambit: "lliga" } }, { now: NOW });
  assert.equal(r.top.length, 2);
  assert.equal(r.lliga, c);
  await rebutja(lliga(redis, { token: alu, body: { accio: "uneix", codi: "ZZZZZZ" } }), 404);
  await rebutja(lliga(redis, { token: alu, body: { accio: "uneix", codi: "no" } }), 404);
  await rebutja(lliga(redis, { token: alu, body: { accio: "uneix" } }), 404);
  // Surt: ja no apareix a la lliga però sí al global.
  assert.deepEqual(await lliga(redis, { token: alu, body: { accio: "surt" } }, { now: NOW }), { ok: true });
  const despres = await ranquing(redis, { token: prof, query: { periode: "dia", ambit: "lliga" } }, { now: NOW });
  assert.equal(despres.top.length, 1);
  const buit = await ranquing(redis, { token: alu, query: { ambit: "lliga" } }, { now: NOW });
  assert.equal(buit.lliga, null);
  const global = await ranquing(redis, { token: alu, query: {} }, { now: NOW });
  assert.equal(global.top.length, 2);
  await rebutja(lliga(redis, { token: alu, body: { accio: "xxx" } }), 400);
});

test("una sola lliga per jugador: crear-ne o unir-se a una altra deixa l'anterior", async () => {
  const redis = fakeRedis();
  const a = await nouJugador(redis);
  const b = await nouJugador(redis);
  const c1 = await codi(redis, a);
  await sincro(redis, a, EXPS);
  const c2 = await codi(redis, b);
  assert.notEqual(c1, c2);
  await lliga(redis, { token: a, body: { accio: "uneix", codi: c2 } }, { now: NOW });
  const vella = await redis.zrange(`r:dia:${DIA}:${c1}`, 0, -1);
  assert.equal(vella.length, 0);
  const l = await ranquing(redis, { token: a, query: { ambit: "lliga" } }, { now: NOW });
  assert.equal(l.lliga, c2);
});

test("puntsDe: no depèn del que envia el client (cap savedProgress)", () => {
  assert.equal(puntsDe(REAL, ["4*7", "4*7"]), esperat(["4*7"]));
  assert.equal(puntsDe(REAL, []), 0);
});

test("gestiona: Bearer, JSON, 201, errors de l'API i error intern emmascarat", async () => {
  const post = (cos, headers = {}) =>
    new Request("http://x/api/y", { method: "POST", headers, body: cos });
  let ctx;
  const ok = await gestiona(post('{"a":1}', { authorization: "Bearer abc" }), (c) => ((ctx = c), [{ ok: 1 }, 201]));
  assert.equal(ok.status, 201);
  assert.equal(ctx.token, "abc");
  assert.deepEqual(ctx.body, { a: 1 });
  assert.equal((await gestiona(post(""), (c) => ((ctx = c), {}))).status, 200);
  assert.deepEqual(ctx.body, {});
  assert.equal(ctx.token, null);
  for (const dolent of ["{no", "[1]", "null"]) assert.equal((await gestiona(post(dolent), () => ({}))).status, 400, dolent);
  const e = await gestiona(post("{}"), () => { throw new ApiError(404, "no hi és"); });
  assert.deepEqual([e.status, await e.json()], [404, { error: "no hi és" }]);
  const log = console.error;
  console.error = () => {};
  const r = await gestiona(post("{}"), () => { throw new Error("secret intern"); });
  console.error = log;
  assert.deepEqual([r.status, await r.json()], [500, { error: "Error del servidor" }]);
  const get = await gestiona(new Request("http://x/api/r?periode=mes&ambit=lliga"), (c) => c.query);
  assert.deepEqual(await get.json(), { periode: "mes", ambit: "lliga" });
});

// Troba el pid d'un àlies (els tests no el reben); el fals només té aquesta via.
async function pidDeAlias(redis, alias) {
  for (const k of redis.claus().filter((k) => k.startsWith("alias:"))) {
    if ((await redis.get(k)) === alias) return k.slice(6);
  }
}
