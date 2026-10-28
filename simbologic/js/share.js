// Text de compartir (estil Wordle). Mai inclou cap valor: només l'estat de cada graella.

const SITE_URL = "https://numerologic.cat/simbologic/";

// 🟦 neta · 🟥 amb errors o pistes · ⬜ sense resoldre
export function gridEmoji(done, clean) {
  return !done ? "⬜" : clean ? "🟦" : "🟥";
}

export function buildShareText({ number, rankName, squares, score, total, clean, streak }) {
  const lines = [`Simbològic #${number} · ${rankName}`, squares, `${score}/${total} punts`];
  if (clean) lines.push("★ Net!");
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
