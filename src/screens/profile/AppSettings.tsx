import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CloudOff, Download, FlaskConical, Gauge, Percent } from 'lucide-react'
import { Button } from '@/components/Button'
import { Callout } from '@/components/Feedback'
import { Slider, Toggle } from '@/components/Form'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { CATEGORY_DESCRIPTION, CATEGORY_LABEL } from '@/data/notifications'
import { DEFAULT_SETTINGS, useApp } from '@/store/useApp'
import type { NotificationCategory } from '@/types'

export function AppSettings() {
  const navigate = useNavigate()
  const settings = useApp((s) => s.settings)
  const setSettings = useApp((s) => s.setSettings)
  const toast = useApp((s) => s.toast)
  const assessments = useApp((s) => s.assessments)

  const affected = assessments.filter((a) =>
    [a.dimensions.length, a.dimensions.width, a.dimensions.height, a.cargoType, a.material, a.packaging, a.weightKg].some(
      (f) => f.confidence > 0 && f.confidence < settings.confidenceThreshold,
    ),
  ).length

  return (
    <Screen
      header={<ScreenHeader title="Assessment settings" back />}
      footer={
        <Button
          block
          variant="ghost"
          onClick={() => {
            setSettings({
              confidenceThreshold: DEFAULT_SETTINGS.confidenceThreshold,
              contingencyPct: DEFAULT_SETTINGS.contingencyPct,
              utilisationWarnPct: DEFAULT_SETTINGS.utilisationWarnPct,
              autoAdvanceCapture: DEFAULT_SETTINGS.autoAdvanceCapture,
            })
            toast({ tone: 'success', title: 'Settings restored to defaults' })
          }}
        >
          Restore defaults
        </Button>
      }
    >
      <div className="space-y-4">
        <Section title="Confidence">
          <Card className="space-y-3 p-4">
            <Slider
              label="Manual-entry threshold"
              value={settings.confidenceThreshold}
              min={40}
              max={95}
              step={5}
              onChange={(v) => setSettings({ confidenceThreshold: v })}
              format={(v) => `${v} / 100`}
              hint="Any derived field scoring below this must be entered by hand before a record can be confirmed."
            />
            <Callout tone={affected > 0 ? 'caution' : 'info'} icon={<Gauge size={16} />}>
              {affected > 0
                ? `${affected} record${affected === 1 ? '' : 's'} on this device currently ${affected === 1 ? 'has' : 'have'} at least one field below ${settings.confidenceThreshold}.`
                : `No records on this device fall below ${settings.confidenceThreshold} at the moment.`}
            </Callout>
          </Card>
        </Section>

        <Section title="Lift calculation">
          <Card className="space-y-4 p-4">
            <Slider
              label="Contingency"
              value={settings.contingencyPct}
              min={0}
              max={25}
              step={1}
              onChange={(v) => setSettings({ contingencyPct: v })}
              format={(v) => `${v} %`}
              hint="Added to cargo plus rigging weight to give the gross weight on the hook."
            />
            <Slider
              label="Capacity warning threshold"
              value={settings.utilisationWarnPct}
              min={60}
              max={100}
              step={5}
              onChange={(v) => setSettings({ utilisationWarnPct: v })}
              format={(v) => `${v} %`}
              hint="The utilisation bar turns red and flags for approval above this share of chart capacity."
            />
            <div className="flex items-start gap-2 rounded-lg border border-steel-800 bg-steel-850 px-3 py-2.5">
              <Percent size={15} className="mt-[1px] shrink-0 text-steel-400" />
              <p className="text-[12px] leading-relaxed text-steel-400">
                Terminal policy sets 10 % contingency and an 85 % working limit. Changes here apply to every lift
                calculation on this device immediately.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Capture">
          <Card className="px-4">
            <Toggle
              checked={settings.autoAdvanceCapture}
              onChange={(v) => setSettings({ autoAdvanceCapture: v })}
              label="Advance automatically after each frame"
              description="Moves straight to the next capture step once a frame passes the quality check."
            />
          </Card>
        </Section>

        <Section title="Notifications">
          <Card className="divide-y divide-steel-850 px-4">
            {(Object.keys(CATEGORY_LABEL) as NotificationCategory[]).map((cat) => (
              <NotificationToggle key={cat} cat={cat} />
            ))}
          </Card>
        </Section>

        <Section title="Demo controls">
          <Card className="divide-y divide-steel-850 px-4">
            <Toggle
              checked={settings.offlineMode}
              onChange={(v) => {
                setSettings({ offlineMode: v })
                toast({
                  tone: v ? 'warn' : 'success',
                  title: v ? 'Coverage lost' : 'Coverage restored',
                  body: v ? 'New captures will be held in the device queue.' : 'Open the sync queue to send held items.',
                })
              }}
              label="Simulate offline"
              description="Drops the terminal connection. Also available on the floating button."
              tone="red"
            />
            <Toggle
              checked={settings.forceUpdate}
              onChange={(v) => setSettings({ forceUpdate: v })}
              label="Force minimum-version gate"
              description="Shows the blocking update modal over the whole app."
              tone="red"
            />
            <div className="py-3">
              <Button variant="ghost" block size="sm" onClick={() => navigate('/sync')}>
                Open sync queue
              </Button>
            </div>
          </Card>
        </Section>

        <Callout tone="info" icon={<FlaskConical size={16} />} title="Prototype behaviour">
          Offline mode, the update gate and the inbound push are demo controls, not production features. In a native
          build, connectivity and the version gate come from the device and the app store.
        </Callout>

        <div className="grid grid-cols-2 gap-2 pb-2">
          <Button variant="secondary" size="sm" icon={<CloudOff size={14} />} onClick={() => setSettings({ offlineMode: !settings.offlineMode })}>
            {settings.offlineMode ? 'Go online' : 'Go offline'}
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => setSettings({ forceUpdate: true })}>
            Show update gate
          </Button>
        </div>
      </div>
    </Screen>
  )
}

