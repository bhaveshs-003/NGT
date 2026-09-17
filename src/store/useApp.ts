import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification,
  Assessment,
  AuditEntry,
  Capture,
  CaptureStepId,
  CraneId,
  Field,
  Job,
  LiftPlan,
  NotificationCategory,
  Settings,
  SyncQueueItem,
  User,
} from '@/types'
import { ASSESSMENTS } from '@/data/assessments'
import { JOBS } from '@/data/jobs'
import { NOTIFICATIONS } from '@/data/notifications'
import { CURRENT_USER } from '@/data/users'
import { freshPipeline } from '@/data/pipeline'

export const STORAGE_KEY = 'ngt-field-assessment-v1'

export const DEFAULT_SETTINGS: Settings = {
  confidenceThreshold: 70,
  contingencyPct: 10,
  utilisationWarnPct: 85,
  notifications: {
    'assessment-complete': true,
    'verification-required': true,
    'job-assignment': true,
    sync: true,
    'safety-bulletin': false,
  },
  offlineMode: false,
  forceUpdate: false,
  units: 'metric',
  autoAdvanceCapture: true,
}

export interface CaptureDraft {
  id: string
  jobId: string
  startedAt: string
  currentStep: CaptureStepId
  frames: Partial<Record<CaptureStepId, Capture>>
  attempts: Partial<Record<CaptureStepId, number>>
  /** scenario index locked in when the draft was started, keeps thumbnails and result consistent */
  scenario: number
}

export interface Toast {
  id: string
  tone: 'info' | 'success' | 'warn' | 'error'
  title: string
  body?: string
  deepLink?: string
  sticky?: boolean
}

export const SEED_SYNC_QUEUE: SyncQueueItem[] = [
  {
    id: 'sq-001',
    kind: 'assessment-upload',
    assessmentId: 'asmt-0303',
    label: 'ASMT-2026-0303 — steel drum set, 4 frames',
    queuedAt: '2026-09-17T05:12:00Z',
    sizeKb: 4304,
    progress: 0,
    state: 'queued',
  },
  {
    id: 'sq-002',
    kind: 'override',
    assessmentId: 'asmt-0308',
    label: 'ASMT-2026-0308 — weight override, weighbridge ticket 44821',
    queuedAt: '2026-09-17T05:28:00Z',
    sizeKb: 12,
    progress: 0,
    state: 'queued',
    // Drains into a conflict prompt to demonstrate resolution.
    conflict: {
      field: 'Weight',
      localValue: '1 250 kg',
      serverValue: '1 268 kg',
      serverActor: 'Marta Reinholt',
      serverAt: '2026-09-17T05:22:00Z',
    },
  },
]

interface AppState {
  // --- session
  authUser: User | null
  deviceRegistered: boolean
  lastLoginAt: string | null

  // --- data
  jobs: Job[]
  assessments: Assessment[]
  notifications: AppNotification[]
  syncQueue: SyncQueueItem[]
  settings: Settings

  // --- demo determinism
  scenarioCounter: number
  jobCounter: number
  assessmentCounter: number
  pushFired: boolean

  // --- transient
  draft: CaptureDraft | null
  toasts: Toast[]

  // --- session actions
  login: (user: User) => void
  logout: () => void
  registerDevice: () => void

  // --- jobs
  createJob: (input: { title: string; vessel: string; berth: string; cargoSummary: string; craneId: CraneId; shift: string }) => Job

  // --- capture draft
  startDraft: (jobId: string) => CaptureDraft
  setFrame: (step: CaptureStepId, capture: Capture) => void
  discardFrame: (step: CaptureStepId) => void
  bumpAttempt: (step: CaptureStepId) => number
  setCurrentStep: (step: CaptureStepId) => void
  clearDraft: () => void

  // --- assessments
  addAssessment: (a: Assessment) => void
  updateAssessment: (id: string, patch: Partial<Assessment>) => void
  appendAudit: (id: string, entry: Omit<AuditEntry, 'id' | 'version'> & { version?: number }) => void
  overrideField: (
    id: string,
    fieldKey: 'length' | 'width' | 'height' | 'cargoType' | 'material' | 'packaging' | 'weightKg',
    next: { value: string | number; reason: string; note: string },
  ) => void
  setLiftPlan: (id: string, plan: LiftPlan) => void
  confirmAssessment: (id: string) => void
  verifyAssessment: (id: string, byUserId: string) => void
  reopenAssessment: (id: string) => void

