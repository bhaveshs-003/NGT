import type { CaptureStepId } from '@/types'

export interface CaptureStepSpec {
  id: CaptureStepId
  index: number
  title: string
  short: string
  guidance: string
  hint: string
  /** shape of the framing overlay */
  overlay: 'rect-portrait' | 'rect-landscape' | 'corner-marks' | 'label-box'
  optional?: boolean
}

export const CAPTURE_STEPS: CaptureStepSpec[] = [
  {
    id: 'front',
    index: 1,
    title: 'Front elevation',
    short: 'Front',
    guidance: 'Stand square to the front face. Fit the whole unit inside the guide, including the dunnage.',
    hint: 'About 3 m back. Keep the deck line visible along the bottom of the frame.',
    overlay: 'rect-landscape',
  },
  {
    id: 'side',
    index: 2,
    title: 'Side elevation',
    short: 'Side',
    guidance: 'Move 90° round the load. Keep the device level so the dimension solver can square the box.',
    hint: 'Same distance as the front frame. Do not zoom between elevations.',
    overlay: 'rect-landscape',
  },
  {
    id: 'corner',
    index: 3,
    title: '45° corner',
    short: 'Corner',
    guidance: 'Shoot the near corner at roughly 45°. Two faces and the top edge must be visible.',
    hint: 'This frame resolves depth. Tilt beyond 5° will be rejected.',
    overlay: 'corner-marks',
  },
  {
    id: 'label',
    index: 4,
    title: 'Label close-up',
    short: 'Label',
    guidance: 'Fill the frame with the shipping label or mill tag. Shade it if the sun is on the laminate.',
    hint: 'About 400 mm. Weight declarations read from this frame take precedence over the catalogue.',
    overlay: 'label-box',
    optional: true,
  },
]

export function stepSpec(id: CaptureStepId): CaptureStepSpec {
  return CAPTURE_STEPS.find((s) => s.id === id)!
}
