// Text de compartir (estil Wordle). Mai inclou cap ruta.

const SITE_URL = "https://numerologic.cat/rutalogic/";

export function buildShareText({ number, rankName, score, found, breviComplete, maratoFound, streak }) {
  const lines = [`Rutalògic #${number} · ${rankName}`, `${score} punts · ${found} ${found === 1 ? "ruta" : "rutes"}`];
  if (breviComplete) lines.push("✦ Brevi!");
  if (maratoFound) lines.push("★ Marató!");
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
