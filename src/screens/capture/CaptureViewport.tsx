import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Grid3x3,
  Images,
  RotateCcw,
  SkipForward,
  Zap,
} from 'lucide-react'
import { Button, IconButton } from '@/components/Button'
import { ConfirmSheet } from '@/components/Sheet'
import { CAPTURE_STEPS, stepSpec } from '@/data/captureSteps'
import { CAPTURE_PALETTES, captureSvg, svgToDataUri } from '@/data/images'
import { QUALITY_METRICS, metricPasses, metricValueLabel, runQualityGate } from '@/lib/qualityGate'
import { scenarioAt } from '@/services/mock/inference'
import { useApp } from '@/store/useApp'
import type { Capture, CaptureStepId, QualityCheck } from '@/types'

type Mode = 'live' | 'shooting' | 'preview'

export function CaptureViewport() {
  const { jobId, stepId } = useParams<{ jobId: string; stepId: CaptureStepId }>()
  const navigate = useNavigate()
  const draft = useApp((s) => s.draft)
  const setFrame = useApp((s) => s.setFrame)
  const bumpAttempt = useApp((s) => s.bumpAttempt)
  const setCurrentStep = useApp((s) => s.setCurrentStep)
  const clearDraft = useApp((s) => s.clearDraft)
  const autoAdvance = useApp((s) => s.settings.autoAdvanceCapture)
  const toast = useApp((s) => s.toast)

  const step = stepId ?? 'front'
  const spec = stepSpec(step)
  const [mode, setMode] = useState<Mode>('live')
  const [shot, setShot] = useState<{ svg: string; quality: QualityCheck; source: 'camera' | 'gallery' } | null>(null)
  const [grid, setGrid] = useState(true)
  const [torch, setTorch] = useState(false)
  const [abandon, setAbandon] = useState(false)

  const scenario = useMemo(() => scenarioAt(draft?.scenario ?? 0), [draft?.scenario])
  const palette = CAPTURE_PALETTES[scenario.paletteKey]

  const sceneSvg = useMemo(
    () =>
      captureSvg(
        {
          shape: step === 'label' ? 'label' : palette.shape,
          view: step,
          body: palette.body,
          accent: palette.accent,
          caption: `${spec.title} viewport`,
        },
        spec.index * 11 + 3,
        { overlay: false },
      ),
    [step, palette, spec],
  )

  // Bounce out if the draft was cleared (abandoned, or a fresh reload).
  useEffect(() => {
    if (!draft) navigate(`/capture/${jobId ?? ''}`, { replace: true })
  }, [draft, jobId, navigate])

  // Reset the viewport only when the step itself changes. Deliberately not
  // keyed on `draft`: taking a frame mutates the draft, and resetting here
  // would wipe the preview the operator is looking at.
  useEffect(() => {
    setCurrentStep(step)
    setMode('live')
    setShot(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (!draft) return null

  const existing = draft.frames[step]
  const stepIdx = CAPTURE_STEPS.findIndex((s) => s.id === step)
  const isLast = stepIdx === CAPTURE_STEPS.length - 1

  function goNext() {
    if (isLast) navigate(`/capture/${jobId}/review`)
    else navigate(`/capture/${jobId}/step/${CAPTURE_STEPS[stepIdx + 1].id}`)
  }

  function shoot(source: 'camera' | 'gallery') {
    setMode('shooting')
    const attempt = bumpAttempt(step)
    window.setTimeout(() => {
      const quality = runQualityGate(step, attempt, source)
      setShot({ svg: sceneSvg, quality, source })
      setMode('preview')
    }, 460)
  }

  function accept() {
    if (!shot) return
    const capture: Capture = {
      id: `${draft!.id}-${step}`,
      step,
      label: spec.title,
      svg: shot.svg,
      takenAt: new Date().toISOString(),
      quality: shot.quality,
      source: shot.source,
      attempt: draft!.attempts[step] ?? 1,
    }
    setFrame(step, capture)
    if (autoAdvance) goNext()
    else {
      setMode('live')
      setShot(null)
    }
  }

  // ----- preview -----------------------------------------------------------
  if (mode === 'preview' && shot) {
    const q = shot.quality
    return (
      <div className="flex h-full flex-col bg-steel-950">
        <div className="flex items-center gap-1 px-2 py-2">
          <IconButton label="Back to viewport" onClick={() => { setMode('live'); setShot(null) }}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-steel-100">Frame preview</p>
            <p className="truncate text-[12px] text-steel-400">
              Step {spec.index} of 4 · {spec.title} · attempt {draft.attempts[step] ?? 1}
            </p>
          </div>
        </div>

        <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <img
            src={svgToDataUri(shot.svg)}
            alt={`${spec.title} preview`}
            className={`w-full rounded-xl border-2 object-cover ${q.passed ? 'border-conf-high/50' : 'border-conf-low'}`}
          />

          <div
            className={`mt-3 rounded-xl border px-3.5 py-3 ${q.passed ? 'border-conf-high/35 bg-conf-high/[0.07]' : 'border-conf-low/45 bg-conf-low/[0.08]'}`}
          >
            <div className="flex items-start gap-2.5">
              {q.passed ? (
                <Check size={17} className="mt-[1px] shrink-0 text-conf-high" />
              ) : (
                <AlertTriangle size={17} className="mt-[1px] shrink-0 text-conf-low" />
              )}
              <div className="min-w-0">
                <p className={`text-[13.5px] font-bold ${q.passed ? 'text-green-200' : 'text-red-200'}`}>
                  {q.passed ? 'Frame accepted by the on-device check' : q.message}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-steel-300">
                  {q.passed
                    ? 'All five metrics are inside tolerance. This frame can go to the assessment.'
                    : q.guidance}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-steel-800 bg-steel-900 px-3.5 py-1">
            {QUALITY_METRICS.map((m) => {
              const ok = metricPasses(q, m.key)
              return (
                <div key={m.key} className="flex items-center justify-between gap-3 border-b border-steel-850 py-2.5 last:border-0">
                  <span className="text-[13px] text-steel-300">{m.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] text-steel-500">{m.band}</span>
                    <span
                      className={`tabular rounded px-1.5 py-[2px] text-[12px] font-bold ${
                        ok ? 'bg-conf-high/12 text-conf-high' : 'bg-conf-low/15 text-conf-low'
                      }`}
                    >
                      {metricValueLabel(q, m.key)}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-steel-800 bg-steel-900 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {q.passed ? (
            <>
              <Button block icon={<Check size={18} />} onClick={accept}>
                Use this frame
              </Button>
              <Button block variant="ghost" size="md" icon={<RotateCcw size={16} />} onClick={() => shoot('camera')}>
                Retake
              </Button>
            </>
          ) : (
            <>
              <Button block icon={<RotateCcw size={18} />} onClick={() => shoot('camera')}>
                Retake frame
              </Button>
              <Button
                block
                variant="ghost"
                size="md"
                onClick={() => {
                  toast({
                    tone: 'warn',
                    title: 'Frame kept below quality',
                    body: 'Recorded against the capture set. Derived fields from this frame will score lower.',
                  })
                  accept()
                }}
              >
                Use anyway and continue
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ----- live viewport -----------------------------------------------------
  return (
    <div className="relative flex h-full flex-col bg-black">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-1 bg-gradient-to-b from-black/80 to-transparent px-2 py-2 pt-3">
        <IconButton label="Abandon capture" onClick={() => setAbandon(true)} className="text-white">
          <ChevronLeft size={22} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-white">
            Step {spec.index} of 4 · {spec.title}
          </p>
          <p className="truncate text-[11px] text-white/70">{scenario.subjectLabel}</p>
        </div>
        <IconButton label="Toggle grid" onClick={() => setGrid(!grid)} className={grid ? 'text-amber-500' : 'text-white/70'}>
          <Grid3x3 size={19} />
        </IconButton>
        <IconButton label="Toggle torch" onClick={() => setTorch(!torch)} className={torch ? 'text-amber-500' : 'text-white/70'}>
          <Zap size={19} />
        </IconButton>
      </div>

      {/* viewport */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={svgToDataUri(sceneSvg)}
          alt=""
          className={`h-full w-full object-cover transition-[filter] duration-200 ${torch ? 'brightness-125' : ''}`}
          draggable={false}
        />
        <FramingOverlay overlay={spec.overlay} grid={grid} />

        {mode === 'shooting' && <div className="absolute inset-0 animate-fade-in bg-white" />}

        {/* guidance */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pb-4 pt-8">
          <div className="rounded-xl border border-white/15 bg-black/55 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[13px] font-semibold leading-snug text-white">{spec.guidance}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-white/70">{spec.hint}</p>
          </div>
        </div>

        {/* simulated-camera watermark, so nobody mistakes this for a live feed */}
        <span className="absolute left-3 top-14 rounded bg-black/55 px-1.5 py-[2px] text-[9.5px] font-bold uppercase tracking-wider text-white/70">
          Simulated viewport
        </span>
      </div>

      {/* shutter row */}
      <div className="flex items-center justify-between bg-black px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <IconButton label="Import from gallery" onClick={() => shoot('gallery')} className="text-white">
          <Images size={24} />
        </IconButton>

        <button
          type="button"
          aria-label={`Capture ${spec.title}`}
          disabled={mode === 'shooting'}
          onClick={() => shoot('camera')}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/80 transition-transform active:scale-95 disabled:opacity-50"
        >
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>

        {spec.optional ? (
          <IconButton
            label="Skip label frame"
            className="text-white"
            onClick={() => {
              toast({
                tone: 'info',
                title: 'Label frame skipped',
                body: 'Weight will fall back to catalogue or density × volume.',
              })
              goNext()
            }}
          >
            <SkipForward size={24} />
          </IconButton>
        ) : (
          <span className="w-11" />
        )}
      </div>

      {/* step dots */}
      <div className="flex items-center justify-center gap-2 bg-black pb-3">
        {CAPTURE_STEPS.map((s) => {
          const done = !!draft.frames[s.id]
          const current = s.id === step
          return (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                current ? 'w-6 bg-amber-500' : done ? 'w-4 bg-conf-high' : 'w-4 bg-white/25'
              }`}
            />
          )
        })}
      </div>

      {existing && (
        <button
          onClick={() => navigate(`/capture/${jobId}/review`)}
          className="absolute bottom-[132px] right-4 z-20 rounded-lg border border-white/25 bg-black/65 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white"
        >
          Frame captured · review
        </button>
      )}

      <ConfirmSheet
        open={abandon}
        onCancel={() => setAbandon(false)}
        onConfirm={() => {
          clearDraft()
          navigate(`/jobs/${jobId}`, { replace: true })
        }}
        title="Abandon this capture set?"
        body={`${Object.keys(draft.frames).length} frame(s) have been taken. Abandoning discards them and no assessment is created.`}
        confirmLabel="Discard frames"
        destructive
      />
    </div>
  )
}

function FramingOverlay({ overlay, grid }: { overlay: string; grid: boolean }) {
  return (
    <>
      <span className="animate-scan-line pointer-events-none absolute left-[8%] right-[8%] h-px bg-amber-500/35" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {grid && (
        <g stroke="#ffffff" strokeOpacity="0.16" strokeWidth="0.25">
          <line x1="33.3" y1="0" x2="33.3" y2="100" />
          <line x1="66.6" y1="0" x2="66.6" y2="100" />
          <line x1="0" y1="33.3" x2="100" y2="33.3" />
          <line x1="0" y1="66.6" x2="100" y2="66.6" />
        </g>
      )}
      {overlay === 'rect-landscape' && (
        <rect x="8" y="24" width="84" height="46" fill="none" stroke="#ffb020" strokeWidth="0.6" strokeDasharray="3 2" />
      )}
      {overlay === 'rect-portrait' && (
        <rect x="20" y="16" width="60" height="62" fill="none" stroke="#ffb020" strokeWidth="0.6" strokeDasharray="3 2" />
      )}
      {overlay === 'corner-marks' && (
        <g fill="none" stroke="#ffb020" strokeWidth="0.9">
          <path d="M10 30 L10 22 L20 22" />
          <path d="M80 22 L90 22 L90 30" />
          <path d="M90 64 L90 72 L80 72" />
          <path d="M20 72 L10 72 L10 64" />
          <path d="M18 68 L82 28" strokeWidth="0.4" strokeDasharray="2 2" strokeOpacity="0.6" />
        </g>
      )}
      {overlay === 'label-box' && (
        <g fill="none" stroke="#ffb020" strokeWidth="0.9">
          <path d="M22 22 L14 22 L14 32" />
          <path d="M78 22 L86 22 L86 32" />
          <path d="M86 68 L86 78 L78 78" />
          <path d="M22 78 L14 78 L14 68" />
        </g>
      )}
      </svg>
    </>
  )
}
