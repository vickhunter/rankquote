import { useEffect, useMemo, useState } from 'react'
import { Route, Timer } from 'lucide-react'
import type { Cargo, Pratica, StopInfo } from './lib/types'
import { emptyPratica, type Config } from './lib/types'
import { exportAll, loadConfig, loadPratiche, loadTheme, parseImport, saveConfig, savePratiche, saveTheme } from './lib/storage'
import { decideMode } from './lib/engine/mode'
import Sidebar from './components/Sidebar'
import ChecklistPanel from './components/ChecklistPanel'
import DecisionPanel from './components/DecisionPanel'
import BasetenderPanel from './components/BasetenderPanel'
import SettingsModal from './components/SettingsModal'
import { ToneBadge } from './components/fields'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { BlurFade } from '@/components/ui/blur-fade'
import { GridPattern } from '@/components/ui/grid-pattern'

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
    <TooltipProvider delayDuration={250}>
      <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950">
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
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/80 px-6 py-3 backdrop-blur-md">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">
                {current ? (current.origin && current.destination ? `${current.origin} → ${current.destination}` : 'Pratica senza tratta') : 'Nessuna pratica selezionata'}
              </h1>
              {current && <div className="truncate text-[11px] text-muted-foreground">{current.clientCompany || 'Cliente da indicare'} · salvata automaticamente</div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {decision && (
                <ToneBadge tone={decision.mode === 'regoletta' ? 'brand' : 'amber'} className="px-2.5 py-1 text-[11px] uppercase tracking-wider">
                  {decision.mode === 'regoletta' ? 'Regoletta' : 'Basetender'}
                </ToneBadge>
              )}
              <span className="hidden items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground md:inline-flex">
                <Timer size={11} /> risposta ≤ 2 min
              </span>
            </div>
          </header>

          {importError && (
            <div className="px-6 pt-4">
              <Alert variant="destructive">
                <AlertTitle>File non valido</AlertTitle>
                <AlertDescription>Serve un JSON esportato da questa app.</AlertDescription>
              </Alert>
            </div>
          )}

          {current && decision ? (
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="space-y-4">
                <BlurFade delay={0} duration={0.35}>
                  <ChecklistPanel pratica={current} update={updateCurrent} updateCargo={updateCargo} updateStop={updateStop} />
                </BlurFade>
                {decision.mode === 'basetender' && (
                  <BlurFade delay={0.05} duration={0.35}>
                    <BasetenderPanel pratica={current} config={config} update={updateCurrent} />
                  </BlurFade>
                )}
              </div>
              <div>
                <BlurFade delay={0.08} duration={0.35}>
                  <DecisionPanel pratica={current} config={config} update={updateCurrent} />
                </BlurFade>
              </div>
            </div>
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden p-10 text-center">
              <GridPattern width={36} height={36} className="fill-neutral-400/20 stroke-neutral-400/20 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
                <Route size={26} />
              </div>
              <div className="relative">
                <h2 className="text-lg font-semibold tracking-tight">Inizia una nuova pratica</h2>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Raccogli le informazioni del cliente con la checklist, lascia che la cascata di regole scelga mezzo e modalità di
                  quotazione, e comunica il prezzo con il margine giusto. Tutto viene salvato su questo computer.
                </p>
              </div>
              <Button onClick={createPratica} className="relative bg-brand text-brand-foreground hover:bg-brand/90">
                Nuova pratica
              </Button>
            </div>
          )}
        </main>

        {settingsOpen && <SettingsModal config={config} onChange={setConfig} onClose={() => setSettingsOpen(false)} />}
        <Toaster theme={dark ? 'dark' : 'light'} position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
