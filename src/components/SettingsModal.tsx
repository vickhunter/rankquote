import { useState } from 'react'
import { RotateCcw, Settings2, X } from 'lucide-react'
import type { Config, VehicleId } from '../lib/types'
import { defaultConfig } from '../lib/types'
import { Button, Card, Field, NumberInput } from './ui'

interface Props {
  config: Config
  onChange: (config: Config) => void
  onClose: () => void
}

export default function SettingsModal({ config, onChange, onClose }: Props) {
  const [draft, setDraft] = useState<Config>(JSON.parse(JSON.stringify(config)))

  function patchVehicle(id: VehicleId, patch: Partial<Config['vehicles'][VehicleId]>) {
    setDraft((d) => ({ ...d, vehicles: { ...d.vehicles, [id]: { ...d.vehicles[id], ...patch } } }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-500" />
              <div>
                <h2 className="text-sm font-semibold">Parametri di calcolo</h2>
                <p className="text-xs text-slate-500">Modifica qui tariffe, minimi e forchetta del margine: tutti i calcoli si adeguano</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6 px-5 py-5">
            <section>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mezzi</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {(['ducato', 'cassonato'] as VehicleId[]).map((id) => (
                  <div key={id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 text-xs font-bold">{id === 'ducato' ? 'Furgone tipo Ducato' : 'Cassonato / telonato 8 posti'}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tariffa €/km">
                        <NumberInput value={draft.vehicles[id].tariffPerKm} onChange={(v) => patchVehicle(id, { tariffPerKm: v ?? 0 })} min={0} step={0.05} suffix="€" />
                      </Field>
                      <Field label="Minimo (diritto di chiamata)">
                        <NumberInput value={draft.vehicles[id].minimoEur} onChange={(v) => patchVehicle(id, { minimoEur: v ?? 0 })} min={0} step={5} suffix="€" />
                      </Field>
                      <Field label="Portata kg">
                        <NumberInput value={draft.vehicles[id].payloadKg} onChange={(v) => patchVehicle(id, { payloadKg: v ?? 0 })} min={0} step={50} suffix="kg" />
                      </Field>
                      <Field label="Portata con sponda kg" hint={id === 'ducato' ? 'Il Ducato non ha la sponda' : undefined}>
                        <NumberInput
                          value={draft.vehicles[id].payloadWithTailLiftKg}
                          onChange={(v) => patchVehicle(id, { payloadWithTailLiftKg: v })}
                          min={0}
                          step={50}
                          suffix="kg"
                          placeholder={id === 'ducato' ? 'n/a' : undefined}
                        />
                      </Field>
                      <Field label="Max pallet">
                        <NumberInput value={draft.vehicles[id].maxPallets} onChange={(v) => patchVehicle(id, { maxPallets: v ?? 0 })} min={0} />
                      </Field>
                      <Field label="Altezza max pallet">
                        <NumberInput value={draft.vehicles[id].maxPalletHeightCm} onChange={(v) => patchVehicle(id, { maxPalletHeightCm: v ?? 0 })} min={0} step={5} suffix="cm" />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Chilometri e arrotondamenti</h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Buffer minimo sui km" hint="«almeno il 2%» per deviazioni e imprevisti">
                  <NumberInput value={draft.kmBufferPct} onChange={(v) => setDraft({ ...draft, kmBufferPct: v ?? 0 })} min={0} step={0.5} suffix="%" />
                </Field>
                <Field label="Arrotondamento km" hint="Per eccesso, a questo step">
                  <NumberInput value={draft.kmRoundStepKm} onChange={(v) => setDraft({ ...draft, kmRoundStepKm: v ?? 1 })} min={1} suffix="km" />
                </Field>
                <Field label="Step del range cliente" hint="Il range si comunica sulle decine">
                  <NumberInput value={draft.rangeStepEur} onChange={(v) => setDraft({ ...draft, rangeStepEur: v ?? 1 })} min={1} suffix="€" />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Margine di guadagno (markup)</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Field label="Minimo policy">
                  <NumberInput value={draft.markupMinPct} onChange={(v) => setDraft({ ...draft, markupMinPct: v ?? 0 })} min={0} step={0.5} suffix="%" />
                </Field>
                <Field label="Massimo">
                  <NumberInput value={draft.markupMaxPct} onChange={(v) => setDraft({ ...draft, markupMaxPct: v ?? 0 })} min={0} step={0.5} suffix="%" />
                </Field>
                <Field label="Tratta «corta» fino a" hint="Suggerisce il massimo">
                  <NumberInput value={draft.suggestion.shortKm} onChange={(v) => setDraft({ ...draft, suggestion: { ...draft.suggestion, shortKm: v ?? 0 } })} min={0} step={10} suffix="km" />
                </Field>
                <Field label="Tratta «lunga» da" hint="Suggerisce il minimo">
                  <NumberInput value={draft.suggestion.longKm} onChange={(v) => setDraft({ ...draft, suggestion: { ...draft.suggestion, longKm: v ?? 1 } })} min={1} step={10} suffix="km" />
                </Field>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label="Bonus urgenza «urgente»">
                  <NumberInput value={draft.suggestion.urgencyBonusPct.urgente} onChange={(v) => setDraft({ ...draft, suggestion: { ...draft.suggestion, urgencyBonusPct: { ...draft.suggestion.urgencyBonusPct, urgente: v ?? 0 } } })} min={0} step={0.5} suffix="%" />
                </Field>
                <Field label="Bonus «molto urgente»">
                  <NumberInput value={draft.suggestion.urgencyBonusPct['molto-urgente']} onChange={(v) => setDraft({ ...draft, suggestion: { ...draft.suggestion, urgencyBonusPct: { ...draft.suggestion.urgencyBonusPct, 'molto-urgente': v ?? 0 } } })} min={0} step={0.5} suffix="%" />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Tra tratta corta e lunga il suggerimento scende linearmente da {draft.markupMaxPct}% a {draft.markupMinPct}% in base ai km.
              </p>
            </section>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setDraft(JSON.parse(JSON.stringify(defaultConfig)))}>
              <RotateCcw size={13} /> Ripristina default del documento
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Annulla
              </Button>
              <Button
                onClick={() => {
                  onChange(draft)
                  onClose()
                }}
              >
                Salva parametri
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
