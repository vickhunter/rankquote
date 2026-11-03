import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../src/lib/types'
import { clampMarkup, suggestMarkup } from '../src/lib/engine/markup'

describe('suggestMarkup — confini della curva', () => {
  it('esattamente sulla soglia corta suggerisce il massimo', () => {
    expect(suggestMarkup(150, 'normale', defaultConfig).pct).toBe(15)
  })

  it('esattamente sulla soglia lunga suggerisce il minimo', () => {
    expect(suggestMarkup(500, 'normale', defaultConfig).pct).toBe(10)
  })

  it('sotto la soglia corta e sopra la lunga resta ai bordi', () => {
    expect(suggestMarkup(1, 'normale', defaultConfig).pct).toBe(15)
    expect(suggestMarkup(5000, 'normale', defaultConfig).pct).toBe(10)
  })

  it('il bonus urgenza si somma alla curva ma non supera il 15%', () => {
    expect(suggestMarkup(290, 'urgente', defaultConfig).pct).toBe(14)
    expect(suggestMarkup(290, 'molto-urgente', defaultConfig).pct).toBe(15)
    expect(suggestMarkup(450, 'molto-urgente', defaultConfig).pct).toBe(13)
  })

  it('la motivazione cita tratta e urgenza', () => {
    expect(suggestMarkup(50, 'urgente', defaultConfig).reason).toMatch(/tratta corta/)
    expect(suggestMarkup(50, 'urgente', defaultConfig).reason).toMatch(/urgente/)
    expect(suggestMarkup(900, 'normale', defaultConfig).reason).toMatch(/tratta lunga/)
    expect(suggestMarkup(null, 'normale', defaultConfig).reason).toMatch(/km non ancora inseriti/)
  })
})

describe('clampMarkup', () => {
  it('tiene il valore dentro la forchetta di policy', () => {
    expect(clampMarkup(3, defaultConfig)).toBe(10)
    expect(clampMarkup(99, defaultConfig)).toBe(15)
    expect(clampMarkup(12.5, defaultConfig)).toBe(12.5)
  })
})
