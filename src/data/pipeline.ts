import type { PipelineStage } from '@/types'

/**
 * The seven-stage inference pipeline shown on the processing screen.
 * Durations sum to ~8.0 s of simulated work.
 */
export const PIPELINE_TEMPLATE: Omit<PipelineStage, 'state'>[] = [
  {
    id: 'detection',
    label: 'Detection',
    detail: 'Locating cargo unit and quay reference features',
    duration: 900,
  },
  {
    id: 'segmentation',
    label: 'Segmentation',
    detail: 'Separating cargo from dunnage, deck and background',
    duration: 1100,
  },
  {
    id: 'dimensions',
    label: 'Dimension computation',
    detail: 'Solving bounding box from three elevations',
    duration: 1400,
  },
  {
    id: 'classification',
    label: 'Classification',
    detail: 'Matching cargo type, material and packaging against catalogue',
    duration: 1200,
  },
  {
    id: 'ocr',
    label: 'Label OCR',
    detail: 'Reading shipping marks, weight declarations and handling codes',
    duration: 1300,
  },
  {
    id: 'weight',
    label: 'Weight resolution',
    detail: 'Applying label, catalogue and density precedence chain',
    duration: 1100,
  },
  {
    id: 'confidence',
    label: 'Confidence scoring',
    detail: 'Scoring each derived field and flagging values below threshold',
    duration: 1000,
  },
]

export function freshPipeline(): PipelineStage[] {
  return PIPELINE_TEMPLATE.map((s) => ({ ...s, state: 'pending' }))
}

export function completedPipeline(): PipelineStage[] {
  return PIPELINE_TEMPLATE.map((s) => ({ ...s, state: 'complete' }))
}

/** Pipeline frozen part-way through, for the seeded in-flight record. */
export function partialPipeline(upToId: PipelineStage['id']): PipelineStage[] {
  const idx = PIPELINE_TEMPLATE.findIndex((s) => s.id === upToId)
  return PIPELINE_TEMPLATE.map((s, i) => ({
    ...s,
    state: i < idx ? 'complete' : i === idx ? 'running' : 'pending',
  }))
}

/** Pipeline stopped by a failure at the given stage. */
export function failedPipeline(atId: PipelineStage['id'], note: string): PipelineStage[] {
  const idx = PIPELINE_TEMPLATE.findIndex((s) => s.id === atId)
  return PIPELINE_TEMPLATE.map((s, i) => ({
    ...s,
    state: i < idx ? 'complete' : i === idx ? 'failed' : 'pending',
    note: i === idx ? note : undefined,
  }))
}

export const STAGE_LABEL: Record<PipelineStage['id'], string> = PIPELINE_TEMPLATE.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.label }),
  {} as Record<PipelineStage['id'], string>,
)
