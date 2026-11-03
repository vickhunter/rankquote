import type { Config, Pratica, VehicleId } from '../types'

export interface VehicleFit {
  vehicle: VehicleId
  fits: boolean
  payloadKg: number
  checks: { label: string; ok: boolean }[]
  exclusions: string[]
}

export function effectivePayload(vehicle: VehicleId, needsTailLift: boolean, config: Config): number {
  const v = config.vehicles[vehicle]
  if (needsTailLift && v.payloadWithTailLiftKg !== null) return v.payloadWithTailLiftKg
  return v.payloadKg
}

export function evaluateVehicle(vehicle: VehicleId, p: Pratica, config: Config): VehicleFit {
  const v = config.vehicles[vehicle]
  const cargo = p.cargo
  const payload = effectivePayload(vehicle, p.tailLiftRequired, config)
  const checks: VehicleFit['checks'] = []
  const exclusions: string[] = []

  if (p.tailLiftRequired && !v.hasTailLift) {
    exclusions.push('Serve la sponda idraulica e questo mezzo non ce l\u2019ha')
  }

  if (cargo.pallets !== null) {
    const ok = cargo.pallets <= v.maxPallets
    checks.push({ label: `${cargo.pallets} pallet \u2264 ${v.maxPallets} posti pallet`, ok })
    if (!ok) exclusions.push(`${cargo.pallets} pallet non entrano: massimo ${v.maxPallets}`)
  }

  if (cargo.palletHeightCm !== null) {
    const ok = cargo.palletHeightCm <= v.maxPalletHeightCm
    checks.push({ label: `Altezza ${cargo.palletHeightCm} cm \u2264 ${v.maxPalletHeightCm} cm`, ok })
    if (!ok) exclusions.push(`Altezza pallet ${cargo.palletHeightCm} cm oltre il limite di ${v.maxPalletHeightCm} cm`)
  }

  if (cargo.palletLCm !== null && cargo.palletWCm !== null) {
    const fitsFootprint =
      (cargo.palletLCm <= v.footprintLCm && cargo.palletWCm <= v.footprintWCm) ||
      (cargo.palletWCm <= v.footprintLCm && cargo.palletLCm <= v.footprintWCm)
    checks.push({ label: `Sagoma ${cargo.palletLCm}\u00d7${cargo.palletWCm} cm entro ${v.footprintLCm}\u00d7${v.footprintWCm} cm`, ok: fitsFootprint })
    if (!fitsFootprint) exclusions.push(`Sagoma pallet ${cargo.palletLCm}\u00d7${cargo.palletWCm} cm fuori dallo standard ${v.footprintLCm}\u00d7${v.footprintWCm} cm`)
  }

  if (cargo.totalWeightKg !== null) {
    const ok = cargo.totalWeightKg <= payload
    const suffix = p.tailLiftRequired && v.payloadWithTailLiftKg !== null ? ' (con sponda)' : ''
    checks.push({ label: `Peso ${cargo.totalWeightKg} kg \u2264 portata ${payload} kg${suffix}`, ok })
    if (!ok) exclusions.push(`Peso ${cargo.totalWeightKg} kg oltre la portata${suffix} di ${payload} kg`)
  }

  return { vehicle, fits: exclusions.length === 0, payloadKg: payload, checks, exclusions }
}

export const vehicleOrder: VehicleId[] = ['ducato', 'cassonato']

export const vehicleNames: Record<VehicleId, string> = {
  ducato: 'Furgone tipo Ducato',
  cassonato: 'Furgone 8 posti pallet (cassonato/telonato)',
}

export function evaluateVehicles(p: Pratica, config: Config): VehicleFit[] {
  return vehicleOrder.map((v) => evaluateVehicle(v, p, config))
}

export function selectVehicle(p: Pratica, config: Config): VehicleFit | null {
  const fits = evaluateVehicles(p, config)
  return fits.find((f) => f.fits) ?? null
}
