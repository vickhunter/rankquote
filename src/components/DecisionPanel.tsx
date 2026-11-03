import { useMemo } from 'react'
import { AlertTriangle, ArrowRight, Calculator, CheckCircle2, Copy, Gauge, Landmark, Percent, XCircle } from 'lucide-react'
import type { Config, Pratica } from '../lib/types'
import { decideMode } from '../lib/engine/mode'
import { computeRegoletta, negotiationBounds } from '../lib/engine/pricing'
import { suggestMarkup } from '../lib/engine/markup'
import { evaluateVehicles, vehicleNames } from '../lib/engine/vehicles'
import { canQuoteRegoletta } from '../lib/engine/checklist'
import { eur, num } from '../lib/format'
import { Badge, Card, SectionHeader, Select } from './ui'

interface Props {
  pratica: Pratica
  config: Config
  update: (patch: Partial<Pratica>) => void
}

export default function DecisionPanel({ pratica, config, update }: Props) {
  const decision = useMemo(() => decideMode(pratica, config), [pratica, config])
  const fits = useMemo(() => evaluateVehicles(pratica, config), [pratica, config])
  const suggestion = useMemo(() => suggestMarkup(pratica.kmGoogleMaps, pratica.urgency, config), [pratica.kmGoogleMaps, pratica.urgency, config])
  const effectiveMarkup = pratica.markupPct ?? suggestion.pct
  const quote = canQuoteRegoletta(pratica)

  const pricing = useMemo(() => {
    if (decision.mode !== 'regoletta') return null
    if (!quote.ok || pratica.kmGoogleMaps === null) return null
    const selected = fits.find((f) => f.fits)
    if (!selected) return null
    return computeRegoletta(selected.vehicle, pratica.kmGoogleMaps, effectiveMarkup, config)
  }, [decision.mode, quote.ok, pratica.kmGoogleMaps, fits, effectiveMarkup, config])

  const bounds = pricing ? negotiationBounds(pricing.carrierPrice, pricing.clientPrice, config) : null

  const summary = useMemo(() => {
    if (!pricing) return ''
    const lines = [
      `Trasporto ${pratica.origin || '?'} → ${pratica.destination || '?'} (${vehicleNames[pricing.vehicle]})`,
      pricing.minimoApplied
        ? `Tratta breve: applicato il diritto di chiamata minimo di ${eur(pricing.minimo)} + markup ${pricing.markupPct}%.`
        : `${num(pratica.kmGoogleMaps, ' km')} +${config.kmBufferPct}% arrotondati a ${num(pricing.kmRounded, ' km')}, andata e ritorno ${num(pricing.kmTotal, ' km')} × ${eur(pricing.tariffPerKm)}/km = ${eur(pricing.carrierPrice)} + markup ${pricing.markupPct}%.`,
      `Prezzo al cliente: ${eur(pricing.rangeLow)}–${eur(pricing.rangeHigh)} (IVA esclusa).`,
    ]
    if (pratica.delivery.tassativo && pratica.delivery.timeTo) lines.push(`Consegna tassativa entro ${new Date(pratica.delivery.timeTo).toLocaleString('it-IT')}.`)
    return lines.join('\n')
  }, [pricing, pratica, config.kmBufferPct])

  function copySummary() {
    navigator.clipboard.writeText(summary)
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          icon={<Gauge size={18} />}
          title="Mezzo e modalità"
          subtitle="La regola: nazionale ordinario dentro i mezzi standard → regoletta; complesso, urgente o estero → basetender"
        />
        <div className="space-y-3 px-5 py-4">
          {fits.map((f) => (
            <div key={f.vehicle} className={`rounded-xl border p-3 ${f.fits ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{vehicleNames[f.vehicle]}</span>
                {f.fits ? (
                  <Badge tone="green">
                    <CheckCircle2 size={11} /> Adatto
                  </Badge>
                ) : (
                  <Badge tone="slate">
                    <XCircle size={11} /> Escluso
                  </Badge>
                )}
              </div>
              <ul className="mt-2 space-y-1">
                {f.exclusions.map((e) => (
                  <li key={e} className="flex items-start gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                    <XCircle size={11} className="mt-0.5 shrink-0" /> {e}
                  </li>
                ))}
                {f.fits &&
                  f.checks.map((c) => (
                    <li key={c.label} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={11} className="mt-0.5 shrink-0" /> {c.label}
                    </li>
                  ))}
              </ul>
              <div className="tnum mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {eur(config.vehicles[f.vehicle].tariffPerKm)}/km · minimo {eur(config.vehicles[f.vehicle].minimoEur)} · portata {num(f.payloadKg, ' kg')}
                {pratica.tailLiftRequired && config.vehicles[f.vehicle].hasTailLift ? ' (ridotta con sponda)' : ''}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">Modalità di quotazione</span>
              <Badge tone={decision.mode === 'regoletta' ? 'indigo' : 'amber'}>
                {decision.mode === 'regoletta' ? <Calculator size={11} /> : <Landmark size={11} />}
                {decision.mode === 'regoletta' ? 'REGOLETTA' : 'BASETENDER'}
              </Badge>
            </div>
            {decision.basetenderReasons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {decision.basetenderReasons.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <ArrowRight size={11} className="mt-0.5 shrink-0 text-amber-500" /> {r}
                  </li>
                ))}
              </ul>
            )}
            {decision.warning && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 p-2 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {decision.warning}
              </div>
            )}
            <div className="mt-3">
              <Select
                value={pratica.quoteModeOverride}
                onChange={(v) => update({ quoteModeOverride: v })}
                options={[
                  { value: 'auto', label: 'Automatico (consigliato)' },
                  { value: 'regoletta', label: 'Forza regoletta' },
                  { value: 'basetender', label: 'Forza basetender' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {decision.mode === 'regoletta' && (
        <Card>
          <SectionHeader icon={<Calculator size={18} />} title="La regoletta, passo per passo" subtitle="Ogni passaggio è mostrato: nessun numero magico" />
          <div className="px-5 py-4">
            {!quote.ok ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Inserisci {quote.missing.join(', ')} nella checklist per calcolare la quotazione.</span>
              </div>
            ) : pricing ? (
              <div className="space-y-4">
                <ol className="space-y-2">
                  <Step n={1} title="I chilometri" formula={`${num(pricing.kmGoogleMaps, ' km')} + ${config.kmBufferPct}% = ${num(pricing.kmBuffered, ' km')} → arrotondato per eccesso a ${num(pricing.kmRounded, ' km')}`} note="Meglio abbondare: copre deviazioni e imprevisti" />
                  <Step n={2} title="Andata e ritorno" formula={`${num(pricing.kmRounded, ' km')} × 2 = ${num(pricing.kmTotal, ' km')}`} note="Il ritorno si conta sempre: il vettore deve rientrare" />
                  <Step n={3} title="La tariffa" formula={`${num(pricing.kmTotal, ' km')} × ${eur(pricing.tariffPerKm)}/km = ${eur(pricing.rawCarrierPrice)}`} note={pricing.minimoApplied ? `Sotto il minimo di ${eur(pricing.minimo)}: si quota il diritto di chiamata → ${eur(pricing.carrierPrice)}` : 'Questo è il prezzo del vettore: il tuo pavimento'} highlight={pricing.minimoApplied} />
                  <Step n={4} title="Il markup" formula={`${eur(pricing.carrierPrice)} + ${pricing.markupPct}% = ${eur(pricing.clientPrice)}`} note="Dal 10 al 15%, mai meno del 10%: è policy aziendale" />
                </ol>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Prezzo da comunicare al cliente</span>
                    <Badge tone="indigo">range sulle decine</Badge>
                  </div>
                  <div className="tnum mt-1 text-3xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-300">
                    {eur(pricing.rangeLow)} – {eur(pricing.rangeHigh)}
                  </div>
                  <div className="tnum mt-1 text-[11px] text-indigo-800/70 dark:text-indigo-300/70">
                    Margine: {eur(pricing.marginEur)} · prezzo esatto {eur(pricing.clientPrice)}
                  </div>
                  <button
                    type="button"
                    onClick={copySummary}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    <Copy size={12} /> Copia riepilogo per il cliente
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Percent size={13} className="text-indigo-500" /> Margine di guadagno ({config.markupMinPct}–{config.markupMaxPct}%)
                  </div>
                  <input
                    type="range"
                    min={config.markupMinPct}
                    max={config.markupMaxPct}
                    step={0.5}
                    value={effectiveMarkup}
                    onChange={(e) => update({ markupPct: Number(e.target.value) })}
                    className="mt-3"
                  />
                  <div className="tnum mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>{config.markupMinPct}%</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{effectiveMarkup}%</span>
                    <span>{config.markupMaxPct}%</span>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                    <span className="text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Suggerimento: {suggestion.pct}%</span> — {suggestion.reason}
                    </span>
                    <button type="button" onClick={() => update({ markupPct: suggestion.pct })} className="shrink-0 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                      Usa
                    </button>
                  </div>
                </div>

                {bounds && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="text-xs font-bold">Limiti per la trattativa</div>
                    <div className="tnum mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/40">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-500">Pavimento (vettore)</div>
                        <div className="text-sm font-bold text-rose-700 dark:text-rose-300">{eur(bounds.carrierFloorEur)}</div>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/40">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Minimo policy +{config.markupMinPct}%</div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{eur(bounds.policyMinClientEur)}</div>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Spazio di manovra</div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{eur(bounds.roomEur)}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      Sotto {eur(bounds.policyMinClientEur)} non stai facendo uno sconto: stai lavorando in perdita o violando la policy. Concedere poche decine di euro può voler dire rinunciare a metà del guadagno.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  )
}

function Step({ n, title, formula, note, highlight }: { n: number; title: string; formula: string; note: string; highlight?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${highlight ? 'bg-amber-500 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'}`}>{n}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold">{title}</div>
        <div className="tnum text-xs text-slate-600 dark:text-slate-300">{formula}</div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">{note}</div>
      </div>
    </li>
  )
}
