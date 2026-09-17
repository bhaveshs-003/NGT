import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertOctagon, Camera, Check, CircleDashed, Loader2, ScanLine, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout, EmptyState, ProgressBar } from '@/components/Feedback'
import { Card, Screen, ScreenHeader } from '@/components/Screen'
import { ConfirmSheet } from '@/components/Sheet'
import { CAPTURE_PALETTES, captureSvg } from '@/data/images'
import { FAILED_DEMO_ID } from '@/data/assessments'
import { freshPipeline } from '@/data/pipeline'
import { CURRENT_USER } from '@/data/users'
import { applyInferenceResult } from '@/lib/createAssessment'
import { runQualityGate } from '@/lib/qualityGate'
import { PIPELINE_TOTAL_MS, pollProcessing, resolveResult, type ProcessingStatus } from '@/services/mock/inference'
import { useApp, useAssessment } from '@/store/useApp'
import type { PipelineStage } from '@/types'

export function Processing() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const updateAssessment = useApp((s) => s.updateAssessment)
  const appendAudit = useApp((s) => s.appendAudit)
  const threshold = useApp((s) => s.settings.confidenceThreshold)
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const toast = useApp((s) => s.toast)

  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [retrySheet, setRetrySheet] = useState<null | 'with-label' | 'without-label'>(null)
  const [recapturing, setRecapturing] = useState(false)
  const settledRef = useRef(false)
  const startedRef = useRef(false)

  // The seeded OCR failure fails once; any retry carries an explicit scenario.
  const failAt = a && a.id === FAILED_DEMO_ID && !a.scenarioId ? ('ocr' as const) : undefined

  // Kick off (or restart) the run when the screen opens.
  useEffect(() => {
    if (!a || startedRef.current) return
    startedRef.current = true
    const elapsed = Date.now() - new Date(a.updatedAt).getTime()
    const stale = a.status !== 'processing' || elapsed > PIPELINE_TOTAL_MS + 1500
    if (stale) {
      updateAssessment(a.id, {
        status: 'processing',
        updatedAt: new Date().toISOString(),
        pipeline: freshPipeline(),
        failure: undefined,
      })
    }
  }, [a, updateAssessment])

  const settle = useCallback(
    (s: ProcessingStatus) => {
      if (!a || settledRef.current) return
      settledRef.current = true

      if (s.state === 'failed') {
        updateAssessment(a.id, { status: 'failed', pipeline: s.stages, failure: s.failure })
        appendAudit(a.id, {
          at: new Date().toISOString(),
          actorId: user.id,
          actorName: user.name,
          action: 'Processing failed',
          detail: `Stage: Label OCR. Code ${s.failure?.code}.`,
        })
        return
      }

      const result = resolveResult(a)
      const patch = applyInferenceResult(a, result, user, threshold)
      updateAssessment(a.id, { ...patch, pipeline: s.stages })
      const low = [
        result.dimensions.length,
        result.dimensions.width,
        result.dimensions.height,
        result.cargoType,
        result.material,
        result.packaging,
        result.weightKg,
      ].filter((f) => f.confidence < threshold).length
      toast({
        tone: low ? 'warn' : 'success',
        title: low ? 'Assessment needs manual entry' : 'Assessment ready',
        body: low
          ? `${low} field${low === 1 ? '' : 's'} scored below ${threshold}.`
          : 'All fields scored above the confidence threshold.',
      })
      window.setTimeout(() => navigate(`/assessment/${a.id}`, { replace: true }), 700)
    },
    [a, appendAudit, navigate, threshold, toast, updateAssessment, user],
  )

  // Poll the mock status endpoint once a second.
  useEffect(() => {
    if (!a) return
    if (a.status === 'failed' && a.failure) {
      setStatus({ stages: a.pipeline, elapsedMs: PIPELINE_TOTAL_MS, totalMs: PIPELINE_TOTAL_MS, state: 'failed', failure: a.failure })
      settledRef.current = true
      return
    }
    if (a.status !== 'processing') return

    let cancelled = false
    const tick = async () => {
      const s = await pollProcessing(a.updatedAt, failAt)
      if (cancelled) return
      setStatus(s)
      if (s.state !== 'running') settle(s)
    }
    void tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [a, failAt, settle])

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="Processing" back />}>
        <EmptyState title="Record not found" body="This assessment is no longer on the device." actionLabel="Back to jobs" onAction={() => navigate('/jobs')} />
      </Screen>
    )
  }

  function retry(mode: 'with-label' | 'without-label') {
    setRetrySheet(null)
    const run = () => {
      settledRef.current = false
      startedRef.current = true
      updateAssessment(a!.id, {
        status: 'processing',
        scenarioId: mode === 'with-label' ? 'retry-with-label' : 'retry-without-label',
        updatedAt: new Date().toISOString(),
        pipeline: freshPipeline(),
        failure: undefined,
      })
      appendAudit(a!.id, {
        at: new Date().toISOString(),
        actorId: user.id,
        actorName: user.name,
        action: 'Processing retried',
        detail:
          mode === 'with-label'
            ? 'Label close-up re-shot in shade and re-submitted.'
            : 'Retried without a label frame — weight will fall back down the precedence chain.',
      })
      setStatus(null)
    }

    if (mode === 'with-label') {
      // Simulate stepping back into the camera for a single frame.
      setRecapturing(true)
      window.setTimeout(() => {
        const palette = CAPTURE_PALETTES.crate
        const captures = a!.captures.map((c) =>
          c.step === 'label'
            ? {
                ...c,
                svg: captureSvg(
                  { shape: 'label', view: 'label', body: palette.body, accent: palette.accent, caption: 'Label close-up' },
                  91,
                ),
                quality: runQualityGate('label', 2),
                attempt: c.attempt + 1,
                takenAt: new Date().toISOString(),
              }
            : c,
        )
        updateAssessment(a!.id, { captures })
        setRecapturing(false)
        run()
      }, 1500)
    } else {
      run()
    }
  }

  const stages = status?.stages ?? a.pipeline
  const failed = status?.state === 'failed'
  const pct = status ? Math.min(100, (status.elapsedMs / status.totalMs) * 100) : 0
  const done = stages.filter((s) => s.state === 'complete').length

  return (
    <Screen
      header={<ScreenHeader title={failed ? 'Processing failed' : 'Processing'} subtitle={a.ref} back onBack={() => navigate(`/jobs/${a.jobId}`)} />}
      footer={
        failed ? (
          <div className="space-y-2">
            <Button block icon={<Camera size={18} />} loading={recapturing} onClick={() => setRetrySheet('with-label')}>
              Retake label frame and retry
            </Button>
            <Button block variant="ghost" size="md" onClick={() => setRetrySheet('without-label')}>
              Retry without the label
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {!failed && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10">
                <ScanLine size={22} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-steel-100">
                  {pct >= 100 ? 'Finalising record' : 'Assessing cargo unit'}
                </p>
                <p className="mt-0.5 text-[12px] text-steel-400">
                  {done} of {stages.length} stages complete · {a.captures.length} frames
                </p>
              </div>
              <span className="tabular shrink-0 text-[17px] font-bold text-amber-500">{Math.round(pct)} %</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={pct} height="h-2" />
            </div>
          </Card>
        )}

        {failed && status?.failure && (
          <Callout tone="critical" title={status.failure.code} icon={<AlertOctagon size={16} />}>
            <p>{status.failure.message}</p>
            <p className="mt-2 font-semibold">{status.failure.hint}</p>
          </Callout>
        )}

        {recapturing && (
          <Callout tone="info" title="Re-shooting label frame" icon={<Loader2 size={16} className="animate-spin" />}>
            Simulated camera re-opened for the label close-up at 400 mm in shade.
          </Callout>
        )}

        <Card className="divide-y divide-steel-850">
          {stages.map((s) => (
            <StageRow key={s.id} stage={s} />
          ))}
        </Card>

        <p className="px-1 text-[11.5px] leading-relaxed text-steel-500">
          Status is polled once a second. Leaving this screen does not cancel the run — the record continues and
          appears in history when it finishes.
        </p>
      </div>

      <ConfirmSheet
        open={retrySheet === 'with-label'}
        onCancel={() => setRetrySheet(null)}
        onConfirm={() => retry('with-label')}
        title="Retake the label frame?"
        body="The camera re-opens for the label close-up only. The other three frames are kept and the pipeline is re-run from Detection."
        confirmLabel="Open camera"
      />
      <ConfirmSheet
        open={retrySheet === 'without-label'}
        onCancel={() => setRetrySheet(null)}
        onConfirm={() => retry('without-label')}
        title="Retry without a label read?"
        body="Weight will be resolved from the catalogue or from density × volume instead of the label. Expect a lower confidence score and a manual-entry prompt."
        confirmLabel="Retry anyway"
      />
    </Screen>
  )
}

