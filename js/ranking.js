// Rànquing opcional: estat del jugador, crides a /api, sincronització i HTML del panell.
// Offline-first: cap error de xarxa arriba al joc; si no t'hi has apuntat, no s'envia res.
import { openPanel } from "./ui.js";

const PLAYER_KEY = "numerologic:jugador";
const LEAGUE_KEY = "numerologic:lliga";
const SYNC_DELAY = 3000;
const PERIODES = [["dia", "Avui"], ["mes", "Mes"], ["sempre", "Sempre"]];

// ---- Estat local (store injectable per als tests) ----

function getStore() {
  try { return localStorage; } catch { return null; }
}

function readJSON(store, key) {
  try { return JSON.parse(store.getItem(key)) || null; } catch { return null; }
}

function write(store, key, value) {
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch { /* emmagatzematge no disponible o ple: ignora */ }
}

export function loadPlayer(store = getStore()) {
  const p = store && readJSON(store, PLAYER_KEY);
  return p && typeof p.token === "string" && p.token ? p : null;
}

export function savePlayer(store, player) {
  write(store, PLAYER_KEY, player ? JSON.stringify({ token: player.token, alias: player.alias }) : null);
}

export function loadLeague(store = getStore()) {
  try { return (store && store.getItem(LEAGUE_KEY)) || null; } catch { return null; }
}

export function saveLeague(store, codi) {
  write(store, LEAGUE_KEY, codi || null);
}

// ---- Crides a l'API (mai llancen: retornen {ok, status, data}; status 0 = sense xarxa) ----

