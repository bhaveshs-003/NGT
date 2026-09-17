import { useNavigate } from 'react-router-dom'
import { Anchor, Camera, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { Callout } from '@/components/Feedback'
import { useApp } from '@/store/useApp'

/** The Capture tab: pick which job the next capture set belongs to. */
export function CapturePicker() {
  const navigate = useNavigate()
  const jobs = useApp((s) => s.jobs)
  const assessments = useApp((s) => s.assessments)
  const draft = useApp((s) => s.draft)

  return (
    <Screen header={<ScreenHeader title="Capture" subtitle="Choose a job to assess against" />}>
      <div className="space-y-4">
        {draft && (
          <Callout tone="caution" title="Capture in progress" icon={<Camera size={16} />}>
            You have an unfinished capture set with {Object.keys(draft.frames).length} of 4 frames.{' '}
            <button
              className="font-bold underline underline-offset-2"
              onClick={() => navigate(`/capture/${draft.jobId}/review`)}
            >
              Resume
            </button>
          </Callout>
        )}

        {jobs.length === 0 ? (
          <EmptyState
            title="No open jobs"
            body="Create a job before capturing. Every assessment has to belong to a job so the permit can be traced."
            actionLabel="Create job"
            onAction={() => navigate('/jobs/new')}
          />
        ) : (
          <Section title="Open jobs" className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} onClick={() => navigate(`/capture/${job.id}`)} className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-steel-700 bg-steel-850 text-amber-500">
                    <Anchor size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[11px] font-semibold text-steel-400">{job.ref}</span>
                    <p className="truncate text-[14px] font-semibold leading-snug text-steel-100">{job.title}</p>
                    <p className="truncate text-[12px] text-steel-500">
                      {job.berth} · {assessments.filter((a) => a.jobId === job.id).length} assessments
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-steel-600" />
                </div>
              </Card>
            ))}
          </Section>
        )}
      </div>
    </Screen>
  )
}
