import { capacityAt, crane } from '@/data/craneLoadCharts'
import { shackle, sling, spreader } from '@/data/riggingRegistry'
import type { Assessment, LiftPlan, Settings } from '@/types'

export interface RiggingBreakdownItem {
  label: string
  detail: string
  qty: number
  unitWeightKg: number
  totalKg: number
  wllKg?: number
}

export interface LiftCalculation {
  cargoKg: number
  rigging: RiggingBreakdownItem[]
  riggingKg: number
  subtotalKg: number
  contingencyPct: number
  contingencyKg: number
  grossKg: number
  /** load per sling leg allowing for angle */
  legLoadKg: number
  /** 1 / sin(angle) */
  angleFactor: number
  slingWllKg: number
  slingUtilisationPct: number
  slingAdequate: boolean
  craneName: string
  craneModel: string
  boomLabel: string
  radiusM: number
  capacityKg: number
  utilisationPct: number
  overCapacity: boolean
  nearCapacity: boolean
  bbVolumeM3: number
}

export function volumeM3(a: Assessment): number {
  const { length, width, height } = a.dimensions
  return (length.value / 1000) * (width.value / 1000) * (height.value / 1000)
}

export function riggingBreakdown(plan: LiftPlan): RiggingBreakdownItem[] {
  const items: RiggingBreakdownItem[] = []
  const sl = sling(plan.rigging.slingId)
  if (sl) {
    items.push({
      label: sl.type,
      detail: `${sl.material}, ${sl.lengthM} m, WLL ${sl.wllKg.toLocaleString('en-GB')} kg`,
      qty: plan.rigging.slingCount,
      unitWeightKg: sl.weightKg,
      totalKg: +(sl.weightKg * plan.rigging.slingCount).toFixed(1),
      wllKg: sl.wllKg,
    })
  }
  const sh = shackle(plan.rigging.shackleId)
  if (sh) {
    items.push({
      label: sh.type,
      detail: `${sh.pinMm} mm pin, SWL ${sh.swlKg.toLocaleString('en-GB')} kg`,
      qty: plan.rigging.shackleCount,
      unitWeightKg: sh.weightKg,
      totalKg: +(sh.weightKg * plan.rigging.shackleCount).toFixed(1),
      wllKg: sh.swlKg,
    })
  }
  const sp = spreader(plan.rigging.spreaderId)
  if (sp) {
    items.push({
      label: sp.name,
      detail: `${sp.spanM} m span, capacity ${sp.capacityKg.toLocaleString('en-GB')} kg`,
      qty: 1,
      unitWeightKg: sp.weightKg,
      totalKg: sp.weightKg,
      wllKg: sp.capacityKg,
    })
  }
  return items
}

export function calculateLift(a: Assessment, plan: LiftPlan, settings: Settings): LiftCalculation {
  const cargoKg = a.weightKg.value
  const rigging = riggingBreakdown(plan)
  const riggingKg = +rigging.reduce((s, i) => s + i.totalKg, 0).toFixed(1)
  const subtotalKg = cargoKg + riggingKg
  const contingencyKg = Math.round(subtotalKg * (settings.contingencyPct / 100))
  const grossKg = Math.round(subtotalKg + contingencyKg)

  const angleRad = (plan.slingAngleDeg * Math.PI) / 180
  const angleFactor = +(1 / Math.sin(angleRad)).toFixed(3)
  const legs = Math.max(1, plan.rigging.slingCount)
  // Conservative: assume load carried on two diagonal legs of a four-leg set.
  const sharingLegs = legs >= 4 ? 2 : legs
  const legLoadKg = Math.round((grossKg / sharingLegs) * angleFactor)

  const sl = sling(plan.rigging.slingId)
  const slingWllKg = sl?.wllKg ?? 0
  const slingUtilisationPct = slingWllKg ? +((legLoadKg / slingWllKg) * 100).toFixed(1) : 0

  const c = crane(plan.craneId)
  const boom = c.boomConfigs.find((b) => b.id === plan.boomConfigId) ?? c.boomConfigs[0]
  const capacityKg = capacityAt(plan.craneId, boom.id, plan.radiusM)
  const utilisationPct = capacityKg ? +((grossKg / capacityKg) * 100).toFixed(1) : 999

  return {
    cargoKg,
    rigging,
    riggingKg,
    subtotalKg,
    contingencyPct: settings.contingencyPct,
    contingencyKg,
    grossKg,
    legLoadKg,
    angleFactor,
    slingWllKg,
    slingUtilisationPct,
    slingAdequate: slingWllKg > 0 && legLoadKg <= slingWllKg,
    craneName: c.name,
    craneModel: c.model,
    boomLabel: boom.label,
    radiusM: plan.radiusM,
    capacityKg,
    utilisationPct,
    overCapacity: utilisationPct > 100,
    nearCapacity: utilisationPct > settings.utilisationWarnPct,
    bbVolumeM3: +volumeM3(a).toFixed(2),
  }
}

