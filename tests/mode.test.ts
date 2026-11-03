import { describe, expect, it } from 'vitest'
import { defaultConfig, emptyPratica, type Pratica } from '../src/lib/types'
import { decideMode } from '../src/lib/engine/mode'

function base(): Pratica {
  const p = emptyPratica()
  p.cargo = { pallets: 3, palletLCm: 120, palletWCm: 80, palletHeightCm: 170, totalWeightKg: 800 }
  p.kmGoogleMaps = 230
  return p
}

describe('decideMode — motivi per basetender', () => {
  it('viaggio complesso aggiunge il suo motivo', () => {
    const d = decideMode({ ...base(), complexTrip: true }, defaultConfig)
    expect(d.mode).toBe('basetender')
    expect(d.basetenderReasons.join(' ')).toMatch(/complesso/i)
  })

  it('senza motivi e con mezzo disponibile resta regoletta e indica il mezzo', () => {
    const d = decideMode(base(), defaultConfig)
    expect(d.mode).toBe('regoletta')
    expect(d.basetenderReasons).toHaveLength(0)
    expect(d.regolettaVehicle).toMatch(/Ducato/)
    expect(d.warning).toBeNull()
  })

  it('carico incompleto non forza basetender per il mezzo, anche con peso enorme', () => {
    const p = base()
    p.cargo.pallets = null
    p.cargo.totalWeightKg = 1400
    const d = decideMode(p, defaultConfig)
    expect(d.mode).toBe('regoletta')
    expect(d.basetenderReasons).toHaveLength(0)
    expect(d.regolettaVehicle).toBeNull()
  })
})

describe('decideMode — override manuale', () => {
  it('forzare regoletta su pratica da basetender avvisa', () => {
    const p = base()
    p.adr = true
    p.quoteModeOverride = 'regoletta'
    const d = decideMode(p, defaultConfig)
    expect(d.mode).toBe('regoletta')
    expect(d.forcedBy).toBe('override')
    expect(d.warning).toMatch(/basetender/i)
  })

  it('forzare basetender su pratica da regoletta avvisa', () => {
    const p = base()
    p.quoteModeOverride = 'basetender'
    const d = decideMode(p, defaultConfig)
    expect(d.mode).toBe('basetender')
    expect(d.warning).toMatch(/regoletta sarebbe sufficiente/i)
  })

  it('override senza mezzo adatto: regolettaVehicle null', () => {
    const p = base()
    p.cargo.totalWeightKg = 1400
    p.quoteModeOverride = 'basetender'
    const d = decideMode(p, defaultConfig)
    expect(d.regolettaVehicle).toBeNull()
    expect(d.basetenderReasons.join(' ')).toMatch(/non sta in nessuno dei due mezzi/i)
  })

  it('override coerente con la regola non produce avvisi', () => {
    const okRegoletta = decideMode({ ...base(), quoteModeOverride: 'regoletta' }, defaultConfig)
    expect(okRegoletta.warning).toBeNull()

    const p = base()
    p.domestic = false
    p.quoteModeOverride = 'basetender'
    expect(decideMode(p, defaultConfig).warning).toBeNull()
  })
})
