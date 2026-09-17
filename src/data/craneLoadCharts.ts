import type { CraneId, CraneLoadChart } from '@/types'

/**
 * Abridged load charts. Capacities are indicative demo figures, not a
 * substitute for the manufacturer chart on the machine.
 */
export const CRANE_LOAD_CHARTS: CraneLoadChart[] = [
  {
    id: 'crane-lhm-550',
    name: 'Liebherr LHM 550',
    type: 'Mobile harbour',
    model: 'LHM 550 — 144 t max',
    maxCapacityKg: 144000,
    boomConfigs: [
      { id: 'lhm-hook', label: 'Hook operation, 4-rope', boomLengthM: 54, counterweightT: 0 },
      { id: 'lhm-grab', label: 'Grab operation, 4-rope', boomLengthM: 54, counterweightT: 0 },
    ],
    chart: [
      { radiusM: 11, capacityKg: { 'lhm-hook': 144000, 'lhm-grab': 63000 } },
      { radiusM: 14, capacityKg: { 'lhm-hook': 144000, 'lhm-grab': 63000 } },
      { radiusM: 18, capacityKg: { 'lhm-hook': 132000, 'lhm-grab': 60000 } },
      { radiusM: 22, capacityKg: { 'lhm-hook': 108000, 'lhm-grab': 54000 } },
      { radiusM: 26, capacityKg: { 'lhm-hook': 88000, 'lhm-grab': 47000 } },
      { radiusM: 30, capacityKg: { 'lhm-hook': 74000, 'lhm-grab': 41000 } },
      { radiusM: 34, capacityKg: { 'lhm-hook': 62000, 'lhm-grab': 35000 } },
      { radiusM: 38, capacityKg: { 'lhm-hook': 53000, 'lhm-grab': 30000 } },
      { radiusM: 42, capacityKg: { 'lhm-hook': 45000, 'lhm-grab': 25000 } },
      { radiusM: 46, capacityKg: { 'lhm-hook': 38000, 'lhm-grab': 21000 } },
      { radiusM: 50, capacityKg: { 'lhm-hook': 32000, 'lhm-grab': 18000 } },
      { radiusM: 54, capacityKg: { 'lhm-hook': 26000, 'lhm-grab': 14000 } },
    ],
  },
  {
    id: 'crane-cc-2800',
    name: 'Demag CC 2800-1',
    type: 'Crawler',
    model: 'CC 2800-1 — 600 t max',
    maxCapacityKg: 600000,
    boomConfigs: [
      { id: 'cc-sshl-42', label: 'SSHL main boom 42 m, 160 t CW', boomLengthM: 42, counterweightT: 160 },
      { id: 'cc-sshl-66', label: 'SSHL main boom 66 m, 160 t CW', boomLengthM: 66, counterweightT: 160 },
      { id: 'cc-sshl-84', label: 'SSHL main boom 84 m, 100 t CW', boomLengthM: 84, counterweightT: 100 },
    ],
    chart: [
      { radiusM: 12, capacityKg: { 'cc-sshl-42': 336000, 'cc-sshl-66': 214000, 'cc-sshl-84': 148000 } },
      { radiusM: 16, capacityKg: { 'cc-sshl-42': 268000, 'cc-sshl-66': 186000, 'cc-sshl-84': 132000 } },
      { radiusM: 20, capacityKg: { 'cc-sshl-42': 214000, 'cc-sshl-66': 158000, 'cc-sshl-84': 116000 } },
      { radiusM: 24, capacityKg: { 'cc-sshl-42': 176000, 'cc-sshl-66': 136000, 'cc-sshl-84': 102000 } },
      { radiusM: 28, capacityKg: { 'cc-sshl-42': 148000, 'cc-sshl-66': 118000, 'cc-sshl-84': 90000 } },
      { radiusM: 34, capacityKg: { 'cc-sshl-42': 116000, 'cc-sshl-66': 96000, 'cc-sshl-84': 76000 } },
      { radiusM: 40, capacityKg: { 'cc-sshl-42': 92000, 'cc-sshl-66': 79000, 'cc-sshl-84': 64000 } },
      { radiusM: 48, capacityKg: { 'cc-sshl-42': 68000, 'cc-sshl-66': 62000, 'cc-sshl-84': 52000 } },
      { radiusM: 56, capacityKg: { 'cc-sshl-42': 0, 'cc-sshl-66': 49000, 'cc-sshl-84': 42000 } },
      { radiusM: 64, capacityKg: { 'cc-sshl-42': 0, 'cc-sshl-66': 39000, 'cc-sshl-84': 34000 } },
    ],
  },
  {
    id: 'crane-tc-7032',
    name: 'Potain MDT 389',
    type: 'Tower',
    model: 'MDT 389 L16 — 16 t max',
    maxCapacityKg: 16000,
    boomConfigs: [
      { id: 'tc-2fall', label: 'Jib 75 m, 2-fall reeving', boomLengthM: 75, counterweightT: 0 },
      { id: 'tc-4fall', label: 'Jib 75 m, 4-fall reeving', boomLengthM: 75, counterweightT: 0 },
    ],
    chart: [
      { radiusM: 12, capacityKg: { 'tc-2fall': 8000, 'tc-4fall': 16000 } },
      { radiusM: 18, capacityKg: { 'tc-2fall': 8000, 'tc-4fall': 16000 } },
      { radiusM: 24, capacityKg: { 'tc-2fall': 8000, 'tc-4fall': 13900 } },
      { radiusM: 30, capacityKg: { 'tc-2fall': 8000, 'tc-4fall': 10800 } },
      { radiusM: 36, capacityKg: { 'tc-2fall': 7700, 'tc-4fall': 8800 } },
      { radiusM: 42, capacityKg: { 'tc-2fall': 6400, 'tc-4fall': 7300 } },
      { radiusM: 50, capacityKg: { 'tc-2fall': 5200, 'tc-4fall': 5900 } },
      { radiusM: 58, capacityKg: { 'tc-2fall': 4300, 'tc-4fall': 4800 } },
      { radiusM: 66, capacityKg: { 'tc-2fall': 3600, 'tc-4fall': 4000 } },
      { radiusM: 75, capacityKg: { 'tc-2fall': 2950, 'tc-4fall': 3300 } },
    ],
  },
]

export function crane(id: CraneId): CraneLoadChart {
  return CRANE_LOAD_CHARTS.find((c) => c.id === id) ?? CRANE_LOAD_CHARTS[0]
}

/**
 * Linear interpolation between chart rows, which is how a field supervisor
 * would read between two printed radii.
 */
export function capacityAt(craneId: CraneId, boomConfigId: string, radiusM: number): number {
  const c = crane(craneId)
  const rows = c.chart
  if (radiusM <= rows[0].radiusM) return rows[0].capacityKg[boomConfigId] ?? 0
  const last = rows[rows.length - 1]
  if (radiusM >= last.radiusM) return last.capacityKg[boomConfigId] ?? 0
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]
    const b = rows[i + 1]
    if (radiusM >= a.radiusM && radiusM <= b.radiusM) {
      const ca = a.capacityKg[boomConfigId] ?? 0
      const cb = b.capacityKg[boomConfigId] ?? 0
      const t = (radiusM - a.radiusM) / (b.radiusM - a.radiusM)
      return Math.round((ca + (cb - ca) * t) / 100) * 100
    }
  }
  return 0
}

export function radiusRange(craneId: CraneId): { min: number; max: number } {
  const rows = crane(craneId).chart
  return { min: rows[0].radiusM, max: rows[rows.length - 1].radiusM }
}
