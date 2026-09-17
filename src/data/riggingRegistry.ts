import type { RiggingRule, Shackle, Sling, SpreaderBeam } from '@/types'

export const SLINGS: Sling[] = [
  { id: 'sl-web-2t-2m', type: 'Duplex webbing sling', wllKg: 2000, weightKg: 1.4, lengthM: 2, material: 'Polyester webbing' },
  { id: 'sl-web-4t-3m', type: 'Duplex webbing sling', wllKg: 4000, weightKg: 2.8, lengthM: 3, material: 'Polyester webbing' },
  { id: 'sl-web-8t-4m', type: 'Duplex webbing sling', wllKg: 8000, weightKg: 6.2, lengthM: 4, material: 'Polyester webbing' },
  { id: 'sl-round-6t-4m', type: 'Round sling', wllKg: 6000, weightKg: 4.1, lengthM: 4, material: 'Polyester roundsling' },
  { id: 'sl-round-12t-6m', type: 'Round sling', wllKg: 12000, weightKg: 11.5, lengthM: 6, material: 'Polyester roundsling' },
  { id: 'sl-chain-5t-3m', type: 'Grade 80 chain sling', wllKg: 5300, weightKg: 9.8, lengthM: 3, material: 'Grade 80 alloy chain' },
  { id: 'sl-chain-11t-4m', type: 'Grade 100 chain sling', wllKg: 11200, weightKg: 18.6, lengthM: 4, material: 'Grade 100 alloy chain' },
  { id: 'sl-wire-16t-6m', type: 'Wire rope sling', wllKg: 16000, weightKg: 34.0, lengthM: 6, material: '6×36 IWRC wire rope' },
  { id: 'sl-wire-25t-8m', type: 'Wire rope sling', wllKg: 25000, weightKg: 68.0, lengthM: 8, material: '6×36 IWRC wire rope' },
]

export const SHACKLES: Shackle[] = [
  { id: 'sh-2t', type: 'Bow shackle, screw pin', swlKg: 2000, weightKg: 0.5, pinMm: 16 },
  { id: 'sh-4-75t', type: 'Bow shackle, safety bolt', swlKg: 4750, weightKg: 1.2, pinMm: 22 },
  { id: 'sh-8-5t', type: 'Bow shackle, safety bolt', swlKg: 8500, weightKg: 2.6, pinMm: 29 },
  { id: 'sh-12-5t', type: 'Bow shackle, safety bolt', swlKg: 12500, weightKg: 4.8, pinMm: 35 },
  { id: 'sh-25t', type: 'Bow shackle, safety bolt', swlKg: 25000, weightKg: 12.4, pinMm: 51 },
  { id: 'sh-35t', type: 'Bow shackle, safety bolt', swlKg: 35000, weightKg: 19.6, pinMm: 57 },
]

export const SPREADERS: SpreaderBeam[] = [
  { id: 'sp-5t-3m', name: 'Adjustable spreader beam 3 m', capacityKg: 5000, weightKg: 118, spanM: 3 },
  { id: 'sp-12t-6m', name: 'Modular spreader beam 6 m', capacityKg: 12000, weightKg: 340, spanM: 6 },
  { id: 'sp-25t-8m', name: 'Modular spreader beam 8 m', capacityKg: 25000, weightKg: 620, spanM: 8 },
  { id: 'sp-40t-12m', name: 'Heavy modular spreader 12 m', capacityKg: 40000, weightKg: 1450, spanM: 12 },
  { id: 'sp-plate-clamp', name: 'Plate clamp set with lifting beam', capacityKg: 8000, weightKg: 186, spanM: 2.4 },
  { id: 'sp-drum-cradle', name: 'Four-drum cradle', capacityKg: 1600, weightKg: 92, spanM: 1.4 },
  { id: 'sp-reel-shaft', name: 'Reel shaft and lifting frame', capacityKg: 10000, weightKg: 265, spanM: 3.2 },
]

