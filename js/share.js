// Genera el text de compartir (estil Wordle). Mai inclou cap solució.

const SITE_URL = "https://numerologic.cat";

export function buildShareText({ number, rankName, score, found, tuttiFound, breviComplete, streak }) {
  const lines = [
    `Numerològic #${number} · ${rankName}`,
    `${score} punts · ${found} solucions`,
  ];
  if (breviComplete) lines.push("✦ Brevi!");
  if (tuttiFound) lines.push("★ Tutti!");
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
