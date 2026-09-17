import { freshPipeline } from '@/data/pipeline'
import { scenarioAt } from '@/services/mock/inference'
import type { CaptureDraft } from '@/store/useApp'
import { uid } from '@/store/useApp'
import type { Assessment, Capture, User } from '@/types'

/**
 * Turns a completed capture draft into a record in the pre-inference state.
 * Derived fields stay at zero confidence until the pipeline has run.
 */
export function buildAssessmentFromDraft(
  draft: CaptureDraft,
  user: User,
  counter: number,
  status: 'processing' | 'queued-offline',
): Assessment {
  const scenario = scenarioAt(draft.scenario)
  const captures = Object.values(draft.frames).filter(Boolean) as Capture[]
  const now = new Date().toISOString()
  const ref = `ASMT-2026-${(312 + counter).toString().padStart(4, '0')}`

  const blank = <T,>(value: T, unit?: string) => ({
    value,
    confidence: 0,
    source: 'vision-model' as const,
    unit,
  })

  return {
    id: uid('asmt'),
    ref,
    jobId: draft.jobId,
    status,
    version: 1,
    createdAt: now,
    createdBy: user.id,
    updatedAt: now,
    captures,
    cargoTypeId: scenario.result.cargoTypeId,
    scenarioId: scenario.id,
    dimensions: {
      length: blank(0, 'mm'),
      width: blank(0, 'mm'),
      height: blank(0, 'mm'),
      toleranceMm: scenario.result.dimensions.toleranceMm,
    },
    cargoType: blank('Awaiting classification'),
    material: blank('Awaiting classification'),
    packaging: blank('Awaiting classification'),
    weightKg: blank(0, 'kg'),
    weightChain: [],
    flags: [],
    pipeline: freshPipeline(),
    audit: [
      {
        id: uid('aud'),
        at: now,
        actorId: user.id,
        actorName: user.name,
        action: status === 'processing' ? 'Capture set submitted' : 'Captured offline',
        detail:
          status === 'processing'
            ? `${captures.length} frame${captures.length === 1 ? '' : 's'} uploaded from ${user.deviceId}`
            : `${captures.length} frame${captures.length === 1 ? '' : 's'} held in the device queue — no terminal coverage`,
        version: 1,
      },
    ],
  }
}

/** Applies a seeded inference result to a record once the pipeline completes. */
export function applyInferenceResult(
  a: Assessment,
  result: import('@/services/mock/inference').InferenceResult,
  user: User,
  threshold: number,
): Partial<Assessment> {
  const now = new Date().toISOString()
  const scored = [
    result.dimensions.length,
    result.dimensions.width,
    result.dimensions.height,
    result.cargoType,
    result.material,
    result.packaging,
    result.weightKg,
  ]
  const below = scored.filter((f) => f.confidence < threshold).length

  return {
    status: 'completed',
    updatedAt: now,
    cargoTypeId: result.cargoTypeId,
    dimensions: result.dimensions,
    cargoType: result.cargoType,
    material: result.material,
    packaging: result.packaging,
    weightKg: result.weightKg,
    weightChain: result.weightChain,
    flags: result.flags,
    labelText: result.labelText,
    failure: undefined,
    audit: [
      ...a.audit,
      {
        id: uid('aud'),
        at: now,
        actorId: user.id,
        actorName: user.name,
        action: 'Assessment generated',
        detail:
          below === 0
            ? `Pipeline completed. All fields at or above the ${threshold} threshold.`
            : `Pipeline completed. ${below} field${below === 1 ? '' : 's'} below the ${threshold} threshold — manual entry required.`,
        version: a.version,
      },
    ],
  }
}
