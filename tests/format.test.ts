import { describe, expect, it } from 'vitest'
import { eur, inputValue, num, round2 } from '../src/lib/format'

describe('round2', () => {
  it('arrotonda al centesimo senza artefatti floating point', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(386.40000000001)).toBe(386.4)
    expect(round2(149.499999)).toBe(149.5)
  })
})

describe('eur', () => {
  it('formatta in euro secondo la locale italiana', () => {
    const norm = (s: string) => s.replace(/\u00a0/g, ' ')
    expect(norm(eur(1234.5))).toBe('1234,50 €')
    expect(norm(eur(0))).toBe('0,00 €')
  })

  it('mostra un trattino per valori assenti', () => {
    expect(eur(null)).toBe('\u2014')
    expect(eur(undefined)).toBe('\u2014')
  })
})

describe('num', () => {
  it('formatta i numeri e accetta un suffisso', () => {
    expect(num(1234.567)).toBe('1234,57')
    expect(num(5, ' kg')).toBe('5 kg')
  })

  it('mostra un trattino per valori assenti', () => {
    expect(num(null)).toBe('\u2014')
    expect(num(undefined)).toBe('\u2014')
  })
})

describe('inputValue', () => {
  it('converte null in stringa vuota e mantiene lo zero', () => {
    expect(inputValue(null)).toBe('')
    expect(inputValue(0)).toBe('0')
    expect(inputValue(42)).toBe('42')
  })
})
