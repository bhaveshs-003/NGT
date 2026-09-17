import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Anchor, Cable, CheckCircle2, FileText, Gauge, Lightbulb, Settings2 } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Callout, EmptyState, ProgressBar } from '@/components/Feedback'
import { SegmentedControl, Select, Slider, Toggle } from '@/components/Form'
import { Card, Screen, ScreenHeader, Section } from '@/components/Screen'
import { Sheet } from '@/components/Sheet'
import { SlingAngleDiagram } from '@/components/SlingDiagram'
import { CRANE_LOAD_CHARTS, capacityAt, crane, radiusRange } from '@/data/craneLoadCharts'
import { RIGGING_RULES, SLINGS, SHACKLES, SPREADERS, ruleForCargoType } from '@/data/riggingRegistry'
import { SLING_ANGLE_OPTIONS, angleAdvice, calculateLift, cogAssessment, defaultLiftPlan } from '@/lib/lifting'
import { kg, metres, pct, tonnes } from '@/lib/format'
import { useApp, useAssessment, useJob } from '@/store/useApp'
import type { CraneId, LiftPlan } from '@/types'

export function LiftingAssistance() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const a = useAssessment(assessmentId)
  const job = useJob(a?.jobId)
  const settings = useApp((s) => s.settings)
  const setLiftPlan = useApp((s) => s.setLiftPlan)
  const appendAudit = useApp((s) => s.appendAudit)
  const user = useApp((s) => s.authUser)
  const [rigSheet, setRigSheet] = useState(false)

  const rule = useMemo(() => (a ? ruleForCargoType(a.cargoTypeId) : RIGGING_RULES[0]), [a])

  // Build a default plan the first time this record reaches the lift screen.
  useEffect(() => {
    if (!a || a.liftPlan) return
    setLiftPlan(a.id, defaultLiftPlan(a, job?.craneId ?? 'crane-lhm-550', rule))
  }, [a, job, rule, setLiftPlan])

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="Lifting assistance" back />}>
        <EmptyState title="Record not found" body="This assessment is no longer on the device." actionLabel="Back" onAction={() => navigate('/jobs')} />
      </Screen>
    )
  }
  if (!a.liftPlan) return null

  const plan = a.liftPlan
  const calc = calculateLift(a, plan, settings)
  const cog = cogAssessment(a, plan)
  const advice = angleAdvice(plan.slingAngleDeg)
  const locked = a.status === 'verified'
  const c = crane(plan.craneId)
  const range = radiusRange(plan.craneId)

  function update(patch: Partial<LiftPlan>) {
    setLiftPlan(a!.id, { ...plan, ...patch })
  }

  const utilTone = calc.overCapacity ? 'red' : calc.nearCapacity ? 'red' : calc.utilisationPct > 60 ? 'amber' : 'green'

  return (
    <Screen
      header={<ScreenHeader title="Lifting assistance" subtitle={`${a.ref} · ${a.cargoType.value}`} back />}
      footer={
        <Button
          block
          icon={<FileText size={18} />}
          onClick={() => {
            appendAudit(a.id, {
              at: new Date().toISOString(),
              actorId: user?.id ?? 'usr-001',
              actorName: user?.name ?? 'Daniel Okafor',
              action: 'Lift plan completed',
              detail: `${calc.craneName}, ${calc.boomLabel} at ${metres(plan.radiusM, 0)}. Gross ${kg(calc.grossKg)}, utilisation ${pct(calc.utilisationPct, 0)}.`,
            })
            navigate(`/assessment/${a.id}/permit`)
          }}
        >
          Build lift summary
        </Button>
      }
    >
      <div className="space-y-4">
        {/* --- gross weight ------------------------------------------------ */}
        <Section title="Gross weight">
          <Card className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="field-label">Total on the hook</p>
                <p className="tabular mt-1 text-[28px] font-bold leading-none text-amber-500">{tonnes(calc.grossKg)}</p>
                <p className="tabular mt-1 text-[12px] text-steel-400">{kg(calc.grossKg)}</p>
              </div>
              <Badge tone={calc.overCapacity ? 'red' : 'green'}>
                {calc.overCapacity ? 'Over chart' : 'Within chart'}
              </Badge>
            </div>

            <dl className="mt-4 divide-y divide-steel-850 border-t border-steel-800 text-[13px]">
              <Row label="Cargo weight" value={kg(calc.cargoKg)} sub={`from ${a.weightKg.source === 'manual' ? 'manual entry' : a.weightKg.source.replace('-', ' ')}`} />
              <Row label="Rigging accessories" value={kg(calc.riggingKg, { decimals: 1 })} sub={`${calc.rigging.length} item groups`} />
              <Row label="Subtotal" value={kg(calc.subtotalKg, { decimals: 1 })} />
              <Row label={`Contingency at ${settings.contingencyPct} %`} value={kg(calc.contingencyKg)} sub="Set in Profile › Settings" />
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-[13px] font-bold text-steel-100">Gross weight</dt>
                <dd className="tabular text-[15px] font-bold text-amber-500">{kg(calc.grossKg)}</dd>
              </div>
            </dl>
          </Card>
        </Section>

        {/* --- rigging ----------------------------------------------------- */}
        <Section
          title="Rigging"
          action={
            !locked && (
              <button className="flex items-center gap-1 text-[12px] font-semibold text-amber-500" onClick={() => setRigSheet(true)}>
                <Settings2 size={13} /> Change
              </button>
            )
          }
        >
          <Card>
            <div className="flex items-start gap-2.5 border-b border-steel-850 px-3.5 py-3">
              <Lightbulb size={15} className="mt-[2px] shrink-0 text-amber-500" />
              <div>
                <p className="text-[12.5px] font-bold text-steel-200">Suggested for {a.cargoType.value.toLowerCase()}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-steel-400">{rule.rationale}</p>
              </div>
            </div>
            {calc.rigging.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-3 border-b border-steel-850 px-3.5 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-snug text-steel-100">
                    {item.qty} × {item.label}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-steel-400">{item.detail}</p>
                </div>
                <span className="tabular shrink-0 text-[12.5px] font-semibold text-steel-300">
                  {kg(item.totalKg, { decimals: 1 })}
                </span>
              </div>
            ))}
          </Card>
        </Section>

        {/* --- sling geometry --------------------------------------------- */}
        <Section title="Sling angle and centre of gravity">
          <Card className="p-3.5">
            <SlingAngleDiagram
              angleDeg={plan.slingAngleDeg}
              legs={plan.rigging.slingCount}
              cogOffsetMm={plan.cogOffsetMm}
              loadWidthMm={a.dimensions.length.value}
              legLoadKg={calc.legLoadKg}
              liftingPointsPresent={plan.liftingPointsPresent}
            />

            {!locked && (
              <div className="mt-3">
                <SegmentedControl
                  ariaLabel="Included sling angle"
                  value={String(plan.slingAngleDeg)}
                  onChange={(v) => update({ slingAngleDeg: Number(v) })}
                  options={SLING_ANGLE_OPTIONS.map((d) => ({ value: String(d), label: `${d}°` }))}
                />
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Angle factor" value={`× ${calc.angleFactor.toFixed(2)}`} />
              <Stat label="Load per leg" value={kg(calc.legLoadKg)} />
              <Stat label="Sling WLL" value={kg(calc.slingWllKg)} />
              <Stat
                label="Sling utilisation"
                value={pct(calc.slingUtilisationPct, 0)}
                tone={calc.slingAdequate ? 'ok' : 'bad'}
              />
            </div>

            <div className="mt-3 space-y-2">
              <Callout tone={advice.severity === 'critical' ? 'critical' : advice.severity === 'caution' ? 'caution' : 'info'}>
                {advice.text}
              </Callout>
              {!calc.slingAdequate && (
                <Callout tone="critical" title="Sling capacity exceeded" icon={<AlertTriangle size={16} />}>
                  Leg load of {kg(calc.legLoadKg)} is above the {kg(calc.slingWllKg)} WLL of the selected sling. Change
                  the sling, add legs or increase the angle.
                </Callout>
              )}
              <Callout tone={cog.severity === 'critical' ? 'critical' : cog.severity === 'caution' ? 'caution' : 'info'} title="Centre of gravity">
                {cog.text}
              </Callout>
            </div>
          </Card>
        </Section>

        {/* --- lifting points and flags ------------------------------------ */}
        <Section title="Load condition">
          <Card className="px-3.5">
            <div className="border-b border-steel-850 py-1">
              <Toggle
                checked={plan.liftingPointsPresent}
                disabled={locked}
                onChange={(v) => update({ liftingPointsPresent: v, liftingPointCount: v ? plan.rigging.slingCount : 0 })}
                label="Certified lifting points present"
                description={
                  plan.liftingPointsPresent
                    ? `${plan.liftingPointCount} marked and rated attachment points identified on the unit.`
                    : 'No rated points. The sling arrangement needs supervisor sign-off before the lift.'
                }
              />
            </div>

            {!plan.liftingPointsPresent && (
              <div className="py-3">
                <Callout tone="critical" title="No certified lifting points" icon={<Anchor size={16} />}>
                  Lift is by sling arrangement only. A trial lift at 150 mm is required to confirm trim before the load
                  leaves the deck.
                </Callout>
              </div>
            )}

            <div className="divide-y divide-steel-850 py-1">
              {a.flags.length === 0 ? (
                <p className="py-3 text-[12.5px] text-steel-400">
                  No irregular-load flags raised. Geometry is regular and the top surface is level.
                </p>
              ) : (
                a.flags.map((f) => (
                  <div key={f.id} className="flex items-start gap-2.5 py-3">
                    <AlertTriangle
                      size={15}
                      className={`mt-[2px] shrink-0 ${f.severity === 'critical' ? 'text-conf-low' : f.severity === 'caution' ? 'text-amber-500' : 'text-steel-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-steel-100">{f.label}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-steel-400">{f.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Section>

        {/* --- crane capacity --------------------------------------------- */}
        <Section title="Crane capacity check">
          <Card className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-snug text-steel-100">{c.name}</p>
                <p className="mt-0.5 text-[12px] text-steel-400">{c.model}</p>
              </div>
              <Gauge size={20} className={calc.nearCapacity ? 'text-conf-low' : 'text-steel-500'} />
            </div>

            {!locked && (
              <div className="mt-3 space-y-3">
                <Select label="Crane" value={plan.craneId} onChange={(e) => {
                  const id = e.target.value as CraneId
                  const next = crane(id)
                  update({ craneId: id, boomConfigId: next.boomConfigs[0].id, radiusM: next.chart[Math.floor(next.chart.length / 3)].radiusM })
                }}>
                  {CRANE_LOAD_CHARTS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} — {x.type}
                    </option>
                  ))}
                </Select>
                <Select label="Boom configuration" value={plan.boomConfigId} onChange={(e) => update({ boomConfigId: e.target.value })}>
                  {c.boomConfigs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </Select>
                <Slider
                  label="Working radius"
                  value={plan.radiusM}
                  min={range.min}
                  max={range.max}
                  step={1}
                  onChange={(v) => update({ radiusM: v })}
                  format={(v) => metres(v, 0)}
                  hint={`Chart capacity at this radius: ${kg(capacityAt(plan.craneId, plan.boomConfigId, plan.radiusM))}`}
                />
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="field-label">Capacity utilisation</span>
                <span
                  className={`tabular text-[17px] font-bold ${calc.nearCapacity ? 'text-conf-low' : calc.utilisationPct > 60 ? 'text-amber-500' : 'text-conf-high'}`}
                >
                  {pct(calc.utilisationPct, 0)}
                </span>
              </div>
              <ProgressBar value={Math.min(100, calc.utilisationPct)} tone={utilTone} height="h-3" striped={calc.overCapacity} />
              <div className="mt-1.5 flex justify-between text-[11px] text-steel-500">
                <span className="tabular">{kg(calc.grossKg)} on the hook</span>
                <span className="tabular">{kg(calc.capacityKg)} at {metres(plan.radiusM, 0)}</span>
              </div>
            </div>

            <div className="mt-3">
              {calc.overCapacity ? (
                <Callout tone="critical" title="Over chart capacity" icon={<AlertTriangle size={16} />}>
                  The gross weight exceeds the chart at this radius. Reduce the radius, change the boom configuration or
                  select a larger machine before proceeding.
                </Callout>
              ) : calc.nearCapacity ? (
                <Callout tone="critical" title={`Above ${settings.utilisationWarnPct} % of chart`} icon={<AlertTriangle size={16} />}>
                  This lift is inside the chart but above the terminal's {settings.utilisationWarnPct} % working limit.
                  It needs superintendent approval and a documented lift plan.
                </Callout>
              ) : (
                <Callout tone="success" title="Within working limits" icon={<CheckCircle2 size={16} />}>
                  Gross weight is {pct(calc.utilisationPct, 0)} of chart capacity at {metres(plan.radiusM, 0)} radius,
                  inside the {settings.utilisationWarnPct} % working limit.
                </Callout>
              )}
            </div>
          </Card>
        </Section>
      </div>

      <RiggingSheet open={rigSheet} onClose={() => setRigSheet(false)} plan={plan} onChange={update} />
    </Screen>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="min-w-0">
        <span className="text-steel-300">{label}</span>
        {sub && <span className="mt-0.5 block text-[11px] text-steel-500">{sub}</span>}
      </dt>
      <dd className="tabular shrink-0 font-semibold text-steel-100">{value}</dd>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="rounded-lg border border-steel-800 bg-steel-850 px-2.5 py-2">
      <p className="field-label">{label}</p>
      <p
        className={`tabular mt-0.5 text-[14px] font-bold ${tone === 'bad' ? 'text-conf-low' : tone === 'ok' ? 'text-conf-high' : 'text-steel-100'}`}
      >
        {value}
      </p>
    </div>
  )
}

function RiggingSheet({
  open,
  onClose,
  plan,
  onChange,
}: {
  open: boolean
  onClose: () => void
  plan: LiftPlan
  onChange: (p: Partial<LiftPlan>) => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Rigging selection"
      subtitle="Registry items available in the terminal store"
      footer={
        <Button block onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        <Select
          label="Sling"
          value={plan.rigging.slingId}
          onChange={(e) => onChange({ rigging: { ...plan.rigging, slingId: e.target.value } })}
        >
          {SLINGS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.type} — WLL {s.wllKg.toLocaleString('en-GB')} kg, {s.lengthM} m
            </option>
          ))}
        </Select>
        <Select
          label="Number of legs"
          value={String(plan.rigging.slingCount)}
          onChange={(e) => onChange({ rigging: { ...plan.rigging, slingCount: Number(e.target.value) } })}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} leg{n === 1 ? '' : 's'}
            </option>
          ))}
        </Select>
        <Select
          label="Shackle"
          value={plan.rigging.shackleId}
          onChange={(e) => onChange({ rigging: { ...plan.rigging, shackleId: e.target.value } })}
        >
          {SHACKLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.type} — SWL {s.swlKg.toLocaleString('en-GB')} kg
            </option>
          ))}
        </Select>
        <Select
          label="Shackle count"
          value={String(plan.rigging.shackleCount)}
          onChange={(e) => onChange({ rigging: { ...plan.rigging, shackleCount: Number(e.target.value) } })}
        >
          {[1, 2, 4, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        <Select
          label="Spreader or lifting beam"
          value={plan.rigging.spreaderId ?? ''}
          onChange={(e) => onChange({ rigging: { ...plan.rigging, spreaderId: e.target.value || undefined } })}
          hint="Beam weight is added to the gross weight on the hook."
        >
          <option value="">None</option>
          {SPREADERS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.capacityKg.toLocaleString('en-GB')} kg
            </option>
          ))}
        </Select>

        <Callout tone="caution" icon={<Cable size={16} />}>
          Every item must be in date for inspection and tagged before use. Check the tag against the registry entry at
          the store.
        </Callout>
      </div>
    </Sheet>
  )
}
