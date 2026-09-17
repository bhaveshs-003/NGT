import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, ClipboardCopy, Download, Lock, Share2, ShieldCheck } from 'lucide-react'
import { Badge, EstimatedVerifiedPill } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Callout, EmptyState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet, Sheet } from '@/components/Sheet'
import { LiftSketch } from '@/components/SlingDiagram'
import { crane } from '@/data/craneLoadCharts'
import { CURRENT_USER, OTHER_USERS, userName } from '@/data/users'
import { dateTime, kg, metres, mm, pct, tonnes } from '@/lib/format'
import { calculateLift } from '@/lib/lifting'
import { copyToClipboard, formatPermitText } from '@/lib/permitText'
import { useApp, useAssessment, useJob } from '@/store/useApp'

export function LiftPermit() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const job = useJob(a?.jobId)
  const settings = useApp((s) => s.settings)
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const verifyAssessment = useApp((s) => s.verifyAssessment)
  const appendAudit = useApp((s) => s.appendAudit)
  const toast = useApp((s) => s.toast)

  const [busy, setBusy] = useState<'pdf' | 'copy' | null>(null)
  const [copied, setCopied] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  if (!a || !a.liftPlan) {
    return (
      <Screen header={<ScreenHeader title="Lift summary" back />}>
        <EmptyState
          title="No lift plan yet"
          body="Build the lifting assistance plan before the permit can be produced."
          actionLabel="Back to assessment"
          onAction={() => navigate(a ? `/assessment/${a.id}` : '/jobs')}
        />
      </Screen>
    )
  }

  const plan = a.liftPlan
  const calc = calculateLift(a, plan, settings)
  const c = crane(plan.craneId)
  const permitText = formatPermitText(a, job, calc)
  const verified = a.status === 'verified'

  async function onPdf() {
    setBusy('pdf')
    try {
      // jsPDF is heavy; keep it out of the initial bundle.
      const { exportPermitPdf } = await import('@/lib/pdf')
      const name = await exportPermitPdf(a!, job, calc, user)
      appendAudit(a!.id, {
        at: new Date().toISOString(),
        actorId: user.id,
        actorName: user.name,
        action: 'Permit exported',
        detail: `PDF ${name} generated on device.`,
      })
      toast({ tone: 'success', title: 'PDF downloaded', body: name })
    } catch {
      toast({ tone: 'error', title: 'Export failed', body: 'The PDF could not be generated on this device.' })
    }
    setBusy(null)
  }

  async function onCopy() {
    setBusy('copy')
    const ok = await copyToClipboard(permitText)
    setBusy(null)
    setCopied(ok)
    toast({
      tone: ok ? 'success' : 'error',
      title: ok ? 'Permit text copied' : 'Copy failed',
      body: ok ? 'Paste into the terminal log or the crane cab tablet.' : 'Select the text manually from the preview.',
    })
    if (ok) window.setTimeout(() => setCopied(false), 2600)
  }

  return (
    <Screen
      header={<ScreenHeader title="Lift summary" subtitle={`${a.ref} · v${a.version}`} back />}
      footer={
        <div className="space-y-2">
          <Button block icon={<Download size={18} />} loading={busy === 'pdf'} onClick={onPdf}>
            Export PDF permit
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              block
              size="md"
              icon={copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
              loading={busy === 'copy'}
              onClick={onCopy}
            >
              {copied ? 'Copied' : 'Copy text'}
            </Button>
            <Button variant="secondary" block size="md" icon={<Share2 size={16} />} onClick={() => setShareOpen(true)}>
              Share
            </Button>
          </div>
          {!verified && (
            <Button block variant="ghost" size="md" icon={<ShieldCheck size={16} />} onClick={() => setVerifyOpen(true)}>
              Verify and lock record
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {!verified && (
          <Callout tone="caution" title="Estimated — not yet a valid permit" icon={<AlertTriangle size={16} />}>
            Values are AI-assisted estimates. The record must be verified by a supervisor before this is issued as a
            lifting permit.
          </Callout>
        )}

        {/* --- permit card, laid out like the paper document ---------------- */}
        <Card className="overflow-hidden">
          <div className="hazard-stripe border-b border-steel-800 bg-steel-850 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">NGT Lifting Permit</p>
                <p className="mt-1 font-mono text-[15px] font-bold text-steel-100">{a.ref}</p>
                <p className="text-[11px] text-steel-400">
                  {job?.ref} · {job?.berth}
                </p>
              </div>
              <EstimatedVerifiedPill status={a.status} />
            </div>
          </div>

          <div className="border-b border-steel-800 px-4 py-3">
            <PermitRow label="Vessel" value={job?.vessel ?? '—'} />
            <PermitRow label="Cargo" value={String(a.cargoType.value)} />
            <PermitRow label="Packaging" value={String(a.packaging.value)} />
            <PermitRow
              label="Dimensions"
              value={`${mm(a.dimensions.length.value)} × ${mm(a.dimensions.width.value)} × ${mm(a.dimensions.height.value)}`}
            />
          </div>

          <div className="border-b border-steel-800 bg-steel-950/40 px-4 py-3">
            <p className="field-label">Gross weight on the hook</p>
            <p className="tabular mt-1 text-[26px] font-bold leading-none text-amber-500">{tonnes(calc.grossKg)}</p>
            <p className="tabular mt-1 text-[12px] text-steel-400">
              {kg(calc.cargoKg)} cargo + {kg(calc.riggingKg, { decimals: 1 })} rigging + {kg(calc.contingencyKg)}{' '}
              contingency
            </p>
          </div>

          <div className="border-b border-steel-800 px-4 py-3">
            <LiftSketch assessment={a} plan={plan} legLoadKg={calc.legLoadKg} />
            <div className="mt-2 grid grid-cols-2 gap-x-4">
              <PermitRow label="Sling angle" value={`${plan.slingAngleDeg}° (×${calc.angleFactor.toFixed(2)})`} />
              <PermitRow label="Load per leg" value={kg(calc.legLoadKg)} />
              <PermitRow
                label="Lifting points"
                value={plan.liftingPointsPresent ? `${plan.liftingPointCount} certified` : 'None — sling arrangement'}
              />
              <PermitRow label="CoG offset" value={`${plan.cogOffsetMm.x} mm`} />
            </div>
          </div>

          <div className="border-b border-steel-800 px-4 py-3">
            <p className="field-label mb-1.5">Rigging</p>
            {calc.rigging.map((r) => (
              <p key={r.label} className="text-[12.5px] leading-relaxed text-steel-300">
                {r.qty} × {r.label}
                <span className="text-steel-500"> — {r.detail}</span>
              </p>
            ))}
          </div>

          <div className="px-4 py-3">
            <PermitRow label="Crane" value={`${c.name} · ${c.type}`} />
            <PermitRow label="Configuration" value={calc.boomLabel} />
            <PermitRow label="Radius" value={metres(plan.radiusM, 0)} />
            <PermitRow label="Chart capacity" value={kg(calc.capacityKg)} />
            <div className="mt-2 flex items-center justify-between rounded-lg border px-3 py-2"
              style={{
                borderColor: calc.nearCapacity ? 'rgba(239,68,68,0.45)' : 'rgba(34,197,94,0.35)',
                background: calc.nearCapacity ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.07)',
              }}
            >
              <span className="text-[12px] font-semibold text-steel-200">Utilisation</span>
              <span className={`tabular text-[16px] font-bold ${calc.nearCapacity ? 'text-conf-low' : 'text-conf-high'}`}>
                {pct(calc.utilisationPct, 0)}
              </span>
            </div>
          </div>

          {a.flags.length > 0 && (
            <div className="border-t border-steel-800 px-4 py-3">
              <p className="field-label mb-1.5">Cautions</p>
              <div className="space-y-1.5">
                {a.flags.map((f) => (
                  <div key={f.id} className="flex items-start gap-2">
                    <Badge tone={f.severity === 'critical' ? 'red' : f.severity === 'caution' ? 'amber' : 'neutral'}>
                      {f.severity}
                    </Badge>
                    <p className="min-w-0 flex-1 text-[12px] leading-snug text-steel-300">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-steel-800 bg-steel-850 px-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-[11.5px]">
              <div>
                <p className="text-steel-500">Lifting supervisor</p>
                <p className="mt-0.5 font-semibold text-steel-200">{userName(a.createdBy)}</p>
                <div className="mt-3 border-b border-dashed border-steel-600" />
                <p className="mt-1 text-[10px] text-steel-500">Signature / date</p>
              </div>
              <div>
                <p className="text-steel-500">Approved by</p>
                <p className="mt-0.5 font-semibold text-steel-200">
                  {a.verifiedBy ? userName(a.verifiedBy) : 'Pending verification'}
                </p>
                <div className="mt-3 border-b border-dashed border-steel-600" />
                <p className="mt-1 text-[10px] text-steel-500">Signature / date</p>
              </div>
            </div>
            {verified && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-conf-high">
                <Lock size={11} /> Locked {dateTime(a.verifiedAt ?? '')} · version {a.version}
              </p>
            )}
          </div>
        </Card>

        <Section title="Permit text">
          <Card className="p-3">
            <pre className="app-scroll max-h-56 overflow-auto whitespace-pre font-mono text-[10.5px] leading-relaxed text-steel-400">
              {permitText}
            </pre>
          </Card>
        </Section>
      </div>

      <ConfirmSheet
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        onConfirm={() => {
          verifyAssessment(a.id, OTHER_USERS[0].id)
          setVerifyOpen(false)
          toast({ tone: 'success', title: 'Verified and locked', body: `Permit issued for ${a.ref}.` })
        }}
        title="Verify and lock this record?"
        body={`Approval by ${OTHER_USERS[0].name} flips the record from Estimated to Verified, stamps version ${a.version} and makes every field read-only.`}
        confirmLabel="Verify and lock"
      />

      <Sheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share lift summary"
        subtitle="Simulated — nothing leaves this device in the prototype"
      >
        <div className="space-y-2">
          {[
            ['Crane cab tablet', 'Push to the cab display on ' + c.name],
            ['Terminal operations', 'Post into the shift log for ' + (job?.ref ?? 'this job')],
            ['Vessel chief officer', 'Email the PDF to the vessel'],
            ['Print to quay office', 'A4 permit, two copies'],
          ].map(([title, sub]) => (
            <button
              key={title}
              onClick={() => {
                setShareOpen(false)
                toast({ tone: 'success', title: `Sent to ${title.toLowerCase()}`, body: 'Simulated handover recorded on the audit trail.' })
                appendAudit(a.id, {
                  at: new Date().toISOString(),
                  actorId: user.id,
                  actorName: user.name,
                  action: 'Permit shared',
                  detail: `Destination: ${title}.`,
                })
              }}
              className="flex w-full min-h-[56px] items-center gap-3 rounded-xl border border-steel-700 bg-steel-850 px-3.5 py-3 text-left hover:border-steel-600"
            >
              <Share2 size={17} className="shrink-0 text-amber-500" />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-steel-100">{title}</span>
                <span className="block text-[11.5px] text-steel-400">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

function PermitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="shrink-0 text-[11.5px] text-steel-500">{label}</span>
      <span className="truncate text-right text-[12.5px] font-semibold text-steel-200">{value}</span>
    </div>
  )
}
