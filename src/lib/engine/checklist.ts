import type { Pratica } from '../types'

export interface ChecklistItem {
  key: string
  label: string
  hint: string
  done: boolean
  critical: boolean
}

export function buildChecklist(p: Pratica): ChecklistItem[] {
  return [
    {
      key: 'weight',
      label: 'Peso totale della merce',
      hint: 'Il dato pi\u00f9 spesso dimenticato, ed \u00e8 quello che esclude pi\u00f9 vettori',
      done: p.cargo.totalWeightKg !== null,
      critical: true,
    },
    {
      key: 'pallets',
      label: 'Numero di pallet',
      hint: 'Insieme a peso e dimensioni decide quale mezzo pu\u00f2 fare il trasporto',
      done: p.cargo.pallets !== null,
      critical: true,
    },
    {
      key: 'dims',
      label: 'Dimensioni dei pallet (L\u00d7W\u00d7H)',
      hint: 'Servono per verificare sagoma e altezza del mezzo',
      done: p.cargo.palletLCm !== null && p.cargo.palletWCm !== null && p.cargo.palletHeightCm !== null,
      critical: true,
    },
    {
      key: 'pickup',
      label: 'Indirizzo e orari di ritiro',
      hint: 'Da quando la merce \u00e8 pronta a quando chiude il magazzino',
      done: p.pickup.address.trim() !== '' && (p.pickup.timeFrom !== '' || p.pickup.timeTo !== ''),
      critical: false,
    },
    {
      key: 'pickup-tassativo',
      label: 'Orario di ritiro: tassativo o preferibile?',
      hint: '\u00abDeve\u00bb e \u00abpreferibilmente\u00bb descrivono due trasporti diversi, con due prezzi diversi',
      done: true,
      critical: true,
    },
    {
      key: 'delivery',
      label: 'Indirizzo e orari di consegna',
      hint: 'Entro quando deve arrivare e in quale fascia il destinatario accetta merce',
      done: p.delivery.address.trim() !== '' && (p.delivery.timeFrom !== '' || p.delivery.timeTo !== ''),
      critical: false,
    },
    {
      key: 'delivery-tassativo',
      label: 'Orario di consegna: tassativo o preferibile?',
      hint: 'Chiedilo sempre: cambia prezzo e scelta del vettore',
      done: true,
      critical: true,
    },
    {
      key: 'tail-lift',
      label: 'Accessori: serve la sponda idraulica?',
      hint: 'Se a destino non c\u2019\u00e8 un muletto serve la sponda, e la sponda riduce la portata',
      done: true,
      critical: true,
    },
    {
      key: 'adr',
      label: 'Merce pericolosa (ADR)?',
      hint: 'Se s\u00ec servono vettori abilitati: la pratica va su basetender',
      done: true,
      critical: true,
    },
    {
      key: 'km',
      label: 'Chilometri da Google Maps',
      hint: 'Servono per la regoletta; per estero/urgente/complesso si va su basetender',
      done: p.kmGoogleMaps !== null,
      critical: false,
    },
  ]
}

export function checklistStatus(p: Pratica) {
  const items = buildChecklist(p)
  return {
    items,
    missing: items.filter((i) => !i.done),
    criticalMissing: items.filter((i) => !i.done && i.critical),
    done: items.filter((i) => i.done).length,
    total: items.length,
    pct: Math.round((items.filter((i) => i.done).length / items.length) * 100),
  }
}

export function canQuoteRegoletta(p: Pratica): { ok: boolean; missing: string[] } {
  const missing: string[] = []
  if (p.cargo.totalWeightKg === null) missing.push('peso')
  if (p.cargo.pallets === null) missing.push('numero pallet')
  if (p.kmGoogleMaps === null) missing.push('km Google Maps')
  return { ok: missing.length === 0, missing }
}
