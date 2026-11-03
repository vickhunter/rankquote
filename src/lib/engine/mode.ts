import type { Config, Pratica } from '../types'
import { selectVehicle, vehicleNames } from './vehicles'

export type QuoteMode = 'regoletta' | 'basetender'

export interface ModeDecision {
  mode: QuoteMode
  forcedBy: 'auto' | 'override'
  basetenderReasons: string[]
  regolettaVehicle: string | null
  warning: string | null
}

export function decideMode(p: Pratica, config: Config): ModeDecision {
  const reasons: string[] = []
  if (!p.domestic) reasons.push('Viaggio all\u2019estero')
  if (p.adr) reasons.push('Merce pericolosa (ADR): servono vettori abilitati')
  if (p.urgency === 'molto-urgente') reasons.push('Viaggio particolarmente urgente')
  if (p.complexTrip) reasons.push('Viaggio complesso / fuori standard')

  const vehicle = selectVehicle(p, config)
  const cargoComplete = p.cargo.pallets !== null && p.cargo.totalWeightKg !== null
  if (cargoComplete && !vehicle) {
    reasons.push('Il carico non sta in nessuno dei due mezzi standard')
  }

  const autoMode: QuoteMode = reasons.length > 0 ? 'basetender' : 'regoletta'
  const override = p.quoteModeOverride

  if (override !== 'auto') {
    const warning =
      override === 'regoletta' && autoMode === 'basetender'
        ? 'Attenzione: la pratica ha caratteristiche da basetender (' + reasons.join('; ') + '). Stai forzando la regoletta.'
        : override === 'basetender' && autoMode === 'regoletta'
          ? 'La regoletta sarebbe sufficiente: stai scegliendo il mercato senza necessit\u00e0.'
          : null
    return {
      mode: override,
      forcedBy: 'override',
      basetenderReasons: reasons,
      regolettaVehicle: vehicle ? vehicleNames[vehicle.vehicle] : null,
      warning,
    }
  }

  return {
    mode: autoMode,
    forcedBy: 'auto',
    basetenderReasons: reasons,
    regolettaVehicle: vehicle ? vehicleNames[vehicle.vehicle] : null,
    warning: null,
  }
}
