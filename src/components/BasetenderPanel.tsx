import { useMemo } from 'react'
import { Award, Landmark, Phone, Plus, Trash2 } from 'lucide-react'
import type { Config, Pratica, TenderQuote } from '../lib/types'
import { emptyTenderQuote } from '../lib/types'
import { evaluateQuotes, pickRecommended, rankQuotes } from '../lib/engine/basetender'
import { suggestMarkup } from '../lib/engine/markup'
import { eur, num } from '../lib/format'
import { Field, NumberInput, SectionHeader, Segmented, TextInput, ToneBadge } from './fields'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  pratica: Pratica
  config: Config
  update: (patch: Partial<Pratica>) => void
}

export default function BasetenderPanel({ pratica, config, update }: Props) {
  const suggestion = useMemo(() => suggestMarkup(pratica.kmGoogleMaps, pratica.urgency, config), [pratica.kmGoogleMaps, pratica.urgency, config])
  const markup = pratica.markupPct ?? suggestion.pct
  const evaluated = useMemo(() => rankQuotes(evaluateQuotes(pratica, markup, config)), [pratica, markup, config])
  const recommended = useMemo(() => pickRecommended(evaluated), [evaluated])

  function addQuote() {
    update({ tenderQuotes: [...pratica.tenderQuotes, emptyTenderQuote()] })
  }

  function updateQuote(id: string, patch: Partial<TenderQuote>) {
    update({ tenderQuotes: pratica.tenderQuotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
  }

  function removeQuote(id: string) {
    update({ tenderQuotes: pratica.tenderQuotes.filter((q) => q.id !== id) })
  }

  return (
    <Card className="gap-0 py-0">
      <SectionHeader
        icon={<Landmark size={18} />}
        title="Quotazioni basetender"
        subtitle="Prima si scarta chi non è adatto, a qualunque prezzo. Poi si sceglie tra le valide: prezzo, affidabilità, margine sull'orario"
        right={
          <Button size="sm" variant="secondary" onClick={addQuote} className="whitespace-nowrap">
            <Plus size={13} /> Aggiungi quotazione
          </Button>
        }
      />
      <CardContent className="space-y-3 px-5 py-4">
        {pratica.tenderQuotes.length === 0 && (
          <p className="rounded-lg bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
            Nessuna quotazione ricevuta. Pubblica la richiesta su basetender, poi inserisci qui le risposte dei vettori man mano che arrivano:
            non è detto che la prima sia la migliore, né che la più economica sia quella giusta.
          </p>
        )}
        {evaluated.map((e) => {
          const q = e.quote
          const isRecommended = recommended !== null && q.id === recommended.quote.id
          return (
            <div
              key={q.id}
              className={cn(
                'rounded-lg border p-4',
                !e.valid
                  ? 'border-rose-500/30 bg-rose-500/4'
                  : isRecommended
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border',
              )}
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Field label="Vettore">
                  <TextInput value={q.carrier} onChange={(v) => updateQuote(q.id, { carrier: v })} placeholder="Nome vettore" />
                </Field>
                <Field label="Prezzo offerto">
                  <NumberInput value={q.priceEur} onChange={(v) => updateQuote(q.id, { priceEur: v })} placeholder="€" min={0} suffix="€" />
                </Field>
                <Field label="Portata dichiarata">
                  <NumberInput value={q.payloadKg} onChange={(v) => updateQuote(q.id, { payloadKg: v })} placeholder="kg" min={0} suffix="kg" />
                </Field>
                <Field label="Consegna promessa">
                  <TextInput type="datetime-local" value={q.promisedDelivery} onChange={(v) => updateQuote(q.id, { promisedDelivery: v })} />
                </Field>
                <Field label="Posti pallet">
                  <NumberInput value={q.maxPallets} onChange={(v) => updateQuote(q.id, { maxPallets: v })} placeholder="n°" min={0} />
                </Field>
                <Field label="Ha la sponda idraulica">
                  <Segmented checked={q.canDoTailLift} onChange={(v) => updateQuote(q.id, { canDoTailLift: v })} />
                </Field>
                <Field label="Vettore noto nella rete">
                  <Segmented checked={q.knownToNetwork} onChange={(v) => updateQuote(q.id, { knownToNetwork: v })} labelYes="Noto" labelNo="Nuovo" />
                </Field>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" className="w-full text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400" onClick={() => removeQuote(q.id)}>
                    <Trash2 size={13} /> Elimina
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!e.valid ? (
                  <ToneBadge tone="red">Scartata — non rispetta i requisiti</ToneBadge>
                ) : isRecommended ? (
                  <ToneBadge tone="green">
                    <Award size={11} /> Consigliata
                  </ToneBadge>
                ) : (
                  <ToneBadge tone="green">Valida</ToneBadge>
                )}
                {e.valid && e.clientPrice !== null && (
                  <ToneBadge tone="brand">
                    Al cliente: {eur(e.rangeLow)}–{eur(e.rangeHigh)} con markup {markup}%
                  </ToneBadge>
                )}
                {e.timeMarginHours !== null && (
                  <ToneBadge tone={e.timeMarginHours < 0 ? 'red' : e.timeMarginHours <= 2 ? 'amber' : 'slate'}>
                    Margine orario: {num(e.timeMarginHours, ' h')}
                  </ToneBadge>
                )}
              </div>

              {e.exclusions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {e.exclusions.map((x) => (
                    <li key={x} className="text-[11px] font-medium text-rose-600 dark:text-rose-400">✕ {x}</li>
                  ))}
                </ul>
              )}
              {e.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {e.warnings.map((w) => (
                    <li key={w} className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      {w.toLowerCase().includes('telefon') ? <Phone size={11} /> : null} {w}
                    </li>
                  ))}
                </ul>
              )}
              {isRecommended && (
                <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                  Miglior bilancio tra prezzo, affidabilità (vettore noto) e margine di sicurezza sull'orario.
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
