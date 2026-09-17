import type {
  Assessment,
  AuditEntry,
  Capture,
  CaptureStepId,
  IrregularFlag,
  QualityCheck,
} from '@/types'
import { CAPTURE_PALETTES, captureSvg, type CargoShape } from './images'
import { completedPipeline, failedPipeline, freshPipeline, partialPipeline } from './pipeline'

// --- builders --------------------------------------------------------------

const PASS: QualityCheck = {
  blur: 0.08,
  exposure: 0.52,
  tilt: 1.4,
  distance: 2.6,
  subjectFill: 0.71,
  passed: true,
}

const CAPTURE_LABELS: Record<CaptureStepId, string> = {
  front: 'Front elevation',
  side: 'Side elevation',
  corner: '45° corner',
  label: 'Shipping label',
}

function captureSet(
  assessmentId: string,
  paletteKey: keyof typeof CAPTURE_PALETTES,
  at: string,
  opts: { steps?: CaptureStepId[]; quality?: Partial<Record<CaptureStepId, QualityCheck>> } = {},
): Capture[] {
  const palette = CAPTURE_PALETTES[paletteKey]
  const steps = opts.steps ?? (['front', 'side', 'corner', 'label'] as CaptureStepId[])
  return steps.map((step, i) => {
    const shape: CargoShape = step === 'label' ? 'label' : palette.shape
    return {
      id: `${assessmentId}-cap-${step}`,
      step,
      label: CAPTURE_LABELS[step],
      svg: captureSvg(
        {
          shape,
          view: step,
          body: palette.body,
          accent: palette.accent,
          caption: `${CAPTURE_LABELS[step]} capture`,
        },
        assessmentId.length + i * 13,
      ),
      takenAt: at,
      quality: opts.quality?.[step] ?? PASS,
      source: 'camera',
      attempt: 1,
    }
  })
}

let auditSeq = 0
function audit(
  at: string,
  actorId: string,
  actorName: string,
  action: string,
  version: number,
  extra: Partial<AuditEntry> = {},
): AuditEntry {
  auditSeq += 1
  return { id: `aud-${auditSeq.toString().padStart(4, '0')}`, at, actorId, actorName, action, version, ...extra }
}

const FLAG_LIB: Record<string, IrregularFlag> = {
  overhang: {
    id: 'overhang',
    label: 'Load overhang detected',
    severity: 'caution',
    detail: 'Cargo extends beyond the pallet footprint on the long side. Allow clearance when slewing.',
  },
  unevenTop: {
    id: 'uneven-top',
    label: 'Uneven top surface',
    severity: 'caution',
    detail: 'Top surface is not level. Sling legs will not tension equally without adjustment.',
  },
  mixedPallet: {
    id: 'mixed-pallet',
    label: 'Mixed pallet contents',
    severity: 'caution',
    detail: 'Multiple item types stacked. Weight distribution cannot be assumed uniform.',
  },
  concealed: {
    id: 'concealed-contents',
    label: 'Concealed contents',
    severity: 'info',
    detail: 'Opaque packaging. Internal mass distribution derived from declaration only.',
  },
  noPoints: {
    id: 'no-lifting-points',
    label: 'No certified lifting points',
    severity: 'critical',
    detail: 'No marked or rated lifting points visible. Sling arrangement requires supervisor sign-off.',
  },
  cog: {
    id: 'cog-offset',
    label: 'Centre of gravity offset',
    severity: 'critical',
    detail: 'Estimated centre of gravity sits away from the geometric centre. Trial lift required.',
  },
}

// --- seeded records --------------------------------------------------------

