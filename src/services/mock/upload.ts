// ---------------------------------------------------------------------------
// Chunked upload simulation.
//
// Each frame animates to 100 % over roughly 2 s. Toggling the demo offline
// switch pauses the transfer mid-chunk; switching back on resumes from the
// chunk boundary rather than restarting.
// ---------------------------------------------------------------------------

import { useApp } from '@/store/useApp'

export interface FrameUploadState {
  step: string
  label: string
  sizeKb: number
  progress: number
  state: 'waiting' | 'uploading' | 'paused' | 'done'
}

export interface UploaderHandle {
  cancel: () => void
}

const CHUNKS_PER_FRAME = 20
const CHUNK_MS = 100

export function startUpload(
  frames: { step: string; label: string; sizeKb: number }[],
  onUpdate: (states: FrameUploadState[]) => void,
  onDone: () => void,
): UploaderHandle {
  const states: FrameUploadState[] = frames.map((f) => ({ ...f, progress: 0, state: 'waiting' }))
  let cancelled = false

  const emit = () => onUpdate(states.map((s) => ({ ...s })))
  emit()

  const run = async () => {
    for (let i = 0; i < states.length; i++) {
      if (cancelled) return
      states[i].state = 'uploading'
      emit()
      for (let c = 0; c < CHUNKS_PER_FRAME; c++) {
        if (cancelled) return
        // Hold at the chunk boundary while the device has no coverage.
        while (useApp.getState().settings.offlineMode) {
          if (cancelled) return
          if (states[i].state !== 'paused') {
            states[i].state = 'paused'
            emit()
          }
          await new Promise((r) => setTimeout(r, 250))
        }
        if (states[i].state === 'paused') {
          states[i].state = 'uploading'
          emit()
        }
        await new Promise((r) => setTimeout(r, CHUNK_MS))
        states[i].progress = Math.round(((c + 1) / CHUNKS_PER_FRAME) * 100)
        emit()
      }
      states[i].state = 'done'
      emit()
    }
    if (!cancelled) onDone()
  }

  void run()

  return {
    cancel: () => {
      cancelled = true
    },
  }
}

export function frameSizeKb(step: string): number {
  // Stable per-step sizes so the byte counts never jitter between runs.
  const sizes: Record<string, number> = { front: 1840, side: 1712, corner: 1966, label: 984 }
  return sizes[step] ?? 1500
}
