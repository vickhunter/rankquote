import { describe, expect, it } from 'vitest'
import { defaultConfig, emptyPratica, emptyTenderQuote, type Pratica, type TenderQuote } from '../src/lib/types'
import { evaluateQuote, evaluateQuotes, hoursBetween, pickRecommended, rankQuotes } from '../src/lib/engine/basetender'

function base(): Pratica {
  const p = emptyPratica()
  p.cargo = { pallets: 3, palletLCm: 120, palletWCm: 80, palletHeightCm: 170, totalWeightKg: 800 }
  p.delivery.timeTo = '2026-11-04T13:00'
  return p
}

function quote(patch: Partial<TenderQuote>): TenderQuote {
  return { ...emptyTenderQuote(), priceEur: 300, payloadKg: 1200, maxPallets: 8, promisedDelivery: '2026-11-04T10:00', ...patch }
}

describe('hoursBetween', () => {
  it('restituisce le ore tra due istanti', () => {
    expect(hoursBetween('2026-11-04T10:00', '2026-11-04T13:00')).toBe(3)
  })

  it('restituisce null con input vuoti o date invalide', () => {
    expect(hoursBetween('', '2026-11-04T13:00')).toBeNull()
    expect(hoursBetween('2026-11-04T10:00', '')).toBeNull()
    expect(hoursBetween('non-una-data', '2026-11-04T13:00')).toBeNull()
    expect(hoursBetween('2026-11-04T10:00', 'non-una-data')).toBeNull()
  })
})

describe('evaluateQuote — esclusioni', () => {
  it('prezzo mancante: scartata', () => {
    const ev = evaluateQuote(quote({ priceEur: null }), base(), 12, defaultConfig)
    expect(ev.valid).toBe(false)
    expect(ev.exclusions).toContain('Prezzo mancante')
    expect(ev.clientPrice).toBeNull()
    expect(ev.rangeLow).toBeNull()
    expect(ev.rangeHigh).toBeNull()
  })

  it('posti pallet insufficienti: scartata', () => {
    const ev = evaluateQuote(quote({ maxPallets: 2 }), base(), 12, defaultConfig)
    expect(ev.valid).toBe(false)
    expect(ev.exclusions.join(' ')).toMatch(/posti pallet/)
  })

  it('sponda necessaria ma assente: scartata', () => {
    const p = base()
    p.tailLiftRequired = true
    const ev = evaluateQuote(quote({ canDoTailLift: false }), p, 12, defaultConfig)
    expect(ev.valid).toBe(false)
    expect(ev.exclusions.join(' ')).toMatch(/sponda/i)
  })

  it('consegna oltre il termine tassativo: scartata', () => {
    const p = base()
    p.delivery.tassativo = true
    const ev = evaluateQuote(quote({ promisedDelivery: '2026-11-04T14:00' }), p, 12, defaultConfig)
    expect(ev.valid).toBe(false)
  })

  it('senza termine tassativo un orario largo non esclude', () => {
    const ev = evaluateQuote(quote({ promisedDelivery: '2026-11-04T14:00' }), base(), 12, defaultConfig)
    expect(ev.valid).toBe(true)
  })
})

describe('evaluateQuote — avvisi', () => {
  it('consegna esattamente all\u2019ultimo minuto utile con orario tassativo', () => {
    const p = base()
    p.delivery.tassativo = true
    const ev = evaluateQuote(quote({ promisedDelivery: '2026-11-04T13:00' }), p, 12, defaultConfig)
    expect(ev.valid).toBe(true)
    expect(ev.warnings.join(' ')).toMatch(/zero margine/)
  })

  it('senza orario tassativo, margine sotto le 2 ore avvisa', () => {
    const ev = evaluateQuote(quote({ promisedDelivery: '2026-11-04T12:00' }), base(), 12, defaultConfig)
    expect(ev.warnings.join(' ')).toMatch(/margine di sicurezza/i)
  })

  it('senza orario tassativo, margine ampio non avvisa', () => {
    const ev = evaluateQuote(quote({ promisedDelivery: '2026-11-04T08:00' }), base(), 12, defaultConfig)
    expect(ev.warnings.join(' ')).not.toMatch(/margine di sicurezza/i)
  })

  it('vettore noto con orario dichiarato: nessun avviso di affidabilit\u00e0', () => {
    const ev = evaluateQuote(quote({}), base(), 12, defaultConfig)
    expect(ev.warnings).toHaveLength(0)
    expect(ev.timeMarginHours).toBe(3)
  })

  it('vettore noto senza orario promesso: margine null ma passa il filtro affidabilit\u00e0', () => {
    const ev = evaluateQuote(quote({ promisedDelivery: '' }), base(), 12, defaultConfig)
    expect(ev.timeMarginHours).toBeNull()
    expect(pickRecommended([ev])?.quote.id).toBe(ev.quote.id)
  })
})

