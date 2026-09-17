// ---------------------------------------------------------------------------
// NGT Cargo Assessment — domain types
// ---------------------------------------------------------------------------

export type UserRole = 'Lifting Supervisor' | 'Crane Operator' | 'Terminal Superintendent'

export interface User {
  id: string
  name: string
  email: string
  password?: string
  company: string
  role: UserRole
  deviceId: string
  phone: string
  certification: string
  certExpiry: string
  avatarInitials: string
}

// --- Jobs ------------------------------------------------------------------

export type CraneId = 'crane-lhm-550' | 'crane-cc-2800' | 'crane-tc-7032'

export interface Job {
  id: string
  ref: string
  title: string
  vessel: string
  berth: string
  cargoSummary: string
  craneId: CraneId
  createdAt: string
  createdBy: string
  status: 'active' | 'on-hold' | 'closed'
  shift: string
}

// --- Confidence-scored fields ---------------------------------------------

export type FieldSource =
  | 'vision-model'
  | 'label-ocr'
  | 'catalogue'
  | 'density-volume'
  | 'manual'
  | 'declared'

export interface Field<T> {
  value: T
  /** 0-100 */
  confidence: number
  source: FieldSource
  /** ± band in the field's own unit, e.g. 18 mm or 140 kg */
  uncertainty?: number
  unit?: string
  overridden?: boolean
  overriddenBy?: string
  overrideReason?: string
  overrideNote?: string
  overriddenAt?: string
}

// --- Weight resolution -----------------------------------------------------

export type WeightMethod = 'label-ocr' | 'catalogue' | 'density-volume'

export interface WeightResolutionStep {
  method: WeightMethod
  label: string
  detail: string
  status: 'used' | 'unavailable' | 'fallback-available' | 'skipped'
  value?: number
  confidence?: number
}

// --- Captures --------------------------------------------------------------

export type CaptureStepId = 'front' | 'side' | 'corner' | 'label'

export interface QualityCheck {
  blur: number
  exposure: number
  tilt: number
  distance: number
  subjectFill: number
  passed: boolean
  failedMetric?: 'blur' | 'exposure' | 'tilt' | 'distance' | 'subjectFill'
  message?: string
  guidance?: string
}

export interface Capture {
  id: string
  step: CaptureStepId
  label: string
  svg: string
  takenAt: string
  quality: QualityCheck
  source: 'camera' | 'gallery'
  attempt: number
}

// --- Pipeline --------------------------------------------------------------

export type PipelineStageId =
  | 'detection'
  | 'segmentation'
  | 'dimensions'
  | 'classification'
  | 'ocr'
  | 'weight'
  | 'confidence'

export type StageState = 'pending' | 'running' | 'complete' | 'failed'

export interface PipelineStage {
  id: PipelineStageId
  label: string
  detail: string
  state: StageState
  /** milliseconds of simulated work */
  duration: number
  note?: string
}

// --- Assessments -----------------------------------------------------------

export type AssessmentStatus =
  | 'queued-offline'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'overridden'
  | 'verified'
  | 'failed'

export type IrregularFlagId =
  | 'overhang'
  | 'uneven-top'
  | 'mixed-pallet'
  | 'concealed-contents'
  | 'no-lifting-points'
  | 'cog-offset'

export interface IrregularFlag {
  id: IrregularFlagId
  label: string
  severity: 'info' | 'caution' | 'critical'
  detail: string
}

export interface AuditEntry {
  id: string
  at: string
  actorId: string
  actorName: string
  action: string
  detail?: string
  field?: string
  from?: string
  to?: string
  reason?: string
  version: number
}

export interface Dimensions {
  length: Field<number>
  width: Field<number>
  height: Field<number>
  /** ± mm tolerance band applied by the dimension solver */
  toleranceMm: number
}

export interface RiggingSelection {
  slingId: string
  slingCount: number
  shackleId: string
  shackleCount: number
  spreaderId?: string
}

