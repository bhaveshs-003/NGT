import { useState } from 'react'
import { Lock, PenLine } from 'lucide-react'
import type { Field } from '@/types'
import { OVERRIDE_REASONS, SOURCE_LABEL, uncertaintyRange } from '@/lib/confidence'
import { userName } from '@/data/users'
import { dateTime } from '@/lib/format'
import { Button } from './Button'
import { ConfidenceBadge, SourceBadge } from './Badge'
import { RadioRow, TextArea, TextField } from './Form'
import { Sheet } from './Sheet'
import { Callout } from './Feedback'

export function FieldRow({
  label,
  field,
  threshold,
  locked,
  onEdit,
  note,
}: {
  label: string
  field: Field<string | number>
  threshold: number
  locked?: boolean
  onEdit?: () => void
  note?: string
}) {
  const below = field.confidence > 0 && field.confidence < threshold
  const range = uncertaintyRange(field)
  const display =
    typeof field.value === 'number'
      ? `${field.value.toLocaleString('en-GB')}${field.unit ? ` ${field.unit}` : ''}`
      : String(field.value)

  return (
    <div className={`px-3.5 py-3 ${below ? 'bg-conf-low/[0.05]' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="field-label">{label}</p>
          <p className="mt-0.5 text-[15px] font-bold leading-snug text-steel-100">{display}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ConfidenceBadge confidence={field.confidence} threshold={threshold} showLabel={false} />
            <SourceBadge source={field.source} />
            {range && <span className="tabular text-[11px] text-steel-500">{range}</span>}
          </div>
          {field.overridden && (
            <p className="mt-1.5 text-[11.5px] leading-snug text-amber-500">
              <PenLine size={11} className="mr-1 inline" />
              Overridden by {userName(field.overriddenBy ?? '')}
              {field.overriddenAt ? ` · ${dateTime(field.overriddenAt)}` : ''}
              {field.overrideReason ? ` · ${field.overrideReason}` : ''}
            </p>
          )}
          {note && <p className="mt-1 text-[11.5px] leading-snug text-steel-500">{note}</p>}
          {below && (
            <p className="mt-1.5 text-[11.5px] font-semibold leading-snug text-conf-low">
              Below the {threshold} threshold — manual confirmation required before this record can be confirmed.
            </p>
          )}
        </div>
        <div className="shrink-0 pt-4">
          {locked ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-800 text-steel-600">
              <Lock size={14} />
            </span>
          ) : (
            onEdit && (
              <button
                onClick={onEdit}
                aria-label={`Edit ${label}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-700 text-steel-300 transition-colors hover:border-amber-500 hover:text-amber-500"
              >
                <PenLine size={14} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export function OverrideSheet({
  open,
  onClose,
  onSubmit,
  label,
  field,
  requireReason = true,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (v: { value: string | number; reason: string; note: string }) => void
  label: string
  field: Field<string | number>
  requireReason?: boolean
}) {
  const numeric = typeof field.value === 'number'
  const [value, setValue] = useState(String(field.value))
  const [reason, setReason] = useState<string>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()

  // Reset the form each time the sheet opens on a new field.
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  if (open && openedFor !== label) {
    setOpenedFor(label)
    setValue(String(field.value))
    setReason('')
    setNote('')
    setError(undefined)
  }
  if (!open && openedFor) setOpenedFor(null)

  function submit() {
    if (numeric && (!value.trim() || Number.isNaN(Number(value)))) return setError('Enter a number.')
    if (!numeric && value.trim().length < 2) return setError('Enter a value.')
    if (requireReason && !reason) return setError('Select a reason for the change.')
    onSubmit({ value: numeric ? Number(value) : value.trim(), reason, note: note.trim() })
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Override ${label.toLowerCase()}`}
      subtitle={`System value ${field.value}${field.unit ? ` ${field.unit}` : ''} from ${SOURCE_LABEL[field.source]}`}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" block onClick={onClose}>
            Cancel
          </Button>
          <Button block onClick={submit}>
            Save override
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextField
          label={`New ${label.toLowerCase()}`}
          value={value}
          inputMode={numeric ? 'decimal' : 'text'}
          suffix={field.unit}
          onChange={(e) => setValue(e.target.value)}
        />

        <div>
          <span className="field-label mb-2 block">Reason for change</span>
          <div className="space-y-2">
            {OVERRIDE_REASONS.map((r) => (
              <RadioRow key={r} selected={reason === r} onSelect={() => setReason(r)} title={r} />
            ))}
          </div>
        </div>

        <TextArea
          label="Note (optional)"
          placeholder="Weighbridge ticket 44821, net weight for this pallet only."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          hint="Free text is stored verbatim on the audit trail."
        />

        {error && <Callout tone="critical">{error}</Callout>}

        <Callout tone="caution" title="This is recorded">
          The change is stamped with your name, the device ID and a timestamp, and the original system value is kept on
          the audit trail.
        </Callout>
      </div>
    </Sheet>
  )
}
