import { Download, Moon, Plus, Settings2, Sun, Trash2, Upload } from 'lucide-react'
import type { Pratica } from '../lib/types'
import { checklistStatus } from '../lib/engine/checklist'
import { Button } from './ui'

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
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-sm">RQ</div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-tight">RankQuote</div>
          <div className="text-[11px] text-slate-400">Checklist & quotazioni trasporti</div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <Button className="w-full" onClick={onNew}>
          <Plus size={14} /> Nuova pratica
        </Button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {pratiche.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">
            Nessuna pratica salvata.
            <br />
            Crea la prima: i dati restano su questo computer.
          </p>
        )}
        {pratiche.map((p) => {
          const status = checklistStatus(p)
          const active = p.id === selectedId
          return (
            <div
              key={p.id}
              className={`group flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 transition ${active ? 'bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:ring-indigo-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
              onClick={() => onSelect(p.id)}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${status.criticalMissing.length > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`} title={status.criticalMissing.length > 0 ? 'Dati critici mancanti' : 'Completa'} />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{praticaLabel(p)}</div>
                <div className="truncate text-[10px] text-slate-400">
                  {p.clientCompany || 'Cliente da indicare'} · {status.pct}%
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-950/50"
                title="Elimina pratica"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(p.id)
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onExport} disabled={pratiche.length === 0}>
            <Download size={13} /> Esporta
          </Button>
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
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
          <Button variant="ghost" onClick={onOpenSettings}>
            <Settings2 size={13} /> Parametri
          </Button>
          <Button variant="ghost" onClick={onToggleDark}>
            {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Chiara' : 'Scura'}
          </Button>
        </div>
      </div>
    </aside>
  )
}