function StageRow({ stage }: { stage: PipelineStage }) {
  const icon =
    stage.state === 'complete' ? (
      <Check size={15} className="text-conf-high" strokeWidth={3} />
    ) : stage.state === 'running' ? (
      <Loader2 size={15} className="animate-spin text-amber-500" />
    ) : stage.state === 'failed' ? (
      <X size={15} className="text-conf-low" strokeWidth={3} />
    ) : (
      <CircleDashed size={15} className="text-steel-600" />
    )

  return (
    <div className="flex items-start gap-3 px-3.5 py-3">
      <span
        className={`mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          stage.state === 'complete'
            ? 'border-conf-high/40 bg-conf-high/10'
            : stage.state === 'running'
              ? 'border-amber-500/40 bg-amber-500/10'
              : stage.state === 'failed'
                ? 'border-conf-low/50 bg-conf-low/10'
                : 'border-steel-700 bg-steel-850'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13.5px] font-semibold leading-snug ${
            stage.state === 'pending' ? 'text-steel-500' : stage.state === 'failed' ? 'text-conf-low' : 'text-steel-100'
          }`}
        >
          {stage.label}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-steel-500">{stage.detail}</p>
        {stage.note && <p className="mt-1 font-mono text-[11px] text-conf-low">{stage.note}</p>}
      </div>
      {stage.state === 'complete' && (
        <span className="tabular shrink-0 pt-0.5 text-[11px] text-steel-600">{(stage.duration / 1000).toFixed(1)}s</span>
      )}
    </div>
  )
}