export const ASSESSMENTS: Assessment[] = [
  // 1) VERIFIED AND LOCKED, version 2 after a re-assessment ----------------
  {
    id: 'asmt-0311',
    ref: 'ASMT-2026-0311',
    jobId: 'job-0142',
    status: 'verified',
    version: 2,
    createdAt: '2026-09-16T08:12:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-16T09:02:00Z',
    verifiedBy: 'usr-002',
    verifiedAt: '2026-09-16T09:02:00Z',
    captures: captureSet('asmt-0311', 'steel', '2026-09-16T08:12:00Z'),
    cargoTypeId: 'cc-steel-plate-pack',
    dimensions: {
      length: { value: 6010, confidence: 96, source: 'vision-model', uncertainty: 15, unit: 'mm' },
      width: { value: 2000, confidence: 95, source: 'vision-model', uncertainty: 12, unit: 'mm' },
      height: { value: 312, confidence: 91, source: 'vision-model', uncertainty: 8, unit: 'mm' },
      toleranceMm: 15,
    },
    cargoType: { value: 'Steel plate pack', confidence: 97, source: 'vision-model' },
    material: { value: 'S355 structural steel', confidence: 94, source: 'label-ocr' },
    packaging: { value: 'Banded pack on timber dunnage', confidence: 92, source: 'vision-model' },
    weightKg: { value: 14720, confidence: 98, source: 'label-ocr', uncertainty: 60, unit: 'kg' },
    labelText: 'NORTHERN TRADER / PLATE PACK 07 / S355J2+N / NET 14 720 KG / 6000×2000×312',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Mill tag read as NET 14 720 KG, cross-checked against pack marking',
        status: 'used',
        value: 14720,
        confidence: 98,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Steel plate pack, 2 400–14 800 kg — consistent with label read',
        status: 'fallback-available',
        value: 13800,
        confidence: 74,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '3.75 m³ bounding box at 7 850 kg/m³, less 50 % pack void',
        status: 'fallback-available',
        value: 14730,
        confidence: 81,
      },
    ],
    flags: [FLAG_LIB.concealed],
    liftPlan: {
      rigging: { slingId: 'sl-chain-11t-4m', slingCount: 2, shackleId: 'sh-12-5t', shackleCount: 2, spreaderId: 'sp-plate-clamp' },
      slingAngleDeg: 90,
      liftingPointsPresent: true,
      liftingPointCount: 2,
      cogOffsetMm: { x: 40, y: 15 },
      craneId: 'crane-lhm-550',
      boomConfigId: 'lhm-hook',
      radiusM: 22,
      notes: 'Plate clamps checked and tagged by A. Balogun prior to first lift.',
    },
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-16T08:12:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1, {
        detail: '4 frames, all quality checks passed',
      }),
      audit('2026-09-16T08:12:26Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1, {
        detail: 'Pipeline completed in 8.1 s. All fields above 70 threshold.',
      }),
      audit('2026-09-16T08:31:00Z', 'usr-001', 'Daniel Okafor', 'Record re-opened for re-assessment', 1, {
        detail: 'Height re-measured after second plate added to pack',
      }),
      audit('2026-09-16T08:40:00Z', 'usr-001', 'Daniel Okafor', 'Field overridden', 2, {
        field: 'Height',
        from: '286 mm',
        to: '312 mm',
        reason: 'Physical measurement taken on site',
        detail: 'Tape measure at four corners, mean value recorded',
      }),
      audit('2026-09-16T09:02:00Z', 'usr-002', 'Marta Reinholt', 'Assessment verified and locked', 2, {
        detail: 'Lift plan approved for 22 m radius on LHM 550 hook duty',
      }),
    ],
    supersedes: 'asmt-0311-v1',
  },

  // 2) COMPLETED, HIGH CONFIDENCE -----------------------------------------
  {
    id: 'asmt-0310',
    ref: 'ASMT-2026-0310',
    jobId: 'job-0142',
    status: 'completed',
    version: 1,
    createdAt: '2026-09-16T10:44:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-16T10:44:29Z',
    captures: captureSet('asmt-0310', 'pipe', '2026-09-16T10:44:00Z'),
    cargoTypeId: 'cc-pipe-bundle-steel',
    dimensions: {
      length: { value: 12040, confidence: 93, source: 'vision-model', uncertainty: 40, unit: 'mm' },
      width: { value: 1210, confidence: 90, source: 'vision-model', uncertainty: 18, unit: 'mm' },
      height: { value: 1055, confidence: 88, source: 'vision-model', uncertainty: 18, unit: 'mm' },
      toleranceMm: 20,
    },
    cargoType: { value: 'Steel pipe bundle', confidence: 95, source: 'vision-model' },
    material: { value: 'API 5L seamless carbon steel', confidence: 89, source: 'label-ocr' },
    packaging: { value: 'Hexagonal bundle, 4 × steel strapping', confidence: 91, source: 'vision-model' },
    weightKg: { value: 8640, confidence: 86, source: 'label-ocr', uncertainty: 180, unit: 'kg' },
    labelText: 'API 5L X52 / 18 OFF 273.1 × 9.27 / BUNDLE WT 8 640 KG / HEAT 4471-22',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Bundle tag read as BUNDLE WT 8 640 KG',
        status: 'used',
        value: 8640,
        confidence: 86,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Steel pipe bundle, 1 800–9 600 kg',
        status: 'fallback-available',
        value: 8200,
        confidence: 71,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '15.4 m³ bounding box at 2 150 kg/m³ packed density',
        status: 'fallback-available',
        value: 8930,
        confidence: 77,
      },
    ],
    flags: [FLAG_LIB.unevenTop],
    liftPlan: {
      rigging: { slingId: 'sl-round-12t-6m', slingCount: 2, shackleId: 'sh-12-5t', shackleCount: 4, spreaderId: 'sp-25t-8m' },
      slingAngleDeg: 90,
      liftingPointsPresent: false,
      liftingPointCount: 0,
      cogOffsetMm: { x: 120, y: 30 },
      craneId: 'crane-lhm-550',
      boomConfigId: 'lhm-hook',
      radiusM: 26,
    },
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-16T10:44:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1, {
        detail: '4 frames, side elevation retaken once for tilt',
      }),
      audit('2026-09-16T10:44:29Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1, {
        detail: 'All fields above 70 threshold. Ready for confirmation.',
      }),
    ],
  },

  // 3) COMPLETED, LOW CONFIDENCE — forces manual entry ---------------------
  {
    id: 'asmt-0309',
    ref: 'ASMT-2026-0309',
    jobId: 'job-0142',
    status: 'completed',
    version: 1,
    createdAt: '2026-09-16T12:05:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-16T12:05:31Z',
    captures: captureSet('asmt-0309', 'pallet', '2026-09-16T12:05:00Z'),
    cargoTypeId: 'cc-mixed-pallet',
    dimensions: {
      length: { value: 1215, confidence: 84, source: 'vision-model', uncertainty: 25, unit: 'mm' },
      width: { value: 1005, confidence: 82, source: 'vision-model', uncertainty: 25, unit: 'mm' },
      height: { value: 1580, confidence: 64, source: 'vision-model', uncertainty: 95, unit: 'mm' },
      toleranceMm: 25,
    },
    cargoType: { value: 'Mixed consolidation pallet', confidence: 73, source: 'vision-model' },
    material: { value: 'Assorted — cartons, steel fittings', confidence: 58, source: 'vision-model' },
    packaging: { value: 'Shrink-wrapped mixed stack', confidence: 88, source: 'vision-model' },
    weightKg: { value: 620, confidence: 51, source: 'density-volume', uncertainty: 210, unit: 'kg' },
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'No weight declaration found — label obscured by stretch wrap',
        status: 'unavailable',
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Mixed consolidation pallet spans 240–1 100 kg — range too wide to resolve',
        status: 'unavailable',
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '1.93 m³ bounding box at 390 kg/m³ assumed mixed density',
        status: 'used',
        value: 620,
        confidence: 51,
      },
    ],
    flags: [FLAG_LIB.mixedPallet, FLAG_LIB.overhang, FLAG_LIB.cog],
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-16T12:05:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1, {
        detail: '4 frames, label frame flagged low subject fill',
      }),
      audit('2026-09-16T12:05:31Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1, {
        detail: 'Weight 51, material 58 and height 64 fall below the 70 threshold',
      }),
      audit('2026-09-16T12:06:10Z', 'usr-001', 'Daniel Okafor', 'Manual entry required', 1, {
        detail: '3 fields held for manual confirmation before the record can be confirmed',
      }),
    ],
  },

  // 4) OVERRIDDEN ----------------------------------------------------------
  {
    id: 'asmt-0308',
    ref: 'ASMT-2026-0308',
    jobId: 'job-0142',
    status: 'overridden',
    version: 1,
    createdAt: '2026-09-15T14:22:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-15T14:41:00Z',
    captures: captureSet('asmt-0308', 'pallet', '2026-09-15T14:22:00Z'),
    cargoTypeId: 'cc-std-pallet',
    dimensions: {
      length: { value: 1200, confidence: 92, source: 'vision-model', uncertainty: 12, unit: 'mm' },
      width: { value: 1000, confidence: 91, source: 'vision-model', uncertainty: 12, unit: 'mm' },
      height: {
        value: 1340,
        confidence: 100,
        source: 'manual',
        unit: 'mm',
        overridden: true,
        overriddenBy: 'usr-001',
        overrideReason: 'Physical measurement taken on site',
        overrideNote: 'Shrink hood compressed the top course; measured 1 340 mm at the corner post.',
        overriddenAt: '2026-09-15T14:38:00Z',
      },
      toleranceMm: 15,
    },
    cargoType: { value: 'Standard pallet — bagged goods', confidence: 94, source: 'vision-model' },
    material: { value: 'Woven polypropylene bags', confidence: 87, source: 'vision-model' },
    packaging: { value: 'Bagged, shrink-hooded on 1200×1000 pallet', confidence: 90, source: 'vision-model' },
    weightKg: {
      value: 1250,
      confidence: 100,
      source: 'manual',
      unit: 'kg',
      overridden: true,
      overriddenBy: 'usr-001',
      overrideReason: 'Weighbridge ticket available',
      overrideNote: 'Weighbridge ticket 44821 gives 1 250 kg net for this pallet.',
      overriddenAt: '2026-09-15T14:41:00Z',
    },
    labelText: 'HARTWELL AGGREGATES / 50 × 25 KG BAGS / GROSS 1 268 KG',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Read GROSS 1 268 KG — gross includes pallet, superseded by weighbridge net',
        status: 'skipped',
        value: 1268,
        confidence: 81,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Standard pallet — bagged goods, 500–1 250 kg',
        status: 'fallback-available',
        value: 1180,
        confidence: 76,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '1.61 m³ bounding box at 620 kg/m³',
        status: 'fallback-available',
        value: 998,
        confidence: 69,
      },
    ],
    flags: [FLAG_LIB.cog],
    liftPlan: {
      rigging: { slingId: 'sl-web-2t-2m', slingCount: 4, shackleId: 'sh-2t', shackleCount: 4 },
      slingAngleDeg: 60,
      liftingPointsPresent: false,
      liftingPointCount: 0,
      cogOffsetMm: { x: 180, y: 60 },
      craneId: 'crane-lhm-550',
      boomConfigId: 'lhm-hook',
      radiusM: 18,
    },
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-15T14:22:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1),
      audit('2026-09-15T14:22:28Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1),
      audit('2026-09-15T14:38:00Z', 'usr-001', 'Daniel Okafor', 'Field overridden', 1, {
        field: 'Height',
        from: '1 412 mm',
        to: '1 340 mm',
        reason: 'Physical measurement taken on site',
      }),
      audit('2026-09-15T14:41:00Z', 'usr-001', 'Daniel Okafor', 'Field overridden', 1, {
        field: 'Weight',
        from: '1 268 kg',
        to: '1 250 kg',
        reason: 'Weighbridge ticket available',
      }),
    ],
  },

  // 5) FAILED at OCR — retry path -----------------------------------------
  {
    id: 'asmt-0307',
    ref: 'ASMT-2026-0307',
    jobId: 'job-0138',
    status: 'failed',
    version: 1,
    createdAt: '2026-09-16T07:31:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-16T07:31:19Z',
    captures: captureSet('asmt-0307', 'crate', '2026-09-16T07:31:00Z', {
      quality: {
        label: {
          blur: 0.34,
          exposure: 0.88,
          tilt: 2.1,
          distance: 1.2,
          subjectFill: 0.38,
          passed: false,
          failedMetric: 'exposure',
          message: 'Label frame over-exposed — direct sun on laminated tag',
          guidance: 'Shade the label with your body and re-shoot from 400 mm.',
        },
      },
    }),
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
    weightKg: { value: 0, confidence: 0, source: 'label-ocr', unit: 'kg' },
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'OCR aborted — label frame rejected for exposure',
        status: 'unavailable',
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Not reached — pipeline halted before weight resolution',
        status: 'skipped',
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: 'Not reached — pipeline halted before weight resolution',
        status: 'skipped',
      },
    ],
    flags: [FLAG_LIB.concealed, FLAG_LIB.cog],
    pipeline: failedPipeline('ocr', 'OCR_LOW_CONTRAST — 0 of 1 label regions legible'),
    failure: {
      stageId: 'ocr',
      code: 'OCR_LOW_CONTRAST',
      message: 'Label OCR could not read any text region on the submitted label frame.',
      hint: 'Retake the label close-up in shade at roughly 400 mm, filling the frame with the tag, then retry.',
    },
    audit: [
      audit('2026-09-16T07:31:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1, {
        detail: '4 frames, label frame submitted despite exposure warning',
      }),
      audit('2026-09-16T07:31:19Z', 'usr-001', 'Daniel Okafor', 'Processing failed', 1, {
        detail: 'Stage: Label OCR. Code OCR_LOW_CONTRAST.',
      }),
    ],
  },

  // 6) PROCESSING — in flight ---------------------------------------------
  {
    id: 'asmt-0306',
    ref: 'ASMT-2026-0306',
    jobId: 'job-0138',
    status: 'processing',
    version: 1,
    createdAt: '2026-09-17T06:58:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-17T06:58:04Z',
    captures: captureSet('asmt-0306', 'crate', '2026-09-17T06:58:00Z'),
    cargoTypeId: 'cc-crated-turbine',
    dimensions: {
      length: { value: 4100, confidence: 0, source: 'vision-model', unit: 'mm' },
      width: { value: 2200, confidence: 0, source: 'vision-model', unit: 'mm' },
      height: { value: 2400, confidence: 0, source: 'vision-model', unit: 'mm' },
      toleranceMm: 30,
    },
    cargoType: { value: 'Crated turbine spare', confidence: 0, source: 'vision-model' },
    material: { value: 'Steel frame crate / alloy components', confidence: 0, source: 'vision-model' },
    packaging: { value: 'Steel-framed crate, shock-mounted', confidence: 0, source: 'vision-model' },
    weightKg: { value: 0, confidence: 0, source: 'label-ocr', unit: 'kg' },
    weightChain: [],
    flags: [],
    pipeline: partialPipeline('dimensions'),
    audit: [
      audit('2026-09-17T06:58:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1, {
        detail: '4 frames uploaded, 6.4 MB',
      }),
    ],
  },

  // 7) VERIFIED AND LOCKED, version 1 -------------------------------------
  {
    id: 'asmt-0305',
    ref: 'ASMT-2026-0305',
    jobId: 'job-0138',
    status: 'verified',
    version: 1,
    createdAt: '2026-09-14T09:15:00Z',
    createdBy: 'usr-003',
    updatedAt: '2026-09-14T10:05:00Z',
    verifiedBy: 'usr-002',
    verifiedAt: '2026-09-14T10:05:00Z',
    captures: captureSet('asmt-0305', 'crate', '2026-09-14T09:15:00Z'),
    cargoTypeId: 'cc-crated-machinery',
    dimensions: {
      length: { value: 3210, confidence: 94, source: 'vision-model', uncertainty: 20, unit: 'mm' },
      width: { value: 2090, confidence: 93, source: 'vision-model', uncertainty: 20, unit: 'mm' },
      height: { value: 2005, confidence: 92, source: 'vision-model', uncertainty: 20, unit: 'mm' },
      toleranceMm: 20,
    },
    cargoType: { value: 'Crated machinery', confidence: 96, source: 'vision-model' },
    material: { value: 'Plywood crate / fabricated steel', confidence: 90, source: 'label-ocr' },
    packaging: { value: 'Export plywood crate, ISPM 15 treated', confidence: 95, source: 'label-ocr' },
    weightKg: { value: 18400, confidence: 95, source: 'label-ocr', uncertainty: 100, unit: 'kg' },
    labelText: 'HARTWELL ENERGY / CASE 3 OF 7 / GROSS 18 400 KG / CoG MARKED / ISPM15 GB-0042',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'Case marking read as GROSS 18 400 KG with CoG mark present',
        status: 'used',
        value: 18400,
        confidence: 95,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Crated machinery, 900–22 000 kg',
        status: 'fallback-available',
        value: 16200,
        confidence: 68,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '13.45 m³ bounding box at 640 kg/m³ crate-average density',
        status: 'fallback-available',
        value: 8600,
        confidence: 44,
      },
    ],
    flags: [FLAG_LIB.concealed],
    liftPlan: {
      rigging: { slingId: 'sl-wire-16t-6m', slingCount: 4, shackleId: 'sh-25t', shackleCount: 4, spreaderId: 'sp-12t-6m' },
      slingAngleDeg: 60,
      liftingPointsPresent: true,
      liftingPointCount: 4,
      cogOffsetMm: { x: 60, y: 25 },
      craneId: 'crane-cc-2800',
      boomConfigId: 'cc-sshl-42',
      radiusM: 20,
      notes: 'Trial lift completed at 150 mm. No sling adjustment required.',
    },
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-14T09:15:00Z', 'usr-003', 'Ade Balogun', 'Capture set submitted', 1),
      audit('2026-09-14T09:15:31Z', 'usr-003', 'Ade Balogun', 'Assessment generated', 1),
      audit('2026-09-14T09:48:00Z', 'usr-001', 'Daniel Okafor', 'Lift plan completed', 1, {
        detail: 'CC 2800-1, SSHL 42 m at 20 m radius. Utilisation 9 %.',
      }),
      audit('2026-09-14T10:05:00Z', 'usr-002', 'Marta Reinholt', 'Assessment verified and locked', 1, {
        detail: 'Permit issued to vessel and crane cab.',
      }),
    ],
  },

  // 8) COMPLETED, HIGH CONFIDENCE ----------------------------------------
  {
    id: 'asmt-0304',
    ref: 'ASMT-2026-0304',
    jobId: 'job-0131',
    status: 'completed',
    version: 1,
    createdAt: '2026-09-15T15:40:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-15T15:40:27Z',
    captures: captureSet('asmt-0304', 'ibc', '2026-09-15T15:40:00Z'),
    cargoTypeId: 'cc-ibc-steel',
    dimensions: {
      length: { value: 1200, confidence: 96, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      width: { value: 1000, confidence: 96, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      height: { value: 1405, confidence: 94, source: 'vision-model', uncertainty: 10, unit: 'mm' },
      toleranceMm: 10,
    },
    cargoType: { value: 'Steel IBC — 1000 L', confidence: 97, source: 'vision-model' },
    material: { value: 'Stainless steel 316L', confidence: 93, source: 'label-ocr' },
    packaging: { value: 'Certified steel IBC with top lugs', confidence: 95, source: 'vision-model' },
    weightKg: { value: 1275, confidence: 91, source: 'label-ocr', uncertainty: 25, unit: 'kg' },
    labelText: 'UN 31A/Y/0326 / TARE 180 KG / MAX GROSS 1 280 KG / CONTENTS GLYCOL 60%',
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'UN plate read: TARE 180 KG, MAX GROSS 1 280 KG, contents 60 % fill',
        status: 'used',
        value: 1275,
        confidence: 91,
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Steel IBC — 1000 L, 180–1 280 kg',
        status: 'fallback-available',
        value: 1180,
        confidence: 78,
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '1.68 m³ bounding box at 1 120 kg/m³ filled density',
        status: 'fallback-available',
        value: 1310,
        confidence: 72,
      },
    ],
    flags: [],
    liftPlan: {
      rigging: { slingId: 'sl-web-4t-3m', slingCount: 4, shackleId: 'sh-4-75t', shackleCount: 4 },
      slingAngleDeg: 60,
      liftingPointsPresent: true,
      liftingPointCount: 4,
      cogOffsetMm: { x: 20, y: 10 },
      craneId: 'crane-tc-7032',
      boomConfigId: 'tc-4fall',
      radiusM: 36,
    },
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-15T15:40:00Z', 'usr-001', 'Daniel Okafor', 'Capture set submitted', 1),
      audit('2026-09-15T15:40:27Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1, {
        detail: 'All fields above 70 threshold.',
      }),
    ],
  },

  // 9) QUEUED OFFLINE ----------------------------------------------------
  {
    id: 'asmt-0303',
    ref: 'ASMT-2026-0303',
    jobId: 'job-0131',
    status: 'queued-offline',
    version: 1,
    createdAt: '2026-09-17T05:12:00Z',
    createdBy: 'usr-001',
    updatedAt: '2026-09-17T05:12:00Z',
    captures: captureSet('asmt-0303', 'drum', '2026-09-17T05:12:00Z'),
    cargoTypeId: 'cc-steel-drum',
    dimensions: {
      length: { value: 1200, confidence: 0, source: 'vision-model', unit: 'mm' },
      width: { value: 1000, confidence: 0, source: 'vision-model', unit: 'mm' },
      height: { value: 880, confidence: 0, source: 'vision-model', unit: 'mm' },
      toleranceMm: 20,
    },
    cargoType: { value: 'Steel drum — 205 L (×4 banded)', confidence: 0, source: 'declared' },
    material: { value: 'Mild steel', confidence: 0, source: 'declared' },
    packaging: { value: 'UN-approved closed-head drum', confidence: 0, source: 'declared' },
    weightKg: { value: 0, confidence: 0, source: 'label-ocr', unit: 'kg' },
    weightChain: [],
    flags: [],
    pipeline: freshPipeline(),
    audit: [
      audit('2026-09-17T05:12:00Z', 'usr-001', 'Daniel Okafor', 'Captured offline', 1, {
        detail: 'No terminal coverage in yard block C. Held in device queue, 4.2 MB.',
      }),
    ],
  },

  // 10) COMPLETED, LOW CONFIDENCE on dimensions --------------------------
  {
    id: 'asmt-0302',
    ref: 'ASMT-2026-0302',
    jobId: 'job-0131',
    status: 'completed',
    version: 1,
    createdAt: '2026-09-13T11:26:00Z',
    createdBy: 'usr-003',
    updatedAt: '2026-09-13T11:26:33Z',
    captures: captureSet('asmt-0302', 'irregular', '2026-09-13T11:26:00Z', {
      steps: ['front', 'side', 'corner'],
    }),
    cargoTypeId: 'cc-irregular-fabrication',
    dimensions: {
      length: { value: 5240, confidence: 61, source: 'vision-model', uncertainty: 180, unit: 'mm' },
      width: { value: 2380, confidence: 66, source: 'vision-model', uncertainty: 140, unit: 'mm' },
      height: { value: 2110, confidence: 59, source: 'vision-model', uncertainty: 160, unit: 'mm' },
      toleranceMm: 40,
    },
    cargoType: { value: 'Irregular steel fabrication', confidence: 79, source: 'vision-model' },
    material: { value: 'Welded structural steel', confidence: 84, source: 'vision-model' },
    packaging: { value: 'Unpackaged, painted finish', confidence: 91, source: 'vision-model' },
    weightKg: { value: 6900, confidence: 55, source: 'density-volume', uncertainty: 1400, unit: 'kg' },
    weightChain: [
      {
        method: 'label-ocr',
        label: 'Label read',
        detail: 'No label frame submitted — capture set has 3 of 4 frames',
        status: 'unavailable',
      },
      {
        method: 'catalogue',
        label: 'Catalogue lookup',
        detail: 'Irregular steel fabrication spans 1 200–15 000 kg — range too wide to resolve',
        status: 'unavailable',
      },
      {
        method: 'density-volume',
        label: 'Density × volume',
        detail: '26.3 m³ bounding box at 1 150 kg/m³ fabrication-average density, 78 % void assumed',
        status: 'used',
        value: 6900,
        confidence: 55,
      },
    ],
    flags: [FLAG_LIB.overhang, FLAG_LIB.unevenTop, FLAG_LIB.noPoints, FLAG_LIB.cog],
    pipeline: completedPipeline(),
    audit: [
      audit('2026-09-13T11:26:00Z', 'usr-003', 'Ade Balogun', 'Capture set submitted', 1, {
        detail: '3 frames — label close-up skipped, no label present on piece',
      }),
      audit('2026-09-13T11:26:33Z', 'usr-001', 'Daniel Okafor', 'Assessment generated', 1, {
        detail: 'All three dimensions and weight fall below the 70 threshold',
      }),
    ],
  },
]

export const LOW_CONFIDENCE_DEMO_ID = 'asmt-0309'
export const FAILED_DEMO_ID = 'asmt-0307'
export const PROCESSING_DEMO_ID = 'asmt-0306'
export const VERIFIED_DEMO_ID = 'asmt-0311'
export const QUEUED_DEMO_ID = 'asmt-0303'
