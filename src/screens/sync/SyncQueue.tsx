import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CloudOff, GitCompareArrows, Loader2, RefreshCw, Trash2, Upload, Wifi } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Callout, EmptyState, ProgressBar } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet, Sheet } from '@/components/Sheet'
import { dateTime, relative } from '@/lib/format'
import { drainQueue, type ConflictChoice, type DrainHandle } from '@/services/mock/sync'
import { useApp } from '@/store/useApp'
import type { SyncQueueItem } from '@/types'

export function SyncQueue() {
  const navigate = useNavigate()
  const queue = useApp((s) => s.syncQueue)
  const offline = useApp((s) => s.settings.offlineMode)
  const setSettings = useApp((s) => s.setSettings)
  const removeQueueItem = useApp((s) => s.removeQueueItem)
  const clearQueue = useApp((s) => s.clearQueue)
  const toast = useApp((s) => s.toast)

  const [draining, setDraining] = useState(false)
  const [conflict, setConflict] = useState<SyncQueueItem | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const resolverRef = useRef<((c: ConflictChoice) => void) | null>(null)
  const handleRef = useRef<DrainHandle | null>(null)

  useEffect(() => () => handleRef.current?.cancel(), [])

  const pending = queue.filter((i) => i.state !== 'done')
  const done = queue.filter((i) => i.state === 'done')

  function startDrain() {
    if (offline) {
      toast({ tone: 'error', title: 'Still offline', body: 'Switch the connection back on before draining the queue.' })
      return
    }
    setDraining(true)
    handleRef.current = drainQueue({
      onConflict: (item) =>
        new Promise<ConflictChoice>((resolve) => {
          setConflict(item)
          resolverRef.current = (c) => {
            setConflict(null)
            resolverRef.current = null
            resolve(c)
          }
        }),
      onItemDone: () => {},
    })
    // The drain resolves item by item; watch for completion.
    const poll = window.setInterval(() => {
      const left = useApp.getState().syncQueue.filter((i) => i.state !== 'done').length
      const stillSyncing = useApp.getState().syncQueue.some((i) => i.state === 'syncing' || i.state === 'conflict')
      if (!stillSyncing && (left === 0 || useApp.getState().settings.offlineMode)) {
        window.clearInterval(poll)
        setDraining(false)
        if (left === 0) toast({ tone: 'success', title: 'Queue drained', body: 'All held items have reached the server.' })
      }
    }, 400)
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Sync queue"
          subtitle={`${pending.length} pending · ${done.length} sent`}
          back
          onBack={() => navigate(-1)}
        />
      }
      footer={
        pending.length > 0 ? (
          <div className="space-y-2">
            <Button block loading={draining} icon={<Upload size={18} />} onClick={startDrain} disabled={offline}>
              {offline ? 'Waiting for coverage' : `Send ${pending.length} item${pending.length === 1 ? '' : 's'}`}
            </Button>
            {offline && (
              <Button block variant="ghost" size="md" icon={<Wifi size={16} />} onClick={() => setSettings({ offlineMode: false })}>
                Restore coverage (demo)
              </Button>
            )}
          </div>
        ) : done.length > 0 ? (
          <Button block variant="ghost" icon={<Trash2 size={16} />} onClick={() => setClearOpen(true)}>
            Clear sent items
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Callout tone={offline ? 'critical' : 'success'} icon={offline ? <CloudOff size={16} /> : <Wifi size={16} />} title={offline ? 'No terminal coverage' : 'Connected'}>
          {offline
            ? 'Captures, overrides and verification stamps are held on this device and pushed in order once coverage returns.'
            : 'The device is on the terminal network. Held items can be sent now.'}
        </Callout>

        {queue.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title="Nothing waiting"
            body="Everything captured on this device has reached the server. Items appear here when you work without coverage."
          />
        ) : (
          <>
            {pending.length > 0 && (
              <Section title={`Pending (${pending.length})`}>
                <div className="space-y-2.5">
                  {pending.map((i) => (
                    <QueueRow key={i.id} item={i} onRemove={() => removeQueueItem(i.id)} />
                  ))}
                </div>
              </Section>
            )}
            {done.length > 0 && (
              <Section title={`Sent (${done.length})`}>
                <div className="space-y-2.5">
                  {done.map((i) => (
                    <QueueRow key={i.id} item={i} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>

      <ConflictSheet item={conflict} onResolve={(c) => resolverRef.current?.(c)} />

      <ConfirmSheet
        open={clearOpen}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          clearQueue()
          setClearOpen(false)
          toast({ tone: 'success', title: 'Queue cleared' })
        }}
        title="Clear sent items?"
        body="Removes the sent entries from this list. The records themselves are not affected."
        confirmLabel="Clear"
        destructive
      />
    </Screen>
  )
}

function QueueRow({ item, onRemove }: { item: SyncQueueItem; onRemove?: () => void }) {
  const tone =
    item.state === 'done' ? 'green' : item.state === 'conflict' ? 'red' : item.state === 'syncing' ? 'blue' : 'neutral'
  const label =
    item.state === 'done' ? 'Sent' : item.state === 'conflict' ? 'Conflict' : item.state === 'syncing' ? 'Sending' : 'Queued'

  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {item.state === 'syncing' ? (
            <Loader2 size={16} className="animate-spin text-sky-400" />
          ) : item.state === 'done' ? (
            <CheckCircle2 size={16} className="text-conf-high" />
          ) : item.state === 'conflict' ? (
            <GitCompareArrows size={16} className="text-conf-low" />
          ) : (
            <RefreshCw size={16} className="text-steel-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug text-steel-100">{item.label}</p>
          <p className="mt-0.5 text-[11.5px] text-steel-500">
            {(item.sizeKb / 1024).toFixed(1)} MB · queued {relative(item.queuedAt)}
          </p>
          {(item.state === 'syncing' || item.state === 'conflict') && (
            <div className="mt-2">
              <ProgressBar value={item.progress} height="h-1.5" tone={item.state === 'conflict' ? 'red' : 'blue'} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={tone}>{label}</Badge>
          {onRemove && item.state === 'queued' && (
            <button onClick={onRemove} aria-label="Remove from queue" className="text-steel-500 hover:text-conf-low">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function ConflictSheet({ item, onResolve }: { item: SyncQueueItem | null; onResolve: (c: ConflictChoice) => void }) {
  if (!item?.conflict) return null
  const c = item.conflict
  return (
    <Sheet
      open
      onClose={() => onResolve('keep-local')}
      dismissible={false}
      title="Sync conflict"
      subtitle={`${item.label} — the server value changed while this device was offline`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={() => onResolve('keep-server')}>
            Keep server
          </Button>
          <Button block onClick={() => onResolve('keep-local')}>
            Keep mine
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Callout tone="caution" title={`${c.field} differs`}>
          {c.serverActor} changed this field on the server at {dateTime(c.serverAt)}, while your device held an offline
          override for the same field. Choose which value survives — the other is recorded on the audit trail.
        </Callout>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-amber-500/45 bg-amber-500/[0.07] p-3">
            <p className="field-label">On this device</p>
            <p className="tabular mt-1 text-[16px] font-bold text-amber-500">{c.localValue}</p>
            <p className="mt-1 text-[11px] text-steel-400">Your offline override</p>
          </div>
          <div className="rounded-xl border border-steel-700 bg-steel-850 p-3">
            <p className="field-label">On the server</p>
            <p className="tabular mt-1 text-[16px] font-bold text-steel-100">{c.serverValue}</p>
            <p className="mt-1 text-[11px] text-steel-400">{c.serverActor}</p>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