export async function api(path, { method = "POST", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  try {
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let data = null;
    try { data = await res.json(); } catch { /* cos buit o no JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

// ---- Sincronització (debounce amb temporitzadors injectables) ----

export function debounce(fn, delay, timers = { set: (f, ms) => setTimeout(f, ms), clear: (id) => clearTimeout(id) }) {
  let id = null;
  return () => {
    if (id !== null) timers.clear(id);
    id = timers.set(() => { id = null; fn(); }, delay);
  };
}

let pending = null; // expressions encara no confirmades pel servidor

const flush = debounce(async () => {
  const expressions = pending;
  const player = loadPlayer();
  if (!expressions) return;
  if (!player) { pending = null; return; }
  const r = await api("/api/sync", { body: { expressions }, token: player.token });
  if (r.ok) {
    if (pending === expressions) pending = null;
  } else if (r.status === 401) {
    forget(); // el servidor no et coneix: oblida el jugador local
  }
  // 429 o sense xarxa: es manté `pending` i es reintenta en el proper encert o en tornar l'"online"
}, SYNC_DELAY);

// Envia (amb retard) TOTES les expressions d'avui; no fa res si no t'hi has apuntat.
export function requestSync(expressions) {
  if (!loadPlayer()) return;
  pending = expressions;
  flush();
}

function forget() {
  const store = getStore();
  if (store) { savePlayer(store, null); saveLeague(store, null); }
  pending = null;
}

// ---- HTML (pur) ----

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function introHTML(msg) {
  return `
    <p>Vols aparèixer al rànquing? Et donarem un àlies a l'atzar. No guardem cap dada personal.</p>
    ${msg ? `<p class="rk-msg" role="status">${esc(msg)}</p>` : ""}
    <p><button class="rk-btn rk-main" data-rk="entra">Hi entro</button></p>`;
}

function rowHTML(r) {
  return `<li class="rk-row${r.jo ? " jo" : ""}"><span class="rk-pos">${esc(r.posicio)}</span>` +
    `<span class="rk-alias">${esc(r.alias)}</span><span class="rk-punts">${esc(r.punts)}</span></li>`;
}

// `data` = resposta de GET /api/ranquing (o null mentre carrega)
export function listHTML(data) {
  if (!data) return `<p class="rk-note">Carregant…</p>`;
  const top = data.top || [];
  if (top.length === 0 && !data.jo) return `<p class="rk-note">Encara no hi ha ningú. Sigues el primer!</p>`;
  const rows = top.map(rowHTML).join("");
  const outside = data.jo && !top.some((r) => r.jo);
  const own = outside ? `<ol class="rk-list rk-own" start="${esc(data.jo.posicio)}">${rowHTML({ ...data.jo, jo: true })}</ol>` : "";
  return `<ol class="rk-list">${rows}</ol>${own}`;
}

export function leagueHTML(codi) {
  if (codi) {
    return `
      <p class="rk-note">Lliga</p>
      <p class="rk-codi">${esc(codi)}</p>
      <p class="rk-note">Escriu el codi a la pissarra perquè la resta s'hi puga unir.</p>
      <p><button class="rk-btn" data-rk="surt-lliga">Surt de la lliga</button></p>`;
  }
  return `
    <p class="rk-join">
      <input class="rk-input" id="rkCodi" maxlength="12" autocomplete="off" autocapitalize="characters" placeholder="Codi de la lliga" aria-label="Codi de la lliga" />
      <button class="rk-btn" data-rk="uneix">Uneix-te a una lliga</button>
    </p>
    <p><button class="rk-btn" data-rk="crea">Crea una lliga</button></p>`;
}

// state: { alias, lliga, periode, ambit, data, msg }
export function panelHTML({ alias, lliga, periode, ambit, data, msg }) {
  const tabs = PERIODES.map(([v, label]) =>
    `<button class="rk-btn rk-tab" data-rk="periode" data-v="${v}" aria-pressed="${v === periode}">${label}</button>`).join("");
  const ambits = [["global", "Global"], ["lliga", "La meua lliga"]].map(([v, label]) =>
    `<button class="rk-btn rk-tab" data-rk="ambit" data-v="${v}" aria-pressed="${v === ambit}"${v === "lliga" && !lliga ? " disabled" : ""}>${label}</button>`).join("");
  const noLeague = ambit === "lliga" && !lliga ? `<p class="rk-note">Encara no ets a cap lliga.</p>` : "";
  return `
    <p class="rk-note">Jugues com <b>${esc(alias)}</b></p>
    <div class="rk-tabs">${tabs}</div>
    <div class="rk-tabs">${ambits}</div>
    ${noLeague || listHTML(data)}
    ${msg ? `<p class="rk-msg" role="status">${esc(msg)}</p>` : ""}
    <hr class="rk-sep" />
    <p><button class="rk-btn" data-rk="alias">Canvia l'àlies</button></p>
    ${leagueHTML(lliga)}
    <hr class="rk-sep" />
    <p><button class="rk-btn" data-rk="surt">Surt del rànquing</button></p>`;
}

// ---- Panell (DOM) ----

const view = { periode: "dia", ambit: "global", data: null, msg: "" };
let seq = 0; // descarta respostes de consultes antigues

function errMsg(r) {
  if (r.status === 0) return "Sense connexió. Torna-ho a provar.";
  return (r.data && r.data.error) || "Hi ha hagut un error. Torna-ho a provar.";
}

function render(panel) {
  const player = loadPlayer();
  if (!player) return openPanel(panel, "Rànquing", introHTML(view.msg));
  openPanel(panel, "Rànquing", panelHTML({ ...view, alias: player.alias, lliga: loadLeague() }));
}

async function refresh(panel) {
  const player = loadPlayer();
  const mine = ++seq;
  view.data = null;
  render(panel);
  if (!player) return;
  const lliga = loadLeague();
  if (view.ambit === "lliga" && !lliga) return;
  const q = `periode=${view.periode}&ambit=${lliga && view.ambit === "lliga" ? "lliga" : "global"}`;
  const r = await api("/api/ranquing?" + q, { method: "GET", token: player.token });
  if (mine !== seq) return;
  if (r.status === 401) { forget(); return render(panel); }
  if (r.ok) view.data = r.data;
  else view.msg = errMsg(r);
  render(panel);
}

// Prepara el panell del rànquing; retorna la funció que l'obri.
export function setupRanquing(panel, getExpressions) {
  window.addEventListener("online", () => flush());

  const actions = {
    async entra() {
      const r = await api("/api/jugador", { body: {} });
      if (!r.ok || !r.data || !r.data.token) { view.msg = errMsg(r); return render(panel); }
      savePlayer(getStore(), { token: r.data.token, alias: r.data.alias });
      view.msg = "";
      requestSync(getExpressions());
    },
    async alias() {
      const p = loadPlayer();
      const r = await api("/api/jugador", { body: { accio: "alias" }, token: p.token });
      if (r.ok && r.data && r.data.alias) savePlayer(getStore(), { token: p.token, alias: r.data.alias });
      else view.msg = errMsg(r);
    },
    async crea() {
      const r = await api("/api/lliga", { body: { accio: "crea" }, token: loadPlayer().token });
      if (r.ok && r.data && r.data.codi) { saveLeague(getStore(), r.data.codi); view.ambit = "lliga"; }
      else view.msg = errMsg(r);
    },
    async uneix() {
      const input = panel.querySelector("#rkCodi");
      const codi = input ? input.value.trim().toUpperCase() : "";
      if (!codi) { view.msg = "Escriu el codi de la lliga."; return; }
      const r = await api("/api/lliga", { body: { accio: "uneix", codi }, token: loadPlayer().token });
      if (r.ok && r.data && r.data.codi) { saveLeague(getStore(), r.data.codi); view.ambit = "lliga"; }
      else view.msg = r.status === 404 ? "Aquest codi no existeix." : errMsg(r);
    },
    async "surt-lliga"() {
      const r = await api("/api/lliga", { body: { accio: "surt" }, token: loadPlayer().token });
      if (r.ok) { saveLeague(getStore(), null); view.ambit = "global"; }
      else view.msg = errMsg(r);
    },
    async surt() {
      if (!confirm("Segur que vols eixir del rànquing? S'esborraran el teu àlies i els teus punts.")) return;
      const r = await api("/api/jugador", { body: { accio: "surt" }, token: loadPlayer().token });
      if (r.ok || r.status === 401) { forget(); view.ambit = "global"; }
      else view.msg = errMsg(r);
    },
  };

  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-rk]");
    if (!b || b.disabled) return;
    const act = b.dataset.rk;
    view.msg = "";
    if (act !== "entra" && !loadPlayer()) return refresh(panel); // estat antic: torna a l'inici
    if (act === "periode") view.periode = b.dataset.v;
    else if (act === "ambit") view.ambit = b.dataset.v;
    else if (actions[act]) {
      b.disabled = true;
      await actions[act]();
    }
    refresh(panel);
  });

  return () => { view.msg = ""; refresh(panel); };
}
