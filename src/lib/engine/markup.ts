import type { Config, Urgency } from '../types'

export interface MarkupSuggestion {
  pct: number
  reason: string
}

export function suggestMarkup(kmOneWay: number | null, urgency: Urgency, config: Config): MarkupSuggestion {
  const { shortKm, longKm, urgencyBonusPct } = config.suggestion
  const min = config.markupMinPct
  const max = config.markupMaxPct

  let base = max
  let distancePart: string
  if (kmOneWay === null) {
    distancePart = 'km non ancora inseriti: parto dal massimo'
  } else if (kmOneWay <= shortKm) {
    distancePart = `tratta corta (\u2264 ${shortKm} km): il ${max}% \u00e8 normale`
  } else if (kmOneWay >= longKm) {
    base = min
    distancePart = `tratta lunga (\u2265 ${longKm} km): anche il ${min}% \u00e8 una cifra importante`
  } else {
    const t = (kmOneWay - shortKm) / (longKm - shortKm)
    base = max - t * (max - min)
    distancePart = `tratta media: scalo dal ${max}% verso il ${min}%`
  }

  const bonus = urgencyBonusPct[urgency]
  const pct = Math.min(max, Math.max(min, Math.round(base + bonus)))
  const urgencyPart =
    urgency === 'normale' ? '' : `, +${bonus}% perch\u00e9 il trasporto \u00e8 ${urgency.replace('-', ' ')} (il cliente compra certezza)`

  return { pct, reason: `${distancePart}${urgencyPart} \u2192 ${pct}%` }
}

export function clampMarkup(pct: number, config: Config): number {
  return Math.min(config.markupMaxPct, Math.max(config.markupMinPct, pct))
}
