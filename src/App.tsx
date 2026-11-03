import { useEffect, useMemo, useState } from 'react'
import { Timer } from 'lucide-react'
import type { Cargo, Pratica, StopInfo } from './lib/types'
import { emptyPratica, type Config } from './lib/types'
import { exportAll, loadConfig, loadPratiche, loadTheme, parseImport, saveConfig, savePratiche, saveTheme } from './lib/storage'
import { decideMode } from './lib/engine/mode'
import Sidebar from './components/Sidebar'
import ChecklistPanel from './components/ChecklistPanel'
import DecisionPanel from './components/DecisionPanel'
import BasetenderPanel from './components/BasetenderPanel'
import SettingsModal from './components/SettingsModal'
import { Badge } from './components/ui'

export default function App() {
  const [pratiche, setPratiche] = useState<Pratica[]>(loadPratiche)
  const [selectedId, setSelectedId] = useState<string | null>(() => loadPratiche()[0]?.id ?? null)
  const [config, setConfig] = useState<Config>(loadConfig)
  const [dark, setDark] = useState(() => loadTheme() === 'dark')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importError, setImportError] = useState(false)

  useEffect(() => savePratiche(pratiche), [pratiche])
  useEffect(() => saveConfig(config), [config])
  useEffect(() => {
    saveTheme(dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const current = useMemo(() => pratiche.find((p) => p.id === selectedId) ?? null, [pratiche, selectedId])
  const decision = useMemo(() => (current ? decideMode(current, config) : null), [current, config])

  function updatePratica(id: string, patch: Partial<Pratica>) {
    setPratiche((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)))
  }

  function createPratica() {
    const p = emptyPratica()
    setPratiche((prev) => [p, ...prev])
    setSelectedId(p.id)
  }

  function deletePratica(id: string) {
    setPratiche((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function handleImport(file: File) {
    file.text().then((text) => {
      const result = parseImport(text)
      if (!result) {
        setImportError(true)
        return
      }
      setImportError(false)
      setPratiche(result.pratiche)
      setConfig(result.config)
      setSelectedId(result.pratiche[0]?.id ?? null)
    })
  }

  const updateCurrent = current ? (patch: Partial<Pratica>) => updatePratica(current.id, patch) : () => {}
  const updateCargo = current ? (patch: Partial<Cargo>) => updatePratica(current.id, { cargo: { ...current.cargo, ...patch } }) : () => {}
  const updateStop = current
    ? (stop: 'pickup' | 'delivery', patch: Partial<StopInfo>) => updatePratica(current.id, { [stop]: { ...current[stop], ...patch } })
    : () => {}

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        pratiche={pratiche}
        selectedId={selectedId}
        dark={dark}
        onSelect={setSelectedId}
        onNew={createPratica}
        onDelete={deletePratica}
        onToggleDark={() => setDark((d) => !d)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExport={() => exportAll(pratiche, config)}
        onImport={handleImport}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight">
              {current ? current.origin && current.destination ? `${current.origin} → ${current.destination}` : 'Pratica senza tratta' : 'Nessuna pratica selezionata'}
            </h1>
            {current && (
              <div className="truncate text-[11px] text-slate-400">
                {current.clientCompany || 'Cliente da indicare'} · salvata automaticamente
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {decision && <Badge tone={decision.mode === 'regoletta' ? 'indigo' : 'amber'}>{decision.mode === 'regoletta' ? 'REGOLETTA' : 'BASETENDER'}</Badge>}
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 md:inline-flex dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">
              <Timer size={11} /> Obiettivo: risposta entro 2 minuti
            </span>
          </div>
        </header>

        {importError && (
          <div className="mx-6 mt-4 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            File non valido: serve un JSON esportato da questa app.
          </div>
        )}

        {current && decision ? (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-4">
              <ChecklistPanel pratica={current} update={updateCurrent} updateCargo={updateCargo} updateStop={updateStop} />
              {decision.mode === 'basetender' && <BasetenderPanel pratica={current} config={config} update={updateCurrent} />}
            </div>
            <div>
              <DecisionPanel pratica={current} config={config} update={updateCurrent} />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Timer size={26} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Inizia una nuova pratica</h2>
            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
              Raccogli le informazioni del cliente con la checklist, lascia che la cascata di regole scelga mezzo e modalità di quotazione, e comunica il prezzo con il margine giusto. Tutto viene salvato su questo computer.
            </p>
          </div>
        )}
      </main>

      {settingsOpen && <SettingsModal config={config} onChange={setConfig} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
