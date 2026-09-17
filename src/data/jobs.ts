import type { Job } from '@/types'

export const JOBS: Job[] = [
  {
    id: 'job-0142',
    ref: 'JOB-2026-0142',
    title: 'MV Northern Trader — breakbulk discharge',
    vessel: 'MV Northern Trader',
    berth: 'Berth 4, Riverside Quay',
    cargoSummary: 'Mixed breakbulk: steel plate packs, pipe bundles, palletised fittings',
    craneId: 'crane-lhm-550',
    createdAt: '2026-09-14T06:10:00Z',
    createdBy: 'usr-002',
    status: 'active',
    shift: 'Day shift 06:00–18:00',
  },
  {
    id: 'job-0138',
    ref: 'JOB-2026-0138',
    title: 'Hartwell Energy — turbine spares project cargo',
    vessel: 'MV Baltic Pioneer',
    berth: 'Berth 7, Heavy Lift Pad',
    cargoSummary: 'Crated machinery and gearbox assemblies, 4 lifts over 18 t',
    craneId: 'crane-cc-2800',
    createdAt: '2026-09-11T05:45:00Z',
    createdBy: 'usr-002',
    status: 'active',
    shift: 'Day shift 06:00–18:00',
  },
  {
    id: 'job-0131',
    ref: 'JOB-2026-0131',
    title: 'Terminal 2 yard consolidation',
    vessel: 'Yard operation — no vessel',
    berth: 'Yard block C, Terminal 2',
    cargoSummary: 'IBC tanks and steel drums for re-stow onto flat racks',
    craneId: 'crane-tc-7032',
    createdAt: '2026-09-08T07:20:00Z',
    createdBy: 'usr-001',
    status: 'active',
    shift: 'Back shift 14:00–22:00',
  },
  {
    // Deliberately carries zero assessments to exercise the empty state.
    id: 'job-0147',
    ref: 'JOB-2026-0147',
    title: 'MV Clyde Venture — inbound project pieces',
    vessel: 'MV Clyde Venture',
    berth: 'Berth 2, Riverside Quay',
    cargoSummary: 'Awaiting stowage plan — transformer skids and cable reels expected',
    craneId: 'crane-lhm-550',
    createdAt: '2026-09-16T16:30:00Z',
    createdBy: 'usr-001',
    status: 'active',
    shift: 'Day shift 06:00–18:00',
  },
]

export const CRANE_TYPE_OPTIONS: { id: Job['craneId']; label: string }[] = [
  { id: 'crane-lhm-550', label: 'Liebherr LHM 550 — mobile harbour crane' },
  { id: 'crane-cc-2800', label: 'Demag CC 2800-1 — crawler crane' },
  { id: 'crane-tc-7032', label: 'Potain MDT 389 — tower crane' },
]

export const BERTH_OPTIONS = [
  'Berth 2, Riverside Quay',
  'Berth 4, Riverside Quay',
  'Berth 7, Heavy Lift Pad',
  'Yard block C, Terminal 2',
  'Yard block F, Terminal 2',
]