export interface LiftPlan {
  rigging: RiggingSelection
  slingAngleDeg: number
  liftingPointsPresent: boolean
  liftingPointCount: number
  cogOffsetMm: { x: number; y: number }
  craneId: CraneId
  boomConfigId: string
  radiusM: number
  notes?: string
}

export interface Assessment {
  id: string
  ref: string
  jobId: string
  status: AssessmentStatus
  version: number
  createdAt: string
  createdBy: string
  updatedAt: string
  verifiedBy?: string
  verifiedAt?: string
  captures: Capture[]
  dimensions: Dimensions
  cargoType: Field<string>
  cargoTypeId: string
  material: Field<string>
  packaging: Field<string>
  weightKg: Field<number>
  weightChain: WeightResolutionStep[]
  flags: IrregularFlag[]
  audit: AuditEntry[]
  pipeline: PipelineStage[]
  liftPlan?: LiftPlan
  failure?: { stageId: PipelineStageId; code: string; message: string; hint: string }
  /** set when a record has been re-opened; points at the superseded version */
  supersedes?: string
  labelText?: string
  /** which seeded inference scenario produced this record (demo determinism) */
  scenarioId?: string
}

// --- Catalogue / registry --------------------------------------------------

export interface CargoCatalogueEntry {
  id: string
  name: string
  material: string
  /** kg/m3 */
  density: number
  packaging: string
  nominalWeightKg: [number, number]
  typicalDimsMm?: [number, number, number]
  riggingRuleId: string
  notes: string
}

export interface Sling {
  id: string
  type: string
  wllKg: number
  weightKg: number
  lengthM: number
  material: string
}

export interface Shackle {
  id: string
  type: string
  swlKg: number
  weightKg: number
  pinMm: number
}

export interface SpreaderBeam {
  id: string
  name: string
  capacityKg: number
  weightKg: number
  spanM: number
}

export interface RiggingRule {
  id: string
  cargoTypeIds: string[]
  slingId: string
  slingCount: number
  shackleId: string
  shackleCount: number
  spreaderId?: string
  rationale: string
  recommendedAngleDeg: number
}

export interface BoomConfig {
  id: string
  label: string
  boomLengthM: number
  counterweightT: number
}

export interface CraneLoadChart {
  id: CraneId
  name: string
  type: 'Mobile harbour' | 'Crawler' | 'Tower'
  model: string
  maxCapacityKg: number
  boomConfigs: BoomConfig[]
  /** capacity in kg keyed by boom config id, per radius row */
  chart: { radiusM: number; capacityKg: Record<string, number> }[]
}

// --- Notifications / sync --------------------------------------------------

export type NotificationCategory =
  | 'assessment-complete'
  | 'verification-required'
  | 'job-assignment'
  | 'sync'
  | 'safety-bulletin'

export interface AppNotification {
  id: string
  category: NotificationCategory
  title: string
  body: string
  at: string
  read: boolean
  deepLink?: string
}

export type SyncItemKind = 'assessment-upload' | 'override' | 'verification'

export interface SyncQueueItem {
  id: string
  kind: SyncItemKind
  assessmentId: string
  label: string
  queuedAt: string
  sizeKb: number
  progress: number
  state: 'queued' | 'syncing' | 'conflict' | 'done' | 'error'
  conflict?: {
    field: string
    localValue: string
    serverValue: string
    serverActor: string
    serverAt: string
  }
}

// --- Settings --------------------------------------------------------------

export interface NotificationPrefs {
  'assessment-complete': boolean
  'verification-required': boolean
  'job-assignment': boolean
  sync: boolean
  'safety-bulletin': boolean
}

export interface Settings {
  confidenceThreshold: number
  contingencyPct: number
  utilisationWarnPct: number
  notifications: NotificationPrefs
  /** demo toggles */
  offlineMode: boolean
  forceUpdate: boolean
  units: 'metric'
  autoAdvanceCapture: boolean
}

export type ConfidenceTier = 'high' | 'mid' | 'low'
