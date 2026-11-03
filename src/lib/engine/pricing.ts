import type { Config, VehicleId } from '../types'
import { round2 } from '../format'

export interface RegolettaResult {
  vehicle: VehicleId
  kmGoogleMaps: number
  kmBuffered: number
  kmRounded: number
  kmTotal: number
  tariffPerKm: number
  rawCarrierPrice: number
  minimo: number
  minimoApplied: boolean
  carrierPrice: number
  markupPct: number
  clientPrice: number
  rangeLow: number
  rangeHigh: number
  marginEur: number
}

export function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step - 1e-9) * step
}

export function computeRegoletta(
  vehicle: VehicleId,
  kmGoogleMaps: number,
  markupPct: number,
  config: Config,
): RegolettaResult {
  const v = config.vehicles[vehicle]
  const kmBuffered = kmGoogleMaps * (1 + config.kmBufferPct / 100)
  const kmRounded = ceilToStep(kmBuffered, config.kmRoundStepKm)
  const kmTotal = kmRounded * 2
  const rawCarrierPrice = round2(kmTotal * v.tariffPerKm)
  const minimoApplied = rawCarrierPrice < v.minimoEur
  const carrierPrice = minimoApplied ? v.minimoEur : rawCarrierPrice
  const clampedMarkup = Math.min(Math.max(markupPct, config.markupMinPct), config.markupMaxPct)
  const clientPrice = round2(carrierPrice * (1 + clampedMarkup / 100))
  const rangeLow = ceilToStep(clientPrice, config.rangeStepEur)
  const rangeHigh = rangeLow + config.rangeStepEur
  return {
    vehicle,
    kmGoogleMaps,
    kmBuffered: round2(kmBuffered),
    kmRounded,
    kmTotal,
    tariffPerKm: v.tariffPerKm,
    rawCarrierPrice,
    minimo: v.minimoEur,
    minimoApplied,
    carrierPrice,
    markupPct: clampedMarkup,
    clientPrice,
    rangeLow,
    rangeHigh,
    marginEur: round2(clientPrice - carrierPrice),
  }
}

export interface NegotiationBounds {
  carrierFloorEur: number
  policyMinClientEur: number
  currentClientEur: number
  roomEur: number
}

export function negotiationBounds(carrierPrice: number, clientPrice: number, config: Config): NegotiationBounds {
  const policyMin = round2(carrierPrice * (1 + config.markupMinPct / 100))
  return {
    carrierFloorEur: carrierPrice,
    policyMinClientEur: policyMin,
    currentClientEur: clientPrice,
    roomEur: round2(Math.max(0, clientPrice - policyMin)),
  }
}
