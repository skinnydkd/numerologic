// Genera el text de compartir (estil Wordle). Mai inclou cap solució.

const SITE_URL = "https://numerologic.cat";

export function buildShareText({ number, rankName, score, found, tuttiFound }) {
  const lines = [
    `Numerològic #${number} · ${rankName}`,
    `${score} punts · ${found} solucions`,
  ];
  if (tuttiFound) lines.push("★ Tutti!");
  lines.push(SITE_URL);
  return lines.join("\n");
}
