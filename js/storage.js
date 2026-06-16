// Persistència del progrés a un "store" tipus localStorage (injectable per als tests).

const PREFIX = "numerologic:p:";

export function loadProgress(store, poolIndex) {
  const raw = store.getItem(PREFIX + poolIndex);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProgress(store, poolIndex, progress) {
  store.setItem(PREFIX + poolIndex, JSON.stringify(progress));
}

const STREAK_KEY = "numerologic:streak";

export function loadStreak(store) {
  try {
    return JSON.parse(store.getItem(STREAK_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveStreak(store, data) {
  try {
    store.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    /* quota plena o emmagatzematge no disponible (privat): ignora */
  }
}
