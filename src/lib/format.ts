export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function eur(value: number | null | undefined): string {
  if (value === null || value === undefined) return '\u2014'
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
}

export function num(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '\u2014'
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${suffix}`
}

export function inputValue(value: number | null): string {
  return value === null ? '' : String(value)
}
