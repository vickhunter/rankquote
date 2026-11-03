import { Config, defaultConfig, Pratica } from './types'

const PRATICHE_KEY = 'jtc-pratiche-v1'
const CONFIG_KEY = 'jtc-config-v1'
const THEME_KEY = 'jtc-theme-v1'

export function loadPratiche(): Pratica[] {
  try {
    const raw = localStorage.getItem(PRATICHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePratiche(pratiche: Pratica[]): void {
  localStorage.setItem(PRATICHE_KEY, JSON.stringify(pratiche))
}

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return defaultConfig
    return mergeConfig(JSON.parse(raw))
  } catch {
    return defaultConfig
  }
}

export function saveConfig(config: Config): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

function mergeConfig(stored: Partial<Config>): Config {
  return {
    ...defaultConfig,
    ...stored,
    vehicles: {
      ducato: { ...defaultConfig.vehicles.ducato, ...stored.vehicles?.ducato },
      cassonato: { ...defaultConfig.vehicles.cassonato, ...stored.vehicles?.cassonato },
    },
    suggestion: {
      ...defaultConfig.suggestion,
      ...stored.suggestion,
      urgencyBonusPct: { ...defaultConfig.suggestion.urgencyBonusPct, ...stored.suggestion?.urgencyBonusPct },
    },
  }
}

export function loadTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(THEME_KEY, theme)
}

export function exportAll(pratiche: Pratica[], config: Config): void {
  const blob = new Blob([JSON.stringify({ pratiche, config }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pratiche-jtc-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  pratiche: Pratica[]
  config: Config
}

export function parseImport(text: string): ImportResult | null {
  try {
    const data = JSON.parse(text)
    const pratiche = Array.isArray(data?.pratiche) ? (data.pratiche as Pratica[]) : Array.isArray(data) ? (data as Pratica[]) : null
    if (!pratiche) return null
    const config = data?.config ? mergeConfig(data.config) : defaultConfig
    return { pratiche, config }
  } catch {
    return null
  }
}
