import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  FileText,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCog,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { ConfirmSheet } from '@/components/Sheet'
import { CURRENT_USER } from '@/data/users'
import { dateOnly, dateTime } from '@/lib/format'
import { pendingSyncCount, useApp } from '@/store/useApp'

export function Profile() {
  const navigate = useNavigate()
  const user = useApp((s) => s.authUser) ?? CURRENT_USER
  const logout = useApp((s) => s.logout)
  const resetDemo = useApp((s) => s.resetDemo)
  const lastLoginAt = useApp((s) => s.lastLoginAt)
  const queue = useApp((s) => s.syncQueue)
  const toast = useApp((s) => s.toast)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const pending = pendingSyncCount(queue)

  return (
    <Screen header={<ScreenHeader title="Profile" />}>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-[18px] font-bold text-amber-500">
              {user.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-steel-100">{user.name}</p>
              <p className="truncate text-[12.5px] text-steel-400">{user.role}</p>
              <p className="truncate text-[12px] text-steel-500">{user.company}</p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-steel-850 border-t border-steel-800 text-[13px]">
            {[
              ['Email', user.email],
              ['Phone', user.phone],
              ['Certification', user.certification],
              ['Cert expiry', dateOnly(user.certExpiry)],
              ['Last sign-in', lastLoginAt ? dateTime(lastLoginAt) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-steel-400">{k}</dt>
                <dd className="truncate text-right font-medium text-steel-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="flex items-center gap-3 p-3.5">
          <Smartphone size={18} className="shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="field-label">Bound device</p>
            <p className="font-mono text-[13.5px] font-semibold text-steel-100">{user.deviceId}</p>
          </div>
        </Card>

        <Section title="Account">
          <Card className="divide-y divide-steel-850">
            <MenuRow icon={<UserCog size={18} />} label="Edit profile" onClick={() => navigate('/profile/edit')} />
            <MenuRow
              icon={<Bell size={18} />}
              label="Notification preferences"
              onClick={() => navigate('/profile/notifications')}
            />
            <MenuRow
              icon={<Settings size={18} />}
              label="Assessment settings"
              hint="Thresholds, contingency, demo toggles"
              onClick={() => navigate('/profile/settings')}
            />
            <MenuRow
              icon={<RefreshCw size={18} />}
              label="Sync queue"
              hint={pending > 0 ? `${pending} pending` : 'All synced'}
              onClick={() => navigate('/sync')}
            />
          </Card>
        </Section>

        <Section title="Legal">
          <Card className="divide-y divide-steel-850">
            <MenuRow icon={<FileText size={18} />} label="Terms and conditions" onClick={() => navigate('/profile/terms')} />
            <MenuRow icon={<ShieldCheck size={18} />} label="Privacy policy" onClick={() => navigate('/profile/privacy')} />
          </Card>
        </Section>

        <Section title="Danger zone">
          <Card className="divide-y divide-steel-850">
            <MenuRow
              icon={<Trash2 size={18} className="text-conf-low" />}
              label="Delete account"
              hint="Two-step confirmation"
              danger
              onClick={() => navigate('/profile/delete')}
            />
          </Card>
        </Section>

        <div className="space-y-2 pt-1">
          <Button variant="ghost" block size="md" icon={<RefreshCw size={16} />} onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
          <Button variant="secondary" block icon={<LogOut size={17} />} onClick={() => setLogoutOpen(true)}>
            Sign out
          </Button>
        </div>

        <p className="pb-2 text-center text-[11px] leading-relaxed text-steel-600">
          NGT Cargo Assessment · prototype build 1.4.0
          <br />
          No live data. All inference, upload and sync simulated on device.
        </p>
      </div>

      <ConfirmSheet
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        title="Sign out?"
        body={
          pending > 0
            ? `${pending} item${pending === 1 ? ' is' : 's are'} still waiting to sync. Signing out keeps them on the device but they will not upload until you sign back in.`
            : 'You will need your password to sign back in. The device binding is kept.'
        }
        confirmLabel="Sign out"
        destructive={pending > 0}
      />

      <ConfirmSheet
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo()
          setResetOpen(false)
          toast({ tone: 'success', title: 'Demo data reset', body: 'Jobs, assessments and the sync queue are back to their seeded state.' })
          navigate('/jobs')
        }}
        title="Reset demo data?"
        body="Restores the seeded jobs, assessments, notifications and sync queue, and clears anything captured during this walkthrough. You stay signed in."
        confirmLabel="Reset"
        destructive
      />
    </Screen>
  )
}

function MenuRow({
  icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button onClick={onClick} className="flex min-h-[54px] w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-steel-850">
      <span className={`shrink-0 ${danger ? 'text-conf-low' : 'text-steel-400'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] font-semibold ${danger ? 'text-conf-low' : 'text-steel-100'}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-[11.5px] text-steel-500">{hint}</span>}
      </span>
      <ChevronRight size={17} className="shrink-0 text-steel-600" />
    </button>
  )
}
