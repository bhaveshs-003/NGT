import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleSlash, Lock, PenLine, Radio, Upload, XCircle } from 'lucide-react'
import type { AssessmentStatus, Field, FieldSource } from '@/types'
import { SOURCE_SHORT, TIER_CLASSES, tier, uncertaintyRange } from '@/lib/confidence'

export function Badge({
  children,
  tone = 'neutral',
  icon,
  className = '',
}: {
  children: ReactNode
  tone?: 'neutral' | 'amber' | 'green' | 'red' | 'blue'
  icon?: ReactNode
  className?: string
}) {
  const tones = {
    neutral: 'bg-steel-800 text-steel-300 border-steel-700',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    green: 'bg-conf-high/12 text-conf-high border-conf-high/40',
    red: 'bg-conf-low/12 text-conf-low border-conf-low/40',
    blue: 'bg-sky-500/12 text-sky-400 border-sky-500/40',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}

const STATUS_META: Record<
  AssessmentStatus,
  { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'blue'; icon: ReactNode }
> = {
  'queued-offline': { label: 'Queued offline', tone: 'neutral', icon: <Radio size={12} /> },
  uploading: { label: 'Uploading', tone: 'blue', icon: <Upload size={12} /> },
  processing: { label: 'Processing', tone: 'blue', icon: <Radio size={12} className="animate-pulse" /> },
  completed: { label: 'Estimated', tone: 'amber', icon: <CheckCircle2 size={12} /> },
  overridden: { label: 'Overridden', tone: 'amber', icon: <PenLine size={12} /> },
  verified: { label: 'Verified', tone: 'green', icon: <Lock size={12} /> },
  failed: { label: 'Failed', tone: 'red', icon: <XCircle size={12} /> },
}

export function StatusPill({ status, className = '' }: { status: AssessmentStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <Badge tone={m.tone} icon={m.icon} className={className}>
      {m.label}
    </Badge>
  )
}

/** Estimated ⇄ Verified pill used at the head of the result screen. */
export function EstimatedVerifiedPill({ status }: { status: AssessmentStatus }) {
  const verified = status === 'verified'
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-steel-700 text-[11px] font-bold uppercase tracking-wider">
      <span className={`px-2.5 py-1.5 ${!verified ? 'bg-amber-500 text-steel-950' : 'bg-steel-850 text-steel-500'}`}>
        Estimated
      </span>
      <span className={`px-2.5 py-1.5 ${verified ? 'bg-conf-high text-steel-950' : 'bg-steel-850 text-steel-500'}`}>
        Verified
      </span>
    </div>
  )
}

export function ConfidenceBadge({
  confidence,
  threshold,
  size = 'md',
  showLabel = true,
}: {
  confidence: number
  threshold: number
  size?: 'md' | 'sm'
  showLabel?: boolean
}) {
  const t = tier(confidence, threshold)
  const c = TIER_CLASSES[t]
  if (confidence <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-steel-700 bg-steel-800 px-1.5 py-[2px] text-[11px] font-semibold text-steel-500">
        <CircleSlash size={11} /> —
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-[2px] font-bold tabular ${c.bg} ${c.border} ${c.text} ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'}`}
      title={`Confidence ${confidence} of 100 (threshold ${threshold})`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {confidence}
      {showLabel && <span className="font-medium opacity-70">/100</span>}
      {t === 'low' && <AlertTriangle size={11} />}
    </span>
  )
}

export function SourceBadge({ source }: { source: FieldSource }) {
  const tone =
    source === 'manual' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 'bg-steel-800 text-steel-400 border-steel-700'
  return (
    <span className={`rounded border px-1.5 py-[2px] font-mono text-[10px] font-semibold tracking-wide ${tone}`}>
      {SOURCE_SHORT[source]}
    </span>
  )
}

export function UncertaintyNote({ field }: { field: Field<string | number> }) {
  const range = uncertaintyRange(field)
  if (!range) return null
  return <span className="tabular text-[11px] text-steel-500">± {field.uncertainty?.toLocaleString('en-GB')} · {range}</span>
}
