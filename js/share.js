// Genera el text de compartir (estil Wordle). Mai inclou cap solució.

const SITE_URL = "https://numerologic.cat/c"; // /c → portada (vercel.json); Web Analytics Hobby compta per camí, no per utm

export function buildShareText({ number, rankName, score, found, tuttiFound, tuttiCount, breviComplete, streak, special }) {
  const lines = [`Numerològic #${number} · ${rankName}`];
  if (special) lines.push(special); // repte especial del dia (p. ex. "π Dia del Pi")
  lines.push(`${score} punts · ${found} solucions`);
  if (breviComplete) lines.push("✦ Brevi!");
  if (tuttiCount > 1) lines.push(`★ Tutti ×${tuttiCount}`);
  else if (tuttiFound) lines.push("★ Tutti!");
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
