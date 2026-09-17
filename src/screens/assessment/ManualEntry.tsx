import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Ruler } from 'lucide-react'
import { Button } from '@/components/Button'
import { ConfidenceBadge, SourceBadge } from '@/components/Badge'
import { Callout, EmptyState, ProgressBar } from '@/components/Feedback'
import { RadioRow, TextArea, TextField } from '@/components/Form'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { catalogueEntry } from '@/data/cargoCatalogue'
import { OVERRIDE_REASONS, lowConfidenceFields } from '@/lib/confidence'
import { kg } from '@/lib/format'
import { useApp, useAssessment } from '@/store/useApp'

type EditKey = 'length' | 'width' | 'height' | 'cargoType' | 'material' | 'packaging' | 'weightKg'

/**
 * Forced route for any field scoring below the configured threshold. The
 * record cannot be confirmed until every one of them is entered by hand.
 */
export function ManualEntry() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const threshold = useApp((s) => s.settings.confidenceThreshold)
  const overrideField = useApp((s) => s.overrideField)
  const toast = useApp((s) => s.toast)

  const pending = useMemo(() => (a ? lowConfidenceFields(a, threshold) : []), [a, threshold])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState<string>('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  // Snapshot of how many fields were outstanding when the screen first opened,
  // so the progress bar has a stable denominator.
  const [initialCount] = useState(() => (a ? lowConfidenceFields(a, threshold).length : 0))

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="Manual entry" back />}>
        <EmptyState title="Record not found" body="This assessment is no longer on the device." actionLabel="Back" onAction={() => navigate('/jobs')} />
      </Screen>
    )
  }

  if (pending.length === 0) {
    return (
      <Screen
        header={<ScreenHeader title="Manual entry" subtitle={a.ref} back />}
        footer={
          <Button block onClick={() => navigate(`/assessment/${a.id}`, { replace: true })}>
            Back to assessment
          </Button>
        }
      >
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-conf-high/40 bg-conf-high/10 text-conf-high">
            <CheckCircle2 size={30} />
          </div>
          <h2 className="mt-5 text-[17px] font-bold text-steel-100">All fields confirmed</h2>
          <p className="mt-2 max-w-[32ch] text-[13px] leading-relaxed text-steel-400">
            Every field now sits at or above the {threshold} threshold. The record can be confirmed and taken through to
            lifting assistance.
          </p>
        </div>
      </Screen>
    )
  }

  const current = pending[Math.min(index, pending.length - 1)]
  const numeric = typeof current.field.value === 'number'
  const cat = catalogueEntry(a.cargoTypeId)
  const completed = Math.max(0, initialCount - pending.length)
  const progress = initialCount > 0 ? (completed / initialCount) * 100 : 0

  function save() {
    setError(undefined)
    if (numeric && (!value.trim() || Number.isNaN(Number(value)))) return setError('Enter a measured number.')
    if (!numeric && value.trim().length < 2) return setError('Enter a value.')
    if (!reason) return setError('Select where the value came from.')

    overrideField(a!.id, current.key as EditKey, {
      value: numeric ? Number(value) : value.trim(),
      reason,
      note: note.trim(),
    })
    setValue('')
    setReason('')
    setNote('')
    if (pending.length <= 1) {
      toast({ tone: 'success', title: 'Manual entry complete', body: 'All low-confidence fields have been confirmed.' })
    }
    setIndex(0)
  }

  return (
    <Screen
      header={<ScreenHeader title="Manual entry required" subtitle={`${a.ref} · ${pending.length} field${pending.length === 1 ? '' : 's'} outstanding`} back />}
      footer={
        <Button block onClick={save} icon={<CheckCircle2 size={18} />}>
          Save {current.label.toLowerCase()}
        </Button>
      }
    >
      <div className="space-y-4">
        <Callout tone="critical" title="Below confidence threshold" icon={<AlertTriangle size={16} />}>
          These fields scored below {threshold} out of 100. Enter the measured or documented value for each before the
          record can be confirmed.
        </Callout>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-steel-400">
            <span>
              {completed} of {initialCount} confirmed
            </span>
            <span className="tabular">{pending.length} outstanding</span>
          </div>
          <ProgressBar value={progress} tone="amber" height="h-1.5" />
        </div>

        <Section title="Outstanding fields">
          <Card className="divide-y divide-steel-850">
            {pending.map((f, i) => (
              <button
                key={f.key}
                onClick={() => {
                  setIndex(i)
                  setValue('')
                  setReason('')
                  setError(undefined)
                }}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left ${i === index ? 'bg-amber-500/[0.07]' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-steel-100">{f.label}</p>
                  <p className="tabular mt-0.5 text-[12px] text-steel-500">System value {f.display}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <SourceBadge source={f.field.source} />
                  <ConfidenceBadge confidence={f.field.confidence} threshold={threshold} showLabel={false} />
                </div>
              </button>
            ))}
          </Card>
        </Section>

        <Section title={`Enter ${current.label.toLowerCase()}`}>
          <Card className="space-y-4 p-3.5">
            <TextField
              label={`Measured ${current.label.toLowerCase()}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode={numeric ? 'decimal' : 'text'}
              suffix={current.field.unit}
              placeholder={numeric ? String(current.field.value) : current.display}
              hint={
                numeric
                  ? `System estimate ${current.display} at confidence ${current.field.confidence}.`
                  : `System estimate: ${current.display}.`
              }
            />

            {cat && current.key === 'weightKg' && (
              <div className="rounded-xl border border-steel-800 bg-steel-850 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-steel-400">
                  <Ruler size={12} /> Catalogue reference
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-steel-300">
                  {cat.name} normally runs {kg(cat.nominalWeightKg[0])} to {kg(cat.nominalWeightKg[1])} at{' '}
                  {cat.density.toLocaleString('en-GB')} kg/m³ packed density.
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-steel-500">{cat.notes}</p>
              </div>
            )}

            <div>
              <span className="field-label mb-2 block">Source of this value</span>
              <div className="space-y-2">
                {OVERRIDE_REASONS.map((r) => (
                  <RadioRow key={r} selected={reason === r} onSelect={() => setReason(r)} title={r} />
                ))}
              </div>
            </div>

            <TextArea
              label="Note (optional)"
              placeholder="Measured at four corners with a tape; mean recorded."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <Callout tone="critical">{error}</Callout>}
          </Card>
        </Section>
      </div>
    </Screen>
  )
}
