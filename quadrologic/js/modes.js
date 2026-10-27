// Selecció de repte: índex diari (per data) i índex de pràctica (aleatori, evita el diari).

const MS_PER_DAY = 86400000;

export function dailyIndex(startDateISO, todayMs, poolLength) {
  const start = new Date(startDateISO + "T00:00:00").getTime();
  const days = Math.floor((todayMs - start) / MS_PER_DAY);
  return ((days % poolLength) + poolLength) % poolLength;
}

export function practiceIndex(random, poolLength, excludeIndex) {
  if (poolLength <= 1) return 0;
  let i = Math.floor(random() * (poolLength - 1));
  if (i >= excludeIndex) i += 1;
  return i;
}
