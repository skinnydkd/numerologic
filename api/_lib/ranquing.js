// Lògica del rànquing (sense HTTP): rep el client Redis per paràmetre perquè es puga provar.
import { createHash, randomBytes, randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createGame } from "../../js/game.js";
import { dailyIndex } from "../../js/modes.js";

const DIA = 86400;
const ALFABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const NOMS = ["Rusc", "Hexàgon", "Dígit", "Càlcul", "Teorema", "Nombre", "Vèrtex", "Quocient", "Producte", "Sumand"];
const ADJECTIUS = ["Blau", "Vermell", "Groc", "Verd", "Lila", "Taronja", "Daurat", "Ràpid", "Parell", "Senar", "Curiós", "Valent"];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---- Entorn HTTP ----

// Executa fn({token, body, query}) i la converteix en Response. fn retorna el cos o [cos, estat].
export async function gestiona(request, fn) {
  try {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() || null : null;
    const query = Object.fromEntries(new URL(request.url).searchParams);
    let body = {};
    if (request.method === "POST") {
      const text = await request.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          throw new ApiError(400, "El cos no és un JSON vàlid");
        }
      }
      if (body === null || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "El cos no és vàlid");
    }
    const r = await fn({ token, body, query });
    const [cos, status] = Array.isArray(r) ? r : [r, 200];
    return Response.json(cos, { status, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
    console.error("rànquing: error intern", e);
    return Response.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ---- Puzzle i data ----

let poolPromise;
// Es llegeix una sola vegada per instància; path.join(process.cwd(), ...) el fa traçable a Vercel.
export function carregaPool() {
  poolPromise ??= readFile(path.join(process.cwd(), "data", "puzzles.json"), "utf8")
    .then(JSON.parse)
    .catch((e) => {
      poolPromise = undefined;
      throw e;
    });
  return poolPromise;
}

// Data i hora a Europe/Madrid, més les caducitats (EXPIREAT) de les claus d'aquest dia i mes.
export function tempsMadrid(nowMs) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(nowMs).map((x) => [x.type, x.value]));
  const [y, m, d] = [+p.year, +p.month, +p.day];
  return {
    dia: `${p.year}-${p.month}-${p.day}`,
    mes: `${p.year}-${p.month}`,
    segons: +p.hour * 3600 + +p.minute * 60 + +p.second,
    // Marge de 2 dies / 40 dies sobre el final (la diferència UTC/Madrid hi cap de sobra).
    expDia: Date.UTC(y, m - 1, d + 1) / 1000 + 2 * DIA,
    expMes: Date.UTC(y, m, 1) / 1000 + 40 * DIA,
  };
}

// Repte d'avui segons el servidor. Migdia local de la data de Madrid: dailyIndex és immune a DST i a la zona del servidor.
export function repteDAvui(pool, t) {
  const index = dailyIndex(pool.startDate, new Date(`${t.dia}T12:00:00`).getTime(), pool.puzzles.length);
  return { puzzle: pool.puzzles[index], numero: index + 1 };
}

// Punts reals: mateix createGame/submit/score que el joc. Les expressions no són de fiar.
export function puntsDe(puzzle, expressions) {
  const g = createGame(puzzle);
  for (const e of expressions) {
    try {
      g.submit(e);
    } catch {
      // expressió invàlida o que trenca el parser: s'ignora
    }
  }
  return g.score();
}

// ---- Claus i identitat ----

const hash = (token) => createHash("sha256").update(token).digest("hex");

function claus(t, codi) {
  const s = codi ? `:${codi}` : "";
  return [`r:dia:${t.dia}${s}`, `r:mes:${t.mes}${s}`, `r:sempre${s}`];
}

async function pidDe(redis, token) {
  return token ? await redis.get(`tok:${hash(token)}`) : null;
}

async function requereix(redis, token) {
  const pid = await pidDe(redis, token);
  if (!pid) throw new ApiError(401, "Jugador desconegut");
  return pid;
}

const aliasNou = () =>
  `${NOMS[randomInt(NOMS.length)]} ${ADJECTIUS[randomInt(ADJECTIUS.length)]} ${randomInt(10, 100)}`;

// ---- Operacions ----

export async function jugador(redis, { token, body }, { now = Date.now() } = {}) {
  if (!body.accio) {
    const nou = randomBytes(32).toString("base64url");
    const pid = randomBytes(8).toString("hex");
    const alias = aliasNou();
    await redis.multi().set(`tok:${hash(nou)}`, pid).set(`alias:${pid}`, alias).exec();
    return [{ token: nou, alias }, 201];
  }
  const pid = await requereix(redis, token);
  if (body.accio === "alias") {
    const alias = aliasNou();
    await redis.set(`alias:${pid}`, alias);
    return { alias };
  }
  if (body.accio === "surt") {
    const t = tempsMadrid(now);
    const codi = await redis.get(`lliga:${pid}`);
    const p = redis.multi();
    for (const k of [...claus(t, null), ...(codi ? claus(t, codi) : [])]) p.zrem(k, pid);
    await p.del(`tok:${hash(token)}`, `alias:${pid}`, `lliga:${pid}`, `rl:${pid}`).exec();
    return { ok: true };
  }
  throw new ApiError(400, "Acció desconeguda");
}

