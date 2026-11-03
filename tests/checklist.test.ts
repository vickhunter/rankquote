import { describe, expect, it } from 'vitest'
import { emptyPratica } from '../src/lib/types'
import { buildChecklist, canQuoteRegoletta, checklistStatus } from '../src/lib/engine/checklist'

describe('buildChecklist', () => {
  it('pratica vuota: mancano peso, pallet, dimensioni, le due fermate e i km', () => {
    const missing = buildChecklist(emptyPratica()).filter((i) => !i.done).map((i) => i.key)
    expect(missing).toEqual(['weight', 'pallets', 'dims', 'pickup', 'delivery', 'km'])
  })

  it('le dimensioni contano solo quando sono complete tutte e tre', () => {
    const p = emptyPratica()
    p.cargo.palletHeightCm = 170
    expect(buildChecklist(p).find((i) => i.key === 'dims')?.done).toBe(true)
    p.cargo.palletHeightCm = null
    expect(buildChecklist(p).find((i) => i.key === 'dims')?.done).toBe(false)
    p.cargo.palletLCm = null
    expect(buildChecklist(p).find((i) => i.key === 'dims')?.done).toBe(false)
  })

  it('ritiro e consegna sono completi solo con indirizzo e almeno un orario', () => {
    const p = emptyPratica()
    p.pickup.address = 'Via Roma 1'
    expect(buildChecklist(p).find((i) => i.key === 'pickup')?.done).toBe(false)
    p.pickup.timeTo = '2026-11-04T18:00'
    expect(buildChecklist(p).find((i) => i.key === 'pickup')?.done).toBe(true)

    p.delivery.address = 'Via Milano 2'
    expect(buildChecklist(p).find((i) => i.key === 'delivery')?.done).toBe(false)
    p.delivery.timeFrom = '2026-11-04T09:00'
    expect(buildChecklist(p).find((i) => i.key === 'delivery')?.done).toBe(true)
  })

  it('tassativit\u00e0, sponda e ADR sono domande sempre risposte, quindi sempre complete', () => {
    const done = buildChecklist(emptyPratica()).filter((i) => i.done).map((i) => i.key)
    expect(done).toEqual(['pickup-tassativo', 'delivery-tassativo', 'tail-lift', 'adr'])
  })

  it('i km completano la checklist quando inseriti', () => {
    const p = emptyPratica()
    p.kmGoogleMaps = 100
    expect(buildChecklist(p).find((i) => i.key === 'km')?.done).toBe(true)
  })
})

describe('checklistStatus', () => {
  it('conta completi, mancanti, critici mancanti e percentuale', () => {
    const s = checklistStatus(emptyPratica())
    expect(s.total).toBe(10)
    expect(s.done).toBe(4)
    expect(s.pct).toBe(40)
    expect(s.criticalMissing.map((i) => i.key)).toEqual(['weight', 'pallets', 'dims'])
    expect(s.missing).toHaveLength(6)
  })

  it('pratica completa: zero mancanti e 100%', () => {
    const p = emptyPratica()
    p.cargo.pallets = 3
    p.cargo.totalWeightKg = 800
    p.cargo.palletHeightCm = 170
    p.pickup.address = 'A'
    p.pickup.timeFrom = '2026-11-04T08:00'
    p.delivery.address = 'B'
    p.delivery.timeTo = '2026-11-04T18:00'
    p.kmGoogleMaps = 100
    const s = checklistStatus(p)
    expect(s.missing).toHaveLength(0)
    expect(s.criticalMissing).toHaveLength(0)
    expect(s.pct).toBe(100)
  })
})

describe('canQuoteRegoletta', () => {
  it('elenca esattamente peso, pallet e km quando mancano', () => {
    expect(canQuoteRegoletta(emptyPratica())).toEqual({ ok: false, missing: ['peso', 'numero pallet', 'km Google Maps'] })
  })

  it('sblocca la quotazione solo con tutti e tre i dati', () => {
    const p = emptyPratica()
    p.cargo.totalWeightKg = 800
    expect(canQuoteRegoletta(p).missing).toEqual(['numero pallet', 'km Google Maps'])
    p.cargo.pallets = 3
    expect(canQuoteRegoletta(p).missing).toEqual(['km Google Maps'])
    p.kmGoogleMaps = 230
    expect(canQuoteRegoletta(p)).toEqual({ ok: true, missing: [] })
  })
})
