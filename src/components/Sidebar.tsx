import { Download, Moon, Plus, Settings2, Sun, Trash2, Upload } from 'lucide-react'
import type { Pratica } from '../lib/types'
import { checklistStatus } from '../lib/engine/checklist'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  pratiche: Pratica[]
  selectedId: string | null
  dark: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onToggleDark: () => void
  onOpenSettings: () => void
  onExport: () => void
  onImport: (file: File) => void
}

function praticaLabel(p: Pratica): string {
  const from = p.origin.trim() || p.clientCompany.trim() || 'Nuova pratica'
  const to = p.destination.trim()
  return to ? `${from} → ${to}` : from
}

export default function Sidebar({ pratiche, selectedId, dark, onSelect, onNew, onDelete, onToggleDark, onOpenSettings, onExport, onImport }: Props) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-background">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-mono text-sm font-bold text-brand-foreground shadow-sm">
          RQ
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">RankQuote</div>
          <div className="text-[11px] text-muted-foreground">Checklist & quotazioni trasporti</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button className="w-full bg-brand text-brand-foreground shadow-sm hover:bg-brand/90" onClick={onNew}>
          <Plus size={14} /> Nuova pratica
        </Button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {pratiche.length === 0 && (
          <p className="px-3 py-8 text-center text-xs leading-relaxed text-muted-foreground">
            Nessuna pratica salvata.
            <br />
            Crea la prima: i dati restano
            <br />
            su questo computer.
          </p>
        )}
        {pratiche.map((p) => {
          const status = checklistStatus(p)
          const active = p.id === selectedId
          const incomplete = status.criticalMissing.length > 0
          return (
            <div
              key={p.id}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all',
                active
                  ? 'border-border bg-accent shadow-sm'
                  : 'border-transparent hover:border-border hover:bg-accent/60',
              )}
            >
              <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left" onClick={() => onSelect(p.id)}>
                <span
                  className={cn('h-1.5 w-1.5 shrink-0 rounded-full', incomplete ? 'bg-amber-500' : 'bg-emerald-500')}
                  title={incomplete ? 'Dati critici mancanti' : 'Completa'}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{praticaLabel(p)}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-[10px] text-muted-foreground">{p.clientCompany || 'Cliente da indicare'}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5">
                      <span className="h-1 w-9 overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn('block h-full rounded-full', incomplete ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${status.pct}%` }}
                        />
                      </span>
                      <span className="tnum text-[10px] text-muted-foreground">{status.pct}%</span>
                    </span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Elimina pratica"
                className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => onDelete(p.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </nav>

      <Separator />
      <div className="space-y-2 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onExport} disabled={pratiche.length === 0} className="text-xs">
            <Download size={13} /> Esporta
          </Button>
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground">
            <Upload size={13} /> Importa
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImport(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onOpenSettings} className="text-xs">
            <Settings2 size={13} /> Parametri
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onToggleDark} className="text-xs">
                {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Chiara' : 'Scura'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cambia tema</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  )
}
