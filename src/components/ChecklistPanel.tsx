import { AlertTriangle, Boxes, ClipboardCheck, MapPin, PackageCheck, Truck } from 'lucide-react'
import type { Cargo, Pratica, StopInfo, Urgency } from '../lib/types'
import { checklistStatus } from '../lib/engine/checklist'
import { Field, NumberInput, SectionHeader, Segmented, SelectField, TextInput, ToneBadge } from './fields'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface Props {
  pratica: Pratica
  update: (patch: Partial<Pratica>) => void
  updateCargo: (patch: Partial<Cargo>) => void
  updateStop: (stop: 'pickup' | 'delivery', patch: Partial<StopInfo>) => void
}

function Legend({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
      <span className="text-brand">{icon}</span> {children}
    </legend>
  )
}

export default function ChecklistPanel({ pratica, update, updateCargo, updateStop }: Props) {
  const status = checklistStatus(pratica)
  const hasCriticalMissing = status.criticalMissing.length > 0

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <SectionHeader
          icon={<ClipboardCheck size={18} />}
          title="Checklist informazioni cliente"
          subtitle="Chiedi tutto insieme, in un'unica risposta: senza questi dati non si può quotare nulla"
          right={
            <div className="flex items-center gap-2.5">
              <span className="tnum text-xs font-medium text-muted-foreground">
                {status.done}/{status.total}
              </span>
              <Progress
                value={status.pct}
                className={cn('h-1.5 w-24', hasCriticalMissing ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')}
              />
            </div>
          }
        />
        {status.missing.length > 0 && (
          <div className="border-b">
            <Alert className="rounded-none border-0 border-amber-500/30 bg-amber-500/8 py-3 text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs">
                Da chiedere ancora:{' '}
                {status.missing.map((m, i) => (
                  <span key={m.key} className="font-semibold">
                    {m.label}
                    {i < status.missing.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <CardContent className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Azienda cliente">
              <TextInput value={pratica.clientCompany} onChange={(v) => update({ clientCompany: v })} placeholder="es. Rossi Manufacturing Srl" />
            </Field>
            <Field label="Referente / contatto">
              <TextInput value={pratica.clientContact} onChange={(v) => update({ clientContact: v })} placeholder="Nome, telefono o email" />
            </Field>
          </div>

          <fieldset>
            <Legend icon={<MapPin size={12} />}>Il viaggio</Legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Luogo di ritiro">
                <TextInput value={pratica.origin} onChange={(v) => update({ origin: v })} placeholder="es. Padova" />
              </Field>
              <Field label="Luogo di consegna">
                <TextInput value={pratica.destination} onChange={(v) => update({ destination: v })} placeholder="es. Firenze" />
              </Field>
              <Field label="Tratta">
                <SelectField
                  value={pratica.domestic ? 'nazionale' : 'estero'}
                  onChange={(v) => update({ domestic: v === 'nazionale' })}
                  options={[
                    { value: 'nazionale', label: 'Nazionale' },
                    { value: 'estero', label: 'Estero → basetender' },
                  ]}
                />
              </Field>
              <Field label="Urgenza percepita dal cliente">
                <SelectField
                  value={pratica.urgency}
                  onChange={(v) => update({ urgency: v as Urgency })}
                  options={[
                    { value: 'normale', label: 'Normale' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'molto-urgente', label: 'Molto urgente → basetender' },
                  ]}
                />
              </Field>
              <Field label="Km secondo Google Maps" hint="Il percorso suggerito, prima di buffer e andata/ritorno">
                <NumberInput value={pratica.kmGoogleMaps} onChange={(v) => update({ kmGoogleMaps: v })} placeholder="es. 230" min={0} suffix="km" />
              </Field>
              <Field label="Viaggio complesso / fuori standard?" hint="Es. più soste, permessi speciali, carico non standard">
                <Segmented checked={pratica.complexTrip} onChange={(v) => update({ complexTrip: v })} labelYes="Sì → basetender" labelNo="No" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <Legend icon={<Boxes size={12} />}>Il carico — peso, numero e dimensioni dei pallet</Legend>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Numero di pallet">
                <NumberInput value={pratica.cargo.pallets} onChange={(v) => updateCargo({ pallets: v })} placeholder="es. 3" min={0} />
              </Field>
              <Field label="Peso totale">
                <NumberInput value={pratica.cargo.totalWeightKg} onChange={(v) => updateCargo({ totalWeightKg: v })} placeholder="es. 800" min={0} suffix="kg" />
              </Field>
              <Field label="Altezza pallet">
                <NumberInput value={pratica.cargo.palletHeightCm} onChange={(v) => updateCargo({ palletHeightCm: v })} placeholder="es. 170" min={0} suffix="cm" />
              </Field>
              <Field label="Lunghezza pallet">
                <NumberInput value={pratica.cargo.palletLCm} onChange={(v) => updateCargo({ palletLCm: v })} placeholder="120" min={0} suffix="cm" />
              </Field>
              <Field label="Larghezza pallet">
                <NumberInput value={pratica.cargo.palletWCm} onChange={(v) => updateCargo({ palletWCm: v })} placeholder="80" min={0} suffix="cm" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <Legend icon={<Truck size={12} />}>Ritiro</Legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Indirizzo di ritiro">
                <TextInput value={pratica.pickup.address} onChange={(v) => updateStop('pickup', { address: v })} placeholder="Via, città" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Merce pronta dalle">
                  <TextInput type="datetime-local" value={pratica.pickup.timeFrom} onChange={(v) => updateStop('pickup', { timeFrom: v })} />
                </Field>
                <Field label="Magazzino aperto fino alle">
                  <TextInput type="datetime-local" value={pratica.pickup.timeTo} onChange={(v) => updateStop('pickup', { timeTo: v })} />
                </Field>
              </div>
              <Field label="Orario di ritiro tassativo?" hint="«Deve partire entro» e «preferibilmente» sono due trasporti diversi, con due prezzi diversi">
                <Segmented checked={pratica.pickup.tassativo} onChange={(v) => updateStop('pickup', { tassativo: v })} labelYes="Tassativo" labelNo="Preferibile" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <Legend icon={<PackageCheck size={12} />}>Consegna</Legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Indirizzo di consegna">
                <TextInput value={pratica.delivery.address} onChange={(v) => updateStop('delivery', { address: v })} placeholder="Via, città" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fascia ricevimento da">
                  <TextInput type="datetime-local" value={pratica.delivery.timeFrom} onChange={(v) => updateStop('delivery', { timeFrom: v })} />
                </Field>
                <Field label="Deve arrivare entro">
                  <TextInput type="datetime-local" value={pratica.delivery.timeTo} onChange={(v) => updateStop('delivery', { timeTo: v })} />
                </Field>
              </div>
              <Field label="Orario di consegna tassativo?" hint="La stessa domanda del ritiro: vale prezzo e scelta del vettore">
                <Segmented checked={pratica.delivery.tassativo} onChange={(v) => updateStop('delivery', { tassativo: v })} labelYes="Tassativo" labelNo="Preferibile" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <Legend icon={<AlertTriangle size={12} />}>Accessori e specifiche</Legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serve la sponda idraulica?" hint="Se a destino non c'è un muletto serve la sponda: esclude il Ducato e riduce la portata del cassonato a 800 kg">
                <Segmented checked={pratica.tailLiftRequired} onChange={(v) => update({ tailLiftRequired: v })} labelYes="Sì, sponda" labelNo="No / muletto" />
              </Field>
              <Field label="Merce pericolosa (ADR)?" hint="Servono vettori abilitati: la pratica va su basetender">
                <Segmented checked={pratica.adr} onChange={(v) => update({ adr: v })} labelYes="Sì, ADR" labelNo="No" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Note sulla pratica">
                <TextInput value={pratica.notes} onChange={(v) => update({ notes: v })} placeholder="Altre specifiche, riferimenti mail/telefono…" />
              </Field>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-wrap items-center gap-2 px-5 py-3.5">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Stato checklist</span>
          {hasCriticalMissing ? <ToneBadge tone="amber">{status.criticalMissing.length} dati critici mancanti</ToneBadge> : <ToneBadge tone="green">Dati critici completi</ToneBadge>}
          {pratica.pickup.tassativo && <ToneBadge tone="brand">Ritiro tassativo</ToneBadge>}
          {pratica.delivery.tassativo && <ToneBadge tone="brand">Consegna tassativa</ToneBadge>}
          {pratica.tailLiftRequired && <ToneBadge tone="red">Sponda richiesta</ToneBadge>}
          {pratica.adr && <ToneBadge tone="red">ADR</ToneBadge>}
        </CardContent>
      </Card>
    </div>
  )
}
