import { describe, expect, it } from 'vitest'
import { defaultConfig, emptyPratica, type Pratica } from '../src/lib/types'
import { computeRegoletta, negotiationBounds, ceilToStep } from '../src/lib/engine/pricing'
import { selectVehicle, evaluateVehicle } from '../src/lib/engine/vehicles'
import { decideMode } from '../src/lib/engine/mode'
import { suggestMarkup } from '../src/lib/engine/markup'
import { evaluateQuote, rankQuotes, pickRecommended } from '../src/lib/engine/basetender'
import { emptyTenderQuote } from '../src/lib/types'

function praticaPadovaFirenze(): Pratica {
  const p = emptyPratica()
  p.origin = 'Padova'
  p.destination = 'Firenze'
  p.domestic = true
  p.kmGoogleMaps = 230
  p.cargo = { pallets: 3, palletLCm: 120, palletWCm: 80, palletHeightCm: 170, totalWeightKg: 800 }
  return p
}

describe('Esempio A del documento — Padova \u2192 Firenze', () => {
  it('seleziona il Ducato e quota 336 \u20ac al vettore, range 390-400 al 15%', () => {
    const p = praticaPadovaFirenze()
    const vehicle = selectVehicle(p, defaultConfig)
    expect(vehicle?.vehicle).toBe('ducato')

    const r = computeRegoletta('ducato', 230, 15, defaultConfig)
    expect(r.kmRounded).toBe(240)
    expect(r.kmTotal).toBe(480)
    expect(r.rawCarrierPrice).toBe(336)
    expect(r.minimoApplied).toBe(false)
    expect(r.carrierPrice).toBe(336)
    expect(r.clientPrice).toBe(386.4)
    expect(r.rangeLow).toBe(390)
    expect(r.rangeHigh).toBe(400)
  })
})

describe('Esempio B del documento — Castelfranco Veneto \u2192 Padova', () => {
  it('fa scattare il diritto di chiamata: 130 \u20ac vettore, range 150-160 al 15%', () => {
    const p = praticaPadovaFirenze()
    p.kmGoogleMaps = 40
    const r = computeRegoletta('ducato', 40, 15, defaultConfig)
    expect(r.rawCarrierPrice).toBe(70)
    expect(r.minimoApplied).toBe(true)
    expect(r.carrierPrice).toBe(130)
    expect(r.clientPrice).toBe(149.5)
    expect(r.rangeLow).toBe(150)
    expect(r.rangeHigh).toBe(160)
  })
})

describe('ceilToStep', () => {
  it('arrotonda per eccesso allo step senza artefatti floating point', () => {
    expect(ceilToStep(234.6, 10)).toBe(240)
    expect(ceilToStep(386.4, 10)).toBe(390)
    expect(ceilToStep(149.5, 10)).toBe(150)
    expect(ceilToStep(150, 10)).toBe(150)
    expect(ceilToStep(0.1 + 0.2, 1)).toBe(1)
  })
})

describe('Scelta del mezzo', () => {
  it('la sponda idraulica esclude il Ducato e abbassa la portata del cassonato a 800 kg', () => {
    const p = praticaPadovaFirenze()
    p.tailLiftRequired = true
    p.cargo.totalWeightKg = 750
    const vehicle = selectVehicle(p, defaultConfig)
    expect(vehicle?.vehicle).toBe('cassonato')
    expect(vehicle?.payloadKg).toBe(800)

    const ducato = evaluateVehicle('ducato', p, defaultConfig)
    expect(ducato.fits).toBe(false)
    expect(ducato.exclusions.join(' ')).toMatch(/sponda/i)
  })

  it('750 kg senza sponda stanno nel Ducato', () => {
    const p = praticaPadovaFirenze()
    expect(selectVehicle(p, defaultConfig)?.vehicle).toBe('ducato')
  })

  it('pallet alti 180 cm escludono il Ducato (max 170) ma entrano nel cassonato (max 200)', () => {
    const p = praticaPadovaFirenze()
    p.cargo.palletHeightCm = 180
    expect(selectVehicle(p, defaultConfig)?.vehicle).toBe('cassonato')
  })

  it('9 pallet o 1400 kg non stanno in nessun mezzo standard', () => {
    const p = praticaPadovaFirenze()
    p.cargo.pallets = 9
    expect(selectVehicle(p, defaultConfig)).toBeNull()
    const p2 = praticaPadovaFirenze()
    p2.cargo.totalWeightKg = 1400
    expect(selectVehicle(p2, defaultConfig)).toBeNull()
  })

  it('850 kg con sponda superano la portata ridotta del cassonato', () => {
    const p = praticaPadovaFirenze()
    p.tailLiftRequired = true
    p.cargo.totalWeightKg = 850
    expect(selectVehicle(p, defaultConfig)).toBeNull()
  })

  it('sagoma fuori standard esclude entrambi i mezzi', () => {
    const p = praticaPadovaFirenze()
    p.cargo.palletLCm = 130
    expect(selectVehicle(p, defaultConfig)).toBeNull()
  })
})

