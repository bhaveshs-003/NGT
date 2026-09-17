import type { CaptureStepId, QualityCheck } from '@/types'

// ---------------------------------------------------------------------------
// Simulated on-device quality gate.
//
// Real builds run this against the camera frame before upload. Here the
// outcome is a pure function of (step, attempt) so a walkthrough behaves
// identically every time: the 45° corner frame fails for tilt on the first
// attempt and passes on the retake. Everything else passes.
// ---------------------------------------------------------------------------

export interface QualityMetricSpec {
  key: keyof Pick<QualityCheck, 'blur' | 'exposure' | 'tilt' | 'distance' | 'subjectFill'>
  label: string
  /** how the value is rendered */
  format: (v: number) => string
  /** acceptable band, for the read-out */
  band: string
}

export const QUALITY_METRICS: QualityMetricSpec[] = [
  { key: 'blur', label: 'Sharpness', format: (v) => `${Math.round((1 - v) * 100)} %`, band: 'min 70 %' },
  { key: 'exposure', label: 'Exposure', format: (v) => `${Math.round(v * 100)} %`, band: '35–75 %' },
  { key: 'tilt', label: 'Device tilt', format: (v) => `${v.toFixed(1)}°`, band: 'max 5.0°' },
  { key: 'distance', label: 'Subject distance', format: (v) => `${v.toFixed(1)} m`, band: '1.5–6.0 m' },
  { key: 'subjectFill', label: 'Subject fill', format: (v) => `${Math.round(v * 100)} %`, band: 'min 55 %' },
]

const FAIL_COPY: Record<NonNullable<QualityCheck['failedMetric']>, { message: string; guidance: string }> = {
  blur: {
    message: 'Frame is soft — motion blur detected',
    guidance: 'Brace the device against the rail and hold for a second after the shutter.',
  },
  exposure: {
    message: 'Frame over-exposed — direct sun on the subject',
    guidance: 'Shade the subject with your body or step round so the sun is behind you.',
  },
  tilt: {
    message: 'Device tilted beyond 5° — dimensions cannot be solved',
    guidance: 'Level the device using the on-screen guide, then re-shoot square to the face.',
  },
  distance: {
    message: 'Standing too close — the full face is not in frame',
    guidance: 'Step back to about 3 m so the whole cargo unit sits inside the guide.',
  },
  subjectFill: {
    message: 'Subject fills only 31 % of the frame',
    guidance: 'Move closer or zoom so the cargo fills at least half the guide box.',
  },
}

/** Deterministic per-step failure script for the demo. */
const FAILURE_SCRIPT: Partial<Record<CaptureStepId, { attempt: number; metric: NonNullable<QualityCheck['failedMetric']> }>> = {
  corner: { attempt: 1, metric: 'tilt' },
}

function jitter(step: CaptureStepId, attempt: number, salt: number): number {
  // Small stable variation so the read-out does not look copy-pasted.
  const base = step.length * 31 + attempt * 17 + salt * 7
  return ((base % 13) - 6) / 100
}

export function runQualityGate(
  step: CaptureStepId,
  attempt: number,
  source: 'camera' | 'gallery' = 'camera',
): QualityCheck {
  const scripted = FAILURE_SCRIPT[step]
  const shouldFail = source === 'camera' && scripted != null && scripted.attempt === attempt

  if (shouldFail) {
    const metric = scripted!.metric
    const failing: QualityCheck = {
      blur: 0.09,
      exposure: 0.54,
      tilt: 7.8,
      distance: 3.1,
      subjectFill: 0.64,
      passed: false,
      failedMetric: metric,
      ...FAIL_COPY[metric],
    }
    if (metric === 'blur') failing.blur = 0.41
    if (metric === 'exposure') failing.exposure = 0.89
    if (metric === 'distance') failing.distance = 0.9
    if (metric === 'subjectFill') failing.subjectFill = 0.31
    return failing
  }

  return {
    blur: Math.max(0.04, 0.1 + jitter(step, attempt, 1)),
    exposure: 0.52 + jitter(step, attempt, 2),
    tilt: Math.max(0.3, 1.8 + jitter(step, attempt, 3) * 10),
    distance: 2.9 + jitter(step, attempt, 4) * 4,
    subjectFill: Math.min(0.94, 0.72 + jitter(step, attempt, 5)),
    passed: true,
  }
}

export function metricValueLabel(q: QualityCheck, key: QualityMetricSpec['key']): string {
  const spec = QUALITY_METRICS.find((m) => m.key === key)!
  return spec.format(q[key])
}

export function metricPasses(q: QualityCheck, key: QualityMetricSpec['key']): boolean {
  if (!q.passed && q.failedMetric === key) return false
  switch (key) {
    case 'blur':
      return q.blur <= 0.3
    case 'exposure':
      return q.exposure >= 0.35 && q.exposure <= 0.75
    case 'tilt':
      return q.tilt <= 5
    case 'distance':
      return q.distance >= 1.5 && q.distance <= 6
    case 'subjectFill':
      return q.subjectFill >= 0.55
  }
}
