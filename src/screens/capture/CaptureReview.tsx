import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CloudOff, Camera, CheckCircle2, PauseCircle, RotateCcw, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Callout, EmptyState, ProgressBar } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet, Sheet } from '@/components/Sheet'
import { CAPTURE_STEPS } from '@/data/captureSteps'
import { svgToDataUri } from '@/data/images'
import { CURRENT_USER } from '@/data/users'
import { buildAssessmentFromDraft } from '@/lib/createAssessment'
import { dateTime } from '@/lib/format'
import { frameSizeKb, startUpload, type FrameUploadState, type UploaderHandle } from '@/services/mock/upload'
import { useApp, useJob, uid } from '@/store/useApp'
import type { CaptureStepId } from '@/types'

export function CaptureReview() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = useJob(jobId)
  const draft = useApp((s) => s.draft)
  const discardFrame = useApp((s) => s.discardFrame)
  const clearDraft = useApp((s) => s.clearDraft)
  const addAssessment = useApp((s) => s.addAssessment)
  const nextScenario = useApp((s) => s.nextScenario)
  const enqueue = useApp((s) => s.enqueue)
  const toast = useApp((s) => s.toast)
  const offline = useApp((s) => s.settings.offlineMode)
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const counter = useApp((s) => s.assessmentCounter)

  const [discardTarget, setDiscardTarget] = useState<CaptureStepId | null>(null)
  const [abandon, setAbandon] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [frames, setFrames] = useState<FrameUploadState[]>([])
  const uploaderRef = useRef<UploaderHandle | null>(null)

  useEffect(() => () => uploaderRef.current?.cancel(), [])

  if (!draft || !job) {
    return (
      <Screen header={<ScreenHeader title="Capture set" back />}>
        <EmptyState
          title="No capture set in progress"
          body="Start a new capture from a job to build an assessment."
          actionLabel="Back to capture"
          onAction={() => navigate('/capture')}
        />
      </Screen>
    )
  }

  const captured = CAPTURE_STEPS.map((s) => ({ spec: s, capture: draft.frames[s.id] }))
  const takenCount = captured.filter((c) => c.capture).length
  const requiredMissing = captured.filter((c) => !c.capture && !c.spec.optional)
  const belowQuality = captured.filter((c) => c.capture && !c.capture.quality.passed)
  const canSubmit = requiredMissing.length === 0

  function createRecord(status: 'processing' | 'queued-offline') {
    const a = buildAssessmentFromDraft(draft!, user, counter, status)
    addAssessment(a)
    nextScenario()
    clearDraft()
    return a
  }

  function submitOffline() {
    const a = createRecord('queued-offline')
    enqueue({
      id: uid('sq'),
      kind: 'assessment-upload',
      assessmentId: a.id,
      label: `${a.ref} — ${a.captures.length} frames`,
      queuedAt: new Date().toISOString(),
      sizeKb: a.captures.reduce((s, c) => s + frameSizeKb(c.step), 0),
      progress: 0,
      state: 'queued',
    })
    toast({
      tone: 'warn',
      title: 'Held in device queue',
      body: `${a.ref} will upload when coverage returns.`,
    })
    navigate(`/jobs/${job!.id}`, { replace: true })
  }

  function submitOnline() {
    setUploading(true)
    const list = captured
      .filter((c) => c.capture)
      .map((c) => ({ step: c.spec.id, label: c.spec.title, sizeKb: frameSizeKb(c.spec.id) }))
    uploaderRef.current = startUpload(list, setFrames, () => {
      const a = createRecord('processing')
      setUploading(false)
      navigate(`/processing/${a.id}`, { replace: true })
    })
  }

  return (
    <Screen
      header={<ScreenHeader title="Review capture set" subtitle={`${job.ref} · ${takenCount} of 4 frames`} back />}
      footer={
        <div className="space-y-2">
          <Button
            block
            disabled={!canSubmit}
            icon={offline ? <CloudOff size={18} /> : <Upload size={18} />}
            onClick={offline ? submitOffline : submitOnline}
          >
            {offline ? 'Queue for upload' : 'Submit for assessment'}
          </Button>
          <Button block variant="ghost" size="md" onClick={() => setAbandon(true)}>
            Discard capture set
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!canSubmit && (
          <Callout tone="caution" title="Frames still required" icon={<Camera size={16} />}>
            {requiredMissing.map((m) => m.spec.title).join(', ')} must be captured before the set can be submitted.
          </Callout>
        )}

        {belowQuality.length > 0 && (
          <Callout tone="critical" title="Frames below quality" icon={<AlertTriangle size={16} />}>
            {belowQuality.length} frame{belowQuality.length === 1 ? '' : 's'} failed the on-device check and{' '}
            {belowQuality.length === 1 ? 'was' : 'were'} kept anyway. Derived fields will score lower.
          </Callout>
        )}

        {offline && (
          <Callout tone="caution" title="No coverage" icon={<CloudOff size={16} />}>
            The set will be held in the device queue with its frames and pushed when coverage returns.
          </Callout>
        )}

        <Section title="Frames">
          <div className="grid grid-cols-2 gap-3">
            {captured.map(({ spec, capture }) => (
              <Card key={spec.id} className="overflow-hidden">
                {capture ? (
                  <>
                    <img
                      src={svgToDataUri(capture.svg)}
                      alt={`${spec.title} frame`}
                      className="h-[104px] w-full object-cover"
                      draggable={false}
                    />
                    <div className="p-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-[12.5px] font-bold text-steel-100">{spec.title}</p>
                        {capture.quality.passed ? (
                          <CheckCircle2 size={14} className="shrink-0 text-conf-high" />
                        ) : (
                          <AlertTriangle size={14} className="shrink-0 text-conf-low" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-steel-500">
                        {capture.source === 'gallery' ? 'Imported' : 'Camera'} · attempt {capture.attempt}
                      </p>
                      <p className="text-[10.5px] text-steel-600">{dateTime(capture.takenAt)}</p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => navigate(`/capture/${job.id}/step/${spec.id}`)}
                          className="flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded-lg border border-steel-700 text-[11px] font-semibold text-steel-300 hover:bg-steel-850"
                        >
                          <RotateCcw size={12} /> Retake
                        </button>
                        <button
                          aria-label={`Discard ${spec.title}`}
                          onClick={() => setDiscardTarget(spec.id)}
                          className="flex h-[34px] w-9 items-center justify-center rounded-lg border border-steel-700 text-steel-400 hover:bg-steel-850 hover:text-conf-low"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/capture/${job.id}/step/${spec.id}`)}
                    className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-steel-700 p-3 text-center"
                  >
                    <Camera size={22} className="text-steel-500" />
                    <span className="text-[12.5px] font-semibold text-steel-300">{spec.title}</span>
                    <Badge tone={spec.optional ? 'neutral' : 'amber'}>{spec.optional ? 'Optional' : 'Required'}</Badge>
                  </button>
                )}
              </Card>
            ))}
          </div>
        </Section>

        <p className="px-1 text-[11.5px] leading-relaxed text-steel-500">
          Submitting sends {takenCount} frame
          {takenCount === 1 ? '' : 's'} (
          {(captured.filter((c) => c.capture).reduce((s, c) => s + frameSizeKb(c.spec.id), 0) / 1024).toFixed(1)} MB)
          for assessment. Frames are retained against the record for audit.
        </p>
      </div>

      <ConfirmSheet
        open={discardTarget !== null}
        onCancel={() => setDiscardTarget(null)}
        onConfirm={() => {
          if (discardTarget) discardFrame(discardTarget)
          setDiscardTarget(null)
        }}
        title="Discard this frame?"
        body="The frame is removed from the set. You will need to re-shoot it before the set can be submitted, unless it is the optional label close-up."
        confirmLabel="Discard frame"
        destructive
      />

      <ConfirmSheet
        open={abandon}
        onCancel={() => setAbandon(false)}
        onConfirm={() => {
          clearDraft()
          navigate(`/jobs/${job.id}`, { replace: true })
        }}
        title="Discard the whole capture set?"
        body={`All ${takenCount} frames are deleted and no assessment is created. This cannot be undone.`}
        confirmLabel="Discard all"
        destructive
      />

      <UploadSheet open={uploading} frames={frames} onCancel={() => { uploaderRef.current?.cancel(); setUploading(false) }} />
    </Screen>
  )
}

function UploadSheet({
  open,
  frames,
  onCancel,
}: {
  open: boolean
  frames: FrameUploadState[]
  onCancel: () => void
}) {
  const offline = useApp((s) => s.settings.offlineMode)
  const total = frames.length ? frames.reduce((s, f) => s + f.progress, 0) / frames.length : 0

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      dismissible={false}
      title="Uploading capture set"
      subtitle={offline ? 'Paused — waiting for coverage' : 'Sending frames to the assessment service'}
      footer={
        <Button block variant="ghost" onClick={onCancel}>
          Cancel upload
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="font-semibold text-steel-300">Overall</span>
            <span className="tabular font-bold text-amber-500">{Math.round(total)} %</span>
          </div>
          <ProgressBar value={total} tone={offline ? 'red' : 'amber'} height="h-2.5" striped={offline} />
        </div>

        {offline && (
          <Callout tone="critical" title="Transfer paused" icon={<PauseCircle size={16} />}>
            Coverage was lost mid-transfer. The upload resumes from the last complete chunk once the connection is
            back — switch the floating button back to online.
          </Callout>
        )}

        <div className="space-y-2.5">
          {frames.map((f) => (
            <div key={f.step}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate text-steel-300">{f.label}</span>
                <span className="tabular shrink-0 text-steel-500">
                  {f.state === 'paused' ? 'paused' : f.state === 'done' ? 'sent' : `${f.progress} %`} ·{' '}
                  {(f.sizeKb / 1024).toFixed(1)} MB
                </span>
              </div>
              <ProgressBar
                value={f.progress}
                height="h-1.5"
                tone={f.state === 'done' ? 'green' : f.state === 'paused' ? 'red' : 'amber'}
              />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
