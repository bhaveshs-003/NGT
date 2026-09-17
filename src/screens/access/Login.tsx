import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Form'
import { Callout } from '@/components/Feedback'
import { DEMO_CREDENTIALS } from '@/data/users'
import { login as mockLogin } from '@/services/mock/session'
import { useApp } from '@/store/useApp'
import { NgtLogo } from './Splash'

export function Login() {
  const navigate = useNavigate()
  const doLogin = useApp((s) => s.login)
  const deviceRegistered = useApp((s) => s.deviceRegistered)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    const res = await mockLogin(email, password)
    setBusy(false)
    if (!res.ok || !res.user) {
      setError(res.error)
      return
    }
    doLogin(res.user)
    navigate(deviceRegistered ? '/jobs' : '/device-registration', { replace: true })
  }

  return (
    <div className="app-scroll h-full overflow-y-auto px-6 py-10">
      <div className="mx-auto flex max-w-[340px] flex-col">
        <NgtLogo size={56} />
        <h1 className="mt-5 text-[22px] font-bold leading-tight text-steel-100">Sign in</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-steel-400">
          Use your NGT operations account. Access is bound to this device once registered.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="name@ngt-lifting.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Callout tone="critical" icon={<ShieldCheck size={16} />}>
              {error}
            </Callout>
          )}

          <Button type="submit" block loading={busy} icon={<KeyRound size={18} />}>
            Sign in
          </Button>
        </form>

        <Link
          to="/forgot-password"
          className="mt-4 self-center py-2 text-[13px] font-semibold text-amber-500 hover:text-amber-400"
        >
          Forgot password?
        </Link>

        <div className="mt-8 rounded-xl border border-dashed border-steel-700 bg-steel-900 p-3.5">
          <p className="field-label">Demo credentials</p>
          <dl className="mt-2 space-y-1 font-mono text-[12px] text-steel-300">
            <div className="flex justify-between gap-2">
              <dt className="text-steel-500">email</dt>
              <dd className="truncate">{DEMO_CREDENTIALS.email}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-steel-500">password</dt>
              <dd>{DEMO_CREDENTIALS.password}</dd>
            </div>
          </dl>
          <Button
            size="sm"
            variant="ghost"
            block
            className="mt-3"
            onClick={() => {
              setEmail(DEMO_CREDENTIALS.email)
              setPassword(DEMO_CREDENTIALS.password)
            }}
          >
            Fill demo credentials
          </Button>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-steel-600">
          Prototype build 1.4.0 · No live data · All processing simulated on device
        </p>
      </div>
    </div>
  )
}
