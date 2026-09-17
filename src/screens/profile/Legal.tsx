import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout } from '@/components/Feedback'
import { TextField } from '@/components/Form'
import { Card, Screen, ScreenHeader } from '@/components/Screen'
import { ConfirmSheet } from '@/components/Sheet'
import { CURRENT_USER } from '@/data/users'
import { deleteAccount } from '@/services/mock/session'
import { useApp } from '@/store/useApp'

function Prose({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <Screen header={<ScreenHeader title={title} back />}>
      <div className="space-y-4">
        <p className="text-[11.5px] uppercase tracking-wider text-steel-500">Last updated {updated}</p>
        {sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-[14px] font-bold text-steel-100">{heading}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-steel-400">{body}</p>
          </section>
        ))}
        <p className="pb-2 text-[11.5px] leading-relaxed text-steel-600">
          Prototype copy for demonstration. Not legal advice and not the final published terms.
        </p>
      </div>
    </Screen>
  )
}

export function Terms() {
  return (
    <Prose
      title="Terms and conditions"
      updated="1 September 2026"
      sections={[
        [
          '1. Scope of the service',
          'The NGT Cargo Assessment app produces AI-assisted estimates of cargo dimensions, classification and weight, and supporting lifting calculations. Estimates are decision support for a competent person. They do not replace the manufacturer load chart, the lift plan, or the judgement of the appointed person.',
        ],
        [
          '2. Competence and responsibility',
          'You confirm that you hold current certification appropriate to the lifting operations you record, and that you remain responsible for every lift carried out on the basis of a record produced in this app. A record marked Estimated is not a lifting permit.',
        ],
        [
          '3. Verification and locking',
          'A record becomes a permit only once a supervisor has verified it. Verification stamps a version number and makes the record read-only. Re-opening a verified record creates a new version; the verified version is retained in full.',
        ],
        [
          '4. Device binding',
          'Access is bound to a single registered handset. Every capture, override and verification carries the device identifier so that the audit trail can be reconstructed. Sharing credentials or handsets breaches these terms.',
        ],
        [
          '5. Offline working',
          'Captures taken without coverage are held on the device and uploaded in order when coverage returns. Records held on the device have not been assessed and must not be used to plan a lift.',
        ],
        [
          '6. Accuracy and limits',
          'Confidence scores reflect the model’s own uncertainty, not a guarantee. Any field below your configured threshold must be entered by hand. Weight resolved by density and volume is an estimate only and must be treated as such when the cargo is concealed or irregular.',
        ],
        [
          '7. Audit and retention',
          'Assessment records, capture frames and audit entries are retained for the period set by the terminal operator and may be produced in an incident investigation.',
        ],
      ]}
    />
  )
}

export function Privacy() {
  return (
    <Prose
      title="Privacy policy"
      updated="1 September 2026"
      sections={[
        [
          'What we hold',
          'Your name, work email, contact number, role, certification details and the identifier of your bound handset. We also hold the assessments you produce, including capture frames, derived values, overrides and audit entries.',
        ],
        [
          'Why we hold it',
          'To attribute lifting records to a competent person, to reconstruct the sequence of a lift after the fact, and to meet the terminal operator’s record-keeping obligations for lifting operations.',
        ],
        [
          'Capture frames',
          'Frames are taken to derive dimensions and read labels. They are stored against the assessment record. They are not used to identify people, and faces incidentally captured on the quay are not processed.',
        ],
        [
          'Location and device data',
          'The app records the berth or yard block you select and the identifier of your handset. It does not track your position continuously.',
        ],
        [
          'Who sees it',
          'NGT operations supervisors, the terminal operator for the job in question, and any party lawfully entitled to the record in an incident investigation.',
        ],
        [
          'Retention and deletion',
          'Assessment records are retained for the period set by the terminal operator. Deleting your account removes your profile and sign-in, but assessments you produced are retained against the job, attributed to your name, because they form part of a lifting record.',
        ],
        [
          'Your rights',
          'You can request a copy of the personal data held about you, and ask for corrections. Contact the terminal data controller through NGT operations.',
        ],
      ]}
    />
  )
}

/** Two-step confirmation: acknowledge the consequences, then type to confirm. */
export function DeleteAccount() {
  const navigate = useNavigate()
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const logout = useApp((s) => s.logout)
  const assessments = useApp((s) => s.assessments)
  const toast = useApp((s) => s.toast)

  const [stepOneDone, setStepOneDone] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const mine = assessments.filter((a) => a.createdBy === user.id).length
  const phraseOk = confirmText.trim().toUpperCase() === 'DELETE'

  return (
    <Screen
      header={<ScreenHeader title="Delete account" back />}
      footer={
        stepOneDone ? (
          <Button block variant="danger" disabled={!phraseOk} onClick={() => setSheetOpen(true)} icon={<Trash2 size={17} />}>
            Delete my account
          </Button>
        ) : (
          <Button block variant="danger" onClick={() => setStepOneDone(true)}>
            Continue to step 2
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <Callout tone="critical" title="This cannot be undone" icon={<AlertTriangle size={16} />}>
          Deleting your account removes your profile, your sign-in and the binding to {user.deviceId}.
        </Callout>

        <Card className="p-4">
          <p className="field-label">Step 1 of 2 — what happens</p>
          <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-steel-300">
            <li>• Your profile and sign-in are removed immediately.</li>
            <li>• The device binding on {user.deviceId} is released.</li>
            <li>
              • The {mine} assessment{mine === 1 ? '' : 's'} you produced stay against their jobs, attributed to your
              name, because they form part of a lifting record.
            </li>
            <li>• Anything still in the device queue is discarded and never reaches the server.</li>
          </ul>
        </Card>

        {stepOneDone && (
          <Card className="p-4">
            <p className="field-label">Step 2 of 2 — confirm</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-steel-400">
              Type <span className="font-mono font-bold text-steel-100">DELETE</span> to confirm you want to remove the
              account for {user.email}.
            </p>
            <div className="mt-3">
              <TextField
                label="Confirmation"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoCapitalize="characters"
              />
            </div>
          </Card>
        )}
      </div>

      <ConfirmSheet
        open={sheetOpen}
        loading={busy}
        onCancel={() => setSheetOpen(false)}
        onConfirm={async () => {
          setBusy(true)
          await deleteAccount()
          setBusy(false)
          setSheetOpen(false)
          logout()
          toast({ tone: 'info', title: 'Account deleted', body: 'Your profile and device binding have been removed.' })
          navigate('/login', { replace: true })
        }}
        title="Delete this account permanently?"
        body={`Final confirmation. The account for ${user.email} and the binding to ${user.deviceId} will be removed. This cannot be reversed.`}
        confirmLabel="Delete permanently"
        destructive
      />
    </Screen>
  )
}
