import { useEffect } from 'react'
import { AlertTriangle, Bell, CheckCircle2, Info, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'

const TONES = {
  info: { cls: 'border-sky-500/40 bg-steel-850', icon: <Info size={17} className="text-sky-400" /> },
  success: { cls: 'border-conf-high/40 bg-steel-850', icon: <CheckCircle2 size={17} className="text-conf-high" /> },
  warn: { cls: 'border-amber-500/50 bg-steel-850', icon: <Bell size={17} className="text-amber-500" /> },
  error: { cls: 'border-conf-low/50 bg-steel-850', icon: <AlertTriangle size={17} className="text-conf-low" /> },
}

export function ToastHost() {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismissToast)
  const navigate = useNavigate()

  useEffect(() => {
    const timers = toasts
      .filter((t) => !t.sticky)
      .map((t) => setTimeout(() => dismiss(t.id), 5200))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismiss])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex flex-col gap-2 px-3 pt-3">
      {toasts.map((t) => {
        const tone = TONES[t.tone]
        return (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in rounded-xl border px-3 py-2.5 shadow-frame ${tone.cls}`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-[1px] shrink-0">{tone.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-snug text-steel-100">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[12px] leading-snug text-steel-300">{t.body}</p>}
                {t.deepLink && (
                  <button
                    className="mt-2 text-[12px] font-bold uppercase tracking-wide text-amber-500"
                    onClick={() => {
                      dismiss(t.id)
                      navigate(t.deepLink!)
                    }}
                  >
                    Open record →
                  </button>
                )}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="-mr-1 -mt-1 shrink-0 rounded p-1 text-steel-500 hover:text-steel-200"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
