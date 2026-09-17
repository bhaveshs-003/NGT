import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Fingerprint, Smartphone } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout } from '@/components/Feedback'
import { Card, Screen, ScreenHeader } from '@/components/Screen'
import { CURRENT_USER } from '@/data/users'
import { dateTime } from '@/lib/format'
import { registerDevice } from '@/services/mock/session'
import { useApp } from '@/store/useApp'

export function DeviceRegistration() {
  const navigate = useNavigate()
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const markRegistered = useApp((s) => s.registerDevice)
  const toast = useApp((s) => s.toast)
  const [busy, setBusy] = useState(false)
  const [registeredAt, setRegisteredAt] = useState<string>()

  async function onRegister() {
    setBusy(true)
    const res = await registerDevice(user.deviceId)
    setBusy(false)
    setRegisteredAt(res.registeredAt)
    markRegistered()
    toast({ tone: 'success', title: 'Device registered', body: `${user.deviceId} bound to your account.` })
  }

  return (
    <Screen
      header={<ScreenHeader title="Register this device" subtitle="First sign-in on a new handset" />}
      footer={
        registeredAt ? (
          <Button block onClick={() => navigate('/jobs', { replace: true })}>
            Continue to jobs
          </Button>
        ) : (
          <Button block loading={busy} onClick={onRegister} icon={<Fingerprint size={18} />}>
            Bind device to my account
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-steel-700 bg-steel-850 text-amber-500">
              <Smartphone size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="field-label">Device identifier</p>
              <p className="mt-0.5 font-mono text-[15px] font-bold text-steel-100">{user.deviceId}</p>
              <p className="mt-1 text-[12px] leading-snug text-steel-400">
                Issued by NGT IT and stencilled on the back of the handset.
              </p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-steel-800 border-t border-steel-800 text-[13px]">
            {[
              ['Account', user.email],
              ['Role', user.role],
              ['Company', user.company],
              ['Certification', user.certification],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-400">{k}</dt>
                <dd className="truncate text-right font-medium text-steel-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {registeredAt ? (
          <Callout tone="success" title="Device bound" icon={<CheckCircle2 size={16} />}>
            Registered {dateTime(registeredAt)}. Assessments captured on this handset will carry {user.deviceId} in the
            audit trail.
          </Callout>
        ) : (
          <Callout tone="caution" title="One device per account">
            Binding this handset signs you out of any other device. Captures already held in another device queue will
            not transfer.
          </Callout>
        )}

        <p className="px-1 text-[12px] leading-relaxed text-steel-500">
          Device binding ties every capture, override and verification stamp to a specific handset so the audit trail
          can be reconstructed after the fact.
        </p>
      </div>
    </Screen>
  )
}
