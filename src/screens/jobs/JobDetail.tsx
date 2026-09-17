import { useNavigate, useParams } from 'react-router-dom'
import { Camera, PackageSearch } from 'lucide-react'
import { AssessmentCard } from '@/components/AssessmentCard'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { CRANE_TYPE_OPTIONS } from '@/data/jobs'
import { crane } from '@/data/craneLoadCharts'
import { dateTime } from '@/lib/format'
import { userName } from '@/data/users'
import { useApp, useJob } from '@/store/useApp'

export function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = useJob(jobId)
  const assessments = useApp((s) => s.assessments.filter((a) => a.jobId === jobId))

  if (!job) {
    return (
      <Screen header={<ScreenHeader title="Job not found" back />}>
        <EmptyState
          title="This job is no longer available"
          body="It may have been closed or reassigned. Pull back to the jobs list to refresh."
          actionLabel="Back to jobs"
          onAction={() => navigate('/jobs')}
        />
      </Screen>
    )
  }

  const craneLabel = CRANE_TYPE_OPTIONS.find((c) => c.id === job.craneId)?.label ?? job.craneId
  const c = crane(job.craneId)

  return (
    <Screen
      header={<ScreenHeader title={job.ref} subtitle={job.vessel} back />}
      footer={
        <Button block icon={<Camera size={18} />} onClick={() => navigate(`/capture/${job.id}`)}>
          New assessment
        </Button>
      }
    >
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="text-[15px] font-bold leading-snug text-steel-100">{job.title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-steel-400">{job.cargoSummary}</p>
          <dl className="mt-4 divide-y divide-steel-800 border-t border-steel-800 text-[13px]">
            {[
              ['Vessel', job.vessel],
              ['Berth', job.berth],
              ['Crane', craneLabel],
              ['Max capacity', `${(c.maxCapacityKg / 1000).toLocaleString('en-GB')} t`],
              ['Shift', job.shift],
              ['Created', `${dateTime(job.createdAt)} · ${userName(job.createdBy)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-steel-400">{k}</dt>
                <dd className="text-right font-medium text-steel-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Section
          title={`Assessments (${assessments.length})`}
          action={
            assessments.length > 0 && (
              <button
                className="text-[12px] font-semibold text-amber-500"
                onClick={() => navigate(`/capture/${job.id}`)}
              >
                + New
              </button>
            )
          }
        >
          {assessments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-steel-700 bg-steel-900">
              <EmptyState
                icon={<PackageSearch size={24} />}
                title="No assessments yet"
                body="Capture the first cargo unit on this job. Four frames take about a minute and the assessment comes back in under ten seconds."
                actionLabel="Start capture"
                onAction={() => navigate(`/capture/${job.id}`)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((a) => (
                <AssessmentCard key={a.id} assessment={a} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </Screen>
  )
}
