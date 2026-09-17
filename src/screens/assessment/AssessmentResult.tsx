import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  History,
  Lock,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Weight,
} from 'lucide-react'
import { Badge, EstimatedVerifiedPill, StatusPill } from '@/components/Badge'
import { Button } from '@/components/Button'
import { CaptureStrip } from '@/components/CaptureThumb'
import { Callout, ErrorState } from '@/components/Feedback'
import { FieldRow, OverrideSheet } from '@/components/FieldRow'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet, Sheet } from '@/components/Sheet'
import { WeightChain } from '@/components/WeightChain'
import { OTHER_USERS, userName } from '@/data/users'
import { lowConfidenceFields } from '@/lib/confidence'
import { dateTime, m3, relative } from '@/lib/format'
import { volumeM3 } from '@/lib/lifting'
import { useApp, useAssessment, useJob } from '@/store/useApp'
import type { Field } from '@/types'
import { AuditTrail } from './AuditTrail'

type EditKey = 'length' | 'width' | 'height' | 'cargoType' | 'material' | 'packaging' | 'weightKg'

export function AssessmentResult() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const job = useJob(a?.jobId)
  const threshold = useApp((s) => s.settings.confidenceThreshold)
  const overrideField = useApp((s) => s.overrideField)
  const confirmAssessment = useApp((s) => s.confirmAssessment)
  const verifyAssessment = useApp((s) => s.verifyAssessment)
  const reopenAssessment = useApp((s) => s.reopenAssessment)
  const toast = useApp((s) => s.toast)

  const [editing, setEditing] = useState<{ key: EditKey; label: string; field: Field<string | number> } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="Assessment" back />}>
        <ErrorState
          title="Record not available"
          body="This assessment is no longer on the device. It may have been cleared by a demo reset, or it belongs to another handset."
          onRetry={() => navigate('/jobs')}
          retryLabel="Back to jobs"
        />
      </Screen>
    )
  }

  if (a.status === 'processing' || a.status === 'failed') {
    return <Navigate to={`/processing/${a.id}`} replace />
  }

  if (a.status === 'queued-offline') {
    return (
      <Screen header={<ScreenHeader title={a.ref} back />}>
        <div className="space-y-4">
          <Callout tone="caution" title="Held in the device queue">
            This capture set has not been assessed yet. It uploads and runs the pipeline as soon as coverage returns.
          </Callout>
          <CaptureStrip captures={a.captures} />
          <Button block variant="secondary" onClick={() => navigate('/sync')}>
            Open sync queue
          </Button>
        </div>
      </Screen>
    )
  }

  const locked = a.status === 'verified'
  const lowFields = lowConfidenceFields(a, threshold)
  const blocked = lowFields.length > 0
  const dims = a.dimensions
  // Derived from the audit trail rather than local state, so it survives
  // navigating away to lifting assistance and back. Re-opening resets it
  // because the confirmation belongs to the superseded version.
  const confirmed = a.audit.some((e) => e.action === 'Assessment confirmed' && e.version === a.version)

  function edit(key: EditKey, label: string, field: Field<string | number>) {
    setEditing({ key, label, field })
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title={a.ref}
          subtitle={job ? `${job.ref} · ${job.berth}` : undefined}
          back
          right={<StatusPill status={a.status} />}
        />
      }
      footer={
        locked ? (
          <div className="space-y-2">
            <Button block icon={<FileText size={18} />} onClick={() => navigate(`/assessment/${a.id}/permit`)}>
              Open lift permit
            </Button>
            <Button block variant="ghost" size="md" icon={<RotateCcw size={16} />} onClick={() => setReopenOpen(true)}>
              Re-open and re-assess
            </Button>
          </div>
        ) : blocked ? (
          <Button block icon={<AlertTriangle size={18} />} onClick={() => navigate(`/assessment/${a.id}/manual-entry`)}>
            Complete {lowFields.length} low-confidence field{lowFields.length === 1 ? '' : 's'}
          </Button>
        ) : confirmed ? (
          <div className="space-y-2">
            <Button block icon={<Weight size={18} />} onClick={() => navigate(`/assessment/${a.id}/lifting`)}>
              Continue to lifting assistance
            </Button>
            <Button block variant="ghost" size="md" icon={<ShieldCheck size={16} />} onClick={() => setVerifyOpen(true)}>
              Verify and lock record
            </Button>
          </div>
        ) : (
          <Button block icon={<CheckCircle2 size={18} />} onClick={() => setConfirmOpen(true)}>
            Confirm assessment
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {/* status head */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-bold leading-snug text-steel-100">{a.cargoType.value}</p>
              <p className="mt-0.5 text-[12px] text-steel-400">
                v{a.version} · {relative(a.updatedAt)} · {userName(a.createdBy)}
              </p>
            </div>
            <EstimatedVerifiedPill status={a.status} />
          </div>

          {locked && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-conf-high/30 bg-conf-high/[0.07] px-3 py-2.5">
              <Lock size={15} className="mt-[1px] shrink-0 text-conf-high" />
              <p className="text-[12.5px] leading-relaxed text-green-200">
                Verified by {userName(a.verifiedBy ?? '')} on {dateTime(a.verifiedAt ?? '')}. Version {a.version} is
                stamped and read-only.
              </p>
            </div>
          )}

          {blocked && !locked && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-conf-low/40 bg-conf-low/[0.07] px-3 py-2.5">
              <AlertTriangle size={15} className="mt-[1px] shrink-0 text-conf-low" />
              <p className="text-[12.5px] leading-relaxed text-red-200">
                {lowFields.length} field{lowFields.length === 1 ? '' : 's'} scored below the {threshold} threshold:{' '}
                {lowFields.map((f) => f.label).join(', ')}. Manual entry is required before this record can be
                confirmed.
              </p>
            </div>
          )}
        </Card>

        <Section title="Captures">
          <CaptureStrip captures={a.captures} />
        </Section>

        <Section title="Dimensions" action={<span className="tabular text-[11px] text-steel-500">± {dims.toleranceMm} mm solver tolerance</span>}>
          <Card className="divide-y divide-steel-850">
            <FieldRow label="Length" field={dims.length} threshold={threshold} locked={locked} onEdit={() => edit('length', 'Length', dims.length)} />
            <FieldRow label="Width" field={dims.width} threshold={threshold} locked={locked} onEdit={() => edit('width', 'Width', dims.width)} />
            <FieldRow label="Height" field={dims.height} threshold={threshold} locked={locked} onEdit={() => edit('height', 'Height', dims.height)} />
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="field-label">Bounding volume</span>
              <span className="tabular text-[13px] font-semibold text-steel-300">{m3(volumeM3(a))}</span>
            </div>
          </Card>
        </Section>

        <Section title="Classification">
          <Card className="divide-y divide-steel-850">
            <FieldRow label="Cargo type" field={a.cargoType} threshold={threshold} locked={locked} onEdit={() => edit('cargoType', 'Cargo type', a.cargoType)} />
            <FieldRow label="Material" field={a.material} threshold={threshold} locked={locked} onEdit={() => edit('material', 'Material', a.material)} />
            <FieldRow label="Packaging" field={a.packaging} threshold={threshold} locked={locked} onEdit={() => edit('packaging', 'Packaging', a.packaging)} />
          </Card>
        </Section>

        <Section
          title="Weight"
          action={
            a.labelText && (
              <button className="flex items-center gap-1 text-[12px] font-semibold text-amber-500" onClick={() => setLabelOpen(true)}>
                <ScanText size={13} /> Label text
              </button>
            )
          }
        >
          <Card className="divide-y divide-steel-850">
            <FieldRow label="Weight" field={a.weightKg} threshold={threshold} locked={locked} onEdit={() => edit('weightKg', 'Weight', a.weightKg)} />
            <div>
              <p className="field-label px-3.5 pt-3">Resolution precedence</p>
              <WeightChain chain={a.weightChain} />
            </div>
          </Card>
        </Section>

        {a.flags.length > 0 && (
          <Section title={`Flags (${a.flags.length})`}>
            <Card className="divide-y divide-steel-850">
              {a.flags.map((f) => (
                <div key={f.id} className="flex items-start gap-2.5 px-3.5 py-3">
                  <AlertTriangle
                    size={15}
                    className={`mt-[2px] shrink-0 ${f.severity === 'critical' ? 'text-conf-low' : f.severity === 'caution' ? 'text-amber-500' : 'text-steel-400'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold leading-snug text-steel-100">{f.label}</p>
                      <Badge tone={f.severity === 'critical' ? 'red' : f.severity === 'caution' ? 'amber' : 'neutral'}>
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-steel-400">{f.detail}</p>
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        )}

        <Section title="Audit trail" action={<History size={14} className="text-steel-500" />}>
          <Card className="p-3.5">
            <AuditTrail entries={a.audit} compact />
          </Card>
        </Section>

        {!locked && !blocked && (
          <Button variant="ghost" block size="md" onClick={() => navigate(`/assessment/${a.id}/lifting`)}>
            Skip to lifting assistance
          </Button>
        )}
      </div>

      {/* --- sheets --- */}
      {editing && (
        <OverrideSheet
          open
          onClose={() => setEditing(null)}
          label={editing.label}
          field={editing.field}
          onSubmit={(v) => {
            overrideField(a.id, editing.key, v)
            setEditing(null)
            toast({ tone: 'success', title: `${editing.label} overridden`, body: 'Change recorded on the audit trail.' })
          }}
        />
      )}

      <Sheet open={labelOpen} onClose={() => setLabelOpen(false)} title="Label OCR output" subtitle="Raw text read from the label close-up">
        <pre className="whitespace-pre-wrap rounded-xl border border-steel-800 bg-steel-950 p-3 font-mono text-[12px] leading-relaxed text-steel-300">
          {a.labelText ?? 'No label text was read for this record.'}
        </pre>
      </Sheet>

      <ConfirmSheet
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirmAssessment(a.id)
          setConfirmOpen(false)
          toast({ tone: 'success', title: 'Assessment confirmed', body: 'Continue to lifting assistance to build the plan.' })
        }}
        title="Confirm this assessment?"
        body="You are confirming that the dimensions, classification and weight above match the cargo unit in front of you. The record stays editable until it is verified and locked."
        confirmLabel="Confirm"
      />

      <ConfirmSheet
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        onConfirm={() => {
          verifyAssessment(a.id, OTHER_USERS[0].id)
          setVerifyOpen(false)
          toast({ tone: 'success', title: 'Record verified and locked', body: `Version ${a.version} stamped by ${OTHER_USERS[0].name}.` })
        }}
        title="Verify and lock this record?"
        body={`Supervisor approval flips the status from Estimated to Verified, stamps version ${a.version} and makes every field read-only. A locked record can only be changed by re-opening it, which creates version ${a.version + 1}.`}
        confirmLabel="Verify and lock"
      />

      <ConfirmSheet
        open={reopenOpen}
        onCancel={() => setReopenOpen(false)}
        onConfirm={() => {
          reopenAssessment(a.id)
          setReopenOpen(false)
          toast({ tone: 'warn', title: `Re-opened as version ${a.version + 1}`, body: 'The verified version is retained on the audit trail.' })
        }}
        title="Re-open and re-assess?"
        body={`Version ${a.version} stays on the audit trail as the verified record. A new version ${a.version + 1} is created and unlocked for editing, and it will need verifying again before a permit can be issued.`}
        confirmLabel={`Create version ${a.version + 1}`}
        destructive
      />
    </Screen>
  )
}
