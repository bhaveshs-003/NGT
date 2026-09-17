import type { Assessment, ConfidenceTier, Field, FieldSource } from '@/types'

export function tier(confidence: number, threshold: number): ConfidenceTier {
  if (confidence >= 85) return 'high'
  if (confidence >= threshold) return 'mid'
  return 'low'
}

export const TIER_CLASSES: Record<ConfidenceTier, { text: string; bg: string; border: string; dot: string }> = {
  high: {
    text: 'text-conf-high',
    bg: 'bg-conf-high/12',
    border: 'border-conf-high/40',
    dot: 'bg-conf-high',
  },
  mid: {
    text: 'text-conf-mid',
    bg: 'bg-conf-mid/12',
    border: 'border-conf-mid/40',
    dot: 'bg-conf-mid',
  },
  low: {
    text: 'text-conf-low',
    bg: 'bg-conf-low/12',
    border: 'border-conf-low/40',
    dot: 'bg-conf-low',
  },
}

export const SOURCE_LABEL: Record<FieldSource, string> = {
  'vision-model': 'Vision model',
  'label-ocr': 'Label OCR',
  catalogue: 'Catalogue',
  'density-volume': 'Density × volume',
  manual: 'Manual entry',
  declared: 'Declared',
}

export const SOURCE_SHORT: Record<FieldSource, string> = {
  'vision-model': 'VISION',
  'label-ocr': 'OCR',
  catalogue: 'CAT',
  'density-volume': 'DENSITY',
  manual: 'MANUAL',
  declared: 'DECL',
}

export interface ScoredField {
  key: string
  label: string
  /** display value including unit */
  display: string
  raw: string | number
  field: Field<string | number>
  belowThreshold: boolean
}

function display(f: Field<string | number>): string {
  if (typeof f.value === 'number') {
    const unit = f.unit ? ` ${f.unit}` : ''
    return `${f.value.toLocaleString('en-GB')}${unit}`
  }
  return String(f.value)
}

/** Every confidence-scored field on a record, in permit order. */
export function scoredFields(a: Assessment, threshold: number): ScoredField[] {
  const entries: { key: string; label: string; field: Field<string | number> }[] = [
    { key: 'length', label: 'Length', field: a.dimensions.length },
    { key: 'width', label: 'Width', field: a.dimensions.width },
    { key: 'height', label: 'Height', field: a.dimensions.height },
    { key: 'cargoType', label: 'Cargo type', field: a.cargoType },
    { key: 'material', label: 'Material', field: a.material },
    { key: 'packaging', label: 'Packaging', field: a.packaging },
    { key: 'weightKg', label: 'Weight', field: a.weightKg },
  ]
  return entries.map((e) => ({
    ...e,
    display: display(e.field),
    raw: e.field.value,
    belowThreshold: e.field.confidence < threshold,
  }))
}

export function lowConfidenceFields(a: Assessment, threshold: number): ScoredField[] {
  return scoredFields(a, threshold).filter((f) => f.belowThreshold)
}

/** Mean confidence across all scored fields, used for the list badges. */
export function overallConfidence(a: Assessment): number {
  const fields = [
    a.dimensions.length,
    a.dimensions.width,
    a.dimensions.height,
    a.cargoType,
    a.material,
    a.packaging,
    a.weightKg,
  ]
  const scored = fields.filter((f) => f.confidence > 0)
  if (!scored.length) return 0
  return Math.round(scored.reduce((s, f) => s + f.confidence, 0) / scored.length)
}

export function uncertaintyRange(f: Field<string | number>): string | undefined {
  if (typeof f.value !== 'number' || !f.uncertainty) return undefined
  const lo = f.value - f.uncertainty
  const hi = f.value + f.uncertainty
  const unit = f.unit ? ` ${f.unit}` : ''
  return `${lo.toLocaleString('en-GB')} – ${hi.toLocaleString('en-GB')}${unit}`
}

export const OVERRIDE_REASONS = [
  'Physical measurement taken on site',
  'Weighbridge ticket available',
  'Shipping documents differ from label',
  'Label misread or damaged',
  'Obstructed or partial view at capture',
  'Cargo repacked since capture',
  'Local knowledge of this cargo type',
] as const

export type OverrideReason = (typeof OVERRIDE_REASONS)[number]