  // --- settings
  setSettings: (patch: Partial<Settings>) => void
  setNotificationPref: (cat: NotificationCategory, on: boolean) => void

  // --- notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  pushNotification: (n: AppNotification) => void
  setPushFired: (v: boolean) => void

  // --- sync queue
  enqueue: (item: SyncQueueItem) => void
  updateQueueItem: (id: string, patch: Partial<SyncQueueItem>) => void
  removeQueueItem: (id: string) => void
  clearQueue: () => void

  // --- toasts
  toast: (t: Omit<Toast, 'id'>) => string
  dismissToast: (id: string) => void

  // --- demo
  resetDemo: () => void
  nextScenario: () => number
}

function nowIso(): string {
  return new Date().toISOString()
}

let idSeq = 0
export function uid(prefix: string): string {
  idSeq += 1
  return `${prefix}-${Date.now().toString(36)}${idSeq.toString(36)}`
}

const FIELD_LABELS: Record<string, string> = {
  length: 'Length',
  width: 'Width',
  height: 'Height',
  cargoType: 'Cargo type',
  material: 'Material',
  packaging: 'Packaging',
  weightKg: 'Weight',
}

function readField(a: Assessment, key: string): Field<string | number> {
  switch (key) {
    case 'length':
      return a.dimensions.length
    case 'width':
      return a.dimensions.width
    case 'height':
      return a.dimensions.height
    case 'cargoType':
      return a.cargoType
    case 'material':
      return a.material
    case 'packaging':
      return a.packaging
    default:
      return a.weightKg
  }
}

function writeField(a: Assessment, key: string, f: Field<string | number>): Assessment {
  switch (key) {
    case 'length':
      return { ...a, dimensions: { ...a.dimensions, length: f as Field<number> } }
    case 'width':
      return { ...a, dimensions: { ...a.dimensions, width: f as Field<number> } }
    case 'height':
      return { ...a, dimensions: { ...a.dimensions, height: f as Field<number> } }
    case 'cargoType':
      return { ...a, cargoType: f as Field<string> }
    case 'material':
      return { ...a, material: f as Field<string> }
    case 'packaging':
      return { ...a, packaging: f as Field<string> }
    default:
      return { ...a, weightKg: f as Field<number> }
  }
}

function fieldDisplay(f: Field<string | number>): string {
  if (typeof f.value === 'number') {
    return `${f.value.toLocaleString('en-GB')}${f.unit ? ` ${f.unit}` : ''}`
  }
  return String(f.value)
}