function NotificationToggle({ cat }: { cat: NotificationCategory }) {
  const on = useApp((s) => s.settings.notifications[cat])
  const setPref = useApp((s) => s.setNotificationPref)
  return <Toggle checked={on} onChange={(v) => setPref(cat, v)} label={CATEGORY_LABEL[cat]} description={CATEGORY_DESCRIPTION[cat]} />
}

export function NotificationPreferences() {
  const prefs = useApp((s) => s.settings.notifications)
  const setPref = useApp((s) => s.setNotificationPref)
  const allOn = Object.values(prefs).every(Boolean)
  const [busy, setBusy] = useState(false)

  return (
    <Screen
      header={<ScreenHeader title="Notification preferences" back />}
      footer={
        <Button
          block
          variant="ghost"
          loading={busy}
          onClick={() => {
            setBusy(true)
            ;(Object.keys(prefs) as NotificationCategory[]).forEach((c) => setPref(c, !allOn))
            window.setTimeout(() => setBusy(false), 400)
          }}
        >
          {allOn ? 'Turn everything off' : 'Turn everything on'}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="px-1 text-[13px] leading-relaxed text-steel-400">
          Choose which categories reach this handset. Safety bulletins are recommended even on a busy shift.
        </p>
        <Card className="divide-y divide-steel-850 px-4">
          {(Object.keys(CATEGORY_LABEL) as NotificationCategory[]).map((cat) => (
            <NotificationToggle key={cat} cat={cat} />
          ))}
        </Card>
        {!prefs['safety-bulletin'] && (
          <Callout tone="caution" icon={<AlertTriangle size={16} />}>
            Safety bulletins are switched off. Withdrawal notices for rigging equipment will not reach this device.
          </Callout>
        )}
      </div>
    </Screen>
  )
}
