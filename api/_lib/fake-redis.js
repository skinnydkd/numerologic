// Redis fals en memòria per als tests: només els mètodes de @upstash/redis que fem servir.
// Com el client real (sense deserialització): strings i membres com a text, puntuacions com a nombre.

export function fakeRedis() {
  const strings = new Map(); // clau -> { v, exp (ms) | null }
  const zsets = new Map(); // clau -> Map(membre -> puntuació)
  const caducitats = new Map(); // clau -> segons unix (només per inspeccionar-ho als tests)
  let offset = 0; // ms avançats per avanca()
  const ara = () => Date.now() + offset;

  const viu = (k) => {
    const e = strings.get(k);
    if (e && e.exp !== null && e.exp <= ara()) strings.delete(k);
    return strings.get(k);
  };
  const zset = (k) => {
    if (!zsets.has(k)) zsets.set(k, new Map());
    return zsets.get(k);
  };
  // Ordre descendent per puntuació; a igualtat, lexicogràfic invers (com Redis).
  const ordenat = (k) =>
    [...(zsets.get(k) ?? [])].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));

  const api = {
    // inspecció per als tests
    caducitats,
    avanca: (ms) => (offset += ms),
    claus: () => [...strings.keys(), ...zsets.keys()],

    async get(k) {
      return viu(k)?.v ?? null;
    },
    async mget(...ks) {
      return ks.map((k) => viu(k)?.v ?? null);
    },
    async set(k, v, { nx, ex } = {}) {
      if (nx && viu(k)) return null;
      strings.set(k, { v: String(v), exp: ex ? ara() + ex * 1000 : null });
      return "OK";
    },
    async del(...ks) {
      let n = 0;
      for (const k of ks) n += Number(strings.delete(k) || zsets.delete(k));
      return n;
    },
    async expireat(k, t) {
      caducitats.set(k, t);
      return 1;
    },
    async zadd(k, { score, member }) {
      const z = zset(k);
      const nou = !z.has(member);
      z.set(member, score);
      return nou ? 1 : 0;
    },
    async zincrby(k, inc, member) {
      const z = zset(k);
      const n = (z.get(member) ?? 0) + inc;
      z.set(member, n);
      return n;
    },
    async zrem(k, ...ms) {
      return ms.reduce((n, m) => n + Number(zsets.get(k)?.delete(m) ?? false), 0);
    },
    async zscore(k, m) {
      return zsets.get(k)?.get(m) ?? null;
    },
    async zrevrank(k, m) {
      const i = ordenat(k).findIndex(([x]) => x === m);
      return i < 0 ? null : i;
    },
    // Només el cas que fem servir: rev + índexs (stop inclusiu) + withScores.
    async zrange(k, start, stop, { withScores } = {}) {
      const z = ordenat(k);
      return z
        .slice(start, stop < 0 ? z.length + stop + 1 : stop + 1)
        .flatMap(([m, s]) => (withScores ? [m, s] : [m]));
    },
    multi() {
      const cua = [];
      const p = {
        exec: async () => {
          const r = [];
          for (const f of cua) r.push(await f());
          return r;
        },
      };
      for (const nom of ["set", "zadd", "zincrby", "zrem", "del", "expireat"]) {
        p[nom] = (...args) => (cua.push(() => api[nom](...args)), p);
      }
      return p;
    },
  };
  return api;
}
