// ---------------------------------------------------------------------------
// Offline queue drain.
//
// Items leave the device one at a time with visible progress. Any item
// carrying a seeded conflict stops the drain and hands control back to the UI
// so the operator can choose which value survives.
// ---------------------------------------------------------------------------

import { useApp } from '@/store/useApp'
import type { SyncQueueItem } from '@/types'
import { sleep } from './client'

export type ConflictChoice = 'keep-local' | 'keep-server'

export interface DrainCallbacks {
  onItemStart?: (item: SyncQueueItem) => void
  onConflict: (item: SyncQueueItem) => Promise<ConflictChoice>
  onItemDone?: (item: SyncQueueItem) => void
}

export interface DrainHandle {
  cancel: () => void
}

export function drainQueue(cb: DrainCallbacks): DrainHandle {
  let cancelled = false

  const run = async () => {
    const store = useApp.getState()

    for (const seed of store.syncQueue.filter((i) => i.state !== 'done')) {
      if (cancelled) return
      const item = useApp.getState().syncQueue.find((i) => i.id === seed.id)
      if (!item) continue

      cb.onItemStart?.(item)
      useApp.getState().updateQueueItem(item.id, { state: 'syncing', progress: 0 })

      for (let p = 0; p <= 100; p += 10) {
        if (cancelled) return
        // Coverage lost again mid-drain: stop and leave the rest queued.
        if (useApp.getState().settings.offlineMode) {
          useApp.getState().updateQueueItem(item.id, { state: 'queued', progress: 0 })
          return
        }
        useApp.getState().updateQueueItem(item.id, { progress: p })
        await sleep(110)
      }

      if (item.conflict) {
        useApp.getState().updateQueueItem(item.id, { state: 'conflict', progress: 100 })
        const choice = await cb.onConflict(item)
        if (cancelled) return
        if (choice === 'keep-server') {
          // Server value wins: roll the local override back on the record.
          const a = useApp.getState().assessments.find((x) => x.id === item.assessmentId)
          if (a) {
            useApp.getState().appendAudit(a.id, {
              at: new Date().toISOString(),
              actorId: 'usr-002',
              actorName: item.conflict.serverActor,
              action: 'Sync conflict resolved — server value kept',
              field: item.conflict.field,
              from: item.conflict.localValue,
              to: item.conflict.serverValue,
              detail: 'Local override discarded during queue drain.',
            })
          }
        } else {
          const a = useApp.getState().assessments.find((x) => x.id === item.assessmentId)
          if (a) {
            useApp.getState().appendAudit(a.id, {
              at: new Date().toISOString(),
              actorId: useApp.getState().authUser?.id ?? 'usr-001',
              actorName: useApp.getState().authUser?.name ?? 'Daniel Okafor',
              action: 'Sync conflict resolved — device value kept',
              field: item.conflict.field,
              from: item.conflict.serverValue,
              to: item.conflict.localValue,
              detail: 'Device override pushed over the server value.',
            })
          }
        }
      }

      useApp.getState().updateQueueItem(item.id, { state: 'done', progress: 100 })

      // An upload that has landed flips its record out of the offline state.
      if (item.kind === 'assessment-upload') {
        const a = useApp.getState().assessments.find((x) => x.id === item.assessmentId)
        if (a && a.status === 'queued-offline') {
          useApp.getState().updateAssessment(a.id, { status: 'processing', updatedAt: new Date().toISOString() })
          useApp.getState().appendAudit(a.id, {
            at: new Date().toISOString(),
            actorId: useApp.getState().authUser?.id ?? 'usr-001',
            actorName: useApp.getState().authUser?.name ?? 'Daniel Okafor',
            action: 'Queued capture set uploaded',
            detail: `${(item.sizeKb / 1024).toFixed(1)} MB sent once coverage returned.`,
          })
        }
      }

      cb.onItemDone?.(item)
      await sleep(320)
    }
  }

  void run()
  return { cancel: () => { cancelled = true } }
}
