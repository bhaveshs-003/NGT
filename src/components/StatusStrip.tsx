import { CloudOff, RefreshCw, SignalHigh } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { pendingSyncCount, useApp } from '@/store/useApp'

export function StatusStrip() {
  const offline = useApp((s) => s.settings.offlineMode)
  const queue = useApp((s) => s.syncQueue)
  const syncing = queue.some((i) => i.state === 'syncing')
  const pending = pendingSyncCount(queue)
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/sync')}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        offline ? 'bg-conf-low/20 text-red-200' : 'bg-steel-850 text-steel-400'
      }`}
    >
      {offline ? <CloudOff size={13} /> : <SignalHigh size={13} className="text-conf-high" />}
      <span>{offline ? 'Offline — captures held on device' : 'Online · Riverside Quay'}</span>
      <span className="ml-auto flex items-center gap-1.5">
        {syncing && <RefreshCw size={12} className="animate-spin text-amber-500" />}
        {pending > 0 && (
          <span
            className={`tabular rounded px-1.5 py-[1px] text-[10px] font-bold ${
              offline ? 'bg-conf-low/30 text-red-100' : 'bg-amber-500 text-steel-950'
            }`}
          >
            {pending} pending
          </span>
        )}
        {pending === 0 && !offline && <span className="text-[10px] font-medium text-steel-500">All synced</span>}
      </span>
    </button>
  )
}
