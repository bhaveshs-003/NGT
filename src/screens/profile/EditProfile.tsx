import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout } from '@/components/Feedback'
import { TextField } from '@/components/Form'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { CURRENT_USER } from '@/data/users'
import { dateOnly } from '@/lib/format'
import { useApp } from '@/store/useApp'

export function EditProfile() {
  const navigate = useNavigate()
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const login = useApp((s) => s.login)
  const toast = useApp((s) => s.toast)

  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (name.trim().length < 3) next.name = 'Enter your full name as it appears on your certification.'
    if (phone.trim().length < 7) next.phone = 'Enter a contactable number for the shift.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    await new Promise((r) => setTimeout(r, 700))
    login({ ...user, name: name.trim(), phone: phone.trim() })
    setBusy(false)
    toast({ tone: 'success', title: 'Profile updated' })
    navigate('/profile')
  }

  return (
    <Screen
      header={<ScreenHeader title="Edit profile" back />}
      footer={
        <Button block loading={busy} onClick={onSubmit as unknown as () => void}>
          Save changes
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField
          label="Contact number"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />

        <Section title="Managed by NGT operations">
          <Card className="divide-y divide-steel-850 px-3.5">
            {[
              ['Email', user.email],
              ['Role', user.role],
              ['Company', user.company],
              ['Certification', user.certification],
              ['Cert expiry', dateOnly(user.certExpiry)],
              ['Device ID', user.deviceId],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="field-label">{k}</p>
                  <p className="mt-0.5 truncate text-[13.5px] font-medium text-steel-300">{v}</p>
                </div>
                <Lock size={14} className="shrink-0 text-steel-600" />
              </div>
            ))}
          </Card>
        </Section>

        <Callout tone="info">
          Role, certification and device binding are set by NGT operations. Raise a request with the terminal
          superintendent to change them.
        </Callout>
      </form>
    </Screen>
  )
}
