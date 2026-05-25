// Persistència del progrés a un "store" tipus localStorage (injectable per als tests).

const PREFIX = "numerologic:p:";

export function loadProgress(store, poolIndex) {
  const raw = store.getItem(PREFIX + poolIndex);
  return raw ? JSON.parse(raw) : null;
}

export function saveProgress(store, poolIndex, progress) {
  store.setItem(PREFIX + poolIndex, JSON.stringify(progress));
}
