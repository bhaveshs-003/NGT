import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Info, MonitorSmartphone } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout, EmptyState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { CAPTURE_STEPS } from '@/data/captureSteps'
import { scenarioAt } from '@/services/mock/inference'
import { useApp, useJob } from '@/store/useApp'

export function CaptureStart() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = useJob(jobId)
  const startDraft = useApp((s) => s.startDraft)
  const scenarioCounter = useApp((s) => s.scenarioCounter)
  const scenario = scenarioAt(scenarioCounter)

  if (!job) {
    return (
      <Screen header={<ScreenHeader title="Capture" back />}>
        <EmptyState title="Job not found" body="Pick a job from the capture tab." actionLabel="Back" onAction={() => navigate('/capture')} />
      </Screen>
    )
  }

  return (
    <Screen
      header={<ScreenHeader title="New assessment" subtitle={`${job.ref} · ${job.berth}`} back />}
      footer={
        <Button
          block
          icon={<Camera size={18} />}
          onClick={() => {
            startDraft(job.id)
            navigate(`/capture/${job.id}/step/front`)
          }}
        >
          Start capture set
        </Button>
      }
    >
      <div className="space-y-4">
        <Callout tone="info" title="Simulated camera" icon={<MonitorSmartphone size={16} />}>
          This prototype runs in a browser, so the capture screens are representative of the native camera rather than
          functional. Framing guides, the quality gate and the retake prompt all behave as specified; the image itself
          is generated on device.
        </Callout>

        <Section title="Capture sequence">
          <Card className="divide-y divide-steel-800">
            {CAPTURE_STEPS.map((s) => (
              <div key={s.id} className="flex gap-3 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-steel-700 bg-steel-850 text-[12px] font-bold text-amber-500">
                  {s.index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-snug text-steel-100">
                    {s.title}
                    {s.optional && <span className="ml-2 text-[11px] font-medium text-steel-500">optional</span>}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-steel-400">{s.guidance}</p>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Expected subject">
          <Card className="p-3.5">
            <p className="text-[13px] leading-relaxed text-steel-300">{scenario.subjectLabel}</p>
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Info size={13} className="mt-[1px] shrink-0" />
              Seeded for this walkthrough so the assessment result is repeatable.
            </p>
          </Card>
        </Section>
      </div>
    </Screen>
  )
}
