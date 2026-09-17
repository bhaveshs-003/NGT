import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { PHONE_ROOT_ID } from './AppShell'
import { Button, IconButton } from './Button'

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children?: ReactNode
  footer?: ReactNode
  dismissible?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  // Portal target is the phone frame, so the backdrop covers the tab bar and
  // status strip rather than only the content area.
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setHost(document.getElementById(PHONE_ROOT_ID))
  }, [open])

  if (!open) return null

  const sheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-black/70"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[88%] animate-slide-up overflow-hidden rounded-t-2xl border-t border-steel-700 bg-steel-900 shadow-sheet"
      >
        <div className="flex items-start gap-3 border-b border-steel-800 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold leading-tight text-steel-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] leading-snug text-steel-400">{subtitle}</p>}
          </div>
          {dismissible && (
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X size={20} />
            </IconButton>
          )}
        </div>
        <div className="app-scroll max-h-[58vh] overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="border-t border-steel-800 bg-steel-850 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return host ? createPortal(sheet, host) : sheet
}

export function ConfirmSheet({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  children,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  children?: ReactNode
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" block onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} block onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-[13px] leading-relaxed text-steel-300">{body}</p>
      {children}
    </Sheet>
  )
}
