# Pratica Facile — checklist e quotazioni per Junior Transport Coordinator

Tool deterministico per gestire una pratica di trasporto urgente dall'arrivo della richiesta alla quotazione al cliente, seguendo la logica aziendale: checklist delle informazioni obbligatorie, scelta a cascata del mezzo e della modalità di quotazione (regoletta o basetender), calcolo trasparente passo per passo e margine 10–15% con suggerimento basato sui km.

## Avvio

```sh
npm install
npm run dev            # http://localhost:5199
npm test               # 82 test sul motore di calcolo, inclusi gli esempi del documento
npm run test:coverage  # coverage V8 di src/lib/** con soglia obbligatoria al 100%
npm run build          # build di produzione in dist/
```

I dati (pratiche e parametri) vivono in `localStorage` del browser; dalla sidebar si esportano e importano in JSON.

## La logica implementata

### Checklist (sezione 3 del documento)
Peso, numero e dimensioni dei pallet; indirizzo e orari di ritiro e consegna con tassatività; sponda idraulica; ADR. Senza peso, sponda e tassatività non si sceglie il vettore: la barra di avanzamento li segnala come dati critici.

### Scelta del mezzo (sezione 5)
- **Ducato**: 4-5 pallet 120×80×170, portata 1.300 kg, 0,70 €/km, minimo 130 €, senza sponda.
- **Cassonato/telonato**: max 8 pallet 120×80×200, portata 1.100 kg (800 con sponda), 0,80 €/km, minimo 195 €.
- Sponda necessaria → il Ducato è escluso e la portata del cassonato scende a 800 kg.
- Carico fuori da entrambi i mezzi → basetender.

### Regoletta o basetender (sezione 4)
Nazionale ordinario dentro i mezzi standard → regoletta. Estero, ADR, molto urgente, complesso o carico fuori standard → basetender. L'override manuale è possibile ma produce un avviso.

### La regoletta (sezione 5)
1. km Google Maps + buffer minimo 2%, arrotondati per eccesso a step di 10 km;
2. ×2 (andata e ritorno, sempre);
3. × tariffa del mezzo = prezzo vettore; se sotto il minimo scatta il diritto di chiamata;
4. + markup 10–15% (mai sotto il 10%) = prezzo cliente, comunicato come range arrotondato alle decine.

Il suggerimento di markup scende linearmente dal 15% (tratte ≤ 150 km) al 10% (tratte ≥ 500 km), con bonus per urgenza; resta sempre nella forchetta di policy.

### Basetender (sezione 6)
Le quotazioni dei vettori vengono prima scartate se non rispettano i requisiti (portata, posti pallet, sponda, termine tassativo), a qualunque prezzo; tra le valide si consiglia il miglior bilancio tra prezzo, affidabilità (vettore noto) e margine di sicurezza sull'orario. Il markup 10–15% si applica anche alle quotazioni di mercato.

### Trattativa (sezione 7)
Il pannello mostra sempre pavimento (prezzo vettore), minimo di policy (vettore +10%) e spazio di manovra residuo.

## Parametri modificabili

Da **Parametri** nella sidebar: tariffe €/km, minimi, portate, sagome, buffer km, step di arrotondamento, forchetta markup e curva del suggerimento. I default riproducono esattamente gli esempi A e B del documento (testati).

## Struttura

- `src/lib/engine/` — logica pura e testabile (vehicles, mode, pricing, markup, basetender, checklist)
- `src/lib/types.ts` — modello dati e default di configurazione
- `src/lib/storage.ts` — persistenza localStorage + export/import JSON
- `src/components/` — UI React (Tailwind CSS v4)
- `tests/` — test Vitest: golden test degli esempi A e B del documento, varianti di mezzo/modalità/markup/basetender/checklist/storage; la coverage di `src/lib/**` è vincolata al 100% (statements, branches, functions, lines) da `vite.config.ts`, quindi `npm test` fallisce se qualcuno la fa scendere
