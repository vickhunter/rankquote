import { AlertTriangle, Boxes, ClipboardCheck, MapPin, PackageCheck, Truck } from 'lucide-react'
import type { Cargo, Pratica, StopInfo, Urgency } from '../lib/types'
import { checklistStatus } from '../lib/engine/checklist'
import { Badge, Card, Field, NumberInput, SectionHeader, Select, TextInput, Toggle } from './ui'

interface Props {
  pratica: Pratica
  update: (patch: Partial<Pratica>) => void
  updateCargo: (patch: Partial<Cargo>) => void
  updateStop: (stop: 'pickup' | 'delivery', patch: Partial<StopInfo>) => void
}

export default function ChecklistPanel({ pratica, update, updateCargo, updateStop }: Props) {
  const status = checklistStatus(pratica)

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          icon={<ClipboardCheck size={18} />}
          title="Checklist informazioni cliente"
          subtitle="Chiedi tutto insieme, in un'unica risposta: senza questi dati non si può quotare nulla"
          right={
            <div className="flex items-center gap-2">
              <span className="tnum text-xs font-semibold text-slate-500">
                {status.done}/{status.total}
              </span>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${status.criticalMissing.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${status.pct}%` }}
                />
              </div>
            </div>
          }
        />
        {status.missing.length > 0 && (
          <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Da chiedere ancora:{' '}
              {status.missing.map((m) => (
                <span key={m.key} className="font-semibold">
                  {m.label}
                  {m !== status.missing[status.missing.length - 1] ? ', ' : ''}
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="space-y-5 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Azienda cliente">
              <TextInput value={pratica.clientCompany} onChange={(v) => update({ clientCompany: v })} placeholder="es. Rossi Manufacturing Srl" />
            </Field>
            <Field label="Referente / contatto">
              <TextInput value={pratica.clientContact} onChange={(v) => update({ clientContact: v })} placeholder="Nome, telefono o email" />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <MapPin size={12} /> Il viaggio
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Luogo di ritiro">
                <TextInput value={pratica.origin} onChange={(v) => update({ origin: v })} placeholder="es. Padova" />
              </Field>
              <Field label="Luogo di consegna">
                <TextInput value={pratica.destination} onChange={(v) => update({ destination: v })} placeholder="es. Firenze" />
              </Field>
              <Field label="Tratta">
                <Select
                  value={pratica.domestic ? 'nazionale' : 'estero'}
                  onChange={(v) => update({ domestic: v === 'nazionale' })}
                  options={[
                    { value: 'nazionale', label: 'Nazionale' },
                    { value: 'estero', label: 'Estero → basetender' },
                  ]}
                />
              </Field>
              <Field label="Urgenza percepita dal cliente">
                <Select
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
                <Toggle checked={pratica.complexTrip} onChange={(v) => update({ complexTrip: v })} labelYes="Sì → basetender" labelNo="No" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Boxes size={12} /> Il carico — peso, numero e dimensioni dei pallet
            </legend>
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
            <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Truck size={12} /> Ritiro
            </legend>
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
                <Toggle checked={pratica.pickup.tassativo} onChange={(v) => updateStop('pickup', { tassativo: v })} labelYes="Tassativo" labelNo="Preferibile" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <PackageCheck size={12} /> Consegna
            </legend>
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
                <Toggle checked={pratica.delivery.tassativo} onChange={(v) => updateStop('delivery', { tassativo: v })} labelYes="Tassativo" labelNo="Preferibile" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <AlertTriangle size={12} /> Accessori e specifiche
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serve la sponda idraulica?" hint="Se a destino non c'è un muletto serve la sponda: esclude il Ducato e riduce la portata del cassonato a 800 kg">
                <Toggle checked={pratica.tailLiftRequired} onChange={(v) => update({ tailLiftRequired: v })} labelYes="Sì, sponda" labelNo="No / muletto presente" />
              </Field>
              <Field label="Merce pericolosa (ADR)?" hint="Servono vettori abilitati: la pratica va su basetender">
                <Toggle checked={pratica.adr} onChange={(v) => update({ adr: v })} labelYes="Sì, ADR" labelNo="No" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Note sulla pratica">
                <TextInput value={pratica.notes} onChange={(v) => update({ notes: v })} placeholder="Altre specifiche, riferimenti mail/telefono…" />
              </Field>
            </div>
          </fieldset>
        </div>
      </Card>

      <Card className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stato checklist</span>
          {status.criticalMissing.length > 0 ? (
            <Badge tone="amber">{status.criticalMissing.length} dati critici mancanti</Badge>
          ) : (
            <Badge tone="green">Dati critici completi</Badge>
          )}
          {pratica.pickup.tassativo && <Badge tone="indigo">Ritiro tassativo</Badge>}
          {pratica.delivery.tassativo && <Badge tone="indigo">Consegna tassativa</Badge>}
          {pratica.tailLiftRequired && <Badge tone="red">Sponda richiesta</Badge>}
          {pratica.adr && <Badge tone="red">ADR</Badge>}
        </div>
      </Card>
    </div>
  )
}
