import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export function ProgressBar({
  value,
  tone = 'amber',
  height = 'h-2',
  striped,
  label,
}: {
  value: number
  tone?: 'amber' | 'green' | 'red' | 'blue'
  height?: string
  striped?: boolean
  label?: string
}) {
  const tones = {
    amber: 'bg-amber-500',
    green: 'bg-conf-high',
    red: 'bg-conf-low',
    blue: 'bg-sky-500',
  }
  return (
    <div className="w-full">
      <div className={`w-full overflow-hidden rounded-full bg-steel-800 ${height}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${tones[tone]} ${striped ? 'hazard-stripe' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-steel-800 bg-steel-900 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-steel-700 bg-steel-850 text-steel-500">
        {icon ?? <Inbox size={24} />}
      </div>
      <h3 className="text-[15px] font-bold text-steel-200">{title}</h3>
      <p className="mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-steel-400">{body}</p>
      {actionLabel && onAction && (
        <Button size="md" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string
  body: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-conf-low/40 bg-conf-low/10 text-conf-low">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-[15px] font-bold text-steel-200">{title}</h3>
      <p className="mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-steel-400">{body}</p>
      {onRetry && (
        <Button size="md" variant="secondary" className="mt-5" icon={<RefreshCw size={16} />} onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export function Callout({
  tone = 'info',
  title,
  children,
  icon,
}: {
  tone?: 'info' | 'caution' | 'critical' | 'success'
  title?: string
  children: ReactNode
  icon?: ReactNode
}) {
  const tones = {
    info: 'border-sky-500/30 bg-sky-500/[0.07] text-sky-200',
    caution: 'border-amber-500/35 bg-amber-500/[0.08] text-amber-200',
    critical: 'border-conf-low/40 bg-conf-low/[0.08] text-red-200',
    success: 'border-conf-high/35 bg-conf-high/[0.08] text-green-200',
  }
  return (
    <div className={`rounded-xl border px-3.5 py-3 ${tones[tone]}`}>
      <div className="flex gap-2.5">
        {icon && <div className="mt-[1px] shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          {title && <p className="text-[13px] font-bold leading-snug">{title}</p>}
          <div className={`text-[12.5px] leading-relaxed ${title ? 'mt-1 opacity-90' : ''}`}>{children}</div>
        </div>
      </div>
    </div>
  )
}