const INITIAL = {
  authUser: null as User | null,
  deviceRegistered: false,
  lastLoginAt: null as string | null,
  jobs: JOBS,
  assessments: ASSESSMENTS,
  notifications: NOTIFICATIONS,
  syncQueue: SEED_SYNC_QUEUE,
  settings: DEFAULT_SETTINGS,
  scenarioCounter: 0,
  jobCounter: 0,
  assessmentCounter: 0,
  pushFired: false,
  draft: null as CaptureDraft | null,
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      toasts: [],

      // --- session ------------------------------------------------------
      login: (user) => set({ authUser: user, lastLoginAt: nowIso() }),
      logout: () => set({ authUser: null, draft: null }),
      registerDevice: () => set({ deviceRegistered: true }),

      // --- jobs ---------------------------------------------------------
      createJob: (input) => {
        const n = get().jobCounter + 1
        const job: Job = {
          id: uid('job'),
          ref: `JOB-2026-${(147 + n).toString().padStart(4, '0')}`,
          title: input.title,
          vessel: input.vessel,
          berth: input.berth,
          cargoSummary: input.cargoSummary,
          craneId: input.craneId,
          createdAt: nowIso(),
          createdBy: get().authUser?.id ?? CURRENT_USER.id,
          status: 'active',
          shift: input.shift,
        }
        set({ jobs: [job, ...get().jobs], jobCounter: n })
        return job
      },

      // --- capture draft -------------------------------------------------
      startDraft: (jobId) => {
        const draft: CaptureDraft = {
          id: uid('draft'),
          jobId,
          startedAt: nowIso(),
          currentStep: 'front',
          frames: {},
          attempts: {},
          scenario: get().scenarioCounter % 3,
        }
        set({ draft })
        return draft
      },
      setFrame: (step, capture) => {
        const d = get().draft
        if (!d) return
        set({ draft: { ...d, frames: { ...d.frames, [step]: capture } } })
      },
      discardFrame: (step) => {
        const d = get().draft
        if (!d) return
        const frames = { ...d.frames }
        delete frames[step]
        set({ draft: { ...d, frames } })
      },
      bumpAttempt: (step) => {
        const d = get().draft
        if (!d) return 1
        const next = (d.attempts[step] ?? 0) + 1
        set({ draft: { ...d, attempts: { ...d.attempts, [step]: next } } })
        return next
      },
      setCurrentStep: (step) => {
        const d = get().draft
        if (!d) return
        set({ draft: { ...d, currentStep: step } })
      },
      clearDraft: () => set({ draft: null }),

      // --- assessments ---------------------------------------------------
      addAssessment: (a) =>
        set({ assessments: [a, ...get().assessments], assessmentCounter: get().assessmentCounter + 1 }),

      updateAssessment: (id, patch) =>
        set({
          assessments: get().assessments.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: patch.updatedAt ?? nowIso() } : a,
          ),
        }),

      appendAudit: (id, entry) =>
        set({
          assessments: get().assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  audit: [...a.audit, { id: uid('aud'), version: entry.version ?? a.version, ...entry }],
                }
              : a,
          ),
        }),

      overrideField: (id, fieldKey, next) => {
        const user = get().authUser ?? CURRENT_USER
        const a = get().assessments.find((x) => x.id === id)
        if (!a) return
        const prev = readField(a, fieldKey)
        const before = fieldDisplay(prev)
        const updatedField: Field<string | number> = {
          ...prev,
          value: next.value,
          confidence: 100,
          source: 'manual',
          uncertainty: undefined,
          overridden: true,
          overriddenBy: user.id,
          overrideReason: next.reason,
          overrideNote: next.note,
          overriddenAt: nowIso(),
        }
        let updated = writeField(a, fieldKey, updatedField)
        updated = {
          ...updated,
          status: updated.status === 'verified' ? 'verified' : 'overridden',
          updatedAt: nowIso(),
          audit: [
            ...updated.audit,
            {
              id: uid('aud'),
              at: nowIso(),
              actorId: user.id,
              actorName: user.name,
              action: 'Field overridden',
              field: FIELD_LABELS[fieldKey],
              from: before,
              to: fieldDisplay(updatedField),
              reason: next.reason,
              detail: next.note || undefined,
              version: updated.version,
            },
          ],
        }
        set({ assessments: get().assessments.map((x) => (x.id === id ? updated : x)) })

        if (get().settings.offlineMode) {
          get().enqueue({
            id: uid('sq'),
            kind: 'override',
            assessmentId: id,
            label: `${a.ref} — ${FIELD_LABELS[fieldKey]} override`,
            queuedAt: nowIso(),
            sizeKb: 11,
            progress: 0,
            state: 'queued',
          })
        }
      },

      setLiftPlan: (id, plan) =>
        set({
          assessments: get().assessments.map((a) =>
            a.id === id ? { ...a, liftPlan: plan, updatedAt: nowIso() } : a,
          ),
        }),

      confirmAssessment: (id) => {
        const user = get().authUser ?? CURRENT_USER
        const a = get().assessments.find((x) => x.id === id)
        if (!a) return
        get().appendAudit(id, {
          at: nowIso(),
          actorId: user.id,
          actorName: user.name,
          action: 'Assessment confirmed',
          detail: 'All fields reviewed against the confidence threshold',
        })
      },

      verifyAssessment: (id, byUserId) => {
        const user = get().authUser ?? CURRENT_USER
        const a = get().assessments.find((x) => x.id === id)
        if (!a) return
        set({
          assessments: get().assessments.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: 'verified',
                  verifiedBy: byUserId,
                  verifiedAt: nowIso(),
                  updatedAt: nowIso(),
                  audit: [
                    ...x.audit,
                    {
                      id: uid('aud'),
                      at: nowIso(),
                      actorId: user.id,
                      actorName: user.name,
                      action: 'Assessment verified and locked',
                      detail: `Record version ${x.version} stamped. All fields now read-only.`,
                      version: x.version,
                    },
                  ],
                }
              : x,
          ),
        })
        if (get().settings.offlineMode) {
          get().enqueue({
            id: uid('sq'),
            kind: 'verification',
            assessmentId: id,
            label: `${a.ref} — verification stamp`,
            queuedAt: nowIso(),
            sizeKb: 8,
            progress: 0,
            state: 'queued',
          })
        }
      },

      reopenAssessment: (id) => {
        const user = get().authUser ?? CURRENT_USER
        set({
          assessments: get().assessments.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: 'completed',
                  version: x.version + 1,
                  verifiedBy: undefined,
                  verifiedAt: undefined,
                  updatedAt: nowIso(),
                  supersedes: `${x.id}-v${x.version}`,
                  audit: [
                    ...x.audit,
                    {
                      id: uid('aud'),
                      at: nowIso(),
                      actorId: user.id,
                      actorName: user.name,
                      action: 'Record re-opened for re-assessment',
                      detail: `Version ${x.version} superseded. Working on version ${x.version + 1}.`,
                      version: x.version + 1,
                    },
                  ],
                }
              : x,
          ),
        })
      },

      // --- settings -------------------------------------------------------
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setNotificationPref: (cat, on) =>
        set({ settings: { ...get().settings, notifications: { ...get().settings.notifications, [cat]: on } } }),

      // --- notifications --------------------------------------------------
      markNotificationRead: (id) =>
        set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      pushNotification: (n) => set({ notifications: [n, ...get().notifications] }),
      setPushFired: (v) => set({ pushFired: v }),

      // --- sync queue -----------------------------------------------------
      enqueue: (item) => set({ syncQueue: [...get().syncQueue, item] }),
      updateQueueItem: (id, patch) =>
        set({ syncQueue: get().syncQueue.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
      removeQueueItem: (id) => set({ syncQueue: get().syncQueue.filter((i) => i.id !== id) }),
      clearQueue: () => set({ syncQueue: [] }),

      // --- toasts ---------------------------------------------------------
      toast: (t) => {
        const id = uid('toast')
        set({ toasts: [...get().toasts, { ...t, id }] })
        return id
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      // --- demo -----------------------------------------------------------
      resetDemo: () =>
        set({
          ...INITIAL,
          jobs: JOBS,
          assessments: ASSESSMENTS.map((a) => ({ ...a, pipeline: a.status === 'queued-offline' ? freshPipeline() : a.pipeline })),
          notifications: NOTIFICATIONS,
          syncQueue: SEED_SYNC_QUEUE,
          settings: DEFAULT_SETTINGS,
          toasts: [],
          authUser: get().authUser,
          deviceRegistered: get().deviceRegistered,
          lastLoginAt: get().lastLoginAt,
        }),

      nextScenario: () => {
        const n = get().scenarioCounter + 1
        set({ scenarioCounter: n })
        return n
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        authUser: s.authUser,
        deviceRegistered: s.deviceRegistered,
        lastLoginAt: s.lastLoginAt,
        jobs: s.jobs,
        assessments: s.assessments,
        notifications: s.notifications,
        syncQueue: s.syncQueue,
        settings: s.settings,
        scenarioCounter: s.scenarioCounter,
        jobCounter: s.jobCounter,
        assessmentCounter: s.assessmentCounter,
        pushFired: s.pushFired,
        draft: s.draft,
      }),
    },
  ),
)

// --- selectors -------------------------------------------------------------

export function useAssessment(id?: string): Assessment | undefined {
  return useApp((s) => (id ? s.assessments.find((a) => a.id === id) : undefined))
}

export function useJob(id?: string): Job | undefined {
  return useApp((s) => (id ? s.jobs.find((j) => j.id === id) : undefined))
}

export function assessmentsForJob(assessments: Assessment[], jobId: string): Assessment[] {
  return assessments.filter((a) => a.jobId === jobId)
}

export function pendingSyncCount(queue: SyncQueueItem[]): number {
  return queue.filter((i) => i.state !== 'done').length
}

export function isLocked(a?: Assessment): boolean {
  return a?.status === 'verified'
}
