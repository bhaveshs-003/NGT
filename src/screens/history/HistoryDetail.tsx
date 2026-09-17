import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, FileText, RotateCcw, ScanText } from 'lucide-react'
import { StatusPill } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet, Sheet } from '@/components/Sheet'
import { svgToDataUri } from '@/data/images'
import { userName } from '@/data/users'
import { overallConfidence } from '@/lib/confidence'
import { dateTime, kg, mm } from '@/lib/format'
import { useApp, useAssessment, useJob } from '@/store/useApp'
import { AuditTrail } from '@/screens/assessment/AuditTrail'

export function HistoryDetail() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const job = useJob(a?.jobId)
  const reopenAssessment = useApp((s) => s.reopenAssessment)
  const toast = useApp((s) => s.toast)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="History" back />}>
        <ErrorState
          title="Record not available"
          body="This assessment is no longer on the device. It may have been cleared by a demo reset."
          onRetry={() => navigate('/history')}
          retryLabel="Back to history"
        />
      </Screen>
    )
  }

  return (
    <Screen
      header={<ScreenHeader title={a.ref} subtitle={`v${a.version} · ${job?.ref ?? ''}`} back right={<StatusPill status={a.status} />} />}
      footer={
        <div className="space-y-2">
          <Button block icon={<ExternalLink size={18} />} onClick={() => navigate(`/assessment/${a.id}`)}>
            Open assessment record
          </Button>
          <div className="flex gap-2">
            {a.liftPlan && (
              <Button variant="secondary" block size="md" icon={<FileText size={16} />} onClick={() => navigate(`/assessment/${a.id}/permit`)}>
                Permit
              </Button>
            )}
            <Button variant="ghost" block size="md" icon={<RotateCcw size={16} />} onClick={() => setReopenOpen(true)}>
              Re-assess
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Card className="p-4">
          <p className="text-[16px] font-bold leading-snug text-steel-100">{a.cargoType.value}</p>
          <p className="mt-0.5 text-[12px] text-steel-400">
            {job?.title} · {job?.berth}
          </p>
          <dl className="mt-3 divide-y divide-steel-850 border-t border-steel-800 text-[13px]">
            {[
              ['Dimensions', `${mm(a.dimensions.length.value)} × ${mm(a.dimensions.width.value)} × ${mm(a.dimensions.height.value)}`],
              ['Weight', kg(a.weightKg.value)],
              ['Material', String(a.material.value)],
              ['Packaging', String(a.packaging.value)],
              ['Mean confidence', overallConfidence(a) > 0 ? `${overallConfidence(a)} / 100` : '—'],
              ['Captured', `${dateTime(a.createdAt)} · ${userName(a.createdBy)}`],
              ['Last change', dateTime(a.updatedAt)],
              ...(a.verifiedAt ? [['Verified', `${dateTime(a.verifiedAt)} · ${userName(a.verifiedBy ?? '')}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-steel-400">{k}</dt>
                <dd className="text-right font-medium text-steel-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Section
          title={`Original captures (${a.captures.length})`}
          action={
            a.labelText && (
              <button className="flex items-center gap-1 text-[12px] font-semibold text-amber-500" onClick={() => setLabelOpen(true)}>
                <ScanText size={13} /> Label text
              </button>
            )
          }
        >
          <div className="grid grid-cols-2 gap-2.5">
            {a.captures.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-xl border border-steel-800 bg-steel-900">
                <img src={svgToDataUri(c.svg)} alt={`${c.label} capture`} className="h-[96px] w-full object-cover" draggable={false} />
                <div className="px-2.5 py-2">
                  <p className="truncate text-[12px] font-semibold text-steel-100">{c.label}</p>
                  <p className="text-[10.5px] text-steel-500">
                    {dateTime(c.takenAt)} · attempt {c.attempt}
                  </p>
                  <p className={`text-[10.5px] ${c.quality.passed ? 'text-conf-high' : 'text-conf-low'}`}>
                    {c.quality.passed ? 'Quality check passed' : `Failed: ${c.quality.failedMetric}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={`Full audit trail (${a.audit.length})`}>
          <Card className="p-3.5">
            <AuditTrail entries={a.audit} />
          </Card>
        </Section>
      </div>

      <Sheet open={labelOpen} onClose={() => setLabelOpen(false)} title="Label OCR output">
        <pre className="whitespace-pre-wrap rounded-xl border border-steel-800 bg-steel-950 p-3 font-mono text-[12px] leading-relaxed text-steel-300">
          {a.labelText ?? 'No label text was read for this record.'}
        </pre>
      </Sheet>

      <ConfirmSheet
        open={reopenOpen}
        onCancel={() => setReopenOpen(false)}
        onConfirm={() => {
          reopenAssessment(a.id)
          setReopenOpen(false)
          toast({ tone: 'warn', title: `Re-opened as version ${a.version + 1}`, body: 'The previous version is retained on the audit trail.' })
          navigate(`/assessment/${a.id}`)
        }}
        title="Re-open and re-assess?"
        body={`Version ${a.version} is retained on the audit trail. A new version ${a.version + 1} is created and unlocked for editing.`}
        confirmLabel={`Create version ${a.version + 1}`}
        destructive
      />
    </Screen>
  )
}
