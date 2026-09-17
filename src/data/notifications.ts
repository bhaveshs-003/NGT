import type { AppNotification, NotificationCategory } from '@/types'

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf-005',
    category: 'verification-required',
    title: 'Verification requested',
    body: 'M. Reinholt asked you to confirm the mixed pallet on JOB-2026-0142 before the 14:00 lift window.',
    at: '2026-09-17T06:40:00Z',
    read: false,
    deepLink: '/assessment/asmt-0309',
  },
  {
    id: 'ntf-004',
    category: 'assessment-complete',
    title: 'Assessment ready',
    body: 'ASMT-2026-0310 — steel pipe bundle completed with all fields above threshold.',
    at: '2026-09-16T10:44:29Z',
    read: false,
    deepLink: '/assessment/asmt-0310',
  },
  {
    id: 'ntf-003',
    category: 'sync',
    title: '1 item waiting to sync',
    body: 'Drum set captured in yard block C is held in the device queue. It will upload when coverage returns.',
    at: '2026-09-17T05:14:00Z',
    read: false,
    deepLink: '/profile/settings',
  },
  {
    id: 'ntf-002',
    category: 'job-assignment',
    title: 'New job assigned',
    body: 'JOB-2026-0147 — MV Clyde Venture, Berth 2. Stowage plan to follow from the agent.',
    at: '2026-09-16T16:31:00Z',
    read: true,
    deepLink: '/jobs/job-0147',
  },
  {
    id: 'ntf-001',
    category: 'safety-bulletin',
    title: 'Safety bulletin 2026-14',
    body: 'Screw-pin bow shackles withdrawn from the heavy lift pad rigging store. Use safety-bolt type only.',
    at: '2026-09-15T18:00:00Z',
    read: true,
  },
]

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  'assessment-complete': 'Assessment complete',
  'verification-required': 'Verification required',
  'job-assignment': 'Job assignment',
  sync: 'Sync and upload',
  'safety-bulletin': 'Safety bulletins',
}

export const CATEGORY_DESCRIPTION: Record<NotificationCategory, string> = {
  'assessment-complete': 'When the pipeline finishes and a record is ready to confirm.',
  'verification-required': 'When a supervisor asks you to confirm or re-assess a record.',
  'job-assignment': 'When a job is assigned to you or a berth changes.',
  sync: 'Queue drain progress, conflicts and upload failures.',
  'safety-bulletin': 'Terminal-wide lifting and rigging bulletins.',
}

/** The simulated inbound push that lands ~20 s after the Jobs screen opens. */
export const SIMULATED_PUSH: AppNotification = {
  id: 'ntf-push-001',
  category: 'assessment-complete',
  title: 'Assessment ready to confirm',
  body: 'ASMT-2026-0304 — steel IBC on JOB-2026-0131 finished processing. Tap to review.',
  at: '',
  read: false,
  deepLink: '/assessment/asmt-0304',
}
