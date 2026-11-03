import type { Config, Pratica, TenderQuote } from '../types'
import { ceilToStep } from './pricing'
import { round2 } from '../format'

export interface QuoteEvaluation {
  quote: TenderQuote
  valid: boolean
  exclusions: string[]
  warnings: string[]
  timeMarginHours: number | null
  clientPrice: number | null
  rangeLow: number | null
  rangeHigh: number | null
}

export function hoursBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return null
  return (to - from) / 3_600_000
}

export function evaluateQuote(q: TenderQuote, p: Pratica, markupPct: number, config: Config): QuoteEvaluation {
  const exclusions: string[] = []
  const warnings: string[] = []

  if (q.priceEur === null) exclusions.push('Prezzo mancante')

  if (p.cargo.totalWeightKg !== null && q.payloadKg !== null && q.payloadKg < p.cargo.totalWeightKg) {
    exclusions.push(`Portata ${q.payloadKg} kg < peso merce ${p.cargo.totalWeightKg} kg`)
  }
  if (p.cargo.pallets !== null && q.maxPallets !== null && q.maxPallets < p.cargo.pallets) {
    exclusions.push(`${q.maxPallets} posti pallet < ${p.cargo.pallets} pallet richiesti`)
  }
  if (p.tailLiftRequired && !q.canDoTailLift) {
    exclusions.push('La sponda idraulica \u00e8 necessaria ma questo mezzo non ce l\u2019ha')
  }

  const margin = hoursBetween(q.promisedDelivery, p.delivery.timeTo)
  if (p.delivery.tassativo && p.delivery.timeTo && q.promisedDelivery) {
    if (margin !== null && margin < 0) {
      exclusions.push(`Consegna promessa oltre il termine tassativo del cliente`)
    } else if (margin !== null && margin === 0) {
      warnings.push('Consegna esattamente all\u2019ultimo minuto utile: zero margine sugli imprevisti')
    }
  } else if (margin !== null && margin < 2) {
    warnings.push('Margine di sicurezza sull\u2019orario molto stretto')
  }

  if (!q.knownToNetwork) {
    warnings.push('Vettore nuovo o poco conosciuto: telefonare prima di confermare')
  }
  if (q.payloadKg === null) warnings.push('Portata non dichiarata: verificarla prima di scegliere')

  let clientPrice: number | null = null
  let rangeLow: number | null = null
  let rangeHigh: number | null = null
  if (q.priceEur !== null) {
    const clamped = Math.min(config.markupMaxPct, Math.max(config.markupMinPct, markupPct))
    clientPrice = round2(q.priceEur * (1 + clamped / 100))
    rangeLow = ceilToStep(clientPrice, config.rangeStepEur)
    rangeHigh = rangeLow + config.rangeStepEur
  }

  return {
    quote: q,
    valid: exclusions.length === 0 && q.priceEur !== null,
    exclusions,
    warnings,
    timeMarginHours: margin !== null ? round2(margin) : null,
    clientPrice,
    rangeLow,
    rangeHigh,
  }
}

export function evaluateQuotes(p: Pratica, markupPct: number, config: Config): QuoteEvaluation[] {
  return p.tenderQuotes.map((q) => evaluateQuote(q, p, markupPct, config))
}

export function rankQuotes(evals: QuoteEvaluation[]): QuoteEvaluation[] {
  const byPrice = (a: QuoteEvaluation, b: QuoteEvaluation) => {
    if (a.quote.priceEur === null) return b.quote.priceEur === null ? 0 : 1
    if (b.quote.priceEur === null) return -1
    return a.quote.priceEur - b.quote.priceEur
  }
  const valid = evals.filter((e) => e.valid).sort(byPrice)
  const invalid = evals.filter((e) => !e.valid).sort(byPrice)
  return [...valid, ...invalid]
}

export function pickRecommended(ranked: QuoteEvaluation[]): QuoteEvaluation | null {
  const valid = ranked.filter((e) => e.valid)
  if (valid.length === 0) return null
  const known = valid.filter((e) => e.quote.knownToNetwork && (e.timeMarginHours === null || e.timeMarginHours > 0))
  return known[0] ?? valid[0]
}
