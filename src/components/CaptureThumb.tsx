import { AlertTriangle } from 'lucide-react'
import type { Capture } from '@/types'
import { svgToDataUri } from '@/data/images'

export function CaptureThumb({
  capture,
  size = 'md',
  onClick,
  showLabel = true,
}: {
  capture: Capture
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showLabel?: boolean
}) {
  const dims = { sm: 'h-14 w-[74px]', md: 'h-[68px] w-[92px]', lg: 'h-[120px] w-full' }[size]
  const body = (
    <>
      <img
        src={svgToDataUri(capture.svg)}
        alt={`${capture.label} capture`}
        className={`${dims} rounded-lg border object-cover ${capture.quality.passed ? 'border-steel-700' : 'border-conf-low/60'}`}
        draggable={false}
      />
      {!capture.quality.passed && (
        <span className="absolute right-1 top-1 rounded bg-conf-low px-1 py-[1px] text-[9px] font-bold text-white">
          <AlertTriangle size={9} className="inline" />
        </span>
      )}
      {showLabel && (
        <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-wide text-steel-400">
          {capture.label}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="relative block text-left">
        {body}
      </button>
    )
  }
  return <div className="relative">{body}</div>
}

export function CaptureStrip({ captures, onSelect }: { captures: Capture[]; onSelect?: (c: Capture) => void }) {
  if (!captures.length) return null
  return (
    <div className="app-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {captures.map((c) => (
        <div key={c.id} className="shrink-0">
          <CaptureThumb capture={c} onClick={onSelect ? () => onSelect(c) : undefined} />
        </div>
      ))}
    </div>
  )
}
