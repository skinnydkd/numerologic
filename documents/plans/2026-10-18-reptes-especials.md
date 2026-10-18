# Pla — Reptes especials (2026-10-18)

**Objectiu:** 12 dies amb un objectiu temàtic i una etiqueta («π Dia del Pi», «🎃 Castanyada»…) que surt sota l'objectiu i al text de compartir. Aprovat per Pau al xat.

## Decisions
- **Cada especial substitueix el repte del banc a l'índex del seu dia**: `(data − startDate) % len`. Tots cauen en índexs ≥ 60, que encara no ha jugat ningú, així que no es perd el progrés (es desa per índex).
- **Dígits i central fixats a mà** a `generator/specials.py`, tots comprovats. Així la generació és determinista i ràpida: no cal `generate()` amb 6 operands per a tots els valors.
- **`count_operands`**: per defecte el conjunt comptat arriba a `max(4, brevi)`. Els especials de 4 xifres i el de π el pugen a 6, perquè si no, el recompte es queda en 2 solucions.
- Nou camp `special: {title}` al repte. El client el mostra al costat de la dificultat i `buildShareText` l'afegeix com a segona línia.

## Passos
1. Test: `make_special_puzzle` (π, 314, `count_operands=6`) ≥ 4 solucions. Test: `apply_specials` posa el repte a l'índex del seu dia sense tocar la resta.
2. `puzzles.py`: extreure la construcció del dict a `_build_puzzle`; afegir `make_special_puzzle` i `count_operands`. `counted_and_brevi(min_max_ops=4)`.
3. `generator/specials.py`: llista `SPECIALS`, `apply_specials(pool)` i la CLI `python -m generator.specials`.
4. Test de JS de compartir amb `special`. `share.js` i `app.js` mostren l'etiqueta; CSS `.special`.
5. Regenerar `data/puzzles.json`, test d'integritat dels especials, SW → v28, comprovar al navegador (rellotge simulat a la data), commit i push.
