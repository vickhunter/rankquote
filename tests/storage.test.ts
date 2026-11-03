// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportAll, loadConfig, loadPratiche, loadTheme, parseImport, saveConfig, savePratiche, saveTheme } from '../src/lib/storage'
import { defaultConfig, emptyPratica } from '../src/lib/types'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({ matches }),
  })
}

describe('pratiche', () => {
  it('senza dati salvati restituisce lista vuota', () => {
    expect(loadPratiche()).toEqual([])
  })

  it('json corrotto o non array: lista vuota invece di crash', () => {
    localStorage.setItem('jtc-pratiche-v1', '{non valido')
    expect(loadPratiche()).toEqual([])
    localStorage.setItem('jtc-pratiche-v1', '{"a":1}')
    expect(loadPratiche()).toEqual([])
  })

  it('roundtrip save/load', () => {
    const p = emptyPratica()
    p.clientCompany = 'Rossi Srl'
    savePratiche([p])
    expect(loadPratiche()[0].clientCompany).toBe('Rossi Srl')
  })
})

describe('config', () => {
  it('senza dati salvati restituisce i default', () => {
    expect(loadConfig()).toEqual(defaultConfig)
  })

  it('json corrotto: default', () => {
    localStorage.setItem('jtc-config-v1', 'nope')
    expect(loadConfig()).toEqual(defaultConfig)
  })

  it('merge parziale: valori salvati sopra i default, resto intatto', () => {
    saveConfig({ ...defaultConfig, kmBufferPct: 5 })
    expect(loadConfig().kmBufferPct).toBe(5)
    expect(loadConfig().vehicles.ducato.tariffPerKm).toBe(0.7)
  })

  it('merge parziale di veicoli e suggerimento', () => {
    localStorage.setItem(
      'jtc-config-v1',
      JSON.stringify({
        vehicles: { ducato: { minimoEur: 140 } },
        suggestion: { shortKm: 100, urgencyBonusPct: { urgente: 3 } },
      }),
    )
    const c = loadConfig()
    expect(c.vehicles.ducato.minimoEur).toBe(140)
    expect(c.vehicles.ducato.tariffPerKm).toBe(0.7)
    expect(c.vehicles.cassonato.minimoEur).toBe(195)
    expect(c.suggestion.shortKm).toBe(100)
    expect(c.suggestion.longKm).toBe(500)
    expect(c.suggestion.urgencyBonusPct.urgente).toBe(3)
    expect(c.suggestion.urgencyBonusPct['molto-urgente']).toBe(2)
  })
})

describe('tema', () => {
  it('legge il tema salvato', () => {
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
    saveTheme('light')
    expect(loadTheme()).toBe('light')
  })

  it('valore salvato non valido: segue le preferenze di sistema', () => {
    mockMatchMedia(false)
    localStorage.setItem('jtc-theme-v1', 'seppia')
    expect(loadTheme()).toBe('light')
    mockMatchMedia(true)
    expect(loadTheme()).toBe('dark')
  })
})

describe('exportAll', () => {
  it('scarica un blob json con pratiche e config', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock')
    const revokeObjectURL = vi.fn()
    ;(URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL
    ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    exportAll([emptyPratica()], defaultConfig)

    const blob = createObjectURL.mock.calls[0][0]
    const parsed = JSON.parse(await blob.text())
    expect(parsed.pratiche).toHaveLength(1)
    expect(parsed.config).toEqual(defaultConfig)
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})

describe('parseImport', () => {
  it('accetta il formato completo {pratiche, config}', () => {
    const result = parseImport(JSON.stringify({ pratiche: [emptyPratica()], config: { kmBufferPct: 4 } }))
    expect(result?.pratiche).toHaveLength(1)
    expect(result?.config.kmBufferPct).toBe(4)
    expect(result?.config.vehicles.ducato.tariffPerKm).toBe(0.7)
  })

  it('accetta un array nudo di pratiche', () => {
    const result = parseImport(JSON.stringify([emptyPratica()]))
    expect(result?.pratiche).toHaveLength(1)
    expect(result?.config).toEqual(defaultConfig)
  })

  it('rifiuta json corrotto o senza pratiche', () => {
    expect(parseImport('{rotto')).toBeNull()
    expect(parseImport('{"altro":true}')).toBeNull()
  })
})