export async function sync(redis, { token, body }, { pool, now = Date.now() } = {}) {
  const pid = await requereix(redis, token);
  const exps = body.expressions;
  if (!Array.isArray(exps) || exps.length > 300 || exps.some((e) => typeof e !== "string" || e.length > 80)) {
    throw new ApiError(400, "Expressions no vàlides (màxim 300, de com a molt 80 caràcters)");
  }
  if ((await redis.set(`rl:${pid}`, 1, { nx: true, ex: 2 })) === null) {
    throw new ApiError(429, "Massa ràpid, torna-ho a provar en un moment");
  }

  const t = tempsMadrid(now);
  const { puzzle, numero } = repteDAvui(pool ?? (await carregaPool()), t);
  const punts = puntsDe(puzzle, exps);
  // Desempat: a punts iguals guanya qui hi arriba abans (fracció dins (0,1), mai arriba a 1).
  const desempat = (DIA - t.segons) / (DIA + 1);
  const codi = await redis.get(`lliga:${pid}`);

  let millor = 0;
  let escriu = false;
  const p = redis.multi();
  // Global i lliga per separat: qui s'uneix a una lliga hi posa la puntuació d'avui al següent sync.
  for (const ambit of codi ? [null, codi] : [null]) {
    const [dia, mes, sempre] = claus(t, ambit);
    const vella = Math.floor((await redis.zscore(dia, pid)) ?? 0);
    millor = Math.max(millor, vella, punts);
    if (punts <= vella) continue;
    escriu = true;
    p.zadd(dia, { score: punts + desempat, member: pid }).expireat(dia, t.expDia);
    p.zincrby(mes, punts - vella, pid).expireat(mes, t.expMes);
    p.zincrby(sempre, punts - vella, pid);
  }
  if (escriu) await p.exec(); // un pipeline buit dóna error a Upstash
  return { punts: millor, dia: t.dia, numero };
}

export async function ranquing(redis, { token, query }, { now = Date.now() } = {}) {
  const periode = query.periode ?? "dia";
  const ambit = query.ambit ?? "global";
  if (!["dia", "mes", "sempre"].includes(periode) || !["global", "lliga"].includes(ambit)) {
    throw new ApiError(400, "Paràmetres no vàlids");
  }
  const pid = await pidDe(redis, token); // sense autenticació (o amb token desconegut) només es veu el top
  const codi = ambit === "lliga" && pid ? await redis.get(`lliga:${pid}`) : null;
  if (ambit === "lliga" && !codi) return { periode, ambit, lliga: null, top: [], jo: null };

  const clau = claus(tempsMadrid(now), codi)[["dia", "mes", "sempre"].indexOf(periode)];
  const plana = await redis.zrange(clau, 0, 19, { rev: true, withScores: true });
  const pids = plana.filter((_, i) => i % 2 === 0).map(String);
  const alies = pids.length ? await redis.mget(...pids.map((x) => `alias:${x}`)) : [];
  const top = pids.map((x, i) => ({
    posicio: i + 1,
    alias: alies[i] ?? "Anònim",
    punts: Math.floor(Number(plana[2 * i + 1])),
    jo: x === pid,
  }));

  let jo = null;
  if (pid) {
    const pos = await redis.zrevrank(clau, pid);
    if (pos !== null) {
      const [score, alias] = await Promise.all([redis.zscore(clau, pid), redis.get(`alias:${pid}`)]);
      jo = { posicio: Number(pos) + 1, punts: Math.floor(Number(score)), alias };
    }
  }
  return { periode, ambit, lliga: codi, top, jo };
}

export async function lliga(redis, { token, body }, { now = Date.now() } = {}) {
  const pid = await requereix(redis, token);
  const t = tempsMadrid(now);
  const actual = await redis.get(`lliga:${pid}`);
  // Surt de la lliga actual (si en té): la treu dels rànquings d'aquella lliga.
  const surt = async () => {
    if (!actual) return;
    const p = redis.multi();
    for (const k of claus(t, actual)) p.zrem(k, pid);
    await p.del(`lliga:${pid}`).exec();
  };

  if (body.accio === "surt") {
    await surt();
    return { ok: true };
  }
  if (body.accio === "uneix") {
    const codi = String(body.codi ?? "").trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(codi) || !(await redis.get(`lligues:${codi}`))) {
      throw new ApiError(404, "Aquesta lliga no existeix");
    }
    if (codi !== actual) await surt();
    await redis.set(`lliga:${pid}`, codi);
    return { codi };
  }
  if (body.accio === "crea") {
    for (let intent = 0; intent < 5; intent++) {
      const codi = Array.from({ length: 6 }, () => ALFABET[randomInt(ALFABET.length)]).join("");
      if ((await redis.set(`lligues:${codi}`, t.dia, { nx: true })) === null) continue; // codi ja existent
      await surt();
      await redis.set(`lliga:${pid}`, codi);
      return { codi };
    }
    throw new ApiError(500, "No s'ha pogut crear la lliga");
  }
  throw new ApiError(400, "Acció desconeguda");
}