/** One suggestion rule per cargo family, keyed to catalogue entries. */
export const RIGGING_RULES: RiggingRule[] = [
  {
    id: 'rr-pallet',
    cargoTypeIds: ['cc-euro-pallet', 'cc-std-pallet', 'cc-mixed-pallet'],
    slingId: 'sl-web-2t-2m',
    slingCount: 4,
    shackleId: 'sh-2t',
    shackleCount: 4,
    rationale:
      'Four-leg webbing set under the pallet bearers keeps load away from the wrap. Webbing avoids marking cartons.',
    recommendedAngleDeg: 60,
  },
  {
    id: 'rr-drum-pallet',
    cargoTypeIds: ['cc-chep-pallet'],
    slingId: 'sl-web-4t-3m',
    slingCount: 4,
    shackleId: 'sh-2t',
    shackleCount: 4,
    spreaderId: 'sp-drum-cradle',
    rationale: 'Cradle restrains banded drums laterally; banding must not carry any part of the load.',
    recommendedAngleDeg: 60,
  },
  {
    id: 'rr-plate',
    cargoTypeIds: ['cc-steel-plate-pack', 'cc-steel-plate-single'],
    slingId: 'sl-chain-11t-4m',
    slingCount: 2,
    shackleId: 'sh-12-5t',
    shackleCount: 2,
    spreaderId: 'sp-plate-clamp',
    rationale:
      'Plate clamps on a lifting beam give a vertical pull at both ends and stop pack slip. Chain tolerates plate edges with protection.',
    recommendedAngleDeg: 90,
  },
  {
    id: 'rr-pipe',
    cargoTypeIds: ['cc-pipe-bundle-steel', 'cc-pipe-bundle-coated', 'cc-pipe-single-large'],
    slingId: 'sl-round-12t-6m',
    slingCount: 2,
    shackleId: 'sh-12-5t',
    shackleCount: 4,
    spreaderId: 'sp-25t-8m',
    rationale:
      'Two roundslings at the quarter points under an 8 m spreader keep legs vertical and protect pipe coating.',
    recommendedAngleDeg: 90,
  },
  {
    id: 'rr-crate',
    cargoTypeIds: ['cc-crated-machinery', 'cc-crated-turbine'],
    slingId: 'sl-wire-16t-6m',
    slingCount: 4,
    shackleId: 'sh-25t',
    shackleCount: 4,
    spreaderId: 'sp-12t-6m',
    rationale:
      'Four-leg wire set to the marked crate slinging points, spread to keep legs off the crate sides.',
    recommendedAngleDeg: 60,
  },
  {
    id: 'rr-crate-heavy',
    cargoTypeIds: ['cc-crated-gearbox'],
    slingId: 'sl-wire-25t-8m',
    slingCount: 4,
    shackleId: 'sh-35t',
    shackleCount: 4,
    spreaderId: 'sp-40t-12m',
    rationale:
      'Heavy spreader keeps all four legs near vertical, which matters with a marked off-centre centre of gravity.',
    recommendedAngleDeg: 75,
  },
  {
    id: 'rr-drum',
    cargoTypeIds: ['cc-steel-drum', 'cc-plastic-drum'],
    slingId: 'sl-web-2t-2m',
    slingCount: 4,
    shackleId: 'sh-2t',
    shackleCount: 4,
    spreaderId: 'sp-drum-cradle',
    rationale: 'Cradle supports the drum base. Rolling hoops are not rated lifting points.',
    recommendedAngleDeg: 60,
  },
  {
    id: 'rr-ibc',
    cargoTypeIds: ['cc-ibc-tank', 'cc-ibc-steel'],
    slingId: 'sl-web-4t-3m',
    slingCount: 4,
    shackleId: 'sh-4-75t',
    shackleCount: 4,
    rationale:
      'Four equal legs to the certified top lugs. Where lugs are absent, revert to fork handling.',
    recommendedAngleDeg: 60,
  },
  {
    id: 'rr-bulk-bag',
    cargoTypeIds: ['cc-big-bag'],
    slingId: 'sl-web-2t-2m',
    slingCount: 1,
    shackleId: 'sh-4-75t',
    shackleCount: 1,
    rationale: 'Single master link through all four bag loops. Loops must be inspected for UV damage.',
    recommendedAngleDeg: 45,
  },
  {
    id: 'rr-reel',
    cargoTypeIds: ['cc-cable-reel'],
    slingId: 'sl-chain-5t-3m',
    slingCount: 2,
    shackleId: 'sh-8-5t',
    shackleCount: 2,
    spreaderId: 'sp-reel-shaft',
    rationale: 'Shaft through the reel barrel with a lifting frame. Flange slinging crushes the cable.',
    recommendedAngleDeg: 90,
  },
  {
    id: 'rr-skid',
    cargoTypeIds: ['cc-transformer-skid'],
    slingId: 'sl-wire-25t-8m',
    slingCount: 4,
    shackleId: 'sh-35t',
    shackleCount: 4,
    spreaderId: 'sp-40t-12m',
    rationale:
      'Skid lugs only, near-vertical legs under a heavy spreader to control the high centre of gravity.',
    recommendedAngleDeg: 80,
  },
  {
    id: 'rr-irregular',
    cargoTypeIds: ['cc-irregular-fabrication'],
    slingId: 'sl-chain-11t-4m',
    slingCount: 4,
    shackleId: 'sh-12-5t',
    shackleCount: 4,
    spreaderId: 'sp-25t-8m',
    rationale:
      'Adjustable chain legs allow level trim on an asymmetric piece. Trial lift required before the full lift.',
    recommendedAngleDeg: 60,
  },
]

export function sling(id: string): Sling | undefined {
  return SLINGS.find((s) => s.id === id)
}
export function shackle(id: string): Shackle | undefined {
  return SHACKLES.find((s) => s.id === id)
}
export function spreader(id?: string): SpreaderBeam | undefined {
  return id ? SPREADERS.find((s) => s.id === id) : undefined
}
export function ruleForCargoType(cargoTypeId: string): RiggingRule {
  return (
    RIGGING_RULES.find((r) => r.cargoTypeIds.includes(cargoTypeId)) ??
    RIGGING_RULES.find((r) => r.id === 'rr-irregular')!
  )
}