describe('Scelta della modalit\u00e0 di quotazione', () => {
  it('viaggio nazionale ordinario dentro i mezzi standard \u2192 regoletta', () => {
    const p = praticaPadovaFirenze()
    expect(decideMode(p, defaultConfig).mode).toBe('regoletta')
  })

  it('estero, ADR, molto urgente o carico fuori standard \u2192 basetender', () => {
    const base = praticaPadovaFirenze()
    expect(decideMode({ ...base, domestic: false }, defaultConfig).mode).toBe('basetender')
    expect(decideMode({ ...base, adr: true }, defaultConfig).mode).toBe('basetender')
    expect(decideMode({ ...base, urgency: 'molto-urgente' }, defaultConfig).mode).toBe('basetender')
    const heavy = praticaPadovaFirenze()
    heavy.cargo.totalWeightKg = 1400
    expect(decideMode(heavy, defaultConfig).mode).toBe('basetender')
    expect(decideMode(heavy, defaultConfig).basetenderReasons.length).toBeGreaterThan(0)
  })

  it('l\u2019override manuale \u00e8 rispettato ma produce un avviso quando contraddice la regola', () => {
    const p = praticaPadovaFirenze()
    p.domestic = false
    p.quoteModeOverride = 'regoletta'
    const d = decideMode(p, defaultConfig)
    expect(d.mode).toBe('regoletta')
    expect(d.forcedBy).toBe('override')
    expect(d.warning).toMatch(/basetender/i)
  })
})

describe('Suggerimento markup', () => {
  it('tratta corta \u2192 15%, tratta molto lunga \u2192 10%', () => {
    expect(suggestMarkup(50, 'normale', defaultConfig).pct).toBe(15)
    expect(suggestMarkup(800, 'normale', defaultConfig).pct).toBe(10)
  })

  it('tratta media scala linearmente e resta nella forchetta 10-15', () => {
    const s = suggestMarkup(290, 'normale', defaultConfig)
    expect(s.pct).toBeGreaterThanOrEqual(10)
    expect(s.pct).toBeLessThanOrEqual(15)
    expect(s.pct).toBe(13)
  })

  it('l\u2019urgenza alza il suggerimento senza superare il 15%', () => {
    expect(suggestMarkup(50, 'urgente', defaultConfig).pct).toBe(15)
    expect(suggestMarkup(800, 'molto-urgente', defaultConfig).pct).toBe(12)
  })

  it('senza km suggerisce il massimo', () => {
    expect(suggestMarkup(null, 'normale', defaultConfig).pct).toBe(15)
  })
})

describe('Markup sempre entro la policy', () => {
  it('non scende mai sotto il 10% anche se richiesto', () => {
    const r = computeRegoletta('ducato', 230, 3, defaultConfig)
    expect(r.markupPct).toBe(10)
    expect(r.clientPrice).toBe(369.6)
  })

  it('il limite di trattativa \u00e8 vettore + 10%', () => {
    const b = negotiationBounds(336, 386.4, defaultConfig)
    expect(b.policyMinClientEur).toBe(369.6)
    expect(b.roomEur).toBe(16.8)
  })
})

describe('Valutazione quotazioni basetender', () => {
  function basePratica(): Pratica {
    const p = praticaPadovaFirenze()
    p.delivery.tassativo = true
    p.delivery.timeTo = '2026-11-04T13:00'
    return p
  }

  it('scarta chi non rispetta i requisiti, a qualunque prezzo', () => {
    const p = basePratica()
    const cheap = { ...emptyTenderQuote(), carrier: 'Economico', priceEur: 200, payloadKg: 700, promisedDelivery: '2026-11-04T12:00' }
    const ev = evaluateQuote(cheap, p, 12, defaultConfig)
    expect(ev.valid).toBe(false)
    expect(ev.exclusions.join(' ')).toMatch(/portata/i)
  })

  it('scarta la consegna oltre il termine tassativo', () => {
    const p = basePratica()
    const late = { ...emptyTenderQuote(), carrier: 'Tardivo', priceEur: 250, payloadKg: 1200, promisedDelivery: '2026-11-04T15:00' }
    const ev = evaluateQuote(late, p, 12, defaultConfig)
    expect(ev.valid).toBe(false)
  })

  it('segnala il vettore sconosciuto senza scartarlo', () => {
    const p = basePratica()
    const unknown = { ...emptyTenderQuote(), carrier: 'Nuovo', priceEur: 240, knownToNetwork: false, payloadKg: 1200, promisedDelivery: '2026-11-04T10:00' }
    const ev = evaluateQuote(unknown, p, 12, defaultConfig)
    expect(ev.valid).toBe(true)
    expect(ev.warnings.join(' ')).toMatch(/telefonare/i)
  })

  it('ordina per prezzo ma consiglia il vettore noto con margine di sicurezza', () => {
    const p = basePratica()
    const q1 = { ...emptyTenderQuote(), carrier: 'Nuovo', priceEur: 230, knownToNetwork: false, payloadKg: 1200, promisedDelivery: '2026-11-04T12:30' }
    const q2 = { ...emptyTenderQuote(), carrier: 'Noto', priceEur: 250, knownToNetwork: true, payloadKg: 1200, promisedDelivery: '2026-11-04T10:00' }
    p.tenderQuotes = [q1, q2]
    const ranked = rankQuotes(p.tenderQuotes.map((q) => evaluateQuote(q, p, 12, defaultConfig)))
    expect(ranked[0].quote.carrier).toBe('Nuovo')
    expect(pickRecommended(ranked)?.quote.carrier).toBe('Noto')
  })

  it('applica lo stesso markup 10-15% anche alle quotazioni di mercato', () => {
    const p = basePratica()
    const q = { ...emptyTenderQuote(), carrier: 'X', priceEur: 300, payloadKg: 1200, promisedDelivery: '2026-11-04T09:00' }
    const ev = evaluateQuote(q, p, 50, defaultConfig)
    expect(ev.clientPrice).toBe(345)
    expect(ev.rangeLow).toBe(350)
    expect(ev.rangeHigh).toBe(360)
  })
})
