import type { User } from '@/types'

export const CURRENT_USER: User = {
  id: 'usr-001',
  name: 'Daniel Okafor',
  email: 'd.okafor@ngt-lifting.com',
  password: 'Quayside2026',
  company: 'NGT Lifting & Cargo Services',
  role: 'Lifting Supervisor',
  deviceId: 'NGT-FLD-7741-A',
  phone: '+44 7700 900412',
  certification: 'LEEA Appointed Person — Lifting Operations',
  certExpiry: '2027-04-30',
  avatarInitials: 'DO',
}

/** Additional users referenced by audit trails and verification stamps. */
export const OTHER_USERS: User[] = [
  {
    id: 'usr-002',
    name: 'Marta Reinholt',
    email: 'm.reinholt@ngt-lifting.com',
    company: 'NGT Lifting & Cargo Services',
    role: 'Terminal Superintendent',
    deviceId: 'NGT-FLD-7712-C',
    phone: '+44 7700 900188',
    certification: 'Terminal Operations — Lift Plan Approver',
    certExpiry: '2026-11-15',
    avatarInitials: 'MR',
  },
  {
    id: 'usr-003',
    name: 'Ade Balogun',
    email: 'a.balogun@ngt-lifting.com',
    company: 'NGT Lifting & Cargo Services',
    role: 'Crane Operator',
    deviceId: 'NGT-FLD-7729-B',
    phone: '+44 7700 900254',
    certification: 'CPCS A61 — Mobile Harbour Crane',
    certExpiry: '2026-08-02',
    avatarInitials: 'AB',
  },
]

export const ALL_USERS: User[] = [CURRENT_USER, ...OTHER_USERS]

export function userName(id: string): string {
  return ALL_USERS.find((u) => u.id === id)?.name ?? 'Unknown operator'
}

export const DEMO_CREDENTIALS = {
  email: CURRENT_USER.email,
  password: CURRENT_USER.password!,
}
