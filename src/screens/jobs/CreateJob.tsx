import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Select, TextArea, TextField } from '@/components/Form'
import { Screen, ScreenHeader } from '@/components/Screen'
import { BERTH_OPTIONS, CRANE_TYPE_OPTIONS } from '@/data/jobs'
import { useApp } from '@/store/useApp'
import type { CraneId } from '@/types'

const SHIFTS = ['Day shift 06:00–18:00', 'Back shift 14:00–22:00', 'Night shift 22:00–06:00']

export function CreateJob() {
  const navigate = useNavigate()
  const createJob = useApp((s) => s.createJob)
  const toast = useApp((s) => s.toast)

  const [title, setTitle] = useState('')
  const [vessel, setVessel] = useState('')
  const [berth, setBerth] = useState(BERTH_OPTIONS[1])
  const [cargoSummary, setCargoSummary] = useState('')
  const [craneId, setCraneId] = useState<CraneId>('crane-lhm-550')
  const [shift, setShift] = useState(SHIFTS[0])
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (title.trim().length < 4) next.title = 'Give the job a title the crane cab will recognise.'
    if (!vessel.trim()) next.vessel = 'Enter the vessel name, or "Yard operation".'
    if (cargoSummary.trim().length < 8) next.cargoSummary = 'Summarise what is being lifted.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    await new Promise((r) => setTimeout(r, 700))
    const job = createJob({ title: title.trim(), vessel: vessel.trim(), berth, cargoSummary: cargoSummary.trim(), craneId, shift })
    setBusy(false)
    toast({ tone: 'success', title: 'Job created', body: `${job.ref} is open and ready for captures.` })
    navigate(`/jobs/${job.id}`, { replace: true })
  }

  return (
    <Screen
      header={<ScreenHeader title="Create job" back />}
      footer={
        <Button block loading={busy} onClick={onSubmit as unknown as () => void}>
          Create job
        </Button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Job title"
          placeholder="MV Northern Trader — breakbulk discharge"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <TextField
          label="Vessel"
          placeholder="MV Northern Trader"
          value={vessel}
          onChange={(e) => setVessel(e.target.value)}
          error={errors.vessel}
          hint="Use “Yard operation — no vessel” for yard moves."
        />
        <Select label="Berth" value={berth} onChange={(e) => setBerth(e.target.value)}>
          {BERTH_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <TextArea
          label="Cargo summary"
          placeholder="Mixed breakbulk: steel plate packs, pipe bundles, palletised fittings"
          value={cargoSummary}
          onChange={(e) => setCargoSummary(e.target.value)}
          error={errors.cargoSummary}
        />
        <Select
          label="Crane"
          value={craneId}
          onChange={(e) => setCraneId(e.target.value as CraneId)}
          hint="Sets the load chart used for capacity checks on this job."
        >
          {CRANE_TYPE_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Shift" value={shift} onChange={(e) => setShift(e.target.value)}>
          {SHIFTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </form>
    </Screen>
  )
}
