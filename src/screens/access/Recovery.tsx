import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout } from '@/components/Feedback'
import { TextField } from '@/components/Form'
import { Screen, ScreenHeader } from '@/components/Screen'
import { confirmPasswordReset, requestPasswordReset } from '@/services/mock/session'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    const res = await requestPasswordReset(email)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setSent(true)
  }

  return (
    <Screen header={<ScreenHeader title="Forgot password" back onBack={() => navigate('/login')} />}>
      {sent ? (
        <div className="space-y-5">
          <Callout tone="success" title="Reset link sent" icon={<Mail size={16} />}>
            If an NGT account exists for <span className="font-semibold">{email}</span>, a reset link has been sent. It
            expires in 30 minutes.
          </Callout>
          <p className="text-[13px] leading-relaxed text-steel-400">
            Links open in this app on a registered device. If you are not on your bound device, contact the terminal
            duty supervisor to re-issue the binding.
          </p>
          <Button block onClick={() => navigate('/reset-password')}>
            Open reset link (demo)
          </Button>
          <Button block variant="ghost" onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <p className="text-[13px] leading-relaxed text-steel-400">
            Enter the email on your NGT operations account. We will send a reset link valid for 30 minutes.
          </p>
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="name@ngt-lifting.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" block loading={busy}>
            Send reset link
          </Button>
          <Link to="/login" className="block py-2 text-center text-[13px] font-semibold text-amber-500">
            Back to sign in
          </Link>
        </form>
      )}
    </Screen>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    const res = await confirmPasswordReset(pw, confirm)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setDone(true)
  }

  if (done) {
    return (
      <Screen header={<ScreenHeader title="Password updated" />}>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-conf-high/40 bg-conf-high/10 text-conf-high">
            <CheckCircle2 size={30} />
          </div>
          <h2 className="mt-5 text-[17px] font-bold text-steel-100">Password changed</h2>
          <p className="mt-2 max-w-[32ch] text-[13px] leading-relaxed text-steel-400">
            Your password has been updated and all other sessions on this account have been signed out. The device
            binding on this handset is unchanged.
          </p>
          <Button className="mt-7 w-full" onClick={() => navigate('/login', { replace: true })}>
            Sign in
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen header={<ScreenHeader title="Set a new password" back onBack={() => navigate('/forgot-password')} />}>
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-[13px] leading-relaxed text-steel-400">
          Minimum 10 characters. Do not reuse a password from another terminal system.
        </p>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error}
        />
        <Button type="submit" block loading={busy}>
          Update password
        </Button>
      </form>
    </Screen>
  )
}
