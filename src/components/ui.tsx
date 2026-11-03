import { ReactNode } from 'react'
import { inputValue } from '../lib/format'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ icon, title, subtitle, right }: { icon?: ReactNode; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-snug text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40'

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function NumberInput({ value, onChange, placeholder, min, step = 1, suffix }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; min?: number; step?: number; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        className={`${inputCls} tnum ${suffix ? 'pr-12' : ''}`}
        value={inputValue(value)}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
    </div>
  )
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange, labelYes = 'Sì', labelNo = 'No' }: { checked: boolean; onChange: (v: boolean) => void; labelYes?: string; labelNo?: string }) {
  return (
    <div className="flex w-full rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 truncate rounded-md px-2 py-1.5 text-xs font-medium transition ${!checked ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
      >
        {labelNo}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 truncate rounded-md px-2 py-1.5 text-xs font-medium transition ${checked ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
      >
        {labelYes}
      </button>
    </div>
  )
}

export function Badge({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'indigo' | 'slate'; children: ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
    red: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]}`}>{children}</span>
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger' | 'soft'; className?: string; disabled?: boolean }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm',
    soft: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
    ghost: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:hover:bg-rose-950/40',
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
