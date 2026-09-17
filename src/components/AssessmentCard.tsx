import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Assessment } from '@/types'
import { svgToDataUri } from '@/data/images'
import { overallConfidence } from '@/lib/confidence'
import { kg, relative } from '@/lib/format'
import { useApp } from '@/store/useApp'
import { ConfidenceBadge, StatusPill } from './Badge'

export function AssessmentCard({ assessment: a, href }: { assessment: Assessment; href?: string }) {
  const navigate = useNavigate()
  const threshold = useApp((s) => s.settings.confidenceThreshold)
  const thumb = a.captures[0]
  const conf = overallConfidence(a)

  const target =
    href ??
    (a.status === 'processing'
      ? `/processing/${a.id}`
      : a.status === 'failed'
        ? `/processing/${a.id}`
        : `/assessment/${a.id}`)

  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="flex w-full items-center gap-3 rounded-xl border border-steel-800 bg-steel-900 p-3 text-left transition-colors hover:border-steel-600 active:bg-steel-850"
    >
      {thumb ? (
        <img
          src={svgToDataUri(thumb.svg)}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg border border-steel-700 object-cover"
          draggable={false}
        />
      ) : (
        <div className="h-14 w-14 shrink-0 rounded-lg border border-steel-700 bg-steel-850" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-[11px] font-semibold text-steel-400">{a.ref}</span>
          {a.version > 1 && (
            <span className="shrink-0 rounded bg-steel-800 px-1 text-[10px] font-bold text-steel-400">v{a.version}</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[14px] font-semibold leading-snug text-steel-100">{a.cargoType.value}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill status={a.status} />
          {conf > 0 && <ConfidenceBadge confidence={conf} threshold={threshold} showLabel={false} />}
          {a.weightKg.value > 0 && (
            <span className="tabular text-[11px] font-medium text-steel-400">{kg(a.weightKg.value)}</span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-steel-500">{relative(a.updatedAt)}</p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-steel-600" />
    </button>
  )
}
