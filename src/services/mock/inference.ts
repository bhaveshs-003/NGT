// ---------------------------------------------------------------------------
// Simulated inference pipeline.
//
// Stage progress is a pure function of elapsed time since submission, so the
// processing screen can poll a "status endpoint" every second and a page
// reload picks up where it left off. Outcomes are seeded per scenario, so the
// same click path always produces the same numbers.
// ---------------------------------------------------------------------------

import { PIPELINE_TEMPLATE } from '@/data/pipeline'
import type {
  Assessment,
  Dimensions,
  Field,
  IrregularFlag,
  PipelineStage,
  PipelineStageId,
  WeightResolutionStep,
} from '@/types'
import { sleep } from './client'

export const PIPELINE_TOTAL_MS = PIPELINE_TEMPLATE.reduce((s, x) => s + x.duration, 0)

export interface ProcessingStatus {
  stages: PipelineStage[]
  elapsedMs: number
  totalMs: number
  state: 'running' | 'complete' | 'failed'
  failure?: Assessment['failure']
}

const FAILURES: Record<string, NonNullable<Assessment['failure']>> = {
  ocr: {
    stageId: 'ocr',
    code: 'OCR_LOW_CONTRAST',
    message: 'Label OCR could not read any text region on the submitted label frame.',
    hint: 'Retake the label close-up in shade at roughly 400 mm, filling the frame with the tag, then retry.',
  },
}

/** The polled status endpoint. */
export async function pollProcessing(
  startedAtIso: string,
  failAt?: PipelineStageId,
  now = Date.now(),
): Promise<ProcessingStatus> {
  await sleep(90 + Math.random() * 90)
  const elapsedMs = Math.max(0, now - new Date(startedAtIso).getTime())

  let acc = 0
  let state: ProcessingStatus['state'] = 'running'
  const stages: PipelineStage[] = PIPELINE_TEMPLATE.map((t) => {
    const start = acc
    const end = acc + t.duration
    acc = end
    let s: PipelineStage['state']
    if (elapsedMs >= end) s = 'complete'
    else if (elapsedMs >= start) s = 'running'
    else s = 'pending'
    return { ...t, state: s }
  })

  if (failAt) {
    const idx = PIPELINE_TEMPLATE.findIndex((t) => t.id === failAt)
    const failAtMs = PIPELINE_TEMPLATE.slice(0, idx + 1).reduce((s, x) => s + x.duration, 0)
    if (elapsedMs >= failAtMs) {
      stages.forEach((s, i) => {
        s.state = i < idx ? 'complete' : i === idx ? 'failed' : 'pending'
        if (i === idx) s.note = FAILURES[failAt]?.code ?? 'STAGE_FAILED'
      })
      return {
        stages,
        elapsedMs,
        totalMs: PIPELINE_TOTAL_MS,
        state: 'failed',
        failure: FAILURES[failAt],
      }
    }
  }

  if (elapsedMs >= PIPELINE_TOTAL_MS) state = 'complete'
  return { stages, elapsedMs, totalMs: PIPELINE_TOTAL_MS, state }
}

// --- seeded result scenarios ----------------------------------------------

export interface InferenceResult {
  cargoTypeId: string
  dimensions: Dimensions
  cargoType: Field<string>
  material: Field<string>
  packaging: Field<string>
  weightKg: Field<number>
  weightChain: WeightResolutionStep[]
  flags: IrregularFlag[]
  labelText?: string
}

export interface Scenario {
  id: string
  /** palette key used for the simulated viewport and thumbnails */
  paletteKey: 'pallet' | 'steel' | 'pipe' | 'crate' | 'drum' | 'ibc' | 'irregular'
  /** what the camera guidance calls the subject, shown in the simulated viewport */
  subjectLabel: string
  failAt?: PipelineStageId
  result: InferenceResult
}

const FLAGS = {
  overhang: {
    id: 'overhang',
    label: 'Load overhang detected',
    severity: 'caution',
    detail: 'Cargo extends 60 mm beyond the pallet footprint on the long side. Allow clearance when slewing.',
  },
  unevenTop: {
    id: 'uneven-top',
    label: 'Uneven top surface',
    severity: 'caution',
    detail: 'Top surface is not level across the load. Sling legs will not tension equally without adjustment.',
  },
  concealed: {
    id: 'concealed-contents',
    label: 'Concealed contents',
    severity: 'info',
    detail: 'Opaque packaging. Internal mass distribution derived from the declaration only.',
  },
  cog: {
    id: 'cog-offset',
    label: 'Centre of gravity offset',
    severity: 'critical',
    detail: 'Estimated centre of gravity sits away from the geometric centre. Trial lift required.',
  },
} satisfies Record<string, IrregularFlag>

