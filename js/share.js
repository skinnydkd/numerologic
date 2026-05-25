// Genera el text de compartir (estil Wordle). Mai inclou cap solució.

export function emojiBar(found, total, cells = 10) {
  const ratio = total > 0 ? found / total : 0;
  let filled = Math.floor(ratio * cells);
  if (filled > cells) filled = cells;
  const partial = ratio * cells - filled > 0 && filled < cells ? 1 : 0;
  const empty = cells - filled - partial;
  return "🟦".repeat(filled) + "🟨".repeat(partial) + "⬜".repeat(empty);
}

export function buildShareText({ number, rankName, found, total, tuttiFound }) {
  const lines = [
    `Numerològic #${number} · ${rankName}`,
    `${found}/${total} · ${emojiBar(found, total)}`,
  ];
  if (tuttiFound) lines.push("★ Tutti!");
  return lines.join("\n");
}
