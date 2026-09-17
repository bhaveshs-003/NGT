import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Check, ChevronDown } from 'lucide-react'

const BASE =
  'w-full rounded-xl border bg-steel-850 px-3.5 text-[15px] text-steel-100 placeholder:text-steel-500 transition-colors disabled:bg-steel-900 disabled:text-steel-500'

export function TextField({
  label,
  hint,
  error,
  suffix,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string; suffix?: string }) {
  return (
    <label className="block">
      {label && <span className="field-label mb-1.5 block">{label}</span>}
      <div className="relative">
        <input
          {...rest}
          className={`${BASE} min-h-[50px] ${suffix ? 'pr-14' : ''} ${error ? 'border-conf-low' : 'border-steel-700 focus:border-amber-500'} ${className}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-steel-400">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <span className="mt-1.5 block text-[12px] font-medium text-conf-low">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-snug text-steel-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function TextArea({
  label,
  hint,
  error,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="field-label mb-1.5 block">{label}</span>}
      <textarea
        {...rest}
        className={`${BASE} min-h-[96px] resize-none py-3 leading-relaxed ${error ? 'border-conf-low' : 'border-steel-700 focus:border-amber-500'} ${className}`}
      />
      {error ? (
        <span className="mt-1.5 block text-[12px] font-medium text-conf-low">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-snug text-steel-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function Select({
  label,
  hint,
  error,
  children,
  className = '',
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="field-label mb-1.5 block">{label}</span>}
      <div className="relative">
        <select
          {...rest}
          className={`${BASE} min-h-[50px] appearance-none pr-10 ${error ? 'border-conf-low' : 'border-steel-700 focus:border-amber-500'} ${className}`}
        >
          {children}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-400"
        />
      </div>
      {error ? (
        <span className="mt-1.5 block text-[12px] font-medium text-conf-low">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-snug text-steel-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = 'amber',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  tone?: 'amber' | 'red'
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 py-3 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-steel-100">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-snug text-steel-400">{description}</span>}
      </span>
      <span
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? (tone === 'red' ? 'bg-conf-low' : 'bg-amber-500') : 'bg-steel-700'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? 'left-6' : 'left-1'}`}
        />
      </span>
    </button>
  )
}

export function RadioRow({
  selected,
  onSelect,
  title,
  description,
  right,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  right?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full min-h-[52px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        selected ? 'border-amber-500 bg-amber-500/[0.08]' : 'border-steel-700 bg-steel-850 hover:border-steel-600'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-amber-500 bg-amber-500 text-steel-950' : 'border-steel-600'}`}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold leading-snug text-steel-100">{title}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-snug text-steel-400">{description}</span>}
      </span>
      {right}
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  hint?: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="field-label">{label}</span>
        <span className="tabular text-[15px] font-bold text-amber-500">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-amber-500"
        aria-label={label}
      />
      {hint && <p className="mt-1 text-[12px] leading-snug text-steel-500">{hint}</p>}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 rounded-xl border border-steel-700 bg-steel-850 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[40px] flex-1 rounded-lg px-2 text-[12.5px] font-semibold transition-colors ${
            value === o.value ? 'bg-amber-500 text-steel-950' : 'text-steel-300 hover:bg-steel-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