/**
 * Live capture scenarios, cycled by the draft counter. The first run of a
 * walkthrough is a clean high-confidence record; the second deliberately
 * lands a below-threshold weight so the manual-entry gate is exercised.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'sc-pallet-fittings',
    paletteKey: 'pallet',
    subjectLabel: 'Palletised pipe fittings, stretch-wrapped',
    result: {
      cargoTypeId: 'cc-euro-pallet',
      dimensions: {
        length: { value: 1205, confidence: 93, source: 'vision-model', uncertainty: 14, unit: 'mm' },
        width: { value: 805, confidence: 92, source: 'vision-model', uncertainty: 14, unit: 'mm' },
        height: { value: 1460, confidence: 89, source: 'vision-model', uncertainty: 22, unit: 'mm' },
        toleranceMm: 15,
      },
      cargoType: { value: 'Euro pallet — palletised cartons', confidence: 94, source: 'vision-model' },
      material: { value: 'Softwood pallet / corrugated cartons', confidence: 88, source: 'vision-model' },
      packaging: { value: 'Stretch-wrapped on 1200×800 Euro pallet', confidence: 92, source: 'vision-model' },
      weightKg: { value: 684, confidence: 91, source: 'label-ocr', uncertainty: 12, unit: 'kg' },
      labelText: 'NGT CONSOL / PALLET 12 OF 40 / FITTINGS DN50-DN150 / NET 684 KG / 1200×800×1460',
      weightChain: [
        {
          method: 'label-ocr',
          label: 'Label read',
          detail: 'Consignment label read as NET 684 KG, checksum on the barcode matched',
          status: 'used',
          value: 684,
          confidence: 91,
        },
        {
          method: 'catalogue',
          label: 'Catalogue lookup',
          detail: 'Euro pallet — palletised cartons, 180–720 kg',
          status: 'fallback-available',
          value: 640,
          confidence: 72,
        },
        {
          method: 'density-volume',
          label: 'Density × volume',
          detail: '1.42 m³ bounding box at 210 kg/m³ packed density',
          status: 'fallback-available',
          value: 298,
          confidence: 54,
        },
      ],
      flags: [FLAGS.overhang],
    },
  },
  {
    id: 'sc-crated-machinery-lowconf',
    paletteKey: 'crate',
    subjectLabel: 'Export crate, machinery, no visible weight marking',
    result: {
      cargoTypeId: 'cc-crated-machinery',
      dimensions: {
        length: { value: 3180, confidence: 87, source: 'vision-model', uncertainty: 35, unit: 'mm' },
        width: { value: 2060, confidence: 86, source: 'vision-model', uncertainty: 35, unit: 'mm' },
        height: { value: 1990, confidence: 72, source: 'vision-model', uncertainty: 70, unit: 'mm' },
        toleranceMm: 30,
      },
      cargoType: { value: 'Crated machinery', confidence: 88, source: 'vision-model' },
      material: { value: 'Plywood crate / fabricated steel', confidence: 61, source: 'vision-model' },
      packaging: { value: 'Export plywood crate, ISPM 15 treated', confidence: 84, source: 'vision-model' },
      weightKg: { value: 8340, confidence: 57, source: 'density-volume', uncertainty: 2100, unit: 'kg' },
      labelText: 'ISPM15 GB-0042 / CASE 5 / HANDLE WITH CARE / [weight field illegible]',
      weightChain: [
        {
          method: 'label-ocr',
          label: 'Label read',
          detail: 'Case marking read, but the weight field is illegible — stencil worn through',
          status: 'unavailable',
        },
        {
          method: 'catalogue',
          label: 'Catalogue lookup',
          detail: 'Crated machinery spans 900–22 000 kg — range too wide to resolve a value',
          status: 'unavailable',
        },
        {
          method: 'density-volume',
          label: 'Density × volume',
          detail: '13.03 m³ bounding box at 640 kg/m³ crate-average density',
          status: 'used',
          value: 8340,
          confidence: 57,
        },
      ],
      flags: [FLAGS.concealed, FLAGS.cog, FLAGS.unevenTop],
    },
  },
  {
    id: 'sc-plate-pack',
    paletteKey: 'steel',
    subjectLabel: 'Steel plate pack on timber dunnage',
    result: {
      cargoTypeId: 'cc-steel-plate-pack',
      dimensions: {
        length: { value: 6000, confidence: 95, source: 'vision-model', uncertainty: 15, unit: 'mm' },
        width: { value: 1995, confidence: 94, source: 'vision-model', uncertainty: 12, unit: 'mm' },
        height: { value: 208, confidence: 90, source: 'vision-model', uncertainty: 6, unit: 'mm' },
        toleranceMm: 15,
      },
      cargoType: { value: 'Steel plate pack', confidence: 96, source: 'vision-model' },
      material: { value: 'S355 structural steel', confidence: 92, source: 'label-ocr' },
      packaging: { value: 'Banded pack on timber dunnage', confidence: 93, source: 'vision-model' },
      weightKg: { value: 9840, confidence: 96, source: 'label-ocr', uncertainty: 40, unit: 'kg' },
      labelText: 'NORTHERN TRADER / PLATE PACK 11 / S355J2+N / NET 9 840 KG / 6000×2000×208',
      weightChain: [
        {
          method: 'label-ocr',
          label: 'Label read',
          detail: 'Mill tag read as NET 9 840 KG, cross-checked against the pack stencil',
          status: 'used',
          value: 9840,
          confidence: 96,
        },
        {
          method: 'catalogue',
          label: 'Catalogue lookup',
          detail: 'Steel plate pack, 2 400–14 800 kg',
          status: 'fallback-available',
          value: 9200,
          confidence: 73,
        },
        {
          method: 'density-volume',
          label: 'Density × volume',
          detail: '2.49 m³ bounding box at 7 850 kg/m³, less 50 % pack void',
          status: 'fallback-available',
          value: 9770,
          confidence: 84,
        },
      ],
      flags: [],
    },
  },
]

/** Results used when the seeded OCR failure is retried. */
export const RETRY_RESULTS: Record<'with-label' | 'without-label', InferenceResult> = {
  'with-label': {
    cargoTypeId: 'cc-crated-gearbox',
    dimensions: {
      length: { value: 2810, confidence: 88, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      width: { value: 1905, confidence: 86, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      height: { value: 1840, confidence: 85, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      toleranceMm: 30,
    },
    cargoType: { value: 'Crated gearbox assembly', confidence: 93, source: 'vision-model' },
    material: { value: 'Plywood crate / cast iron housing', confidence: 87, source: 'label-ocr' },
    packaging: { value: 'Heavy-duty crate on steel skid', confidence: 89, source: 'vision-model' },
    weightKg: { value: 22400, confidence: 94, source: 'label-ocr', uncertainty: 80, unit: 'kg' },
    labelText: 'HARTWELL ENERGY / GEARBOX ASSY 2 / GROSS 22 400 KG / CoG MARKED 180 MM OFF CENTRE',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Re-shot label read cleanly: GROSS 22 400 KG with a marked CoG offset',
        status: 'used',
        value: 22400,
        confidence: 94,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Crated gearbox assembly, 4 200–26 000 kg',
        status: 'fallback-available',
        value: 19800,
        confidence: 66,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '9.85 m³ bounding box at 890 kg/m³ crate-average density',
        status: 'fallback-available',
        value: 8770,
        confidence: 43,
      },
    ],
    flags: [FLAGS.concealed, FLAGS.cog],
  },
  'without-label': {
    cargoTypeId: 'cc-crated-gearbox',
    dimensions: {
      length: { value: 2810, confidence: 88, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      width: { value: 1905, confidence: 86, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      height: { value: 1840, confidence: 85, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      toleranceMm: 30,
    },
    cargoType: { value: 'Crated gearbox assembly', confidence: 90, source: 'vision-model' },
    material: { value: 'Plywood crate / cast iron housing', confidence: 82, source: 'vision-model' },
    packaging: { value: 'Heavy-duty crate on steel skid', confidence: 87, source: 'vision-model' },
    weightKg: { value: 8770, confidence: 43, source: 'density-volume', uncertainty: 3200, unit: 'kg' },
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Skipped at operator request — label frame not re-submitted',
        status: 'unavailable',
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Crated gearbox assembly spans 4 200–26 000 kg — range too wide to resolve a value',
        status: 'unavailable',
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '9.85 m³ bounding box at 890 kg/m³ crate-average density, contents unknown',
        status: 'used',
        value: 8770,
        confidence: 43,
      },
    ],
    flags: [FLAGS.concealed, FLAGS.cog],
  },
}

/**
 * Results attached to specific seeded records rather than to a live capture
 * scenario — the offline drum set, and the two retry paths off the OCR
 * failure.
 */
export const SEEDED_RESULTS: Record<string, InferenceResult> = {
  'retry-with-label': RETRY_RESULTS['with-label'],
  'retry-without-label': RETRY_RESULTS['without-label'],
  'asmt-0306': {
    cargoTypeId: 'cc-crated-turbine',
    dimensions: {
      length: { value: 4105, confidence: 91, source: 'vision-model', uncertainty: 35, unit: 'mm' },
      width: { value: 2210, confidence: 90, source: 'vision-model', uncertainty: 30, unit: 'mm' },
      height: { value: 2395, confidence: 88, source: 'vision-model', uncertainty: 35, unit: 'mm' },
      toleranceMm: 30,
    },
    cargoType: { value: 'Crated turbine spare', confidence: 93, source: 'vision-model' },
    material: { value: 'Steel frame crate / alloy components', confidence: 86, source: 'label-ocr' },
    packaging: { value: 'Steel-framed crate, shock-mounted', confidence: 90, source: 'vision-model' },
    weightKg: { value: 12650, confidence: 92, source: 'label-ocr', uncertainty: 60, unit: 'kg' },
    labelText: 'HARTWELL ENERGY / TURBINE SPARE 2 OF 4 / GROSS 12 650 KG / SHOCK INDICATOR FITTED / DO NOT TIP',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Crate stencil read as GROSS 12 650 KG with a shock-indicator marking',
        status: 'used',
        value: 12650,
        confidence: 92,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Crated turbine spare, 3 600–18 500 kg',
        status: 'fallback-available',
        value: 11200,
        confidence: 67,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '21.73 m³ bounding box at 520 kg/m³ crate-average density',
        status: 'fallback-available',
        value: 11300,
        confidence: 70,
      },
    ],
    flags: [
      {
        id: 'concealed-contents',
        label: 'Concealed contents',
        severity: 'info',
        detail: 'Steel-framed crate. Shock indicator fitted — record its state before and after the lift.',
      },
      {
        id: 'uneven-top',
        label: 'Uneven top surface',
        severity: 'caution',
        detail: 'Lifting frame protrudes above the crate lid. Legs will foul without a spreader.',
      },
    ],
  },
  'asmt-0303': {
    cargoTypeId: 'cc-steel-drum',
    dimensions: {
      length: { value: 1200, confidence: 94, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      width: { value: 1000, confidence: 94, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      height: { value: 885, confidence: 92, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      toleranceMm: 15,
    },
    cargoType: { value: 'Steel drum — 205 L (×4 banded)', confidence: 95, source: 'vision-model' },
    material: { value: 'Mild steel, lacquered interior', confidence: 89, source: 'label-ocr' },
    packaging: { value: 'UN-approved closed-head drum, banded to pallet', confidence: 93, source: 'vision-model' },
    weightKg: { value: 892, confidence: 88, source: 'label-ocr', uncertainty: 18, unit: 'kg' },
    labelText: 'UN 1A1/Y1.8/150 / 4 × 205 L / GROSS 223 KG EACH / CONTENTS GEAR OIL',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Drum plate read as GROSS 223 KG each, four drums plus 4 kg pallet banding',
        status: 'used',
        value: 892,
        confidence: 88,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Steel drum — 205 L, 180–240 kg each',
        status: 'fallback-available',
        value: 860,
        confidence: 79,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '1.06 m³ bounding box at 1 020 kg/m³ filled density',
        status: 'fallback-available',
        value: 1083,
        confidence: 61,
      },
    ],
    flags: [
      {
        id: 'no-lifting-points',
        label: 'No certified lifting points',
        severity: 'critical',
        detail: 'Rolling hoops are not rated lifting points. A four-drum cradle is required.',
      },
    ],
  },
}

/** Which seeded result belongs to a record. */
export function resolveResult(a: Pick<Assessment, 'id' | 'scenarioId'>): InferenceResult {
  if (a.scenarioId) {
    const sc = SCENARIOS.find((s) => s.id === a.scenarioId)
    if (sc) return sc.result
    const seeded = SEEDED_RESULTS[a.scenarioId]
    if (seeded) return seeded
  }
  return SEEDED_RESULTS[a.id] ?? SCENARIOS[0].result
}

export function scenarioAt(index: number): Scenario {
  return SCENARIOS[index % SCENARIOS.length]
}

export function scenarioById(id?: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

/** Submit a capture set. Resolves once the "server" has accepted the upload. */
export async function submitCaptureSet(frameCount: number): Promise<{ accepted: boolean; bytes: number }> {
  await sleep(500)
  return { accepted: true, bytes: frameCount * 1_820_000 }
}