/** Default plan when a record has not had a lift plan built yet. */
export function defaultLiftPlan(a: Assessment, craneId: LiftPlan['craneId'], rule: {
  slingId: string
  slingCount: number
  shackleId: string
  shackleCount: number
  spreaderId?: string
  recommendedAngleDeg: number
}): LiftPlan {
  const c = crane(craneId)
  const hasPoints = !a.flags.some((f) => f.id === 'no-lifting-points')
  const cogFlag = a.flags.find((f) => f.id === 'cog-offset')
  return {
    rigging: {
      slingId: rule.slingId,
      slingCount: rule.slingCount,
      shackleId: rule.shackleId,
      shackleCount: rule.shackleCount,
      spreaderId: rule.spreaderId,
    },
    slingAngleDeg: rule.recommendedAngleDeg,
    liftingPointsPresent: hasPoints,
    liftingPointCount: hasPoints ? rule.slingCount : 0,
    cogOffsetMm: cogFlag ? { x: 165, y: 55 } : { x: 25, y: 12 },
    craneId,
    boomConfigId: c.boomConfigs[0].id,
    radiusM: c.chart[Math.floor(c.chart.length / 3)].radiusM,
  }
}

export const SLING_ANGLE_OPTIONS = [30, 45, 60, 75, 90]

/** Advisory text for a given included sling angle. */
export function angleAdvice(deg: number): { text: string; severity: 'info' | 'caution' | 'critical' } {
  if (deg < 45)
    return {
      text: 'Below 45° the leg tension rises sharply. Lengthen the slings or fit a spreader.',
      severity: 'critical',
    }
  if (deg < 60)
    return { text: 'Acceptable, but leg tension is well above the share of the load.', severity: 'caution' }
  if (deg < 90) return { text: 'Within the normal working range for a multi-leg set.', severity: 'info' }
  return { text: 'Legs vertical. Leg load equals its share of the gross weight.', severity: 'info' }
}

/** Centre-of-gravity offset assessment against the bounding box. */
export function cogAssessment(a: Assessment, plan: LiftPlan): {
  offsetPctX: number
  offsetPctY: number
  severity: 'info' | 'caution' | 'critical'
  text: string
} {
  const halfL = a.dimensions.length.value / 2
  const halfW = a.dimensions.width.value / 2
  const offsetPctX = halfL ? +((plan.cogOffsetMm.x / halfL) * 100).toFixed(1) : 0
  const offsetPctY = halfW ? +((plan.cogOffsetMm.y / halfW) * 100).toFixed(1) : 0
  const worst = Math.max(offsetPctX, offsetPctY)
  if (worst >= 10)
    return {
      offsetPctX,
      offsetPctY,
      severity: 'critical',
      text: `Centre of gravity sits ${plan.cogOffsetMm.x} mm off the geometric centre (${worst.toFixed(0)} % of the half-span). Trial lift and sling adjustment required.`,
    }
  if (worst >= 5)
    return {
      offsetPctX,
      offsetPctY,
      severity: 'caution',
      text: `Minor centre-of-gravity offset of ${plan.cogOffsetMm.x} mm. Watch for tilt as the load leaves the deck.`,
    }
  return {
    offsetPctX,
    offsetPctY,
    severity: 'info',
    text: 'Centre of gravity is effectively central. No sling adjustment expected.',
  }
}
