import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IconButton } from './Button'

export function ScreenHeader({
  title,
  subtitle,
  back,
  onBack,
  right,
  sticky = true,
}: {
  title: string
  subtitle?: string
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  sticky?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header
      className={`${sticky ? 'sticky top-0 z-20' : ''} flex items-center gap-1 border-b border-steel-800 bg-steel-900/95 px-2 py-2 backdrop-blur`}
    >
      {back && (
        <IconButton label="Back" onClick={onBack ?? (() => navigate(-1))}>
          <ChevronLeft size={22} />
        </IconButton>
      )}
      <div className={`min-w-0 flex-1 ${back ? '' : 'pl-2'}`}>
        <h1 className="truncate text-[16px] font-bold leading-tight text-steel-100">{title}</h1>
        {subtitle && <p className="truncate text-[12px] leading-tight text-steel-400">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-0.5 pr-1">{right}</div>}
    </header>
  )
}

export function Screen({
  header,
  children,
  footer,
  padded = true,
  className = '',
}: {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  padded?: boolean
  className?: string
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      <div className={`app-scroll min-h-0 flex-1 overflow-y-auto ${padded ? 'px-4 py-4' : ''} ${className}`}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-steel-800 bg-steel-900 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </div>
  )
}

export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title && <h2 className="field-label">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Card({
  children,
  className = '',
  onClick,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'button'
}) {
  const cls = `rounded-xl border border-steel-800 bg-steel-900 ${onClick ? 'text-left transition-colors hover:border-steel-600 active:bg-steel-850' : ''} ${className}`
  if (as === 'button' || onClick) {
    return (
      <button type="button" onClick={onClick} className={`w-full ${cls}`}>
        {children}
      </button>
    )
  }
  return <div className={cls}>{children}</div>
}

export function DataRow({
  label,
  value,
  sub,
  right,
  className = '',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2.5 ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="field-label">{label}</p>
        <p className="mt-0.5 text-[14px] font-semibold leading-snug text-steel-100">{value}</p>
        {sub && <div className="mt-0.5">{sub}</div>}
      </div>
      {right && <div className="shrink-0 pt-4">{right}</div>}
    </div>
  )
}
