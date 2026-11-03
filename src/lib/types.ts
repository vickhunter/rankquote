export type Urgency = 'normale' | 'urgente' | 'molto-urgente'

export type VehicleId = 'ducato' | 'cassonato'

export interface VehicleConfig {
  tariffPerKm: number
  payloadKg: number
  payloadWithTailLiftKg: number | null
  maxPallets: number
  maxPalletHeightCm: number
  footprintLCm: number
  footprintWCm: number
  hasTailLift: boolean
  minimoEur: number
}

export interface Config {
  vehicles: Record<VehicleId, VehicleConfig>
  kmBufferPct: number
  kmRoundStepKm: number
  rangeStepEur: number
  markupMinPct: number
  markupMaxPct: number
  suggestion: {
    shortKm: number
    longKm: number
    urgencyBonusPct: Record<Urgency, number>
  }
}

export const defaultConfig: Config = {
  vehicles: {
    ducato: {
      tariffPerKm: 0.7,
      payloadKg: 1300,
      payloadWithTailLiftKg: null,
      maxPallets: 5,
      maxPalletHeightCm: 170,
      footprintLCm: 120,
      footprintWCm: 80,
      hasTailLift: false,
      minimoEur: 130,
    },
    cassonato: {
      tariffPerKm: 0.8,
      payloadKg: 1100,
      payloadWithTailLiftKg: 800,
      maxPallets: 8,
      maxPalletHeightCm: 200,
      footprintLCm: 120,
      footprintWCm: 80,
      hasTailLift: true,
      minimoEur: 195,
    },
  },
  kmBufferPct: 2,
  kmRoundStepKm: 10,
  rangeStepEur: 10,
  markupMinPct: 10,
  markupMaxPct: 15,
  suggestion: {
    shortKm: 150,
    longKm: 500,
    urgencyBonusPct: { normale: 0, urgente: 1, 'molto-urgente': 2 },
  },
}

export interface Cargo {
  pallets: number | null
  palletLCm: number | null
  palletWCm: number | null
  palletHeightCm: number | null
  totalWeightKg: number | null
}

export interface StopInfo {
  address: string
  timeFrom: string
  timeTo: string
  tassativo: boolean
}

export interface Pratica {
  id: string
  createdAt: number
  updatedAt: number
  clientCompany: string
  clientContact: string
  notes: string
  origin: string
  destination: string
  domestic: boolean
  urgency: Urgency
  kmGoogleMaps: number | null
  adr: boolean
  tailLiftRequired: boolean
  complexTrip: boolean
  cargo: Cargo
  pickup: StopInfo
  delivery: StopInfo
  quoteModeOverride: 'auto' | 'regoletta' | 'basetender'
  markupPct: number | null
  tenderQuotes: TenderQuote[]
}

export interface TenderQuote {
  id: string
  carrier: string
  priceEur: number | null
  knownToNetwork: boolean
  canDoTailLift: boolean
  payloadKg: number | null
  maxPallets: number | null
  promisedDelivery: string
  notes: string
}

export function emptyPratica(): Pratica {
  const now = Date.now()
  return {
    id: `pratica-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    clientCompany: '',
    clientContact: '',
    notes: '',
    origin: '',
    destination: '',
    domestic: true,
    urgency: 'normale',
    kmGoogleMaps: null,
    adr: false,
    tailLiftRequired: false,
    complexTrip: false,
    cargo: {
      pallets: null,
      palletLCm: 120,
      palletWCm: 80,
      palletHeightCm: null,
      totalWeightKg: null,
    },
    pickup: { address: '', timeFrom: '', timeTo: '', tassativo: false },
    delivery: { address: '', timeFrom: '', timeTo: '', tassativo: false },
    quoteModeOverride: 'auto',
    markupPct: null,
    tenderQuotes: [],
  }
}

export function emptyTenderQuote(): TenderQuote {
  return {
    id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    carrier: '',
    priceEur: null,
    knownToNetwork: true,
    canDoTailLift: true,
    payloadKg: null,
    maxPallets: null,
    promisedDelivery: '',
    notes: '',
  }
}
