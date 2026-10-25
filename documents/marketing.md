# Marketing — missatges i textos a punt per fer servir

Va amb [estrategia-promocio.md](estrategia-promocio.md), que diu **què** fer i **quan**. Aquest document té els textos per **fer-ho**.
Kit de premsa: **https://numerologic.cat/premsa/**

## Missatge

| | |
|---|---|
| **Etiqueta** | El Paraulògic de les matemàtiques |
| **Promesa** | 5 minuts al dia de càlcul mental que enganxen |
| **Prova** | Gratuït, sense anuncis ni registre, en català, funciona sense connexió |
| **Qui hi ha darrere** | Pau Monterde, professor de secundària de Vila-real |
| **To** | Proper, amb una mica de joc ("t'hi atreveixes?"). Res de "app revolucionària". |

**Tres idees a repetir sempre:** (1) un repte nou cada dia, (2) "com el Paraulògic, però amb números", (3) en català i de franc.

## Cita per a la premsa — ⚠️ PROPOSTA, l'has d'aprovar o reescriure

> «Volia un joc que fes amb els números el que el Paraulògic fa amb les paraules: obrir-lo cada matí, trobar-ne quatre de ràpides i quedar-te enganxat buscant la que se t'escapa. I que fos en català.»
> — Pau Monterde, creador de Numerològic

No és a la web: afegeix-la a /premsa o fes-la servir als correus quan l'hagis validada.

---

## Textos per a xarxes

### Publicació de llançament (X / Bluesky / Mastodon)

> He fet un joc: **Numerològic**, el Paraulògic de les matemàtiques 🐝🔢
>
> Cada dia, un número objectiu i un rusc de dígits. Amb + − × ÷ i parèntesis, troba totes les operacions que hi arriben.
>
> Gratuït, sense anuncis i en català 👇
> numerologic.cat/l

### Missatge per a WhatsApp / Telegram (amics, grups)

> Us passo un joc que he fet: és com el Paraulògic però amb números. Cada dia un repte nou 🔢
> numerologic.cat/w
> A veure qui trau el Brevi abans 😏

### Publicació diària (compte del joc, cada dia a les 8 h)

> 🔢 Numerològic #[N] · [Fàcil/Mitjà/Difícil]
> Arriba a **[OBJECTIU]** amb [DÍGITS] (el [CENTRAL] és obligatori)
> Brevi: [K] solucions de [B] operands. Quantes en trobaràs?
> numerologic.cat/d

I en un fil, la nit d'abans o l'endemà: «Solució d'ahir: [una solució Brevi]. L'havíeu vista?»

> 💡 El text diari el pot generar un script a partir de `data/puzzles.json`. Si el compte funciona, val la pena automatitzar-ho.

### Idees de contingut (per variar)

- "L'objectiu d'avui té una solució de només 3 operands. Ningú l'ha trobada encara?" (repte directe).
- Captura del rusc buit: "Arriba a 168 amb 3, 4, 6, 7 i 8. Va."
- Dates especials: **1 de gener → "Arriba a 2027"**, **14 de març → dia del Pi**, Sant Jordi, la Diada, el 9 d'Octubre.
- Rècords dels jugadors (si comparteixen captures, demana permís per tornar a publicar-les).

---

## Correus

### A un mitjà o periodista

**Assumpte:** El Paraulògic de les matemàtiques, fet a Vila-real

> Hola, [nom]:
>
> Soc en Pau Monterde, professor de secundària de Vila-real. He creat **Numerològic**, un joc diari gratuït en català que fa amb els números el que el Paraulògic fa amb les paraules: cada dia, un número objectiu i un rusc de dígits, i cal trobar totes les operacions que hi arriben.
>
> És gratuït, sense anuncis ni registre, i des d'octubre el juguen cada dia [N] persones, sobretot des del mòbil.
>
> Tens tota la informació, captures i logos a **numerologic.cat/premsa**. Si et ve de gust provar-lo o fer-me qualsevol pregunta, estic a la teua disposició.
>
> Gràcies,
> Pau Monterde · hola@numerologic.cat

*(Personalitza la primera línia: cita una peça seua sobre jocs o sobre el català. Posa una xifra real de Web Analytics a [N]; si és baixa, treu la frase.)*

### A una associació de professorat (FEEMCAT / SEMCV / ABEAM)

**Assumpte:** Un joc diari de càlcul mental en català per a l'aula

> Hola,
>
> Soc Pau Monterde, professor de secundària de Vila-real. He creat **Numerològic** (numerologic.cat), un joc diari gratuït de càlcul mental: cada dia hi ha un objectiu i un rusc de dígits, i l'alumnat ha de trobar expressions que hi arriben amb les quatre operacions i parèntesis. Treballa la prioritat d'operacions, l'estimació i el pensament flexible, en 5–10 minuts.
>
> M'agradaria oferir-lo a la vostra comunitat. Ho podríem fer amb una nota al butlletí, una fitxa didàctica gratuïta o un taller breu en unes jornades. No hi ha cap interès comercial: és gratuït i sense anuncis.
>
> Teniu més informació a numerologic.cat/premsa.
>
> Salutacions,
> Pau Monterde · hola@numerologic.cat

---

## Mesurar cada canal

Fes servir sempre l'enllaç curt de cada canal i, cada dilluns, mira'ls a Web Analytics → *Pages* (el pla gratuït no desglossa per `utm`, però sí per camí). Tots porten a la portada (`vercel.json`):

| Canal | Enllaç |
|---|---|
| Resultats compartits (automàtic) | `numerologic.cat/c` |
| Publicació de llançament | `numerologic.cat/l` |
| Compte diari | `numerologic.cat/d` |
| WhatsApp/Telegram | `numerologic.cat/w` |
| Correus a mitjans | `numerologic.cat/p` |
| Docents / associacions | `numerologic.cat/e` |
| Cartell a l'institut (QR) | `numerologic.cat/i` |
| Cartell a la facultat (QR) | `numerologic.cat/f` |
