import { useMemo } from 'react'
import { AlertTriangle, ArrowRight, Calculator, CheckCircle2, Copy, Landmark, Percent, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Config, Pratica } from '../lib/types'
import { decideMode } from '../lib/engine/mode'
import { computeRegoletta, negotiationBounds } from '../lib/engine/pricing'
import { suggestMarkup } from '../lib/engine/markup'
import { evaluateVehicles, vehicleNames } from '../lib/engine/vehicles'
import { canQuoteRegoletta } from '../lib/engine/checklist'
import { eur, num } from '../lib/format'
import { SectionHeader, SelectField, ToneBadge } from './fields'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { NumberTicker } from '@/components/ui/number-ticker'
import { ShineBorder } from '@/components/ui/shine-border'
import { cn } from '@/lib/utils'

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
    navigator.clipboard.writeText(summary).then(() => toast.success('Riepilogo copiato'))
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <SectionHeader
          icon={<Calculator size={18} />}
          title="Mezzo e modalità"
          subtitle="Nazionale ordinario dentro i mezzi standard → regoletta; complesso, urgente o estero → basetender"
        />
        <CardContent className="space-y-3 px-5 py-4">
          {fits.map((f) => (
            <div
              key={f.vehicle}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                f.fits ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-muted/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{vehicleNames[f.vehicle]}</span>
                {f.fits ? (
                  <ToneBadge tone="green">
                    <CheckCircle2 size={11} /> Adatto
                  </ToneBadge>
                ) : (
                  <ToneBadge tone="slate">
                    <XCircle size={11} /> Escluso
                  </ToneBadge>
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
              <div className="tnum mt-2 text-[11px] text-muted-foreground">
                {eur(config.vehicles[f.vehicle].tariffPerKm)}/km · minimo {eur(config.vehicles[f.vehicle].minimoEur)} · portata {num(f.payloadKg, ' kg')}
                {pratica.tailLiftRequired && config.vehicles[f.vehicle].hasTailLift ? ' (ridotta con sponda)' : ''}
              </div>
            </div>
          ))}

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Modalità di quotazione</span>
              <ToneBadge tone={decision.mode === 'regoletta' ? 'brand' : 'amber'}>
                {decision.mode === 'regoletta' ? <Calculator size={11} /> : <Landmark size={11} />}
                {decision.mode === 'regoletta' ? 'Regoletta' : 'Basetender'}
              </ToneBadge>
            </div>
            {decision.basetenderReasons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {decision.basetenderReasons.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <ArrowRight size={11} className="mt-0.5 shrink-0 text-amber-500" /> {r}
                  </li>
                ))}
              </ul>
            )}
            {decision.warning && (
              <Alert variant="destructive" className="mt-2 border-rose-500/30 bg-rose-500/8 py-2 text-rose-700 dark:text-rose-300">
                <AlertTriangle size={12} className="text-rose-500" />
                <AlertDescription className="text-[11px] font-medium">{decision.warning}</AlertDescription>
              </Alert>
            )}
            <div className="mt-3">
              <SelectField
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
        </CardContent>
      </Card>

      {decision.mode === 'regoletta' && (
        <Card className="gap-0 py-0">
          <SectionHeader icon={<Percent size={18} />} title="La regoletta, passo per passo" subtitle="Ogni passaggio è mostrato: nessun numero magico" />
          <CardContent className="px-5 py-4">
            {!quote.ok ? (
              <Alert className="border-amber-500/30 bg-amber-500/8 py-3 text-amber-800 dark:text-amber-300">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs">Inserisci {quote.missing.join(', ')} nella checklist per calcolare la quotazione.</AlertDescription>
              </Alert>
            ) : pricing ? (
              <div className="space-y-4">
                <ol className="ml-2.5 space-y-3.5 border-l border-dashed border-border">
                  <Step n={1} title="I chilometri" formula={`${num(pricing.kmGoogleMaps, ' km')} + ${config.kmBufferPct}% = ${num(pricing.kmBuffered, ' km')} → ${num(pricing.kmRounded, ' km')}`} note="Meglio abbondare: copre deviazioni e imprevisti" />
                  <Step n={2} title="Andata e ritorno" formula={`${num(pricing.kmRounded, ' km')} × 2 = ${num(pricing.kmTotal, ' km')}`} note="Il ritorno si conta sempre: il vettore deve rientrare" />
                  <Step n={3} title="La tariffa" formula={`${num(pricing.kmTotal, ' km')} × ${eur(pricing.tariffPerKm)}/km = ${eur(pricing.rawCarrierPrice)}`} note={pricing.minimoApplied ? `Sotto il minimo di ${eur(pricing.minimo)}: scatta il diritto di chiamata → ${eur(pricing.carrierPrice)}` : 'Questo è il prezzo del vettore: il tuo pavimento'} highlight={pricing.minimoApplied} />
                  <Step n={4} title="Il markup" formula={`${eur(pricing.carrierPrice)} + ${pricing.markupPct}% = ${eur(pricing.clientPrice)}`} note="Dal 10 al 15%, mai meno del 10%: è policy aziendale" />
                </ol>

                <div className="relative overflow-hidden rounded-lg border border-brand/25 bg-brand/5 p-4">
                  <ShineBorder shineColor={['#f97316', '#fbbf24']} duration={10} borderWidth={1.5} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Prezzo da comunicare al cliente</span>
                    <Badge variant="outline" className="border-brand/30 text-[10px] font-medium tracking-wide text-brand uppercase">range sulle decine</Badge>
                  </div>
                  <div className="tnum mt-1.5 text-3xl font-bold tracking-tight text-brand">
                    <NumberTicker value={pricing.rangeLow} /> € – <NumberTicker value={pricing.rangeHigh} /> €
                  </div>
                  <div className="tnum mt-1 text-[11px] text-muted-foreground">
                    Margine: {eur(pricing.marginEur)} · prezzo esatto {eur(pricing.clientPrice)}
                  </div>
                  <Button size="sm" onClick={copySummary} className="mt-3 bg-brand text-brand-foreground hover:bg-brand/90">
                    <Copy size={12} /> Copia riepilogo per il cliente
                  </Button>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Percent size={13} className="text-brand" /> Margine di guadagno ({config.markupMinPct}–{config.markupMaxPct}%)
                  </div>
                  <Slider
                    min={config.markupMinPct}
                    max={config.markupMaxPct}
                    step={0.5}
                    value={[effectiveMarkup]}
                    onValueChange={([v]) => update({ markupPct: v })}
                    className="mt-4"
                  />
                  <div className="tnum mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>{config.markupMinPct}%</span>
                    <span className="text-sm font-bold text-foreground">{effectiveMarkup}%</span>
                    <span>{config.markupMaxPct}%</span>
                  </div>
                  <div className="mt-2.5 flex items-start justify-between gap-2 rounded-md bg-muted/60 p-2.5">
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">Suggerimento: {suggestion.pct}%</span> — {suggestion.reason}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => update({ markupPct: suggestion.pct })} className="h-6 shrink-0 px-2 text-[11px]">
                      Usa
                    </Button>
                  </div>
                </div>

                {bounds && (
                  <div className="rounded-lg border p-4">
                    <div className="text-xs font-semibold">Limiti per la trattativa</div>
                    <div className="tnum mt-2.5 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-rose-500/8 p-2.5">
                        <div className="text-[10px] font-semibold tracking-wide text-rose-600 uppercase dark:text-rose-400">Pavimento (vettore)</div>
                        <div className="mt-0.5 text-sm font-bold text-rose-700 dark:text-rose-300">{eur(bounds.carrierFloorEur)}</div>
                      </div>
                      <div className="rounded-md bg-amber-500/8 p-2.5">
                        <div className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">Minimo +{config.markupMinPct}%</div>
                        <div className="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">{eur(bounds.policyMinClientEur)}</div>
                      </div>
                      <div className="rounded-md bg-emerald-500/8 p-2.5">
                        <div className="text-[10px] font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">Spazio manovra</div>
                        <div className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">{eur(bounds.roomEur)}</div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
                      Sotto {eur(bounds.policyMinClientEur)} non stai facendo uno sconto: stai lavorando in perdita o violando la policy. Concedere poche decine di euro può voler dire rinunciare a metà del guadagno.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Step({ n, title, formula, note, highlight }: { n: number; title: string; formula: string; note: string; highlight?: boolean }) {
  return (
    <li className="relative pl-5">
      <span
        className={cn(
          'absolute top-0 -left-2.5 flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold',
          highlight ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground',
        )}
      >
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold">{title}</div>
        <div className="tnum text-xs text-muted-foreground">{formula}</div>
        <div className="text-[11px] text-muted-foreground/70">{note}</div>
      </div>
    </li>
  )
}
