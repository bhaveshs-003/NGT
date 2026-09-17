import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Bell, ChevronRight, ClipboardList, Plus } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button, IconButton } from '@/components/Button'
import { EmptyState, ListSkeleton } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { CRANE_TYPE_OPTIONS } from '@/data/jobs'
import { SIMULATED_PUSH } from '@/data/notifications'
import { relative } from '@/lib/format'
import { useApp } from '@/store/useApp'

/** Delay before the simulated inbound push lands on this screen. */
const PUSH_DELAY_MS = 20_000

export function JobsList() {
  const navigate = useNavigate()
  const jobs = useApp((s) => s.jobs)
  const assessments = useApp((s) => s.assessments)
  const notifications = useApp((s) => s.notifications)
  const unread = notifications.filter((n) => !n.read).length
  const [loading, setLoading] = useState(true)

  // Simulated fetch so the skeleton state is real rather than decorative.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 620)
    return () => clearTimeout(t)
  }, [])

  // Simulated inbound push notification, once per session.
  const pushFired = useApp((s) => s.pushFired)
  const setPushFired = useApp((s) => s.setPushFired)
  const toast = useApp((s) => s.toast)
  const pushNotification = useApp((s) => s.pushNotification)
  const prefs = useApp((s) => s.settings.notifications)

  useEffect(() => {
    if (pushFired || !prefs['assessment-complete']) return
    const t = setTimeout(() => {
      setPushFired(true)
      const n = { ...SIMULATED_PUSH, at: new Date().toISOString() }
      pushNotification(n)
      toast({ tone: 'warn', title: n.title, body: n.body, deepLink: n.deepLink, sticky: true })
    }, PUSH_DELAY_MS)
    return () => clearTimeout(t)
  }, [pushFired, prefs, setPushFired, pushNotification, toast])

  return (
    <Screen
      header={
        <ScreenHeader
          title="Jobs"
          subtitle="Riverside Quay · Day shift"
          right={
            <>
              <IconButton label="Notifications" onClick={() => navigate('/notifications')} className="relative">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-steel-900" />
                )}
              </IconButton>
              <IconButton label="Create job" onClick={() => navigate('/jobs/new')}>
                <Plus size={22} />
              </IconButton>
            </>
          }
        />
      }
    >
      {loading ? (
        <ListSkeleton rows={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="No jobs assigned"
          body="Jobs appear here once the terminal superintendent assigns you to a vessel or yard operation."
          actionLabel="Create a job"
          onAction={() => navigate('/jobs/new')}
        />
      ) : (
        <Section className="space-y-3">
          {jobs.map((job) => {
            const count = assessments.filter((a) => a.jobId === job.id).length
            const crane = CRANE_TYPE_OPTIONS.find((c) => c.id === job.craneId)?.label ?? job.craneId
            return (
              <Card key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-steel-700 bg-steel-850 text-amber-500">
                    <Anchor size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-steel-400">{job.ref}</span>
                      {count === 0 && <Badge tone="neutral">No assessments</Badge>}
                    </div>
                    <p className="mt-0.5 text-[14.5px] font-bold leading-snug text-steel-100">{job.title}</p>
                    <p className="mt-1 truncate text-[12px] text-steel-400">{job.berth}</p>
                    <p className="truncate text-[12px] text-steel-500">{crane}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-steel-500">
                      <span className="tabular font-semibold text-steel-300">
                        {count} assessment{count === 1 ? '' : 's'}
                      </span>
                      <span>·</span>
                      <span>{relative(job.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-steel-600" />
                </div>
              </Card>
            )
          })}

          <Button variant="ghost" block size="md" icon={<Plus size={17} />} onClick={() => navigate('/jobs/new')}>
            Create job
          </Button>
        </Section>
      )}
    </Screen>
  )
}