describe('rankQuotes e pickRecommended', () => {
  it('mette le valide per prezzo prima delle scartate', () => {
    const p = base()
    const cheap = quote({ carrier: 'cheap', priceEur: 100, payloadKg: 100 })
    const good = quote({ carrier: 'good', priceEur: 300 })
    const mid = quote({ carrier: 'mid', priceEur: 200 })
    const ranked = rankQuotes(evaluateQuotes({ ...p, tenderQuotes: [cheap, good, mid] }, 12, defaultConfig))
    expect(ranked.map((e) => e.quote.carrier)).toEqual(['mid', 'good', 'cheap'])
  })

  it('portata non dichiarata: avviso senza scartare', () => {
    const ev = evaluateQuote(quote({ payloadKg: null }), base(), 12, defaultConfig)
    expect(ev.valid).toBe(true)
    expect(ev.warnings.join(' ')).toMatch(/portata non dichiarata/i)
  })

  it('ordina per prezzo anche le scartate, prezzo mancante per ultimo', () => {
    const p = base()
    const noPriceA = quote({ carrier: 'senza-prezzo-a', priceEur: null, payloadKg: 500 })
    const noPriceB = quote({ carrier: 'senza-prezzo-b', priceEur: null, payloadKg: 600 })
    const excluded = quote({ carrier: 'esclusa', priceEur: 150, payloadKg: 500 })
    const ranked = rankQuotes(evaluateQuotes({ ...p, tenderQuotes: [noPriceA, excluded, noPriceB] }, 12, defaultConfig))
    expect(ranked.map((e) => e.quote.carrier)).toEqual(['esclusa', 'senza-prezzo-a', 'senza-prezzo-b'])
  })

  it('senza valide restituisce null', () => {
    expect(pickRecommended([])).toBeNull()
    const p = base()
    const bad = quote({ priceEur: null })
    expect(pickRecommended(rankQuotes(evaluateQuotes({ ...p, tenderQuotes: [bad] }, 12, defaultConfig)))).toBeNull()
  })

  it('se nessun vettore valido \u00e8 noto con margine, ripiega sulla pi\u00f9 economica', () => {
    const p = base()
    const unknown = quote({ carrier: 'nuovo', priceEur: 200, knownToNetwork: false })
    const knownZeroMargin = quote({ carrier: 'noto-stretto', priceEur: 250, promisedDelivery: '2026-11-04T13:00' })
    const ranked = rankQuotes(evaluateQuotes({ ...p, tenderQuotes: [unknown, knownZeroMargin] }, 12, defaultConfig))
    expect(pickRecommended(ranked)?.quote.carrier).toBe('nuovo')
  })

  it('preferisce il vettore noto con margine anche se costa di pi\u00f9', () => {
    const p = base()
    const unknown = quote({ carrier: 'nuovo', priceEur: 200, knownToNetwork: false })
    const known = quote({ carrier: 'noto', priceEur: 250 })
    const ranked = rankQuotes(evaluateQuotes({ ...p, tenderQuotes: [unknown, known] }, 12, defaultConfig))
    expect(pickRecommended(ranked)?.quote.carrier).toBe('noto')
  })
})
