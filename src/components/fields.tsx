import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { inputValue } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  step = 1,
  suffix,
}: {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  min?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        className={cn('tnum', suffix && 'pr-11')}
        value={inputValue(value)}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      )}
    </div>
  )
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Segmented({
  checked,
  onChange,
  labelYes = 'Sì',
  labelNo = 'No',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  labelYes?: string
  labelNo?: string
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      className="w-full justify-stretch"
      value={checked ? 'yes' : 'no'}
      onValueChange={(v) => {
        if (v === 'yes') onChange(true)
        else if (v === 'no') onChange(false)
      }}
    >
      <ToggleGroupItem value="no" className="flex-1 text-xs">
        {labelNo}
      </ToggleGroupItem>
      <ToggleGroupItem value="yes" className="flex-1 text-xs data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:border-brand">
        {labelYes}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

type Tone = 'green' | 'amber' | 'red' | 'brand' | 'slate'

const toneClasses: Record<Tone, string> = {
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  red: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  brand: 'border-brand/30 bg-brand/10 text-brand',
  slate: 'border-border bg-muted text-muted-foreground',
}

export function ToneBadge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1 text-[11px] font-semibold', toneClasses[tone], className)}>
      {children}
    </Badge>
  )
}

export function SectionHeader({ icon, title, subtitle, right }: { icon?: ReactNode; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0 text-brand">{icon}</div>}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
