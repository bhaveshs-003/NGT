import { CloudOff, Download, Wifi } from 'lucide-react'
import { useApp } from '@/store/useApp'
import { Button } from './Button'

/**
 * Floating connectivity toggle. Real builds detect this from the OS; here it
 * is a deliberate demo control so the offline queue can be shown on demand.
 */
export function OfflineFab() {
  const offline = useApp((s) => s.settings.offlineMode)
  const setSettings = useApp((s) => s.setSettings)
  const toast = useApp((s) => s.toast)

  return (
    <button
      type="button"
      aria-label={offline ? 'Simulate coverage returning' : 'Simulate loss of coverage'}
      onClick={() => {
        const next = !offline
        setSettings({ offlineMode: next })
        toast({
          tone: next ? 'warn' : 'success',
          title: next ? 'Coverage lost' : 'Coverage restored',
          body: next
            ? 'Captures and edits will be held in the device queue.'
            : 'Open the sync queue to send held items.',
        })
      }}
      // Anchored to the left edge, clear of headers, footer buttons and the
      // tab bar so it never sits on top of a control during a walkthrough.
      className={`absolute left-0 top-1/2 z-30 flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-r-xl border border-l-0 shadow-frame transition-colors ${
        offline
          ? 'border-conf-low/60 bg-conf-low text-white'
          : 'border-steel-600 bg-steel-800/90 text-steel-300 hover:text-steel-100'
      }`}
      title={offline ? 'Offline (demo) — tap to go online' : 'Online (demo) — tap to go offline'}
    >
      {offline ? <CloudOff size={18} /> : <Wifi size={18} />}
    </button>
  )
}

/** Minimum-version gate. Blocks the whole app until the demo toggle is off. */
export function ForceUpdateGate() {
  const force = useApp((s) => s.settings.forceUpdate)
  const setSettings = useApp((s) => s.setSettings)
  if (!force) return null

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-steel-950/97 px-7 text-center">
      <div className="hazard-stripe absolute inset-x-0 top-0 h-2" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-500">
        <Download size={28} />
      </div>
      <h2 className="text-[19px] font-bold text-steel-100">Update required</h2>
      <p className="mt-2 max-w-[32ch] text-[13.5px] leading-relaxed text-steel-400">
        This device is running version 1.4.0. Terminal policy requires 1.6.0 or later before any assessment can be
        submitted, following the revised rigging registry issued in safety bulletin 2026-14.
      </p>
      <div className="mt-6 w-full max-w-[280px] space-y-2">
        <Button block onClick={() => window.open('https://example.invalid', '_self')} disabled>
          Update from the app store
        </Button>
        <Button block variant="ghost" onClick={() => setSettings({ forceUpdate: false })}>
          Dismiss (demo toggle)
        </Button>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-wider text-steel-600">Demo control — Settings › Force update</p>
    </div>
  )
}
