import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, ChevronRight, Package, RefreshCw, ShieldAlert, Siren } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { Card, Screen, ScreenHeader } from '@/components/Screen'
import { CATEGORY_LABEL } from '@/data/notifications'
import { relative } from '@/lib/format'
import { useApp } from '@/store/useApp'
import type { NotificationCategory } from '@/types'

const ICONS: Record<NotificationCategory, typeof Bell> = {
  'assessment-complete': Package,
  'verification-required': ShieldAlert,
  'job-assignment': Bell,
  sync: RefreshCw,
  'safety-bulletin': Siren,
}

export function Notifications() {
  const navigate = useNavigate()
  const notifications = useApp((s) => s.notifications)
  const prefs = useApp((s) => s.settings.notifications)
  const markRead = useApp((s) => s.markNotificationRead)
  const markAll = useApp((s) => s.markAllNotificationsRead)

  const visible = notifications.filter((n) => prefs[n.category])
  const muted = notifications.length - visible.length
  const unread = visible.filter((n) => !n.read).length

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
          back
          right={
            unread > 0 && (
              <button onClick={markAll} aria-label="Mark all read" className="flex h-11 w-11 items-center justify-center rounded-xl text-steel-300 hover:bg-steel-800">
                <CheckCheck size={19} />
              </button>
            )
          }
        />
      }
    >
      <div className="space-y-3">
        {visible.length === 0 ? (
          <EmptyState
            icon={<BellOff size={24} />}
            title="No notifications"
            body={
              muted > 0
                ? `${muted} notification${muted === 1 ? ' is' : 's are'} hidden by your category preferences.`
                : 'Assessment results, verification requests and safety bulletins land here.'
            }
            actionLabel="Notification settings"
            onAction={() => navigate('/profile/notifications')}
          />
        ) : (
          visible.map((n) => {
            const Icon = ICONS[n.category]
            return (
              <Card
                key={n.id}
                onClick={() => {
                  markRead(n.id)
                  if (n.deepLink) navigate(n.deepLink)
                }}
                className={`p-3.5 ${n.read ? '' : 'border-amber-500/30 bg-amber-500/[0.04]'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${n.read ? 'border-steel-700 bg-steel-850 text-steel-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-500'}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={n.read ? 'neutral' : 'amber'}>{CATEGORY_LABEL[n.category]}</Badge>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    </div>
                    <p className="mt-1 text-[13.5px] font-bold leading-snug text-steel-100">{n.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-steel-400">{n.body}</p>
                    <p className="mt-1 text-[11px] text-steel-500">{relative(n.at)}</p>
                  </div>
                  {n.deepLink && <ChevronRight size={17} className="mt-1 shrink-0 text-steel-600" />}
                </div>
              </Card>
            )
          })
        )}

        {muted > 0 && visible.length > 0 && (
          <Button variant="ghost" block size="sm" onClick={() => navigate('/profile/notifications')}>
            {muted} hidden by your preferences
          </Button>
        )}
      </div>
    </Screen>
  )
}
